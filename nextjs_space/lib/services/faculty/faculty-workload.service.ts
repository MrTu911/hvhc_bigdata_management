/**
 * M07 – Faculty Workload Service
 *
 * Rebuild snapshot tải giảng cho giảng viên từ nguồn M10 (ClassSection).
 *
 * Nguyên tắc:
 *   - M10 là nguồn chuẩn của lịch dạy và phân công lớp học phần.
 *   - M07 chỉ đọc, tổng hợp, ghi snapshot và sinh cảnh báo quá tải.
 *   - KHÔNG nhập tay song song nếu đã có nguồn từ M10.
 *   - Snapshot theo (facultyProfileId, academicYear, semesterCode) – upsert.
 *
 * Quy đổi giờ chuẩn:
 *   - Mỗi tiết học = 45 phút = 0.75 giờ chuẩn.
 *   - Số tiết/lớp/tuần = (endPeriod - startPeriod + 1) nếu có lịch cố định.
 *   - Fallback: 3 tiết/lớp/tuần nếu không có lịch chi tiết.
 *
 * Cảnh báo:
 *   - OVERLOAD  : currentWeeklyHours > weeklyHoursLimit
 *   - UNDERLOAD : currentWeeklyHours < weeklyHoursLimit * 0.5 (dưới 50% định mức)
 */

import 'server-only';
import prisma from '@/lib/db';
import { ClassSectionStatus, WorkloadAlertStatus } from '@prisma/client';

// Số tiết mặc định/lớp/tuần khi không có lịch chi tiết
const DEFAULT_PERIODS_PER_CLASS_PER_WEEK = 3;
// 1 tiết = 0.75 giờ chuẩn (45 phút)
const HOURS_PER_PERIOD = 0.75;
// Số tuần/học kỳ ước tính để tính tổng giờ cả kỳ
const WEEKS_PER_SEMESTER = 18;
// Ngưỡng thiếu tải: dưới 50% định mức
const UNDERLOAD_RATIO = 0.5;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkloadRebuildResult {
  facultyProfileId: string;
  academicYear: string;
  semesterCode: string;
  totalClasses: number;
  totalHoursWeekly: number;
  totalHoursTerm: number;
  overloadHours: number;
  advisingCount: number;
  thesisCount: number;
  alertsCreated: number;
}

