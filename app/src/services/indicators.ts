/**
 * Technical Indicator Engine
 * 
 * Provides calculation of various technical indicators from price data.
 * All calculations are done client-side for real-time updates.
 * 
 * Features:
 * - Trend Indicators: SMA, EMA, MACD, ADX
 * - Momentum Indicators: RSI, Stochastic RSI, CCI, Williams %R
 * - Volatility Indicators: Bollinger Bands, ATR, Keltner Channels
 * - Volume Indicators: OBV, VWAP, Volume Profile
 * - Support/Resistance: Pivot Points, Fibonacci Retracement
 * - Pattern Detection: Support/Resistance levels, Reversal patterns, Trend detection
 */


// ============================================================================
// Type Definitions
// ============================================================================

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RSIData {
  value: number;
  signal: 'oversold' | 'neutral' | 'overbought';
  trend: 'up' | 'down' | 'sideways';
}

export interface MACDData {
  macd: number;
  signal: number;
  histogram: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export interface BollingerData {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  position: number; // % position within bands (0-100)
}

export interface ATRData {
  value: number;
  stopLoss: number; // ATR-based stop loss
}

export interface PivotPoints {
  pivot: number;
  resistance1: number;
  resistance2: number;
  resistance3: number;
  support1: number;
  support2: number;
  support3: number;
}

export interface FibonacciLevels {
  level0: number;
  level236: number;
  level382: number;
  level500: number;
  level618: number;
  level786: number;
  level1000: number;
}

export interface SupportResistanceLevel {
  price: number;
  strength: number;
  type: 'support' | 'resistance';
  touches: number;
}

export interface Pattern {
  name: string;
  type: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  description: string;
}

export interface TrendData {
  direction: 'uptrend' | 'downtrend' | 'sideways';
  strength: number;
  duration: number;
}

export interface VWAPData {
  value: number;
  upperBand: number;
  lowerBand: number;
}

export interface OBVData {
  value: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface StochasticData {
  k: number;
  d: number;
  signal: 'oversold' | 'neutral' | 'overbought';
}

export interface CCIData {
  value: number;
  signal: 'oversold' | 'neutral' | 'overbought';
}

export interface WilliamsRData {
  value: number;
  signal: 'oversold' | 'neutral' | 'overbought';
}

export interface ADXData {
  value: number;
  plusDI: number;
  minusDI: number;
  trend: 'strong' | 'weak';
  direction: 'up' | 'down' | 'neutral';
}

export interface KeltnerData {
  upper: number;
  middle: number;
  lower: number;
}

export interface VolumeProfileData {
  poc: number; // Point of Control (most traded price)
  valueAreaHigh: number;
  valueAreaLow: number;
  profile: { price: number; volume: number }[];
}

export interface AllIndicators {
  rsi: RSIData;
  macd: MACDData;
  bollinger: BollingerData;
  sma: { [period: number]: number };
  ema: { [period: number]: number };
  atr: ATRData;
  vwap: VWAPData;
  obv: OBVData;
  stochastic: StochasticData;
  cci: CCIData;
  williamsR: WilliamsRData;
  adx: ADXData;
  pivotPoints: PivotPoints;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate mean of an array
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Get signal based on RSI value
 */
function getRSISignal(rsi: number): 'oversold' | 'neutral' | 'overbought' {
  if (rsi <= 30) return 'oversold';
  if (rsi >= 70) return 'overbought';
  return 'neutral';
}

/**
 * Get trend from price changes
 */
function getPriceTrend(prices: number[], lookback: number = 5): 'up' | 'down' | 'sideways' {
  if (prices.length < lookback) return 'sideways';
  const recent = prices.slice(-lookback);
  const firstHalf = mean(recent.slice(0, Math.floor(lookback / 2)));
  const secondHalf = mean(recent.slice(Math.floor(lookback / 2)));
  const diff = secondHalf - firstHalf;
  const threshold = firstHalf * 0.005; // 0.5% threshold

  if (diff > threshold) return 'up';
  if (diff < -threshold) return 'down';
  return 'sideways';
}

// ============================================================================
// Trend Indicators
// ============================================================================

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(prices: number[], period: number): number[] {
  if (period <= 0 || prices.length < period) return [];

  const sma: number[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    sma.push(mean(slice));
  }
  return sma;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(prices: number[], period: number): number[] {
  if (period <= 0 || prices.length === 0) return [];

  const multiplier = 2 / (period + 1);
  const ema: number[] = [prices[0]];

  for (let i = 1; i < prices.length; i++) {
    ema.push(prices[i] * multiplier + ema[i - 1] * (1 - multiplier));
  }

  return ema;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDData[] {
  if (prices.length < slowPeriod + signalPeriod) return [];

  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);

  // Align arrays
  const offset = slowEMA.length - fastEMA.length;
  const alignedFast = fastEMA.slice(offset);

  const macdLine: number[] = [];
  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push(alignedFast[i] - slowEMA[i]);
  }

  const signalLine = calculateEMA(macdLine, signalPeriod);
  const offset2 = macdLine.length - signalLine.length;

  const result: MACDData[] = [];
  for (let i = 0; i < signalLine.length; i++) {
    const macd = macdLine[i + offset2];
    const signal = signalLine[i];
    const histogram = macd - signal;

    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (macd > signal && histogram > 0) trend = 'bullish';
    else if (macd < signal && histogram < 0) trend = 'bearish';

    result.push({ macd, signal, histogram, trend });
  }

  return result;
}

/**
 * Calculate ADX (Average Directional Index)
 */
export function calculateADX(candles: CandleData[], period: number = 14): ADXData[] {
  if (candles.length < period * 2) return [];

  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];

