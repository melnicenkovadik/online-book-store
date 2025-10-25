/**
 * Simple in-memory cache implementation with TTL support
 */

type CacheItem<T> = {
  value: T;
  expiry: number;
};

class MemoryCache {
  private cache: Map<string, CacheItem<unknown>> = new Map();
  private readonly defaultTtl: number;

  constructor(defaultTtlSeconds = 300) {
    // Default 5 minutes
    this.defaultTtl = defaultTtlSeconds * 1000;

    // Cleanup expired items every minute
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.cleanup(), 60000);
    }
  }

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);

    if (!item) return undefined;

    // Check if expired
    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value as T;
  }

  /**
   * Set a value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Time to live in seconds (overrides default)
   */
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl =
      (ttlSeconds !== undefined ? ttlSeconds : this.defaultTtl / 1000) * 1000;

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  /**
   * Delete a value from cache
   * @param key Cache key
   * @returns true if item was deleted, false if not found
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached items
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or set cache value with optional factory function
   * @param key Cache key
   * @param factory Function to generate value if not in cache
   * @param ttlSeconds Time to live in seconds (overrides default)
   * @returns Cached or newly generated value
   */
  async getOrSet<T>(
    key: string,
    factory: () => T | Promise<T>,
    ttlSeconds?: number,
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Remove expired items from cache
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.expiry < now) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const cache = new MemoryCache();

/**
 * Create a cache key from parameters
 * @param prefix Cache key prefix
 * @param params Parameters to include in cache key
 * @returns Cache key string
 */
export function createCacheKey(
  prefix: string,
  params?: Record<string, unknown>,
): string {
  if (!params) return prefix;

  const sortedKeys = Object.keys(params).sort();
  const parts = sortedKeys
    .map((key) => {
      const value = params[key];
      if (value === undefined || value === null) return "";
      return `${key}:${JSON.stringify(value)}`;
    })
    .filter(Boolean);

  return `${prefix}:${parts.join(",")}`;
}
