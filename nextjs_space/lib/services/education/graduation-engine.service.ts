/**
 * Graduation Rule Engine Service – M10 UC-60
 *
 * Single source of business logic cho xét tốt nghiệp.
 * Route chỉ gọi service này, không chứa engine logic.
 */

import { prisma } from '@/lib/db';
import {
  MIN_GPA_FOR_GRADUATION,
  MIN_CONDUCT_SCORE_FOR_GRADUATION,
  DEFAULT_REQUIRED_CREDITS,
} from '@/lib/constants/graduation-rules';

export type GraduationFailureReason = {
  code: string;
  message: string;
};

export type GraduationEngineResult = {
  hocVienId: string;
  gpa: number;
  totalCreditsEarned: number;
  requiredCredits: number;
  conductEligible: boolean;
  thesisEligible: boolean;
  languageEligible: boolean;
  graduationEligible: boolean;
  failureReasonsJson: GraduationFailureReason[] | null;
};

/**
 * Chạy toàn bộ rule xét tốt nghiệp cho một học viên.
 * Trả về null nếu học viên không tồn tại.
 *
 * Rules:
 * 1. tinChiTichLuy >= programVersion.totalCredits
 * 2. diemTrungBinh >= MIN_GPA_FOR_GRADUATION
 * 3. conductScore (kỳ gần nhất) >= MIN_CONDUCT_SCORE_FOR_GRADUATION
 * 4. ThesisProject (nếu có) phải DEFENDED
 * 5. ForeignLanguageCert (M02) phải có ít nhất 1 cert
 */
export async function runGraduationEngine(hocVienId: string): Promise<GraduationEngineResult | null> {
  const hocVien = await prisma.hocVien.findFirst({
    where: { id: hocVienId, deletedAt: null },
    select: {
      id: true,
      currentStatus: true,
      diemTrungBinh: true,
      tinChiTichLuy: true,
      tongTinChi: true,
      userId: true,
      currentProgramVersion: { select: { totalCredits: true } },
    },
  });

  if (!hocVien) return null;

  // Guard: học viên SUSPENDED / DROPPED_OUT không đủ điều kiện xét tốt nghiệp
  const INELIGIBLE_STATUSES = ['SUSPENDED', 'DROPPED_OUT'];
  if (INELIGIBLE_STATUSES.includes(hocVien.currentStatus ?? '')) {
    return {
      hocVienId,
      gpa: hocVien.diemTrungBinh ?? 0,
      totalCreditsEarned: hocVien.tinChiTichLuy ?? 0,
      requiredCredits: hocVien.currentProgramVersion?.totalCredits ?? hocVien.tongTinChi ?? DEFAULT_REQUIRED_CREDITS,
      conductEligible: false,
      thesisEligible: false,
      languageEligible: false,
      graduationEligible: false,
      failureReasonsJson: [{
        code: 'STUDENT_STATUS_INELIGIBLE',
        message: `Học viên đang ở trạng thái ${hocVien.currentStatus} — không đủ điều kiện xét tốt nghiệp`,
      }],
    };
  }

  const requiredCredits =
    hocVien.currentProgramVersion?.totalCredits ?? hocVien.tongTinChi ?? DEFAULT_REQUIRED_CREDITS;
  const totalCreditsEarned = hocVien.tinChiTichLuy ?? 0;
  const gpa = hocVien.diemTrungBinh ?? 0;

  // Rule 3: điểm rèn luyện kỳ gần nhất
  const lastConduct = await prisma.studentConductRecord.findFirst({
    where: { hocVienId },
    orderBy: [{ academicYear: 'desc' }, { semesterCode: 'desc' }],
    select: { conductScore: true },
  });
  const conductEligible = lastConduct
    ? lastConduct.conductScore >= MIN_CONDUCT_SCORE_FOR_GRADUATION
    : false;

  // Rule 4: khóa luận (nếu có phải DEFENDED; không có = đạt)
  const thesis = await prisma.thesisProject.findFirst({
    where: { hocVienId },
    select: { status: true },
  });
  const thesisEligible = !thesis || thesis.status === 'DEFENDED';

  // Rule 5: ngoại ngữ qua ForeignLanguageCert (M02)
  let languageEligible = false;
  if (hocVien.userId) {
    const langCert = await prisma.foreignLanguageCert.findFirst({
      where: { userId: hocVien.userId },
      select: { id: true },
    });
    languageEligible = langCert !== null;
  }

  // Tổng hợp failure reasons
  const failureReasons: GraduationFailureReason[] = [];

  if (totalCreditsEarned < requiredCredits) {
    failureReasons.push({
      code: 'INSUFFICIENT_CREDITS',
      message: `Tín chỉ tích lũy ${totalCreditsEarned} < yêu cầu ${requiredCredits}`,
    });
  }
  if (gpa < MIN_GPA_FOR_GRADUATION) {
    failureReasons.push({
      code: 'LOW_GPA',
      message: `GPA ${gpa.toFixed(2)} < ${MIN_GPA_FOR_GRADUATION}`,
    });
  }
  if (!conductEligible) {
    failureReasons.push({
      code: 'CONDUCT_INELIGIBLE',
      message: `Điểm rèn luyện chưa đạt (< ${MIN_CONDUCT_SCORE_FOR_GRADUATION})`,
    });
  }
  if (!thesisEligible) {
    failureReasons.push({
      code: 'THESIS_NOT_DEFENDED',
      message: 'Khóa luận / luận văn chưa bảo vệ',
    });
  }
  if (!languageEligible) {
    failureReasons.push({
      code: 'NO_LANGUAGE_CERT',
      message: 'Chưa có chứng chỉ ngoại ngữ được xác nhận (M02 ForeignLanguageCert)',
    });
  }

  const graduationEligible = failureReasons.length === 0;

  return {
    hocVienId,
    gpa,
    totalCreditsEarned,
    requiredCredits,
    conductEligible,
    thesisEligible,
    languageEligible,
    graduationEligible,
    failureReasonsJson: failureReasons.length > 0 ? failureReasons : null,
  };
}
