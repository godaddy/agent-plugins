import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginsRoot = resolve(root, "plugins");
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
  if (!manifest || !mcp) return;

  const expectedPluginSchema = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
  const expectedMcpSchema = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json";
  if (manifest.$schema !== expectedPluginSchema) fail(`${directoryName}/plugin.json uses a non-canonical schema.`);
  if (mcp.$schema !== expectedMcpSchema) fail(`${directoryName}/mcp.json uses a non-canonical schema.`);
  if (manifest.name !== directoryName) fail(`${directoryName}/plugin.json name must match the package directory.`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.name ?? "")) fail(`${directoryName} has an invalid plugin name.`);
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version ?? "")) fail(`${directoryName} has an invalid semantic version.`);
  if (!manifest.description || !manifest.author?.name) fail(`${directoryName}/plugin.json needs description and author.name.`);

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

const entries = await readdir(pluginsRoot, { withFileTypes: true }).catch(() => []);
for (const entry of entries) {
  if (entry.isDirectory()) await validatePlugin(resolve(pluginsRoot, entry.name), entry.name);
}
if (pluginCount === 0) fail("No plugins found.");

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${pluginCount} plugin and ${skillCount} skills.`);
}
