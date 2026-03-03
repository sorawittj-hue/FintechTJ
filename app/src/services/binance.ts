/**
 * Binance API Service
 * 
 * Provides access to Binance cryptocurrency exchange data.
 * 
 * Features:
 * - Real-time price data via WebSocket
 * - Historical OHLCV data
 * - Order book data
 * - 24h statistics
 * - Top gainers/losers
 * - Proper caching and rate limiting
 * 
 * This service uses the unified HTTP client with:
 * - Automatic retry with exponential backoff
 * - Circuit breaker pattern
 * - Rate limiting
 * - Request deduplication
 * 
 * @see https://binance-docs.github.io/apidocs/spot/en/
 */

import { HttpClient } from '@/api/client';
import { LRUCache } from '@/api/cache';

// Environment-based configuration
const BINANCE_BASE_URL = import.meta.env.VITE_BINANCE_BASE_URL || 'https://api.binance.com/api/v3';
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';
const MAX_RECONNECT_DELAY = 30000; // 30 seconds max

/**
 * Crypto price data
 */
export interface CryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
}

/**
 * Kline/OHLCV data
 */
export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Order book data
 */
export interface OrderBook {
  bids: [number, number][];
  asks: [number, number][];
}

/**
 * Binance 24hr ticker response
 */
interface BinanceTicker24hr {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
}

/**
 * Binance kline response
 */
type BinanceKline = [number, string, string, string, string, string, number, string, number, string, string, string];

/**
 * Binance order book response
 */
interface BinanceOrderBook {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

/**
 * Binance service configuration
 */
export interface BinanceServiceConfig {
  /** Request timeout in milliseconds */
  timeout: number;
  /** Cache TTL for price data in milliseconds */
  priceCacheTTL: number;
  /** Cache TTL for kline data in milliseconds */
  klineCacheTTL: number;
  /** Cache TTL for order book in milliseconds */
  orderBookCacheTTL: number;
  /** Maximum WebSocket reconnect attempts */
  maxReconnectAttempts: number;
  /** Enable debug logging */
  debug: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: BinanceServiceConfig = {
  timeout: 30000,
  priceCacheTTL: 5000, // 5 seconds for prices
  klineCacheTTL: 60000, // 1 minute for klines
  orderBookCacheTTL: 5000, // 5 seconds for order book
  maxReconnectAttempts: 5,
  debug: false,
};

/**
 * Binance API Service - Singleton
 */
export class BinanceService {
  private static instance: BinanceService | null = null;
  private client: HttpClient;
  private config: BinanceServiceConfig;
  private cache: LRUCache<unknown>;

  // WebSocket state
  private ws: WebSocket | null = null;
  private subscribers = new Map<string, Set<(data: CryptoPrice) => void>>();
  private reconnectAttempts = 0;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private currentSymbols: string[] = [];
  private currentCallback: ((data: CryptoPrice) => void) | null = null;

