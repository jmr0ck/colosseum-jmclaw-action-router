#!/usr/bin/env node

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getBase58Decoder } from '@solana/kit';

import { actionGet, actionPost, normalizeActionUrl } from './actions.js';
import { evaluatePolicy } from './policy.js';
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
    // Heuristic: use the actionUrl itself as endpoint.
    const { txBase64 } = await actionPost(actionUrl, {});
    report.post = { endpoint: actionUrl, ok: true };

    if (txBase64) {
      const bytes = Buffer.from(txBase64, 'base64');
      report.tx = { encoding: 'base64', lengthBytes: bytes.length };

      // Best-effort: decode first signature (tx is a serialized versioned tx)
      // We keep parsing minimal for now.
      const sig = bytes.subarray(1, 1 + 64); // not always correct; placeholder
      report.tx.signature = getBase58Decoder().decode(sig as any);

      // Best-effort program-id extraction is non-trivial without full message decode.
      // For now, no touched programs => policy evaluation is conservative.
      const policyEval = evaluatePolicy({ policy, touchedProgramIds: [] });
      report.policy.passed = policyEval.passed && !policy.requireApproval;
      report.policy.reasons = policyEval.reasons;

      // TODO: simulate + account/program extraction using kit decoders.
      void rpcUrl; // reserved
    } else {
      report.tx = null;
      report.policy = { passed: false, reasons: ['No transaction returned by POST'] };
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
