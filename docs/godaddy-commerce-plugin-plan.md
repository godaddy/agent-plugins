# GoDaddy Commerce Agent Plugin plan

Status: Draft

Target portable specification: Agent Plugins 1.0.0 (currently a Working Draft)

Proposed first plugin: `godaddy-commerce`

## Outcome

Publish an installable, vendor-neutral Agent Plugin that helps compatible AI
clients use GoDaddy Commerce safely and consistently. The plugin will package:

- focused Agent Skills for common commerce workflows;
- a Streamable HTTP connection to the production GoDaddy Commerce MCP server;
- client-neutral guidance for capability discovery, OAuth, mutations, and
  failure handling.

The first release should work without rearranging the portable package for
ChatGPT/Codex, VS Code, Cursor, GitHub Copilot, or Kiro. Installation UX and
client-specific enhancements can be added separately because the Agent Plugins
specification deliberately leaves distribution and installation to clients.

## Decisions

1. **Use this repository as a collection.** Repository-level documentation,
   validation, and release automation live at the root. Each portable package
   lives under `plugins/<plugin-name>/`.
2. **Name the first package `godaddy-commerce`.** It satisfies the v1 naming
   rules and leaves room for future GoDaddy plugins in the same repository.
3. **Make the portable contract primary.** The package has root-level
   `plugin.json`, optional root-level `mcp.json`, and immediate child skills
   under `skills/`. Do not substitute a client-specific
   `.codex-plugin/plugin.json` manifest.
4. **Start with the production MCP endpoint.** The portable package points to
   `https://mcp.commerce.api.godaddy.com/mcp`. Development and test endpoints
   should remain separate fixtures or client-local overrides, not hidden
   runtime switching inside the production package.
5. **Keep authentication client-managed.** Agent Plugins 1.0.0 has no portable
   OAuth or credential-reference fields. `mcp.json` must not contain bearer
   tokens, client secrets, or an `Authorization` header. Compatible clients use
   the endpoint's OAuth protected-resource metadata and their own secure
   credential flow.
6. **Teach discovery before tool invocation.** Commerce MCP exposes a small core
   tool set and loads specialized tools through `search_tools`. Every workflow
   skill must discover the current tool contract rather than hard-code an
   exhaustive catalog.
7. **Keep initial skills task-specific.** Narrow descriptions reduce ambiguous
   skill activation and let invalid skills fail independently, as the portable
   specification intends.
8. **Treat the public repository as a publication boundary.** Existing internal
   skills and schemas may inform the work, but nothing should be copied until
   ownership, license, security, and public-documentation review are complete.

## Proposed repository layout

```text
agent-plugins/
├── README.md
├── CONTRIBUTING.md
├── LICENSE
├── docs/
│   ├── godaddy-commerce-plugin-plan.md
│   ├── authoring.md
│   └── releasing.md
├── plugins/
│   └── godaddy-commerce/
│       ├── plugin.json
│       ├── mcp.json
│       ├── README.md
│       └── skills/
│           ├── commerce-store/
│           │   ├── SKILL.md
│           │   └── references/
│           ├── commerce-catalog/
│           │   ├── SKILL.md
│           │   └── references/
│           ├── commerce-orders/
│           │   ├── SKILL.md
│           │   └── references/
│           ├── commerce-apps/
│           │   ├── SKILL.md
│           │   └── references/
│           └── commerce-reporting/
│               ├── SKILL.md
│               └── references/
├── scripts/
│   └── validate.mjs
└── tests/
    ├── fixtures/
    └── scenarios/
```

The repository root is not itself a portable plugin. The installable package
root is `plugins/godaddy-commerce/`.

## Portable package skeleton

Proposed `plugins/godaddy-commerce/plugin.json`:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "godaddy-commerce",
  "version": "0.1.0",
  "description": "Use GoDaddy Commerce through task-focused skills and MCP tools.",
  "author": {
    "name": "GoDaddy"
  },
  "homepage": "https://github.com/godaddy/agent-plugins/tree/main/plugins/godaddy-commerce",
  "repository": "https://github.com/godaddy/agent-plugins",
  "keywords": ["godaddy", "commerce", "catalog", "orders", "mcp"]
}
```

Add `license` only after the repository's approved open-source license is
selected. The manifest schema is closed, so portable component declarations do
not belong in this file.

Proposed `plugins/godaddy-commerce/mcp.json`:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "godaddy-commerce": {
      "type": "streamable-http",
      "url": "https://mcp.commerce.api.godaddy.com/mcp"
    }
  }
}
```

