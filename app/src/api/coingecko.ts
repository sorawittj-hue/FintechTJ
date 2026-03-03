/**
 * CoinGecko API Service
 * 
 * Provides access to CoinGecko API for cryptocurrency market data,
 * coin information, and global market metrics.
 * 
 * Features:
 * - Market data (prices, volumes, market cap)
 * - Coin details and metadata
 * - Global cryptocurrency statistics
 * - Trending coins and categories
 * - Search functionality
 * - Proper caching and rate limiting
 * 
 * @see https://www.coingecko.com/api/documentation
 */

import { HttpClient } from './client';
import { LRUCache } from './cache';
import {
  isNotFoundError,
  isRateLimitError,
  normalizeError,
  APIError,
} from './errors';

// Environment-based configuration
const COINGECKO_BASE_URL = import.meta.env.VITE_COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';
const COINGECKO_PRO_URL = import.meta.env.VITE_COINGECKO_PRO_URL || 'https://pro-api.coingecko.com/api/v3';

/**
 * CoinGecko API configuration
 */
export interface CoinGeckoConfig {
  /** API key for pro version */
  apiKey?: string;
  /** Use pro API endpoint */
  usePro: boolean;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Cache TTL for market data in milliseconds */
  marketDataCacheTTL: number;
  /** Cache TTL for coin details in milliseconds */
  coinDetailsCacheTTL: number;
  /** Cache TTL for global data in milliseconds */
  globalDataCacheTTL: number;
  /** Enable debug logging */
  debug: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: CoinGeckoConfig = {
  usePro: false,
  timeout: 30000,
  marketDataCacheTTL: 60 * 1000, // 1 minute
  coinDetailsCacheTTL: 5 * 60 * 1000, // 5 minutes
  globalDataCacheTTL: 5 * 60 * 1000, // 5 minutes
  debug: false,
};

/**
 * Coin market data
 */
export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: {
    times: number;
    currency: string;
    percentage: number;
  } | null;
  last_updated: string;
  sparkline_in_7d?: {
    price: number[];
  };
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_14d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  price_change_percentage_200d_in_currency?: number;
  price_change_percentage_1y_in_currency?: number;
}

/**
 * Coin details
 */
export interface CoinDetails {
  id: string;
  symbol: string;
  name: string;
  asset_platform_id: string | null;
  platforms: Record<string, string>;
  detail_platforms: Record<string, {
    decimal_place: number | null;
    contract_address: string;
  }>;
  block_time_in_minutes: number;
  hashing_algorithm: string | null;
  categories: string[];
  preview_listing: boolean;
  public_notice: string | null;
  additional_notices: string[];
  localization: Record<string, string>;
  description: Record<string, string>;
  links: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    chat_url: string[];
    announcement_url: string[];
    twitter_screen_name: string | null;
    facebook_username: string | null;
    bitcointalk_thread_identifier: number | null;
    telegram_channel_identifier: string | null;
    subreddit_url: string | null;
    repos_url: {
      github: string[];
      bitbucket: string[];
    };
  };
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  country_origin: string;
  genesis_date: string | null;
  sentiment_votes_up_percentage: number;
  sentiment_votes_down_percentage: number;
  watchlist_portfolio_users: number;
  market_cap_rank: number | null;
  market_data: {
    current_price: Record<string, number>;
    total_value_locked: number | null;
    mcap_to_tvl_ratio: number | null;
    fdv_to_tvl_ratio: number | null;
    roi: number | null;
    ath: Record<string, number>;
    ath_change_percentage: Record<string, number>;
    ath_date: Record<string, string>;
    atl: Record<string, number>;
    atl_change_percentage: Record<string, number>;
    atl_date: Record<string, string>;
    market_cap: Record<string, number>;
    market_cap_rank: number | null;
    fully_diluted_valuation: Record<string, number>;
    total_volume: Record<string, number>;
    high_24h: Record<string, number>;
    low_24h: Record<string, number>;
    price_change_24h: number;
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_14d: number;
    price_change_percentage_30d: number;
    price_change_percentage_60d: number;
    price_change_percentage_200d: number;
    price_change_percentage_1y: number;
    market_cap_change_24h: number;
    market_cap_change_percentage_24h: number;
    price_change_24h_in_currency: Record<string, number>;
    price_change_percentage_1h_in_currency: Record<string, number>;
    price_change_percentage_24h_in_currency: Record<string, number>;
    price_change_percentage_7d_in_currency: Record<string, number>;
    price_change_percentage_14d_in_currency: Record<string, number>;
    price_change_percentage_30d_in_currency: Record<string, number>;
    price_change_percentage_60d_in_currency: Record<string, number>;
    price_change_percentage_200d_in_currency: Record<string, number>;
    price_change_percentage_1y_in_currency: Record<string, number>;
    market_cap_change_24h_in_currency: Record<string, number>;
    market_cap_change_percentage_24h_in_currency: Record<string, number>;
    total_supply: number | null;
    max_supply: number | null;
    circulating_supply: number | null;
    last_updated: string;
  };
  community_data: {
    facebook_likes: number | null;
    twitter_followers: number | null;
    reddit_average_posts_48h: number | null;
    reddit_average_comments_48h: number | null;
    reddit_subscribers: number | null;
    reddit_accounts_active_48h: number | null;
    telegram_channel_user_count: number | null;
  };
  developer_data: {
    forks: number;
    stars: number;
    subscribers: number;
    total_issues: number;
    closed_issues: number;
    pull_requests_merged: number;
    pull_request_contributors: number;
    code_additions_deletions_4_weeks: {
      additions: number;
      deletions: number;
    };
    commit_count_4_weeks: number;
    last_4_weeks_commit_activity_series: number[];
  };
  status_updates: unknown[];
  last_updated: string;
  tickers: Array<{
    base: string;
    target: string;
    market: {
      name: string;
      identifier: string;
      has_trading_incentive: boolean;
    };
    last: number;
    volume: number;
    converted_last: {
      btc: number;
      eth: number;
      usd: number;
    };
    converted_volume: {
      btc: number;
      eth: number;
      usd: number;
    };
    trust_score: 'green' | 'yellow' | 'red';
    bid_ask_spread_percentage: number;
    timestamp: string;
    last_traded_at: string;
    last_fetch_at: string;
    is_anomaly: boolean;
    is_stale: boolean;
    trade_url: string | null;
    token_info_url: string | null;
    coin_id: string;
    target_coin_id?: string;
  }>;
}

