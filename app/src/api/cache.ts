/**
 * LRU Cache System with TTL and Stale-While-Revalidate Support
 * 
 * Features:
 * - LRU (Least Recently Used) eviction
 * - TTL (Time To Live) expiration
 * - Stale-while-revalidate pattern support
 * - Memory usage tracking
 * - Event callbacks
 */

// CacheError available from './errors' if needed for cache-specific error handling

/**
 * Cache entry metadata
 */
export interface CacheEntryMetadata {
  createdAt: number;
  expiresAt: number;
  staleAt: number;
  accessCount: number;
  lastAccessedAt: number;
}

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  data: T;
  metadata: CacheEntryMetadata;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /** Maximum number of items in cache */
  maxSize: number;
  /** Default TTL in milliseconds */
  defaultTTL: number;
  /** Stale time in milliseconds (time before data is considered stale but still usable) */
  staleTTL: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Callback when an item is evicted */
  onEvict?: (key: string, reason: 'lru' | 'expired') => void;
}

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 1000,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  staleTTL: 60 * 1000, // 1 minute
  debug: false,
};

/**
 * Cache statistics
 */
export interface CacheStats {
  size: number;
  maxSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictedCount: number;
  expiredCount: number;
  memoryUsage: number;
}

/**
 * LRU Cache implementation with TTL support
 */
