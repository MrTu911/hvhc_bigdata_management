/**
 * Tests – Rate Limiter (lib/security/rate-limiter.ts)
 *
 * Test các path: Redis available, Redis fallback → in-memory, threshold, cleanup.
 * Mock Redis để kiểm soát behavior mà không cần Redis thật.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted đảm bảo mockRedis được khởi tạo TRƯỚC khi vi.mock hoisting
const mockRedis = vi.hoisted(() => ({
  incr: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
  del: vi.fn(),
}));

vi.mock('@/lib/redis', () => ({ redis: mockRedis }));
vi.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({ body, init }),
  },
}));

import {
  checkRateLimit,
  resetRateLimit,
  clearRateLimit,
  getRateLimitStats,
  cleanupExpiredRecords,
  RATE_LIMIT_CONFIGS,
} from '@/lib/security/rate-limiter';

beforeEach(() => {
  vi.clearAllMocks();
  clearRateLimit();
});

describe('RATE_LIMIT_CONFIGS', () => {
  it('có đủ 7 endpoint configs', () => {
    const keys = Object.keys(RATE_LIMIT_CONFIGS);
    expect(keys).toContain('login');
    expect(keys).toContain('otp');
    expect(keys).toContain('forgotPassword');
    expect(keys).toContain('api');
    expect(keys).toContain('sensitive');
    expect(keys).toContain('export');
    expect(keys).toContain('ai');
  });

  it('ai config: 20 req/min', () => {
    expect(RATE_LIMIT_CONFIGS.ai.maxRequests).toBe(20);
    expect(RATE_LIMIT_CONFIGS.ai.windowMs).toBe(60 * 1000);
  });

  it('login config: 5 req / 15 phút', () => {
    expect(RATE_LIMIT_CONFIGS.login.maxRequests).toBe(5);
    expect(RATE_LIMIT_CONFIGS.login.windowMs).toBe(15 * 60 * 1000);
  });
});

describe('checkRateLimit — Redis available', () => {
  beforeEach(() => {
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(55);
  });

  it('cho phép request đầu tiên', async () => {
    const result = await checkRateLimit('127.0.0.1', 'api');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99); // 100 - 1
  });

  it('gọi expire khi count === 1', async () => {
    await checkRateLimit('127.0.0.1', 'login');
    expect(mockRedis.expire).toHaveBeenCalledOnce();
  });

  it('không gọi expire khi count > 1', async () => {
    mockRedis.incr.mockResolvedValue(3);
    await checkRateLimit('127.0.0.1', 'login');
    expect(mockRedis.expire).not.toHaveBeenCalled();
  });

  it('block khi vượt threshold (login max = 5)', async () => {
    mockRedis.incr.mockResolvedValue(6);
    mockRedis.ttl.mockResolvedValue(30);
    const result = await checkRateLimit('127.0.0.1', 'login');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBe(30);
  });
});

describe('checkRateLimit — Redis unavailable (fallback in-memory)', () => {
  beforeEach(() => {
    mockRedis.incr.mockResolvedValue(0); // 0 = Redis không khả dụng
  });

  it('fallback: cho phép request trong window', async () => {
    const result = await checkRateLimit('10.0.0.1', 'sensitive');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9); // 10 - 1
  });

  it('fallback: block sau khi vượt maxRequests', async () => {
    // sensitive = 10 req/min
    for (let i = 0; i < 10; i++) {
      await checkRateLimit('10.0.0.2', 'sensitive');
    }
    const result = await checkRateLimit('10.0.0.2', 'sensitive');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('fallback: window reset sau khi hết hạn', async () => {
    const realNow = Date.now.bind(Date);
    const baseTime = realNow();

    // Reach limit
    for (let i = 0; i < 5; i++) {
      await checkRateLimit('10.0.0.3', 'login');
    }
    const blocked = await checkRateLimit('10.0.0.3', 'login');
    expect(blocked.allowed).toBe(false);

    // Advance time past window (15 phút + 1 phút)
    vi.spyOn(Date, 'now').mockReturnValue(baseTime + 16 * 60 * 1000);
    const afterReset = await checkRateLimit('10.0.0.3', 'login');
    expect(afterReset.allowed).toBe(true);

    vi.spyOn(Date, 'now').mockRestore();
  });
});

describe('resetRateLimit', () => {
  it('gọi redis.del với đúng key format', async () => {
    mockRedis.del.mockResolvedValue(1);
    await resetRateLimit('192.168.1.1', 'login');
    expect(mockRedis.del).toHaveBeenCalledWith('rl:login:192.168.1.1');
  });

  it('xóa record khỏi in-memory store', async () => {
    mockRedis.del.mockResolvedValue(1);
    // Tạo in-memory record
    await checkRateLimit('192.168.1.2', 'otp');

    await resetRateLimit('192.168.1.2', 'otp');
    const stats = getRateLimitStats();
    expect(stats.keys.every((k) => !k.key.includes('192.168.1.2'))).toBe(true);
  });
});

describe('utilities', () => {
  it('cleanupExpiredRecords xóa record hết hạn', async () => {
    const realNow = Date.now.bind(Date);
    const baseTime = realNow();

    await checkRateLimit('1.2.3.4', 'otp');
    expect(getRateLimitStats().totalKeys).toBeGreaterThan(0);

    // Advance past window (15 phút)
    vi.spyOn(Date, 'now').mockReturnValue(baseTime + 20 * 60 * 1000);
    cleanupExpiredRecords();
    expect(getRateLimitStats().totalKeys).toBe(0);

    vi.spyOn(Date, 'now').mockRestore();
  });

  it('clearRateLimit() không args — xóa toàn bộ store', async () => {
    await checkRateLimit('a.b.c.d', 'api');
    clearRateLimit();
    expect(getRateLimitStats().totalKeys).toBe(0);
  });

  it('clearRateLimit(pattern) — chỉ xóa key matching', async () => {
    await checkRateLimit('1.1.1.1', 'login');
    await checkRateLimit('2.2.2.2', 'api');
    clearRateLimit('login');
    const stats = getRateLimitStats();
    expect(stats.keys.every((k) => !k.key.includes('login'))).toBe(true);
  });
});
