/**
 * Futures Signal Engine
 *
 * Generates actionable trade signals for Futures markets:
 * - Crypto Futures (BTC, ETH, SOL, BNB, XRP, DOGE) — Binance real-time OHLCV
 * - Gold Futures (GC=F) — Yahoo Finance real OHLCV
 * - Oil Futures WTI (CL=F) — Yahoo Finance real OHLCV
 *
 * Signal logic:
 * - RSI divergence + MACD crossover + Bollinger Band squeeze → Entry signal
 * - ATR-based Stop Loss & dynamic Risk:Reward Take Profit
 * - Multi-timeframe confluence scoring
 * - Signal strength scoring (1-100)
 */

import { binanceAPI, type KlineData } from '@/services/binance';
import { fetchYahooOHLCV, type YahooKline } from '@/services/realDataService';
import {
  IndicatorEngine,
  type CandleData,
} from '@/services/indicators';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SignalDirection = 'LONG' | 'SHORT' | 'NEUTRAL';
export type SignalStrength = 'STRONG' | 'MODERATE' | 'WEAK';
export type AssetClass = 'CRYPTO' | 'GOLD' | 'OIL';
export type Timeframe = '15m' | '1h' | '4h' | '1d';
export type FuturesSignalSource = 'Binance' | 'Yahoo Finance';

export interface TradePlan {
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: number;
  positionSizePercent: number;
  maxLossPercent: number;
}

export interface SignalIndicators {
  rsi: number;
  rsiSignal: string;
  macdTrend: string;
  macdHistogram: number;
  bollingerPosition: number;
  atr: number;
  adxValue: number;
  adxTrend: string;
  trend: string;
  ema21: number;
  ema50: number;
  ema200: number;
  vwap: number;
}

export interface FuturesSignal {
  id: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  currentPrice: number;
  direction: SignalDirection;
  strength: SignalStrength;
  score: number;
  confidence: number; // 0-100 how many indicators agree
  timeframe: Timeframe;
  tradePlan: TradePlan;
  indicators: SignalIndicators;
  reasoning: string[];
  warnings: string[];
  patterns: string[]; // detected candlestick patterns
  timestamp: Date;
  source: FuturesSignalSource;
  dataTimestamp: Date;
  latencySeconds: number;
  isStale: boolean;
  change24h: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  volumeSpike: boolean; // volume > 2x average
  nearSupport: boolean;
  nearResistance: boolean;
  isActive: boolean;
}

export interface FuturesSignalSummary {
  totalLong: number;
  totalShort: number;
  totalNeutral: number;
  strongSignals: number;
  avgConfidence: number;
  bestSignal: FuturesSignal | null;
  marketBias: 'bullish' | 'bearish' | 'mixed';
  lastUpdated: Date;
}

export interface FuturesSignalDiagnostics {
  requestedAssets: number;
  successCount: number;
  failedCount: number;
  coveragePercent: number;
  staleCount: number;
  activeSignals: number;
  averageLatencySeconds: number;
  sources: Record<FuturesSignalSource, number>;
  failedSymbols: string[];
  errors: string[];
  fetchedAt: Date;
  durationMs: number;
}

export interface FuturesSignalSnapshot {
  signals: FuturesSignal[];
  summary: FuturesSignalSummary;
  diagnostics: FuturesSignalDiagnostics;
}

export type SortOption = 'score' | 'confidence' | 'change' | 'name';

const SIGNAL_STALE_THRESHOLDS_MS: Record<Timeframe, number> = {
  '15m': 20 * 60 * 1000,
  '1h': 90 * 60 * 1000,
  '4h': 6 * 60 * 60 * 1000,
  '1d': 36 * 60 * 60 * 1000,
};

export function isSignalStale(timeframe: Timeframe, latencySeconds: number): boolean {
  return latencySeconds * 1000 > SIGNAL_STALE_THRESHOLDS_MS[timeframe];
}

// ─── Asset Configuration ──────────────────────────────────────────────────────

interface AssetConfig {
  symbol: string;
  binanceSymbol: string;
  name: string;
  assetClass: AssetClass;
  atrMultiplierSL: number;
  tp1Multiplier: number;
  tp2Multiplier: number;
  tp3Multiplier: number;
  defaultLeverage: number;
}

