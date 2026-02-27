export type RiskSignal = {
  code: string;
  severity: 'info' | 'low' | 'med' | 'high';
  message: string;
};

// Very lightweight heuristics for MVP. We can evolve this into a real policy engine.
export function scoreRisk(report: {
  actionUrl: string;
  get?: { title?: string; description?: string; label?: string } | null;
  simulation?: { ok: boolean; err?: string; logs?: string[] };
  tx?: { touchedProgramIds?: string[] } | null;
}): { score: number; signals: RiskSignal[] } {
  let score = 0;
  const signals: RiskSignal[] = [];

  const touched = report.tx?.touchedProgramIds ?? [];

  // Sim failure is a big red flag.
  if (report.simulation && report.simulation.ok === false) {
    score += 55;
    signals.push({
      code: 'SIM_FAIL',
      severity: 'high',
      message: 'simulation failed (often means broken / blocked / ruggy)',
    });
  }

  // Intent warnings (if available)
  const intentWarnings: string[] = (report as any)?.intent?.warnings ?? [];
  if (intentWarnings.includes('UNLIMITED_TOKEN_APPROVAL')) {
    score += 25;
    signals.push({
      code: 'UNLIMITED_APPROVAL',
      severity: 'high',
      message: 'unlimited token approval detected (delegate can drain tokens)',
    });
  }
  if (intentWarnings.includes('TOKEN_AUTHORITY_CHANGE')) {
    score += 25;
    signals.push({
      code: 'AUTHORITY_CHANGE',
      severity: 'high',
      message: 'token authority change detected (can permanently seize control)',
    });
  }

  // Unknown/rare programs heuristic (very naive: just count).
  if (touched.length >= 6) {
    score += 15;
    signals.push({
      code: 'MANY_PROGRAMS',
      severity: 'med',
      message: `touches many programs (${touched.length})`,
    });
  } else if (touched.length === 0) {
    score += 10;
    signals.push({
      code: 'NO_PROGRAMS',
      severity: 'low',
      message: 'could not extract program IDs (maybe needs ALT fetch / unusual tx)',
    });
  }

  // Hostname heuristics
  try {
    const u = new URL(report.actionUrl);
    const host = u.hostname.toLowerCase();
    if (host.includes('ngrok') || host.includes('vercel') || host.includes('netlify')) {
      score += 10;
      signals.push({
        code: 'EPHEMERAL_HOST',
        severity: 'low',
        message: `host looks disposable (${host})`,
      });
    }
    if (host.endsWith('.xyz') || host.endsWith('.top')) {
      score += 6;
      signals.push({
        code: 'TLD_RISK',
        severity: 'low',
        message: `higher-risk TLD (${host})`,
      });
    }

    // Agent-executed context (heuristic): if the Action metadata looks agent/automation oriented,
    // raise caution because unattended execution magnifies risk.
    const text = `${report.get?.title ?? ''} ${report.get?.label ?? ''} ${report.get?.description ?? ''} ${u.pathname}`.toLowerCase();
    const agentLike = /\bagent\b|automation|autonomous|bot\b|x402|mcp|frames\b|scheduled|recurring|webhook|payment rail/.test(text);
    if (agentLike) {
      score += 8;
      signals.push({
        code: 'AGENT_EXEC',
        severity: 'med',
        message: 'looks agent/automation-oriented — unattended execution increases risk (verify extra hard)',
      });
    }
  } catch {
    // ignore
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // If nothing triggered, mark as low.
  if (signals.length === 0) {
    signals.push({ code: 'CLEAN', severity: 'info', message: 'no obvious red flags from MVP heuristics' });
  }

  return { score, signals };
}

export function verdictFromScore(score: number): 'REAL' | 'MID' | 'RUG' {
  if (score >= 70) return 'RUG';
  if (score >= 35) return 'MID';
  return 'REAL';
}
