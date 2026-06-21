/**
 * Self-service: xóa một minh chứng hồ sơ điện tử của chính chủ (soft-delete).
 * DELETE /api/profile/evidence/[id]
 *
 * Gate: MANAGE_MY_PROFILE. Minh chứng tách khỏi khóa khai báo — chủ hồ sơ tự xóa được
 * bất cứ lúc nào. Luôn scope SELF — chỉ xóa minh chứng thuộc sở hữu của session user.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { ProfileEvidenceService } from '@/lib/services/personnel/profile-evidence.service';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  if (!(await authorize(user, PERSONAL.MANAGE_PROFILE, {})).allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền xóa minh chứng' }, { status: 403 });
  }

  const deleted = await ProfileEvidenceService.softDelete(user.id, params.id, user.id);
  if (!deleted) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy minh chứng' }, { status: 404 });
  }

  await logAudit({
    userId: user.id,
    functionCode: PERSONAL.MANAGE_PROFILE,
    action: 'DELETE_PROFILE_EVIDENCE',
    resourceType: 'PROFILE_EVIDENCE',
    resourceId: params.id,
    result: 'SUCCESS',
  });

  return NextResponse.json({ success: true, data: { id: params.id } });
}
