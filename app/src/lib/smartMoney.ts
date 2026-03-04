/**
 * Smart Money & Whale Tracker
 * 
 * Calculates whale accumulation/distribution signals based on volume and price action.
 * This helps identify when "smart money" (institutional investors, whales) are entering
 * or exiting positions.
 */

export interface MarketData {
  currentVolume: number;
  avgVolume24h: number;
  priceChangePct: number;
}

export interface WhaleScore {
  score: number;
  signal: 'ACCUMULATE' | 'DISTRIBUTE' | 'NEUTRAL';
  volumeMultiplier: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Calculate whale score based on volume and price relationship
 * 
 * Logic:
 * - Volume > 2x average + Price UP = Whale Accumulation (buying)
 * - Volume > 2x average + Price DOWN = Whale Distribution (selling)
 * - Volume < 2x average = Neutral (no significant whale activity)
 * 
 * @param data - Market data including volume and price change
 * @returns Whale score (0-100) and signal
 */
export function calculateWhaleScore(data: MarketData): WhaleScore {
  const { currentVolume, avgVolume24h, priceChangePct } = data;
  
  let score = 50; // Start at neutral
  const volumeMultiplier = currentVolume / (avgVolume24h || 1);

  // Significant whale activity when volume is 2x+ average
  if (volumeMultiplier > 2) {
    if (priceChangePct > 0) {
      // Price up + high volume = Accumulation (whales buying)
      score += (volumeMultiplier * 10);
    } else {
      // Price down + high volume = Distribution (whales selling)
      score -= (volumeMultiplier * 10);
    }
  }

  // Clamp score to 0-100 range
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  // Determine signal based on score thresholds
  let signal: 'ACCUMULATE' | 'DISTRIBUTE' | 'NEUTRAL' = 'NEUTRAL';
  if (finalScore >= 70) signal = 'ACCUMULATE';
  if (finalScore <= 30) signal = 'DISTRIBUTE';

  // Calculate confidence based on volume multiplier
  let confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (volumeMultiplier > 3) confidence = 'HIGH';
  else if (volumeMultiplier > 2) confidence = 'MEDIUM';

  return {
    score: finalScore,
    signal,
    volumeMultiplier,
    confidence
  };
}

/**
 * Calculate smart money flow for multiple assets
 * 
 * @param assetsData - Array of market data for different assets
 * @returns Array of whale scores with asset symbols
 */
export function calculateSmartMoneyFlow(assetsData: Array<{ symbol: string } & MarketData>): Array<{
  symbol: string;
  score: WhaleScore;
}> {
  return assetsData.map(asset => ({
    symbol: asset.symbol,
    score: calculateWhaleScore(asset)
  }));
}

/**
 * Get whale activity summary for a portfolio
 * 
 * @param assetsData - Portfolio assets with market data
 * @returns Summary of whale activity across portfolio
 */
export function getPortfolioWhaleSummary(assetsData: Array<{ symbol: string } & MarketData>): {
  accumulationCount: number;
  distributionCount: number;
  neutralCount: number;
  averageScore: number;
  topAccumulation: string | null;
  topDistribution: string | null;
} {
  const scores = calculateSmartMoneyFlow(assetsData);
  
  const accumulationCount = scores.filter(s => s.score.signal === 'ACCUMULATE').length;
  const distributionCount = scores.filter(s => s.score.signal === 'DISTRIBUTE').length;
  const neutralCount = scores.filter(s => s.score.signal === 'NEUTRAL').length;
  
  const averageScore = Math.round(
    scores.reduce((sum, s) => sum + s.score.score, 0) / scores.length
  );
  
  const topAccumulation = scores
    .filter(s => s.score.signal === 'ACCUMULATE')
    .sort((a, b) => b.score.score - a.score.score)[0]?.symbol || null;
    
  const topDistribution = scores
    .filter(s => s.score.signal === 'DISTRIBUTE')
    .sort((a, b) => a.score.score - b.score.score)[0]?.symbol || null;

  return {
    accumulationCount,
    distributionCount,
    neutralCount,
    averageScore,
    topAccumulation,
    topDistribution
  };
}

export default calculateWhaleScore;
