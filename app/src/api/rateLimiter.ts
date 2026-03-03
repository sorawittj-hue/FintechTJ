/**
 * Token Bucket Rate Limiter with Queue Management
 * 
 * Features:
 * - Token bucket algorithm for rate limiting
 * - Request queue for handling bursts
 * - Per-service rate limit configuration
 * - Adaptive rate adjustment
 * - Event callbacks
 */

import { RateLimitError, normalizeError } from './errors';

/**
 * Rate limit configuration for a service
 */
export interface RateLimitConfig {
  /** Maximum number of tokens (requests allowed in bucket) */
  bucketSize: number;
  /** Tokens added per second */
  refillRate: number;
  /** Maximum queue size for pending requests */
  maxQueueSize: number;
  /** Default timeout for queued requests in milliseconds */
  queueTimeout: number;
  /** Service identifier for logging */
  serviceName: string;
}

/**
 * Default rate limit configurations for common services
 */
export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  binance: {
    bucketSize: 20,
    refillRate: 10, // 10 req/s for non-weighted endpoints
    maxQueueSize: 100,
    queueTimeout: 30000,
    serviceName: 'Binance',
  },
  coingecko: {
    bucketSize: 30, // Free tier: 30 calls/minute
    refillRate: 0.5, // 30 per minute = 0.5 per second
    maxQueueSize: 50,
    queueTimeout: 60000,
    serviceName: 'CoinGecko',
  },
  newsapi: {
    bucketSize: 100, // Adjust based on your plan
    refillRate: 1, // 100 per day = ~0.001 per second, but burst allowed
    maxQueueSize: 20,
    queueTimeout: 120000,
    serviceName: 'NewsAPI',
  },
  default: {
    bucketSize: 60,
    refillRate: 1,
    maxQueueSize: 100,
    queueTimeout: 30000,
    serviceName: 'Default',
  },
};

/**
 * Queued request item
 */
interface QueuedRequest {
  id: string;
  execute: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
  addedAt: number;
}

/**
 * Rate limiter statistics
 */
export interface RateLimiterStats {
  serviceName: string;
  tokensAvailable: number;
  bucketSize: number;
  queueSize: number;
  maxQueueSize: number;
  totalProcessed: number;
  totalRejected: number;
  totalTimedOut: number;
  averageWaitTime: number;
}

/**
 * Token bucket rate limiter implementation
 */
export class TokenBucketRateLimiter {
  private config: RateLimitConfig;
  private tokens: number;
  private lastRefill: number;
  private queue: QueuedRequest[] = [];
  private processing = false;
  private stats = {
    totalProcessed: 0,
    totalRejected: 0,
    totalTimedOut: 0,
    totalWaitTime: 0,
  };

