/**
 * POST /api/student/gpa/rebuild
 * M07 – Trigger rebuild GPA tích lũy và cảnh báo học vụ.
 *
 * Body:
 *   { academicYear: string, semesterCode: string }                → batch toàn bộ học viên ACTIVE
 *   { academicYear: string, semesterCode: string, hocVienId: string } → rebuild 1 học viên
 *
 * RBAC: STUDENT.GPA_MANAGE
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { STUDENT } from '@/lib/rbac/function-codes';
import {
  rebuildStudentGpa,
  rebuildGpaBatch,
} from '@/lib/services/student/student-gpa.service';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, STUDENT.GPA_MANAGE);
    if (!authResult.allowed) return authResult.response!;
    const user = authResult.user!;

    const body = await req.json().catch(() => ({}));
    const { academicYear, semesterCode, hocVienId } = body as {
      academicYear?: string;
      semesterCode?: string;
      hocVienId?: string;
    };

    if (!academicYear || !semesterCode) {
      return NextResponse.json(
        { success: false, error: 'academicYear và semesterCode là bắt buộc' },
        { status: 400 },
      );
    }
    if (!/^\d{4}-\d{4}$/.test(academicYear)) {
      return NextResponse.json(
        { success: false, error: 'academicYear phải theo định dạng YYYY-YYYY (VD: 2025-2026)' },
        { status: 400 },
      );
    }
    if (!['HK1', 'HK2', 'HK3'].includes(semesterCode)) {
      return NextResponse.json(
        { success: false, error: 'semesterCode phải là HK1, HK2 hoặc HK3' },
        { status: 400 },
      );
    }

    if (hocVienId) {
      // Single rebuild
      const result = await rebuildStudentGpa(hocVienId, academicYear, semesterCode);

      await logAudit({
        userId: user.id,
        functionCode: STUDENT.GPA_MANAGE,
        action: 'CREATE',
        resourceType: 'STUDENT_GPA_SNAPSHOT',
        resourceId: hocVienId,
        newValue: { academicYear, semesterCode, ...result },
        result: 'SUCCESS',
      });

      return NextResponse.json({ success: true, data: result });
    }

    // Batch rebuild
    const summary = await rebuildGpaBatch(academicYear, semesterCode);

    await logAudit({
      userId: user.id,
      functionCode: STUDENT.GPA_MANAGE,
      action: 'CREATE',
      resourceType: 'STUDENT_GPA_BATCH',
      newValue: { academicYear, semesterCode, ...summary },
      result: summary.failed.length === 0 ? 'SUCCESS' : 'PARTIAL',
    });

    return NextResponse.json({
      success: true,
      data: {
        academicYear,
        semesterCode,
        ...summary,
        failed: summary.failed.slice(0, 20),
      },
    });
  } catch (error: any) {
    console.error('[M07] POST /student/gpa/rebuild error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
