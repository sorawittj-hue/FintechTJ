/**
 * Unified HTTP Client
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Request/Response interceptors
 * - Timeout handling
 * - Circuit breaker pattern
 * - Request deduplication
 * - Comprehensive error handling
 */

import {
  APIError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  CircuitBreakerError,
  AuthenticationError,
  NotFoundError,
  ServerError,
  ValidationError,
  normalizeError,
  isRetryableError,
} from './errors';
import { LRUCache } from './cache';
import { TokenBucketRateLimiter, DEFAULT_RATE_LIMITS } from './rateLimiter';

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  /** Base URL for all requests */
  baseURL: string;
  /** Default request timeout in milliseconds */
  timeout: number;
  /** Maximum number of retries */
  maxRetries: number;
  /** Base delay for exponential backoff in milliseconds */
  retryDelay: number;
  /** Maximum delay between retries */
  maxRetryDelay: number;
  /** Retry delay multiplier */
  backoffMultiplier: number;
  /** Whether to retry on network errors */
  retryOnNetworkError: boolean;
  /** HTTP status codes to retry */
  retryStatusCodes: number[];
  /** Default headers */
  headers: Record<string, string>;
  /** Service name for rate limiting */
  serviceName: keyof typeof DEFAULT_RATE_LIMITS;
  /** Circuit breaker configuration */
  circuitBreaker: CircuitBreakerConfig;
  /** Enable request deduplication */
  enableDeduplication: boolean;
  /** Debug logging */
  debug: boolean;
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time in milliseconds before attempting to close circuit */
  resetTimeout: number;
  /** Number of successes required to close circuit */
  successThreshold: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: HttpClientConfig = {
  baseURL: '',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  maxRetryDelay: 30000,
  backoffMultiplier: 2,
  retryOnNetworkError: true,
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
  headers: {},
  serviceName: 'default',
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 30000,
    successThreshold: 3,
  },
  enableDeduplication: true,
  debug: false,
};

/**
 * Request configuration
 */
export interface RequestConfig {
  /** Request URL (appended to baseURL) */
  url?: string;
  /** Request body (will be JSON.stringify'd if object) */
  body?: unknown;
  /** Override default timeout */
  timeout?: number;
  /** Override max retries */
  maxRetries?: number;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Skip cache lookup */
  skipCache?: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** Request priority for rate limiting (higher = processed first) */
  priority?: number;
  /** HTTP method */
  method?: string;
  /** Request cache mode */
  cache?: RequestCache;
  /** Request credentials mode */
  credentials?: RequestCredentials;
  /** Request integrity */
  integrity?: string;
  /** Keepalive flag */
  keepalive?: boolean;
  /** Request mode */
  mode?: RequestMode;
  /** Redirect mode */
  redirect?: RequestRedirect;
  /** Referrer */
  referrer?: string;
  /** Referrer policy */
  referrerPolicy?: ReferrerPolicy;
  /** Signal for aborting */
  signal?: AbortSignal | null;
}

/**
 * Response wrapper with metadata
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  cached: boolean;
  fromCache: boolean;
  duration: number;
}

/**
 * Request interceptor
 */
export type RequestInterceptor = (
  url: string,
  config: RequestConfig
) => Promise<{ url: string; config: RequestConfig }> | { url: string; config: RequestConfig };

/**
 * Response interceptor
 */
export type ResponseInterceptor<T> = (
  response: ApiResponse<T>
) => Promise<ApiResponse<T>> | ApiResponse<T>;

/**
 * Error interceptor
 */
export type ErrorInterceptor = (error: APIError) => Promise<APIError> | APIError;

/**
 * Circuit breaker states
 */
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * HTTP Client implementation
 */
