# GoDaddy AI Toolkit

One installable `godaddy` agent plugin for building with GoDaddy. The toolkit
includes a domain-lifecycle skill, the public Domains MCP and CLI, Node.js
Hosting, two Commerce skills, and the production GoDaddy Commerce MCP server:

```text
skills/gddy          domain search, registration, and DNS through the CLI
skills/domains       domain outcomes across MCP, CLI, and production REST
skills/hosting       Node.js app creation, source, secrets, deploys, and logs
skills/storefront    catalog, product detail, cart, and checkout handoff
skills/payments      checkout, payment lifecycle, and transaction work
examples/storefront  runnable reference implementation
```

The repository root is the plugin root. Future GoDaddy capabilities belong in
this same plugin as additional skills and MCP connections; they should not be
packaged as nested product plugins.

## Install in Codex

Install directly from GitHub:

```bash
codex plugin marketplace add https://github.com/godaddy/commerce-agent-plugin.git
codex plugin add godaddy@godaddy-ai-toolkit
```

The plugin contains a pre-registered public OAuth client and requests its
provisioned identity and read scopes. It contains no client secret or user
credential. Configure Codex's localhost OAuth callback once in
`~/.codex/config.toml`:

```toml
mcp_oauth_callback_port = 6274
mcp_oauth_callback_url = "http://localhost:6274/"
```

Register the derived redirect URI
`http://localhost:6274/IhM2a8vIl6u-` for this public client.

Then authenticate the bundled Commerce connection:

```bash
codex mcp login godaddy-commerce
```

The bundled `godaddy-domains` MCP needs no login. It provides public domain
availability and suggestion tools. The `domains` skill routes account-aware
work to the separately authenticated `gddy` CLI for interactive operations or
to the production Domains REST API for application code and automation.

To pick up a release from the Git-backed marketplace, run:

```bash
codex plugin marketplace upgrade godaddy-ai-toolkit
codex plugin add godaddy@godaddy-ai-toolkit
```

If the former `commerce@godaddy` package is installed, migrate it once:

```bash
codex plugin remove commerce@godaddy
codex plugin marketplace remove godaddy
codex plugin marketplace add https://github.com/godaddy/commerce-agent-plugin.git
codex plugin add godaddy@godaddy-ai-toolkit
```

Start a new thread after installation or an update. Codex will load the
`godaddy:gddy`, `godaddy:domains`, `godaddy:hosting`, `godaddy:storefront`, and
`godaddy:payments` skills plus the Domains and Commerce MCP tools. The `domains`
skill selects MCP, CLI, or REST for a complete domain lifecycle; `gddy` checks
the locally installed CLI and guides its separate browser authentication only
when an interactive account task needs it. The `hosting` skill uses server-held
OAuth client credentials for the fixed public production Node.js Hosting REST
API.

## Host entry points

The root layout follows the same one-toolkit pattern across agent hosts:

- `.agents/plugins/marketplace.json` and `.codex-plugin/plugin.json` for Codex
- `.claude-plugin/` for Claude Code
- `.cursor-plugin/` for Cursor
- `gemini-extension.json` for Gemini CLI
- `plugin.json` and `mcp.json` for Agent Plugins-compatible hosts
- `package.json#pi.skills` for Pi

Install this repository root when a host supports installing a plugin from a
Git URL. The skills contain workflow knowledge; `domains` routes complete domain
outcomes, `gddy` provides interactive account operations, the public Domains MCP
handles unauthenticated discovery, `hosting` guides production Node.js Hosting
REST workflows, and the Commerce MCP exposes account-specific capabilities.
Hosts and generated applications remain responsible for OAuth and credential
storage.

## Production boundary

All bundled GoDaddy connections use fixed public production endpoints. Users
do not need to know or configure service origins. The storefront example uses
localhost only for its own development server and is visibly fixture-backed by
default; it never silently substitutes fixtures for a failed live request.

## Validate

Run:

```bash
npm run validate
```

This checks the single root plugin, cross-host manifest agreement, marketplace
sources, required skills, OAuth configuration, relative links, and the public
production boundary. The reference storefront has separate tests, typechecks,
and a production build.

See [the toolkit plan](docs/toolkit-plan.md) for the architecture and expansion
rules, and [the developer-platform skill map](docs/developer-platform-skill-map.md)
for the page-by-page documentation audit.

> Status: pre-release. Public-release governance and cross-host compatibility
> testing are still required.
