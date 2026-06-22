/**
 * M10 – UC-54: Schedule Generator Service (xếp lịch huấn luyện BÁN TỰ ĐỘNG)
 *
 * Sinh hàng loạt `TrainingSession` từ MẪU lớp học phần (`ClassSection`) theo học kỳ:
 *   - Mỗi lớp có khung lặp tuần (dayOfWeek + startPeriod..endPeriod + startDate..endDate).
 *   - Generator vật chất hóa khung đó thành các buổi học theo tuần trong phạm vi học kỳ.
 *   - Tự kiểm xung đột phòng/giảng viên/thời gian (dùng lại `conflict-check.service`).
 *
 * Luồng 2 bước (preview → commit) để Ban Kế hoạch DUYỆT trước khi ghi:
 *   1. previewTermSchedule(): tính kế hoạch + xung đột, KHÔNG ghi DB.
 *   2. commitTermSchedule(): ghi `TrainingSession` cho các lớp sạch (bỏ lớp xung đột,
 *      bỏ lớp đã có buổi — trừ khi bật cờ tương ứng).
 *
 * KHÔNG phải bộ giải ràng buộc toàn tự động: máy đề xuất + cảnh báo, người xếp quyết định.
 */

import type { SessionType } from '@prisma/client';

import { prisma } from '@/lib/db';

import { checkConflicts, type ConflictItem } from './conflict-check.service';

/**
 * Khung tiết chuẩn HVHC (giờ bắt đầu/kết thúc theo tiết). Dùng để suy ra startTime/
 * endTime cho buổi học từ startPeriod/endPeriod của lớp học phần.
 * TODO (phase sau): đưa vào M19 master data nếu khung tiết khác nhau theo hệ đào tạo.
 */
const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '07:00', end: '07:45' },
  2: { start: '07:50', end: '08:35' },
  3: { start: '08:45', end: '09:30' },
  4: { start: '09:40', end: '10:25' },
  5: { start: '10:30', end: '11:15' },
  6: { start: '13:30', end: '14:15' },
  7: { start: '14:20', end: '15:05' },
  8: { start: '15:15', end: '16:00' },
  9: { start: '16:10', end: '16:55' },
  10: { start: '17:00', end: '17:45' },
};

// Trần an toàn số buổi/lớp để tránh sinh tràn khi dữ liệu ngày lỗi.
const MAX_SESSIONS_PER_SECTION = 60;

export interface GenerateScheduleOptions {
  termId: string;
  /** null/empty = toàn bộ lớp học phần active trong học kỳ */
  classSectionIds?: string[];
  sessionType?: SessionType;
  /** true = vẫn sinh cho lớp có xung đột (mặc định false: bỏ qua lớp xung đột) */
  includeConflicting?: boolean;
  /** true = xóa buổi SCHEDULED cũ rồi sinh lại; mặc định false: bỏ qua lớp đã có buổi */
  regenerate?: boolean;
}

export interface SectionSchedulePlan {
  classSectionId: string;
  sectionCode: string;
  sectionName: string;
  dayOfWeek: number | null;
  startPeriod: number | null;
  endPeriod: number | null;
  startTime: string | null;
  endTime: string | null;
  roomName: string | null;
  facultyName: string | null;
  plannedCount: number;
  existingCount: number;
  sessionDates: string[];
  conflicts: ConflictItem[];
  /** lý do lớp bị bỏ qua khi commit (nếu có) */
  skipReason?: 'NO_PATTERN' | 'HAS_CONFLICT' | 'ALREADY_GENERATED';
}

export interface SchedulePreview {
  termId: string;
  termCode: string;
  termName: string;
  totalSections: number;
  schedulableSections: number;
  totalPlannedSessions: number;
  totalConflicts: number;
  sections: SectionSchedulePlan[];
}

export interface CommitResult {
  termId: string;
  createdSessions: number;
  affectedSections: number;
  skippedSections: Array<{ classSectionId: string; sectionCode: string; reason: string }>;
}

/**
 * Quy ước dayOfWeek (theo conflict-check.service): 0=Chủ nhật, 1=Thứ 2 … 6=Thứ 7.
 * Chấp nhận 7 như alias của Thứ 7. Trả về JS getDay() tương ứng.
 */
function toJsDay(dayOfWeek: number): number {
  if (dayOfWeek >= 1 && dayOfWeek <= 6) return dayOfWeek;
  if (dayOfWeek === 7) return 6;
  return 0;
}

/** Sinh danh sách ngày lặp hằng tuần trùng dayOfWeek trong [from, to]. */
function buildWeeklyDates(dayOfWeek: number, from: Date, to: Date): Date[] {
  const target = toJsDay(dayOfWeek);
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);

  // Nhảy tới lần xuất hiện đầu tiên của dayOfWeek
  let guard = 0;
  while (cursor.getDay() !== target && guard < 7) {
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }

  const dates: Date[] = [];
  while (cursor <= to && dates.length < MAX_SESSIONS_PER_SECTION) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return dates;
}

function resolveTimes(startPeriod: number | null, endPeriod: number | null): { start: string | null; end: string | null } {
  const start = startPeriod ? PERIOD_TIMES[startPeriod]?.start ?? null : null;
  const end = endPeriod ? PERIOD_TIMES[endPeriod]?.end ?? null : null;
  return { start, end };
}

/**
 * Tính kế hoạch xếp lịch cho học kỳ + danh sách xung đột. KHÔNG ghi DB.
 */