    const trueRange = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );
    tr.push(trueRange);

    const upMove = curr.high - prev.high;
    const downMove = prev.low - curr.low;

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  // Smooth the values
  const smoothedTR = calculateEMA(tr, period);
  const smoothedPlusDM = calculateEMA(plusDM, period);
  const smoothedMinusDM = calculateEMA(minusDM, period);

  const result: ADXData[] = [];

  for (let i = 0; i < smoothedTR.length; i++) {
    const plusDI = (smoothedPlusDM[i] / smoothedTR[i]) * 100;
    const minusDI = (smoothedMinusDM[i] / smoothedTR[i]) * 100;
    const dx = (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;

    result.push({
      value: dx,
      plusDI,
      minusDI,
      trend: dx > 25 ? 'strong' : 'weak',
      direction: plusDI > minusDI ? 'up' : minusDI > plusDI ? 'down' : 'neutral'
    });
  }

  // Apply EMA smoothing to DX for ADX
  const adxValues = calculateEMA(result.map(r => r.value), period);

  return result.map((r, i) => ({
    ...r,
    value: adxValues[i] || r.value
  }));
}

// ============================================================================
// Momentum Indicators
// ============================================================================

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(prices: number[], period: number = 14): RSIData[] {
  if (prices.length < period + 1) return [];

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);

  // Calculate initial averages
  let avgGain = mean(gains.slice(0, period));
  let avgLoss = mean(losses.slice(0, period));

  const rsi: RSIData[] = [];

  for (let i = period; i < changes.length; i++) {
    // Smoothed averages
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const value = 100 - (100 / (1 + rs));

    // Determine trend from recent values
    const recentRSI = rsi.slice(-5).map(r => r?.value || value);
    recentRSI.push(value);

    let trend: 'up' | 'down' | 'sideways' = 'sideways';
    const prevMean = rsi.length > 0 ? mean(rsi.slice(-3).map(r => r.value)) : value;

    if (value > prevMean + 2) trend = 'up';
    else if (value < prevMean - 2) trend = 'down';

    rsi.push({
      value: Math.round(value * 10) / 10,
      signal: getRSISignal(value),
      trend
    });
  }