  private constructor(config: Partial<BinanceServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.client = new HttpClient({
      baseURL: BINANCE_BASE_URL,
      timeout: this.config.timeout,
      serviceName: 'binance',
      maxRetries: 3,
      retryDelay: 1000,
      retryStatusCodes: [429, 500, 502, 503, 504],
      debug: this.config.debug,
    });

    // Initialize cache
    this.cache = new LRUCache<unknown>({
      maxSize: 500,
      defaultTTL: this.config.priceCacheTTL,
      debug: this.config.debug,
    });

    if (this.config.debug) {
      console.log('[BinanceService] Initialized');
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<BinanceServiceConfig>): BinanceService {
    if (!BinanceService.instance) {
      BinanceService.instance = new BinanceService(config);
    }
    return BinanceService.instance;
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  static resetInstance(): void {
    BinanceService.instance?.destroy();
    BinanceService.instance = null;
  }

  /**
   * Get 24hr statistics for a symbol
   * @param symbol - Trading symbol (e.g., 'BTC', 'ETH')
   */
  async get24hStats(symbol: string): Promise<CryptoPrice | null> {
    const normalizedSymbol = symbol.toUpperCase();
    const cacheKey = `stats_${normalizedSymbol}`;

    const cached = this.cache.get(cacheKey) as CryptoPrice | undefined;
    if (cached) return cached;

    try {
      const response = await this.client.get<BinanceTicker24hr>(
        `/ticker/24hr?symbol=${normalizedSymbol}USDT`
      );

      const data = response.data;
      const result: CryptoPrice = {
        symbol: normalizedSymbol,
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChange),
        change24hPercent: parseFloat(data.priceChangePercent),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        volume24h: parseFloat(data.volume),
        quoteVolume24h: parseFloat(data.quoteVolume),
      };

      this.cache.set(cacheKey, result, this.config.priceCacheTTL);
      return result;
    } catch (error) {
      console.error('Error fetching 24h stats:', error);
      return null;
    }
  }

  /**
   * Get prices for multiple symbols
   * @param symbols - Array of symbols (e.g., ['BTC', 'ETH'])
   */
  async getMultiplePrices(symbols: string[]): Promise<CryptoPrice[]> {
    if (symbols.length === 0) return [];

    const normalizedSymbols = symbols.map(s => s.toUpperCase());

    // Use batch API if more than 1 symbol
    if (normalizedSymbols.length > 1) {
      try {
        const response = await this.client.get<BinanceTicker24hr[]>(
          `/ticker/24hr?symbols=[${normalizedSymbols.map(s => `"${s}USDT"`).join(',')}]`
        );

        return response.data.map((t) => ({
          symbol: t.symbol.replace('USDT', ''),
          price: parseFloat(t.lastPrice),
          change24h: parseFloat(t.priceChange),
          change24hPercent: parseFloat(t.priceChangePercent),
          high24h: parseFloat(t.highPrice),
          low24h: parseFloat(t.lowPrice),
          volume24h: parseFloat(t.volume),
          quoteVolume24h: parseFloat(t.quoteVolume),
        }));
      } catch (error) {
        console.error('Error fetching multiple prices:', error);
        // Fall back to individual requests
      }
    }

    const promises = normalizedSymbols.map(symbol => this.get24hStats(symbol));
    const results = await Promise.all(promises);
    return results.filter((r): r is CryptoPrice => r !== null);
  }

  /**
   * Get kline (OHLCV) data
   * @param symbol - Trading symbol
   * @param interval - Kline interval (1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M)
   * @param limit - Number of records (max 1000)
   */
  async getKlines(
    symbol: string,
    interval: string = '1h',
    limit: number = 100
  ): Promise<KlineData[]> {
    const normalizedSymbol = symbol.toUpperCase();
    const cacheKey = `klines_${normalizedSymbol}_${interval}_${limit}`;

    const cached = this.cache.get(cacheKey) as KlineData[] | undefined;
    if (cached) return cached;

    try {
      const response = await this.client.get<BinanceKline[]>(
        `/klines?symbol=${normalizedSymbol}USDT&interval=${interval}&limit=${limit}`
      );

      const result = response.data.map((k) => ({
        time: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }));

      this.cache.set(cacheKey, result, this.config.klineCacheTTL);
      return result;
    } catch (error) {
      console.error('Error fetching klines:', error);
      return [];
    }
  }

  /**
   * Get order book data
   * @param symbol - Trading symbol
   * @param limit - Depth limit (5, 10, 20, 50, 100, 500, 1000, 5000)
   */
  async getOrderBook(symbol: string, limit: number = 20): Promise<OrderBook | null> {
    const normalizedSymbol = symbol.toUpperCase();
    const cacheKey = `orderbook_${normalizedSymbol}_${limit}`;

    const cached = this.cache.get(cacheKey) as OrderBook | undefined;
    if (cached) return cached;

    try {
      const response = await this.client.get<BinanceOrderBook>(
        `/depth?symbol=${normalizedSymbol}USDT&limit=${limit}`
      );

      const data = response.data;
      const result: OrderBook = {
        bids: data.bids.map((b) => [parseFloat(b[0]), parseFloat(b[1])]),
        asks: data.asks.map((a) => [parseFloat(a[0]), parseFloat(a[1])]),
      };

      this.cache.set(cacheKey, result, this.config.orderBookCacheTTL);
      return result;
    } catch (error) {
      console.error('Error fetching order book:', error);
      return null;
    }
  }

  /**
   * Get top 100 coins by quote volume
   */
  async getAllPrices(): Promise<CryptoPrice[]> {
    const cacheKey = 'all_prices';

    const cached = this.cache.get(cacheKey) as CryptoPrice[] | undefined;
    if (cached) return cached;

    try {
      // Use /api/v3/ticker/24hr with MINI type to reduce payload
      const response = await this.client.get<Array<{
        symbol: string;
        lastPrice: string;
        priceChange: string;
        priceChangePercent: string;
        highPrice: string;
        lowPrice: string;
        volume: string;
        quoteVolume: string;
      }>>('/ticker/24hr?type=MINI');

      const result = response.data
        .filter((t) => t.symbol.endsWith('USDT') && parseFloat(t.quoteVolume) > 1000000)
        .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .slice(0, 100)
        .map((t) => ({
          symbol: t.symbol.replace('USDT', ''),
          price: parseFloat(t.lastPrice),
          change24h: parseFloat(t.priceChange),
          change24hPercent: parseFloat(t.priceChangePercent),
          high24h: parseFloat(t.highPrice),
          low24h: parseFloat(t.lowPrice),
          volume24h: parseFloat(t.volume),
          quoteVolume24h: parseFloat(t.quoteVolume),
        }));

      this.cache.set(cacheKey, result, this.config.priceCacheTTL);
      return result;
    } catch (error) {
      console.error('Error fetching all prices:', error);
      return [];
    }
  }

  /**
   * Get top gainers (24h)
   * @param limit - Number of results
   */
  async getTopGainers(limit: number = 10): Promise<CryptoPrice[]> {
    const prices = await this.getAllPrices();
    return prices
      .filter((p) => p.change24hPercent > 0)
      .sort((a, b) => b.change24hPercent - a.change24hPercent)
      .slice(0, limit);
  }

  /**
   * Get top losers (24h)
   * @param limit - Number of results
   */
  async getTopLosers(limit: number = 10): Promise<CryptoPrice[]> {
    const prices = await this.getAllPrices();
    return prices
      .filter((p) => p.change24hPercent < 0)
      .sort((a, b) => a.change24hPercent - b.change24hPercent)
      .slice(0, limit);
  }

  /**
   * Fetch large trade data (proxy for dark pool) for a list of symbols.
   * 
   * Note: Binance spot API doesn't have a public darkpool endpoint.
   * This method estimates dark pool activity by analyzing:
   * - Recent large trades from WebSocket aggregate trade data
   * - Order book imbalances
   * - Volume anomalies
   * 
   * For real dark pool data, institutional APIs like Kaiko or Amberdata are required.
   * This is marked for future enhancement when such API access is available.
   * 
   * @deprecated Dark pool data requires institutional API access. Returns empty array for now.
   */
  async getDarkPoolData(): Promise<import("@/types").DarkPoolData[]> {
    // Dark pool data requires institutional API access
    // Free tier APIs don't provide this data
    // Marked for future enhancement
    console.warn('[Binance] Dark pool data requires institutional API (Kaiko, Amberdata). Returning empty array.');
    return [];
  }

  /**
   * Get top volume coins
   * @param limit - Number of results
   */
  async getTopVolume(limit: number = 10): Promise<CryptoPrice[]> {
    const prices = await this.getAllPrices();
    return prices
      .sort((a, b) => b.quoteVolume24h - a.quoteVolume24h)
      .slice(0, limit);
  }

  /**
   * Connect to WebSocket for real-time price updates
   * @param symbols - Symbols to subscribe to
   * @param onMessage - Callback for price updates
   */
  connectWebSocket(symbols: string[], onMessage: (data: CryptoPrice) => void): void {
    // Clean up existing connection
    this.cleanupWebSocket();

    // Store configuration for reconnect
    this.currentSymbols = [...symbols];
    this.currentCallback = onMessage;

    const normalizedSymbols = symbols.map((s) => s.toLowerCase());
    const streams = normalizedSymbols.map((s) => `${s}usdt@ticker`).join('/');

    try {
      this.ws = new WebSocket(`${BINANCE_WS_URL}/stream?streams=${streams}`);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.scheduleReconnect();
      return;
    }

    // Register subscribers
    symbols.forEach((symbol) => {
      const normalizedSymbol = symbol.toUpperCase();
      if (!this.subscribers.has(normalizedSymbol)) {
        this.subscribers.set(normalizedSymbol, new Set());
      }
      this.subscribers.get(normalizedSymbol)!.add(onMessage);
    });

    this.ws.onopen = () => {
      console.log('Binance WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.data) {
          const ticker = message.data;
          const priceData: CryptoPrice = {
            symbol: ticker.s.replace('USDT', ''),
            price: parseFloat(ticker.c),
            change24h: parseFloat(ticker.p),
            change24hPercent: parseFloat(ticker.P),
            high24h: parseFloat(ticker.h),
            low24h: parseFloat(ticker.l),
            volume24h: parseFloat(ticker.v),
            quoteVolume24h: parseFloat(ticker.q),
          };

          const symbolSubscribers = this.subscribers.get(priceData.symbol);
          if (symbolSubscribers) {
            symbolSubscribers.forEach((callback) => {
              try {
                callback(priceData);
              } catch (err) {
                console.error('Error in subscriber callback:', err);
              }
            });
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };
  }

  /**
   * Disconnect WebSocket and clear all subscribers
   */
  disconnectWebSocket(): void {
    this.cleanupWebSocket();
    this.subscribers.clear();
    this.currentSymbols = [];
    this.currentCallback = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Remove a specific subscriber
   */
  removeSubscriber(symbol: string, callback: (data: CryptoPrice) => void): void {
    const normalizedSymbol = symbol.toUpperCase();
    const symbolSubscribers = this.subscribers.get(normalizedSymbol);
    if (symbolSubscribers) {
      symbolSubscribers.delete(callback);
      if (symbolSubscribers.size === 0) {
        this.subscribers.delete(normalizedSymbol);
      }
    }
  }

  /**
   * Clear all caches
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
   * Get service statistics
   */
  getStats() {
    return {
      ...this.client.getStats(),
      cache: this.cache.getStats(),
      websocket: {
        connected: this.ws?.readyState === WebSocket.OPEN,
        subscribers: this.subscribers.size,
        reconnectAttempts: this.reconnectAttempts,
      },
    };
  }

  /**
   * Reset the HTTP client circuit breaker.
   * Call this after fixing connectivity issues (e.g. CORS headers) so the service
   * can attempt new requests instead of failing fast with CircuitBreakerError.
   */
  resetCircuitBreaker(): void {
    this.client.resetCircuitBreaker();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BinanceServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Destroy service and cleanup resources
   */
  destroy(): void {
    this.disconnectWebSocket();
    this.cache.destroy();
  }

  /**
   * Schedule reconnect with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    this.reconnectAttempts++;

    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), MAX_RECONNECT_DELAY);

    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${delay}ms`);

    this.reconnectTimeoutId = setTimeout(() => {
      if (this.currentSymbols.length > 0 && this.currentCallback) {
        this.connectWebSocket(this.currentSymbols, this.currentCallback);
      }
    }, delay);
  }

  /**
   * Clean up WebSocket without clearing subscribers
   */
  private cleanupWebSocket(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.ws) {
      // Remove event listeners to prevent memory leaks
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;

      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }

      this.ws = null;
    }
  }
}

// Create singleton instance
export const binanceAPI = BinanceService.getInstance();
// Ensure the circuit breaker is closed on startup (guards against HMR state bleed)
binanceAPI.resetCircuitBreaker();

// Export service class for testing and custom instances
export default BinanceService;
