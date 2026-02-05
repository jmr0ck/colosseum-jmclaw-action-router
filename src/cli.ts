#!/usr/bin/env node

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getBase58Decoder } from '@solana/kit';
import { Connection } from '@solana/web3.js';

import { actionGet, actionPost, normalizeActionUrl } from './actions.js';
import { evaluatePolicy } from './policy.js';
import { decodeVersionedTransactionFromBase64, extractTouchedProgramIds, fetchLookupTableAccounts } from './tx.js';
import type { Policy, RouterReport } from './types.js';

function usage() {
  console.log(`Usage:
  npm run dev -- <actionUrl> [--policy policy.yml] [--rpc <url>] [--out out.json]

Examples:
  npm run dev -- "solana-action:https://example.com/api/action"
  npm run dev -- "https://dial.to/?action=solana-action%3Ahttps%3A%2F%2Fexample.com%2Faction" --policy policy.yml
`);
}

function getArg(flag: string) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function main() {
  const actionUrlArg = process.argv[2];
  if (!actionUrlArg || actionUrlArg.startsWith('-')) {
    usage();
    process.exit(1);
  }

  const policyPath = getArg('--policy');
  const rpcUrl = getArg('--rpc') ?? 'https://api.devnet.solana.com';
  const outPath = getArg('--out');

  let policy: Policy = {};
  if (policyPath) {
    const { parse } = await import('yaml');
    policy = parse(readFileSync(resolve(policyPath), 'utf8')) as Policy;
  }

  const actionUrl = normalizeActionUrl(actionUrlArg);

  const report: RouterReport = {
    actionUrl,
    fetchedAt: new Date().toISOString(),
    get: null,
    post: { endpoint: actionUrl, ok: false },
    tx: null,
    policy: { passed: false, reasons: [] },
  };

  // 1) GET metadata
  try {
    report.get = await actionGet(actionUrl);
  } catch (e: any) {
    report.get = { error: { message: String(e?.message ?? e) } };
  }

  // 2) POST to get tx (best-effort default body)
  // NOTE: Different Actions require different POST bodies. For MVP we support empty/default.
  try {
    const { txBase64 } = await actionPost(actionUrl, {});
    report.post = { endpoint: actionUrl, ok: true };

    if (!txBase64) {
      report.tx = null;
      report.policy = { passed: false, reasons: ['No transaction returned by POST'] };
    } else {
      const bytes = Buffer.from(txBase64, 'base64');
      report.tx = { encoding: 'base64', lengthBytes: bytes.length };

      // Proper decode (VersionedTransaction)
      const vtx = decodeVersionedTransactionFromBase64(txBase64);

      // Signatures may be all-zero placeholders; still useful to surface.
      const sig0 = vtx.signatures?.[0];
      if (sig0 && sig0.length === 64) {
        report.tx.signature = getBase58Decoder().decode(sig0 as any);
      }

      // Resolve lookup tables (if any) so programIdIndex mapping is correct.
      const connection = new Connection(rpcUrl);
      const lookupTables = await fetchLookupTableAccounts({ connection, tx: vtx });
      const touchedProgramIds = extractTouchedProgramIds({ tx: vtx, lookupTables });
      report.tx.touchedProgramIds = touchedProgramIds;

      // Simulate (safe: does not send)
      try {
        const sim = await connection.simulateTransaction(vtx, {
          sigVerify: false,
          replaceRecentBlockhash: true,
          commitment: 'processed',
        } as any);
        report.simulation = {
          ok: sim.value.err == null,
          err: sim.value.err ? JSON.stringify(sim.value.err) : undefined,
          logs: sim.value.logs ?? undefined,
        };
      } catch (e: any) {
        report.simulation = { ok: false, err: String(e?.message ?? e) };
      }

      // Policy evaluation (denylist/allowlist + approval gate)
      const policyEval = evaluatePolicy({ policy, touchedProgramIds });
      report.policy.passed = policyEval.passed && !policy.requireApproval;
      report.policy.reasons = policyEval.reasons;

      if (policy.requireApproval) {
        report.policy.passed = false;
      }
    }
  } catch (e: any) {
    report.post = { endpoint: actionUrl, ok: false, error: String(e?.message ?? e) };
    report.policy = { passed: false, reasons: ['POST failed'] };
  }

  const out = JSON.stringify(report, null, 2);
  if (outPath) {
    mkdirSync(resolve(outPath, '..'), { recursive: true });
    writeFileSync(resolve(outPath), out);
    console.log(`Wrote report: ${outPath}`);
  } else {
    console.log(out);
  }

  console.log('\nNext: implement proper transaction decode + simulate + policy checks + execute.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
