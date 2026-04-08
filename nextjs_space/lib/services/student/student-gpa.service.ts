/**
 * M07 – Student GPA Service
 *
 * Rebuild GPA tích lũy cho học viên từ nguồn M10 (KetQuaHocTap).
 *
 * Nguyên tắc:
 *   - M10 là nguồn điểm chính thức – chỉ lấy KetQuaHocTap.workflowStatus = APPROVED.
 *   - M07 ghi read-model StudentGpaHistory theo (hocVienId, academicYear, semesterCode).
 *   - Khi có thay đổi điểm cuối cùng đã chốt, cần trigger rebuild để đồng bộ lại.
 *   - Cập nhật HocVien.diemTrungBinh và HocVien.academicStatus sau rebuild.
 *
 * Công thức GPA:
 *   GPA kỳ = Σ(diem × soTinChi) / Σ(soTinChi) – chỉ tính môn đạt (diem >= 5.0).
 *   GPA tích lũy = Σ_tất_cả_kỳ(diem × soTinChi) / Σ_tất_cả_kỳ(soTinChi).
 *
 * Ngưỡng cảnh báo học vụ (AcademicWarningLevel):
 *   - GPA tích lũy < 1.0 → CRITICAL (probation ngay)
 *   - GPA tích lũy < 1.5 → HIGH
 *   - GPA tích lũy < 2.0 → MEDIUM
 *   - Tín chỉ nợ > 10    → LOW (bất kể GPA)
 */

import 'server-only';
import prisma from '@/lib/db';
import {
  GradeWorkflowStatus,
  AcademicPerformanceStatus,
  AcademicWarningLevel,
} from '@prisma/client';

// ─── Ngưỡng cảnh báo ──────────────────────────────────────────────────────────
const GPA_CRITICAL  = 1.0;
const GPA_HIGH      = 1.5;
const GPA_MEDIUM    = 2.0;
const DEBT_CREDITS_LOW = 10; // số tín chỉ nợ ngưỡng LOW

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GpaRebuildResult {
  hocVienId: string;
  academicYear: string;
  semesterCode: string;
  semesterGpa: number;
  cumulativeGpa: number;
  creditsEarned: number;
  totalCreditsAccumulated: number;
  academicStatus: AcademicPerformanceStatus;
  warningCreated: boolean;
}

