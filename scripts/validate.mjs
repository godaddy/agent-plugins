import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginsRoot = resolve(root, "plugins");
const marketplacePath = resolve(root, ".agents", "plugins", "marketplace.json");
const errors = [];
let pluginCount = 0;
let skillCount = 0;

function fail(message) {
  errors.push(message);
}

function contained(parent, child) {
  const path = relative(parent, child);
  return path === "" || (!path.startsWith(`..${sep}`) && path !== "..");
}

async function json(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    fail(`${relative(root, path)} is not valid JSON: ${error.message}`);
    return null;
  }
}

async function assertNoSymlinks(path, packageRoot) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = resolve(path, entry.name);
    const stat = await lstat(child);
    if (stat.isSymbolicLink()) {
      fail(`${relative(root, child)} is a symlink; portable package paths must be regular files or directories.`);
      const target = await realpath(child).catch(() => null);
      if (target && !contained(packageRoot, target)) fail(`${relative(root, child)} escapes its package root.`);
      continue;
    }
    if (entry.isDirectory()) await assertNoSymlinks(child, packageRoot);
  }
}

async function assertMarkdownLinks(path, packageRoot) {
  const source = await readFile(path, "utf8");
  const links = source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g);
  for (const [, raw] of links) {
    const href = raw.trim().replace(/^<|>$/g, "").split("#", 1)[0];
    if (!href || /^(https?:|mailto:)/.test(href)) continue;
    const target = resolve(dirname(path), decodeURIComponent(href));
    if (!contained(packageRoot, target)) {
      fail(`${relative(root, path)} links outside its plugin package: ${raw}`);
    } else if (!existsSync(target)) {
      fail(`${relative(root, path)} has a missing relative link: ${raw}`);
    }
  }
}

async function validateSkill(skillRoot, expectedName, packageRoot) {
  const skillFile = resolve(skillRoot, "SKILL.md");
  const stat = await lstat(skillFile).catch(() => null);
  if (!stat?.isFile()) return fail(`${relative(root, skillFile)} must be a regular file.`);
  const source = await readFile(skillFile, "utf8");
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) return fail(`${relative(root, skillFile)} has no YAML frontmatter.`);
  const keys = [...frontmatter[1].matchAll(/^([a-zA-Z0-9_-]+):/gm)].map((match) => match[1]);
  if (keys.length !== 2 || !keys.includes("name") || !keys.includes("description")) {
    fail(`${relative(root, skillFile)} frontmatter must contain only name and description.`);
  }
  const name = frontmatter[1].match(/^name:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1]?.trim();
  if (name !== expectedName) fail(`${relative(root, skillFile)} name must match its directory (${expectedName}).`);
  if (!/^description:\s*.+$/m.test(frontmatter[1])) fail(`${relative(root, skillFile)} needs a description.`);

  const openai = resolve(skillRoot, "agents", "openai.yaml");
  if (existsSync(openai)) {
    const ui = await readFile(openai, "utf8");
    if (!ui.includes(`$${expectedName}`)) fail(`${relative(root, openai)} default prompt must mention $${expectedName}.`);
  }

  const markdown = [];
  async function collect(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const child = resolve(path, entry.name);
      if (entry.isDirectory()) await collect(child);
      else if (entry.isFile() && entry.name.endsWith(".md")) markdown.push(child);
    }
  }
  await collect(skillRoot);
  await Promise.all(markdown.map((path) => assertMarkdownLinks(path, packageRoot)));
  skillCount += 1;
}

