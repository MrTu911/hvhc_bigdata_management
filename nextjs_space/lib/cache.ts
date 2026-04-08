/**
 * Redis Caching Utility for HVHC Big Data System
 * Provides high-performance caching layer for dashboard data and AI predictions
 * 
 * GĐ1.2+1.3: Redis tùy chọn - không bắt buộc Redis, gom về 1 chỗ
 */

import { Redis } from 'ioredis';

// Simple in-memory cache fallback when Redis is not available
const memoryCache = new Map<string, { value: string; expiry: number }>();

// ─── In-process hit/miss counters ─────────────────────────────────────────────
// Resets on server restart. Used for operational observability only.

export type CacheCounters = {
  hits: number
  misses: number
  sets: number
  deletes: number
}

const cacheCounters: CacheCounters = { hits: 0, misses: 0, sets: 0, deletes: 0 }

/** Read current in-process counters (snapshot, not cleared). */
export function getCacheCounters(): Readonly<CacheCounters> {
  return { ...cacheCounters }
}

/** Reset in-process counters to zero (call after reading if you want delta tracking). */
export function resetCacheCounters(): void {
  cacheCounters.hits = 0
  cacheCounters.misses = 0
  cacheCounters.sets = 0
  cacheCounters.deletes = 0
}

export type CacheStats = {
  inProcess: CacheCounters
  /** Only present when Redis is connected. Pulled from Redis INFO stats. */
  redis?: {
    keyspaceHits: number | null
    keyspaceMisses: number | null
    usedMemoryHuman: string | null
    connectedClients: number | null
  }
}

/** Returns in-process counters + optional Redis INFO stats. */
export async function getCacheStats(): Promise<CacheStats> {
  if (!redis) {
    return { inProcess: getCacheCounters() }
  }
  try {
    const [statsInfo, memInfo, clientsInfo] = await Promise.all([
      redis.info('stats'),
      redis.info('memory'),
      redis.info('clients'),
    ])
    const match = (info: string, key: string) =>
      info.match(new RegExp(`${key}:(\\S+)`))?.[1] ?? null
    return {
      inProcess: getCacheCounters(),
      redis: {
        keyspaceHits: match(statsInfo, 'keyspace_hits') !== null ? parseInt(match(statsInfo, 'keyspace_hits')!) : null,
        keyspaceMisses: match(statsInfo, 'keyspace_misses') !== null ? parseInt(match(statsInfo, 'keyspace_misses')!) : null,
        usedMemoryHuman: match(memInfo, 'used_memory_human'),
        connectedClients: match(clientsInfo, 'connected_clients') !== null ? parseInt(match(clientsInfo, 'connected_clients')!) : null,
      },
    }
  } catch {
    return { inProcess: getCacheCounters() }
  }
}

// Check if Redis should be enabled
const REDIS_ENABLED = !!(process.env.REDIS_URL || process.env.REDIS_HOST) && process.env.DISABLE_REDIS !== 'true';

// Initialize Redis client only when configured
let redis: Redis | null = null;

if (REDIS_ENABLED) {
  try {
    redis = process.env.REDIS_URL 
      ? new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => {
            if (times > 3) return null; // Stop retrying
            return Math.min(times * 100, 2000);
          },
          lazyConnect: true,
        })
      : new Redis({
          host: process.env.REDIS_HOST!,
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => {
            if (times > 3) return null;
            return Math.min(times * 100, 2000);
          },
          lazyConnect: true,
        });

    redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    // Attempt to connect
    redis.connect().catch((err) => {
      console.warn('⚠️ Redis connection failed, falling back to memory cache:', err.message);
      redis = null;
    });
  } catch (error) {
    console.warn('⚠️ Redis initialization failed, using memory cache');
    redis = null;
  }
} else {
  console.log('ℹ️ Redis not configured, using memory cache');
}

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  DASHBOARD_DATA: 300, // 5 minutes
  AI_PREDICTIONS: 1800, // 30 minutes
  USER_SESSION: 3600, // 1 hour
  STATIC_DATA: 86400, // 24 hours
  REALTIME_DATA: 60, // 1 minute
} as const;

// Helper: Clean expired memory cache entries
function cleanMemoryCache(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiry > 0 && entry.expiry < now) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Get data from cache (Redis or memory fallback)
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    if (redis) {
      const data = await redis.get(key);
      if (!data) { cacheCounters.misses++; return null; }
      cacheCounters.hits++;
      return JSON.parse(data) as T;
    } else {
      // Memory cache fallback
      cleanMemoryCache();
      const entry = memoryCache.get(key);
      if (!entry) { cacheCounters.misses++; return null; }
      if (entry.expiry > 0 && entry.expiry < Date.now()) {
        memoryCache.delete(key);
        cacheCounters.misses++;
        return null;
      }
      cacheCounters.hits++;
      return JSON.parse(entry.value) as T;
    }
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set data in cache with TTL (Redis or memory fallback)
 */
export async function setCache(
  key: string,
  value: any,
  ttl: number = CACHE_TTL.DASHBOARD_DATA
): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value);
    if (redis) {
      await redis.setex(key, ttl, serialized);
    } else {
      // Memory cache fallback
      memoryCache.set(key, {
        value: serialized,
        expiry: ttl > 0 ? Date.now() + ttl * 1000 : 0,
      });
    }
    cacheCounters.sets++;
    return true;
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete specific cache key
 */