export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private config: CacheConfig;
  private stats = {
    hitCount: 0,
    missCount: 0,
    evictedCount: 0,
    expiredCount: 0,
  };
  private cleanupInterval?: ReturnType<typeof setInterval>;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();

    // Start periodic cleanup
    this.startCleanupInterval();

    if (this.config.debug) {
      console.log('[LRUCache] Initialized with config:', this.config);
    }
  }

  /**
   * Generate a cache key from input
   */
  static generateKey(parts: (string | number | undefined)[]): string {
    return parts
      .filter((p): p is string | number => p !== undefined)
      .map(p => (typeof p === 'object' ? JSON.stringify(p) : String(p)))
      .join(':');
  }

  /**
   * Set a value in the cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Optional custom TTL in milliseconds
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const actualTTL = ttl ?? this.config.defaultTTL;

    // Evict oldest items if cache is full
    while (this.cache.size >= this.config.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data: value,
      metadata: {
        createdAt: now,
        expiresAt: now + actualTTL,
        staleAt: now + actualTTL - this.config.staleTTL,
        accessCount: 0,
        lastAccessedAt: now,
      },
    };

    this.cache.set(key, entry);

    if (this.config.debug) {
      console.log(`[LRUCache] Set: ${key}, expires in ${actualTTL}ms`);
    }
  }

  /**
   * Get a value from the cache
   * @param key - Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.missCount++;
      return undefined;
    }

    const now = Date.now();

    // Check if expired
    if (now > entry.metadata.expiresAt) {
      this.cache.delete(key);
      this.stats.expiredCount++;
      this.stats.missCount++;
      
      if (this.config.debug) {
        console.log(`[LRUCache] Expired: ${key}`);
      }
      
      return undefined;
    }

    // Update access metadata
    entry.metadata.accessCount++;
    entry.metadata.lastAccessedAt = now;

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.stats.hitCount++;

    if (this.config.debug) {
      console.log(`[LRUCache] Hit: ${key}`);
    }

    return entry.data;
  }

  /**
   * Get a value with stale-while-revalidate pattern
   * @param key - Cache key
   * @returns Object with data, isStale flag, and metadata
   */
  getWithStale(key: string): { 
    data?: T; 
    isStale: boolean; 
    metadata?: CacheEntryMetadata;
  } {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.missCount++;
      return { isStale: false };
    }

    const now = Date.now();

    // Check if fully expired
    if (now > entry.metadata.expiresAt) {
      this.cache.delete(key);
      this.stats.expiredCount++;
      this.stats.missCount++;
      return { isStale: false };
    }

    // Check if stale (still usable but should be refreshed)
    const isStale = now > entry.metadata.staleAt;

    // Update access metadata
    entry.metadata.accessCount++;
    entry.metadata.lastAccessedAt = now;

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.stats.hitCount++;

    if (this.config.debug) {
      console.log(`[LRUCache] ${isStale ? 'Stale hit' : 'Hit'}: ${key}`);
    }

    return {
      data: entry.data,
      isStale,
      metadata: { ...entry.metadata },
    };
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    if (Date.now() > entry.metadata.expiresAt) {
      this.cache.delete(key);
      this.stats.expiredCount++;
      return false;
    }
    
    return true;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    const existed = this.cache.delete(key);
    
    if (this.config.debug && existed) {
      console.log(`[LRUCache] Deleted: ${key}`);
    }
    
    return existed;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    
    if (this.config.debug) {
      console.log('[LRUCache] Cleared all entries');
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hitCount + this.stats.missCount;
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitCount: this.stats.hitCount,
      missCount: this.stats.missCount,
      hitRate: total > 0 ? this.stats.hitCount / total : 0,
      evictedCount: this.stats.evictedCount,
      expiredCount: this.stats.expiredCount,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Get all keys in cache (for debugging)
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get remaining TTL for a key
   */
  getRemainingTTL(key: string): number {
    const entry = this.cache.get(key);
    
    if (!entry) return 0;
    
    return Math.max(0, entry.metadata.expiresAt - Date.now());
  }

  /**
   * Update TTL for an existing key
   */
  touch(key: string, newTTL?: number): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    const now = Date.now();
    const actualTTL = newTTL ?? this.config.defaultTTL;
    
    entry.metadata.expiresAt = now + actualTTL;
    entry.metadata.staleAt = now + actualTTL - this.config.staleTTL;
    entry.metadata.lastAccessedAt = now;
    
    return true;
  }

  /**
   * Destroy the cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.clear();
  }

  /**
   * Evict the least recently used item
   */
  private evictLRU(): void {
    const firstKey = this.cache.keys().next().value;
    
    if (firstKey !== undefined) {
      this.cache.delete(firstKey);
      this.stats.evictedCount++;
      
      if (this.config.onEvict) {
        this.config.onEvict(firstKey, 'lru');
      }
      
      if (this.config.debug) {
        console.log(`[LRUCache] Evicted (LRU): ${firstKey}`);
      }
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.metadata.expiresAt) {
        this.cache.delete(key);
        this.stats.expiredCount++;
        cleaned++;
        
        if (this.config.onEvict) {
          this.config.onEvict(key, 'expired');
        }
      }
    }
    
    if (this.config.debug && cleaned > 0) {
      console.log(`[LRUCache] Cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Start periodic cleanup interval
   */
  private startCleanupInterval(): void {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Estimate memory usage in bytes (rough approximation)
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // UTF-16 encoding
      size += JSON.stringify(entry).length * 2;
    }
    
    return size;
  }
}

/**
 * Global cache instances for different purposes
 */
const globalCaches = new Map<string, LRUCache<unknown>>();

/**
 * Get or create a global cache instance
 */
export function getGlobalCache<T>(name: string, config?: Partial<CacheConfig>): LRUCache<T> {
  if (!globalCaches.has(name)) {
    globalCaches.set(name, new LRUCache<T>(config));
  }
  
  return globalCaches.get(name) as LRUCache<T>;
}

/**
 * Clear all global caches
 */
export function clearAllGlobalCaches(): void {
  for (const cache of globalCaches.values()) {
    cache.destroy();
  }
  globalCaches.clear();
}

/**
 * Get stats for all global caches
 */
export function getAllGlobalCacheStats(): Record<string, CacheStats> {
  const stats: Record<string, CacheStats> = {};
  
  for (const [name, cache] of globalCaches.entries()) {
    stats[name] = cache.getStats();
  }
  
  return stats;
}

export default LRUCache;
