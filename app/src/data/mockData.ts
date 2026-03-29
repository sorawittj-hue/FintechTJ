import type { 
  PortfolioAsset, PortfolioSummary, MarketIndex, StockData, CryptoData,
  UnlockEvent, RSIData, VaRData, StressTestScenario, MacroIndicator,
  LiquidityData, RiskEvent, CountryRisk, WhaleTransaction, DarkPoolData,
  SMCLevel, AIInsight, NarrativeTrend, SentinelAlert, AudioBrief, ChartDataPoint
} from '@/types';

/**
 * MOCK DATA FILE - DEPRECATED
 * 
 * This file previously contained hardcoded fake data.
 * All data now comes from real API sources:
 * - Portfolio: User's actual portfolio from PocketBase
 * - Prices: CoinGecko, Binance, CryptoCompare APIs
 * - News: CryptoCompare News API
 * - Market Data: Yahoo Finance, Alternative.me (Fear & Greed)
 * 
 * Do not add mock data here. Use the actual API services instead.
 */

// Empty arrays for components that expect data structures
export const portfolioAssets: PortfolioAsset[] = [];

export const portfolioSummary: PortfolioSummary | null = null;

export const marketIndices: MarketIndex[] = [];

export const stockData: StockData[] = [];

export const cryptoData: CryptoData[] = [];

export const unlockEvents: UnlockEvent[] = [];

export const rsiData: RSIData[] = [];

export const varData: VaRData | null = null;

export const stressScenarios: StressTestScenario[] = [];

export const macroIndicators: MacroIndicator[] = [];

export const liquidityData: LiquidityData[] = [];

export const riskEvents: RiskEvent[] = [];

export const countryRiskData: CountryRisk[] = [];

export const whaleTransactions: WhaleTransaction[] = [];

export const darkPoolData: DarkPoolData[] = [];

export const smcLevels: SMCLevel[] = [];

export const aiInsights: AIInsight[] = [];

export const narrativeTrends: NarrativeTrend[] = [];

export const sentinelAlerts: SentinelAlert[] = [];

export const audioBrief: AudioBrief | null = null;

export const portfolioChartData: ChartDataPoint[] = [];

export const btcChartData: ChartDataPoint[] = [];

export const fearGreedData: { date: string; value: number }[] = [];