export interface GpaBatchSummary {
  total: number;
  succeeded: number;
  failed: { id: string; error: string }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Tính GPA từ danh sách kết quả học tập.
 * Chỉ tính môn đạt (diem >= 5.0). Trả 0 nếu không có tín chỉ.
 */
function calcGpa(records: { diem: number | null; soTinChi: number }[]): number {
  const passing = records.filter((r) => (r.diem ?? 0) >= 5.0);
  const totalCredits = passing.reduce((s, r) => s + r.soTinChi, 0);
  if (totalCredits === 0) return 0;
  const weightedSum = passing.reduce((s, r) => s + (r.diem ?? 0) * r.soTinChi, 0);
  return parseFloat((weightedSum / totalCredits).toFixed(2));
}

/**
 * Xác định AcademicPerformanceStatus từ GPA tích lũy.
 */
function resolveAcademicStatus(cumulativeGpa: number): AcademicPerformanceStatus {
  if (cumulativeGpa < GPA_CRITICAL) return AcademicPerformanceStatus.PROBATION;
  if (cumulativeGpa < GPA_HIGH)     return AcademicPerformanceStatus.WARNING;
  if (cumulativeGpa < GPA_MEDIUM)   return AcademicPerformanceStatus.WARNING;
  return AcademicPerformanceStatus.NORMAL;
}

/**
 * Xác định AcademicWarningLevel từ GPA tích lũy và tín chỉ nợ.
 * Trả null nếu không cần cảnh báo.
 */
function resolveWarningLevel(
  cumulativeGpa: number,
  debtCredits: number,
): AcademicWarningLevel | null {
  if (cumulativeGpa < GPA_CRITICAL) return AcademicWarningLevel.CRITICAL;
  if (cumulativeGpa < GPA_HIGH)     return AcademicWarningLevel.HIGH;
  if (cumulativeGpa < GPA_MEDIUM)   return AcademicWarningLevel.MEDIUM;
  if (debtCredits >= DEBT_CREDITS_LOW) return AcademicWarningLevel.LOW;
  return null;
}

// ─── Core rebuild ─────────────────────────────────────────────────────────────

/**
 * Rebuild GPA snapshot cho một học viên trong một học kỳ.
 * Upsert StudentGpaHistory + upsert AcademicWarning nếu cần.
 * Cập nhật HocVien.diemTrungBinh và HocVien.academicStatus.
 *
 * @param hocVienId    HocVien.id
 * @param academicYear VD: "2025-2026"
 * @param semesterCode VD: "HK1"
 */
export async function rebuildStudentGpa(
  hocVienId: string,
  academicYear: string,
  semesterCode: string,
): Promise<GpaRebuildResult> {
  // ── 1. Xác nhận học viên tồn tại ────────────────────────────────────────
  const hocVien = await prisma.hocVien.findUnique({
    where: { id: hocVienId },
    select: { id: true, tongTinChi: true, tinChiTichLuy: true },
  });
  if (!hocVien) throw new Error(`HocVien không tồn tại: ${hocVienId}`);

  // ── 2. Điểm kỳ này (APPROVED) ──────────────────────────────────────────
  const semesterRecords = await prisma.ketQuaHocTap.findMany({
    where: {
      hocVienId,
      namHoc: academicYear,
      hocKy: semesterCode,
      workflowStatus: GradeWorkflowStatus.APPROVED,
    },
    select: { diem: true, soTinChi: true },
  });

  const semesterGpa = calcGpa(semesterRecords);
  const creditsEarned = semesterRecords
    .filter((r) => (r.diem ?? 0) >= 5.0)
    .reduce((s, r) => s + r.soTinChi, 0);

  // ── 3. Tất cả điểm APPROVED (tích lũy đến hết kỳ này) ──────────────────
  // Lấy tất cả kỳ <= kỳ hiện tại (theo lexicographic sort – đủ cho HK1/HK2/HK3 trong cùng năm)
  const allApprovedRecords = await prisma.ketQuaHocTap.findMany({
    where: {
      hocVienId,
      workflowStatus: GradeWorkflowStatus.APPROVED,
    },
    select: { diem: true, soTinChi: true, namHoc: true, hocKy: true },
  });

  // Chỉ tính các kỳ <= kỳ hiện tại theo thứ tự năm học + học kỳ
  const filtered = allApprovedRecords.filter((r) => {
    if (!r.namHoc || !r.hocKy) return false;
    if (r.namHoc < academicYear) return true;
    if (r.namHoc === academicYear && r.hocKy <= semesterCode) return true;
    return false;
  });

  const cumulativeGpa = calcGpa(filtered);
  const totalCreditsAccumulated = filtered
    .filter((r) => (r.diem ?? 0) >= 5.0)
    .reduce((s, r) => s + r.soTinChi, 0);

  // Tín chỉ nợ = tín chỉ chương trình - tín chỉ tích lũy (nếu có)
  const programCredits = hocVien.tongTinChi ?? 0;
  const debtCredits = Math.max(0, programCredits - totalCreditsAccumulated);

  const academicStatus = resolveAcademicStatus(cumulativeGpa);
  const warningLevel = resolveWarningLevel(cumulativeGpa, debtCredits);

  // ── 4. Upsert StudentGpaHistory ────────────────────────────────────────
  await prisma.studentGpaHistory.upsert({
    where: {
      hocVienId_academicYear_semesterCode: {
        hocVienId,
        academicYear,
        semesterCode,
      },
    },
    update: {
      semesterGpa,
      cumulativeGpa,
      creditsEarned,
      totalCreditsAccumulated,
      academicStatus,
      builtAt: new Date(),
    },
    create: {
      hocVienId,
      academicYear,
      semesterCode,
      semesterGpa,
      cumulativeGpa,
      creditsEarned,
      totalCreditsAccumulated,
      academicStatus,
    },
  });

  // ── 5. Cập nhật HocVien.diemTrungBinh và academicStatus ───────────────
  await prisma.hocVien.update({
    where: { id: hocVienId },
    data: {
      diemTrungBinh: cumulativeGpa,
      academicStatus,
      tinChiTichLuy: totalCreditsAccumulated,
    },
  });

  // ── 6. Upsert AcademicWarning nếu cần ─────────────────────────────────
  let warningCreated = false;
  if (warningLevel) {
    await prisma.academicWarning.upsert({
      where: {
        hocVienId_academicYear_semesterCode: {
          hocVienId,
          academicYear,
          semesterCode,
        },
      },
      update: {
        warningLevel,
        warningReasonJson: { cumulativeGpa, debtCredits, academicStatus },
        isResolved: false,
        generatedAt: new Date(),
      },
      create: {
        hocVienId,
        academicYear,
        semesterCode,
        warningLevel,
        warningReasonJson: { cumulativeGpa, debtCredits, academicStatus },
        suggestedAction: buildSuggestedAction(warningLevel, cumulativeGpa),
      },
    });
    warningCreated = true;
  } else {
    // Đánh dấu resolved nếu học viên vừa vượt ngưỡng cảnh báo
    await prisma.academicWarning.updateMany({
      where: { hocVienId, academicYear, semesterCode, isResolved: false },
      data: { isResolved: true, resolvedAt: new Date() },
    });
  }

  return {
    hocVienId,
    academicYear,
    semesterCode,
    semesterGpa,
    cumulativeGpa,
    creditsEarned,
    totalCreditsAccumulated,
    academicStatus,
    warningCreated,
  };
}

/**
 * Batch: rebuild GPA cho toàn bộ học viên đang ACTIVE trong một học kỳ.
 */
export async function rebuildGpaBatch(
  academicYear: string,
  semesterCode: string,
): Promise<GpaBatchSummary> {
  const students = await prisma.hocVien.findMany({
    where: { currentStatus: 'ACTIVE' as any, deletedAt: null },
    select: { id: true },
  });

  let succeeded = 0;
  const failed: { id: string; error: string }[] = [];

  for (const s of students) {
    try {
      await rebuildStudentGpa(s.id, academicYear, semesterCode);
      succeeded++;
    } catch (err: any) {
      failed.push({ id: s.id, error: err.message ?? 'unknown' });
    }
  }

  return { total: students.length, succeeded, failed };
}

/**
 * Tổng hợp academic summary của học viên:
 * GPA tích lũy hiện tại, lịch sử GPA, trạng thái học lực, cảnh báo đang mở.
 */
export async function getStudentAcademicSummary(hocVienId: string) {
  const [hocVien, gpaHistories, openWarnings] = await Promise.all([
    prisma.hocVien.findUnique({
      where: { id: hocVienId },
      select: {
        id: true,
        maHocVien: true,
        hoTen: true,
        diemTrungBinh: true,
        academicStatus: true,
        tinChiTichLuy: true,
        tongTinChi: true,
        currentStatus: true,
        lop: true,
        khoaHoc: true,
        nganh: true,
        giangVienHuongDan: {
          select: {
            id: true,
            user: { select: { name: true } },
          },
        },
      },
    }),
    prisma.studentGpaHistory.findMany({
      where: { hocVienId },
      orderBy: [{ academicYear: 'desc' }, { semesterCode: 'desc' }],
      take: 8,
      select: {
        academicYear: true,
        semesterCode: true,
        semesterGpa: true,
        cumulativeGpa: true,
        creditsEarned: true,
        totalCreditsAccumulated: true,
        academicStatus: true,
        builtAt: true,
      },
    }),
    prisma.academicWarning.findMany({
      where: { hocVienId, isResolved: false },
      orderBy: { generatedAt: 'desc' },
      select: {
        academicYear: true,
        semesterCode: true,
        warningLevel: true,
        warningReasonJson: true,
        suggestedAction: true,
        generatedAt: true,
      },
    }),
  ]);

  if (!hocVien) return null;

  return {
    student: hocVien,
    gpaHistories,
    openWarnings,
    summary: {
      cumulativeGpa: hocVien.diemTrungBinh,
      academicStatus: hocVien.academicStatus,
      creditsAccumulated: hocVien.tinChiTichLuy ?? 0,
      totalProgramCredits: hocVien.tongTinChi ?? 0,
      debtCredits: Math.max(0, (hocVien.tongTinChi ?? 0) - (hocVien.tinChiTichLuy ?? 0)),
      hasActiveWarning: openWarnings.length > 0,
    },
  };
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function buildSuggestedAction(level: AcademicWarningLevel, gpa: number): string {
  switch (level) {
    case AcademicWarningLevel.CRITICAL:
      return `GPA tích lũy ${gpa} < 1.0 – cần xem xét đình chỉ học. Liên hệ cố vấn học tập và ban đào tạo ngay.`;
    case AcademicWarningLevel.HIGH:
      return `GPA tích lũy ${gpa} < 1.5 – cảnh báo học vụ mức cao. Cần lập kế hoạch cải thiện với cố vấn học tập.`;
    case AcademicWarningLevel.MEDIUM:
      return `GPA tích lũy ${gpa} < 2.0 – cảnh báo học vụ. Cần theo dõi và hỗ trợ học tập tích cực hơn.`;
    case AcademicWarningLevel.LOW:
      return `Tín chỉ nợ vượt ngưỡng – cần rà soát kế hoạch đăng ký học phần để đảm bảo tiến độ.`;
  }
}