  return rsi;
}

/**
 * Calculate Stochastic RSI
 */
export function calculateStochasticRSI(prices: number[], rsiPeriod: number = 14, stochPeriod: number = 14, kPeriod: number = 3, dPeriod: number = 3): StochasticData[] {
  const rsiValues = calculateRSI(prices, rsiPeriod).map(r => r.value);
  if (rsiValues.length < stochPeriod + kPeriod) return [];

  const result: StochasticData[] = [];

  for (let i = stochPeriod - 1; i < rsiValues.length; i++) {
    const slice = rsiValues.slice(i - stochPeriod + 1, i + 1);
    const minRSI = Math.min(...slice);
    const maxRSI = Math.max(...slice);

    const k = maxRSI === minRSI ? 50 : ((rsiValues[i] - minRSI) / (maxRSI - minRSI)) * 100;
    result.push({ k, d: k, signal: getRSISignal(k) });
  }

  // Calculate %D (SMA of %K)
  const dValues = calculateSMA(result.map(r => r.k), dPeriod);
  const offset = result.length - dValues.length;

  return result.slice(offset).map((r, i) => ({
    ...r,
    d: dValues[i] || r.k
  }));
}

/**
 * Calculate CCI (Commodity Channel Index)
 */
export function calculateCCI(candles: CandleData[], period: number = 20): CCIData[] {
  if (candles.length < period) return [];

  const tp: number[] = candles.map(c => (c.high + c.low + c.close) / 3);
  const result: CCIData[] = [];

  for (let i = period - 1; i < tp.length; i++) {
    const slice = tp.slice(i - period + 1, i + 1);
    const smaTP = mean(slice);
    const meanDev = mean(slice.map(v => Math.abs(v - smaTP)));

    const value = meanDev === 0 ? 0 : (tp[i] - smaTP) / (0.015 * meanDev);

    let signal: 'oversold' | 'neutral' | 'overbought' = 'neutral';
    if (value <= -100) signal = 'oversold';
    if (value >= 100) signal = 'overbought';

    result.push({ value: Math.round(value * 10) / 10, signal });
  }

  return result;
}

/**
 * Calculate Williams %R
 */
export function calculateWilliamsR(candles: CandleData[], period: number = 14): WilliamsRData[] {
  if (candles.length < period) return [];

  const result: WilliamsRData[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const highest = Math.max(...slice.map(c => c.high));
    const lowest = Math.min(...slice.map(c => c.low));

    const range = highest - lowest;
    const value = range === 0 ? -50 : ((highest - candles[i].close) / range) * -100;

    let signal: 'oversold' | 'neutral' | 'overbought' = 'neutral';
    if (value <= -80) signal = 'oversold';
    if (value >= -20) signal = 'overbought';

    result.push({ value: Math.round(value * 10) / 10, signal });
  }

  return result;
}

// ============================================================================
// Volatility Indicators
// ============================================================================

/**
 * Calculate Bollinger Bands
 */
export function calculateBollinger(
  prices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerData[] {
  if (prices.length < period) return [];

  const sma = calculateSMA(prices, period);
  const result: BollingerData[] = [];

  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const middle = sma[i - period + 1];
    const std = stdDev(slice);

    const upper = middle + stdDevMultiplier * std;
    const lower = middle - stdDevMultiplier * std;
    const bandwidth = ((upper - lower) / middle) * 100;

    // Position within bands (0 = at lower, 100 = at upper)
    const range = upper - lower;
    const position = range === 0 ? 50 : ((prices[i] - lower) / range) * 100;

    result.push({
      upper: Math.round(upper * 100) / 100,
      middle: Math.round(middle * 100) / 100,
      lower: Math.round(lower * 100) / 100,
      bandwidth: Math.round(bandwidth * 100) / 100,
      position: Math.round(position * 10) / 10
    });
  }

  return result;
}

/**
 * Calculate ATR (Average True Range)
 */
export function calculateATR(candles: CandleData[], period: number = 14): ATRData[] {
  if (candles.length < 2) return [];

  const tr: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];

