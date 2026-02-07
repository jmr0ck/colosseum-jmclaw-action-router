import { Connection } from '@solana/web3.js';

import { actionGet, actionPost, normalizeActionUrl } from './actions.js';
import { evaluatePolicy } from './policy.js';
import type { Policy, RouterReport } from './types.js';
import {
  decodeVersionedTransactionFromBase64,
  extractTouchedProgramIds,
  fetchLookupTableAccounts,
} from './tx.js';

export async function analyzeAction(opts: {
  actionUrlArg: string;
  rpcUrl: string;
  policy?: Policy;
  postBody?: Record<string, unknown>;
}): Promise<RouterReport> {
  const { actionUrlArg, rpcUrl, policy = {} } = opts;

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

  // 2) POST to get tx
  try {
    const { txBase64 } = await actionPost(actionUrl, opts.postBody ?? {});
    report.post = { endpoint: actionUrl, ok: true };

    if (!txBase64) {
      report.tx = null;
      report.policy = { passed: false, reasons: ['No transaction returned by POST'] };
      return report;
    }

    const bytes = Buffer.from(txBase64, 'base64');
    report.tx = { encoding: 'base64', lengthBytes: bytes.length };

    const vtx = decodeVersionedTransactionFromBase64(txBase64);

    const sig0 = vtx.signatures?.[0];
    if (sig0 && sig0.length === 64) {
      const { getBase58Decoder } = await import('@solana/kit');
      report.tx.signature = getBase58Decoder().decode(sig0 as any);
    }

    const connection = new Connection(rpcUrl);
    const lookupTables = await fetchLookupTableAccounts({ connection, tx: vtx });
    const touchedProgramIds = extractTouchedProgramIds({ tx: vtx, lookupTables });
    report.tx.touchedProgramIds = touchedProgramIds;

    // 3) Simulate
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

    // 4) Policy
    const policyEval = evaluatePolicy({ policy, touchedProgramIds });
    report.policy.passed = policyEval.passed && !policy.requireApproval;
    report.policy.reasons = policyEval.reasons;
    if (policy.requireApproval) report.policy.passed = false;

    return report;
  } catch (e: any) {
    report.post = { endpoint: actionUrl, ok: false, error: String(e?.message ?? e) };
    report.policy = { passed: false, reasons: ['POST failed'] };
    return report;
  }
}
