/**
 * Unit tests for Cache module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LRUCache, getGlobalCache, clearAllGlobalCaches } from '../api/cache';

describe('LRUCache', () => {
  let cache: LRUCache<string>;

  beforeEach(() => {
    cache = new LRUCache<string>({ maxSize: 3, defaultTTL: 1000 });
  });

  it('should set and get values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return undefined for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('should respect max size and evict LRU items', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4'); // Should evict key1

    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBe('value2');
    expect(cache.get('key3')).toBe('value3');
    expect(cache.get('key4')).toBe('value4');
  });

  it('should update access order on get', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    // Access key1 to make it most recently used
    cache.get('key1');

    // Add new item - should evict key2 (LRU)
    cache.set('key4', 'value4');

    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBeUndefined();
  });

  it('should expire items after TTL', async () => {
    cache = new LRUCache<string>({ maxSize: 10, defaultTTL: 50 });
    cache.set('key1', 'value1');

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(cache.get('key1')).toBeUndefined();
  });

  it('should check has correctly', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('key2')).toBe(false);
  });

  it('should delete items', () => {
    cache.set('key1', 'value1');
    expect(cache.delete('key1')).toBe(true);
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.delete('key1')).toBe(false);
  });

  it('should clear all items', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBeUndefined();
  });

  it('should return correct stats', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.get('key1'); // hit
    cache.get('key3'); // miss

    const stats = cache.getStats();
    expect(stats.size).toBe(2);
    expect(stats.hitCount).toBe(1);
    expect(stats.missCount).toBe(1);
    expect(stats.hitRate).toBe(0.5);
  });

  it('should generate keys correctly', () => {
    const key1 = LRUCache.generateKey(['part1', 'part2', 123]);
    expect(key1).toBe('part1:part2:123');

    const key2 = LRUCache.generateKey(['a', undefined, 'b']);
    expect(key2).toBe('a:b');
  });

  it('should support stale-while-revalidate pattern', () => {
    cache = new LRUCache<string>({
      maxSize: 10,
      defaultTTL: 1000,
      staleTTL: 500,
    });

    cache.set('key1', 'value1');

    // Initially not stale
    const result1 = cache.getWithStale('key1');
    expect(result1.data).toBe('value1');
    expect(result1.isStale).toBe(false);
  });

  it('should return remaining TTL', () => {
    cache.set('key1', 'value1');
    const ttl = cache.getRemainingTTL('key1');
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeGreaterThanOrEqual(900); // Should be close to 1000ms
  });

  it('should update TTL with touch', () => {
    cache.set('key1', 'value1', 100);
    expect(cache.touch('key1', 5000)).toBe(true);

    const ttl = cache.getRemainingTTL('key1');
    expect(ttl).toBeGreaterThan(100);
  });
});

describe('Global Caches', () => {
  it('should create global cache', () => {
    const cache = getGlobalCache<string>('test-global');
    expect(typeof cache.get).toBe('function');
    expect(typeof cache.set).toBe('function');
  });

  it('should return same instance for same name', () => {
    const cache1 = getGlobalCache<string>('test-same');
    const cache2 = getGlobalCache<string>('test-same');
    expect(cache1).toBe(cache2);
  });

  it('should clear all global caches', () => {
    const cache = getGlobalCache<string>('test-clear');
    cache.set('key', 'value');

    clearAllGlobalCaches();
    expect(cache.get('key')).toBeUndefined();
  });
});