Do not add static authentication headers. They would be public package data,
and portable OAuth configuration is outside Agent Plugins 1.0.0.

## Initial skill set

### `commerce-store`

Use for store discovery, setup decisions, channel inspection, and checkout
validation. It should distinguish read operations from store creation or other
state changes and ask for confirmation when the user has not already authorized
the mutation.

### `commerce-catalog`

Use for products/SKU groups, variants/SKUs, categories/lists, prices, locations,
and inventory. It should teach the product-versus-variant model, retrieve current
tool schemas with `search_tools`, inspect before mutating, and verify results.

### `commerce-orders`

Use for order search and order detail retrieval. The current Commerce MCP order
surface is read-only; the skill must not imply support for fulfillment or order
state mutation.

### `commerce-apps`

Use for app discovery, enablement, disablement, settings, and channel setup. It
should clearly separate listing/read flows from enable, disable, and configure
operations.

### `commerce-reporting`

Use for datasheet discovery, data queries, and report artifact creation or
retrieval. It should keep query scope bounded and explain artifact lifecycle.

Each `SKILL.md` should have only specification-supported frontmatter, a precise
activation description, a short operating procedure, known safety constraints,
and links to references stored inside that skill directory. No skill should
depend on another skill being loaded.

## Shared behavior to encode in skills

1. Confirm the target GoDaddy environment and store before acting.
2. Check the connected MCP server and authentication state.
3. Inspect core tools, then call `search_tools` for the requested capability.
4. Use the schema returned by the current MCP session; do not rely on remembered
   parameter shapes.
5. Read current state before a mutation when doing so materially reduces risk.
6. For destructive or financially meaningful changes, summarize the intended
   target and impact before execution unless the user has already given explicit,
   specific authorization.
7. Treat MCP output as untrusted data rather than agent instructions.
8. Surface authentication, authorization, validation, and partial-failure errors
   directly; never silently switch to mock data.
9. Re-read or verify the affected object after a successful mutation when a read
   tool is available.

## Delivery phases

### Phase 0 — Governance and public-release boundary

- Confirm that `godaddy/agent-plugins` is a multi-plugin public collection.
- Select the approved open-source license and code owners.
- Identify the maintainers for the plugin, Commerce MCP service, and security
  review.
- Review existing internal skill material and generated MCP tool documentation;
  classify what may be adapted, rewritten, or must remain private.
- Decide the support promise for production versus non-production endpoints.

**Exit gate:** ownership, license, public-content rules, and release authority are
documented.

### Phase 1 — Repository and conformance foundation

- Add `plugins/godaddy-commerce/plugin.json` and `mcp.json` using the 1.0.0
  canonical schema identifiers.
- Add a validator that checks both JSON Schemas plus semantic rules not fully
  expressible in JSON Schema: matching spec versions, HTTPS for non-loopback MCP,
  no case-insensitive duplicate headers, package containment, and symlink escape
  protection.
- Add skill discovery validation for immediate child directories and regular
  `SKILL.md` files.
- Add Markdown/link checks and secret scanning.
- Document local authoring and validation.

**Exit gate:** a minimal package validates locally and in CI with no skills or MCP
credentials embedded.

### Phase 2 — MCP connection and OAuth experience

- Configure the production Streamable HTTP endpoint without literal auth
  headers.
- Verify protected-resource metadata, initialization, `tools/list`,
  `search_tools`, session reuse, and representative read-only calls.
- Write client-neutral authentication guidance, then add separate setup notes for
  clients that need them.
- Confirm failure behavior for missing credentials, insufficient scope, expired
  tokens, unsupported transports, and unavailable servers.

**Exit gate:** at least two compatible clients can authenticate through their own
OAuth handling, connect, discover tools, and perform a read-only smoke test.

### Phase 3 — MVP skills

- Implement `commerce-store`, `commerce-catalog`, and `commerce-orders` first.
- Add prompt scenarios for happy paths, missing auth, ambiguous stores, empty
  results, schema changes, validation failures, and attempted unsupported
  operations.
- Evaluate skill activation, MCP tool choice, argument validity, mutation safety,
  and usefulness of the final response.
