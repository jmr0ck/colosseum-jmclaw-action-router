/**
 * Token Launch Safety Score Module
 * 
 * Addresses CT sentiment on rug pull fatigue and ownership standards.
 * Provides safety scoring for token launches based on various factors.
 */

export interface SafetyScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: SafetyFactor[];
  flags: SafetyFlag[];
}

export interface SafetyFactor {
  name: string;
  weight: number;
  value: number; // 0-100
  description: string;
}

export interface SafetyFlag {
  type: 'warning' | 'danger' | 'info';
  message: string;
}

export interface TokenAnalysis {
  address: string;
  name: string;
  symbol: string;
  creator: string;
  deployer: string;
  mintAuthority: string;
  freezeAuthority: string;
  supply: number;
  holderDistribution: HolderTier[];
  liquidityLocked: boolean;
  liquidityLockExpiry?: number;
  contractAudited: boolean;
  auditReport?: string;
  teamAllocation?: number;
  communityAllocation?: number;
  vestingSchedule?: VestingSchedule[];
  taxConfig?: TaxConfig;
}

interface HolderTier {
  percentage: number;
  count: number;
  type: 'team' | 'investor' | 'community' | 'treasury';
}

interface VestingSchedule {
  beneficiary: string;
  startTime: number;
  endTime: number;
  totalAmount: number;
  releasedAmount: number;
}

interface TaxConfig {
  buyTax: number;
  sellTax: number;
  transferTax: number;
}

/**
 * Calculate overall safety score for a token
 */
export function calculateSafetyScore(analysis: TokenAnalysis): SafetyScore {
  const factors: SafetyFactor[] = [];
  const flags: SafetyFlag[] = [];
  
  // 1. Liquidity Lock (30% weight)
  const liquidityScore = analysis.liquidityLocked 
    ? (analysis.liquidityLockExpiry && analysis.liquidityLockExpiry > Date.now() + 365 * 24 * 60 * 60 * 1000 ? 100 : 70)
    : 0;
  factors.push({
    name: 'Liquidity Lock',
    weight: 0.30,
    value: liquidityScore,
    description: analysis.liquidityLocked 
      ? `Liquidity locked${analysis.liquidityLockExpiry ? ` until ${new Date(analysis.liquidityLockExpiry).toLocaleDateString()}` : ''}`
      : 'WARNING: Liquidity not locked'
  });
  if (!analysis.liquidityLocked) {
    flags.push({ type: 'danger', message: 'Liquidity is NOT locked - high rug risk' });
  }

  // 2. Mint/Freeze Authority (25% weight)
  const authorityScore = (!analysis.mintAuthority || analysis.mintAuthority === 'null') 
    && (!analysis.freezeAuthority || analysis.freezeAuthority === 'null')
    ? 100 
    : 25;
  factors.push({
    name: 'Authority Control',
    weight: 0.25,
    value: authorityScore,
    description: authorityScore === 100 
      ? 'Mint & freeze authorities disabled' 
      : 'WARNING: Contract authorities still active'
  });
  if (analysis.mintAuthority) {
    flags.push({ type: 'danger', message: 'Mint authority is active - unlimited supply possible' });
  }
  if (analysis.freezeAuthority) {
    flags.push({ type: 'warning', message: 'Freeze authority is active - tokens can be frozen' });
  }

  // 3. Holder Distribution (20% weight)
  const topHolderPct = analysis.holderDistribution
    .filter(h => h.type !== 'community')
    .reduce((sum, h) => sum + h.percentage, 0);
  let distributionScore = 100;
  if (topHolderPct > 50) distributionScore = 30;
  else if (topHolderPct > 30) distributionScore = 60;
  else if (topHolderPct > 20) distributionScore = 80;
  
  factors.push({
    name: 'Holder Distribution',
    weight: 0.20,
    value: distributionScore,
    description: `Top holders: ${topHolderPct.toFixed(1)}%`
  });
  if (topHolderPct > 50) {
    flags.push({ type: 'danger', message: `Concentration risk: ${topHolderPct.toFixed(1)}% held by insiders` });
  }

  // 4. Audit Status (15% weight)
  const auditScore = analysis.contractAudited ? 100 : 40;
  factors.push({
    name: 'Contract Audit',
    weight: 0.15,
    value: auditScore,
    description: analysis.contractAudited ? 'Contract audited' : 'NOT audited'
  });
  if (!analysis.contractAudited) {
    flags.push({ type: 'warning', message: 'Contract has not been audited' });
  }

  // 5. Vesting Schedule (10% weight)
  let vestingScore = 50; // default if no team allocation
  if (analysis.vestingSchedule && analysis.vestingSchedule.length > 0) {
    const hasLongVesting = analysis.vestingSchedule.some(v => 
      (v.endTime - v.startTime) > 180 * 24 * 60 * 60 * 1000 // 180 days
    );
    vestingScore = hasLongVesting ? 100 : 60;
  } else if (!analysis.teamAllocation || analysis.teamAllocation === 0) {
    vestingScore = 80; // No team allocation = fair launch
  }
  factors.push({
    name: 'Vesting Schedule',
    weight: 0.10,
    value: vestingScore,
    description: vestingScore >= 80 ? 'Fair launch or proper vesting' : 'Check vesting terms'
  });

  // Calculate weighted score
  const totalScore = factors.reduce((sum, f) => sum + (f.value * f.weight), 0);
  const score = Math.round(totalScore);
  
  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  // Add tax flags
  if (analysis.taxConfig) {
    if (analysis.taxConfig.buyTax > 10 || analysis.taxConfig.sellTax > 10) {
      flags.push({ 
        type: 'warning', 
        message: `High taxes: ${analysis.taxConfig.buyTax}% buy / ${analysis.taxConfig.sellTax}% sell` 
      });
    }
  }

  return { score, grade, factors, flags };
}

/**
 * Get safety recommendation based on score
 */
export function getSafetyRecommendation(score: SafetyScore): string {
  if (score.score >= 90) {
    return '✅ LOW RISK - Generally safe to participate';
  } else if (score.score >= 75) {
    return '⚠️ MEDIUM RISK - Caution advised, do your own research';
  } else if (score.score >= 60) {
    return '⚠️ ELEVATED RISK - High caution, likely to be a scam';
  } else {
    return '❌ HIGH RISK - Do not participate';
  }
}

export default calculateSafetyScore;
