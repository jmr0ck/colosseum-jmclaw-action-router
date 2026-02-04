# Plan (Hackathon)

## Goal
Ship a working “Action Router” that can ingest a Solana Action URL and safely execute it with policy + simulation + audit.

## Milestones

### M0 — Skeleton
- [ ] Repo structure
- [ ] Node tooling, lint, tsconfig

### M1 — Fetch + Parse
- [ ] Accept input URL formats:
  - `solana-action:https://...`
  - `https://dial.to/?action=...`
- [ ] GET metadata endpoint
- [ ] POST to obtain transaction

### M2 — Simulate + Risk report
- [ ] RPC: `getLatestBlockhash`, `simulateTransaction`
- [ ] Extract:
  - fee payer
  - accounts touched
  - programs invoked (where possible)
  - CU estimate / logs

### M3 — Policy engine (YAML)
- [ ] Max spend limits
- [ ] Program allow/deny
- [ ] Token mint allow/deny
- [ ] “Require human approval” flags

### M4 — Execute + Confirm
- [ ] Versioned tx support
- [ ] Priority fee option (compute budget)
- [ ] Retry logic (blockhash expiry aware)

### M5 — Audit Trail
- [ ] Persist to JSONL / sqlite
- [ ] Emit a single audit object per task

## Stretch
- Dialect registry / verification integration
- Minimal web cockpit UI (read-only) for audit trail + approvals