    const trueRange = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );
    tr.push(trueRange);
  }

  const atrValues = calculateEMA(tr, period);

  return atrValues.map((value, i) => ({
    value: Math.round(value * 100) / 100,
    stopLoss: Math.round((candles[i + period]?.close || candles[candles.length - 1].close) - value * 2)
  }));
}

/**
 * Calculate Keltner Channels
 */
export function calculateKeltner(
  candles: CandleData[],
  emaPeriod: number = 20,
  atrPeriod: number = 10,
  multiplier: number = 2
): KeltnerData[] {
  if (candles.length < Math.max(emaPeriod, atrPeriod)) return [];

  const ema = calculateEMA(candles.map(c => c.close), emaPeriod);
  const atr = calculateATR(candles, atrPeriod);

  const offset = ema.length - atr.length;
  const result: KeltnerData[] = [];

  for (let i = 0; i < atr.length; i++) {
    const middle = ema[i + offset];
    const atrValue = atr[i].value;

    result.push({
      upper: Math.round((middle + multiplier * atrValue) * 100) / 100,
      middle: Math.round(middle * 100) / 100,
      lower: Math.round((middle - multiplier * atrValue) * 100) / 100
    });
  }

  return result;
}

// ============================================================================
// Volume Indicators
// ============================================================================

/**
 * Calculate OBV (On Balance Volume)
 */
export function calculateOBV(candles: CandleData[]): OBVData[] {
  if (candles.length < 2) return [];

  const result: OBVData[] = [{ value: candles[0].volume, trend: 'neutral' }];

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];

    let obv = result[i - 1].value;

    if (curr.close > prev.close) {
      obv += curr.volume;
    } else if (curr.close < prev.close) {
      obv -= curr.volume;
    }

    // Determine trend from last 5 periods
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (i >= 5) {
      const recent = result.slice(-5).map(r => r.value);
      recent.push(obv);
      const trendValue = getPriceTrend(recent);
      trend = trendValue === 'up' ? 'up' : trendValue === 'down' ? 'down' : 'neutral';
    }

    result.push({ value: Math.round(obv), trend });
  }

  return result;
}

/**
 * Calculate VWAP (Volume Weighted Average Price)
 */
export function calculateVWAP(candles: CandleData[], period?: number): VWAPData[] {
  if (candles.length === 0) return [];

  const result: VWAPData[] = [];
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;

  const lookback = period || candles.length;

  for (let i = 0; i < candles.length; i++) {
    const tp = (candles[i].high + candles[i].low + candles[i].close) / 3;
    const pv = tp * candles[i].volume;

    cumulativeTPV += pv;
    cumulativeVolume += candles[i].volume;

    // Reset if period is specified
    if (period && i > 0 && i % period === 0) {
      cumulativeTPV = pv;
      cumulativeVolume = candles[i].volume;
    }

    const vwap = cumulativeVolume === 0 ? candles[i].close : cumulativeTPV / cumulativeVolume;
    const variance = calculateVariance(candles.slice(Math.max(0, i - lookback + 1), i + 1).map(c => c.close));
    const std = Math.sqrt(variance);

    result.push({
      value: Math.round(vwap * 100) / 100,
      upperBand: Math.round((vwap + 2 * std) * 100) / 100,
      lowerBand: Math.round((vwap - 2 * std) * 100) / 100
    });
  }

  return result;
}

/**
 * Calculate Volume Profile
 */
