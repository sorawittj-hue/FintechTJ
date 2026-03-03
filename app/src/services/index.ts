/**
 * Services Index
 *
 * Centralized export of all services.
 */

// Real Data Service (NEW - replaces mock data)
export {
  realDataService,
  fetchCryptoPrices,
  fetchGlobalMarketData,
  fetchCryptoNews,
  fetchWhaleTransactions,
  fetchStockQuote,
  fetchMarketIndices,
  type RealTimePrice,
  type GlobalMarketData,
  type NewsItem,
  type StockQuote,
  type MarketIndex,
} from './realDataService';

// Core services
export { binanceAPI, BinanceService } from './binance';
export { default as WebSocketManager, useWebSocket } from './websocket';
export {
  default as WhaleTrackingService,
  useWhaleTracking,
  type WhaleTransaction,
  type WhaleWallet,
  type WhaleScore,
  type WhaleAlert,
  type WhaleCategory,
} from './whaleTracking';


export {
  default as OrderFlowService,
  useOrderFlow,
  type OrderFlow,
  type LiquidityVoid,
  type HeatmapData,
  type TradePrint,
  type KeyLevel,
} from './orderFlow';
export {
  default as RiskManagementService,
  useRiskManagement,
  type RiskMetrics,
  type PositionRisk,
  type StressTestResult,
  type RiskAlert,
  type KellyCriterion,
} from './riskManagement';

// AI Analysis Service
export {
  default as AIAnalysisService,
  aiAnalysisService,
  type SentimentScore,
  type Narrative,
  type MarketAnalysis,
  type AIInsight,
  type PortfolioAnalysis,
  type TechnicalSummary,
  type AudioBrief,
  type PriceData,
  type MarketData,
  type SentimentType,
} from './aiAnalysis';

// Technical Indicator Engine
export {
  default as IndicatorEngine,
  useIndicatorsLegacy,
  calculateRSI,
  calculateMACD,
  calculateBollinger,
  calculateSMA,
  calculateEMA,
  calculateATR,
  calculateVWAP,
  calculateOBV,
  calculateStochasticRSI,
  calculateCCI,
  calculateWilliamsR,
  calculateADX,
  calculateKeltner,
  calculateVolumeProfile,
  calculatePivotPoints,
  calculateFibonacciRetracement,
  detectSupportResistance,
  detectReversalPatterns,
  detectTrend,
  type CandleData,
  type RSIData,
  type MACDData,
  type BollingerData,
  type ATRData,
  type PivotPoints,
  type FibonacciLevels,
  type SupportResistanceLevel,
  type Pattern,
  type TrendData,
  type VWAPData,
  type OBVData,
  type StochasticData,
  type CCIData,
  type WilliamsRData,
  type ADXData,
  type KeltnerData,
  type VolumeProfileData,
  type AllIndicators,
  type UseIndicatorsResult,
} from './indicators';
