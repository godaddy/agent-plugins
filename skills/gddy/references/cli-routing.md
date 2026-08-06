# CLI routing

Use this reference for setup, capability selection, and command discovery.

## Install

Use an official release installer only when installation or update is in scope.

macOS, Linux, Git Bash, MSYS2, or Cygwin:

```bash
curl -fsSL https://github.com/godaddy/cli/releases/latest/download/install.sh | bash
```

Windows PowerShell:

```powershell
irm https://github.com/godaddy/cli/releases/latest/download/install.ps1 | iex
```

Verify with `gddy --version` and `gddy --help`. Authenticate through
`gddy auth login`; inspect state with `gddy auth status`.

## Discover the current command

The beta CLI evolves quickly. Use:

```bash
gddy --help
gddy --search <keywords>
gddy tree
gddy guide
gddy guide domain-purchase
```

Run group or command-specific `--help` before relying on an example below.

## Documented capability families

- Authentication: `gddy auth login`, `gddy auth status`
- Search: `gddy domain available`, `gddy domain suggest`
- Purchase preparation: `gddy domain quote`, `gddy domain agreements`,
  `gddy domain contacts init`
- Purchase: `gddy domain purchase`
- Account inventory: `gddy domain list`, `gddy domain get`
- DNS: `gddy dns list`, `gddy dns add`, `gddy dns set`, `gddy dns delete`
- Billing readiness: `gddy payment-methods add`

Forwarding, lock, renewal, transfer, and contact-update support can differ by
release. Discover before use; if absent, use the current public REST contract
rather than inventing a CLI form.

## Choose the surface

| Need | Preferred surface |
|---|---|
| Public domain suggestions or availability with no account | GoDaddy Domains MCP |
| Interactive account-aware domain or DNS work | `gddy` |
| Application code, CI, or an operation absent from `gddy` | Domains REST API |
| Storefront catalog, orders, or checkout readiness | Commerce MCP and the storefront skill |
| Charges, captures, refunds, or payment-provider state | Payments skill and an approved provider contract |

The public Domains MCP server is read-only and uses
`https://api.godaddy.com/v1/domains/mcp`. It cannot purchase domains or modify
DNS. For REST integration, fetch the current contracts instead of copying
remembered schemas:

- `https://developer.godaddy.com/openapi/domains-v3.json` for discovery,
  quote-and-register, operations, records, and nameservers
- `https://developer.godaddy.com/openapi/domains-v1.json` for account-scoped
  operations that are not available in v3
- `https://developer.godaddy.com/openapi/domains-v2.json` for customer-scoped
  actions, notifications, forwarding, and transfers