export function calculateVolumeProfile(candles: CandleData[], bins: number = 24): VolumeProfileData {
  if (candles.length === 0) {
    return { poc: 0, valueAreaHigh: 0, valueAreaLow: 0, profile: [] };
  }

  const minPrice = Math.min(...candles.map(c => c.low));
  const maxPrice = Math.max(...candles.map(c => c.high));
  const binSize = (maxPrice - minPrice) / bins;

  const profile: { price: number; volume: number }[] = [];

  for (let i = 0; i < bins; i++) {
    const binLow = minPrice + i * binSize;
    const binHigh = minPrice + (i + 1) * binSize;
    const binPrice = (binLow + binHigh) / 2;

    const volume = candles
      .filter(c => c.low <= binHigh && c.high >= binLow)
      .reduce((sum, c) => sum + c.volume, 0);

    profile.push({ price: binPrice, volume });
  }

  // Find Point of Control (POC)
  const poc = profile.reduce((max, p) => p.volume > max.volume ? p : max, profile[0]);

  // Calculate Value Area (70% of volume)
  const totalVolume = profile.reduce((sum, p) => sum + p.volume, 0);
  const targetVolume = totalVolume * 0.7;

  const sortedByVolume = [...profile].sort((a, b) => b.volume - a.volume);
  let accumulatedVolume = 0;
  const valueArea: typeof profile = [];

  for (const bin of sortedByVolume) {
    accumulatedVolume += bin.volume;
    valueArea.push(bin);
    if (accumulatedVolume >= targetVolume) break;
  }

  const valueAreaPrices = valueArea.map(v => v.price);

  return {
    poc: poc?.price || 0,
    valueAreaHigh: Math.max(...valueAreaPrices),
    valueAreaLow: Math.min(...valueAreaPrices),
    profile
  };
}

// ============================================================================
// Support/Resistance
// ============================================================================

/**
 * Calculate Pivot Points
 */
export function calculatePivotPoints(prevHigh: number, prevLow: number, prevClose: number): PivotPoints {
  const pivot = (prevHigh + prevLow + prevClose) / 3;

  return {
    pivot: Math.round(pivot * 100) / 100,
    resistance1: Math.round((2 * pivot - prevLow) * 100) / 100,
    resistance2: Math.round((pivot + (prevHigh - prevLow)) * 100) / 100,
    resistance3: Math.round((prevHigh + 2 * (pivot - prevLow)) * 100) / 100,
    support1: Math.round((2 * pivot - prevHigh) * 100) / 100,
    support2: Math.round((pivot - (prevHigh - prevLow)) * 100) / 100,
    support3: Math.round((prevLow - 2 * (prevHigh - pivot)) * 100) / 100
  };
}

/**
 * Calculate Fibonacci Retracement Levels
 */
export function calculateFibonacciRetracement(swingHigh: number, swingLow: number): FibonacciLevels {
  const diff = swingHigh - swingLow;

  return {
    level0: Math.round(swingHigh * 100) / 100,
    level236: Math.round((swingHigh - diff * 0.236) * 100) / 100,
    level382: Math.round((swingHigh - diff * 0.382) * 100) / 100,
    level500: Math.round((swingHigh - diff * 0.5) * 100) / 100,
    level618: Math.round((swingHigh - diff * 0.618) * 100) / 100,
    level786: Math.round((swingHigh - diff * 0.786) * 100) / 100,
    level1000: Math.round(swingLow * 100) / 100
  };
}

// ============================================================================
// Pattern Detection
// ============================================================================

/**
 * Detect Support and Resistance levels
 */
export function detectSupportResistance(
  candles: CandleData[],
  lookback: number = 50,
  touches: number = 2,
  tolerance: number = 0.005
): SupportResistanceLevel[] {
  if (candles.length < lookback) return [];

  const recent = candles.slice(-lookback);

  // Find local highs and lows
  const highs: number[] = [];
  const lows: number[] = [];

  for (let i = 2; i < recent.length - 2; i++) {
    const prev2 = recent[i - 2].high;
    const prev1 = recent[i - 1].high;
    const curr = recent[i].high;
    const next1 = recent[i + 1].high;
    const next2 = recent[i + 2].high;

    if (curr > prev1 && curr > prev2 && curr > next1 && curr > next2) {
      highs.push(curr);
    }

    const prev2L = recent[i - 2].low;
    const prev1L = recent[i - 1].low;
    const currL = recent[i].low;
    const next1L = recent[i + 1].low;
    const next2L = recent[i + 2].low;

    if (currL < prev1L && currL < prev2L && currL < next1L && currL < next2L) {
      lows.push(currL);
    }
  }

  // Cluster levels within tolerance
  const clusterLevels = (prices: number[], type: 'support' | 'resistance'): SupportResistanceLevel[] => {
    const clusters: { price: number; touches: number }[] = [];

    for (const price of prices) {
      const existing = clusters.find(c => Math.abs(c.price - price) / price < tolerance);
      if (existing) {
        existing.price = (existing.price * existing.touches + price) / (existing.touches + 1);
        existing.touches++;
      } else {
        clusters.push({ price, touches: 1 });
      }
    }

    return clusters
      .filter(c => c.touches >= touches)
      .map(c => ({
        price: Math.round(c.price * 100) / 100,
        strength: Math.min(c.touches * 20, 100),
        type,
        touches: c.touches
      }));
  };

  return [
    ...clusterLevels(highs, 'resistance'),
    ...clusterLevels(lows, 'support')
  ].sort((a, b) => b.strength - a.strength);
}

