/**
 * M10 – UC-57: Academic Warning Engine – recalculate
 * POST /api/education/warnings/recalculate
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { recalculateWarning } from '@/lib/services/education/academic-warning.service';

export const dynamic = 'force-dynamic';

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

    const result = await recalculateWarning({
      hocVienId,
      academicYear,
      semesterCode,
      resolvedBy: user!.id,
    });

    if ('error' in result && result.error === 'NOT_FOUND') {
      return NextResponse.json({ success: false, error: 'Không tìm thấy học viên' }, { status: 404 });
    }

    if (result.warningLevel === null) {
      return NextResponse.json({ success: true, data: result });
    }

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.MANAGE_WARNING,
      action: 'UPDATE',
      resourceType: 'ACADEMIC_WARNING',
      resourceId: result.warning.id,
      newValue: { warningLevel: result.warningLevel, gpa: result.gpa, failedCredits: result.failedCredits },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: result.warning });
  } catch (error: any) {
    console.error('POST /api/education/warnings/recalculate error:', error);
    return NextResponse.json({ success: false, error: 'Failed to recalculate warning' }, { status: 500 });
  }
}
