/**
 * M10 – UC-54: Conflict Check Service
 * Phát hiện xung đột lịch học cho lớp học phần.
 *
 * Ba loại conflict:
 * 1. FACULTY_CONFLICT   – giảng viên bị trùng giờ trong cùng học kỳ
 * 2. ROOM_CONFLICT      – phòng bị trùng giờ trong cùng học kỳ
 * 3. TIME_OVERLAP       – cùng lớp học phần có giờ chồng chéo (tự kiểm)
 *
 * TODO (Phase sau): cache danh sách lớp học phần theo termId trong Redis
 * để tránh query DB mỗi lần check khi xếp lịch hàng loạt.
 */

import { prisma } from '@/lib/db';

export interface ConflictCheckInput {
  termId: string;
  dayOfWeek: number;       // 1=Thứ 2 ... 7=Thứ 7, 0=Chủ nhật
  startPeriod: number;     // tiết bắt đầu (1–10)
  endPeriod: number;       // tiết kết thúc (1–10)
  facultyId?: string | null;
  roomId?: string | null;
  excludeSectionId?: string; // bỏ qua khi update lớp đang sửa
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: ConflictItem[];
}

export interface ConflictItem {
  type: 'FACULTY_CONFLICT' | 'ROOM_CONFLICT';
  severity: 'ERROR';
  message: string;
  conflictingSectionId: string;
  conflictingSectionCode: string;
  conflictingDayOfWeek: number;
  conflictingStartPeriod: number;
  conflictingEndPeriod: number;
}

/**
 * Kiểm tra xung đột lịch cho 1 lớp học phần sắp tạo hoặc cập nhật.
 * Query dựa vào composite indexes: (termId, dayOfWeek, startPeriod, endPeriod),
 * (termId, roomId), (termId, facultyId).
 */
export async function checkConflicts(input: ConflictCheckInput): Promise<ConflictResult> {
  const { termId, dayOfWeek, startPeriod, endPeriod, facultyId, roomId, excludeSectionId } = input;

  if (startPeriod > endPeriod) {
    return {
      hasConflict: true,
      conflicts: [{
        type: 'FACULTY_CONFLICT', // reuse type for input error
        severity: 'ERROR',
        message: 'startPeriod phải nhỏ hơn hoặc bằng endPeriod',
        conflictingSectionId: '',
        conflictingSectionCode: '',
        conflictingDayOfWeek: dayOfWeek,
        conflictingStartPeriod: startPeriod,
        conflictingEndPeriod: endPeriod,
      }],
    };
  }

  // Base filter: cùng học kỳ, cùng ngày, giờ chồng chéo, đang hoạt động
  const timeOverlapWhere = {
    termId,
    isActive: true,
    dayOfWeek,
    // overlap: NOT (endPeriod < startPeriod OR startPeriod > endPeriod)
    // → startPeriod <= input.endPeriod AND endPeriod >= input.startPeriod
    startPeriod: { lte: endPeriod },
    endPeriod:   { gte: startPeriod },
    ...(excludeSectionId ? { id: { not: excludeSectionId } } : {}),
  };

  const conflicts: ConflictItem[] = [];

  // 1. Kiểm tra trùng giảng viên
  if (facultyId) {
    const facultyConflicts = await prisma.classSection.findMany({
      where: { ...timeOverlapWhere, facultyId },
      select: {
        id: true, code: true, dayOfWeek: true, startPeriod: true, endPeriod: true,
        faculty: { select: { user: { select: { name: true } } } },
      },
    });

    for (const s of facultyConflicts) {
      conflicts.push({
        type: 'FACULTY_CONFLICT',
        severity: 'ERROR',
        message: `Giảng viên đã có lớp "${s.code}" vào tiết ${s.startPeriod}–${s.endPeriod} trong cùng học kỳ và ngày này`,
        conflictingSectionId: s.id,
        conflictingSectionCode: s.code,
        conflictingDayOfWeek: s.dayOfWeek ?? dayOfWeek,
        conflictingStartPeriod: s.startPeriod ?? startPeriod,
        conflictingEndPeriod: s.endPeriod ?? endPeriod,
      });
    }
  }

  // 2. Kiểm tra trùng phòng
  if (roomId) {
    const roomConflicts = await prisma.classSection.findMany({
      where: { ...timeOverlapWhere, roomId },
      select: {
        id: true, code: true, dayOfWeek: true, startPeriod: true, endPeriod: true,
        room: { select: { code: true, name: true } },
      },
    });

    for (const s of roomConflicts) {
      conflicts.push({
        type: 'ROOM_CONFLICT',
        severity: 'ERROR',
        message: `Phòng "${s.room?.name ?? roomId}" đã được dùng bởi lớp "${s.code}" vào tiết ${s.startPeriod}–${s.endPeriod}`,
        conflictingSectionId: s.id,
        conflictingSectionCode: s.code,
        conflictingDayOfWeek: s.dayOfWeek ?? dayOfWeek,
        conflictingStartPeriod: s.startPeriod ?? startPeriod,
        conflictingEndPeriod: s.endPeriod ?? endPeriod,
      });
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}
