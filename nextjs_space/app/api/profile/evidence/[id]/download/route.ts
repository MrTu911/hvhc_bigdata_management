/**
 * Self-service: lấy link xem/tải một minh chứng (tạo presigned URL MỚI, tránh URL hết hạn).
 * GET /api/profile/evidence/[id]/download  → 302 redirect tới presigned URL.
 *
 * Gate: VIEW_MY_CADRE_PROFILE. Luôn scope SELF — chỉ minh chứng thuộc sở hữu session user.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { getPresignedUrl } from '@/lib/minio-client';
import { ProfileEvidenceService } from '@/lib/services/personnel/profile-evidence.service';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  if (!(await authorize(user, PERSONAL.VIEW_CADRE_PROFILE, {})).allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền xem minh chứng' }, { status: 403 });
  }

  const row = await ProfileEvidenceService.getOwned(user.id, params.id);
  if (!row) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy minh chứng' }, { status: 404 });
  }

  try {
    const url = await getPresignedUrl(row.bucketName, row.objectKey, 60 * 5); // 5 phút đủ để mở
    return NextResponse.redirect(url);
  } catch (err) {
    console.error('[GET /api/profile/evidence/[id]/download]', err);
    return NextResponse.json({ success: false, error: 'Không tạo được link xem minh chứng' }, { status: 500 });
  }
}
