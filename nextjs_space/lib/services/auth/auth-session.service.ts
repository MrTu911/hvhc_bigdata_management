/**
 * M01 – UC-06: AuthSession Service
 * Quản lý phiên đăng nhập thực sự — tách biệt với NextAuth Session (cookie)
 *
 * Mỗi login tạo một AuthSession.
 * Admin có thể revoke bất kỳ session nào.
 * Session hết hạn tự động theo expiresAt.
 */

import prisma from '@/lib/db';

export type RevokeReason = 'LOGOUT' | 'ADMIN_REVOKE' | 'SUSPICIOUS' | 'EXPIRED';

export interface CreateSessionInput {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
  /** TTL tính bằng giây — mặc định 7 ngày */
  ttlSeconds?: number;
}

/**
 * Tạo AuthSession mới sau khi login thành công
 */
export async function createAuthSession(input: CreateSessionInput): Promise<string> {
  const { userId, ipAddress, userAgent, deviceName, ttlSeconds = 7 * 24 * 3600 } = input;

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await prisma.authSession.create({
    data: {
      userId,
      token,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      deviceName: deviceName ?? null,
      expiresAt,
    },
  });

  return token;
}

/**
 * Cập nhật lastActivityAt theo token cụ thể.
 * Dùng khi đã có token (ví dụ: user self-revoke flow).
 */
export async function touchSession(token: string): Promise<void> {
  await prisma.authSession.updateMany({
    where: { token, isActive: true },
    data: { lastActivityAt: new Date() },
  });
}

/** Interval tối thiểu giữa 2 lần touch (tránh write DB trên mỗi request) */
const TOUCH_INTERVAL_MS = 5 * 60 * 1000; // 5 phút

/**
 * Cập nhật lastActivityAt cho tất cả session active của user.
 * Tự throttle: chỉ update session nào chưa được touch trong 5 phút gần nhất.
 * Gọi fire-and-forget từ RBAC middleware — không await.
 *
 * @example
 * // Trong middleware, sau khi xác thực thành công:
 * touchUserSessions(userId).catch(() => {});
 */
export async function touchUserSessions(userId: string): Promise<void> {
  const threshold = new Date(Date.now() - TOUCH_INTERVAL_MS);
  await prisma.authSession.updateMany({
    where: {
      userId,
      isActive: true,
      expiresAt: { gt: new Date() },
      lastActivityAt: { lt: threshold }, // chỉ update nếu chưa touch gần đây
    },
    data: { lastActivityAt: new Date() },
  });
}

/**
 * Revoke một session cụ thể
 */
export async function revokeSession(
  sessionId: string,
  reason: RevokeReason
): Promise<{ success: boolean; error?: string }> {
  const session = await prisma.authSession.findUnique({
    where: { id: sessionId },
    select: { isActive: true },
  });

  if (!session) return { success: false, error: 'Session không tồn tại' };
  if (!session.isActive) return { success: false, error: 'Session đã bị revoke' };

  await prisma.authSession.update({
    where: { id: sessionId },
    data: { isActive: false, revokedAt: new Date(), revokedReason: reason },
  });

  return { success: true };
}

/**
 * Revoke tất cả session của một user (dùng khi đổi mật khẩu, phát hiện xâm phạm)
 */
export async function revokeAllUserSessions(
  userId: string,
  reason: RevokeReason,
  exceptToken?: string
): Promise<number> {
  const result = await prisma.authSession.updateMany({
    where: {
      userId,
      isActive: true,
      ...(exceptToken && { token: { not: exceptToken } }),
    },
    data: { isActive: false, revokedAt: new Date(), revokedReason: reason },
  });

  return result.count;
}

/**
 * Lấy danh sách session active của user (dùng cho "My Sessions" page)
 */
export async function getUserActiveSessions(userId: string) {
  return prisma.authSession.findMany({
    where: { userId, isActive: true, expiresAt: { gt: new Date() } },
    orderBy: { lastActivityAt: 'desc' },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      deviceName: true,
      loginAt: true,
      lastActivityAt: true,
      expiresAt: true,
    },
  });
}

/**
 * Lấy danh sách tất cả session (dùng cho admin panel)
 */
export async function getAllSessions(
  filters: { userId?: string; isActive?: boolean } = {},
  page = 1,
  pageSize = 20
) {
  const where = {
    ...(filters.userId && { userId: filters.userId }),
    ...(filters.isActive !== undefined && { isActive: filters.isActive }),
  };

  const [sessions, total] = await Promise.all([
    prisma.authSession.findMany({
      where,
      orderBy: { loginAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
      },
    }),
    prisma.authSession.count({ where }),
  ]);

  return { sessions, total, page, pageSize };
}

/**
 * Expire các session quá hạn (dùng cho cron job)
 */
export async function expireOldSessions(): Promise<number> {
  const result = await prisma.authSession.updateMany({
    where: { isActive: true, expiresAt: { lt: new Date() } },
    data: { isActive: false, revokedAt: new Date(), revokedReason: 'EXPIRED' },
  });

  return result.count;
}
