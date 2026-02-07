# BlinkGuard

<img src="./assets/blinkguard_logo.jpg" alt="BlinkGuard" width="220" />

Avatar icon (for Telegram): `assets/blinkguard_logo.jpg`

Colosseum Agent Hackathon (Feb 2–12, 2026)

## One-liner
Paste any Solana link → BlinkGuard finds the underlying **Action/Blink**, **simulates** it, and returns a degen-friendly **REAL/MID/RUG** verdict.

## What works right now (MVP)
- ✅ Action/Blink URL normalization (dial.to / solana-action / direct)
- ✅ **actions.json autodiscovery** (paste normal URLs like `https://jup.ag/swap/USDC-SOL`)
- ✅ Decode base64 **VersionedTransaction** + resolve ALTs + extract **touched program IDs**
- ✅ RPC **simulation** (simulate-only; does NOT send transactions)
- ✅ Telegram bot UX: short verdict + **ELI5 / Receipts / Share** + mini-game
- ✅ Batch scan (paste multiple links)

> Note: execution/signing is intentionally not enabled in this hackathon MVP.

## Web demo (local)
```bash
npm i
npm run dev:server
# open http://localhost:8787
```

## Telegram bot (local)
```bash
# set token via env var (recommended)
export TELEGRAM_BOT_TOKEN="..."

npm run dev:telegram

# in Telegram:
# /start
# /setwallet <your pubkey>
# paste any link
```

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
