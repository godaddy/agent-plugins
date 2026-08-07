import { existsSync } from "node:fs";
import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginName = "godaddy";
const marketplaceName = "godaddy-ai-toolkit";
const repositoryUrl = "https://github.com/godaddy/commerce-agent-plugin";
const repositoryGitUrl = `${repositoryUrl}.git`;
const commerceMcpUrl = "https://mcp.commerce.api.godaddy.com/mcp";
const domainsMcpUrl = "https://api.godaddy.com/v1/domains/mcp";
const oauthClientId = "39489dee-4103-4284-9aab-9f2452142bce";
const requiredSkills = new Set(["domains", "gddy", "hosting", "payments", "storefront"]);
const expectedScopes = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "commerce.product:read",
  "commerce.store:read",
  "commerce.channel:read",
  "commerce.order:read",
  "commerce.onboarding-application:read",
  "apps.app-registry:read",
];
const ignoredDirectories = new Set([".git", "node_modules", "dist"]);
const errors = [];
let skillCount = 0;

function fail(message) {
  errors.push(message);
}

function pathLabel(path) {
  return relative(root, path) || ".";
}

function contained(parent, child) {
  const path = relative(parent, child);
  return path === "" || (!path.startsWith(`..${sep}`) && path !== "..");
}

function baseVersion(version) {
  return typeof version === "string" ? version.split("+", 1)[0] : undefined;
}

async function json(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    fail(`${pathLabel(path)} is not valid JSON: ${error.message}`);
    return null;
  }
}

async function assertRegularFile(path) {
  const stat = await lstat(path).catch(() => null);
  if (!stat?.isFile()) fail(`${pathLabel(path)} must be a regular file.`);
}

async function assertNoSymlinks(path, packageRoot) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = resolve(path, entry.name);
    const stat = await lstat(child);
    if (stat.isSymbolicLink()) {
      fail(`${pathLabel(child)} is a symlink; plugin content must be regular files or directories.`);
      const target = await realpath(child).catch(() => null);
      if (target && !contained(packageRoot, target)) fail(`${pathLabel(child)} escapes the plugin root.`);
      continue;
    }
    if (entry.isDirectory()) await assertNoSymlinks(child, packageRoot);
  }
}

async function assertMarkdownLinks(path) {
  const source = await readFile(path, "utf8");
  for (const [, raw] of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const href = raw.trim().replace(/^<|>$/g, "").split("#", 1)[0];
    if (!href || /^(https?:|mailto:)/.test(href)) continue;
    let target;
    try {
      target = resolve(dirname(path), decodeURIComponent(href));
    } catch {
      fail(`${pathLabel(path)} contains an invalid relative link: ${raw}`);
      continue;
    }
    if (!contained(root, target)) fail(`${pathLabel(path)} links outside the plugin root: ${raw}`);
    else if (!existsSync(target)) fail(`${pathLabel(path)} has a missing relative link: ${raw}`);
  }
}

async function collectFiles(path, predicate, output = []) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) await collectFiles(child, predicate, output);
    else if (entry.isFile() && predicate(child, entry.name)) output.push(child);
  }
  return output;
}

async function validateSkill(skillRoot, expectedName) {
  const skillFile = resolve(skillRoot, "SKILL.md");
  await assertRegularFile(skillFile);
  const source = await readFile(skillFile, "utf8").catch(() => "");
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) {
    fail(`${pathLabel(skillFile)} has no YAML frontmatter.`);
    return;
  }
  const keys = [...frontmatter[1].matchAll(/^([a-zA-Z0-9_-]+):/gm)].map((match) => match[1]);
  if (keys.length !== 2 || !keys.includes("name") || !keys.includes("description")) {
    fail(`${pathLabel(skillFile)} frontmatter must contain only name and description.`);
  }
  const name = frontmatter[1].match(/^name:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1]?.trim();
  if (name !== expectedName) fail(`${pathLabel(skillFile)} name must match its directory (${expectedName}).`);
  if (!/^description:\s*.+$/m.test(frontmatter[1])) fail(`${pathLabel(skillFile)} needs a description.`);

  const openai = resolve(skillRoot, "agents", "openai.yaml");
  await assertRegularFile(openai);
  const ui = await readFile(openai, "utf8").catch(() => "");
  if (!ui.includes(`$${expectedName}`)) fail(`${pathLabel(openai)} default prompt must mention $${expectedName}.`);

  const markdown = await collectFiles(skillRoot, (_, name) => name.endsWith(".md"));
  await Promise.all(markdown.map(assertMarkdownLinks));
  skillCount += 1;
}

