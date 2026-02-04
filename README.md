# Blinks-as-Tasks: Agent-native Action Router

Colosseum Agent Hackathon (Feb 2–12, 2026)

## One-liner
Turn Solana **Actions / Blinks** into safe, policy-checked **tasks** an agent (or supervised human) can execute.

## Why
Agents don’t click UI. They consume APIs and sign transactions.
Actions/Blinks are the missing distribution primitive: a URL that carries a signable transaction flow across any surface.

This project builds:
- **Action ingestion**: accept `solana-action:` URLs or dial.to / blinks links
- **Validation**: optional allowlist / Dialect registry checks
- **Simulation**: dry-run / CU estimate / expected accounts
- **Policy layer**: spend limits, token allow/deny, program allow/deny, required approvals
- **Execution**: build + sign + send versioned txs with optional priority fees
- **Audit trail**: store what happened (inputs → tx → signature → result)

## MVP (Hackathon scope)
1) CLI that takes an Action URL and produces:
   - parsed metadata (GET)
   - a signable tx (POST)
   - simulation report
2) Policy gate (YAML):
   - max SOL spend
   - allowlist program IDs
   - denylist token mints
3) Execute + confirm with retries (blockhash expiry aware)
4) Output an audit JSON blob.

## Tech
- TypeScript
- `@solana/actions` (Action spec)
- `@solana/kit` (tx building, codecs)
- Optional: `@solana/web3-compat` only at boundaries

## Next
See `docs/PLAN.md`.