const FUTURES_ASSETS: AssetConfig[] = [
  {
    symbol: 'BTC',
    binanceSymbol: 'BTC',
    name: 'Bitcoin',
    assetClass: 'CRYPTO',
    atrMultiplierSL: 1.5,
    tp1Multiplier: 1.5,
    tp2Multiplier: 3.0,
    tp3Multiplier: 5.0,
    defaultLeverage: 10,
  },
  {
    symbol: 'ETH',
    binanceSymbol: 'ETH',
    name: 'Ethereum',
    assetClass: 'CRYPTO',
    atrMultiplierSL: 1.5,
    tp1Multiplier: 1.5,
    tp2Multiplier: 3.0,
    tp3Multiplier: 5.0,
    defaultLeverage: 10,
  },
  {
    symbol: 'SOL',
    binanceSymbol: 'SOL',
    name: 'Solana',
    assetClass: 'CRYPTO',
    atrMultiplierSL: 2.0,
    tp1Multiplier: 1.5,
    tp2Multiplier: 3.0,
    tp3Multiplier: 5.0,
    defaultLeverage: 5,
  },
  {
    symbol: 'BNB',
    binanceSymbol: 'BNB',
    name: 'BNB',
    assetClass: 'CRYPTO',
    atrMultiplierSL: 1.5,
    tp1Multiplier: 1.5,
    tp2Multiplier: 2.5,
    tp3Multiplier: 4.0,
    defaultLeverage: 10,
  },
  {
    symbol: 'XRP',
    binanceSymbol: 'XRP',
    name: 'XRP',
    assetClass: 'CRYPTO',
    atrMultiplierSL: 2.0,
    tp1Multiplier: 1.5,
    tp2Multiplier: 3.0,
    tp3Multiplier: 5.0,
    defaultLeverage: 10,
  },
  {
    symbol: 'DOGE',
    binanceSymbol: 'DOGE',
    name: 'Dogecoin',
    assetClass: 'CRYPTO',
    atrMultiplierSL: 2.0,
    tp1Multiplier: 1.5,
    tp2Multiplier: 3.0,
    tp3Multiplier: 5.0,
    defaultLeverage: 5,
  },
  {
    symbol: 'XAU',
    binanceSymbol: 'XAU',
    name: 'ทองคำ (Gold)',
    assetClass: 'GOLD',
    atrMultiplierSL: 1.2,
    tp1Multiplier: 1.0,
    tp2Multiplier: 2.0,
    tp3Multiplier: 3.5,
    defaultLeverage: 20,
  },
  {
    symbol: 'WTI',
    binanceSymbol: 'WTI',
    name: 'น้ำมันดิบ (WTI Oil)',
    assetClass: 'OIL',
    atrMultiplierSL: 1.5,
    tp1Multiplier: 1.0,
    tp2Multiplier: 2.0,
    tp3Multiplier: 3.5,
    defaultLeverage: 10,
  },
];

// ─── Signal Scoring ───────────────────────────────────────────────────────────

function klineToCandle(k: KlineData | YahooKline): CandleData {
  return { time: k.time, open: k.open, high: k.high, low: k.low, close: k.close, volume: k.volume };
}

interface ScoreResult {
  direction: SignalDirection;
  score: number;
  strength: SignalStrength;
  confidence: number;
  reasoning: string[];
  warnings: string[];
  patterns: string[];
  volumeSpike: boolean;
  nearSupport: boolean;
  nearResistance: boolean;
}

interface SignalGenerationResult {
  symbol: string;
  source: FuturesSignalSource;
  signal: FuturesSignal | null;
  error: string | null;
}

function getSignalSource(config: AssetConfig): FuturesSignalSource {
  return config.assetClass === 'GOLD' || config.assetClass === 'OIL' ? 'Yahoo Finance' : 'Binance';
}

