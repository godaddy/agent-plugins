# Commerce plugin

`commerce` is the repository's only Agent Plugin. It builds and operates
commerce experiences through two independently usable skills:

- `storefront` guides catalog, product-detail, cart, order, and storefront UI
  work. It can discover GoDaddy Commerce capabilities through the bundled MCP
  connection.
- `payments` guides provider selection, checkout, payment lifecycle,
  verification, refunds, voids, and transaction reads without assuming an API
  supports writes it does not expose.

The package includes the Agent Plugins 1.0.0 working-draft files
(`plugin.json`, `mcp.json`) and native Codex files
(`.codex-plugin/plugin.json`, `.mcp.json`). Both target the same skills and
production MCP endpoint. Authentication is performed by the client through its
secure authorization-code + PKCE flow. The Codex package contains the
pre-registered public OAuth client ID but no client secret or user credential.
It requests the OIDC identity and offline refresh scopes plus the Commerce and
App Registry read scopes provisioned for the public client.

For Codex, add `https://github.com/godaddy/agent-plugins.git` as a Git
marketplace and install the `commerce@godaddy` plugin. No local clone is
required. Start a new thread after installation so Codex loads both skills and
the MCP connection. Configure Codex's global callback URL as documented in the
repository README before running `codex mcp login commerce`.

## What the skills deliberately enforce

- OAuth tokens and payment secrets stay on the server.
- The connected API or MCP schema is inspected before arguments are built.
- A product is not assumed to be purchasable; carts contain variant/SKU IDs.
- Money retains its currency and minor-unit representation end to end.
- A browser return URL is never accepted as definitive proof of payment.
- Payment writes are implemented only from an approved provider contract.

See the repository's [reference storefront](https://github.com/godaddy/agent-plugins/tree/main/examples/storefront)
for an app that uses the same rules. It runs with conspicuously labeled fixtures
by default and can read catalog data from Commerce MCP when server-side
credentials are provided.

## Endpoints

Both MCP configurations target production:

```text
https://mcp.commerce.api.godaddy.com/mcp
```

Client-local development may override this with:

```text
https://mcp.commerce.api.dev-godaddy.com/mcp
http://localhost:5001/mcp
```

Never commit a bearer token or an `Authorization` header to this package.
