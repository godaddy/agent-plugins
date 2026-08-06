# Developer Platform skill map

Reviewed: 2026-08-06

## Method and result

The audit followed the site's prescribed evaluator order: discovery index,
per-page content, complete corpus, and REST reference operations. The current
corpus contains 82 pages: 33 guides or concepts and 49 REST reference pages.

The docs support Domains strongly, expose a coherent Node.js Hosting API,
provide only two read-only Commerce transaction operations, and contain no
dedicated GoDaddy platform-app documentation. The Node.js Hosting overview links to
`/docs/hosting/concepts` and `/docs/hosting/authentication`; both currently
return 404 and are release blockers for claiming a complete Hosting skill.

## Recommended structure

Use one root plugin and flat, independently triggerable skills:

```text
skills/
├── gddy/               production CLI operation
├── godaddy-api/        proposed shared REST integration workflow
├── domains/            proposed domain outcomes across MCP, CLI, and REST
├── hosting/            proposed Node.js hosting lifecycle
├── storefront/         existing Commerce shopper experience
├── payments/           existing Commerce payment boundary
└── platform-apps/      future GoDaddy platform extensibility lifecycle
```

Do not create a skill for every endpoint page. Skills should own user outcomes;
references should carry operation-level detail and link to the live OpenAPI
contract. Keep the four product areas as taxonomy, not directory nesting.

## Page-by-page mapping

### Guides and concepts