export async function previewTermSchedule(opts: GenerateScheduleOptions): Promise<SchedulePreview> {
  const { termId, classSectionIds } = opts;

  const term = await prisma.term.findUnique({ where: { id: termId } });
  if (!term) {
    throw new Error('Không tìm thấy học kỳ');
  }

  const sections = await prisma.classSection.findMany({
    where: {
      termId,
      isActive: true,
      ...(classSectionIds && classSectionIds.length > 0 ? { id: { in: classSectionIds } } : {}),
    },
    select: {
      id: true, code: true, name: true,
      dayOfWeek: true, startPeriod: true, endPeriod: true,
      startDate: true, endDate: true, facultyId: true, roomId: true,
      room: { select: { name: true } },
      faculty: { select: { user: { select: { name: true } } } },
      _count: { select: { sessions: true } },
    },
    orderBy: { code: 'asc' },
  });

  const plans: SectionSchedulePlan[] = [];

  for (const s of sections) {
    const { start, end } = resolveTimes(s.startPeriod, s.endPeriod);
    const base: SectionSchedulePlan = {
      classSectionId: s.id,
      sectionCode: s.code,
      sectionName: s.name,
      dayOfWeek: s.dayOfWeek,
      startPeriod: s.startPeriod,
      endPeriod: s.endPeriod,
      startTime: start,
      endTime: end,
      roomName: s.room?.name ?? null,
      facultyName: s.faculty?.user?.name ?? null,
      plannedCount: 0,
      existingCount: s._count.sessions,
      sessionDates: [],
      conflicts: [],
    };

    // Lớp thiếu khung lặp (dayOfWeek/period) → không xếp tự động được
    if (s.dayOfWeek === null || s.startPeriod === null || s.endPeriod === null) {
      base.skipReason = 'NO_PATTERN';
      plans.push(base);
      continue;
    }

    const from = s.startDate ?? term.startDate;
    const to = s.endDate ?? term.endDate;
    const dates = buildWeeklyDates(s.dayOfWeek, from, to);
    base.sessionDates = dates.map((d) => d.toISOString().slice(0, 10));
    base.plannedCount = dates.length;

    // Tái dùng conflict-check: phát hiện trùng phòng/giảng viên với LỚP KHÁC trong kỳ
    const conflict = await checkConflicts({
      termId,
      dayOfWeek: s.dayOfWeek,
      startPeriod: s.startPeriod,
      endPeriod: s.endPeriod,
      facultyId: s.facultyId,
      roomId: s.roomId,
      excludeSectionId: s.id,
    });
    base.conflicts = conflict.conflicts;

    if (conflict.hasConflict) base.skipReason = 'HAS_CONFLICT';
    else if (s._count.sessions > 0) base.skipReason = 'ALREADY_GENERATED';

    plans.push(base);
  }

  const schedulable = plans.filter((p) => !p.skipReason && p.plannedCount > 0);

  return {
    termId,
    termCode: term.code,
    termName: term.name,
    totalSections: plans.length,
    schedulableSections: schedulable.length,
    totalPlannedSessions: schedulable.reduce((sum, p) => sum + p.plannedCount, 0),
    totalConflicts: plans.reduce((sum, p) => sum + p.conflicts.length, 0),
    sections: plans,
  };
}

/**
 * Ghi `TrainingSession` cho các lớp đủ điều kiện. Mặc định bỏ lớp xung đột & lớp đã
 * có buổi; bật cờ `includeConflicting`/`regenerate` để ghi đè hành vi.
 */
export async function commitTermSchedule(opts: GenerateScheduleOptions): Promise<CommitResult> {
  const preview = await previewTermSchedule(opts);
  const sessionType = opts.sessionType ?? 'THEORY';

  const skipped: CommitResult['skippedSections'] = [];
  let createdSessions = 0;
  let affectedSections = 0;

  for (const plan of preview.sections) {
    // Lớp không có khung lặp → luôn bỏ
    if (plan.skipReason === 'NO_PATTERN' || plan.plannedCount === 0) {
      skipped.push({ classSectionId: plan.classSectionId, sectionCode: plan.sectionCode, reason: 'Thiếu khung lịch (thứ/tiết)' });
      continue;
    }
    // Xung đột → bỏ trừ khi cho phép
    if (plan.conflicts.length > 0 && !opts.includeConflicting) {
      skipped.push({ classSectionId: plan.classSectionId, sectionCode: plan.sectionCode, reason: 'Có xung đột phòng/giảng viên' });
      continue;
    }
    // Đã có buổi → bỏ trừ khi regenerate
    if (plan.existingCount > 0 && !opts.regenerate) {
      skipped.push({ classSectionId: plan.classSectionId, sectionCode: plan.sectionCode, reason: 'Lớp đã có buổi học' });
      continue;
    }

    const section = await prisma.classSection.findUnique({
      where: { id: plan.classSectionId },
      select: { facultyId: true, roomId: true },
    });
    if (!section) continue;

    await prisma.$transaction(async (tx) => {
      if (opts.regenerate && plan.existingCount > 0) {
        // Chỉ xóa buổi SCHEDULED chưa điểm danh; giữ buổi COMPLETED/đã có điểm danh
        await tx.trainingSession.deleteMany({
          where: { classSectionId: plan.classSectionId, status: 'SCHEDULED', attendances: { none: {} } },
        });
      }

      const rows = plan.sessionDates.map((dateStr, idx) => ({
        classSectionId: plan.classSectionId,
        termId: opts.termId,
        sessionNumber: idx + 1,
        sessionDate: new Date(dateStr),
        startTime: plan.startTime,
        endTime: plan.endTime,
        sessionType,
        roomId: section.roomId,
        facultyId: section.facultyId,
        status: 'SCHEDULED' as const,
      }));

      const result = await tx.trainingSession.createMany({ data: rows });
      createdSessions += result.count;
    });

    affectedSections += 1;
  }

  return {
    termId: opts.termId,
    createdSessions,
    affectedSections,
    skippedSections: skipped,
  };
}
