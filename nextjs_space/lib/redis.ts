/**
 * Redis Cache Manager
 * High-performance caching layer for data queries and analytics
 */

import Redis from 'ioredis';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Cache key prefix
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

class RedisCache {
  private client: Redis | null = null;
  private stats = {
    hits: 0,
    misses: 0,
  };

  /**
   * Initialize Redis connection
   */
  constructor() {
    this.initialize();
  }

  private initialize() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.warn('Redis not configured. Caching will be disabled.');
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            console.error('Redis connection failed after 3 retries');
            return null; // Stop retrying
          }
          return Math.min(times * 100, 2000); // Exponential backoff
        },
        reconnectOnError: (err: Error) => {
          const targetErrors = ['READONLY', 'ECONNRESET'];
          return targetErrors.some((targetError) => err.message.includes(targetError));
        },
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

      this.client.on('error', (err: Error) => {
        console.error('❌ Redis connection error:', err.message);
      });

      this.client.on('close', () => {
        console.warn('⚠️  Redis connection closed');
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.client = null;
    }
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.client) {
      this.stats.misses++;
      return null;
    }

    try {
      const value = await this.client.get(key);

      if (value) {
        this.stats.hits++;
        return JSON.parse(value) as T;
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      console.error('Redis GET error:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const ttl = options?.ttl || parseInt(process.env.CACHE_TTL || '3600');
      const serialized = JSON.stringify(value);

      if (ttl > 0) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }

      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string | string[]): Promise<number> {
    if (!this.client) {
      return 0;
    }

    try {
      const keys = Array.isArray(key) ? key : [key];
      return await this.client.del(...keys);
    } catch (error) {
      console.error('Redis DEL error:', error);
      return 0;
    }
  }

  /**
   * Delete keys by pattern
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      return await this.client.del(...keys);
    } catch (error) {
      console.error('Redis DEL pattern error:', error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
      return false;
    }
  }

  /**
   * Get remaining time to live
   */
  async ttl(key: string): Promise<number> {
    if (!this.client) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error('Redis TTL error:', error);
      return -1;
    }
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    if (!this.client) {
      return 0;
    }

    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error('Redis INCR error:', error);
      return 0;
    }
  }

  /**
   * Decrement a counter
   */
  async decr(key: string): Promise<number> {
    if (!this.client) {
      return 0;
    }

    try {
      return await this.client.decr(key);
    } catch (error) {
      console.error('Redis DECR error:', error);
      return 0;
    }
  }

  /**
   * Flush all keys
   */
  async flush(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      console.error('Redis FLUSH error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: parseFloat(hitRate.toFixed(2)),
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  /**
   * Cache wrapper function - Get from cache or execute function
   */
  async remember<T>(
    key: string,
    ttl: number,
    fn: () => Promise<T>
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, { ttl });
    return result;
  }

  /**
   * Generate cache key with prefix
   */
  key(parts: string[]): string {
    const prefix = process.env.CACHE_PREFIX || 'hvhc';
    return `${prefix}:${parts.join(':')}`;
  }
}

// Singleton instance
export const redis = new RedisCache();

// Helper function for caching
export async function cached<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  return redis.remember(key, ttl, fn);
}

// Cache key generators
export const CacheKeys = {
  dataQuery: (queryId: string) => redis.key(['data', 'query', queryId]),
  dataStats: (datasetId: string) => redis.key(['data', 'stats', datasetId]),
  analytics: (chartType: string, timeRange: string) =>
    redis.key(['analytics', chartType, timeRange]),
  userSession: (userId: string) => redis.key(['session', userId]),
  modelMetrics: (modelId: string) => redis.key(['model', 'metrics', modelId]),
  experimentResults: (experimentId: string) =>
    redis.key(['experiment', 'results', experimentId]),
  serviceStatus: (serviceName: string) =>
    redis.key(['monitoring', 'service', serviceName]),
  alerts: () => redis.key(['monitoring', 'alerts']),
};
