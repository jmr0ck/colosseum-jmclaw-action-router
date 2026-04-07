# Plan (Hackathon + BlinkGuard Next)

## Goal
Ship a working “Action Router” that can ingest a Solana Action URL and safely execute it with policy + simulation + audit.

## Product evolution
BlinkGuard should extend beyond Action/Blink simulation into a broader crypto trust layer that helps users:
- verify suspicious links
- understand signing intent
- evaluate source/account trust context
- slow down before risky clicks and signatures

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

## Next-phase roadmap

### P1 — Education-first trust UX
- [ ] Replace purely meme/degen framing with clearer pre-sign explanation structure
- [ ] Standardize outputs around: what it does / what looks risky / what to verify next
- [ ] Keep CTA consistent: `Verify before signing.`

### P2 — Browser extension V1
- [ ] Extension popup for manual link check
- [ ] Context-menu entry: `Check with BlinkGuard`
- [ ] Compact page trust context for crypto-relevant pages
- [ ] Deep-analysis handoff to main BlinkGuard surface

### P3 — X trust context
- [ ] Profile/page-level trust context on X
- [ ] Signals: rename frequency, identity mismatch, linked destination mismatch, urgency-heavy CTA behavior
- [ ] Integrate Sorsa as a source-intelligence evidence layer
- [ ] Present source risk as caution context, not accusation

### P4 — Pre-sign clarity
- [ ] Summarize transfer / approval / authority / unknown behavior in plain English
- [ ] Show confidence and uncertainty explicitly
- [ ] Reduce blind-signing risk through better warning hierarchy

### P5 — Measurement
- [ ] Persist post/log metadata for BlinkGuard growth content
- [ ] Track save/share-quality proxies and high-intent user questions
- [ ] Log feature usage for link checks and deep-analysis handoffs