function scoreSignal(engine: IndicatorEngine, currentPrice: number): ScoreResult {
  const rsi = engine.calculateRSI(14);
  const macd = engine.calculateMACD();
  const bollinger = engine.calculateBollinger();
  const adx = engine.calculateADX();
  const trend = engine.detectTrend();
  const obv = engine.calculateOBV();
  const stoch = engine.calculateStochastic();
  const cci = engine.calculateCCI();
  const williamsR = engine.calculateWilliamsR();
  const detectedPatterns = engine.detectPatterns();
  const srLevels = engine.detectSupportResistance();
  const ema21 = engine.calculateEMA(21);
  const ema50 = engine.calculateEMA(50);
  const ema200 = engine.calculateEMA(200);

  let bullScore = 0;
  let bearScore = 0;
  let bullVotes = 0;
  let bearVotes = 0;
  const totalIndicators = 10; // number of indicator categories
  const reasoning: string[] = [];
  const warnings: string[] = [];
  const patterns: string[] = [];

  // ── RSI scoring (max 20 pts) ──
  if (rsi.value < 30) {
    bullScore += 20; bullVotes++;
    reasoning.push(`RSI Oversold (${rsi.value.toFixed(1)}) — โซน Buy สะสม`);
  } else if (rsi.value < 45 && rsi.trend === 'up') {
    bullScore += 12; bullVotes++;
    reasoning.push(`RSI ฟื้นตัว (${rsi.value.toFixed(1)}) — Momentum เริ่มบวก`);
  } else if (rsi.value > 70) {
    bearScore += 20; bearVotes++;
    reasoning.push(`RSI Overbought (${rsi.value.toFixed(1)}) — แรงซื้อเริ่มอิ่มตัว`);
  } else if (rsi.value > 55 && rsi.trend === 'down') {
    bearScore += 12; bearVotes++;
    reasoning.push(`RSI หักลง (${rsi.value.toFixed(1)}) — Momentum ลบ`);
  }

  // ── MACD scoring (max 20 pts) ──
  if (macd.trend === 'bullish' && macd.histogram > 0) {
    bullScore += 20; bullVotes++;
    reasoning.push(`MACD Bullish Crossover — สัญญาณขาขึ้นยืนยัน`);
  } else if (macd.trend === 'bullish') {
    bullScore += 10; bullVotes++;
    reasoning.push(`MACD เหนือ Signal Line — แนวโน้มบวก`);
  } else if (macd.trend === 'bearish' && macd.histogram < 0) {
    bearScore += 20; bearVotes++;
    reasoning.push(`MACD Bearish Crossover — สัญญาณขาลงยืนยัน`);
  } else if (macd.trend === 'bearish') {
    bearScore += 10; bearVotes++;
    reasoning.push(`MACD ต่ำกว่า Signal Line — แนวโน้มลบ`);
  }

  // ── Bollinger Band scoring (max 12 pts) ──
  if (bollinger.position < 10) {
    bullScore += 12; bullVotes++;
    reasoning.push(`ราคาแตะ Lower BB — โซน Oversold`);
  } else if (bollinger.position < 30) {
    bullScore += 6;
  } else if (bollinger.position > 90) {
    bearScore += 12; bearVotes++;
    reasoning.push(`ราคาแตะ Upper BB — โซน Overbought ระวังย่อ`);
  } else if (bollinger.position > 70) {
    bearScore += 6;
  }

  // ── Trend scoring (max 15 pts) ──
  if (trend.direction === 'uptrend' && trend.strength > 30) {
    bullScore += 15; bullVotes++;
    reasoning.push(`Uptrend แข็งแกร่ง (strength ${trend.strength})`);
  } else if (trend.direction === 'uptrend') {
    bullScore += 8; bullVotes++;
    reasoning.push(`Uptrend อ่อน`);
  } else if (trend.direction === 'downtrend' && trend.strength > 30) {
    bearScore += 15; bearVotes++;
    reasoning.push(`Downtrend แข็งแกร่ง (strength ${trend.strength})`);
  } else if (trend.direction === 'downtrend') {
    bearScore += 8; bearVotes++;
    reasoning.push(`Downtrend อ่อน`);
  }

  // ── ADX scoring (max 10 pts) ──
  if (adx.trend === 'strong') {
    if (adx.direction === 'up') {
      bullScore += 10; bullVotes++;
      reasoning.push(`ADX ${adx.value.toFixed(1)} — เทรนด์ Bullish แข็งแกร่ง`);
    } else if (adx.direction === 'down') {
      bearScore += 10; bearVotes++;
      reasoning.push(`ADX ${adx.value.toFixed(1)} — เทรนด์ Bearish แข็งแกร่ง`);
    }
  }

  // ── EMA Crossover scoring (max 10 pts) ──
  if (ema21 > 0 && ema50 > 0) {
    if (ema21 > ema50 && currentPrice > ema21) {
      bullScore += 10; bullVotes++;
      reasoning.push(`EMA21 > EMA50 + ราคาเหนือ EMA — Golden alignment`);
    } else if (ema21 < ema50 && currentPrice < ema21) {
      bearScore += 10; bearVotes++;
      reasoning.push(`EMA21 < EMA50 + ราคาใต้ EMA — Death alignment`);
    }
    if (ema200 > 0) {
      if (ema50 > ema200 && ema21 > ema50) {
        bullScore += 3;
        reasoning.push(`Golden Cross (EMA50 > EMA200)`);
      } else if (ema50 < ema200 && ema21 < ema50) {
        bearScore += 3;
        reasoning.push(`Death Cross (EMA50 < EMA200)`);
      }
    }
  }

  // ── OBV confirmation (max 5 pts) ──
  if (obv.trend === 'up') {
    bullScore += 5; bullVotes++;
    reasoning.push(`OBV ขาขึ้น — Volume ยืนยันแรงซื้อ`);
  } else if (obv.trend === 'down') {
    bearScore += 5; bearVotes++;
    reasoning.push(`OBV ขาลง — Volume ยืนยันแรงขาย`);
  }

  // ── Stochastic (max 5 pts) ──
  if (stoch.signal === 'oversold' && stoch.k > stoch.d) {
    bullScore += 5; bullVotes++;
    reasoning.push(`Stochastic Oversold + K>D — Buy ยืนยัน`);
  } else if (stoch.signal === 'overbought' && stoch.k < stoch.d) {
    bearScore += 5; bearVotes++;
    reasoning.push(`Stochastic Overbought + K<D — Short ยืนยัน`);
  }

  // ── CCI confirmation (max 3 pts) ──
  if (cci.signal === 'oversold') {
    bullScore += 3;
  } else if (cci.signal === 'overbought') {
    bearScore += 3;
  }

  // ── Williams %R confirmation (max 3 pts) ──
  if (williamsR.signal === 'oversold') {
    bullScore += 3;
  } else if (williamsR.signal === 'overbought') {
    bearScore += 3;
  }

  // ── Candlestick Pattern scoring (max 10 pts) ──
  for (const p of detectedPatterns) {
    patterns.push(p.name);
    const pts = Math.round((p.confidence / 100) * 10);
    if (p.type === 'bullish') {
      bullScore += pts; bullVotes++;
      reasoning.push(`Pattern: ${p.name} — ${p.description}`);
    } else if (p.type === 'bearish') {
      bearScore += pts; bearVotes++;
      reasoning.push(`Pattern: ${p.name} — ${p.description}`);
    }
  }

  // ── Support / Resistance proximity ──
  let nearSupport = false;
  let nearResistance = false;
  const proxThreshold = 0.015; // 1.5%
  for (const level of srLevels) {
    const dist = Math.abs(currentPrice - level.price) / currentPrice;
    if (dist < proxThreshold) {
      if (level.type === 'support') {
        nearSupport = true;
        bullScore += 3;
        reasoning.push(`ใกล้แนวรับ $${level.price.toFixed(2)} (${level.touches} touches)`);
      } else {
        nearResistance = true;
        bearScore += 3;
        reasoning.push(`ใกล้แนวต้าน $${level.price.toFixed(2)} (${level.touches} touches)`);
      }
    }
  }

  // ── Volume spike detection ──
  const volumeSpike = false;
  // Not directly available from engine; will be checked outside

  // ── Warnings ──
  if (bollinger.bandwidth < 5) {
    warnings.push('Bollinger Squeeze — อาจเกิด Breakout รุนแรง ระวัง Direction');
  }
  if (adx.value < 20) {
    warnings.push('ADX ต่ำ (<20) — ตลาด Sideways ระวังสัญญาณหลอก');
  }
  if (rsi.value > 80) {
    warnings.push('RSI สูงมาก (>80) — ความเสี่ยงย่อตัวสูง');
  }
  if (rsi.value < 20) {
    warnings.push('RSI ต่ำมาก (<20) — อาจ Capitulation ต่อ');
  }
  if (nearResistance && bullVotes > bearVotes) {
    warnings.push('ใกล้แนวต้าน — อาจถูก Reject ระวัง False Breakout');
  }
  if (nearSupport && bearVotes > bullVotes) {
    warnings.push('ใกล้แนวรับ — อาจ Bounce ระวัง Bear Trap');
  }

  // ── Calculate final scores ──
  const net = bullScore - bearScore;
  let direction: SignalDirection;
  let score: number;

  if (net > 12) {
    direction = 'LONG';
    score = Math.min(100, Math.round(bullScore * 1.05));
  } else if (net < -12) {
    direction = 'SHORT';
    score = Math.min(100, Math.round(bearScore * 1.05));
  } else {
    direction = 'NEUTRAL';
    score = Math.max(bullScore, bearScore);
  }

  // Confidence = % of indicators that agree with the direction
  const agreeingVotes = direction === 'LONG' ? bullVotes : direction === 'SHORT' ? bearVotes : Math.max(bullVotes, bearVotes);
  const confidence = Math.min(100, Math.round((agreeingVotes / totalIndicators) * 100));

  let strength: SignalStrength;
  if (score >= 60 && confidence >= 50) strength = 'STRONG';
  else if (score >= 40 || confidence >= 40) strength = 'MODERATE';
  else strength = 'WEAK';

  if (direction === 'NEUTRAL') {
    reasoning.push('สัญญาณ Bull/Bear ต่อสู้กัน — รอ Confirmation ก่อน Entry');
  }

  return { direction, score, strength, confidence, reasoning, warnings, patterns, volumeSpike, nearSupport, nearResistance };
}

