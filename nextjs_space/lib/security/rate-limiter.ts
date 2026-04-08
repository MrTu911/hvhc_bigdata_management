/**
 * HVHC BigData Management System
 * Rate Limiter - Giới hạn số request để chống brute force
 * Backend: Redis (ưu tiên) → in-memory (fallback)
 */

import { redis } from '@/lib/redis';

// In-memory store — fallback khi Redis không khả dụng
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  windowMs: number;      // Thời gian cửa sổ (ms)
  maxRequests: number;   // Số request tối đa trong cửa sổ
}

// Cấu hình mặc định cho các loại endpoint
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Login: 5 lần / 15 phút
  login: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5
  },
  // OTP verify: 5 lần / 15 phút (sai OTP 3 lần → lock, nên 5 là ceiling an toàn)
  otp: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5
  },
  // Forgot password: 3 lần / 1 giờ
  forgotPassword: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3
  },
  // API chung: 100 lần / phút
  api: {
    windowMs: 60 * 1000,
    maxRequests: 100
  },
  // Sensitive operations: 10 lần / phút
  sensitive: {
    windowMs: 60 * 1000,
    maxRequests: 10
  },
  // Export: 5 lần / 5 phút
  export: {
    windowMs: 5 * 60 * 1000,
    maxRequests: 5
  }
};

/**
 * Kiểm tra và cập nhật rate limit
 * Ưu tiên Redis; fallback sang in-memory khi Redis không khả dụng
 * @param identifier - IP hoặc userId
 * @param endpoint - Loại endpoint (login, forgotPassword, api, sensitive)
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: keyof typeof RATE_LIMIT_CONFIGS = 'api'
): Promise<{ allowed: boolean; remaining: number; resetAt: number; retryAfter?: number }> {
  const config = RATE_LIMIT_CONFIGS[endpoint];
  const key = `rl:${endpoint}:${identifier}`;
  const now = Date.now();

  // --- Thử Redis ---
  const count = await redis.incr(key);
  if (count > 0) {
    // Redis khả dụng (INCR thật luôn >= 1)
    if (count === 1) {
      await redis.expire(key, Math.ceil(config.windowMs / 1000));
    }
    const remainingTtl = await redis.ttl(key);
    const retryAfter = remainingTtl > 0 ? remainingTtl : Math.ceil(config.windowMs / 1000);
    const resetAt = now + retryAfter * 1000;

    if (count > config.maxRequests) {
      return { allowed: false, remaining: 0, resetAt, retryAfter };
    }
    return { allowed: true, remaining: Math.max(0, config.maxRequests - count), resetAt };
  }

  // --- Fallback: in-memory ---
  let record = rateLimitStore.get(key);
  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + config.windowMs };
  }

  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetAt: record.resetAt, retryAfter };
  }

  record.count++;
  rateLimitStore.set(key, record);
  return { allowed: true, remaining: config.maxRequests - record.count, resetAt: record.resetAt };
}

/**
 * Reset rate limit cho identifier (dùng sau login thành công)
 */
export async function resetRateLimit(
  identifier: string,
  endpoint: keyof typeof RATE_LIMIT_CONFIGS = 'api'
): Promise<void> {
  const key = `rl:${endpoint}:${identifier}`;
  await redis.del(key);       // Redis
  rateLimitStore.delete(key); // in-memory fallback
}

/**
 * Middleware wrapper cho API routes
 */
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  endpoint: keyof typeof RATE_LIMIT_CONFIGS = 'api'
) {
  return async (req: Request): Promise<Response> => {
    // Lấy IP từ headers
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    
    const result = await checkRateLimit(ip, endpoint);
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${result.retryAfter} giây.`,
          retryAfter: result.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(result.retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(result.resetAt)
          }
        }
      );
    }
    
    // Thêm headers rate limit vào response
    const response = await handler(req);
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-RateLimit-Remaining', String(result.remaining));
    newHeaders.set('X-RateLimit-Reset', String(result.resetAt));
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  };
}

/**
 * Xóa các record hết hạn (gọi định kỳ)
 */
export function cleanupExpiredRecords(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup mỗi 5 phút
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRecords, 5 * 60 * 1000);
}

export default {
  checkRateLimit,
  resetRateLimit,
  withRateLimit,
  RATE_LIMIT_CONFIGS
};
