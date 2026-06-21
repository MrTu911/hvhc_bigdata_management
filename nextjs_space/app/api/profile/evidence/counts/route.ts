/**
 * Self-service: đếm số minh chứng theo lô nhiều bản ghi (cho badge trên bảng).
 * GET /api/profile/evidence/counts?targetType=CADRE_SECTION&ids=id1,id2,id3
 *   → { success, data: { [targetId]: number } }
 *
 * Gate: VIEW_MY_CADRE_PROFILE. Scope SELF. Không tạo presigned URL (chỉ đếm) — nhẹ.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { ProfileEvidenceService } from '@/lib/services/personnel/profile-evidence.service';
import { ProfileEvidenceTarget } from '@prisma/client';

const VALID_TARGETS = new Set<string>(Object.values(ProfileEvidenceTarget));

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  if (!(await authorize(user, PERSONAL.VIEW_CADRE_PROFILE, {})).allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền xem minh chứng hồ sơ' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get('targetType');
  const idsParamRaw = searchParams.get('ids') ?? '';
  const ids = idsParamRaw.split(',').map((s) => s.trim()).filter(Boolean);

  if (!targetType || !VALID_TARGETS.has(targetType)) {
    return NextResponse.json({ success: false, error: 'targetType không hợp lệ' }, { status: 400 });
  }
  if (ids.length === 0) {
    return NextResponse.json({ success: true, data: {} });
  }

  const data = await ProfileEvidenceService.countByTargets(
    user.id,
    targetType as ProfileEvidenceTarget,
    ids,
  );
  return NextResponse.json({ success: true, data });
}