function buildTradePlan(
  currentPrice: number,
  direction: SignalDirection,
  atr: number,
  config: AssetConfig
): TradePlan {
  const slDist = atr * config.atrMultiplierSL;

  if (direction === 'LONG') {
    const entry = currentPrice;
    const stopLoss = entry - slDist;
    const risk = entry - stopLoss;
    return {
      entry,
      stopLoss,
      takeProfit1: entry + risk * config.tp1Multiplier,
      takeProfit2: entry + risk * config.tp2Multiplier,
      takeProfit3: entry + risk * config.tp3Multiplier,
      riskRewardRatio: config.tp2Multiplier,
      positionSizePercent: Math.min(5, (1 / config.atrMultiplierSL) * 10),
      maxLossPercent: (slDist / entry) * 100,
    };
  } else if (direction === 'SHORT') {
    const entry = currentPrice;
    const stopLoss = entry + slDist;
    const risk = stopLoss - entry;
    return {
      entry,
      stopLoss,
      takeProfit1: entry - risk * config.tp1Multiplier,
      takeProfit2: entry - risk * config.tp2Multiplier,
      takeProfit3: entry - risk * config.tp3Multiplier,
      riskRewardRatio: config.tp2Multiplier,
      positionSizePercent: Math.min(5, (1 / config.atrMultiplierSL) * 10),
      maxLossPercent: (slDist / entry) * 100,
    };
  }

  // NEUTRAL — placeholder
  return {
    entry: currentPrice,
    stopLoss: currentPrice * 0.97,
    takeProfit1: currentPrice * 1.015,
    takeProfit2: currentPrice * 1.03,
    takeProfit3: currentPrice * 1.05,
    riskRewardRatio: 1.5,
    positionSizePercent: 1,
    maxLossPercent: 3,
  };
}