export class HttpClient {
  private config: HttpClientConfig;
  private rateLimiter: TokenBucketRateLimiter;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor<unknown>[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  private deduplicationCache: LRUCache<Promise<unknown>>;

  // Circuit breaker state
  private circuitState: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private circuitResetTimeout?: ReturnType<typeof setTimeout>;

  constructor(config: Partial<HttpClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rateLimiter = TokenBucketRateLimiter.forService(this.config.serviceName);
    this.deduplicationCache = new LRUCache<Promise<unknown>>({
      maxSize: 100,
      defaultTTL: 5000, // 5 seconds for deduplication
    });

    if (this.config.debug) {
      console.log('[HttpClient] Initialized:', this.config.serviceName);
    }
  }

  /**
   * Add a request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index !== -1) {
        this.requestInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * Add a response interceptor
   */
  addResponseInterceptor<T>(interceptor: ResponseInterceptor<T>): () => void {
    this.responseInterceptors.push(interceptor as ResponseInterceptor<unknown>);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor as ResponseInterceptor<unknown>);
      if (index !== -1) {
        this.responseInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * Add an error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor);
    return () => {
      const index = this.errorInterceptors.indexOf(interceptor);
      if (index !== -1) {
        this.errorInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * Make a GET request
   */
  async get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T>(url: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'POST', body });
  }

  /**
   * Make a PUT request
   */
  async put<T>(url: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PUT', body });
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(url: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PATCH', body });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }

  /**
   * Make a request with full control
   */
  async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const requestKey = this.getRequestKey(config);

    // Check for deduplication
    if (this.config.enableDeduplication && !config.skipCache) {
      const pending = this.deduplicationCache.get(requestKey);
      if (pending) {
        if (this.config.debug) {
          console.log('[HttpClient] Deduplicating request:', config.url);
        }
        return pending as Promise<ApiResponse<T>>;
      }
    }

    const promise = this.executeRequest<T>(config);

    // Store for deduplication
    if (this.config.enableDeduplication) {
      this.deduplicationCache.set(requestKey, promise);
    }

    return promise;
  }

  /**
   * Execute the actual request with retry logic
   */
  private async executeRequest<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    // Check circuit breaker
    this.checkCircuitBreaker();

    const maxRetries = config.maxRetries ?? this.config.maxRetries;
    let lastError: APIError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.makeRequest<T>(config);
        this.onSuccess();
        return response;
      } catch (error) {
        lastError = normalizeError(error);

        // Run error interceptors
        for (const interceptor of this.errorInterceptors) {
          lastError = await interceptor(lastError);
        }

        // Don't retry non-retryable errors
        if (!isRetryableError(lastError)) {
          throw lastError;
        }

        // Don't retry if it's the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Check if we should retry this status code
        if (lastError.statusCode && !this.config.retryStatusCodes.includes(lastError.statusCode)) {
          throw lastError;
        }

        // Calculate retry delay
        const delay = this.calculateRetryDelay(attempt, lastError);

        if (this.config.debug) {
          console.log(
            `[HttpClient] Retry ${attempt + 1}/${maxRetries} for ${config.url} after ${delay}ms`
          );
        }

        await this.sleep(delay);
      }
    }

