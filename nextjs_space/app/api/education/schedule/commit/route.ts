/**
 * POST /api/education/schedule/commit
 *
 * M10 – UC-54: GHI lịch huấn luyện bán tự động cho một học kỳ (sinh `TrainingSession`).
 * Bỏ qua lớp xung đột & lớp đã có buổi trừ khi bật cờ tương ứng. Có audit log.
 *
 * Body: {
 *   termId: string, classSectionIds?: string[], sessionType?: SessionType,
 *   includeConflicting?: boolean, regenerate?: boolean
 * }
 * RBAC: CREATE_SCHEDULE (Ban Kế hoạch — scope ACADEMY).
 */

import { NextRequest, NextResponse } from 'next/server';

import { logAudit } from '@/lib/audit';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';
import { commitTermSchedule } from '@/lib/services/education/schedule-generator.service';

export const dynamic = 'force-dynamic';

const ALLOWED_SESSION_TYPES = ['THEORY', 'PRACTICE', 'LAB', 'SEMINAR', 'EXAM', 'REVIEW'];

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, EDUCATION.CREATE_SCHEDULE);
  if (!auth.allowed) return auth.response!;

  try {
    const body = await req.json().catch(() => ({}));
    const { termId, classSectionIds, sessionType, includeConflicting, regenerate } = body ?? {};

    if (!termId || typeof termId !== 'string') {
      return NextResponse.json({ success: false, data: null, error: 'Thiếu termId' }, { status: 400 });
    }
    if (classSectionIds !== undefined && !Array.isArray(classSectionIds)) {
      return NextResponse.json({ success: false, data: null, error: 'classSectionIds phải là mảng' }, { status: 400 });
    }
    if (sessionType !== undefined && !ALLOWED_SESSION_TYPES.includes(sessionType)) {
      return NextResponse.json({ success: false, data: null, error: 'sessionType không hợp lệ' }, { status: 400 });
    }

    const result = await commitTermSchedule({
      termId,
      classSectionIds,
      sessionType,
      includeConflicting: Boolean(includeConflicting),
      regenerate: Boolean(regenerate),
    });

    await logAudit({
      userId: auth.user!.id,
      functionCode: EDUCATION.CREATE_SCHEDULE,
      action: 'GENERATE_SCHEDULE',
      resourceType: 'TRAINING_SESSION',
      resourceId: termId,
      newValue: {
        createdSessions: result.createdSessions,
        affectedSections: result.affectedSections,
        skippedSections: result.skippedSections.length,
        includeConflicting: Boolean(includeConflicting),
        regenerate: Boolean(regenerate),
      },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      endpoint: '/api/education/schedule/commit',
      httpMethod: 'POST',
    });

    return NextResponse.json({ success: true, data: result, error: null }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi khi ghi lịch huấn luyện';
    const status = message.includes('Không tìm thấy học kỳ') ? 404 : 500;
    console.error('POST /api/education/schedule/commit error:', message);
    return NextResponse.json({ success: false, data: null, error: message }, { status });
  }
}