// ─── Yahoo Finance symbol map for commodities ─────────────────────────────────

const YAHOO_SYMBOL_MAP: Record<string, string> = {
  XAU: 'GC=F',  // Gold Futures
  WTI: 'CL=F',  // WTI Crude Oil Futures
};

// ─── Main Signal Generator ────────────────────────────────────────────────────

async function generateSignalForAsset(
  config: AssetConfig,
  timeframe: Timeframe
): Promise<SignalGenerationResult> {
  const source = getSignalSource(config);

  try {
    const intervalMap: Record<Timeframe, string> = {
      '15m': '15m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d',
    };
    const interval = intervalMap[timeframe];

    let currentPrice: number;
    let candles: CandleData[];
    let change24h = 0;
    let change24hPercent = 0;
    let high24h = 0;
    let low24h = 0;
    let volume24h = 0;

    if (config.assetClass === 'GOLD' || config.assetClass === 'OIL') {
      const yahooSymbol = YAHOO_SYMBOL_MAP[config.symbol];
      const data = await fetchYahooOHLCV(yahooSymbol, timeframe);
      if (!data || data.klines.length < 30) {
        return {
          symbol: config.symbol,
          source,
          signal: null,
          error: 'Insufficient Yahoo market data',
        };
      }

      candles = data.klines.map(klineToCandle);
      currentPrice = data.meta.regularMarketPrice;
      const prevClose = data.meta.chartPreviousClose;
      change24h = currentPrice - prevClose;
      change24hPercent = prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0;
      high24h = data.meta.regularMarketDayHigh;
      low24h = data.meta.regularMarketDayLow;
      volume24h = data.meta.regularMarketVolume;
    } else {
      const [priceData, klinesData] = await Promise.all([
        binanceAPI.get24hStats(config.binanceSymbol),
        binanceAPI.getKlines(config.binanceSymbol, interval, 200),
      ]);

      if (!priceData || klinesData.length < 30) {
        return {
          symbol: config.symbol,
          source,
          signal: null,
          error: 'Insufficient Binance market data',
        };
      }

      candles = klinesData.map(klineToCandle);
      currentPrice = priceData.price;
      change24h = priceData.change24h;
      change24hPercent = priceData.change24hPercent;
      high24h = priceData.high24h;
      low24h = priceData.low24h;
      volume24h = priceData.quoteVolume24h;
    }

    const engine = new IndicatorEngine(candles);

    const scoreResult = scoreSignal(engine, currentPrice);
    const { direction, score, strength, confidence, reasoning, warnings, patterns, nearSupport, nearResistance } = scoreResult;

    const lastCandleTime = candles[candles.length - 1]?.time ?? Date.now();
    const dataTimestamp = new Date(lastCandleTime);
    const latencySeconds = Math.max(0, Math.round((Date.now() - dataTimestamp.getTime()) / 1000));
    const stale = isSignalStale(timeframe, latencySeconds);

    // Volume spike detection: last candle volume > 2x average of last 20
    const recentVolumes = candles.slice(-20).map(c => c.volume);
    const avgVol = recentVolumes.reduce((s, v) => s + v, 0) / recentVolumes.length;
    const lastVol = candles[candles.length - 1]?.volume ?? 0;
    const volumeSpike = lastVol > avgVol * 2;
    if (volumeSpike) {
      reasoning.push(`Volume Spike ×${(lastVol / avgVol).toFixed(1)} — สัญญาณเคลื่อนไหวรุนแรง`);
    }
    if (stale) {
      warnings.push(`ข้อมูลของ ${config.symbol} เริ่มเก่าแล้ว (${Math.round(latencySeconds / 60)} นาที)`);
    }

    const rsi = engine.calculateRSI();
    const macd = engine.calculateMACD();
    const bollinger = engine.calculateBollinger();
    const atr = engine.calculateATR();
    const adx = engine.calculateADX();
    const vwap = engine.calculateVWAP();
    const trend = engine.detectTrend();

    const indicators: SignalIndicators = {
      rsi: rsi.value,
      rsiSignal: rsi.signal,
      macdTrend: macd.trend,
      macdHistogram: macd.histogram,
      bollingerPosition: bollinger.position,
      atr: atr.value,
      adxValue: adx.value,
      adxTrend: adx.trend,
      trend: trend.direction,
      ema21: engine.calculateEMA(21),
      ema50: engine.calculateEMA(50),
      ema200: engine.calculateEMA(200),
      vwap: vwap.value,
    };

    const tradePlan = buildTradePlan(currentPrice, direction, atr.value, config);

    return {
      symbol: config.symbol,
      source,
      error: null,
      signal: {
        id: `${config.symbol}_${timeframe}_${Date.now()}`,
        symbol: config.symbol,
        name: config.name,
        assetClass: config.assetClass,
        currentPrice,
        direction,
        strength,
        score,
        confidence,
        timeframe,
        tradePlan,
        indicators,
        reasoning,
        warnings,
        patterns,
        timestamp: new Date(),
        source,
        dataTimestamp,
        latencySeconds,
        isStale: stale,
        change24h,
        change24hPercent,
        high24h,
        low24h,
        volume24h,
        volumeSpike,
        nearSupport,
        nearResistance,
        isActive: direction !== 'NEUTRAL' && strength !== 'WEAK',
      },
    };
  } catch (err) {
    console.error(`[FuturesSignal] Error generating signal for ${config.symbol}:`, err);
    return {
      symbol: config.symbol,
      source,
      signal: null,
      error: err instanceof Error ? err.message : 'Unknown signal generation error',
    };
  }
}

