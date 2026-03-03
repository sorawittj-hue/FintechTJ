/**
 * Crypto News API Service
 * 
 * Provides access to cryptocurrency news from various sources.
 * Supports multiple news providers with a unified interface.
 * 
 * Features:
 * - Latest crypto news
 * - News by category/symbol
 * - Search functionality
 * - Proper caching and rate limiting
 */

import { HttpClient } from './client';
import { LRUCache } from './cache';
import { normalizeError, APIError } from './errors';

// Environment-based configuration
const NEWSAPI_BASE_URL = import.meta.env.VITE_NEWSAPI_BASE_URL || 'https://newsapi.org/v2';
const CRYPTOCOMPARE_BASE_URL = import.meta.env.VITE_CRYPTOCOMPARE_BASE_URL || 'https://min-api.cryptocompare.com/data/v2';

/**
 * News provider types
 */
export type NewsProvider = 'newsapi' | 'cryptocompare';

/**
 * News API configuration
 */
export interface NewsServiceConfig {
  /** Primary provider */
  provider: NewsProvider;
  /** API key for the provider */
  apiKey?: string;
  /** Fallback provider */
  fallbackProvider?: NewsProvider;
  /** Fallback API key */
  fallbackApiKey?: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Cache TTL in milliseconds */
  cacheTTL: number;
  /** Maximum results per request */
  maxResults: number;
  /** Enable debug logging */
  debug: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: NewsServiceConfig = {
  provider: 'cryptocompare',
  timeout: 30000,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  maxResults: 20,
  debug: false,
};

/**
 * News article
 */
export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  source: {
    name: string;
    id?: string;
  };
  author?: string;
  categories?: string[];
  relatedCoins?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

/**
 * News category
 */
export type NewsCategory = 
  | 'general'
  | 'technology'
  | 'regulation'
  | 'market'
  | 'defi'
  | 'nft'
  | 'mining'
  | 'adoption';

/**
 * News search filters
 */
export interface NewsFilters {
  /** Search query */
  query?: string;
  /** News category */
  category?: NewsCategory;
  /** Related cryptocurrency symbols (e.g., ['BTC', 'ETH']) */
  symbols?: string[];
  /** Start date (ISO string) */
  from?: string;
  /** End date (ISO string) */
  to?: string;
  /** Language code */
  language?: string;
  /** Sort by */
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
  /** Maximum results */
  maxResults?: number;
}

/**
 * News response
 */
export interface NewsResponse {
  articles: NewsArticle[];
  totalResults: number;
  page: number;
  pageSize: number;
}

/**
 * CryptoCompare news item (raw API response)
 */
interface CryptoCompareNewsItem {
  id: string;
  guid: string;
  published_on: number;
  imageurl: string;
  title: string;
  url: string;
  source: string;
  body: string;
  tags: string;
  categories: string;
  upvotes: string;
  downvotes: string;
  lang: string;
  source_info: {
    name: string;
    img: string;
    lang: string;
  };
}

/**
 * NewsAPI article (raw API response)
 */
interface NewsAPIArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

/**
 * News API Service - Singleton
 */
export class NewsService {
  private static instance: NewsService | null = null;
  private client: HttpClient;
  private config: NewsServiceConfig;
  private cache: LRUCache<unknown>;
  private fallbackClient?: HttpClient;

  private constructor(config: Partial<NewsServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    const baseURL = this.getProviderBaseURL(this.config.provider);
    
    this.client = new HttpClient({
      baseURL,
      timeout: this.config.timeout,
      serviceName: 'newsapi',
      maxRetries: 2,
      debug: this.config.debug,
    });

    // Add API key header
    if (this.config.apiKey) {
      this.client.addRequestInterceptor(async (url, reqConfig) => ({
        url: this.addApiKeyToURL(url, this.config.apiKey!, this.config.provider),
        config: reqConfig,
      }));
    }

    // Setup fallback client if configured
    if (this.config.fallbackProvider && this.config.fallbackApiKey) {
      const fallbackBaseURL = this.getProviderBaseURL(this.config.fallbackProvider);
      this.fallbackClient = new HttpClient({
        baseURL: fallbackBaseURL,
        timeout: this.config.timeout,
        serviceName: 'newsapi',
        maxRetries: 2,
        debug: this.config.debug,
      });

      this.fallbackClient.addRequestInterceptor(async (url, reqConfig) => ({
        url: this.addApiKeyToURL(url, this.config.fallbackApiKey!, this.config.fallbackProvider!),
        config: reqConfig,
      }));
    }

    // Initialize cache
    this.cache = new LRUCache<unknown>({
      maxSize: 200,
      defaultTTL: this.config.cacheTTL,
      debug: this.config.debug,
    });

    if (this.config.debug) {
      console.log('[NewsService] Initialized with provider:', this.config.provider);
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<NewsServiceConfig>): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService(config);
    }
    return NewsService.instance;
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  static resetInstance(): void {
    NewsService.instance?.destroy();
    NewsService.instance = null;
  }

