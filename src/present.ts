import { scoreRisk, verdictFromScore } from './risk.js';

export function formatShort(report: any): string {
  const { score, signals } = scoreRisk(report);
  const verdict = verdictFromScore(score);
  const verdictWord = verdict === 'RUG' ? '🚩 RUGGY' : verdict === 'MID' ? '🟡 MID' : '✅ REAL-ish';

  const title = report?.get?.title ?? '(no title)';
  const host = safeHost(report?.actionUrl);

  const top = signals.filter((s: any) => s.code !== 'CLEAN');

  // Compact “mobile-card” style summary
  const simOk = report?.simulation?.ok;
  const touchedN = report?.tx?.touchedProgramIds?.length ?? 0;

  const badges: string[] = [];
  badges.push(simOk === false ? 'SIM:FAIL' : simOk === true ? 'SIM:OK' : 'SIM:?' );
  badges.push(`PROGS:${touchedN}`);
  if (top.some((s: any) => s.code === 'EPHEMERAL_HOST' || s.code === 'TLD_RISK')) badges.push('HOST:RISK');
  if (top.some((s: any) => s.code === 'AGENT_EXEC')) badges.push('AGENT');

  const reasons = top
    .slice(0, 2)
    .map((s: any) => `- ${s.message}`);

  const intent = report?.intent;
  const intentLine = (() => {
    const ixs = intent?.instructions ?? [];
    if (!Array.isArray(ixs) || ixs.length === 0) return null;
    const first = ixs.find((x: any) => x.kind && x.kind !== 'unknown') ?? ixs[0];
    if (!first) return null;
    if (first.kind === 'transfer' && first.program === 'system') return 'Intent: SOL transfer';
    if (first.kind === 'approve' && first.program === 'spl-token') return 'Intent: token approval (delegate)';
    if (first.kind === 'transfer' && first.program === 'spl-token') return 'Intent: token transfer';
    if (first.kind === 'transferChecked') return 'Intent: token transfer (checked)';
    if (first.kind === 'setAuthority') return 'Intent: token authority change';
    return `Intent: ${first.program}:${first.kind}`;
  })();

  const warn = (intent?.warnings ?? []).slice(0, 2).map((w: string) => `- ⚠️ ${w.replaceAll('_', ' ')}`);

  const lines: string[] = [];
  lines.push(`${verdictWord}  (${score}/100)`);
  lines.push(`${title}${host ? ` — ${host}` : ''}`);
  lines.push(`〔${badges.join(' · ')}〕`);
  if (intentLine) lines.push(intentLine);
  if (warn.length) lines.push(...warn);
  if (reasons.length) lines.push(...reasons);
  else lines.push('- no obvious red flags (MVP heuristics)');

  lines.push('');
  lines.push('Sim-only. No send.');
  return lines.join('\n');
}

export function formatEli5(report: any): string {
  const { score, signals } = scoreRisk(report);
  const verdict = verdictFromScore(score);

  const verdictLine =
    verdict === 'RUG'
      ? '🚩 This looks risky. I would NOT sign this from your main wallet.'
      : verdict === 'MID'
        ? '🟡 This is unclear. It might be fine, but you should be careful.'
        : '✅ This looks normal-ish for a Solana action, but still double-check.';

  const simOk = report?.simulation?.ok;
  const simLine = simOk ? 'Simulation ran OK.' : 'Simulation failed (that’s a red flag).';

  const why = signals.slice(0, 5).map((s: any) => `- ${s.message}`);

  return [verdictLine, simLine, '', 'Why I think that:', ...why].join('\n');
}

export function formatReceipts(report: any): string {
  const touched: string[] = report?.tx?.touchedProgramIds ?? [];
  const simOk = report?.simulation?.ok;
  const simErr = report?.simulation?.err;
  const logs: string[] = (report?.simulation?.logs ?? []).slice(0, 12);

  const lines: string[] = [];
  lines.push('🧾 Receipts');
  lines.push(`Action URL: ${report.actionUrl}`);
  lines.push('');
  lines.push(`Touched programs (${touched.length}):`);
  for (const p of touched.slice(0, 20)) lines.push(`- ${p}`);
  if (touched.length > 20) lines.push(`- ... (+${touched.length - 20} more)`);
  // Intent
  const intent = report?.intent;
  if (intent?.instructions?.length) {
    lines.push('');
    lines.push('Intent (best-effort):');
    for (const ix of intent.instructions.slice(0, 8)) {
      const bits = [`${ix.program}:${ix.kind}`];
      if (ix.amount) bits.push(`amt=${ix.amount}`);
      if (ix.mint) bits.push(`mint=${ix.mint}`);
      if (ix.from) bits.push(`from=${ix.from}`);
      if (ix.to) bits.push(`to=${ix.to}`);
      if (ix.details) bits.push(ix.details);
      lines.push(`- ${bits.join(' ')}`);
    }
    if (intent.instructions.length > 8) lines.push(`- ... (+${intent.instructions.length - 8} more)`);
    if (intent.warnings?.length) {
      lines.push('');
      lines.push('Intent warnings:');
      for (const w of intent.warnings.slice(0, 8)) lines.push(`- ⚠️ ${w}`);
    }
  }

  lines.push('');
  lines.push(`Simulation: ${simOk ? 'OK' : 'FAIL'}`);
  if (!simOk && simErr) lines.push(`Sim err: ${simErr}`);
  if (logs.length) {
    lines.push('');
    lines.push('Top logs:');
    for (const l of logs) lines.push(`- ${l}`);
  }
  return lines.join('\n');
}

export function formatShare(report: any): string {
  const { score, signals } = scoreRisk(report);
  const verdict = verdictFromScore(score);
  const verdictWord = verdict === 'RUG' ? '🚩 RUGGY' : verdict === 'MID' ? '🟡 MID' : '✅ REAL-ish';
  const host = safeHost(report?.actionUrl);
  const title = report?.get?.title ?? 'Solana action';

  const top = signals.filter((s: any) => s.code !== 'CLEAN').slice(0, 2).map((s: any) => s.message);
  const why = top.length ? top.join(' | ') : 'no obvious red flags (MVP)';

  return `BlinkGuard: ${verdictWord} (${score}/100) — ${title}${host ? ` @ ${host}` : ''}. Why: ${why}. (Sim-only, no send)`;
}

function safeHost(u?: string): string | null {
  if (!u) return null;
  try {
    return new URL(u).hostname;
  } catch {
    return null;
  }
}
