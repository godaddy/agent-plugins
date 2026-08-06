# Storefront runtime API map

Use this reference when implementing a live product grid, product detail page,
variant selection, or cart. It maps shopper-facing capabilities to GoDaddy
Commerce runtime APIs without assuming a framework or repository layout.

## Contents

1. Control plane versus runtime plane
2. Required runtime configuration
3. Browser-facing contract
4. Catalog storefront API
5. Draft-order cart API
6. Implementation sequence

## Control plane versus runtime plane

| Capability | Use |
| --- | --- |
| Store/channel selection and setup | Commerce MCP core store/channel tools |
| Catalog administration | MCP-discovered `catalog_*` tools |
| Merchant order inspection | MCP-discovered `commerce_orders_*` tools |
| Live product listing and detail | Catalog storefront GraphQL API |
| Live cart creation and mutation | Order storefront GraphQL API |
| Checkout configuration/readiness | Commerce MCP core checkout tools |
| Hosted checkout session | Payments skill and selected provider contract |

MCP discovery describes MCP tools only. It does not discover the application's
runtime GraphQL operations. Do not ship the interactive agent OAuth token or an
arbitrary MCP dispatcher in the generated application.

## Production runtime configuration

Resolve and persist these values outside browser-controlled input:

- `storeId`: the store selected or created through Commerce MCP;
- `channelId`: the registered sales channel used by draft orders and checkout;
- `clientId`: the runtime application's registered public client identifier;
- `currencyCode`: the store's actual ISO 4217 currency.

The public production API origin is fixed at `https://api.godaddy.com`. Do not
add an origin setting, endpoint picker, or browser-supplied override.

The MCP login and application runtime are separate security contexts. The app
must receive its own approved runtime configuration. Keep provider credentials
and client secrets server-only. Even when a client identifier is public, prefer
same-origin proxy routes so store/channel binding, validation, caching, and abuse
controls remain server-owned.

Use GraphQL `POST` requests with `Content-Type: application/json`. Current
production storefront subgraphs use `X-Store-ID: <storeId>` and
`X-Client-ID: <clientId>` headers. Confirm the current production schema and
required headers before deployment.

## Browser-facing contract

Adapt path spelling to the host framework, but preserve narrow operations:

| Method | Suggested path | Browser input | Normalized response |
| --- | --- | --- | --- |
| `GET` | `/api/commerce/products` | bounded pagination and filters | `{ products, pageInfo }` |
| `GET` | `/api/commerce/products/:id` | product ID and selected option IDs | `{ product }` |
| `GET` | `/api/commerce/skus/:id` | concrete SKU ID | `{ sku }` |
| `POST` | `/api/commerce/cart` | `{ skuId, quantity }` | `{ cart }` |
| `GET` | `/api/commerce/cart/:id` | opaque cart ID | `{ cart }` |
| `POST` | `/api/commerce/cart/:id/items` | `{ skuId, quantity }` | `{ cart }` |
| `PATCH` | `/api/commerce/cart/:id/items/:itemId` | `{ quantity }` | `{ cart }` |
| `DELETE` | `/api/commerce/cart/:id/items/:itemId` | no body | `{ cart }` |
| `POST` | `/api/commerce/cart/:id/discounts` | `{ discountCodes }` | `{ cart }` |

Validate identifiers, quantities, pagination, and filters. Re-read the SKU on the
server and derive required names, media, currency, and availability there. Never
accept price or totals from the browser. Re-fetch the complete cart after every
mutation so every cart route returns one stable view model.

## Catalog storefront API

Production endpoint:

```text
https://api.godaddy.com/v2/commerce/stores/{storeId}/catalog-subgraph/storefront
```

Use these GraphQL operations:

- `skuGroups`: paginated product grid. Select stable ID, label/name,
  descriptions, `priceRange`, `compareAtPriceRange`, media, attributes, and a
  bounded SKU preview. Keep `pageInfo` and cursors.
- `skuGroup(id: ...)`: product detail and option resolution. Query attributes
  and filter `skus` by selected attribute-value IDs.
- `sku(id: ...)`: fetch the concrete purchasable variant after selection. Select
  prices with currency, inventory counts, media, attribute values, and status
  fields exposed by the current schema.

A representative product-grid operation begins:

```graphql
query SkuGroups(
  $first: Int
  $after: String
  $id: SKUGroupIdsFilter
  $listId: ListIdFilter
  $label: LabelFilter
) {
  skuGroups(first: $first, after: $after, id: $id, listId: $listId, label: $label) {
    edges { cursor node { id name label description priceRange { min max } } }
    pageInfo { hasNextPage startCursor endCursor }
    totalCount
  }
}
```

Extend selection sets only with fields confirmed by the current schema. Filter
public results to active/sellable products and SKUs. Bound page sizes and detail
fan-out; do not fetch full details for an unbounded product grid.

## Draft-order cart API

Production endpoint:

```text
https://api.godaddy.com/v1/commerce/order-storefront-subgraph
```

A cart is a draft order. Use the current schemas for these operations:

| Operation | Purpose |
| --- | --- |
| `addDraftOrder(input: AddDraftOrderInput!)` | Create the empty cart with store/channel context and zero totals in the store currency |
| `addLineItemBySkuId(input: AddLineItemInput!)` | Add a SKU and let the service resolve current catalog pricing |
| `orderById(id: ID!)` | Hydrate line items, discounts, statuses, and totals |
| `updateLineItemById(input: UpdateLineItemByIdInput!)` | Change quantity or another supported mutable field |
| `deleteLineItemById(id: ID!, orderId: ID!)` | Remove one line item |
| `applyDiscountCodes(input: ApplyDiscountCodesInput!)` | Apply validated promotion codes |

Do not place browser-priced line items directly into `addDraftOrder`. The reliable
first-add sequence is:

1. Validate `skuId` and quantity and fetch the current SKU server-side.
2. Call `addDraftOrder` with `{ context: { storeId, channelId }, totals }`, where
   every initial total is zero in `currencyCode`.
3. Call `addLineItemBySkuId` with the returned order ID, current SKU ID, quantity,
   and any other required fields populated from server-owned catalog data.
4. Call `orderById` and return the hydrated draft order as `{ cart }`.

For later mutations, perform the single mutation and then call `orderById` again.
Do not race multiple writes against the same draft order. Treat partial batch
failure explicitly.

Persist only an opaque cart ID in a protected application session or versioned
client storage. On every request, confirm the returned draft order belongs to the
configured store/channel and remains a mutable draft. An opaque ID is not proof
of ownership.

## Implementation sequence

1. Resolve the production store, channel, runtime client, and currency.
2. Implement a server-only GraphQL requester with timeouts and structured errors.
3. Implement product grid, product detail, and SKU routes.
4. Normalize upstream connections and money into application view models.
5. Implement the two-step first add-to-cart flow and stable cart responses.
6. Implement cart hydration, update, removal, and optional discounts.
7. Exercise empty, unavailable, multi-variant, changed-price, and stale-cart
   states with live data.
8. Activate the payments skill before wiring any checkout button.