export interface WorkloadBatchSummary {
  total: number;
  succeeded: number;
  failed: { id: string; error: string }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Tính số tiết/lớp/tuần từ ClassSection.
 * Dùng (endPeriod - startPeriod + 1) nếu có lịch cố định, fallback 3 tiết.
 */
function periodsPerWeek(section: {
  startPeriod: number | null;
  endPeriod: number | null;
}): number {
  if (section.startPeriod != null && section.endPeriod != null && section.endPeriod >= section.startPeriod) {
    return section.endPeriod - section.startPeriod + 1;
  }
  return DEFAULT_PERIODS_PER_CLASS_PER_WEEK;
}

// ─── Core rebuild ─────────────────────────────────────────────────────────────

/**
 * Rebuild snapshot tải giảng cho một giảng viên trong một học kỳ.
 * Upsert FacultyWorkloadSnapshot + sinh FacultyWorkloadAlert nếu cần.
 *
 * @param facultyProfileId  FacultyProfile.id
 * @param academicYear      VD: "2025-2026"
 * @param semesterCode      VD: "HK1"
 */
export async function rebuildWorkloadSnapshot(
  facultyProfileId: string,
  academicYear: string,
  semesterCode: string,
): Promise<WorkloadRebuildResult> {
  const profile = await prisma.facultyProfile.findUnique({
    where: { id: facultyProfileId },
    select: { weeklyHoursLimit: true },
  });

  if (!profile) {
    throw new Error(`FacultyProfile không tồn tại: ${facultyProfileId}`);
  }

  const weeklyHoursLimit = profile.weeklyHoursLimit;

  // ── 1. Lấy Term ID tương ứng với (academicYear, semesterCode) ──────────────
  const term = await prisma.term.findFirst({
    where: {
      academicYear: { code: academicYear },
      termNumber: semesterCodeToTermNumber(semesterCode),
    },
    select: { id: true },
  });

  // Nếu không tìm được term, vẫn tính từ lớp ACTIVE theo giảng viên (không filter term)
  const classSectionWhere = term
    ? {
        facultyId: facultyProfileId,
        termId: term.id,
        status: ClassSectionStatus.ACTIVE,
      }
    : {
        facultyId: facultyProfileId,
        status: ClassSectionStatus.ACTIVE,
      };

  // ── 2. Lấy danh sách lớp đang dạy trong kỳ ────────────────────────────────
  const sections = await prisma.classSection.findMany({
    where: classSectionWhere,
    select: {
      id: true,
      startPeriod: true,
      endPeriod: true,
    },
  });

  const totalClasses = sections.length;

  // ── 3. Tính giờ dạy/tuần ──────────────────────────────────────────────────
  const totalPeriodsWeekly = sections.reduce(
    (sum, s) => sum + periodsPerWeek(s),
    0,
  );
  const totalHoursWeekly = parseFloat(
    (totalPeriodsWeekly * HOURS_PER_PERIOD).toFixed(2),
  );
  const totalHoursTerm = parseFloat(
    (totalHoursWeekly * WEEKS_PER_SEMESTER).toFixed(2),
  );
  const overloadHours = parseFloat(
    Math.max(0, totalHoursWeekly - weeklyHoursLimit).toFixed(2),
  );

  // ── 4. Số học viên cố vấn và khóa luận đang hướng dẫn ────────────────────
  const [advisingCount, thesisCount] = await Promise.all([
    prisma.hocVien.count({ where: { giangVienHuongDanId: facultyProfileId } }),
    prisma.thesisProject.count({
      where: {
        advisorId: facultyProfileId,
        status: { in: ['DRAFT', 'IN_PROGRESS'] as any },
      },
    }),
  ]);

  // ── 5. Upsert snapshot ────────────────────────────────────────────────────
  const snapshot = await prisma.facultyWorkloadSnapshot.upsert({
    where: {
      facultyProfileId_academicYear_semesterCode: {
        facultyProfileId,
        academicYear,
        semesterCode,
      },
    },
    update: {
      totalClasses,
      totalHoursWeekly,
      totalHoursTerm,
      overloadHours,
      weeklyHoursLimit,
      advisingCount,
      thesisCount,
      builtAt: new Date(),
    },
    create: {
      facultyProfileId,
      academicYear,
      semesterCode,
      totalClasses,
      totalHoursWeekly,
      totalHoursTerm,
      overloadHours,
      weeklyHoursLimit,
      advisingCount,
      thesisCount,
    },
  });

  // ── 6. Sinh cảnh báo tải giảng nếu cần ────────────────────────────────────
  let alertsCreated = 0;

  // Đóng cảnh báo cũ của snapshot này trước khi tạo mới
  await prisma.facultyWorkloadAlert.updateMany({
    where: {
      snapshotId: snapshot.id,
      status: WorkloadAlertStatus.OPEN,
    },
    data: { status: WorkloadAlertStatus.RESOLVED },
  });

  if (overloadHours > 0) {
    await prisma.facultyWorkloadAlert.create({
      data: {
        snapshotId: snapshot.id,
        alertType: 'OVERLOAD',
        status: WorkloadAlertStatus.OPEN,
        message: `Vượt định mức ${overloadHours} giờ/tuần (hiện tại: ${totalHoursWeekly}h, định mức: ${weeklyHoursLimit}h)`,
      },
    });
    alertsCreated++;
  } else if (totalHoursWeekly < weeklyHoursLimit * UNDERLOAD_RATIO) {
    await prisma.facultyWorkloadAlert.create({
      data: {
        snapshotId: snapshot.id,
        alertType: 'UNDERLOAD',
        status: WorkloadAlertStatus.OPEN,
        message: `Thiếu tải: chỉ đạt ${totalHoursWeekly}h/tuần, dưới 50% định mức (${weeklyHoursLimit}h)`,
      },
    });
    alertsCreated++;
  }

  return {
    facultyProfileId,
    academicYear,
    semesterCode,
    totalClasses,
    totalHoursWeekly,
    totalHoursTerm,
    overloadHours,
    advisingCount,
    thesisCount,
    alertsCreated,
  };
}

/**
 * Batch: rebuild snapshot tải giảng cho toàn bộ giảng viên active.
 */
export async function rebuildWorkloadBatch(
  academicYear: string,
  semesterCode: string,
): Promise<WorkloadBatchSummary> {
  const profiles = await prisma.facultyProfile.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  let succeeded = 0;
  const failed: { id: string; error: string }[] = [];

  for (const profile of profiles) {
    try {
      await rebuildWorkloadSnapshot(profile.id, academicYear, semesterCode);
      succeeded++;
    } catch (err: any) {
      failed.push({ id: profile.id, error: err.message ?? 'unknown' });
    }
  }

  return { total: profiles.length, succeeded, failed };
}

/**
 * Lấy danh sách cảnh báo tải giảng đang OPEN.
 * Phục vụ dashboard khoa/bộ môn và API GET /api/faculty/workload/alerts.
 */
export async function listOpenWorkloadAlerts(opts?: {
  unitId?: string;
  academicYear?: string;
  semesterCode?: string;
  page?: number;
  pageSize?: number;
}) {
  const { unitId, academicYear, semesterCode, page = 1, pageSize = 20 } = opts ?? {};

  const alerts = await prisma.facultyWorkloadAlert.findMany({
    where: {
      status: WorkloadAlertStatus.OPEN,
      snapshot: {
        ...(academicYear ? { academicYear } : {}),
        ...(semesterCode ? { semesterCode } : {}),
        facultyProfile: {
          ...(unitId ? { unitId } : {}),
        },
      },
    },
    include: {
      snapshot: {
        select: {
          academicYear: true,
          semesterCode: true,
          totalHoursWeekly: true,
          weeklyHoursLimit: true,
          facultyProfile: {
            select: {
              id: true,
              weeklyHoursLimit: true,
              user: { select: { name: true, militaryId: true } },
              unit: { select: { name: true, code: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const total = await prisma.facultyWorkloadAlert.count({
    where: {
      status: WorkloadAlertStatus.OPEN,
      snapshot: {
        ...(academicYear ? { academicYear } : {}),
        ...(semesterCode ? { semesterCode } : {}),
        facultyProfile: {
          ...(unitId ? { unitId } : {}),
        },
      },
    },
  });

  return { alerts, total, page, pageSize };
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/**
 * Chuyển semesterCode (HK1 | HK2 | HK3) về termNumber (1 | 2 | 3).
 * Fallback: trả 1 nếu không khớp.
 */
function semesterCodeToTermNumber(semesterCode: string): number {
  switch (semesterCode) {
    case 'HK1': return 1;
    case 'HK2': return 2;
    case 'HK3': return 3;
    default:    return 1;
  }
}
