# GoDaddy Commerce Agent Plugin

This repository publishes one installable plugin: `commerce`. It combines a
Storefront skill, a dedicated Payments skill, and GoDaddy Commerce's remote MCP
server. No unrelated plugins belong in this repository or its marketplace.
All bundled GoDaddy Commerce connections use public production endpoints; users
do not select or configure service origins.

The package supports both the vendor-neutral [Agent Plugins 1.0.0 working
draft](https://agent-plugins.org/specification) and the native [Codex plugin
format](https://developers.openai.com/plugins/build/plugins).

```text
plugins/commerce/skills/storefront  catalog, PDP, cart, and checkout handoff
plugins/commerce/skills/payments    payment lifecycle and transaction work
examples/storefront                 runnable reference implementation
```

## Install in Codex

Add the GitHub repository directly as the GoDaddy marketplace, then install its
only plugin. A local clone is not required:

```bash
codex plugin marketplace add https://github.com/godaddy/commerce-agent-plugin.git
codex plugin add commerce@godaddy
```

Codex clones and tracks the marketplace in its own plugin cache. To refresh a
Git-backed installation after a release, run:

```bash
codex plugin marketplace upgrade godaddy
codex plugin add commerce@godaddy
```

If `godaddy` was previously configured from a local checkout, replace that
marketplace source once before using the Git URL:

```bash
codex plugin remove commerce@godaddy
codex plugin marketplace remove godaddy
codex plugin marketplace add https://github.com/godaddy/commerce-agent-plugin.git
codex plugin add commerce@godaddy
```

Codex performs authorization-code OAuth with PKCE for the bundled Streamable
HTTP server. The plugin includes GoDaddy Commerce's pre-registered public
client ID, so Codex does not use dynamic client registration. No client secret
belongs in the plugin.

The GoDaddy OAuth client uses a fixed localhost callback. Add these top-level
settings to `~/.codex/config.toml`:

```toml
mcp_oauth_callback_port = 6274
mcp_oauth_callback_url = "http://localhost:6274/"
```

For this MCP URL, Codex derives the registered redirect URI
`http://localhost:6274/IhM2a8vIl6u-`. The plugin requests the OIDC identity and
offline refresh scopes plus the Commerce and App Registry read scopes
provisioned for its public client. Log in with:

```bash
codex mcp login commerce
```

Start a new Codex thread after installation or an update so it loads the
`commerce:storefront` and `commerce:payments` skills and the Commerce MCP tools.
OAuth credentials remain in Codex's credential store; do not copy tokens into
this repository.

## Other compatible agents

Install the Git repository and select `plugins/commerce/` as the plugin root.
Its portable `plugin.json` and `mcp.json` declare the same two skills and
production MCP endpoint without credentials.

## Validate

Run `npm run validate` to check that the repository contains only the Commerce
plugin and that its marketplace, portable manifests, Codex manifests, skills,
containment, UI metadata, and relative links agree. The reference app has its
own test, typecheck, and build commands.

See [the implementation plan](docs/commerce-plugin-plan.md) for scope, package
design, release gates, and remaining governance work.

> Status: pre-release implementation. The plugin is usable for evaluation but
> has not completed the public-release governance and compatibility gates.