/**
 * Global cryptocurrency data
 */
export interface GlobalData {
  data: {
    active_cryptocurrencies: number;
    upcoming_icos: number;
    ongoing_icos: number;
    ended_icos: number;
    markets: number;
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    updated_at: number;
  };
}

/**
 * Trending coin
 */
export interface TrendingCoin {
  item: {
    id: string;
    coin_id: number;
    name: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    small: string;
    large: string;
    slug: string;
    price_btc: number;
    score: number;
  };
}

/**
 * Search result
 */
export interface SearchResult {
  coins: Array<{
    id: string;
    name: string;
    symbol: string;
    market_cap_rank: number | null;
    thumb: string;
    large: string;
  }>;
  exchanges: Array<{
    id: string;
    name: string;
    market_type: string;
    thumb: string;
    large: string;
  }>;
  icos: unknown[];
  categories: Array<{
    id: number;
    name: string;
  }>;
  nfts: Array<{
    id: string;
    name: string;
    symbol: string;
    thumb: string;
  }>;
}

/**
 * Price data for a coin
 */
export interface CoinPrice {
  [coinId: string]: {
    [currency: string]: number;
  };
}

/**
 * Historical market data point
 */
export interface MarketChartPoint {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][]; // [timestamp, market_cap]
  total_volumes: [number, number][]; // [timestamp, volume]
}

/**
 * CoinGecko API Service - Singleton
 */
export class CoinGeckoService {
  private static instance: CoinGeckoService | null = null;
  private client: HttpClient;
  private config: CoinGeckoConfig;
  private cache: LRUCache<unknown>;