/**
 * Detect reversal patterns
 */
export function detectReversalPatterns(candles: CandleData[]): Pattern[] {
  if (candles.length < 5) return [];

  const patterns: Pattern[] = [];
  const last3 = candles.slice(-3);
  const [c1, c2, c3] = last3;

  // Doji
  const lastBody = Math.abs(c3.close - c3.open);
  const lastRange = c3.high - c3.low;
  if (lastBody / lastRange < 0.1) {
    patterns.push({
      name: 'Doji',
      type: 'neutral',
      confidence: 60,
      description: 'Indecision in the market'
    });
  }

  // Hammer / Hanging Man
  const lowerShadow = Math.min(c3.open, c3.close) - c3.low;
  const upperShadow = c3.high - Math.max(c3.open, c3.close);
  const body = Math.abs(c3.close - c3.open);

  if (lowerShadow > body * 2 && upperShadow < body * 0.5) {
    const prevTrend = c3.close > candles[candles.length - 5].close ? 'up' : 'down';
    patterns.push({
      name: prevTrend === 'down' ? 'Hammer' : 'Hanging Man',
      type: prevTrend === 'down' ? 'bullish' : 'bearish',
      confidence: 65,
      description: prevTrend === 'down' ? 'Potential bullish reversal' : 'Potential bearish reversal'
    });
  }

  // Engulfing
  const prevBody = Math.abs(c2.close - c2.open);
  const prevBullish = c2.close > c2.open;
  const currBullish = c3.close > c3.open;

  if (body > prevBody * 1.2 && prevBullish !== currBullish) {
    patterns.push({
      name: currBullish ? 'Bullish Engulfing' : 'Bearish Engulfing',
      type: currBullish ? 'bullish' : 'bearish',
      confidence: 70,
      description: 'Strong reversal signal'
    });
  }

  // Morning/Evening Star
  if (last3.length === 3) {
    const c1Body = Math.abs(c1.close - c1.open);
    const c2Body = Math.abs(c2.close - c2.open);
    const c1Bullish = c1.close > c1.open;
    const c3Bullish = c3.close > c3.open;

    if (c2Body < c1Body * 0.3 && c2Body < body * 0.3) {
      if (!c1Bullish && c3Bullish && c3.close > (c1.open + c1.close) / 2) {
        patterns.push({
          name: 'Morning Star',
          type: 'bullish',
          confidence: 75,
          description: 'Strong bullish reversal pattern'
        });
      }
      if (c1Bullish && !c3Bullish && c3.close < (c1.open + c1.close) / 2) {
        patterns.push({
          name: 'Evening Star',
          type: 'bearish',
          confidence: 75,
          description: 'Strong bearish reversal pattern'
        });
      }
    }
  }

  return patterns;
}

/**
 * Detect overall trend
 */
