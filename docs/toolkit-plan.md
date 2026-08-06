# GoDaddy AI Toolkit plan

Status: implementation in progress

## Outcome

Publish one installable plugin named `godaddy`. It gives agents reusable
GoDaddy workflow knowledge through skills and account-specific capabilities
through production MCP servers and CLIs. The target capability areas are
Domains, Hosting, Commerce, and GoDaddy platform apps.

The repository follows the root-plugin model used by mature AI toolkits: one
Git URL, one plugin identity, host-specific entry points, one shared `skills/`
directory, and room to add GoDaddy capabilities without asking users to find
and install product-specific plugins.

## Decisions

1. **Use one root plugin.** The repository root is the `godaddy` plugin. Do not
   introduce a nested product-package layer.
2. **Keep skills capability-focused.** `storefront` handles the non-monetary
   shopping journey. `payments` handles money movement and provider state.
   Future skills should describe a user outcome, not mirror an organization or
   API service name.
3. **Keep host manifests thin.** Codex, Claude Code, Cursor, Gemini CLI, Agent
   Plugins-compatible hosts, and Pi all point to the same root skills. Host
   manifests may adapt metadata but must agree on plugin name and base version.
4. **Use MCP for live capabilities.** Skills explain how to reason and work;
   MCP tools expose current schemas and account data. Skills must discover the
   current tool contract instead of maintaining a copied catalog of operations.
5. **Use only public production connections.** Published manifests and skills
   contain fixed public endpoints. They expose no environment selector, service
   origin override, bearer token, or client secret.
6. **Keep authentication client-managed.** The public OAuth client is suitable
   for authorization code with PKCE. Hosts own login, refresh, and credential
   storage. Generated applications must use their own runtime authentication.
7. **Treat examples as executable evidence.** Examples verify that skill
   guidance produces complete user journeys. They are not additional plugins.
8. **Keep skills flat.** Host discovery expects immediate children of
   `skills/`. Use descriptions and documentation for capability-area grouping,
   not nested `skills/domains/...` plugin structures.

## Repository layout

```text
.
├── .agents/plugins/marketplace.json
├── .claude-plugin/
│   ├── marketplace.json
│   └── plugin.json
├── .codex-plugin/plugin.json
├── .cursor-plugin/
│   ├── marketplace.json
│   └── plugin.json
├── .mcp.json
├── gemini-extension.json
├── mcp.json
├── plugin.json
├── package.json
├── skills/
│   ├── gddy/
│   │   ├── SKILL.md
│   │   ├── agents/openai.yaml
│   │   └── references/
│   ├── storefront/
│   │   ├── SKILL.md
│   │   ├── agents/openai.yaml
│   │   └── references/
│   └── payments/
│       ├── SKILL.md
│       ├── agents/openai.yaml
│       └── references/
├── examples/storefront/
└── scripts/validate.mjs
```

## Skill architecture

Keep tooling and transport skills separate from outcome skills:

| Skill | Area | Status | Responsibility |
|---|---|---|---|
| `gddy` | Foundation | Implemented | Install, discover, authenticate, and safely operate the production Domains CLI. |
| `godaddy-api` | Foundation | Proposed | Build direct REST integrations with current contracts, auth, pagination, retries, and idempotency. |
| `domains` | Domains | Proposed | Search, register, configure DNS, and manage the domain lifecycle while selecting MCP, CLI, or REST appropriately. |
| `hosting` | Hosting | Proposed | Create Node.js apps, upload source, manage secrets, deploy, inspect logs, and roll back. |
| `storefront` | Commerce | Implemented | Build catalog, product, cart, checkout-handoff, and non-monetary order experiences. |
| `payments` | Commerce | Implemented | Implement checkout sessions, money movement, provider state, webhooks, and transaction reads. |
| `platform-apps` | Platform apps | Documentation gap | Build, register, authenticate, configure, release, install, operate, upgrade, and uninstall apps on the GoDaddy platform. |

Start Domains as one skill with conditional references for discovery,
registration, DNS, and lifecycle management. Split it only if forward tests
show activation or context problems. Keep GoDaddy platform apps in one lifecycle
skill, with progressive references for OAuth and scopes, actions, webhooks and
subscriptions, UI extensions, releases, installation, and operation.

See [the page-by-page documentation map](developer-platform-skill-map.md) for
the source audit and ownership of every current developer page.

## Commerce capability model

### Storefront

Use for catalog browsing, product detail, variants, inventory presentation,
carts, checkout handoff, order confirmation, store integrations, and responsive
commerce UI. The skill uses Commerce MCP for agent-side discovery and
administration, and teaches applications to put live shopper traffic behind
narrow server-owned routes.

### Payments

Use for hosted or embedded checkout, session creation, transaction reads,
authorization, capture, refunds, voids, webhooks, settlement, reconciliation,
and payment-state UI. Every money-moving operation must come from a current,
approved provider contract. A browser redirect is never payment proof.

### Boundary

The storefront skill owns the cart and authoritative checkout input. It hands
stable item identifiers and quantities to a server-side payments integration.
The payments skill owns provider state and returns a server-verified terminal or
pending result. Fulfillment and durable cart clearing happen only after that
verification.

## Adding future GoDaddy capabilities

For each new capability:

1. Add `skills/<capability>/SKILL.md` with only `name` and `description` in its
   frontmatter.
2. Put detailed schemas and workflow variants in that skill's `references/`
   directory; keep the main instructions concise.
3. Add `agents/openai.yaml` with a prompt that explicitly invokes the skill.
4. Add a stable MCP server entry only when a public production surface is
   available and the scopes are approved.
5. Add an example only when it provides meaningful end-to-end verification.
6. Update all host manifests only when plugin-level metadata or dependencies
   change; do not create another plugin identity.
7. Extend validation and test the new skill independently before release.

## Release gates

- Every manifest uses plugin name `godaddy` and the same base version.
- The Codex marketplace installs the repository URL as the root plugin.
- `gddy`, `storefront`, and `payments` validate independently.
- No private, pre-release, configurable, or credential-bearing connection is
  present in tracked files.
- MCP login, initialization, tool discovery, and representative read calls work
  from each claimed host.
- The reference storefront passes tests, typechecking, and production build.
- A real checkout is never used merely as a release smoke test.
- Ownership, license, security review, and compatibility claims are approved
  before a public release is declared complete.

## Near-term work

1. Add the public Domains MCP server and implement the `domains` routing skill.
2. Implement `godaddy-api` from the shared authentication and reliability docs.
3. Implement `hosting` after resolving its missing public concepts and
   authentication guides.
4. Incorporate Commerce documentation as it is published and narrow any
   guidance that the live contract supersedes.
5. Obtain and publish the GoDaddy platform-app contract before authoring
   `platform-apps`; local application materials may inform that work, but the
   skill must be rewritten against the public production contract.
6. Complete cross-host installation and forward tests from the Git URL.
