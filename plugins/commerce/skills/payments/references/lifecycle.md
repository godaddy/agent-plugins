# Payment lifecycle and user experience

Use explicit internal states and map provider states into them. A useful baseline
is:

```text
created -> requires_action -> authorized -> captured
   |             |              |            |
failed        cancelled        voided       partially_refunded -> refunded
   \------------- pending / unknown / expired ---------------/
```

Not every provider supports every transition. Keep the raw provider state for
audit, but expose a stable internal state to the rest of the application.

Authorization reserves funds; capture moves an authorized payment toward
settlement. Void cancels an uncaptured authorization. Refund returns part or all
of a captured payment. Validate transition legality and remaining refundable or
capturable amount on the server.

The return page begins in `checking`, then asks the backend for authoritative
status. It may display “received” or “processing” without promising success.
Only an authenticated provider lookup, a verified event applied to durable
state, or an equivalently authoritative order service can produce definitive
success. Fulfillment should consume durable state idempotently, not a browser
request.

Keep unknown states honest and recoverable. Preserve the cart/order context,
provide retry or support guidance, and let delayed webhooks reconcile the result.
Handle event duplication and reordering by comparing legal transitions and, when
needed, fetching the current provider object.
