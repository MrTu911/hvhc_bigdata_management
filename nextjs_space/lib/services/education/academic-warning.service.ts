/**
 * Academic Warning Service – M10 UC-57
 *
 * Tách business logic cảnh báo học vụ ra khỏi route.
 * Route chỉ validate input và gọi service này.
 */

import { prisma } from '@/lib/db';
import { AcademicWarningLevel } from '@prisma/client';

export type WarningComputeResult =
  | { warningLevel: null; message: string }
  | { warningLevel: AcademicWarningLevel; warning: Awaited<ReturnType<typeof upsertWarning>>; gpa: number; failedCredits: number };

/**
 * Tính mức cảnh báo dựa trên GPA và số tín chỉ không đạt.
 * Trả về null nếu không cần cảnh báo.
 */
export function computeWarningLevel(
  gpa: number,
  failedCredits: number
): AcademicWarningLevel | null {
  if (gpa < 1.0 || failedCredits >= 20) return 'CRITICAL';
  if (gpa < 1.5 || failedCredits >= 12) return 'HIGH';
  if (gpa < 2.0 || failedCredits >= 6)  return 'MEDIUM';
  if (gpa < 2.5 || failedCredits >= 3)  return 'LOW';
  return null;
}

function buildSuggestedAction(level: AcademicWarningLevel): string {
  switch (level) {
    case 'CRITICAL': return 'Đình chỉ học tập, gặp ban giám hiệu ngay';
    case 'HIGH':     return 'Cảnh báo chính thức, cố vấn học tập theo dõi';
    case 'MEDIUM':   return 'Nhắc nhở, lên kế hoạch học tập bổ sung';
    case 'LOW':      return 'Theo dõi kết quả học kỳ tiếp theo';
  }
}

async function upsertWarning(params: {
  hocVienId: string;
  academicYear: string;
  semesterCode: string;
  warningLevel: AcademicWarningLevel;
  gpa: number;
  failedCredits: number;
  tinChiTichLuy: number | null;
  tongTinChi: number | null;
}) {
  const { hocVienId, academicYear, semesterCode, warningLevel, gpa, failedCredits, tinChiTichLuy, tongTinChi } = params;

  return prisma.academicWarning.upsert({
    where: { hocVienId_academicYear_semesterCode: { hocVienId, academicYear, semesterCode } },
    create: {
      hocVienId, academicYear, semesterCode,
      warningLevel,
      warningReasonJson: { gpa, failedCredits, tinChiTichLuy, tongTinChi },
      suggestedAction: buildSuggestedAction(warningLevel),
      isResolved: false,
    },
    update: {
      warningLevel,
      warningReasonJson: { gpa, failedCredits, tinChiTichLuy, tongTinChi },
      suggestedAction: buildSuggestedAction(warningLevel),
      isResolved: false,
      resolvedAt: null,
      resolvedBy: null,
      generatedAt: new Date(),
    },
  });
}

/**
 * Tính lại cảnh báo học vụ cho một học viên trong một học kỳ.
 *
 * - Nếu không có cảnh báo: đánh dấu resolved các cảnh báo cũ.
 * - Nếu có cảnh báo: upsert AcademicWarning mới.
 *
 * @returns WarningComputeResult
 */
export async function recalculateWarning(params: {
  hocVienId: string;
  academicYear: string;
  semesterCode: string;
  resolvedBy: string;
}): Promise<WarningComputeResult | { error: 'NOT_FOUND' }> {
  const { hocVienId, academicYear, semesterCode, resolvedBy } = params;

  const hocVien = await prisma.hocVien.findFirst({
    where: { id: hocVienId, deletedAt: null },
    select: {
      id: true,
      diemTrungBinh: true,
      tinChiTichLuy: true,
      tongTinChi: true,
    },
  });
  if (!hocVien) return { error: 'NOT_FOUND' };

  // Đếm tín chỉ không đạt từ ClassEnrollment
  const failedEnrollments = await prisma.classEnrollment.findMany({
    where: { hocVienId, passFlag: false },
    include: {
      classSection: {
        include: { curriculumCourse: { select: { credits: true } } },
      },
    },
  });
  const failedCredits = failedEnrollments.reduce(
    (sum, e) => sum + (e.classSection?.curriculumCourse?.credits ?? 0),
    0
  );

  const gpa = hocVien.diemTrungBinh ?? 0;
  const warningLevel = computeWarningLevel(gpa, failedCredits);

  if (!warningLevel) {
    await prisma.academicWarning.updateMany({
      where: { hocVienId, academicYear, semesterCode, isResolved: false },
      data: { isResolved: true, resolvedAt: new Date(), resolvedBy },
    });
    return { warningLevel: null, message: 'Không có cảnh báo học vụ' };
  }

  const warning = await upsertWarning({
    hocVienId, academicYear, semesterCode, warningLevel, gpa, failedCredits,
    tinChiTichLuy: hocVien.tinChiTichLuy,
    tongTinChi: hocVien.tongTinChi,
  });

  return { warningLevel, warning, gpa, failedCredits };
}