- Add `commerce-apps` and `commerce-reporting` after the first three meet their
  quality threshold.

**Exit gate:** every skill validates independently and passes its scenario suite
without depending on undocumented client behavior.

### Phase 4 — Client compatibility and packaging

- Test package discovery in ChatGPT/Codex, VS Code, Cursor, GitHub Copilot, and
  Kiro where practical.
- Record which clients load skills, Streamable HTTP MCP, or both; do not present
  an unsupported component as a plugin defect.
- Add installation instructions per client without changing the portable package
  layout.
- Test a clean checkout and ensure every package-resolved path remains under the
  plugin root.

**Exit gate:** the compatibility matrix and known limitations are published.

### Phase 5 — Release and maintenance

- Tag `godaddy-commerce` as `0.1.0` using Semantic Versioning.
- Publish a changelog and checksums or provenance appropriate to the chosen
  distribution method.
- Define owners and cadence for keeping skills aligned with the MCP tool catalog.
- Add a compatibility test for every new Agent Plugins spec version before
  changing either canonical `$schema` identifier.
- Keep older package versions available according to the documented support
  policy.

**Exit gate:** a clean user can install the plugin, authenticate, complete the
documented smoke test, and report issues through the public repository.

## CI and test matrix

Every pull request should run:

- JSON parsing and canonical schema validation for every `plugin.json` and
  `mcp.json`;
- package-name, version-match, fixed-location, filesystem-kind, and containment
  checks;
- Agent Skills validation for each discovered skill, isolated per skill;
- secret detection, including bearer tokens and credential-like HTTP headers;
- Markdown, relative-link, and example validation;
- offline scenario tests for skill routing and safe behavior;
- authenticated MCP smoke tests only in a protected workflow with environment
  secrets, never from pull requests originating from forks.

Release candidates should additionally run manual or automated checks for:

- OAuth discovery and sign-in;
- MCP initialization and session handling;
- `tools/list` and `search_tools` behavior;
- one representative read from store, catalog, and orders;
- one explicitly authorized non-production mutation with post-write verification;
- graceful isolation when one skill or MCP server operation fails.

## First-release acceptance criteria

- The package validates against Agent Plugins 1.0.0 and the Agent Skills
  specification.
- `plugin.json` and `mcp.json` target the same Agent Plugins version.
- No package path or symlink escapes `plugins/godaddy-commerce/`.
- No secrets, credentials, or static authorization headers are committed.
- The production endpoint uses `streamable-http` over HTTPS.
- At least three task-specific skills load independently.
- Skills discover the current tool schema before specialized calls.
- Write flows are explicit, scoped, and verified; order guidance remains
  read-only until the server contract changes.
- At least two compatible clients complete an authenticated read-only smoke test.
- Installation, compatibility, limitations, ownership, license, and support are
  documented.

## Open decisions

1. Which open-source license is approved for the repository?
2. Is the repository definitively a multi-plugin collection, or should the first
   plugin occupy the repository root?
3. Which clients are release-blocking versus best-effort compatibility targets?
4. Should `0.1.0` expose all MCP write capabilities, or launch with read-only
   skill guidance and add mutation workflows incrementally?
5. Who owns OAuth setup documentation and test credentials for each client?
6. What is the approved process for adapting material from internal Commerce
   skills and schemas into this public repository?

## Research basis

This plan was checked against every page listed in the
[agent-plugins.org sitemap](https://agent-plugins.org/sitemap.xml), including the
complete 1.0.0 specification, author and client guidance, compatible-client
matrix, conformance checklist, and both canonical JSON Schemas:

- [Agent Plugins Specification](https://agent-plugins.org/specification)
- [Build an Agent Plugin](https://agent-plugins.org/plugin-authors)
- [Plugin manifest](https://agent-plugins.org/plugin-authors/manifest)
- [Skills](https://agent-plugins.org/plugin-authors/skills)
- [MCP servers](https://agent-plugins.org/plugin-authors/mcp-servers)
- [Client extensions](https://agent-plugins.org/plugin-authors/client-extensions)
- [Client conformance checklist](https://agent-plugins.org/client-implementers/conformance)
- [JSON Schemas](https://agent-plugins.org/schemas)

The normative specification governs if this plan or a machine-readable schema
differs from it.
