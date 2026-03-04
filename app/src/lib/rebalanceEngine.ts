/**
 * Dynamic Rebalancing Engine
 * 
 * Automatically calculates portfolio rebalancing actions to maintain
 * target asset allocations. Suggests BUY/SELL actions when allocations
 * deviate beyond specified thresholds.
 */

export interface Asset {
  symbol: string;
  currentValue: number;
  targetPercentage: number; // Target allocation (0-100)
}

export interface RebalanceAction {
  symbol: string;
  action: 'BUY' | 'SELL';
  amountUsd: number;
  amountPercent: number; // Percentage of portfolio to buy/sell
  reason: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RebalanceSummary {
  totalActions: number;
  totalBuyValue: number;
  totalSellValue: number;
  actions: RebalanceAction[];
  portfolioDrift: number; // Average deviation from target
  recommendation: string;
}

/**
 * Generate rebalancing actions for portfolio assets
 * 
 * @param assets - Array of assets with current values and target percentages
 * @param thresholdPct - Deviation threshold (%) to trigger rebalancing (default: 5%)
 * @returns Array of recommended rebalancing actions
 */
export function generateRebalanceActions(
  assets: Asset[],
  thresholdPct: number = 5
): RebalanceAction[] {
  const totalPortfolioValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const actions: RebalanceAction[] = [];

  if (totalPortfolioValue === 0) return actions;

  assets.forEach(asset => {
    const currentPct = (asset.currentValue / totalPortfolioValue) * 100;
    const deviation = currentPct - asset.targetPercentage;
    const absDeviation = Math.abs(deviation);

    // Only generate action if deviation exceeds threshold
    if (absDeviation >= thresholdPct) {
      const amountToMove = (absDeviation / 100) * totalPortfolioValue;
      
      // Determine priority based on deviation severity
      let priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (absDeviation >= 15) priority = 'HIGH';
      else if (absDeviation >= 10) priority = 'MEDIUM';

      actions.push({
        symbol: asset.symbol,
        action: deviation > 0 ? 'SELL' : 'BUY',
        amountUsd: Number(amountToMove.toFixed(2)),
        amountPercent: Number(absDeviation.toFixed(2)),
        reason: `Current: ${currentPct.toFixed(1)}% | Target: ${asset.targetPercentage}% | Deviation: ${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}%`,
        priority
      });
    }
  });

  // Sort by priority (HIGH first) then by amount
  return actions.sort((a, b) => {
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.amountUsd - a.amountUsd;
  });
}

/**
 * Calculate rebalancing summary for portfolio
 * 
 * @param assets - Portfolio assets
 * @param thresholdPct - Deviation threshold
 * @returns Summary of rebalancing needs
 */
export function getRebalanceSummary(
  assets: Asset[],
  thresholdPct: number = 5
): RebalanceSummary {
  const actions = generateRebalanceActions(assets, thresholdPct);
  
  const totalBuyValue = actions
    .filter(a => a.action === 'BUY')
    .reduce((sum, a) => sum + a.amountUsd, 0);
    
  const totalSellValue = actions
    .filter(a => a.action === 'SELL')
    .reduce((sum, a) => sum + a.amountUsd, 0);

  // Calculate average portfolio drift
  const totalPortfolioValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const averageDrift = totalPortfolioValue > 0
    ? assets.reduce((sum, asset) => {
        const currentPct = (asset.currentValue / totalPortfolioValue) * 100;
        return sum + Math.abs(currentPct - asset.targetPercentage);
      }, 0) / assets.length
    : 0;

  // Generate recommendation
  let recommendation = 'Portfolio is well balanced';
  if (actions.length > 0) {
    if (averageDrift >= 15) {
      recommendation = 'Immediate rebalancing recommended - significant drift detected';
    } else if (averageDrift >= 10) {
      recommendation = 'Consider rebalancing soon - moderate drift detected';
    } else {
      recommendation = 'Minor rebalancing suggested - slight drift detected';
    }
  }

  return {
    totalActions: actions.length,
    totalBuyValue: Number(totalBuyValue.toFixed(2)),
    totalSellValue: Number(totalSellValue.toFixed(2)),
    actions,
    portfolioDrift: Number(averageDrift.toFixed(2)),
    recommendation
  };
}

/**
 * Calculate optimal rebalancing with tax considerations
 * 
 * @param assets - Portfolio assets with cost basis
 * @param thresholdPct - Deviation threshold
 * @param considerTax - Whether to consider tax implications
 * @returns Rebalancing actions with tax-aware suggestions
 */
export function generateTaxAwareRebalance(
  assets: Array<Asset & { costBasis?: number }>,
  thresholdPct: number = 5,
  considerTax: boolean = true
): RebalanceAction[] {
  const actions = generateRebalanceActions(assets, thresholdPct);

  if (!considerTax) return actions;

  // Adjust actions based on tax implications
  return actions.map(action => {
    const asset = assets.find(a => a.symbol === action.symbol);
    
    // If selling and we have cost basis, consider tax impact
    if (action.action === 'SELL' && asset?.costBasis) {
      const gain = action.amountUsd - (asset.costBasis * (action.amountUsd / asset.currentValue));
      
      // Add tax note to reason if there's a significant gain
      if (gain > 1000) {
        const estimatedTax = gain * 0.2; // Assume 20% capital gains tax
        return {
          ...action,
          reason: `${action.reason} | Est. Tax: $${estimatedTax.toFixed(2)}`
        };
      }
    }
    
    return action;
  });
}

export default generateRebalanceActions;
