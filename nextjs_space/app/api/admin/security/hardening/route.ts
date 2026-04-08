/**
 * M01 – UC-08: Security Hardening Status API
 * GET /api/admin/security/hardening
 *
 * Trả về trạng thái cấu hình bảo mật hiện tại.
 * Không để lộ giá trị secret thực — chỉ trả về "set / not-set / masked".
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { SECURITY } from '@/lib/rbac/function-codes';
import { isBqpSsoConfigured } from '@/lib/auth/bqp-sso-provider';
import { RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';

function maskSecret(value: string | undefined, showLength = true): string {
  if (!value) return '— chưa set';
  if (value.length <= 6) return '***';
  const shown = value.slice(0, 3);
  return showLength ? `${shown}${'*'.repeat(8)} (${value.length} ký tự)` : `${shown}${'*'.repeat(8)}`;
}

function isSet(value: string | undefined): boolean {
  return !!(value && value.trim().length > 0);
}

export async function GET(request: NextRequest) {
  const auth = await requireFunction(request, SECURITY.MANAGE_POLICY);
  if (!auth.allowed) return auth.response!;

  const env = process.env;

  // ── Env / Secret checks ───────────────────────────────────────────────────
  const secretChecks = [
    {
      key: 'NEXTAUTH_SECRET',
      label: 'NextAuth Secret',
      critical: true,
      set: isSet(env.NEXTAUTH_SECRET),
      masked: maskSecret(env.NEXTAUTH_SECRET),
      note: isSet(env.NEXTAUTH_SECRET)
        ? null
        : 'CRITICAL: JWT sẽ dùng fallback hard-code → tất cả session không an toàn',
    },
    {
      key: 'NEXTAUTH_URL',
      label: 'NextAuth URL',
      critical: false,
      set: isSet(env.NEXTAUTH_URL),
      masked: env.NEXTAUTH_URL ?? '— chưa set',
      note: isSet(env.NEXTAUTH_URL) ? null : 'Cần set ở production để OAuth callback hoạt động',
    },
    {
      key: 'DATABASE_URL',
      label: 'Database URL',
      critical: true,
      set: isSet(env.DATABASE_URL),
      masked: isSet(env.DATABASE_URL) ? '***@***:5432/***' : '— chưa set',
      note: isSet(env.DATABASE_URL) ? null : 'CRITICAL: Không kết nối được database',
    },
    {
      key: 'REDIS_URL',
      label: 'Redis URL (Rate Limit)',
      critical: false,
      set: isSet(env.REDIS_URL),
      masked: isSet(env.REDIS_URL) ? 'redis://***' : '— chưa set (in-memory fallback)',
      note: isSet(env.REDIS_URL)
        ? null
        : 'Rate limiter đang dùng in-memory Map — không an toàn với multi-instance',
    },
    {
      key: 'BQP_SSO_ISSUER',
      label: 'BQP SSO Issuer',
      critical: false,
      set: isSet(env.BQP_SSO_ISSUER),
      masked: maskSecret(env.BQP_SSO_ISSUER),
      note: isSet(env.BQP_SSO_ISSUER) ? null : 'SSO BQP chưa được cấu hình (tùy chọn)',
    },
    {
      key: 'BQP_SSO_CLIENT_ID',
      label: 'BQP SSO Client ID',
      critical: false,
      set: isSet(env.BQP_SSO_CLIENT_ID),
      masked: maskSecret(env.BQP_SSO_CLIENT_ID),
      note: null,
    },
    {
      key: 'BQP_SSO_CLIENT_SECRET',
      label: 'BQP SSO Client Secret',
      critical: false,
      set: isSet(env.BQP_SSO_CLIENT_SECRET),
      masked: maskSecret(env.BQP_SSO_CLIENT_SECRET),
      note: null,
    },
  ];

  // ── Feature status ────────────────────────────────────────────────────────
  const features = [
    {
      id: 'mfa',
      label: 'MFA / TOTP (UC-01)',
      status: 'active' as const,
      detail: 'otplib + failedLoginCount + lockedUntil đã implement',
    },
    {
      id: 'session-revoke',
      label: 'Session Revocation (UC-06)',
      status: 'active' as const,
      detail: 'AuthSession model + revokeSession() service hoạt động',
    },
    {
      id: 'rate-limit',
      label: 'Rate Limiting',
      status: (isSet(env.REDIS_URL) ? 'active' : 'partial') as 'active' | 'partial' | 'missing',
      detail: isSet(env.REDIS_URL)
        ? `Redis-backed. Login: ${RATE_LIMIT_CONFIGS.login.maxRequests}req/${RATE_LIMIT_CONFIGS.login.windowMs / 60000}m, OTP: ${RATE_LIMIT_CONFIGS.otp.maxRequests}req/${RATE_LIMIT_CONFIGS.otp.windowMs / 60000}m`
        : 'In-memory fallback — không đáng tin cậy ở production multi-instance',
    },
    {
      id: 'security-headers',
      label: 'Security Headers (UC-08)',
      status: 'active' as const,
      detail: 'X-Frame-Options, CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy',
    },
    {
      id: 'bqp-sso',
      label: 'BQP SSO (UC-07)',
      status: (isBqpSsoConfigured() ? 'active' : 'missing') as 'active' | 'partial' | 'missing',
      detail: isBqpSsoConfigured()
        ? 'Provider configured — cần test callback flow với IdP thật'
        : 'Scaffold sẵn — chờ env BQP_SSO_ISSUER / CLIENT_ID / CLIENT_SECRET',
    },
    {
      id: 'hsts',
      label: 'HSTS (HTTPS only)',
      status: (env.NODE_ENV === 'production' ? 'active' : 'partial') as 'active' | 'partial' | 'missing',
      detail: env.NODE_ENV === 'production'
        ? 'Strict-Transport-Security set (max-age=31536000)'
        : 'Chỉ active ở NODE_ENV=production — development bỏ qua',
    },
    {
      id: 'dept-scope',
      label: 'DEPARTMENT Scope (RBAC)',
      status: 'partial' as const,
      detail: 'checkScopeAsync có nhưng sync path vẫn bypass → cần migrate middleware sang async',
    },
  ];

  // ── Summary ───────────────────────────────────────────────────────────────
  const criticalMissing = secretChecks.filter((s) => s.critical && !s.set);
  const warnings = secretChecks.filter((s) => !s.critical && !s.set);
  const missingFeatures = features.filter((f) => f.status === 'missing');
  const partialFeatures = features.filter((f) => f.status === 'partial');

  return NextResponse.json({
    success: true,
    data: {
      generatedAt: new Date().toISOString(),
      environment: env.NODE_ENV ?? 'unknown',
      summary: {
        score: Math.round(
          ((features.filter((f) => f.status === 'active').length / features.length) * 100)
        ),
        criticalIssues: criticalMissing.length,
        warnings: warnings.length + partialFeatures.length,
        ok: criticalMissing.length === 0 && missingFeatures.length === 0,
      },
      secrets: secretChecks,
      features,
      rateLimitConfigs: Object.entries(RATE_LIMIT_CONFIGS).map(([name, cfg]) => ({
        name,
        windowMinutes: cfg.windowMs / 60000,
        maxRequests: cfg.maxRequests,
      })),
    },
  });
}