export function detectTrend(candles: CandleData[]): TrendData {
  if (candles.length < 20) {
    return { direction: 'sideways', strength: 0, duration: candles.length };
  }

  const closes = candles.map(c => c.close);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);

  const currentPrice = closes[closes.length - 1];
  const currentSMA20 = sma20[sma20.length - 1];
  const currentSMA50 = sma50[sma50.length - 1] || currentSMA20;

  // Determine direction
  let direction: 'uptrend' | 'downtrend' | 'sideways' = 'sideways';

  if (currentPrice > currentSMA20 && currentSMA20 > currentSMA50) {
    direction = 'uptrend';
  } else if (currentPrice < currentSMA20 && currentSMA20 < currentSMA50) {
    direction = 'downtrend';
  }

  // Calculate strength using ADX concept
  const priceChange = Math.abs(currentPrice - closes[closes.length - 20]) / closes[closes.length - 20];
  const strength = Math.min(priceChange * 1000, 100);

  // Find trend duration
  let duration = 0;
  for (let i = candles.length - 1; i >= 1; i--) {
    const currAboveSMA = closes[i] > (sma20[Math.max(0, i - 19)] || closes[i]);
    const prevAboveSMA = closes[i - 1] > (sma20[Math.max(0, i - 20)] || closes[i - 1]);

    if (direction === 'uptrend' && currAboveSMA !== prevAboveSMA) break;
    if (direction === 'downtrend' && currAboveSMA === prevAboveSMA) break;
    duration++;
  }

  return { direction, strength: Math.round(strength), duration };
}

// ============================================================================
// Utility Functions
// ============================================================================

function calculateVariance(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / values.length;
}

// ============================================================================
// Main Indicator Engine Class
// ============================================================================

export class IndicatorEngine {
  private candles: CandleData[] = [];
  private prices: number[] = [];

  constructor(candles?: CandleData[]) {
    if (candles) {
      this.setData(candles);
    }
  }

  setData(candles: CandleData[]) {
    this.candles = [...candles];
    this.prices = candles.map(c => c.close);
  }

  updateCandle(candle: CandleData) {
    this.candles.push(candle);
    this.prices.push(candle.close);
  }

  // RSI
  calculateRSI(period: number = 14): RSIData {
    const data = calculateRSI(this.prices, period);
    return data[data.length - 1] || { value: 50, signal: 'neutral', trend: 'sideways' };
  }

  // MACD
  calculateMACD(): MACDData {
    const data = calculateMACD(this.prices);
    return data[data.length - 1] || { macd: 0, signal: 0, histogram: 0, trend: 'neutral' };
  }

  // Bollinger Bands
  calculateBollinger(period: number = 20, stdDev: number = 2): BollingerData {
    const data = calculateBollinger(this.prices, period, stdDev);
    return data[data.length - 1] || { upper: 0, middle: 0, lower: 0, bandwidth: 0, position: 50 };
  }

  // SMA
  calculateSMA(period: number): number {
    const data = calculateSMA(this.prices, period);
    return data[data.length - 1] || 0;
  }

  // EMA
  calculateEMA(period: number): number {
    const data = calculateEMA(this.prices, period);
    return data[data.length - 1] || 0;
  }

  // ATR
  calculateATR(period: number = 14): ATRData {
    const data = calculateATR(this.candles, period);
    return data[data.length - 1] || { value: 0, stopLoss: 0 };
  }

  // Stochastic
  calculateStochastic(): StochasticData {
    const data = calculateStochasticRSI(this.prices);
    return data[data.length - 1] || { k: 50, d: 50, signal: 'neutral' };
  }

  // CCI
  calculateCCI(period: number = 20): CCIData {
    const data = calculateCCI(this.candles, period);
    return data[data.length - 1] || { value: 0, signal: 'neutral' };
  }

  // Williams %R
  calculateWilliamsR(period: number = 14): WilliamsRData {
    const data = calculateWilliamsR(this.candles, period);
    return data[data.length - 1] || { value: -50, signal: 'neutral' };
  }

  // ADX
  calculateADX(period: number = 14): ADXData {
    const data = calculateADX(this.candles, period);
    return data[data.length - 1] || { value: 0, plusDI: 0, minusDI: 0, trend: 'weak', direction: 'neutral' };
  }

