# Surface routing

Choose one primary surface for each task. Do not make the user translate an
outcome into an API version or service origin.

## Public Domains MCP

Use the bundled `godaddy-domains` server for public discovery:

- `domains_suggest` for name ideas and alternatives
- `domains_check_availability` for a current public availability indication

The server is public, unauthenticated, read-only, and safe to retry. It cannot
read a GoDaddy account, quote or purchase a domain, or modify DNS. Availability
can change at any moment; recheck through the authenticated quote workflow
before any purchase.

## `gddy` CLI

Invoke `$gddy` for interactive account work from a terminal. The CLI owns its
own installation, browser authentication, command discovery, and safe previews.
Use its current self-documentation (`gddy --help`, search, tree, and guides)
instead of copying remembered commands into this skill.

Good CLI outcomes include authenticated search, quoting, registration, domain
inventory, and DNS management. Forwarding, contacts, lock, renewal, and transfer
coverage can vary by release; discover first and fall back to REST when absent.

## Production REST

Use REST for generated applications, backend services, CI, batch workflows, or
CLI gaps. The origin is fixed at `https://api.godaddy.com` and credentials stay
in a trusted server or operator environment.

Fetch the current contracts before durable implementation:

- [Domains v3 OpenAPI](https://developer.godaddy.com/openapi/domains-v3.json)
- [Domains v2 OpenAPI](https://developer.godaddy.com/openapi/domains-v2.json)
- [Domains v1 OpenAPI](https://developer.godaddy.com/openapi/domains-v1.json)

Prefer v3 where it exposes the outcome. Use v1 or v2 only for capabilities v3
does not yet contain. Never expose an API-origin option or copy any alternate
environment from a generated contract into user-facing configuration.

## Decision table

| Outcome | Primary surface | Fallback or next step |
|---|---|---|
| Suggest or check a name without an account | `godaddy-domains` MCP | Authenticated v3 discovery when pricing context matters |
| Interactive account/domain operation | `$gddy` | REST when the installed release lacks it |
| Registration from an application | v3 REST quote and execute | Stop for user confirmation before execute |
| Account inventory or legacy settings | `$gddy` or v1/v2 REST | Use the live operation contract |
| DNS records and nameservers | `$gddy` or v3 REST | External DNS provider after delegation |
| Forwarding or transfer | `$gddy` if discovered, otherwise v2 REST | v1 only when the current contract requires it |

## Cross-capability boundaries

- Use `$hosting` to deploy Node.js applications; use this skill only for the
  domain and DNS side of connecting them.
- Use `$storefront` and `$payments` for Commerce shopper and money movement.
- Do not manage records at GoDaddy after the domain delegates authority to a
  third-party DNS provider.