function validateManifestIdentity(manifest, label, expectedBaseVersion) {
  if (!manifest) return;
  if (manifest.name !== pluginName) fail(`${label} name must be ${pluginName}.`);
  if (baseVersion(manifest.version) !== expectedBaseVersion) {
    fail(`${label} base version must be ${expectedBaseVersion}.`);
  }
  if (!manifest.description || manifest.author?.name !== "GoDaddy") {
    fail(`${label} needs a description and GoDaddy author.`);
  }
}

async function validateManifests() {
  const portable = await json(resolve(root, "plugin.json"));
  if (!portable) return null;
  const expectedPluginSchema = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
  if (portable.$schema !== expectedPluginSchema) fail("plugin.json uses a non-canonical schema.");
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(portable.version ?? "")) {
    fail("plugin.json has an invalid semantic version.");
  }
  validateManifestIdentity(portable, "plugin.json", portable.version);
  if (portable.homepage !== repositoryUrl || portable.repository !== repositoryUrl) {
    fail("plugin.json must point to the repository root.");
  }

  const manifestPaths = [
    [".codex-plugin/plugin.json", true],
    [".claude-plugin/plugin.json", false],
    [".cursor-plugin/plugin.json", false],
  ];
  for (const [relativePath, isCodex] of manifestPaths) {
    const manifest = await json(resolve(root, relativePath));
    validateManifestIdentity(manifest, relativePath, portable.version);
    if (!manifest) continue;
    if (manifest.homepage !== repositoryUrl || manifest.repository !== repositoryUrl) {
      fail(`${relativePath} must point to the repository root.`);
    }
    if (!isCodex) continue;
    if (manifest.skills !== "./skills/") fail("The Codex manifest must declare ./skills/.");
    if (manifest.mcpServers !== "./.mcp.json") fail("The Codex manifest must declare ./.mcp.json.");
    const requiredInterfaceFields = [
      "displayName",
      "shortDescription",
      "longDescription",
      "developerName",
      "category",
      "capabilities",
    ];
    for (const field of requiredInterfaceFields) {
      const value = manifest.interface?.[field];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        fail(`The Codex manifest interface.${field} is required.`);
      }
    }
    const prompts = manifest.interface?.defaultPrompt ?? [];
    if (prompts.length > 3) fail("The Codex manifest may contain at most three default prompts.");
    if (prompts.some((prompt) => typeof prompt !== "string" || prompt.length > 128)) {
      fail("Codex default prompts must be strings no longer than 128 characters.");
    }
    if (/\[TODO:/i.test(JSON.stringify(manifest))) fail("The Codex manifest contains a TODO placeholder.");
  }

  const gemini = await json(resolve(root, "gemini-extension.json"));
  if (gemini?.name !== pluginName || baseVersion(gemini?.version) !== portable.version) {
    fail("gemini-extension.json must use the shared plugin name and base version.");
  }
  const packageManifest = await json(resolve(root, "package.json"));
  if (packageManifest?.name !== "@godaddy/ai-toolkit" || packageManifest?.version !== portable.version) {
    fail("package.json must use the GoDaddy toolkit package name and shared base version.");
  }
  if (JSON.stringify(packageManifest?.pi?.skills) !== JSON.stringify(["./skills"])) {
    fail("package.json must expose the root skills directory to Pi.");
  }
  return portable;
}

function assertNoCredentialMaterial(server, label) {
  if (/authorization|bearer|client.?secret|access.?token|password/i.test(JSON.stringify(server))) {
    fail(`${label} appears to contain credential configuration.`);
  }
}