  /**
   * Get latest news
   * @param filters - Search filters
   */
  async getLatestNews(filters: NewsFilters = {}): Promise<NewsResponse> {
    const cacheKey = LRUCache.generateKey(['latest', JSON.stringify(filters)]);

    const cached = this.cache.get(cacheKey) as NewsResponse | undefined;
    if (cached) {
      if (this.config.debug) console.log('[NewsService] Cache hit:', cacheKey);
      return cached;
    }

    try {
      const response = await this.fetchNews(filters);
      this.cache.set(cacheKey, response, this.config.cacheTTL);
      return response;
    } catch (error) {
      // Try fallback if available
      if (this.fallbackClient) {
        try {
          const response = await this.fetchNewsWithClient(filters, this.fallbackClient, this.config.fallbackProvider!);
          this.cache.set(cacheKey, response, this.config.cacheTTL);
          return response;
        } catch {
          // Fall through to throw original error
        }
      }
      throw this.handleError(error);
    }
  }

  /**
   * Get news for specific cryptocurrency
   * @param symbol - Cryptocurrency symbol (e.g., 'BTC', 'ETH')
   * @param filters - Additional filters
   */
  async getNewsBySymbol(
    symbol: string,
    filters: Omit<NewsFilters, 'symbols' | 'query'> = {}
  ): Promise<NewsResponse> {
    return this.getLatestNews({
      ...filters,
      symbols: [symbol],
      query: symbol,
    });
  }

  /**
   * Search news
   * @param query - Search query
   * @param filters - Additional filters
   */
  async searchNews(query: string, filters: Omit<NewsFilters, 'query'> = {}): Promise<NewsResponse> {
    return this.getLatestNews({
      ...filters,
      query,
    });
  }

  /**
   * Get news by category
   * @param category - News category
   * @param filters - Additional filters
   */
  async getNewsByCategory(
    category: NewsCategory,
    filters: Omit<NewsFilters, 'category'> = {}
  ): Promise<NewsResponse> {
    return this.getLatestNews({
      ...filters,
      category,
    });
  }

  /**
   * Fetch news from the configured provider
   */
  private async fetchNews(filters: NewsFilters): Promise<NewsResponse> {
    return this.fetchNewsWithClient(filters, this.client, this.config.provider);
  }

  /**
   * Fetch news using a specific client
   */
  private async fetchNewsWithClient(
    filters: NewsFilters,
    client: HttpClient,
    provider: NewsProvider
  ): Promise<NewsResponse> {
    switch (provider) {
      case 'cryptocompare':
        return this.fetchCryptoCompareNews(filters, client);
      case 'newsapi':
        return this.fetchNewsAPINews(filters, client);
      default:
        throw new APIError(`Unknown provider: ${provider}`, 'UNKNOWN_PROVIDER');
    }
  }

  /**
   * Fetch news from CryptoCompare
   */
  private async fetchCryptoCompareNews(
    filters: NewsFilters,
    client: HttpClient
  ): Promise<NewsResponse> {
    const params = new URLSearchParams({
      lang: filters.language || 'EN',
    });

    if (filters.symbols && filters.symbols.length > 0) {
      params.append('feeds', filters.symbols.join(','));
    }

    if (filters.category) {
      params.append('categories', filters.category);
    }

    const maxResults = filters.maxResults || this.config.maxResults;
    
    const response = await client.get<{
      Data: CryptoCompareNewsItem[];
    }>(`/news/?${params.toString()}`);

    let articles = response.data.Data.map(this.transformCryptoCompareArticle);

    // Filter by query if provided
    if (filters.query) {
      const queryLower = filters.query.toLowerCase();
      articles = articles.filter(
        article =>
          article.title.toLowerCase().includes(queryLower) ||
          article.description.toLowerCase().includes(queryLower)
      );
    }

    // Sort by published date
    articles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Limit results
    articles = articles.slice(0, maxResults);

    return {
      articles,
      totalResults: articles.length,
      page: 1,
      pageSize: maxResults,
    };
  }

