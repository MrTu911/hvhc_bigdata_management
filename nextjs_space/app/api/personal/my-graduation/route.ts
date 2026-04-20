/**
 * GET /api/personal/my-graduation
 * Xem trạng thái xét tốt nghiệp của bản thân — SELF scope.
 * Yêu cầu: VIEW_MY_GRADUATION (Tầng 2 — Học viên/Sinh viên)
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.VIEW_GRADUATION, {});
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.deniedReason ?? 'Không có quyền xem trạng thái tốt nghiệp' }, { status: 403 });
  }

  try {
    const hocVien = await prisma.hocVien.findUnique({
      where: { userId: user.id },
      select: { id: true, maHocVien: true, diemTrungBinh: true, currentStatus: true, academicStatus: true },
    });

    if (!hocVien) {
      return NextResponse.json({ success: true, data: { hocVien: null, audits: [], diploma: null } });
    }

    const [audits, diploma] = await Promise.all([
      prisma.graduationAudit.findMany({
        where: { hocVienId: hocVien.id },
        orderBy: { auditDate: 'desc' },
        select: {
          id: true,
          auditDate: true,
          totalCreditsEarned: true,
          gpa: true,
          conductEligible: true,
          thesisEligible: true,
          languageEligible: true,
          graduationEligible: true,
          failureReasonsJson: true,
          status: true,
          decisionNo: true,
          approvedAt: true,
        },
      }),
      prisma.diplomaRecord.findFirst({
        where: { hocVienId: hocVien.id },
        select: {
          id: true,
          diplomaNo: true,
          diplomaType: true,
          classification: true,
          issuedAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { hocVien, audits, diploma },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[GET /api/personal/my-graduation]', error);
    return NextResponse.json({ error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}
