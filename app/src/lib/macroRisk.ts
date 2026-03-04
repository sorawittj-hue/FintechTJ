/**
 * Macro Defcon Radar
 * 
 * Calculates overall market risk level based on multiple macroeconomic factors.
 * Returns a DEFCON level (1-5) indicating the current risk environment and
 * providing actionable advice for portfolio positioning.
 * 
 * DEFCON Levels:
 * - DEFCON 1 (Critical): Maximum risk - Move to stablecoins
 * - DEFCON 2 (High Risk): High risk - Reduce exposure
 * - DEFCON 3 (Neutral): Moderate risk - Hold positions
 * - DEFCON 4 (Bullish): Low risk - Accumulate
 * - DEFCON 5 (Euphoria): Very low risk - Take profits
 */

export interface MacroConditions {
  fearAndGreedIndex: number; // 0-100 (0=Extreme Fear, 100=Extreme Greed)
  btcVolatility30d: number; // 30-day volatility (e.g., 0.05 = 5%)
  isBtcAbove200MA: boolean; // Is BTC above 200-day moving average?
  vixLevel?: number; // Optional: VIX volatility index
  yieldCurveInverted?: boolean; // Optional: Is yield curve inverted?
}

export interface DefconResult {
  level: 1 | 2 | 3 | 4 | 5;
  status: 'CRITICAL' | 'HIGH RISK' | 'NEUTRAL' | 'BULLISH' | 'EUPHORIA';
  advice: string;
  riskScore: number; // 0-100 (0=Maximum Risk, 100=Minimum Risk)
  color: string; // UI color for the level
  factors: {
    fearAndGreedImpact: number;
    volatilityImpact: number;
    trendImpact: number;
  };
}

export interface DefconHistory {
  current: DefconResult;
  previous: DefconResult | null;
  trend: 'improving' | 'worsening' | 'stable';
}

/**
 * Calculate DEFCON level based on macro conditions
 * 
 * Scoring Logic:
 * - Start with Fear & Greed Index as base (0-100)
 * - Subtract penalty for high volatility
 * - Add/subtract based on trend (above/below 200 MA)
 * - Optional: Adjust for VIX and yield curve
 * 
 * @param conditions - Current macroeconomic conditions
 * @returns DEFCON level and analysis
 */
export function calculateDefconLevel(conditions: MacroConditions): DefconResult {
  let riskScore = conditions.fearAndGreedIndex; // Base score from F&G

  // Volatility penalty (high volatility = risky = lower score)
  const volatilityPenalty = conditions.btcVolatility30d * 100;
  riskScore -= volatilityPenalty;

  // Trend adjustment (above 200 MA = bullish = higher score)
  const trendAdjustment = conditions.isBtcAbove200MA ? 15 : -20;
  riskScore += trendAdjustment;

  // Optional: VIX adjustment (high VIX = fear = lower score)
  if (conditions.vixLevel !== undefined) {
    const vixNormal = 20; // Normal VIX level
    if (conditions.vixLevel > vixNormal) {
      riskScore -= (conditions.vixLevel - vixNormal) * 0.5;
    }
  }

  // Optional: Yield curve inversion (recession signal = lower score)
  if (conditions.yieldCurveInverted) {
    riskScore -= 15;
  }

  // Clamp to 0-100
  const finalScore = Math.max(0, Math.min(100, Math.round(riskScore)));

  // Determine DEFCON level
  let level: DefconResult['level'];
  let status: DefconResult['status'];
  let advice: string;
  let color: string;

  if (finalScore < 25) {
    level = 1;
    status = 'CRITICAL';
    advice = 'หนีเข้า Stablecoin ด่วน (Defcon 1)';
    color = 'text-red-500';
  } else if (finalScore < 45) {
    level = 2;
    status = 'HIGH RISK';
    advice = 'ลดพอร์ต ลดความเสี่ยง (Defcon 2)';
    color = 'text-orange-500';
  } else if (finalScore < 60) {
    level = 3;
    status = 'NEUTRAL';
    advice = 'ถือรอดูสถานการณ์ (Defcon 3)';
    color = 'text-yellow-500';
  } else if (finalScore < 80) {
    level = 4;
    status = 'BULLISH';
    advice = 'ซื้อสะสม (Defcon 4)';
    color = 'text-green-500';
  } else {
    level = 5;
    status = 'EUPHORIA';
    advice = 'ตลาดกาวจัด ทยอยทำกำไร (Defcon 5)';
    color = 'text-blue-500';
  }

  return {
    level,
    status,
    advice,
    riskScore: finalScore,
    color,
    factors: {
      fearAndGreedImpact: conditions.fearAndGreedIndex,
      volatilityImpact: -volatilityPenalty,
      trendImpact: trendAdjustment
    }
  };
}

/**
 * Compare current DEFCON with previous to determine trend
 * 
 * @param current - Current macro conditions
 * @param previous - Previous macro conditions (optional)
 * @returns DEFCON result with trend analysis
 */
export function getDefconWithTrend(
  current: MacroConditions,
  previous?: MacroConditions | null
): DefconHistory {
  const currentResult = calculateDefconLevel(current);
  
  let previousResult: DefconResult | null = null;
  let trend: DefconHistory['trend'] = 'stable';

  if (previous) {
    previousResult = calculateDefconLevel(previous);
    
    if (currentResult.riskScore > previousResult.riskScore + 5) {
      trend = 'improving';
    } else if (currentResult.riskScore < previousResult.riskScore - 5) {
      trend = 'worsening';
    }
  }

  return {
    current: currentResult,
    previous: previousResult,
    trend
  };
}

/**
 * Get recommended portfolio allocation based on DEFCON level
 * 
 * @param defconLevel - Current DEFCON level (1-5)
 * @returns Recommended allocation percentages
 */
export function getRecommendedAllocation(defconLevel: number): {
  crypto: number;
  stablecoin: number;
  description: string;
} {
  switch (defconLevel) {
    case 1: // Critical
      return {
        crypto: 0,
        stablecoin: 100,
        description: 'Exit all risky positions - preserve capital'
      };
    case 2: // High Risk
      return {
        crypto: 20,
        stablecoin: 80,
        description: 'Minimal exposure - defensive positioning'
      };
    case 3: // Neutral
      return {
        crypto: 50,
        stablecoin: 50,
        description: 'Balanced approach - wait for clarity'
      };
    case 4: // Bullish
      return {
        crypto: 75,
        stablecoin: 25,
        description: 'Aggressive accumulation - favorable conditions'
      };
    case 5: // Euphoria
      return {
        crypto: 60,
        stablecoin: 40,
        description: 'Take profits - market may be overextended'
      };
    default:
      return {
        crypto: 50,
        stablecoin: 50,
        description: 'Standard allocation'
      };
  }
}

/**
 * Get DEFCON color for UI components
 * 
 * @param level - DEFCON level (1-5)
 * @returns Tailwind CSS color classes
 */
export function getDefconColor(level: number): {
  bg: string;
  text: string;
  border: string;
  gradient: string;
} {
  const colors: Record<number, { bg: string; text: string; border: string; gradient: string }> = {
    1: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      gradient: 'from-red-500 to-red-600'
    },
    2: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200',
      gradient: 'from-orange-500 to-orange-600'
    },
    3: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      border: 'border-yellow-200',
      gradient: 'from-yellow-500 to-yellow-600'
    },
    4: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
      gradient: 'from-green-500 to-green-600'
    },
    5: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      gradient: 'from-blue-500 to-blue-600'
    }
  };

  return colors[level] || colors[3];
}

export default calculateDefconLevel;