function buildFuturesSignalDiagnostics(
  results: SignalGenerationResult[],
  signals: FuturesSignal[],
  durationMs: number
): FuturesSignalDiagnostics {
  const failedResults = results.filter((result) => result.signal === null);
  const averageLatencySeconds = signals.length > 0
    ? Math.round(signals.reduce((sum, signal) => sum + signal.latencySeconds, 0) / signals.length)
    : 0;

  return {
    requestedAssets: results.length,
    successCount: signals.length,
    failedCount: failedResults.length,
    coveragePercent: results.length > 0 ? Math.round((signals.length / results.length) * 100) : 0,
    staleCount: signals.filter((signal) => signal.isStale).length,
    activeSignals: signals.filter((signal) => signal.isActive).length,
    averageLatencySeconds,
    sources: {
      Binance: signals.filter((signal) => signal.source === 'Binance').length,
      'Yahoo Finance': signals.filter((signal) => signal.source === 'Yahoo Finance').length,
    },
    failedSymbols: failedResults.map((result) => result.symbol),
    errors: failedResults
      .map((result) => result.error)
      .filter((error): error is string => Boolean(error)),
    fetchedAt: new Date(),
    durationMs,
  };
}

export async function generateFuturesSignalSnapshot(
  timeframe: Timeframe = '4h'
): Promise<FuturesSignalSnapshot> {
  const startedAt = Date.now();
  const results = await Promise.all(FUTURES_ASSETS.map((config) => generateSignalForAsset(config, timeframe)));
  const signals = results
    .map((result) => result.signal)
    .filter((signal): signal is FuturesSignal => signal !== null);
  const diagnostics = buildFuturesSignalDiagnostics(results, signals, Date.now() - startedAt);

  return {
    signals,
    summary: getFuturesSignalSummary(signals),
    diagnostics,
  };
}

