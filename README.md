# agent-plugins

Portable Agent Plugins maintained by GoDaddy.

This repository is being bootstrapped around the vendor-neutral [Agent Plugins
1.0.0 specification](https://agent-plugins.org/specification). The first package
is `commerce`. It combines a Storefront skill, a dedicated Payments skill, and
GoDaddy Commerce's remote MCP server.

```text
plugins/commerce/skills/storefront  catalog, PDP, cart, and checkout handoff
plugins/commerce/skills/payments    payment lifecycle and transaction work
examples/storefront                 runnable reference implementation
```

Run `npm run validate` to check package structure, containment, manifests, skill
frontmatter, UI metadata, and relative links. The reference app has its own test,
typecheck, and build commands.

See [the implementation plan](docs/commerce-plugin-plan.md) for scope, package
design, release gates, and remaining governance work.

> Status: pre-release implementation. The plugin is usable for evaluation but
> has not completed the public-release governance and compatibility gates.