    throw lastError || new APIError('Request failed', 'REQUEST_FAILED');
  }

  /**
   * Make a single request
   */
  private async makeRequest<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const startTime = Date.now();

    // Build URL
    let url = this.buildURL(config.url || '');

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      const result = await interceptor(url, config);
      url = result.url;
      config = result.config;
    }

    // Build headers — only add Content-Type when there is a body
    // to avoid CORS preflight on simple GET/DELETE requests to external APIs
    const hasBody = config.body !== undefined && config.body !== null;
    const headers: Record<string, string> = {
      ...this.config.headers,
      ...config.headers,
    };
    if (hasBody && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    // Build request init
    const requestInit: RequestInit = {
      method: config.method || 'GET',
      headers,
      cache: config.cache,
      credentials: config.credentials,
      integrity: config.integrity,
      keepalive: config.keepalive,
      mode: config.mode,
      redirect: config.redirect,
      referrer: config.referrer,
      referrerPolicy: config.referrerPolicy,
      signal: config.signal,
    };

    // Handle body
    if (hasBody) {
      if (typeof config.body === 'object') {
        requestInit.body = JSON.stringify(config.body);
      } else {
        requestInit.body = config.body as BodyInit;
      }
    }

    // Execute with rate limiting
    const timeout = config.timeout ?? this.config.timeout;

    try {
      const response = await this.rateLimiter.execute(
        () => this.fetchWithTimeout(url, requestInit, timeout),
        config.priority
      );

      // Handle HTTP errors
      if (!response.ok) {
        await this.handleHTTPError(response);
      }

      // Parse response
      const data = await this.parseResponse<T>(response);

      const apiResponse: ApiResponse<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        cached: false,
        fromCache: false,
        duration: Date.now() - startTime,
      };

      // Apply response interceptors
      let finalResponse = apiResponse;
      for (const interceptor of this.responseInterceptors) {
        finalResponse = await interceptor(finalResponse) as ApiResponse<T>;
      }

      return finalResponse;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new TimeoutError(timeout);
        }
        throw new NetworkError(error.message, error);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Handle HTTP error responses
   */
  private async handleHTTPError(response: Response): Promise<never> {
    const status = response.status;

    // Try to parse error body
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      try {
        errorBody = await response.text();
      } catch {
        errorBody = null;
      }
    }

    const message = this.extractErrorMessage(errorBody) || response.statusText;

    switch (status) {
      case 400:
        throw new ValidationError(message);
      case 401:
      case 403:
        throw new AuthenticationError(message, status);
      case 404:
        throw new NotFoundError(undefined, message);
      case 429: {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(
          message,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      }
      default:
        if (status >= 500) {
          throw new ServerError(status, message);
        }
        throw new APIError(message, `HTTP_${status}`, status, true);
    }
  }

  /**
   * Parse response body
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('Content-Type') || '';

    if (contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    if (contentType.includes('text/')) {
      return response.text() as unknown as Promise<T>;
    }

    return response.blob() as unknown as Promise<T>;
  }

  /**
   * Extract error message from response body
   */
  private extractErrorMessage(body: unknown): string | null {
    if (!body) return null;

    if (typeof body === 'string') return body;

    if (typeof body === 'object') {
      const obj = body as Record<string, unknown>;
      return (
        (typeof obj.message === 'string' && obj.message) ||
        (typeof obj.error === 'string' && obj.error) ||
        (typeof obj.detail === 'string' && obj.detail) ||
        null
      );
    }

    return null;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number, error: APIError): number {
    // Use RateLimitError's retry after if available
    if (error instanceof RateLimitError) {
      return error.getRetryDelay();
    }

    // Exponential backoff: delay * multiplier^attempt
    const baseDelay = this.config.retryDelay * Math.pow(this.config.backoffMultiplier, attempt);

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 1000;

    return Math.min(baseDelay + jitter, this.config.maxRetryDelay);
  }

  /**
   * Build full URL from path
   */
  private buildURL(path: string): string {
    if (path.startsWith('http')) {
      return path;
    }
    const baseURL = this.config.baseURL.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseURL}${cleanPath}`;
  }

  /**
   * Generate deduplication key
   */
  private getRequestKey(config: RequestConfig): string {
    return `${config.method || 'GET'}:${config.url}:${JSON.stringify(config.body)}`;
  }

  /**
   * Check circuit breaker state
   */
  private checkCircuitBreaker(): void {
    if (this.circuitState === 'OPEN') {
      const resetTime = (this.lastFailureTime || 0) + this.config.circuitBreaker.resetTimeout;

      if (Date.now() >= resetTime) {
        // Transition to half-open
        this.circuitState = 'HALF_OPEN';
        this.failureCount = 0;
        this.successCount = 0;

        if (this.config.debug) {
          console.log('[HttpClient] Circuit breaker: HALF_OPEN');
        }
      } else {
        throw new CircuitBreakerError(new Date(resetTime));
      }
    }
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    if (this.circuitState === 'HALF_OPEN') {
      this.successCount++;

      if (this.successCount >= this.config.circuitBreaker.successThreshold) {
        this.circuitState = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;

        if (this.config.debug) {
          console.log('[HttpClient] Circuit breaker: CLOSED');
        }
      }
    }
  }

  /**
   * Handle failed request
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.circuitState === 'HALF_OPEN' ||
      this.failureCount >= this.config.circuitBreaker.failureThreshold) {
      this.circuitState = 'OPEN';
      this.successCount = 0;

      if (this.config.debug) {
        console.log('[HttpClient] Circuit breaker: OPEN');
      }

      // Schedule reset
      if (this.circuitResetTimeout) {
        clearTimeout(this.circuitResetTimeout);
      }

      this.circuitResetTimeout = setTimeout(() => {
        if (this.circuitState === 'OPEN') {
          this.circuitState = 'HALF_OPEN';
          if (this.config.debug) {
            console.log('[HttpClient] Circuit breaker: HALF_OPEN (auto)');
          }
        }
      }, this.config.circuitBreaker.resetTimeout);
    }
  }

  /**
   * Get circuit breaker state
   */
  getCircuitState(): CircuitState {
    return this.circuitState;
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitState = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;

    if (this.circuitResetTimeout) {
      clearTimeout(this.circuitResetTimeout);
      this.circuitResetTimeout = undefined;
    }
  }

  /**
   * Get client statistics
   */
  getStats(): {
    circuitState: CircuitState;
    failureCount: number;
    rateLimiter: unknown;
    deduplicationCache: unknown;
  } {
    return {
      circuitState: this.circuitState,
      failureCount: this.failureCount,
      rateLimiter: this.rateLimiter.getStats(),
      deduplicationCache: this.deduplicationCache.getStats(),
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a configured HTTP client
 */
export function createClient(config: Partial<HttpClientConfig>): HttpClient {
  return new HttpClient(config);
}

export default HttpClient;
