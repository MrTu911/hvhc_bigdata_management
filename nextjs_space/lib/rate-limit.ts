/**
 * GĐ4.16: Rate Limiting Utility
 * - Sliding window algorithm
 * - IP-based + User-based limiting
 * - Configurable per endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from './logger';
import { redis } from './redis';

const logger = createLogger('RateLimit');

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix?: string;    // Prefix for the key
  message?: string;      // Custom error message
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// In-memory store — fallback khi Redis không khả dụng
const store = new Map<string, RateLimitEntry>();

/**
 * Kiểm tra rate limit qua Redis (INCR + EXPIRE)
 * Trả về null nếu Redis không khả dụng → caller fallback sang in-memory
 */
async function checkLimitRedis(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number; retryAfter?: number } | null> {
  const count = await redis.incr(key);
  // redis.incr trả về 0 khi Redis không khả dụng (INCR thật luôn >= 1)
  if (count === 0) return null;

  if (count === 1) {
    // Request đầu tiên trong window — đặt TTL
    await redis.expire(key, Math.ceil(config.windowMs / 1000));
  }

  const remainingTtl = await redis.ttl(key);
  const retryAfter = remainingTtl > 0 ? remainingTtl : Math.ceil(config.windowMs / 1000);
  const resetAt = Date.now() + retryAfter * 1000;

  if (count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt, retryAfter };
  }

  return { allowed: true, remaining: Math.max(0, config.maxRequests - count), resetAt };
}

// Cleanup interval
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 60000); // Cleanup every minute
}

// Start cleanup on module load
startCleanup();

/**
 * Get client identifier (IP + optional user ID)
 */
function getClientKey(request: NextRequest, userId?: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  return userId ? `${ip}:${userId}` : ip;
}

/**
 * Check rate limit
 */
function checkLimit(key: string, config: RateLimitConfig): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    // New window
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    // Limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit response
 */
function rateLimitResponse(
  config: RateLimitConfig,
  retryAfter: number
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: config.message || 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Date.now() + retryAfter * 1000),
      },
    }
  );
}

/**
 * Create rate limiter for specific endpoint
 * Ưu tiên Redis; fallback sang in-memory khi Redis không khả dụng
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimit(
    request: NextRequest,
    userId?: string
  ): Promise<{ allowed: true; remaining: number } | { allowed: false; response: NextResponse }> {
    const clientKey = getClientKey(request, userId);
    const key = config.keyPrefix ? `${config.keyPrefix}:${clientKey}` : clientKey;

    // Thử Redis trước
    const redisResult = await checkLimitRedis(key, config);
    const result = redisResult ?? checkLimit(key, config);

    if (!result.allowed) {
      logger.warn('Rate limit exceeded', {
        key,
        retryAfter: result.retryAfter,
        path: request.nextUrl.pathname,
        backend: redisResult ? 'redis' : 'memory',
      });

      return {
        allowed: false,
        response: rateLimitResponse(config, result.retryAfter!),
      };
    }

    return {
      allowed: true,
      remaining: result.remaining,
    };
  };
}

// ===== Pre-configured Rate Limiters =====

/**
 * Auth endpoints: 5 requests per minute (login, signup)
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  keyPrefix: 'auth',
  message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 1 phút.',
});

/**
 * Export endpoints: 10 requests per 5 minutes
 */
export const exportRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10,
  keyPrefix: 'export',
  message: 'Quá nhiều yêu cầu xuất dữ liệu. Vui lòng thử lại sau 5 phút.',
});

/**
 * API general: 100 requests per minute
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
  keyPrefix: 'api',
  message: 'Quá nhiều yêu cầu. Vui lòng giảm tần suất.',
});

/**
 * Password reset: 3 requests per hour
 */
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  keyPrefix: 'pwd-reset',
  message: 'Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 1 giờ.',
});

/**
 * AI endpoints: 20 requests per minute
 */
export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  keyPrefix: 'ai',
  message: 'Quá nhiều yêu cầu AI. Vui lòng thử lại sau.',
});

/**
 * Middleware wrapper for easy use in API routes
 */
export async function withRateLimit<T>(
  request: NextRequest,
  limiter: ReturnType<typeof createRateLimiter>,
  handler: () => Promise<T>,
  userId?: string
): Promise<T | NextResponse> {
  const result = await limiter(request, userId);
  
  if (!result.allowed) {
    return result.response;
  }
  
  return handler();
}

/**
 * Get current store stats (for monitoring)
 */
export function getRateLimitStats() {
  return {
    totalKeys: store.size,
    keys: Array.from(store.entries()).map(([key, entry]) => ({
      key: key.split(':').slice(0, 2).join(':') + ':***', // Mask IP
      count: entry.count,
      resetAt: new Date(entry.resetAt).toISOString(),
    })),
  };
}

/**
 * Clear rate limit for testing
 */
export function clearRateLimit(keyPattern?: string) {
  if (!keyPattern) {
    store.clear();
    return;
  }
  
  for (const key of store.keys()) {
    if (key.includes(keyPattern)) {
      store.delete(key);
    }
  }
}