  /**
   * Fetch news from NewsAPI
   */
  private async fetchNewsAPINews(
    filters: NewsFilters,
    client: HttpClient
  ): Promise<NewsResponse> {
    const queryParts: string[] = ['cryptocurrency'];
    
    if (filters.query) {
      queryParts.push(filters.query);
    }
    
    if (filters.symbols && filters.symbols.length > 0) {
      queryParts.push(...filters.symbols);
    }

    const params = new URLSearchParams({
      q: queryParts.join(' OR '),
      language: filters.language || 'en',
      sortBy: filters.sortBy || 'publishedAt',
      pageSize: String(filters.maxResults || this.config.maxResults),
    });

    if (filters.from) {
      params.append('from', filters.from);
    }

    if (filters.to) {
      params.append('to', filters.to);
    }

    const response = await client.get<{
      articles: NewsAPIArticle[];
      totalResults: number;
    }>(`/everything?${params.toString()}`);

    const articles = response.data.articles.map(this.transformNewsAPIArticle);

    return {
      articles,
      totalResults: response.data.totalResults,
      page: 1,
      pageSize: filters.maxResults || this.config.maxResults,
    };
  }

  /**
   * Transform CryptoCompare news item to standard format
   */
  private transformCryptoCompareArticle(item: CryptoCompareNewsItem): NewsArticle {
    const categories = item.categories
      .split('|')
      .filter(Boolean)
      .map(c => c.trim().toLowerCase());

    const relatedCoins = item.tags
      .split('|')
      .filter(Boolean)
      .map(t => t.trim().toUpperCase());

    return {
      id: item.id,
      title: item.title,
      description: item.body.substring(0, 300) + (item.body.length > 300 ? '...' : ''),
      url: item.url,
      imageUrl: item.imageurl || undefined,
      publishedAt: new Date(item.published_on * 1000).toISOString(),
      source: {
        name: item.source_info.name,
        id: item.source,
      },
      categories,
      relatedCoins,
    };
  }

  /**
   * Transform NewsAPI article to standard format
   */
  private transformNewsAPIArticle(article: NewsAPIArticle): NewsArticle {
    return {
      id: `${article.source.id || 'unknown'}-${Date.parse(article.publishedAt)}`,
      title: article.title,
      description: article.description || '',
      url: article.url,
      imageUrl: article.urlToImage || undefined,
      publishedAt: article.publishedAt,
      source: {
        name: article.source.name,
        id: article.source.id || undefined,
      },
      author: article.author || undefined,
    };
  }

  /**
   * Get base URL for provider
   */
  private getProviderBaseURL(provider: NewsProvider): string {
    switch (provider) {
      case 'cryptocompare':
        return CRYPTOCOMPARE_BASE_URL;
      case 'newsapi':
        return NEWSAPI_BASE_URL;
      default:
        return NEWSAPI_BASE_URL;
    }
  }

  /**
   * Add API key to URL
   */
  private addApiKeyToURL(url: string, apiKey: string, provider: NewsProvider): string {
    const separator = url.includes('?') ? '&' : '?';
    
    switch (provider) {
      case 'cryptocompare':
        return `${url}${separator}api_key=${apiKey}`;
      case 'newsapi':
        return `${url}${separator}apiKey=${apiKey}`;
      default:
        return `${url}${separator}api_key=${apiKey}`;
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
  updateConfig(config: Partial<NewsServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Handle and normalize errors
   */
  private handleError(error: unknown): APIError {
    const normalizedError = normalizeError(error);

    if (normalizedError.message.includes('apiKey')) {
      return new APIError(
        'News API key invalid or missing. Please check your configuration.',
        'NEWS_API_KEY_ERROR',
        401,
        false
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
export const newsService = NewsService.getInstance();

export default NewsService;