  private constructor(config: Partial<CoinGeckoConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    const baseURL = this.config.usePro ? COINGECKO_PRO_URL : COINGECKO_BASE_URL;
    
    this.client = new HttpClient({
      baseURL,
      timeout: this.config.timeout,
      serviceName: 'coingecko',
      maxRetries: 3,
      debug: this.config.debug,
    });

    // Add API key header for pro version
    if (this.config.apiKey) {
      this.client.addRequestInterceptor(async (url, reqConfig) => ({
        url,
        config: {
          ...reqConfig,
          headers: {
            ...reqConfig.headers,
            'x-cg-pro-api-key': this.config.apiKey!,
          },
        },
      }));
    }

    // Initialize cache
    this.cache = new LRUCache<unknown>({
      maxSize: 500,
      defaultTTL: this.config.marketDataCacheTTL,
      debug: this.config.debug,
    });

    if (this.config.debug) {
      console.log('[CoinGeckoService] Initialized');
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<CoinGeckoConfig>): CoinGeckoService {
    if (!CoinGeckoService.instance) {
      CoinGeckoService.instance = new CoinGeckoService(config);
    }
    return CoinGeckoService.instance;
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  static resetInstance(): void {
    CoinGeckoService.instance?.destroy();
    CoinGeckoService.instance = null;
  }

  /**
   * Get coins market data
   * @param vsCurrency - Target currency (default: usd)
   * @param ids - Specific coin IDs to fetch
   * @param category - Filter by category
   * @param order - Sort order
   * @param perPage - Results per page (1-250)
   * @param page - Page number
   * @param sparkline - Include sparkline data
   * @param priceChangePercentage - Include price change percentages
   */
  async getCoinsMarkets(
    vsCurrency = 'usd',
    options: {
      ids?: string[];
      category?: string;
      order?: 'market_cap_desc' | 'market_cap_asc' | 'volume_desc' | 'volume_asc' | 'id_desc' | 'id_asc';
      perPage?: number;
      page?: number;
      sparkline?: boolean;
      priceChangePercentage?: string;
    } = {}
  ): Promise<CoinMarketData[]> {
    const cacheKey = LRUCache.generateKey([
      'markets',
      vsCurrency,
      options.ids?.join(','),
      options.category,
      options.order,
      options.perPage,
      options.page,
      options.sparkline ? '1' : '0',
    ]);

    const cached = this.cache.get(cacheKey) as CoinMarketData[] | undefined;
    if (cached) {
      if (this.config.debug) console.log('[CoinGeckoService] Cache hit:', cacheKey);
      return cached;
    }

    const params = new URLSearchParams({
      vs_currency: vsCurrency,
      ...(options.ids && { ids: options.ids.join(',') }),
      ...(options.category && { category: options.category }),
      ...(options.order && { order: options.order }),
      ...(options.perPage && { per_page: String(options.perPage) }),
      ...(options.page && { page: String(options.page) }),
      ...(options.sparkline && { sparkline: String(options.sparkline) }),
      ...(options.priceChangePercentage && { price_change_percentage: options.priceChangePercentage }),
    });

    try {
      const response = await this.client.get<CoinMarketData[]>(
        `/coins/markets?${params.toString()}`
      );

      this.cache.set(cacheKey, response.data, this.config.marketDataCacheTTL);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get detailed information about a coin
   * @param id - Coin ID (e.g., 'bitcoin')
   * @param localization - Include localized data
   * @param tickers - Include ticker data
   * @param marketData - Include market data
   * @param communityData - Include community data
   * @param developerData - Include developer data
   * @param sparkline - Include sparkline
   */
  async getCoinDetails(
    id: string,
    options: {
      localization?: boolean;
      tickers?: boolean;
      marketData?: boolean;
      communityData?: boolean;
      developerData?: boolean;
      sparkline?: boolean;
    } = {}
  ): Promise<CoinDetails> {
    const cacheKey = LRUCache.generateKey(['coin', id, JSON.stringify(options)]);

    const cached = this.cache.get(cacheKey) as CoinDetails | undefined;
    if (cached) return cached;

    const params = new URLSearchParams({
      ...(options.localization !== undefined && { localization: String(options.localization) }),
      ...(options.tickers !== undefined && { tickers: String(options.tickers) }),
      ...(options.marketData !== undefined && { market_data: String(options.marketData) }),
      ...(options.communityData !== undefined && { community_data: String(options.communityData) }),
      ...(options.developerData !== undefined && { developer_data: String(options.developerData) }),
      ...(options.sparkline !== undefined && { sparkline: String(options.sparkline) }),
    });

    try {
      const response = await this.client.get<CoinDetails>(
        `/coins/${id}?${params.toString()}`
      );

      this.cache.set(cacheKey, response.data, this.config.coinDetailsCacheTTL);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current price for coins
   * @param ids - Coin IDs
   * @param vsCurrencies - Target currencies
   * @param includeMarketCap - Include market cap
   * @param include24hrVol - Include 24h volume
   * @param include24hrChange - Include 24h change
   * @param includeLastUpdatedAt - Include last updated timestamp
   */
  async getSimplePrice(
    ids: string[],
    vsCurrencies: string[],
    options: {
      includeMarketCap?: boolean;
      include24hrVol?: boolean;
      include24hrChange?: boolean;
      includeLastUpdatedAt?: boolean;
    } = {}
  ): Promise<CoinPrice> {
    const cacheKey = LRUCache.generateKey([
      'price',
      ids.join(','),
      vsCurrencies.join(','),
      JSON.stringify(options),
    ]);

    const cached = this.cache.get(cacheKey) as CoinPrice | undefined;
    if (cached) return cached;

    const params = new URLSearchParams({
      ids: ids.join(','),
      vs_currencies: vsCurrencies.join(','),
      ...(options.includeMarketCap && { include_market_cap: 'true' }),
      ...(options.include24hrVol && { include_24hr_vol: 'true' }),
      ...(options.include24hrChange && { include_24hr_change: 'true' }),
      ...(options.includeLastUpdatedAt && { include_last_updated_at: 'true' }),
    });

    try {
      const response = await this.client.get<CoinPrice>(
        `/simple/price?${params.toString()}`
      );

      this.cache.set(cacheKey, response.data, this.config.marketDataCacheTTL);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get global cryptocurrency market data
   */
  async getGlobalData(): Promise<GlobalData> {
    const cacheKey = 'global';

    const cached = this.cache.get(cacheKey) as GlobalData | undefined;
    if (cached) return cached;

    try {
      const response = await this.client.get<GlobalData>('/global');

      this.cache.set(cacheKey, response.data, this.config.globalDataCacheTTL);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get trending coins
   */
  async getTrendingCoins(): Promise<{ coins: TrendingCoin[] }> {
    const cacheKey = 'trending';

    const cached = this.cache.get(cacheKey) as { coins: TrendingCoin[] } | undefined;
    if (cached) return cached;

    try {
      const response = await this.client.get<{ coins: TrendingCoin[] }>('/search/trending');

      this.cache.set(cacheKey, response.data, this.config.marketDataCacheTTL);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Search for coins, categories, and exchanges
   * @param query - Search query
   */
  async search(query: string): Promise<SearchResult> {
    try {
      const response = await this.client.get<SearchResult>(
        `/search?query=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get historical market data
   * @param id - Coin ID
   * @param vsCurrency - Target currency
   * @param days - Number of days or 'max'
   * @param interval - Data interval
   */
  async getMarketChart(
    id: string,
    vsCurrency: string,
    days: number | 'max',
    interval?: 'daily'
  ): Promise<MarketChartPoint> {
    const cacheKey = LRUCache.generateKey([
      'chart',
      id,
      vsCurrency,
      String(days),
      interval,
    ]);

    const cached = this.cache.get(cacheKey) as MarketChartPoint | undefined;
    if (cached) return cached;

    const params = new URLSearchParams({
      vs_currency: vsCurrency,
      days: String(days),
      ...(interval && { interval }),
    });

    try {
      const response = await this.client.get<MarketChartPoint>(
        `/coins/${id}/market_chart?${params.toString()}`
      );

      this.cache.set(cacheKey, response.data, this.config.marketDataCacheTTL);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get supported coins list
   */
  async getCoinsList(): Promise<Array<{ id: string; symbol: string; name: string }>> {
    const cacheKey = 'coins_list';

    const cached = this.cache.get(cacheKey) as Array<{ id: string; symbol: string; name: string }> | undefined;
    if (cached) return cached;

    try {
      const response = await this.client.get<Array<{ id: string; symbol: string; name: string }>>(
        '/coins/list'
      );

      this.cache.set(cacheKey, response.data, this.config.coinDetailsCacheTTL);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get top gainers and losers
   * @param vsCurrency - Target currency
   * @param duration - Time duration (e.g., '24h')
   */
  async getTopGainersLosers(
    vsCurrency = 'usd',
    duration = '24h'
  ): Promise<{
    top_gainers: CoinMarketData[];
    top_losers: CoinMarketData[];
  }> {
    const cacheKey = LRUCache.generateKey(['gainers_losers', vsCurrency, duration]);

    const cached = this.cache.get(cacheKey) as { top_gainers: CoinMarketData[]; top_losers: CoinMarketData[] } | undefined;
    if (cached) return cached;

    try {
      const response = await this.client.get<{
        top_gainers: CoinMarketData[];
        top_losers: CoinMarketData[];
      }>(`/coins/top_gainers_losers?vs_currency=${vsCurrency}&duration=${duration}`);

      this.cache.set(cacheKey, response.data, this.config.marketDataCacheTTL);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CoinGeckoConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Handle and normalize errors
   */
  private handleError(error: unknown): APIError {
    const normalizedError = normalizeError(error);

    if (isNotFoundError(normalizedError)) {
      return new APIError('Coin not found', 'COIN_NOT_FOUND', 404, false);
    }

    if (isRateLimitError(normalizedError)) {
      return new APIError(
        'CoinGecko API rate limit exceeded. Please try again later.',
        'COINGECKO_RATE_LIMIT',
        429,
        true
      );
    }

    return normalizedError;
  }

  /**
   * Destroy service and cleanup resources
   */
  destroy(): void {
    this.cache.destroy();
  }
}

// Export singleton instance
export const coingeckoService = CoinGeckoService.getInstance();

export default CoinGeckoService;
