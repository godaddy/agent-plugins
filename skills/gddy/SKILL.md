---
name: gddy
description: Use GoDaddy's `gddy` CLI to search for domains, check availability and pricing, register domains, inspect an account's domains, and manage DNS records. Use when a user asks to run `gddy`, perform GoDaddy domain work from a terminal, parse CLI results, authenticate the CLI, or safely preview and apply DNS changes. Do not use for another registrar, for application source code that should call REST directly, or for GoDaddy Commerce storefront and payment work.
---

# GoDaddy CLI

Operate the production GoDaddy Domains CLI from its current self-documentation.
Treat domain registration as a financial action and DNS replacement or deletion
as potentially destructive.

## Workflow

1. Check for an existing installation with `gddy --version`. Do not reinstall
   or update a working CLI unless the user asks or the installed command is
   incompatible with the requested operation.
2. If installation is needed and authorized, use the official release installer
   from `godaddy/cli`, then verify with `gddy --version` and `gddy --help`.
3. Check account state with `gddy auth status`. Run `gddy auth login` only when
   authentication is required. Never print, request, or persist an access token
   in project files.
4. Discover the installed release before constructing a command. Use
   `gddy --help`, `gddy --search <keywords>`, `gddy tree`, and
   `gddy guide [topic]`. Prefer those results over remembered flags.
5. Classify the operation as read-only, state-changing, destructive, or
   financial. Read current state before a write when the command supports it.
6. Keep the CLI on its production default. Do not pass a service-origin or
   environment override.
7. Execute the narrowest command, inspect its structured result and error code,
   then verify changed state with a read command.

Read [references/cli-routing.md](references/cli-routing.md) for installation,
command discovery, current capability boundaries, and MCP or REST fallback.

## Domain registration

Run `gddy guide domain-purchase` and the relevant command help before buying a
domain. Follow the quote-and-execute flow exposed by the installed release.

Before the command that submits a purchase, show the user the exact domain,
term, total price, currency, required agreements, and registrant context. Obtain
explicit confirmation unless the user already authorized those exact details.
Do not reuse an expired quote or silently substitute another domain or term.

Domain purchase charges the account and is not reversible. If the response is
ambiguous or the request times out, inspect current domain or operation state
before retrying. Read
[references/reliability.md](references/reliability.md).

## DNS changes

List the relevant records before changing them. Use `gddy dns add` to append a
record; use `gddy dns set` only when replacing every record with the matching
type and name is intended; use `gddy dns delete` only when removing every match
is intended.

Run `set` and `delete` with `--dry-run` first and present the preview before
applying it unless the user already provided exact authorization. Never try to
modify GoDaddy-managed `NS` or `SOA` records. After a successful write, list the
affected type and name again. Do not treat resolver propagation as immediate.

## Completion report

State the CLI version, authenticated account context without exposing secrets,
commands or workflows used, state verified after writes, and any operation that
remains pending or requires the user's browser or billing action.

## Rules

- Do not confuse `gddy` with the older `godaddy` executable.
- Do not invent a command or flag when CLI discovery is available.
- Do not expose credentials in arguments, logs, generated code, or commits.
- Do not claim a domain purchase succeeded without verifying account or
  operation state.
- Do not retry registration, DNS append, or another non-idempotent action
  without checking state and preserving its idempotency mechanism.
- Do not send payment-card data through the CLI. `gddy payment-methods add`
  only opens the account workflow in a browser.