export async function generateAllFuturesSignals(
  timeframe: Timeframe = '4h'
): Promise<FuturesSignal[]> {
  const snapshot = await generateFuturesSignalSnapshot(timeframe);
  return snapshot.signals;
}

export function getFuturesSignalSummary(signals: FuturesSignal[]): FuturesSignalSummary {
  const longs = signals.filter(s => s.direction === 'LONG');
  const shorts = signals.filter(s => s.direction === 'SHORT');
  const avgConf = signals.length > 0
    ? Math.round(signals.reduce((s, sig) => s + sig.confidence, 0) / signals.length)
    : 0;
  const active = signals
    .filter(s => s.isActive)
    .sort((a, b) => b.score - a.score || b.confidence - a.confidence || a.latencySeconds - b.latencySeconds);
  const lastUpdated = signals.length > 0
    ? new Date(Math.max(...signals.map((signal) => signal.timestamp.getTime())))
    : new Date();

  return {
    totalLong: longs.length,
    totalShort: shorts.length,
    totalNeutral: signals.filter(s => s.direction === 'NEUTRAL').length,
    strongSignals: signals.filter(s => s.strength === 'STRONG').length,
    avgConfidence: avgConf,
    bestSignal: active[0] ?? null,
    marketBias: longs.length > shorts.length ? 'bullish' : shorts.length > longs.length ? 'bearish' : 'mixed',
    lastUpdated,
  };
}

export function sortSignals(signals: FuturesSignal[], sortBy: SortOption): FuturesSignal[] {
  return [...signals].sort((a, b) => {
    switch (sortBy) {
      case 'score': return b.score - a.score;
      case 'confidence': return b.confidence - a.confidence;
      case 'change': return Math.abs(b.change24hPercent) - Math.abs(a.change24hPercent);
      case 'name': return a.symbol.localeCompare(b.symbol);
      default: return b.score - a.score;
    }
  });
}

export { FUTURES_ASSETS };
