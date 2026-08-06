# Commerce MCP workflow

## Connection

Use Streamable HTTP from the application backend. Known endpoints are:

- production: `https://mcp.commerce.api.godaddy.com/mcp`
- development: `https://mcp.commerce.api.dev-godaddy.com/mcp`
- local service: `http://localhost:5001/mcp`

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
