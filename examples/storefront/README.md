# Common Field Supply — reference storefront

This app is executable evidence for the `storefront` and `payments` skills. It
implements product browsing, explicit SKU selection, a versioned persistent
cart, a same-origin checkout backend, a simulated hosted checkout, and a return
page that asks the server for authoritative status before clearing the cart.

The default is an unmistakable fixture/demo mode. It moves no money and is not
production payment evidence.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The API runs on port `3001`.

## Read a live Commerce MCP catalog

Set these only in the server environment:

```bash
COMMERCE_DATA_MODE=mcp
COMMERCE_MCP_TOKEN=<short-lived OAuth token>
COMMERCE_STORE_ID=<store id>
```

The adapter always connects to the public production Commerce MCP endpoint from
server code, calls `search_tools`, confirms the current schemas, and invokes the
catalog search/get tools through `execute_tool`. Missing credentials, scopes,
products, or connectivity are surfaced to the UI; the app does not fall back to
fixtures.

Checkout remains `demo` or `disabled` because the reviewed Commerce MCP does not
expose payment writes. A real integration should replace only the narrow
checkout-session service after an approved provider contract is selected.

## Verification

```bash
npm test
npm run typecheck
npm run build
```

The demo hosted page explicitly states that no funds move. Its “payment” action
changes server-owned demo session state; the browser return URL alone does not.