| # | Page | Skill owner |
|---:|---|---|
| 1 | [Agent skill for gddy](https://developer.godaddy.com/en/docs/api-users/agent-skill) | `gddy` |
| 2 | [Building reliable integrations](https://developer.godaddy.com/en/docs/api-users/building-reliable-integrations) | `godaddy-api`; safety reference for `domains` |
| 3 | [Set up the CLI](https://developer.godaddy.com/en/docs/api-users/cli-setup) | `gddy` |
| 4 | [Domain management concepts](https://developer.godaddy.com/en/docs/api-users/domain-management-concepts) | `domains` |
| 5 | [Handle errors](https://developer.godaddy.com/en/docs/api-users/errors) | `godaddy-api` |
| 6 | [End-to-end workflow](https://developer.godaddy.com/en/docs/api-users/full-workflow) | `domains` |
| 7 | [Glossary](https://developer.godaddy.com/en/docs/api-users/glossary) | `domains` reference |
| 8 | [How GoDaddy APIs work](https://developer.godaddy.com/en/docs/api-users/how-godaddy-apis-work) | `godaddy-api` |
| 9 | [Introduction](https://developer.godaddy.com/en/docs/api-users) | `godaddy-api` routing |
| 10 | [GoDaddy MCP server](https://developer.godaddy.com/en/docs/api-users/mcp) | `domains` tool routing |
| 11 | [Paginate results](https://developer.godaddy.com/en/docs/api-users/pagination) | `godaddy-api` |
| 12 | [Set up a payment profile](https://developer.godaddy.com/en/docs/api-users/payment-profile) | `domains` registration prerequisite |
| 13 | [Make your first call](https://developer.godaddy.com/en/docs/api-users/quickstart) | `godaddy-api` |
| 14 | [Handle rate limits](https://developer.godaddy.com/en/docs/api-users/rate-limits) | `godaddy-api` |
| 15 | [Testing with LLMs](https://developer.godaddy.com/en/docs/api-users/testing-with-llms) | Toolkit authoring and evaluation |
| 16 | [Troubleshoot authentication](https://developer.godaddy.com/en/docs/api-users/troubleshoot-authentication) | `godaddy-api`; `gddy` fallback |
| 17 | [Troubleshoot the CLI](https://developer.godaddy.com/en/docs/api-users/troubleshoot-cli) | `gddy` |
| 18 | [Troubleshoot DNS](https://developer.godaddy.com/en/docs/api-users/troubleshoot-dns) | `domains` |
| 19 | [Troubleshoot domain registration](https://developer.godaddy.com/en/docs/api-users/troubleshoot-domain-registration) | `domains` |
| 20 | [Troubleshoot your first API call](https://developer.godaddy.com/en/docs/api-users/troubleshoot-first-call) | `godaddy-api` |
| 21 | [How to Authenticate](https://developer.godaddy.com/en/docs/api-users/auth/how-to) | `godaddy-api` |
| 22 | [About Authentication](https://developer.godaddy.com/en/docs/api-users/auth) | `godaddy-api` |
| 23 | [Manage DNS records](https://developer.godaddy.com/en/docs/api-users/manage-domains/dns) | `domains` |
| 24 | [Forward a domain](https://developer.godaddy.com/en/docs/api-users/manage-domains/forwarding) | `domains` |
| 25 | [Browse the Domains API](https://developer.godaddy.com/en/docs/api-users/manage-domains) | `domains` |
| 26 | [Registered domains](https://developer.godaddy.com/en/docs/api-users/manage-domains/list) | `domains` |
| 27 | [Lock a domain](https://developer.godaddy.com/en/docs/api-users/manage-domains/lock) | `domains` |
| 28 | [Manage renewals](https://developer.godaddy.com/en/docs/api-users/manage-domains/renewals) | `domains` |
| 29 | [Update contacts](https://developer.godaddy.com/en/docs/api-users/manage-domains/update-contacts) | `domains` |
| 30 | [Register a domain](https://developer.godaddy.com/en/docs/api-users/purchase-domains/register) | `domains` |
| 31 | [Search domain availability](https://developer.godaddy.com/en/docs/api-users/search-domains) | `domains` |
| 32 | [Build an API integration](https://developer.godaddy.com/en/docs/api-users/workflows/api-integration) | `godaddy-api` |
| 33 | [Register and configure a domain](https://developer.godaddy.com/en/docs/api-users/workflows/domain-lifecycle) | `domains` |

### REST references

| # | Page | Skill owner |
|---:|---|---|
| 34 | [REST API Reference](https://developer.godaddy.com/en/docs/references/rest) | `godaddy-api` routing index |
| 35 | [Abuse v1](https://developer.godaddy.com/en/docs/references/rest/abuse/v1-legacy) | Backlog: abuse workflow |
| 36 | [Abuse v2](https://developer.godaddy.com/en/docs/references/rest/abuse/v2) | Backlog: abuse workflow |
| 37 | [Aftermarket](https://developer.godaddy.com/en/docs/references/rest/aftermarket/aftermarket) | Backlog: domain aftermarket |
| 38 | [Agreements](https://developer.godaddy.com/en/docs/references/rest/agreements/agreements) | `domains` registration reference |
| 39 | [ANS agents](https://developer.godaddy.com/en/docs/references/rest/ans/agents) | Backlog: agent naming |
| 40 | [ANS certificate management](https://developer.godaddy.com/en/docs/references/rest/ans/certificate-management) | Backlog: agent naming |
| 41 | [ANS events](https://developer.godaddy.com/en/docs/references/rest/ans/events) | Backlog: agent naming |
| 42 | [ANS registration](https://developer.godaddy.com/en/docs/references/rest/ans/registration) | Backlog: agent naming |
| 43 | [ANS resolution](https://developer.godaddy.com/en/docs/references/rest/ans/resolution) | Backlog: agent naming |
| 44 | [ANS revocation](https://developer.godaddy.com/en/docs/references/rest/ans/revocation) | Backlog: agent naming |
| 45 | [ANS search](https://developer.godaddy.com/en/docs/references/rest/ans/search) | Backlog: agent naming |
| 46 | [ANS validation](https://developer.godaddy.com/en/docs/references/rest/ans/validation) | Backlog: agent naming |
| 47 | [Auctions](https://developer.godaddy.com/en/docs/references/rest/auctions/auctions) | Backlog: domain aftermarket |
| 48 | [Listings availability](https://developer.godaddy.com/en/docs/references/rest/auctions/listings-availability) | Backlog: domain aftermarket |
| 49 | [Certificates v1](https://developer.godaddy.com/en/docs/references/rest/certificates/v1) | Backlog: certificates |
| 50 | [Certificates v2](https://developer.godaddy.com/en/docs/references/rest/certificates/v2) | Backlog: certificates |
| 51 | [Countries](https://developer.godaddy.com/en/docs/references/rest/countries/countries) | Shared reference; primarily `domains` |
| 52 | [Domains REST reference](https://developer.godaddy.com/en/docs/references/rest/domains) | `domains` |
| 53 | [Node.js Hosting apps](https://developer.godaddy.com/en/docs/references/rest/nodejs-hosting/apps) | `hosting` |
| 54 | [Node.js Hosting deployments](https://developer.godaddy.com/en/docs/references/rest/nodejs-hosting/deployments) | `hosting` |
| 55 | [Node.js Hosting overview](https://developer.godaddy.com/en/docs/references/rest/nodejs-hosting) | `hosting` |
| 56 | [Node.js Hosting logs](https://developer.godaddy.com/en/docs/references/rest/nodejs-hosting/logs) | `hosting` |
| 57 | [Node.js Hosting secrets](https://developer.godaddy.com/en/docs/references/rest/nodejs-hosting/secrets) | `hosting` |
| 58 | [Node.js Hosting source](https://developer.godaddy.com/en/docs/references/rest/nodejs-hosting/source) | `hosting` |
| 59 | [Parking](https://developer.godaddy.com/en/docs/references/rest/parking/parking) | Backlog: domain monetization |
| 60 | [Shoppers](https://developer.godaddy.com/en/docs/references/rest/shoppers/shoppers) | Backlog: reseller/customer accounts |
| 61 | [Transactions](https://developer.godaddy.com/en/docs/references/rest/transactions/general-endpoints) | `payments`, read-only contract only |
| 62 | [Domain actions](https://developer.godaddy.com/en/docs/references/rest/domains/v2/domain-actions) | `domains` |
| 63 | [Domain notifications](https://developer.godaddy.com/en/docs/references/rest/domains/v2/domain-notifications) | `domains` |
| 64 | [Domains API usage](https://developer.godaddy.com/en/docs/references/rest/domains/v2/domains-api-usage) | `domains` operations reference |
| 65 | [Domains v2](https://developer.godaddy.com/en/docs/references/rest/domains/v2) | `domains` |
| 66 | [Domains v2 settings](https://developer.godaddy.com/en/docs/references/rest/domains/v2/manage-domain-settings) | `domains` |
| 67 | [Domains v2 registration](https://developer.godaddy.com/en/docs/references/rest/domains/v2/register-domains) | `domains` legacy/customer-scoped path |
| 68 | [Domains v2 transfers](https://developer.godaddy.com/en/docs/references/rest/domains/v2/transfer-domains) | `domains` |
| 69 | [Domains v3 discovery](https://developer.godaddy.com/en/docs/references/rest/domains/v3/discovery) | `domains` |
| 70 | [Domains v3 management](https://developer.godaddy.com/en/docs/references/rest/domains/v3/domain-management) | `domains` |
| 71 | [Domains v3 detail](https://developer.godaddy.com/en/docs/references/rest/domains/v3/domains) | `domains` |
| 72 | [Domains v3 overview](https://developer.godaddy.com/en/docs/references/rest/domains/v3) | `domains` |
| 73 | [Domains v3 operations](https://developer.godaddy.com/en/docs/references/rest/domains/v3/operations) | `domains` |
| 74 | [Domains v3 records](https://developer.godaddy.com/en/docs/references/rest/domains/v3/records) | `domains` |
| 75 | [Domains v3 quotes](https://developer.godaddy.com/en/docs/references/rest/domains/v3/registration-quotes) | `domains` |
| 76 | [Domains v3 registrations](https://developer.godaddy.com/en/docs/references/rest/domains/v3/registrations) | `domains` |
| 77 | [Domains v1 discovery](https://developer.godaddy.com/en/docs/references/rest/domains/v1/find-domains) | `domains` legacy/account-scoped path |
| 78 | [Domains v1](https://developer.godaddy.com/en/docs/references/rest/domains/v1) | `domains` |
| 79 | [Domains v1 DNS](https://developer.godaddy.com/en/docs/references/rest/domains/v1/manage-dns) | `domains` legacy/account-scoped path |
| 80 | [Domains v1 settings](https://developer.godaddy.com/en/docs/references/rest/domains/v1/manage-domain-settings) | `domains` |
| 81 | [Domains v1 register and renew](https://developer.godaddy.com/en/docs/references/rest/domains/v1/register-and-renew-domains) | `domains` legacy/account-scoped path |
| 82 | [Domains v1 transfers](https://developer.godaddy.com/en/docs/references/rest/domains/v1/transfer-domains) | `domains` |

## Capability findings

### Domains

The public docs are sufficient for a production `domains` skill. Route public
search and availability to the unauthenticated Domains MCP, interactive account
work to `gddy`, and application integrations or CLI gaps to the current REST
contract. Keep registration confirmation, quote expiry, idempotency, DNS
replacement semantics, and asynchronous operation polling in the main skill.

### Hosting

The API forms one coherent lifecycle: create an app and poll its job, upload a
zip and poll processing, manage preview or publish secrets, deploy, inspect
status and logs, and roll back. It uses OAuth client credentials and operation-
specific scopes. Author the skill after public client provisioning,
authentication, and concepts guidance is available or explicitly document that
those setup steps remain unsupported.

### Commerce

These docs expose only transaction list and get operations. They do not cover
catalog, storefront runtime APIs, checkout-session creation, money-moving
operations, or provider webhooks. Preserve the current `storefront` and
`payments` separation, and revise their references as Commerce documentation is
published rather than treating the current generic API corpus as authoritative.

### GoDaddy platform apps

The current public corpus has no dedicated guides for building apps on the
GoDaddy platform. Plan one `platform-apps` skill around the complete app
lifecycle: registration, manifests and configuration, OAuth and scopes,
actions, webhooks and subscriptions, UI extensions, installation and enabling,
releases and deployment, testing and review, upgrades, disabling, and
uninstalling. Local GoDaddy CLI and application materials may inform future
work, but every instruction must be rewritten for the public production
contract before publication. Shopify apps and WordPress plugins are analogies
for the extensibility model, not separate integration targets.

## Implementation order

1. Import and correct `gddy` for production-only use.
2. Add the public Domains MCP and implement `domains` with progressive
   references for discovery/registration, DNS, and lifecycle management.
3. Implement `godaddy-api` for direct REST integration and shared reliability.
4. Resolve the two broken Hosting guide links, then implement `hosting`.
5. Reconcile Commerce skills with forthcoming public documentation.
6. Obtain and publish the GoDaddy platform-app contract, then implement
   `platform-apps` against that public production surface.
