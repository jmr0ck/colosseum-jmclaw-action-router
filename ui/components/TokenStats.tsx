import { useState, useEffect } from 'react';

interface TokenMetrics {
  address: string;
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  volume24h: number;
  holderCount: number;
  autonomousRevenue?: number; // ETH accumulated by agent for buyback
  productivityScore?: number; // AI agent productivity metric
}

interface TokenStatsProps {
  tokenAddress: string;
  refreshInterval?: number; // ms
}

export function TokenStats({ tokenAddress, refreshInterval = 30000 }: TokenStatsProps) {
  const [metrics, setMetrics] = useState<TokenMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        // Fetch from DEX or indexer
        const response = await fetch(`/api/tokens/${tokenAddress}/metrics`);
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [tokenAddress, refreshInterval]);

  if (loading) return <div className="token-stats loading">Loading...</div>;
  if (error) return <div className="token-stats error">{error}</div>;
  if (!metrics) return null;

  return (
    <div className="token-stats">
      <div className="token-header">
        <span className="token-name">{metrics.name}</span>
        <span className="token-symbol">{metrics.symbol}</span>
      </div>
      
      <div className="token-price">
        <span className="label">Price</span>
        <span className="value">${metrics.price.toFixed(6)}</span>
      </div>
      
      <div className="token-metrics">
        <div className="metric">
          <span className="label">Market Cap</span>
          <span className="value">${formatNumber(metrics.marketCap)}</span>
        </div>
        
        <div className="metric">
          <span className="label">24h Volume</span>
          <span className="value">${formatNumber(metrics.volume24h)}</span>
        </div>
        
        <div className="metric">
          <span className="label">Holders</span>
          <span className="value">{formatNumber(metrics.holderCount)}</span>
        </div>
        
        {metrics.autonomousRevenue !== undefined && (
          <div className="metric highlight">
            <span className="label">🤖 Agent Revenue (ETH)</span>
            <span className="value">{metrics.autonomousRevenue.toFixed(4)} ETH</span>
            <span className="subtext">Available for buyback</span>
          </div>
        )}
        
        {metrics.productivityScore !== undefined && (
          <div className="metric">
            <span className="label">📊 Productivity Score</span>
            <span className="value">{metrics.productivityScore}/100</span>
          </div>
        )}
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

export default TokenStats;
