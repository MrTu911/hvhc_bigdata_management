/**
 * Grade Service – M10 UC-56
 *
 * Tách business logic điểm học phần ra khỏi route.
 * CRITICAL: Mọi sửa điểm PHẢI ghi ScoreHistory trong cùng transaction.
 */

import { prisma } from '@/lib/db';
import { ClassEnrollment } from '@prisma/client';

export type ScorePayload = {
  attendanceScore?: number | null;
  assignmentScore?: number | null;
  midtermScore?: number | null;
  finalScore?: number | null;
  totalScore?: number | null;
  passFlag?: boolean | null;
  letterGrade?: string | null;
  gradeStatus?: string | null;
  notes?: string | null;
  reason?: string | null;
};

export type GradeUpdateResult =
  | { success: true; data: ClassEnrollment }
  | { success: false; error: string; status: 400 | 404 | 409 };

const SCORE_FIELDS = ['attendanceScore', 'assignmentScore', 'midtermScore', 'finalScore', 'totalScore'] as const;

/**
 * Validate các trường điểm: phải là số >= 0.
 * Trả về tên field lỗi đầu tiên, hoặc null nếu hợp lệ.
 */
export function validateScorePayload(payload: ScorePayload): string | null {
  for (const field of SCORE_FIELDS) {
    const val = payload[field];
    if (val !== undefined && val !== null && (typeof val !== 'number' || val < 0)) {
      return `${field} phải là số >= 0`;
    }
  }
  return null;
}

/**
 * Xây dựng updateData từ payload (chỉ các field được cung cấp).
 * Tự động set gradedBy/gradedAt/gradeStatus khi có thay đổi điểm.
 */
function buildUpdateData(
  payload: ScorePayload,
  userId: string
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if (payload.attendanceScore !== undefined) data.attendanceScore = payload.attendanceScore;
  if (payload.assignmentScore  !== undefined) data.assignmentScore  = payload.assignmentScore;
  if (payload.midtermScore     !== undefined) data.midtermScore     = payload.midtermScore;
  if (payload.finalScore       !== undefined) data.finalScore       = payload.finalScore;
  if (payload.totalScore       !== undefined) data.totalScore       = payload.totalScore;
  if (payload.passFlag         !== undefined) data.passFlag         = payload.passFlag;
  if (payload.letterGrade      !== undefined) data.letterGrade      = payload.letterGrade;
  if (payload.gradeStatus      !== undefined) data.gradeStatus      = payload.gradeStatus;
  if (payload.notes            !== undefined) data.notes            = payload.notes;

  const hasScoreChange = SCORE_FIELDS.some(f => payload[f] !== undefined);
  if (hasScoreChange) {
    data.gradedBy = userId;
    data.gradedAt = new Date();
    if (!payload.gradeStatus || payload.gradeStatus === 'PENDING') {
      data.gradeStatus = 'GRADED';
    }
  }

  return data;
}

/**
 * Cập nhật điểm học phần với ScoreHistory bắt buộc trong atomic transaction.
 *
 * Rules:
 * - Không cho sửa nếu gradeStatus === 'FINALIZED'
 * - ScoreHistory luôn được tạo (không thể bypass)
 * - gradedBy/gradedAt tự động set khi có thay đổi điểm
 */
export async function updateGradeWithHistory(
  enrollmentId: string,
  payload: ScorePayload,
  userId: string
): Promise<GradeUpdateResult> {
  const existing = await prisma.classEnrollment.findUnique({ where: { id: enrollmentId } });
  if (!existing) {
    return { success: false, error: 'Không tìm thấy enrollment', status: 404 };
  }
  if (existing.gradeStatus === 'FINALIZED') {
    return { success: false, error: 'Không thể sửa điểm đã FINALIZED', status: 400 };
  }

  const updateData = buildUpdateData(payload, userId);
  if (Object.keys(updateData).length === 0) {
    return { success: false, error: 'Không có field nào được cập nhật', status: 400 };
  }

  const oldValues = {
    attendanceScore: existing.attendanceScore,
    assignmentScore: existing.assignmentScore,
    midtermScore:    existing.midtermScore,
    finalScore:      existing.finalScore,
    totalScore:      existing.totalScore,
    passFlag:        existing.passFlag,
    letterGrade:     existing.letterGrade,
    gradeStatus:     existing.gradeStatus,
  };
  const newValues = { ...oldValues, ...updateData };

  // MANDATORY: atomic transaction — update + ScoreHistory không được tách rời
  const [updated] = await prisma.$transaction([
    prisma.classEnrollment.update({ where: { id: enrollmentId }, data: updateData }),
    prisma.scoreHistory.create({
      data: {
        enrollmentId,
        changedBy: userId,
        oldValues,
        newValues,
        reason: payload.reason ?? null,
      },
    }),
  ]);

  return { success: true, data: updated };
}