async function validatePlugin(packageRoot, directoryName) {
  pluginCount += 1;
  await assertNoSymlinks(packageRoot, packageRoot);
  const manifest = await json(resolve(packageRoot, "plugin.json"));
  const mcp = await json(resolve(packageRoot, "mcp.json"));
  const codexManifest = await json(resolve(packageRoot, ".codex-plugin", "plugin.json"));
  const codexMcp = await json(resolve(packageRoot, ".mcp.json"));
  if (!manifest || !mcp || !codexManifest || !codexMcp) return;

  const expectedPluginSchema = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
  const expectedMcpSchema = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json";
  if (manifest.$schema !== expectedPluginSchema) fail(`${directoryName}/plugin.json uses a non-canonical schema.`);
  if (mcp.$schema !== expectedMcpSchema) fail(`${directoryName}/mcp.json uses a non-canonical schema.`);
  if (manifest.name !== directoryName) fail(`${directoryName}/plugin.json name must match the package directory.`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.name ?? "")) fail(`${directoryName} has an invalid plugin name.`);
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version ?? "")) fail(`${directoryName} has an invalid semantic version.`);
  if (!manifest.description || !manifest.author?.name) fail(`${directoryName}/plugin.json needs description and author.name.`);

  if (codexManifest.name !== directoryName) fail(`${directoryName}/.codex-plugin/plugin.json name must match the package directory.`);
  const portableBaseVersion = manifest.version?.split("+", 1)[0];
  const codexBaseVersion = codexManifest.version?.split("+", 1)[0];
  if (codexBaseVersion !== portableBaseVersion) {
    fail(`${directoryName} portable and Codex manifest base versions must match.`);
  }
  if (!codexManifest.description || !codexManifest.author?.name) {
    fail(`${directoryName}/.codex-plugin/plugin.json needs description and author.name.`);
  }
  if (codexManifest.skills !== "./skills/") fail(`${directoryName} Codex manifest must declare ./skills/.`);
  if (codexManifest.mcpServers !== "./.mcp.json") fail(`${directoryName} Codex manifest must declare ./.mcp.json.`);

  const requiredInterfaceFields = [
    "displayName",
    "shortDescription",
    "longDescription",
    "developerName",
    "category",
    "capabilities",
  ];
  for (const field of requiredInterfaceFields) {
    if (!codexManifest.interface?.[field] || (Array.isArray(codexManifest.interface[field]) && codexManifest.interface[field].length === 0)) {
      fail(`${directoryName} Codex manifest interface.${field} is required.`);
    }
  }
  const defaultPrompts = codexManifest.interface?.defaultPrompt ?? [];
  if (defaultPrompts.length > 3) fail(`${directoryName} Codex manifest may contain at most three default prompts.`);
  for (const prompt of defaultPrompts) {
    if (typeof prompt !== "string" || prompt.length > 128) {
      fail(`${directoryName} Codex default prompts must be strings no longer than 128 characters.`);
    }
  }
  if (/\[TODO:/i.test(JSON.stringify(codexManifest))) fail(`${directoryName} Codex manifest contains a TODO placeholder.`);

  for (const [name, server] of Object.entries(mcp.mcpServers ?? {})) {
    if (server?.type !== "streamable-http") fail(`${directoryName} MCP server ${name} must use streamable-http.`);
    try {
      const url = new URL(server?.url);
      if (url.protocol !== "https:" && !["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
        fail(`${directoryName} MCP server ${name} must use HTTPS outside loopback.`);
      }
    } catch {
      fail(`${directoryName} MCP server ${name} has an invalid URL.`);
    }
    const serialized = JSON.stringify(server);
    if (/authorization|bearer|client.?secret|access.?token|password/i.test(serialized)) {
      fail(`${directoryName} MCP server ${name} appears to contain credential configuration.`);
    }
  }

  const codexServers = Object.entries(codexMcp.mcpServers ?? {});
  if (codexServers.length !== 1 || codexServers[0]?.[0] !== "commerce") {
    fail(`${directoryName}/.mcp.json must declare only the commerce MCP server.`);
  }
  for (const [name, server] of codexServers) {
    if (server?.type !== "http") fail(`${directoryName} Codex MCP server ${name} must use http.`);
    try {
      const url = new URL(server?.url);
      if (url.protocol !== "https:" && !["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
        fail(`${directoryName} Codex MCP server ${name} must use HTTPS outside loopback.`);
      }
    } catch {
      fail(`${directoryName} Codex MCP server ${name} has an invalid URL.`);
    }
    if (server?.url !== mcp.mcpServers?.[name]?.url) {
      fail(`${directoryName} portable and Codex MCP URLs must match for ${name}.`);
    }
    if (server?.oauth_resource !== server?.url) {
      fail(`${directoryName} Codex MCP oauth_resource must match its MCP URL.`);
    }
    if (server?.oauth?.client_id !== "39489dee-4103-4284-9aab-9f2452142bce") {
      fail(`${directoryName} Codex MCP server ${name} must use the registered public OAuth client.`);
    }
    if (server?.oauth && Object.keys(server.oauth).some((field) => field !== "client_id")) {
      fail(`${directoryName} Codex MCP server ${name} may configure only oauth.client_id.`);
    }
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
    if (JSON.stringify(server?.scopes) !== JSON.stringify(expectedScopes)) {
      fail(`${directoryName} Codex MCP server ${name} must use the provisioned read-only OAuth scopes.`);
    }
    if (/authorization|bearer|client.?secret|access.?token|password/i.test(JSON.stringify(server))) {
      fail(`${directoryName} Codex MCP server ${name} appears to contain credential configuration.`);
    }
  }

  const skillsRoot = resolve(packageRoot, "skills");
  const skillEntries = await readdir(skillsRoot, { withFileTypes: true }).catch(() => []);
  if (skillEntries.length === 0) fail(`${directoryName} must contain at least one skill.`);
  for (const entry of skillEntries) {
    if (!entry.isDirectory()) {
      fail(`${relative(root, resolve(skillsRoot, entry.name))} must be a skill directory.`);
      continue;
    }
    await validateSkill(resolve(skillsRoot, entry.name), entry.name, packageRoot);
  }

  const markdown = (await readdir(packageRoot, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => resolve(packageRoot, entry.name));
  await Promise.all(markdown.map((path) => assertMarkdownLinks(path, packageRoot)));
}

async function validateMarketplace() {
  const marketplace = await json(marketplacePath);
  if (!marketplace) return;
  if (marketplace.name !== "godaddy") fail("Marketplace name must be godaddy.");
  if (!marketplace.interface?.displayName) fail("Marketplace interface.displayName is required.");
  const entries = marketplace.plugins ?? [];
  if (entries.length !== 1 || entries[0]?.name !== "commerce") {
    fail("The marketplace must contain only the commerce plugin.");
    return;
  }
  const entry = entries[0];
  if (entry.source?.source !== "local" || entry.source?.path !== "./plugins/commerce") {
    fail("The commerce marketplace entry must point to ./plugins/commerce.");
  }
  if (entry.policy?.installation !== "AVAILABLE") fail("The commerce plugin installation policy must be AVAILABLE.");
  if (entry.policy?.authentication !== "ON_INSTALL") fail("The commerce plugin authentication policy must be ON_INSTALL.");
  if (!entry.category) fail("The commerce marketplace entry needs a category.");
}

const entries = await readdir(pluginsRoot, { withFileTypes: true }).catch(() => []);
const pluginEntries = entries.filter((entry) => entry.isDirectory());
if (pluginEntries.length !== 1 || pluginEntries[0]?.name !== "commerce") {
  fail("The repository must contain exactly one plugin directory: plugins/commerce.");
}
for (const entry of pluginEntries) {
  if (entry.isDirectory()) await validatePlugin(resolve(pluginsRoot, entry.name), entry.name);
}
if (pluginCount === 0) fail("No plugins found.");
await validateMarketplace();

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${pluginCount} plugin and ${skillCount} skills.`);
}