async function validateMcp() {
  const portable = await json(resolve(root, "mcp.json"));
  const codex = await json(resolve(root, ".mcp.json"));
  if (!portable || !codex) return;
  const expectedMcpSchema = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json";
  if (portable.$schema !== expectedMcpSchema) fail("mcp.json uses a non-canonical schema.");

  const expectedServerNames = ["godaddy-commerce", "godaddy-domains"];
  const portableServerNames = Object.keys(portable.mcpServers ?? {}).sort();
  if (JSON.stringify(portableServerNames) !== JSON.stringify(expectedServerNames)) {
    fail("mcp.json must declare the godaddy-commerce and godaddy-domains MCP servers.");
  }
  const portableCommerceServer = portable.mcpServers?.["godaddy-commerce"];
  if (
    portableCommerceServer?.type !== "streamable-http"
    || portableCommerceServer?.url !== commerceMcpUrl
  ) {
    fail("mcp.json must use the production Commerce Streamable HTTP endpoint.");
  }
  assertNoCredentialMaterial(portableCommerceServer, "mcp.json godaddy-commerce server");
  const portableDomainsServer = portable.mcpServers?.["godaddy-domains"];
  if (
    portableDomainsServer?.type !== "streamable-http"
    || portableDomainsServer?.url !== domainsMcpUrl
  ) {
    fail("mcp.json must use the public Domains Streamable HTTP endpoint.");
  }
  if (
    JSON.stringify(Object.keys(portableDomainsServer ?? {}).sort())
    !== JSON.stringify(["type", "url"])
  ) {
    fail("The portable godaddy-domains MCP server may configure only type and url.");
  }
  assertNoCredentialMaterial(portableDomainsServer, "mcp.json godaddy-domains server");

  const codexServerNames = Object.keys(codex.mcpServers ?? {}).sort();
  if (JSON.stringify(codexServerNames) !== JSON.stringify(expectedServerNames)) {
    fail(".mcp.json must declare the godaddy-commerce and godaddy-domains MCP servers.");
  }
  const commerceServer = codex.mcpServers?.["godaddy-commerce"];
  if (commerceServer?.type !== "http" || commerceServer?.url !== commerceMcpUrl) {
    fail(".mcp.json must use the production Commerce HTTP endpoint.");
  }
  if (commerceServer?.oauth_resource !== commerceMcpUrl) {
    fail("Commerce oauth_resource must match its MCP URL.");
  }
  if (commerceServer?.oauth?.client_id !== oauthClientId) {
    fail("Commerce must use the registered public OAuth client.");
  }
  if (
    commerceServer?.oauth
    && Object.keys(commerceServer.oauth).some((field) => field !== "client_id")
  ) {
    fail("Commerce may configure only oauth.client_id.");
  }
  if (JSON.stringify(commerceServer?.scopes) !== JSON.stringify(expectedScopes)) {
    fail("Commerce must use the provisioned read-only OAuth scopes.");
  }
  assertNoCredentialMaterial(commerceServer, ".mcp.json godaddy-commerce server");
  const domainsServer = codex.mcpServers?.["godaddy-domains"];
  if (domainsServer?.type !== "http" || domainsServer?.url !== domainsMcpUrl) {
    fail(".mcp.json must use the public Domains HTTP endpoint.");
  }
  if (
    JSON.stringify(Object.keys(domainsServer ?? {}).sort())
    !== JSON.stringify(["type", "url"])
  ) {
    fail("The Codex godaddy-domains MCP server may configure only type and url.");
  }
  assertNoCredentialMaterial(domainsServer, ".mcp.json godaddy-domains server");
}

async function validateSkills() {
  const skillsRoot = resolve(root, "skills");
  await assertNoSymlinks(skillsRoot, root);
  const entries = await readdir(skillsRoot, { withFileTypes: true }).catch(() => []);
  const names = new Set();
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      fail(`${pathLabel(resolve(skillsRoot, entry.name))} must be a skill directory.`);
      continue;
    }
    names.add(entry.name);
    await validateSkill(resolve(skillsRoot, entry.name), entry.name);
  }
  for (const required of requiredSkills) {
    if (!names.has(required)) fail(`The root plugin must include the ${required} skill.`);
  }
}

async function validateMarketplace(path, host) {
  const marketplace = await json(path);
  if (!marketplace) return;
  if (marketplace.name !== marketplaceName) fail(`${pathLabel(path)} name must be ${marketplaceName}.`);
  const entries = marketplace.plugins ?? [];
  if (entries.length !== 1 || entries[0]?.name !== pluginName) {
    fail(`${pathLabel(path)} must contain only the ${pluginName} root plugin.`);
    return;
  }
  const entry = entries[0];
  if (host === "codex") {
    if (!marketplace.interface?.displayName) fail("The Codex marketplace needs interface.displayName.");
    if (entry.source?.source !== "url" || entry.source?.url !== repositoryGitUrl) {
      fail("The Codex marketplace must install the repository URL as the root plugin.");
    }
    if (entry.policy?.installation !== "AVAILABLE") fail("The GoDaddy installation policy must be AVAILABLE.");
    if (entry.policy?.authentication !== "ON_INSTALL") fail("The GoDaddy authentication policy must be ON_INSTALL.");
    if (!entry.category) fail("The GoDaddy marketplace entry needs a category.");
  } else {
    if (marketplace.owner?.name !== "GoDaddy") fail(`${pathLabel(path)} must identify GoDaddy as owner.`);
    if (entry.source !== "./") fail(`${pathLabel(path)} must point to the repository root.`);
    if (entry.version !== "0.1.0") fail(`${pathLabel(path)} must use the shared base version.`);
  }
}

