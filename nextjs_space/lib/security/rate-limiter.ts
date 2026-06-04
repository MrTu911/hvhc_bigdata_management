/**
 * HVHC BigData Management System
 * Rate Limiter — Canonical implementation (merged from lib/rate-limit.ts)
 * Backend: Redis (ưu tiên) → in-memory (fallback)
 * Consumers: lib/security/index.ts, lib/rbac/middleware.ts, app/api routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

// Shared in-memory store — fallback khi Redis không khả dụng
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) rateLimitStore.delete(key);
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  windowMs: number;       // Thời gian cửa sổ (ms)
  maxRequests: number;    // Số request tối đa trong cửa sổ
  keyPrefix?: string;     // Prefix cho Redis key
  message?: string;       // Custom error message
}

// Named configs — dùng với checkRateLimit(identifier, endpoint)
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  login:         { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  otp:           { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  forgotPassword:{ windowMs: 60 * 60 * 1000, maxRequests: 3 },
  api:           { windowMs: 60 * 1000,       maxRequests: 100 },
  sensitive:     { windowMs: 60 * 1000,       maxRequests: 10 },
  export:        { windowMs: 5 * 60 * 1000,  maxRequests: 5 },
  ai:            { windowMs: 60 * 1000,       maxRequests: 20 },
};

// ===== INTERNAL HELPERS =====

async function checkLimitRedis(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number; retryAfter?: number } | null> {
  const count = await redis.incr(key);
  if (count === 0) return null; // Redis không khả dụng

  if (count === 1) {
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

function checkLimitMemory(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number; retryAfter?: number } {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + config.windowMs };
    rateLimitStore.set(key, record);
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: record.resetAt };
  }

  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfter: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count++;
  return { allowed: true, remaining: config.maxRequests - record.count, resetAt: record.resetAt };
}

function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

// ===== PUBLIC API — named endpoint style =====

/**
 * Kiểm tra và cập nhật rate limit theo tên endpoint.
 * Ưu tiên Redis; fallback sang in-memory khi Redis không khả dụng.
 * @param identifier - IP hoặc userId
 * @param endpoint - Loại endpoint: login, otp, forgotPassword, api, sensitive, export, ai
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: keyof typeof RATE_LIMIT_CONFIGS = 'api'
): Promise<{ allowed: boolean; remaining: number; resetAt: number; retryAfter?: number }> {
  const config = RATE_LIMIT_CONFIGS[endpoint];
  const key = `rl:${endpoint}:${identifier}`;
  const redisResult = await checkLimitRedis(key, config);
  return redisResult ?? checkLimitMemory(key, config);
}

/**
 * Reset rate limit cho identifier (dùng sau login thành công)
 */
export async function resetRateLimit(
  identifier: string,
  endpoint: keyof typeof RATE_LIMIT_CONFIGS = 'api'
): Promise<void> {
  const key = `rl:${endpoint}:${identifier}`;
  await redis.del(key);
  rateLimitStore.delete(key);
}

/**
 * Simple middleware wrapper cho API routes (plain Request)
 */
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  endpoint: keyof typeof RATE_LIMIT_CONFIGS = 'api'
) {
  return async (req: Request): Promise<Response> => {
    const ip = getClientIp(req);
    const result = await checkRateLimit(ip, endpoint);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${result.retryAfter} giây.`,
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(result.retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(result.resetAt),
          },
        }
      );
    }

    const response = await handler(req);
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-RateLimit-Remaining', String(result.remaining));
    newHeaders.set('X-RateLimit-Reset', String(result.resetAt));
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}

// ===== PUBLIC API — factory style (tương thích lib/rbac/middleware.ts) =====

/**
 * Tạo rate limiter theo config tuỳ chỉnh.
 * Trả về async function dùng được trong NextRequest middleware.
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimit(
    request: NextRequest,
    userId?: string
  ): Promise<{ allowed: true; remaining: number } | { allowed: false; response: NextResponse }> {
    const ip = getClientIp(request);
    const clientKey = userId ? `${ip}:${userId}` : ip;
    const key = config.keyPrefix ? `${config.keyPrefix}:${clientKey}` : clientKey;

    const redisResult = await checkLimitRedis(key, config);
    const result = redisResult ?? checkLimitMemory(key, config);

    if (!result.allowed) {
      return {
        allowed: false,
        response: NextResponse.json(
          {
            success: false,
            error: config.message || 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
            retryAfter: result.retryAfter,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(result.retryAfter),
              'X-RateLimit-Limit': String(config.maxRequests),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(result.resetAt),
            },
          }
        ),
      };
    }

    return { allowed: true, remaining: result.remaining };
  };
}

// ===== PRE-CONFIGURED LIMITERS (tương thích app/api/personnel/export/route.ts) =====

export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
  keyPrefix: 'auth',
  message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 1 phút.',
});

export const exportRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 10,
  keyPrefix: 'export',
  message: 'Quá nhiều yêu cầu xuất dữ liệu. Vui lòng thử lại sau 5 phút.',
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
  keyPrefix: 'api',
  message: 'Quá nhiều yêu cầu. Vui lòng giảm tần suất.',
});

export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
  keyPrefix: 'pwd-reset',
  message: 'Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 1 giờ.',
});

export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  keyPrefix: 'ai',
  message: 'Quá nhiều yêu cầu AI. Vui lòng thử lại sau.',
});

// ===== UTILITIES =====

/** Xóa các record hết hạn (có thể gọi thủ công cho testing) */
export function cleanupExpiredRecords(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) rateLimitStore.delete(key);
  }
}

/** Lấy stats của in-memory store (cho monitoring) */
export function getRateLimitStats() {
  return {
    totalKeys: rateLimitStore.size,
    keys: Array.from(rateLimitStore.entries()).map(([key, entry]) => ({
      key: key.split(':').slice(0, 2).join(':') + ':***',
      count: entry.count,
      resetAt: new Date(entry.resetAt).toISOString(),
    })),
  };
}

/** Xóa rate limit cho key pattern (dùng trong testing hoặc admin reset) */
export function clearRateLimit(keyPattern?: string): void {
  if (!keyPattern) {
    rateLimitStore.clear();
    return;
  }
  for (const key of rateLimitStore.keys()) {
    if (key.includes(keyPattern)) rateLimitStore.delete(key);
  }
}

export default {
  checkRateLimit,
  resetRateLimit,
  withRateLimit,
  RATE_LIMIT_CONFIGS,
};
