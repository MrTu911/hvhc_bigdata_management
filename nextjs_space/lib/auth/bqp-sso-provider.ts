/**
 * M01 – UC-07: BQP SSO Provider (OIDC adapter scaffold)
 *
 * Scaffold — chưa kết nối IdP BQP thật.
 * Khi có env đầy đủ, thay thế stub bên dưới bằng OIDC flow thực.
 *
 * Env cần thiết (chưa có → provider bị disable tự động):
 *   BQP_SSO_ISSUER       — OIDC issuer URL của BQP IdP
 *   BQP_SSO_CLIENT_ID    — client ID đã đăng ký
 *   BQP_SSO_CLIENT_SECRET — client secret
 *
 * Claims BQP gửi về:
 *   military_id  → User.militaryId
 *   unit_code    → lookup Unit.code → Unit.id
 *   rank         → User.rank
 *   name         → User.name
 *   email        → User.email (nếu có)
 *
 * Flow:
 *   1. Nhận callback từ BQP IdP
 *   2. mapBqpClaims() → internal user shape
 *   3. upsertBqpUser() → tìm/tạo User bằng militaryId
 *   4. Nếu unit_code không map được → throw BQP_UNIT_NOT_FOUND
 *   5. Trả về user cho NextAuth session
 */

import prisma from '@/lib/db';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BqpClaims {
  sub: string;           // unique ID từ BQP IdP
  military_id: string;   // mã quân nhân
  unit_code?: string;    // mã đơn vị BQP
  rank?: string;         // quân hàm
  name?: string;
  email?: string;
}

export interface BqpUserResult {
  id: string;
  email: string;
  name: string;
  role: string;
  militaryId: string;
  unitId: string | null;
}

// ─── Config guard ────────────────────────────────────────────────────────────

export function isBqpSsoConfigured(): boolean {
  return !!(
    process.env.BQP_SSO_ISSUER &&
    process.env.BQP_SSO_CLIENT_ID &&
    process.env.BQP_SSO_CLIENT_SECRET
  );
}

// ─── Claims mapping ──────────────────────────────────────────────────────────

export function mapBqpClaims(claims: BqpClaims): {
  militaryId: string;
  unitCode: string | undefined;
  rank: string | undefined;
  name: string;
  email: string;
} {
  if (!claims.military_id) {
    throw new Error('BQP_MISSING_MILITARY_ID: claims.military_id là bắt buộc');
  }

  return {
    militaryId: claims.military_id,
    unitCode: claims.unit_code,
    rank: claims.rank,
    name: claims.name ?? `Quân nhân ${claims.military_id}`,
    email: claims.email ?? `${claims.military_id}@bqp.mil.vn`,
  };
}

// ─── Unit code → unitId lookup ───────────────────────────────────────────────

export async function resolveUnitId(unitCode: string): Promise<string | null> {
  const unit = await prisma.unit.findFirst({
    where: {
      code: unitCode,
    },
    select: { id: true },
  });

  return unit?.id ?? null;
}

// ─── Upsert user từ BQP SSO ──────────────────────────────────────────────────

export async function upsertBqpUser(claims: BqpClaims): Promise<BqpUserResult> {
  const mapped = mapBqpClaims(claims);

  // Resolve unit — không bắt buộc map được, nhưng log cảnh báo
  let unitId: string | null = null;
  if (mapped.unitCode) {
    unitId = await resolveUnitId(mapped.unitCode);
    if (!unitId) {
      // Theo design: nếu không map được unit → có thể throw hoặc để null tùy policy
      // Hiện tại: để null và log cảnh báo — admin cần gán unit thủ công
      console.warn(
        `[BQP SSO] unit_code "${mapped.unitCode}" không map được sang unitId nội bộ. ` +
        'User sẽ được tạo nhưng chưa có unit.'
      );
    }
  }

  // Tìm user theo militaryId (primary key dùng cho SSO)
  const existing = await prisma.user.findUnique({
    where: { militaryId: mapped.militaryId },
    select: { id: true, email: true, name: true, role: true, militaryId: true, unitId: true },
  });

  if (existing) {
    // Update last SSO login + sync rank/name nếu thay đổi
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        lastSsoLoginAt: new Date(),
        authProvider: 'BQP_SSO',
        ...(mapped.rank && { rank: mapped.rank }),
        ...(unitId && { unitId }),
      },
    });

    return {
      id: existing.id,
      email: existing.email,
      name: existing.name,
      role: existing.role,
      militaryId: existing.militaryId!,
      unitId: unitId ?? existing.unitId,
    };
  }

  // First login — tạo user mới
  // Password random vì SSO user không dùng local login
  const randomPassword = crypto.randomUUID();

  const newUser = await prisma.user.create({
    data: {
      email: mapped.email,
      name: mapped.name,
      password: randomPassword, // không dùng — user login qua SSO
      militaryId: mapped.militaryId,
      rank: mapped.rank,
      unitId,
      authProvider: 'BQP_SSO',
      lastSsoLoginAt: new Date(),
    } as Parameters<typeof prisma.user.create>[0]['data'],
    select: { id: true, email: true, name: true, role: true, militaryId: true, unitId: true },
  });

  console.log(
    `[BQP SSO] First login — tạo user mới: ${newUser.email} (militaryId: ${mapped.militaryId})`
  );

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    militaryId: newUser.militaryId!,
    unitId: newUser.unitId,
  };
}

// ─── NextAuth provider config (scaffold) ────────────────────────────────────
//
// Khi BQP IdP sẵn sàng, import và dùng trong lib/auth.ts:
//
//   import { buildBqpSsoProvider } from '@/lib/auth/bqp-sso-provider';
//
//   providers: [
//     CredentialsProvider(...),          // local
//     ...buildBqpSsoProvider(),           // SSO (chỉ khi configured)
//   ]

export function buildBqpSsoProvider() {
  if (!isBqpSsoConfigured()) {
    console.info('[BQP SSO] Env chưa đủ — provider bị tắt.');
    return [];
  }

  // TODO: thay bằng OidcProvider hoặc custom provider khi có issuer thật
  // Ví dụ với next-auth v4 custom OAuth:
  //
  // return [
  //   {
  //     id: 'bqp-sso',
  //     name: 'BQP SSO',
  //     type: 'oauth',
  //     issuer: process.env.BQP_SSO_ISSUER,
  //     clientId: process.env.BQP_SSO_CLIENT_ID!,
  //     clientSecret: process.env.BQP_SSO_CLIENT_SECRET!,
  //     authorization: { params: { scope: 'openid profile military_id unit_code' } },
  //     profile: async (profile) => {
  //       const user = await upsertBqpUser(profile as BqpClaims);
  //       return user;
  //     },
  //   },
  // ];

  console.warn('[BQP SSO] isBqpSsoConfigured() = true nhưng provider chưa được implement đầy đủ.');
  return [];
}