async function validateInstallationDocs() {
  const readme = await readFile(resolve(root, "README.md"), "utf8");
  const commands = [
    `codex plugin marketplace add ${repositoryGitUrl}`,
    `codex plugin add ${pluginName}@${marketplaceName}`,
    "codex mcp login godaddy-commerce",
  ];
  for (const command of commands) {
    if (!readme.includes(command)) fail(`README.md must document: ${command}`);
  }
  const legacyNestedPath = ["plugins", "commerce"].join("/");
  if (readme.includes(legacyNestedPath)) fail("README.md must treat the repository root as the plugin root.");
}

async function validatePublicProductionBoundary() {
  const forbiddenFragments = [
    { label: "a private or pre-release GoDaddy hostname", value: ["dev", "godaddy"].join("-") },
    { label: "a private or pre-release GoDaddy hostname", value: ["test", "godaddy"].join("-") },
    { label: "a private or pre-release GoDaddy hostname", value: ["ote", "godaddy"].join("-") },
    { label: "an internal corporate identifier", value: ["gd", "corp"].join("") },
    { label: "an internal GoDaddy hostname", value: [".int", "godaddy.com"].join(".") },
    { label: "a configurable API origin", value: ["api", "Base", "Url"].join("") },
    { label: "a configurable API origin", value: ["API", "BASE", "URL"].join("_") },
    { label: "a configurable API origin", value: ["base", "url"].join(" ") },
    { label: "an MCP endpoint override", value: ["COMMERCE", "MCP", "URL"].join("_") },
    { label: "a local Commerce MCP endpoint", value: ["localhost", "5001/mcp"].join(":") },
    { label: "pre-release provider guidance", value: ["provider", "sandbox"].join(" ") },
    { label: "pre-release guidance", value: ["non", "production"].join("-") },
  ];
  const allowedGoDaddyHosts = new Set([
    "godaddy.com",
    "www.godaddy.com",
    "api.godaddy.com",
    "developer.godaddy.com",
    "oauth.api.godaddy.com",
    "checkout.commerce.api.godaddy.com",
    "mcp.commerce.api.godaddy.com",
  ]);
  const files = await collectFiles(root, () => true);
  for (const file of files) {
    const source = await readFile(file, "utf8").catch(() => "");
    const normalized = source.toLowerCase();
    for (const match of source.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
      const hostname = match[1].toLowerCase();
      const isGoDaddyHost = hostname === "godaddy.com"
        || hostname.endsWith(".godaddy.com")
        || hostname.endsWith("-godaddy.com");
      if (isGoDaddyHost && !allowedGoDaddyHosts.has(hostname)) {
        fail(`${pathLabel(file)} exposes a non-public GoDaddy URL.`);
      }
    }
    for (const rule of forbiddenFragments) {
      if (normalized.includes(rule.value.toLowerCase())) fail(`${pathLabel(file)} exposes ${rule.label}.`);
    }
  }
}

if (existsSync(resolve(root, "plugins"))) {
  fail("Do not nest product plugins; the repository root is the single GoDaddy plugin.");
}
for (const path of [
  "plugin.json",
  "mcp.json",
  ".mcp.json",
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".cursor-plugin/plugin.json",
  "gemini-extension.json",
]) {
  await assertRegularFile(resolve(root, path));
}

await validateManifests();
await validateMcp();
await validateSkills();
await Promise.all([
  validateMarketplace(resolve(root, ".agents", "plugins", "marketplace.json"), "codex"),
  validateMarketplace(resolve(root, ".claude-plugin", "marketplace.json"), "claude"),
  validateMarketplace(resolve(root, ".cursor-plugin", "marketplace.json"), "cursor"),
]);
await validateInstallationDocs();

const markdown = await collectFiles(root, (_, name) => name.endsWith(".md"));
await Promise.all(markdown.map(assertMarkdownLinks));
await validatePublicProductionBoundary();

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated the ${pluginName} root plugin and ${skillCount} skills.`);
}
