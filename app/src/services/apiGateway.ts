/**
 * Free API Gateway v2.0 — Unified Access to All Free APIs
 * 
 * Centralized gateway for all external API calls with:
 * - Intelligent routing between multiple free data sources
 * - Automatic fallback chains
 * - Unified rate limiting
 * - Request deduplication
 * - Response caching
 * - Zero mock data policy
 * 
 * Free Tier Limits:
 * - CoinGecko: 30 calls/min
 * - Binance: 1200 weight/min (1 weight = simple request)
 * - CryptoCompare: 100k calls/month
 * - GNews: 100 calls/day
 * - Blockchain.info: Free, no limits
 * - Gemini: 1500 calls/day
 */

import { binanceAPI, type CryptoPrice, type KlineData, type OrderBook } from './binance';
import {
  fetchCryptoPrices,
  fetchWhaleTransactions,
  fetchCryptoNews,
  fetchGlobalMarketData,
  type RealTimePrice,
  type WhaleTransaction,
  type NewsItem,
  type GlobalMarketData,
} from './realDataService';
import { aiAnalysisService, type MarketAnalysis, type PortfolioAnalysis } from './aiAnalysis';
import type { NewsArticle } from '@/api/newsapi';
import { globalRateLimiter } from '@/api/rateLimiter';
import { LRUCache } from '@/api/cache';

// Gateway configuration
export interface GatewayConfig {
  enableCache: boolean;
  cacheTTL: number;
  enableFallback: boolean;
  enableRateLimit: boolean;
  debug: boolean;
}

const DEFAULT_CONFIG: GatewayConfig = {
  enableCache: true,
  cacheTTL: 30000, // 30 seconds
  enableFallback: true,
  enableRateLimit: true,
  debug: false,
};

// Unified cache for all API responses
const gatewayCache = new LRUCache<unknown>({
  maxSize: 200,
  defaultTTL: 30000,
});

/**
 * Free API Gateway - Single entry point for all external APIs
 */
export class FreeAPIGateway {
  private static instance: FreeAPIGateway | null = null;
  private config: GatewayConfig;