export async function deleteCache(key: string): Promise<boolean> {
  try {
    if (redis) {
      await redis.del(key);
    } else {
      memoryCache.delete(key);
    }
    cacheCounters.deletes++;
    return true;
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete cache keys by pattern.
 * Uses SCAN instead of KEYS to avoid blocking Redis on large keyspaces.
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  try {
    if (redis) {
      // Cursor-based scan: safe for production keyspaces (no O(N) block).
      const keys: string[] = []
      let cursor = '0'
      do {
        const [next, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
        cursor = next
        keys.push(...batch)
      } while (cursor !== '0')
      if (keys.length === 0) return 0
      // Batch deletes to avoid exceeding Redis command argument limits (>500 keys)
      const CHUNK = 500
      let deleted = 0
      for (let i = 0; i < keys.length; i += CHUNK) {
        deleted += await redis.del(...keys.slice(i, i + CHUNK))
      }
      cacheCounters.deletes += deleted
      return deleted
    } else {
      // Memory cache: simple pattern matching
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      let count = 0;
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          memoryCache.delete(key);
          count++;
        }
      }
      cacheCounters.deletes += count;
      return count;
    }
  } catch (error) {
    console.error(`Cache pattern delete error for ${pattern}:`, error);
    return 0;
  }
}

/**
 * Check if key exists in cache
 */
export async function hasCache(key: string): Promise<boolean> {
  try {
    if (redis) {
      const exists = await redis.exists(key);
      return exists === 1;
    } else {
      cleanMemoryCache();
      return memoryCache.has(key);
    }
  } catch (error) {
    console.error(`Cache exists error for key ${key}:`, error);
    return false;
  }
}

/**
 * Get remaining TTL for a cache key (in seconds).
 * Returns null if the key does not exist.
 * Returns -1 if the key exists but has no expiry.
 * Returns a positive integer for seconds remaining.
 */
export async function getCacheTtl(key: string): Promise<number | null> {
  try {
    if (redis) {
      const ttl = await redis.ttl(key)
      // -2 = key does not exist; -1 = no expiry
      return ttl === -2 ? null : ttl
    } else {
      const entry = memoryCache.get(key)
      if (!entry) return null
      if (entry.expiry === 0) return -1 // no expiry
      const remaining = Math.floor((entry.expiry - Date.now()) / 1000)
      return remaining > 0 ? remaining : null // treat expired as non-existent
    }
  } catch {
    return null
  }
}

/**
 * Increment counter in cache
 */
export async function incrementCache(key: string, amount: number = 1): Promise<number> {
  try {
    if (redis) {
      return await redis.incrby(key, amount);
    } else {
      const entry = memoryCache.get(key);
      const current = entry ? parseInt(entry.value, 10) || 0 : 0;
      const newValue = current + amount;
      memoryCache.set(key, { value: String(newValue), expiry: entry?.expiry || 0 });
      return newValue;
    }
  } catch (error) {
    console.error(`Cache increment error for key ${key}:`, error);
    return 0;
  }
}

/**
 * Get multiple keys at once
 */
export async function getCacheMultiple<T>(keys: string[]): Promise<(T | null)[]> {
  try {
    if (keys.length === 0) return [];
    if (redis) {
      const values = await redis.mget(...keys);
      return values.map(val => val ? JSON.parse(val) as T : null);
    } else {
      cleanMemoryCache();
      return keys.map(key => {
        const entry = memoryCache.get(key);
        if (!entry) return null;
        if (entry.expiry > 0 && entry.expiry < Date.now()) {
          memoryCache.delete(key);
          return null;
        }
        return JSON.parse(entry.value) as T;
      });
    }
  } catch (error) {
    console.error('Cache mget error:', error);
    return keys.map(() => null);
  }
}

/**
 * Cache wrapper for async functions
 * Automatically caches function results
 */
export async function cached<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute function and cache result
  const result = await fn();
  await setCache(key, result, ttl);
  return result;
}

/**
 * Generate cache key for dashboard data
 */
export function dashboardCacheKey(userId: string, dashboard: string): string {
  return `dashboard:${dashboard}:${userId}`;
}

/**
 * Generate cache key for AI predictions
 */
export function aiPredictionCacheKey(model: string, params: string): string {
  return `ai:${model}:${params}`;
}

/**
 * Invalidate all dashboard caches for a user
 */
export async function invalidateUserDashboards(userId: string): Promise<number> {
  return await deleteCachePattern(`dashboard:*:${userId}`);
}

/**
 * Invalidate all AI prediction caches
 */
export async function invalidateAIPredictions(): Promise<number> {
  return await deleteCachePattern('ai:*');
}

/**
 * Check if Redis is connected
 */
export function isRedisConnected(): boolean {
  return redis !== null && redis.status === 'ready';
}

/**
 * Get cache status info
 */
export function getCacheStatus(): { type: 'redis' | 'memory'; connected: boolean } {
  return {
    type: redis ? 'redis' : 'memory',
    connected: redis ? redis.status === 'ready' : true,
  };
}

// Export redis client (may be null if not configured)
export { redis };
export default redis;
