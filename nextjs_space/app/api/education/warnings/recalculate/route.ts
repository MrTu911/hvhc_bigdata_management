/**
 * M10 – UC-57: Academic Warning Engine – recalculate
 * POST /api/education/warnings/recalculate
 *
 * Tính lại cảnh báo học vụ cho một học viên dựa trên:
 * - GPA (diemTrungBinh)
 * - Tín chỉ tích lũy so với tổng tín chỉ chương trình
 * - ClassEnrollment passFlag
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { AcademicWarningLevel } from '@prisma/client';

export const dynamic = 'force-dynamic';

function computeWarningLevel(gpa: number, failedCredits: number): AcademicWarningLevel | null {
  if (gpa < 1.0 || failedCredits >= 20) return 'CRITICAL';
  if (gpa < 1.5 || failedCredits >= 12) return 'HIGH';
  if (gpa < 2.0 || failedCredits >= 6)  return 'MEDIUM';
  if (gpa < 2.5 || failedCredits >= 3)  return 'LOW';
  return null; // không cảnh báo
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.MANAGE_WARNING);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const body = await req.json();
    const { hocVienId, academicYear, semesterCode } = body;

    if (!hocVienId || !academicYear || !semesterCode) {
      return NextResponse.json(
        { success: false, error: 'hocVienId, academicYear, semesterCode là bắt buộc' },
        { status: 400 }
      );
    }

    const hocVien = await prisma.hocVien.findFirst({
      where: { id: hocVienId, deletedAt: null },
      select: {
        id: true, maHocVien: true, hoTen: true,
        diemTrungBinh: true, tinChiTichLuy: true, tongTinChi: true,
      },
    });
    if (!hocVien) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy học viên' }, { status: 404 });
    }

    // Đếm tín chỉ không đạt từ ClassEnrollment
    const failedEnrollments = await prisma.classEnrollment.findMany({
      where: { hocVienId, passFlag: false },
      include: {
        classSection: {
          include: { curriculumCourse: { select: { credits: true } } },
        },
      },
    });

    const failedCredits = failedEnrollments.reduce((sum, e) => {
      return sum + (e.classSection?.curriculumCourse?.credits ?? 0);
    }, 0);

    const gpa = hocVien.diemTrungBinh ?? 0;
    const warningLevel = computeWarningLevel(gpa, failedCredits);

    if (!warningLevel) {
      // Đánh dấu đã giải quyết nếu trước đó có cảnh báo
      await prisma.academicWarning.updateMany({
        where: { hocVienId, academicYear, semesterCode, isResolved: false },
        data: { isResolved: true, resolvedAt: new Date(), resolvedBy: user!.id },
      });

      return NextResponse.json({
        success: true,
        data: { hocVienId, warningLevel: null, message: 'Không có cảnh báo học vụ' },
      });
    }

    const reasonJson = {
      gpa,
      failedCredits,
      tinChiTichLuy: hocVien.tinChiTichLuy,
      tongTinChi: hocVien.tongTinChi,
    };

    const suggestedAction =
      warningLevel === 'CRITICAL' ? 'Đình chỉ học tập, gặp ban giám hiệu ngay' :
      warningLevel === 'HIGH'     ? 'Cảnh báo chính thức, cố vấn học tập theo dõi' :
      warningLevel === 'MEDIUM'   ? 'Nhắc nhở, lên kế hoạch học tập bổ sung' :
                                    'Theo dõi kết quả học kỳ tiếp theo';

    const warning = await prisma.academicWarning.upsert({
      where: { hocVienId_academicYear_semesterCode: { hocVienId, academicYear, semesterCode } },
      create: {
        hocVienId, academicYear, semesterCode,
        warningLevel,
        warningReasonJson: reasonJson,
        suggestedAction,
        isResolved: false,
      },
      update: {
        warningLevel,
        warningReasonJson: reasonJson,
        suggestedAction,
        isResolved: false,
        resolvedAt: null,
        resolvedBy: null,
        generatedAt: new Date(),
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.MANAGE_WARNING,
      action: 'UPDATE',
      resourceType: 'ACADEMIC_WARNING',
      resourceId: warning.id,
      newValue: { warningLevel, gpa, failedCredits },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: warning });
  } catch (error: any) {
    console.error('POST /api/education/warnings/recalculate error:', error);
    return NextResponse.json({ success: false, error: 'Failed to recalculate warning' }, { status: 500 });
  }
}
