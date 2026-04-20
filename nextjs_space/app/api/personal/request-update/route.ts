/**
 * POST /api/personal/request-update
 * Gửi yêu cầu cập nhật thông tin cá nhân nhạy cảm (để admin M02 duyệt).
 * Trường không nhạy cảm nên dùng PUT /api/profile/me trực tiếp.
 * Yêu cầu: REQUEST_MY_INFO_UPDATE
 *
 * Body: { fieldName: string, requestedValue: string, currentValue?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';

// Trường nhạy cảm cần phê duyệt — trường khác dùng PUT /api/profile/me
const SENSITIVE_FIELDS = new Set([
  'rank', 'militaryId', 'citizenId', 'officerIdCard', 'militaryIdNumber',
  'unitId', 'positionId', 'managementCategory', 'managementLevel',
  'enlistmentDate', 'dischargeDate', 'partyJoinDate', 'partyPosition',
]);

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.REQUEST_INFO_UPDATE, {});
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.deniedReason ?? 'Không có quyền gửi yêu cầu cập nhật' }, { status: 403 });
  }

  let body: { fieldName?: string; requestedValue?: string; currentValue?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body không hợp lệ' }, { status: 400 });
  }

  const { fieldName, requestedValue, currentValue } = body;

  if (!fieldName || typeof fieldName !== 'string') {
    return NextResponse.json({ error: 'Thiếu fieldName' }, { status: 400 });
  }
  if (!requestedValue || typeof requestedValue !== 'string') {
    return NextResponse.json({ error: 'Thiếu requestedValue' }, { status: 400 });
  }
  if (!SENSITIVE_FIELDS.has(fieldName)) {
    return NextResponse.json(
      { error: `Trường "${fieldName}" không cần phê duyệt — dùng PUT /api/profile/me để cập nhật trực tiếp` },
      { status: 400 }
    );
  }

  try {
    const record = await prisma.personalUpdateRequest.create({
      data: {
        userId: user.id,
        fieldName,
        requestedValue,
        currentValue: currentValue ?? null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Yêu cầu đã được gửi và đang chờ admin phê duyệt',
      data: { id: record.id, fieldName, status: record.status, createdAt: record.createdAt },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[POST /api/personal/request-update]', error);
    return NextResponse.json({ error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.REQUEST_INFO_UPDATE, {});
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.deniedReason ?? 'Không có quyền xem yêu cầu cập nhật' }, { status: 403 });
  }

  try {
    const requests = await prisma.personalUpdateRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fieldName: true,
        currentValue: true,
        requestedValue: true,
        status: true,
        reviewNote: true,
        reviewedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[GET /api/personal/request-update]', error);
    return NextResponse.json({ error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}
