/**
 * M18 Template API – E4: POST /api/templates/schedules/run
 * Trigger thủ công lịch xuất định kỳ (hoặc kiểm tra và chạy tất cả due schedules).
 *
 * POST body:
 *   { scheduleId?: string }   – nếu có, chạy schedule cụ thể
 *                               nếu không, chạy tất cả due schedules
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { executeSchedule, runDueSchedules } from '@/lib/services/schedule-executor';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.MANAGE_SCHEDULES);
    if (!user) return response!;

    const body = await request.json().catch(() => ({}));
    const { scheduleId } = body as { scheduleId?: string };

    if (scheduleId) {
      // Run specific schedule
      const result = await executeSchedule(scheduleId);

      await logAudit({
        userId: user.id,
        functionCode: TEMPLATES.MANAGE_SCHEDULES,
        action: 'EXECUTE',
        resourceType: 'TEMPLATE_SCHEDULE',
        resourceId: scheduleId,
        result: result.success ? 'SUCCESS' : 'FAIL',
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
      });

      return NextResponse.json({
        success: result.success,
        data: {
          jobId: result.jobId,
          entityCount: result.entityCount,
          error: result.error,
        },
      }, { status: result.success ? 200 : 422 });
    } else {
      // Run all due schedules
      const result = await runDueSchedules();

      await logAudit({
        userId: user.id,
        functionCode: TEMPLATES.MANAGE_SCHEDULES,
        action: 'EXECUTE',
        resourceType: 'TEMPLATE_SCHEDULE',
        resourceId: 'ALL_DUE',
        result: 'SUCCESS',
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
      });

      return NextResponse.json({
        success: true,
        data: {
          ran: result.ran,
          errors: result.errors,
          details: result.details,
        },
      });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi thực thi lịch xuất';
    console.error('[POST /api/templates/schedules/run]', error);
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
