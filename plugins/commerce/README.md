# Commerce plugin

`commerce` is a portable Agent Plugin for building and operating commerce
experiences. It contains two independently usable skills:

- `storefront` guides catalog, product-detail, cart, order, and storefront UI
  work. It can discover GoDaddy Commerce capabilities through the bundled MCP
  connection.
- `payments` guides provider selection, checkout, payment lifecycle,
  verification, refunds, voids, and transaction reads without assuming an API
  supports writes it does not expose.

The package uses the Agent Plugins 1.0.0 working-draft layout. Install this
directory as the plugin root in a compatible client. The MCP entry contains no
credentials; authentication is performed by the client through its secure OAuth
flow.

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

The portable MCP configuration targets production:

```text
https://mcp.commerce.api.godaddy.com/mcp
```

Client-local development may override this with:

```text
https://mcp.commerce.api.dev-godaddy.com/mcp
http://localhost:5001/mcp
```

Never commit a bearer token or an `Authorization` header to this package.