  constructor(config: RateLimitConfig) {
    this.config = config;

    // Check session storage for existing state
    const storageKey = `rate_limit_${config.serviceName}`;
    let initialTokens = config.bucketSize;
    let initialRefill = Date.now();

    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const stored = sessionStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed.tokens === 'number' && typeof parsed.lastRefill === 'number') {
            initialTokens = parsed.tokens;
            initialRefill = parsed.lastRefill;
          }
        }
      }
    } catch {
      // Ignore storage errors
    }

    this.tokens = initialTokens;
    this.lastRefill = initialRefill;
  }

  /**
   * Save current state to session storage
   */
  private saveState(): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const storageKey = `rate_limit_${this.config.serviceName}`;
        sessionStorage.setItem(storageKey, JSON.stringify({
          tokens: this.tokens,
          lastRefill: this.lastRefill
        }));
      }
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Create a rate limiter with default configuration for a known service
   */
  static forService(serviceName: keyof typeof DEFAULT_RATE_LIMITS): TokenBucketRateLimiter {
    const config = DEFAULT_RATE_LIMITS[serviceName] || DEFAULT_RATE_LIMITS.default;
    return new TokenBucketRateLimiter(config);
  }

  /**
   * Execute a function with rate limiting
   * @param fn - Function to execute
   * @param priority - Optional priority (higher = processed first)
   */
  async execute<T>(fn: () => Promise<T>, priority = 0): Promise<T> {
    // Try to execute immediately if tokens available
    if (this.tryConsumeToken()) {
      return this.executeFunction(fn);
    }

    // Queue the request
    return this.queueRequest(fn, priority);
  }

  /**
   * Check if a request can be executed immediately
   */
  canExecute(): boolean {
    this.refillTokens();
    return this.tokens >= 1;
  }

  /**
   * Get estimated wait time for the next request in milliseconds
   */
  getEstimatedWaitTime(): number {
    this.refillTokens();

    if (this.tokens >= 1) {
      return 0;
    }

    // Calculate time to get next token
    const tokensNeeded = 1 - this.tokens;
    const timePerToken = 1000 / this.config.refillRate;

    return Math.ceil(tokensNeeded * timePerToken);
  }

  /**
   * Get current rate limiter statistics
   */
  getStats(): RateLimiterStats {
    this.refillTokens();

    const avgWaitTime = this.stats.totalProcessed > 0
      ? this.stats.totalWaitTime / this.stats.totalProcessed
      : 0;

    return {
      serviceName: this.config.serviceName,
      tokensAvailable: this.tokens,
      bucketSize: this.config.bucketSize,
      queueSize: this.queue.length,
      maxQueueSize: this.config.maxQueueSize,
      totalProcessed: this.stats.totalProcessed,
      totalRejected: this.stats.totalRejected,
      totalTimedOut: this.stats.totalTimedOut,
      averageWaitTime: avgWaitTime,
    };
  }

  /**
   * Update rate limit configuration dynamically
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };

    // Adjust tokens if bucket size decreased
    if (this.tokens > this.config.bucketSize) {
      this.tokens = this.config.bucketSize;
    }
  }

  /**
   * Clear the request queue
   */
  clearQueue(reason = 'Queue cleared'): void {
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        clearTimeout(request.timeoutId);
        request.reject(new Error(reason));
      }
    }
  }

  /**
   * Reset the rate limiter state
   */
  reset(): void {
    this.tokens = this.config.bucketSize;
    this.lastRefill = Date.now();
    this.saveState();
    this.clearQueue('Rate limiter reset');
    this.stats = {
      totalProcessed: 0,
      totalRejected: 0,
      totalTimedOut: 0,
      totalWaitTime: 0,
    };
  }

  /**
   * Try to consume a token
   */
  private tryConsumeToken(): boolean {
    this.refillTokens();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      this.saveState();
      return true;
    }

    return false;
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsedMs = now - this.lastRefill;
    const tokensToAdd = (elapsedMs / 1000) * this.config.refillRate;

    const newTokens = Math.min(this.config.bucketSize, this.tokens + tokensToAdd);

    if (newTokens !== this.tokens || this.lastRefill !== now) {
      this.tokens = newTokens;
      this.lastRefill = now;
      this.saveState();
    }
  }

  /**
   * Queue a request for later execution
   */
  private queueRequest<T>(fn: () => Promise<T>, priority: number): Promise<T> {
    return new Promise((resolve, reject) => {
      // Check queue size limit
      if (this.queue.length >= this.config.maxQueueSize) {
        this.stats.totalRejected++;
        reject(new RateLimitError(
          `Rate limit queue full (${this.config.maxQueueSize} requests)`,
          undefined,
          this.config.bucketSize,
          0
        ));
        return;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const addedAt = Date.now();

      // Set timeout for queue wait
      const timeoutId = setTimeout(() => {
        this.removeFromQueue(id);
        this.stats.totalTimedOut++;
        reject(new RateLimitError(
          `Request timed out waiting in rate limit queue after ${this.config.queueTimeout}ms`,
          undefined,
          this.config.bucketSize,
          Math.floor(this.tokens)
        ));
      }, this.config.queueTimeout);

      const request: QueuedRequest = {
        id,
        execute: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
        timeoutId,
        addedAt,
      };

      // Insert based on priority (higher priority = closer to front)
      if (priority > 0 && this.queue.length > 0) {
        const insertIndex = this.queue.findIndex(() => priority > 0);
        if (insertIndex === -1) {
          this.queue.push(request);
        } else {
          this.queue.splice(insertIndex, 0, request);
        }
      } else {
        this.queue.push(request);
      }

      // Start processing queue
      this.processQueue();
    });
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        if (!this.tryConsumeToken()) {
          // No tokens available, wait and try again
          const waitTime = this.getEstimatedWaitTime();
          if (waitTime > 0) {
            await this.delay(waitTime);
            continue;
          }
        }

        const request = this.queue.shift();
        if (!request) continue;

        clearTimeout(request.timeoutId);

        // Calculate wait time for stats
        const waitTime = Date.now() - request.addedAt;
        this.stats.totalWaitTime += waitTime;

        // Execute the request
        try {
          const result = await this.executeFunction(request.execute as () => Promise<unknown>);
          request.resolve(result);
        } catch (error) {
          request.reject(normalizeError(error));
        }
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Execute a function and track stats
   */
  private async executeFunction<T>(fn: () => Promise<T>): Promise<T> {
    this.stats.totalProcessed++;
    return fn();
  }

  /**
   * Remove a request from the queue by ID
   */
  private removeFromQueue(id: string): void {
    const index = this.queue.findIndex(r => r.id === id);
    if (index !== -1) {
      const request = this.queue.splice(index, 1)[0];
      clearTimeout(request.timeoutId);
    }
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Rate limiter manager for multiple services
 */
export class RateLimiterManager {
  private limiters = new Map<string, TokenBucketRateLimiter>();

  /**
   * Get or create a rate limiter for a service
   */
  getLimiter(serviceName: keyof typeof DEFAULT_RATE_LIMITS): TokenBucketRateLimiter {
    if (!this.limiters.has(serviceName)) {
      this.limiters.set(serviceName, TokenBucketRateLimiter.forService(serviceName));
    }

    return this.limiters.get(serviceName)!;
  }

  /**
   * Execute with rate limiting for a specific service
   */
  async execute<T>(
    serviceName: keyof typeof DEFAULT_RATE_LIMITS,
    fn: () => Promise<T>,
    priority = 0
  ): Promise<T> {
    const limiter = this.getLimiter(serviceName);
    return limiter.execute(fn, priority);
  }

  /**
   * Get stats for all rate limiters
   */
  getAllStats(): Record<string, RateLimiterStats> {
    const stats: Record<string, RateLimiterStats> = {};

    for (const [name, limiter] of this.limiters.entries()) {
      stats[name] = limiter.getStats();
    }

    return stats;
  }

  /**
   * Reset all rate limiters
   */
  resetAll(): void {
    for (const limiter of this.limiters.values()) {
      limiter.reset();
    }
  }

  /**
   * Clear all queues
   */
  clearAllQueues(): void {
    for (const limiter of this.limiters.values()) {
      limiter.clearQueue('All queues cleared');
    }
  }
}

/**
 * Global rate limiter manager instance
 */
export const globalRateLimiter = new RateLimiterManager();

export default TokenBucketRateLimiter;