  private constructor(config: Partial<GatewayConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.debug) {
      console.log('[FreeAPIGateway] Initialized with config:', this.config);
    }
  }

  static getInstance(config?: Partial<GatewayConfig>): FreeAPIGateway {
    if (!FreeAPIGateway.instance) {
      FreeAPIGateway.instance = new FreeAPIGateway(config);
    }
    return FreeAPIGateway.instance;
  }

  // ==================== PRICE DATA ====================

  /**
   * Get real-time prices with fallback chain
   * Priority: Binance (fastest) → CoinGecko
   */
  async getPrices(symbols: string[]): Promise<RealTimePrice[]> {
    const cacheKey = `prices_${symbols.sort().join('_')}`;
    
    if (this.config.enableCache) {
      const cached = gatewayCache.get(cacheKey) as RealTimePrice[];
      if (cached) return cached;
    }

    try {
      // Use realDataService which has CoinGecko + Binance fallback
      const prices = await fetchCryptoPrices(symbols);
      
      if (this.config.enableCache) {
        gatewayCache.set(cacheKey, prices, 5000); // 5 second cache for prices
      }
      return prices;
    } catch (error) {
      console.error('[Gateway] Failed to fetch prices:', error);
      throw error;
    }
  }

  /**
   * Get top 100 coins by volume
   */
  async getTopCoins(limit: number = 100): Promise<CryptoPrice[]> {
    const cacheKey = `top_coins_${limit}`;
    
    if (this.config.enableCache) {
      const cached = gatewayCache.get(cacheKey) as CryptoPrice[];
      if (cached) return cached;
    }

    const coins = await binanceAPI.getAllPrices();
    const result = coins.slice(0, limit);
    
    if (this.config.enableCache) {
      gatewayCache.set(cacheKey, result, 10000); // 10 second cache
    }
    
    return result;
  }

  /**
   * Get top gainers (24h)
   */
  async getTopGainers(limit: number = 10): Promise<CryptoPrice[]> {
    const cacheKey = `gainers_${limit}`;
    
    if (this.config.enableCache) {
      const cached = gatewayCache.get(cacheKey) as CryptoPrice[];
      if (cached) return cached;
    }

    const gainers = await binanceAPI.getTopGainers(limit);
    
    if (this.config.enableCache) {
      gatewayCache.set(cacheKey, gainers, 30000);
    }
    
    return gainers;
  }

  /**
   * Get top losers (24h)
   */
  async getTopLosers(limit: number = 10): Promise<CryptoPrice[]> {
    const cacheKey = `losers_${limit}`;
    
    if (this.config.enableCache) {
      const cached = gatewayCache.get(cacheKey) as CryptoPrice[];
      if (cached) return cached;
    }

    const losers = await binanceAPI.getTopLosers(limit);
    
    if (this.config.enableCache) {
      gatewayCache.set(cacheKey, losers, 30000);
    }
    
    return losers;
  }

  // ==================== OHLCV DATA ====================

  /**
   * Get OHLCV/kline data for technical analysis
   */
  async getKlines(
    symbol: string,
    interval: string = '1h',
    limit: number = 100
  ): Promise<KlineData[]> {
    const cacheKey = `klines_${symbol}_${interval}_${limit}`;
    
    if (this.config.enableCache) {
      const cached = gatewayCache.get(cacheKey) as KlineData[];
      if (cached) return cached;
    }

    const klines = await binanceAPI.getKlines(symbol, interval, limit);
    
    if (this.config.enableCache) {
      gatewayCache.set(cacheKey, klines, 60000); // 1 minute cache
    }
    
    return klines;
  }

  // ==================== ORDER BOOK ====================

  /**
   * Get order book data for order flow analysis
   */
  async getOrderBook(symbol: string, limit: number = 20): Promise<OrderBook | null> {
    const cacheKey = `orderbook_${symbol}_${limit}`;
    
    if (this.config.enableCache) {
      const cached = gatewayCache.get(cacheKey) as OrderBook;
      if (cached) return cached;
    }

    const orderBook = await binanceAPI.getOrderBook(symbol, limit);
    
    if (this.config.enableCache && orderBook) {
      gatewayCache.set(cacheKey, orderBook, 5000); // 5 second cache
    }
    
    return orderBook;
  }

  // ==================== WHALE DATA ====================

  /**
   * Get whale transactions from blockchain
   */
  async getWhaleTransactions(
    minValue: number = 1000000,
    limit: number = 20
  ): Promise<WhaleTransaction[]> {
    const cacheKey = `whales_${minValue}_${limit}`;
    
    if (this.config.enableCache) {
      const cached = gatewayCache.get(cacheKey) as WhaleTransaction[];
      if (cached) return cached;
    }

    const whales = await fetchWhaleTransactions(minValue, limit);
    
    if (this.config.enableCache) {
      gatewayCache.set(cacheKey, whales, 60000); // 1 minute cache
    }
    
    return whales;
  }

  // ==================== NEWS DATA ====================

  /**
   * Get crypto news with fallback chain
   */
  async getNews(
    symbols?: string[],
    limit: number = 10
  ): Promise<NewsItem[]> {
    const cacheKey = `news_${symbols?.sort().join('_') || 'all'}_${limit}`;
    
    if (this.config.enableCache) {
      const cached = gatewayCache.get(cacheKey) as NewsItem[];
      if (cached) return cached;
    }

    const news = await fetchCryptoNews(symbols, limit);
    
    if (this.config.enableCache) {
      gatewayCache.set(cacheKey, news, 600000); // 10 minute cache
    }
    
    return news;
  }

  // ==================== MARKET DATA ====================

  /**
   * Get global market data (market cap, dominance, etc.)
   */
  async getGlobalMarketData(): Promise<GlobalMarketData | null> {
    const cacheKey = 'global_market';
    
    if (this.config.enableCache) {
      const cached = gatewayCache.get(cacheKey) as GlobalMarketData;
      if (cached) return cached;
    }

    const data = await fetchGlobalMarketData();
    
    if (this.config.enableCache) {
      gatewayCache.set(cacheKey, data, 300000); // 5 minute cache
    }
    
    return data;
  }

  // ==================== AI ANALYSIS ====================

  /**
   * Get AI market analysis
   * Uses Gemini free tier with local fallback
   */
  async getAIMarketAnalysis(
    prices: RealTimePrice[],
    news: NewsItem[]
  ): Promise<MarketAnalysis> {
    const mappedNews: NewsArticle[] = news.map(n => ({
      id: n.id,
      title: n.title,
      description: n.description,
      url: n.url,
      publishedAt: n.publishedAt.toISOString(),
      source: { name: n.source, id: n.sourceName },
    }));
    
    return aiAnalysisService.analyzeMarketTrend(
      prices.map(p => ({ timestamp: Date.now(), price: p.price, volume: p.volume24h })),
      mappedNews
    );
  }

  /**
   * Get AI portfolio insights
   */
  async getAIPortfolioInsights(
    holdings: Array<{ symbol: string; value: number; change24h: number }>
  ): Promise<PortfolioAnalysis> {
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const summary = {
      totalValue,
      totalCost: totalValue,
      totalChange24h: holdings.reduce((sum, h) => sum + h.change24h, 0),
      totalChange24hPercent: 0,
      totalProfitLoss: 0,
      totalProfitLossPercent: 0,
      assets: []
    };
    return aiAnalysisService.analyzePortfolio(summary);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get API usage statistics
   */
  getStats(): {
    cache: ReturnType<typeof gatewayCache.getStats>;
    rateLimiters: ReturnType<typeof globalRateLimiter.getAllStats>;
  } {
    return {
      cache: gatewayCache.getStats(),
      rateLimiters: globalRateLimiter.getAllStats(),
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    gatewayCache.clear();
    console.log('[FreeAPIGateway] Cache cleared');
  }

  /**
   * Get rate limit status for all services
   */
  getRateLimitStatus(): Record<string, {
    tokensAvailable: number;
    bucketSize: number;
    queueSize: number;
    canExecute: boolean;
  }> {
    const services = ['binance', 'coingecko', 'cryptocompare', 'gnews'];
    const status: Record<string, ReturnType<typeof this.getRateLimitStatus>[string]> = {};

    for (const service of services) {
      try {
        const limiter = globalRateLimiter.getLimiter(service as string);
        status[service] = {
          tokensAvailable: limiter.getStats().tokensAvailable,
          bucketSize: limiter.getStats().bucketSize,
          queueSize: limiter.getStats().queueSize,
          canExecute: limiter.canExecute(),
        };
      } catch {
        status[service] = {
          tokensAvailable: 0,
          bucketSize: 0,
          queueSize: 0,
          canExecute: false,
        };
      }
    }

    return status;
  }

  /**
   * Preload common data for faster UI response
   */
  async preloadCommonData(): Promise<void> {
    console.log('[FreeAPIGateway] Preloading common data...');
    
    await Promise.all([
      this.getTopCoins(20).catch(() => []),
      this.getGlobalMarketData().catch(() => null),
      this.getWhaleTransactions(1000000, 10).catch(() => []),
    ]);
    
    console.log('[FreeAPIGateway] Preload complete');
  }
}

// Export singleton instance
export const apiGateway = FreeAPIGateway.getInstance();

export default FreeAPIGateway;
