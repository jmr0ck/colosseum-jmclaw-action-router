import { Connection } from '@solana/web3.js';

import { actionGet, actionPost, normalizeActionUrl } from './actions.js';
import { evaluatePolicy } from './policy.js';
import { scoreRisk, verdictFromScore } from './risk.js';
import type { Policy, RouterReport } from './types.js';
import {
  decodeVersionedTransactionFromBase64,
  extractIntentSummary,
  extractTouchedProgramIds,
  fetchLookupTableAccounts,
} from './tx.js';
import { loadXaiConfigFromEnv } from './xai.js';

async function xaiChat(prompt: string): Promise<string> {
  const { apiKey, baseUrl } = loadXaiConfigFromEnv();
  const url = `${baseUrl}/v1/chat/completions`;

  const body = {
    model: 'grok-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1024,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`xAI chat failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  return json.choices[0].message.content;
}

export async function analyzeAction(opts: {
  actionUrlArg: string;
  rpcUrl: string;
  policy?: Policy;
  postBody?: Record<string, unknown>;
  scamSimulate?: number; // Number of scam variants to simulate (3-5)
}): Promise<RouterReport> {
  const { actionUrlArg, rpcUrl, policy = {}, scamSimulate = 0 } = opts;

  const actionUrl = normalizeActionUrl(actionUrlArg);

  const report: RouterReport & { scamVariants?: any[] } = {
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
    const { txBase64, endpoint: usedEndpoint } = await actionPost(actionUrl, opts.postBody ?? {});
    report.post = { endpoint: usedEndpoint ?? actionUrl, ok: true };

    if (!txBase64) {
      report.tx = null;
      report.policy = { passed: false, reasons: ['No transaction returned by POST'] };
      if (scamSimulate > 0) report.scamVariants = [];
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

    // Intent (best-effort)
    try {
      (report as any).intent = extractIntentSummary({ tx: vtx, lookupTables });
    } catch (e: any) {
      (report as any).intent = { error: String(e?.message ?? e) };
    }

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

    // 5) Risk (heuristic)
    const { score, signals } = scoreRisk(report as any);
    (report as any).risk = { score, verdict: verdictFromScore(score), signals };

  } catch (e: any) {
    report.post = { endpoint: actionUrl, ok: false, error: String(e?.message ?? e) };
    report.policy = { passed: false, reasons: ['POST failed'] };
    if (scamSimulate > 0) report.scamVariants = [];
    return report;
  }

  // Scam Simulator
  if (scamSimulate > 0) {
    report.scamVariants = [];
    const numVariants = Math.min(Math.max(scamSimulate, 3), 5);

    // Generate variant params using Grok
    const getMetadata = report.get;
    if (!getMetadata || 'error' in getMetadata) {
      report.scamVariants.push({ error: 'No valid GET metadata for variant generation' });
      return report;
    }

    const prompt = `Given this Solana Blink action metadata:
${JSON.stringify(getMetadata, null, 2)}

Generate ${numVariants} scam variant parameter sets by altering the parameters to simulate common scams (e.g., change recipient to steal funds, malicious amounts, fake approvals). Output as JSON array of objects, each object being a POST body.`;

    let variantParamsList: Record<string, unknown>[] = [];
    try {
      const grokResponse = await xaiChat(prompt);
      variantParamsList = JSON.parse(grokResponse);
      if (!Array.isArray(variantParamsList)) throw new Error('Not an array');
    } catch (e: any) {
      report.scamVariants.push({ error: `Variant generation failed: ${String(e)}` });
      return report;
    }

    for (let i = 0; i < variantParamsList.length; i++) {
      const variantParams = variantParamsList[i];
      const variantReport: any = { params: variantParams };

      try {
        const { txBase64 } = await actionPost(actionUrl, variantParams);
        if (!txBase64) {
          variantReport.error = 'No transaction returned';
          report.scamVariants.push(variantReport);
          continue;
        }

        const vtx = decodeVersionedTransactionFromBase64(txBase64);
        const connection = new Connection(rpcUrl);
        const lookupTables = await fetchLookupTableAccounts({ connection, tx: vtx });
        const touchedProgramIds = extractTouchedProgramIds({ tx: vtx, lookupTables });

        const sim = await connection.simulateTransaction(vtx, {
          sigVerify: false,
          replaceRecentBlockhash: true,
          commitment: 'processed',
        } as any);

        const policyEval = evaluatePolicy({ policy, touchedProgramIds });

        const riskScore = calculateRiskScore(policyEval, sim);
        const explanation = generateExplanation(policyEval, sim);

        variantReport.riskScore = riskScore;
        variantReport.explanation = explanation;
        variantReport.subReport = {
          tx: { touchedProgramIds },
          simulation: {
            ok: sim.value.err == null,
            err: sim.value.err ? JSON.stringify(sim.value.err) : undefined,
          },
          policy: policyEval,
        };
      } catch (e: any) {
        variantReport.error = String(e);
      }

      report.scamVariants.push(variantReport);
    }
  }

  return report;
}

function calculateRiskScore(policyEval: { passed: boolean; reasons: string[] }, sim: any): number {
  let score = 0;
  if (!policyEval.passed) score += policyEval.reasons.length * 2;
  if (sim?.value?.err != null) score += 5;
  return Math.min(score, 10);
}

function generateExplanation(policyEval: { passed: boolean; reasons: string[] }, sim: any): string {
  const parts: string[] = [];
  if (!policyEval.passed) parts.push(`Policy failed: ${policyEval.reasons.join(', ')}`);
  if (sim.value.err) parts.push(`Simulation error: ${JSON.stringify(sim.value.err)}`);
  return parts.join('; ') || 'No issues detected';
}
