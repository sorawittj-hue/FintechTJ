/**
 * Unified API Service Layer
 * 
 * This module provides a comprehensive API service layer with:
 * - HTTP Client with retry, timeout, and circuit breaker
 * - LRU Cache with TTL and stale-while-revalidate
 * - Token bucket rate limiting
 * - Comprehensive error handling
 * - Service classes for external APIs
 * 
 * @example
 * ```typescript
 * // Using the services
 * import { coingeckoService, newsService } from '@/api';
 * 
 * // Get market data
 * const coins = await coingeckoService.getCoinsMarkets('usd');
 * 
 * // Get news
 * const news = await newsService.getLatestNews({ query: 'bitcoin' });
 * ```
 */

// Error handling
export {
  APIError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  CircuitBreakerError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  ServerError,
  CacheError,
  // Type guards
  isAPIError,
  isNetworkError,
  isRateLimitError,
  isCircuitBreakerError,
  isAuthenticationError,
  isNotFoundError,
  isRetryableError,
  // Utilities
  normalizeError,
} from './errors';

// Cache system
export {
  LRUCache,
  getGlobalCache,
  clearAllGlobalCaches,
  getAllGlobalCacheStats,
  type CacheConfig,
  type CacheEntryMetadata,
  type CacheStats,
} from './cache';

// Rate limiting
export {
  TokenBucketRateLimiter,
  RateLimiterManager,
  globalRateLimiter,
  DEFAULT_RATE_LIMITS,
  type RateLimitConfig,
  type RateLimiterStats,
} from './rateLimiter';

// HTTP Client
export {
  HttpClient,
  createClient,
  type HttpClientConfig,
  type RequestConfig,
  type ApiResponse,
  type RequestInterceptor,
  type ResponseInterceptor,
  type ErrorInterceptor,
  type CircuitBreakerConfig,
} from './client';

// CoinGecko Service
export {
  CoinGeckoService,
  coingeckoService,
  type CoinGeckoConfig,
  type CoinMarketData,
  type CoinDetails,
  type GlobalData,
  type TrendingCoin,
  type SearchResult,
  type CoinPrice,
  type MarketChartPoint,
} from './coingecko';

// News Service
export {
  NewsService,
  newsService,
  type NewsServiceConfig,
  type NewsProvider,
  type NewsArticle,
  type NewsCategory,
  type NewsFilters,
  type NewsResponse,
} from './newsapi';

/**
 * Default service instances
 * Use these for most use cases
 */
export { binanceAPI } from '@/services/binance';

/**
 * Initialize all API services with configuration
 * Call this at app startup to configure API keys and settings
 */
export interface APIConfig {
  coingecko?: {
    apiKey?: string;
    usePro?: boolean;
  };
  newsapi?: {
    apiKey?: string;
    provider?: 'newsapi' | 'cryptocompare';
  };
  binance?: {
    debug?: boolean;
  };
}

// Import for utility functions
import { clearAllGlobalCaches, getAllGlobalCacheStats } from './cache';
import { globalRateLimiter } from './rateLimiter';
import { CoinGeckoService } from './coingecko';
import { NewsService } from './newsapi';
import { BinanceService } from '@/services/binance';

/**
 * Initialize API services with configuration
 * @param config - API configuration
 */
export function initializeAPIs(config: APIConfig = {}): void {
  if (config.coingecko) {
    CoinGeckoService.resetInstance();
    CoinGeckoService.getInstance({
      apiKey: config.coingecko.apiKey,
      usePro: config.coingecko.usePro ?? false,
    });
  }

  if (config.newsapi) {
    NewsService.resetInstance();
    NewsService.getInstance({
      apiKey: config.newsapi.apiKey,
      provider: config.newsapi.provider ?? 'cryptocompare',
    });
  }

  if (config.binance) {
    BinanceService.resetInstance();
    BinanceService.getInstance({
      debug: config.binance.debug,
    });
  }
}

/**
 * Clear all API caches
 * Useful for logout or when data needs to be refreshed
 */
export function clearAllCaches(): void {
  clearAllGlobalCaches();
  CoinGeckoService.getInstance().clearCache();
  NewsService.getInstance().clearCache();
  BinanceService.getInstance().clearCache();
}

/**
 * Get statistics for all API services
 * Useful for monitoring and debugging
 */
export function getAllAPIStats(): Record<string, unknown> {
  return {
    caches: getAllGlobalCacheStats(),
    rateLimiters: globalRateLimiter.getAllStats(),
    coingecko: CoinGeckoService.getInstance().getCacheStats(),
    news: NewsService.getInstance().getCacheStats(),
    binance: BinanceService.getInstance().getStats(),
  };
}

export default {
  initializeAPIs,
  clearAllCaches,
  getAllAPIStats,
};