  // VWAP
  calculateVWAP(): VWAPData {
    const data = calculateVWAP(this.candles);
    return data[data.length - 1] || { value: 0, upperBand: 0, lowerBand: 0 };
  }

  // OBV
  calculateOBV(): OBVData {
    const data = calculateOBV(this.candles);
    return data[data.length - 1] || { value: 0, trend: 'neutral' };
  }

  // Keltner Channels
  calculateKeltner(): KeltnerData {
    const data = calculateKeltner(this.candles);
    return data[data.length - 1] || { upper: 0, middle: 0, lower: 0 };
  }

  // Pivot Points
  calculatePivotPoints(): PivotPoints {
    if (this.candles.length < 2) {
      return { pivot: 0, resistance1: 0, resistance2: 0, resistance3: 0, support1: 0, support2: 0, support3: 0 };
    }
    const prev = this.candles[this.candles.length - 2];
    return calculatePivotPoints(prev.high, prev.low, prev.close);
  }

  // Support/Resistance
  detectSupportResistance(): SupportResistanceLevel[] {
    return detectSupportResistance(this.candles);
  }

  // Patterns
  detectPatterns(): Pattern[] {
    return detectReversalPatterns(this.candles);
  }

  // Trend
  detectTrend(): TrendData {
    return detectTrend(this.candles);
  }

  // Calculate all indicators at once
  calculateAll(): AllIndicators {
    return {
      rsi: this.calculateRSI(),
      macd: this.calculateMACD(),
      bollinger: this.calculateBollinger(),
      sma: {
        7: this.calculateSMA(7),
        20: this.calculateSMA(20),
        50: this.calculateSMA(50),
        200: this.calculateSMA(200)
      },
      ema: {
        12: this.calculateEMA(12),
        26: this.calculateEMA(26)
      },
      atr: this.calculateATR(),
      vwap: this.calculateVWAP(),
      obv: this.calculateOBV(),
      stochastic: this.calculateStochastic(),
      cci: this.calculateCCI(),
      williamsR: this.calculateWilliamsR(),
      adx: this.calculateADX(),
      pivotPoints: this.calculatePivotPoints()
    };
  }
}

// ============================================================================
// React Hook
// ============================================================================

import { useState, useCallback, useMemo } from 'react';

export interface UseIndicatorsResult {
  indicators: AllIndicators | null;
  rsi: RSIData | null;
  macd: MACDData | null;
  bollinger: BollingerData | null;
  loading: boolean;
  error: string | null;
  updateCandle: (candle: CandleData) => void;
  refresh: () => void;
}

/**
 * React hook for calculating technical indicators (legacy - use hooks/useIndicators instead)
 * @deprecated Use the useIndicators hook from @/hooks/useIndicators instead
 */
export function useIndicatorsLegacy(
  _symbol: string,
  initialData?: CandleData[]
): UseIndicatorsResult {
  const [candles, setCandles] = useState<CandleData[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);

  // Calculate all indicators and error state synchronously
  const { indicators, error } = useMemo(() => {
    if (candles.length < 20) {
      return { indicators: null, error: null };
    }
    try {
      const engine = new IndicatorEngine(candles);
      return { indicators: engine.calculateAll(), error: null };
    } catch (err) {
      console.warn("Failed to calculate indicators:", err);
      return {
        indicators: null,
        error: err instanceof Error ? err.message : 'Calculation error'
      };
    }
  }, [candles]);

  // Update with new candle
  const updateCandle = useCallback((candle: CandleData) => {
    setCandles(prev => [...prev.slice(-199), candle]); // Keep last 200 candles
  }, []);

  // Refresh (for manual recalculation)
  const refresh = useCallback(() => {
    setLoading(true);
    // Force recalculation
    setCandles(prev => [...prev]);
    setLoading(false);
  }, []);

  return {
    indicators,
    rsi: indicators?.rsi || null,
    macd: indicators?.macd || null,
    bollinger: indicators?.bollinger || null,
    loading,
    error,
    updateCandle,
    refresh
  };
}

export default IndicatorEngine;