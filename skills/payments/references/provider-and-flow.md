# Provider and flow selection

Begin with merchant and product constraints rather than a preferred SDK.

Confirm:

- merchant country and provider eligibility;
- presentment and settlement currencies;
- one-time, recurring, marketplace, in-person, or off-session use;
- digital versus shippable goods and fulfillment timing;
- supported payment methods and authentication requirements;
- immediate versus delayed/manual capture;
- full and partial refund needs;
- tax, shipping, discount, fraud, dispute, and reconciliation ownership;
- hosted, embedded, or custom collection and the resulting compliance scope.

Prefer hosted checkout when it satisfies the experience: it reduces sensitive
data handling and typically centralizes payment-method updates. Embedded flows
need stronger loading, readiness, validation, authentication, and fallback
states. Custom card-data collection is not a default implementation choice.

Do not assume one provider is globally available. If the requested provider or
flow is ineligible, stop before building checkout UI and explain the supported
alternative. Keep provider-specific code behind a narrow adapter so the order
and UI domains do not depend on raw provider objects.
