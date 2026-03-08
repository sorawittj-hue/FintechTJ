// Portfolio Types
export interface PortfolioAsset {
  id: string;
  name: string;
  symbol: string;
  type: 'stock' | 'crypto' | 'commodity' | 'forex';
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  change24h: number;
  change24hPercent: number;
  change24hValue: number;
  allocation: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'buy' | 'sell';
  amount: number;
  asset: string;
  symbol: string;
  timestamp: Date;
  price?: number;
  quantity?: number;
  fee?: number;
}

export interface Alert {
  id: string;
  type: 'price' | 'volume' | 'pattern' | 'portfolio';
  symbol: string;
  condition: 'above' | 'below' | 'change_percent';
  value: number;
  isActive: boolean;
  createdAt: Date;
  triggeredAt?: Date;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalChange24h: number;
  totalChange24hPercent: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  assets: PortfolioAsset[];
}

// Market Data Types
export interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  rsi: number;
}

// Crypto Types
export interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  marketCap: number;
  fdv: number;
  fdvMcRatio: number;
  unlockPressure: number;
  nextUnlockDate: string;
  nextUnlockValue: number;
  decentralizationScore: number;
  whaleHoldings: number;
}

export interface UnlockEvent {
  project: string;
  date: string;
  amount: number;
  value: number;
  type: 'team' | 'investors' | 'community' | 'staking';
}

// Technical Analysis Types
export interface RSIData {
  symbol: string;
  rsi: number;
  signal: 'oversold' | 'neutral' | 'overbought';
  trend: 'up' | 'down' | 'sideways';
}

export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number;
}

// Risk Analysis Types
export interface VaRData {
  portfolioValue: number;
  var95: number;
  var99: number;
  expectedShortfall: number;
  confidenceLevel: number;
}

export interface StressTestScenario {
  name: string;
  description: string;
  impact: number;
  portfolioLoss: number;
  probability: number;
}

// Macro Economics Types
export interface MacroIndicator {
  name: string;
  country: string;
  value: number;
  previous: number;
  change: number;
  impact: 'high' | 'medium' | 'low';
  trend: 'up' | 'down' | 'stable';
}

export interface LiquidityData {
  date: string;
  value: number;
  change: number;
}

// Geopolitical Types
export interface RiskEvent {
  id: string;
  title: string;
  description: string;
  country: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'war' | 'earthquake' | 'political' | 'economic';
  timestamp: string;
  source: string;
}

export interface CountryRisk {
  country: string;
  flag: string;
  overallRisk: number;
  politicalRisk: number;
  economicRisk: number;
  socialRisk: number;
  trend: 'improving' | 'stable' | 'deteriorating';
}

// Whale & Dark Pool Types
export interface WhaleTransaction {
  id: string;
  type: 'buy' | 'sell';
  asset: string;
  amount: number;
  value: number;
  timestamp: string;
  exchange: string;
  wallet?: string;
}

export interface DarkPoolData {
  symbol: string;
  volume: number;
  price: number;
  timestamp: string;
  premium: number;
}

// SMC Types
export interface SMCLevel {
  price: number;
  type: 'support' | 'resistance' | 'order_block' | 'fair_value_gap';
  strength: number;
  timeframe: string;
}

export interface MarketStructure {
  trend: 'bullish' | 'bearish' | 'neutral';
  structure: 'uptrend' | 'downtrend' | 'ranging';
  liquidityLevels: SMCLevel[];
}

// AI Types
export interface AIInsight {
  id: string;
  type: 'prediction' | 'alert' | 'recommendation' | 'analysis';
  title: string;
  description: string;
  confidence: number;
  timestamp: string;
  relatedAssets: string[];
}

export interface NarrativeTrend {
  name: string;
  sector: string;
  strength: number;
  momentum: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  keywords: string[];
}

// Sentinel Types
export interface SentinelAlert {
  id: string;
  type: 'price' | 'volume' | 'pattern' | 'news' | 'risk';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: string;
  asset?: string;
  isRead: boolean;
}

// Audio Brief Types
export interface AudioBrief {
  date: string;
  duration: number;
  summary: string;
  keyPoints: string[];
  url?: string;
}

// Dashboard Widget Types
export interface Widget {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data?: Record<string, unknown>;
}

// Chart Data Types
export interface ChartDataPoint {
  date: string;
  value: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export interface HeatmapCell {
  symbol: string;
  value: number;
  change: number;
  category: string;
}

// Institutional Trading Types
export interface MarketDataContext {
  fundingRate: number;
  longShortRatio: number;
  openInterestChange24h: number;
  priceChange24h: number;
  symbol: string;
}

export interface SqueezeSignal {
  type: 'SHORT_SQUEEZE_WARNING' | 'LONG_SQUEEZE_WARNING' | 'EXTREME_FEAR' | 'EXTREME_GREED' | 'NEUTRAL';
  probability: number;
  advice: string;
  details: {
    crowdSentiment: 'LONG_HEAVY' | 'SHORT_HEAVY' | 'BALANCED';
    smartMoneyDirection: 'UP' | 'DOWN' | 'UNCLEAR';
  };
}

export interface PositionRequest {
  accountBalance: number;
  riskPercentage: number;
  entryPrice: number;
  stopLossPrice: number;
  leverage: number;
  positionType: 'LONG' | 'SHORT';
}

