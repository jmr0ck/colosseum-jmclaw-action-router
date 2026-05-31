/**
 * Solder Cortex Integration for BlinkGuard
 * 
 * Adds conviction scoring to action routing security.
 * Verify wallet conviction before routing high-value actions.
 * 
 * Demo: http://76.13.193.103/
 */

const CORTEX_API = 'http://76.13.193.103/api';

export async function getConviction(wallet: string) {
  try {
    const res = await fetch(`${CORTEX_API}/conviction/${wallet}`);
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

export async function assessRouteRisk(wallet: string, actionValue: number) {
  const conviction = await getConviction(wallet);
  if (!conviction) return { risk: 'MEDIUM', reason: 'Unknown conviction' };
  
  if (conviction.score >= 0.8) return { risk: 'LOW', conviction, reason: 'High conviction - trusted' };
  if (conviction.score < 0.3 && actionValue > 1000) return { risk: 'HIGH', conviction, reason: 'Low conviction + high value' };
  return { risk: 'MEDIUM', conviction, reason: `Conviction: ${conviction.score.toFixed(2)}` };
}
