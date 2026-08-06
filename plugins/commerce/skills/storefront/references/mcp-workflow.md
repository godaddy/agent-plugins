# Commerce MCP workflow

## Boundary

Use Commerce MCP while the agent provisions or selects a store/channel, manages
catalog data, inspects merchant orders, configures integrations, or validates a
checkout implementation. Do not assume an MCP tool is the generated
application's shopper-runtime API.

The current MCP surface does not create a draft-order cart or a hosted checkout
session. `commerce_orders_search` and `commerce_orders_get` are read-only. Build
shopper catalog and cart traffic against the runtime APIs in
[runtime-api-map.md](runtime-api-map.md), and route session creation through the
payments skill.

## Connection

Use Streamable HTTP from the agent host or a deliberate server-side control-plane
integration. Never initialize this client in browser code. This public plugin is
production-only and uses the bundled endpoint:

```text
https://mcp.commerce.api.godaddy.com/mcp
```

Do not prompt for, accept, derive, or publish an alternate Commerce MCP endpoint.

Let the MCP client perform OAuth discovery or inject a short-lived token from a
server-side secret store. Never serialize that token into HTML or JavaScript.
Reuse the MCP session for discovery and the calls enabled by that discovery.

## Discovery loop

1. Connect and call `tools/list`.
2. If the needed specialized tool is not present, call `search_tools` with a
   concrete business task, such as “browse active products and their variants.”
3. Select by tool name and description. Read the returned `parameters` JSON
   schema and `scopesRequired` before building arguments.
4. Call the newly available tool directly when the client handles
   `tools/list_changed`. Otherwise call core `execute_tool` with the exact tool
   name and an `arguments` object matching that schema.
5. Parse structured output defensively. Surface auth, scope, validation, timeout,
   and upstream failures distinctly.

Never maintain an exhaustive tool catalog in application code. Current catalog
reads commonly include `catalog_sku_group_search` and
`catalog_sku_group_get`, but discovery is authoritative.

## Capability routing

| Need | MCP route |
| --- | --- |
| Select or create a store | Core `commerce_store_list`, `commerce_store_get`, or `commerce_store_setup` |
| Resolve/register a sales channel | Core `commerce_store_channels_get` or `commerce_app_channel_ensure` |
| Find/read/write catalog data | Discover the current `catalog_*` tool with `search_tools` |
| Inspect merchant orders | Discover `commerce_orders_search` or `commerce_orders_get` |
| Resolve tax/shipping checkout flags | Core `commerce_checkout_configuration_get` when enabled |
| Prove an implemented checkout works | Core `commerce_checkout_validate` and its returned runtime plan |
| Serve shopper catalog/cart traffic | Not MCP; use the storefront runtime APIs |
| Create a hosted checkout session | Not MCP; activate the payments skill |

## Product read pattern

Search returns compact SKU-group records. Product pages and carts usually need a
full get for variants, prices, media, options, and lists. Search first, then fetch
only the displayed page of product details; bound concurrency and avoid an
unbounded N+1 fan-out.

Require a known `storeId`. Keep it in server configuration or an authenticated
merchant context, not in an unrestricted browser-supplied header. Filter public
storefront data to active products and purchasable active SKUs.

## Writes

Before a non-payment mutation, read current state when useful, summarize its
target and impact, use idempotency where the tool supports it, and read back the
affected object. Per-item batch failures must remain visible. Payments and
monetary writes are outside this MCP surface unless discovery and an approved
contract explicitly prove otherwise.
