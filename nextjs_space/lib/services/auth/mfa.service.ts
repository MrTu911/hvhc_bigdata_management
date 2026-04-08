/**
 * M01 – UC-01: MFA/TOTP Service
 * Quản lý xác thực đa yếu tố (TOTP 6 chữ số, RFC 6238)
 *
 * Rewritten for otplib v13 functional API.
 *
 * Luồng setup:
 *   1. generateMfaSecret(userId) → { secret, otpauthUrl, qrCodeDataUrl }
 *   2. User quét QR bằng Google/Microsoft Authenticator
 *   3. verifyAndEnableMfa(userId, token) → xác nhận token đầu tiên → bật MFA
 *
 * Luồng login:
 *   1. verifyToken(secret, token) → boolean
 *   2. Nếu sai 3 lần liên tiếp → lockAccount()
 */

import { generate, verify } from '@otplib/totp';
import {
  NobleCryptoPlugin,
  ScureBase32Plugin,
  generateSecret as _generateSecret,
  generateURI,
} from 'otplib';
import QRCode from 'qrcode';
import prisma from '@/lib/db';

// TOTP config chuẩn RFC 6238
const TOTP_CONFIG = {
  window: 1,   // ±1 step (30s) để bù drift đồng hồ
  step: 30,    // 30 giây mỗi token
  digits: 6,
};

// Plugins cung cấp crypto và base32 cho otplib v13
const PLUGINS = {
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
};

const MAX_FAILED_ATTEMPTS = 3;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 phút

// Shorthand options object used in every TOTP call
const TOTP_OPTS = { ...TOTP_CONFIG, ...PLUGINS };

export interface MfaSetupResult {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

/**
 * Tạo TOTP secret mới cho user
 * Chưa bật MFA — chỉ trả về secret + QR để user xác nhận
 */
export async function generateMfaSecret(userId: string): Promise<MfaSetupResult> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true },
  });

  const secret = _generateSecret({ length: 20, ...PLUGINS });
  const issuer = 'HVHC BigData';

  const otpauthUrl = generateURI({
    issuer,
    label: user.email,
    secret,
    ...PLUGINS,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  // Lưu secret tạm (chưa bật mfaEnabled)
  await prisma.user.update({
    where: { id: userId },
    data: { mfaSecret: secret },
  });

  return { secret, otpauthUrl, qrCodeDataUrl };
}

/**
 * Xác nhận token đầu tiên và bật MFA
 */
export async function verifyAndEnableMfa(
  userId: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaSecret: true, mfaEnabled: true },
  });

  if (!user?.mfaSecret) {
    return { success: false, error: 'Chưa khởi tạo MFA. Hãy gọi setup trước.' };
  }

  if (user.mfaEnabled) {
    return { success: false, error: 'MFA đã được bật.' };
  }

  const result = await verify({ token, secret: user.mfaSecret, ...TOTP_OPTS });
  if (!result.valid) {
    return { success: false, error: 'Mã OTP không đúng.' };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: true },
  });

  return { success: true };
}

/**
 * Xác thực TOTP token khi đăng nhập
 * Trả về true nếu token hợp lệ
 */
export async function verifyToken(secret: string, token: string): Promise<boolean> {
  const result = await verify({ token, secret, ...TOTP_OPTS });
  return result.valid;
}

/**
 * Ghi nhận lần đăng nhập thất bại (sai OTP)
 * Tự động lock account sau MAX_FAILED_ATTEMPTS lần
 */
export async function recordFailedAttempt(userId: string): Promise<{
  locked: boolean;
  failedCount: number;
  lockedUntil?: Date;
}> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { failedLoginCount: true },
  });

  const newCount = user.failedLoginCount + 1;
  const shouldLock = newCount >= MAX_FAILED_ATTEMPTS;
  const lockedUntil = shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginCount: newCount,
      ...(lockedUntil && { lockedUntil }),
    },
  });

  return { locked: shouldLock, failedCount: newCount, lockedUntil: lockedUntil ?? undefined };
}

/**
 * Reset failed count sau đăng nhập thành công
 */
export async function resetFailedAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: 0, lockedUntil: null },
  });
}

/**
 * Kiểm tra account có bị lock không
 */
export async function checkAccountLock(userId: string): Promise<{
  locked: boolean;
  lockedUntil?: Date;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true },
  });

  if (!user?.lockedUntil) return { locked: false };

  const now = new Date();
  if (user.lockedUntil > now) {
    return { locked: true, lockedUntil: user.lockedUntil };
  }

  // Lock đã hết hạn — tự động unlock
  await prisma.user.update({
    where: { id: userId },
    data: { lockedUntil: null, failedLoginCount: 0 },
  });
  return { locked: false };
}

/**
 * Tắt MFA
 */
export async function disableMfa(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: false, mfaSecret: null },
  });
}
