/**
 * POST /api/students/gpa/rebuild
 * M07 – Trigger rebuild GPA (batch hoặc single học viên)
 *
 * Body (JSON):
 *   academicYear   – bắt buộc, VD: "2025-2026"
 *   semesterCode   – bắt buộc, "HK1" | "HK2" | "HK3"
 *   hocVienId      – optional; nếu có → rebuild 1 HV; nếu bỏ → rebuild toàn bộ HV trong kỳ
 *
 * RBAC: STUDENT.GPA_MANAGE (fail-closed – không có function code → 403 ngay)
 *
 * Lưu ý: batch rebuild chạy tuần tự để tránh DB contention.
 *        Với production scale lớn, nên chuyển sang queue/job.
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
    // ── 1. Auth – fail-closed ─────────────────────────────────────────────────
    const authResult = await requireFunction(req, STUDENT.GPA_MANAGE);
    if (!authResult.allowed) return authResult.response!;
    const user = authResult.user!;

    // ── 2. Validate body ──────────────────────────────────────────────────────
    let body: { academicYear?: string; semesterCode?: string; hocVienId?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Request body không hợp lệ' },
        { status: 400 },
      );
    }

    const { academicYear, semesterCode, hocVienId } = body;

    if (!academicYear || typeof academicYear !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Thiếu academicYear (VD: "2025-2026")' },
        { status: 400 },
      );
    }
    if (!semesterCode || !['HK1', 'HK2', 'HK3'].includes(semesterCode)) {
      return NextResponse.json(
        { success: false, error: 'semesterCode phải là "HK1", "HK2" hoặc "HK3"' },
        { status: 400 },
      );
    }

    // ── 3. Rebuild ────────────────────────────────────────────────────────────
    if (hocVienId) {
      // Single rebuild
      const result = await rebuildStudentGpa(hocVienId, academicYear, semesterCode);

      await logAudit({
        userId: user.id,
        functionCode: STUDENT.GPA_MANAGE,
        action: 'RECALCULATE',
        resourceType: 'STUDENT_GPA',
        resourceId: hocVienId,
        result: 'SUCCESS',
      });

      return NextResponse.json({
        success: true,
        data: { mode: 'single', result },
      });
    } else {
      // Batch rebuild
      const batchResult = await rebuildGpaBatch(academicYear, semesterCode);

      await logAudit({
        userId: user.id,
        functionCode: STUDENT.GPA_MANAGE,
        action: 'RECALCULATE_BATCH',
        resourceType: 'STUDENT_GPA',
        result: batchResult.failed.length === 0 ? 'SUCCESS' : 'PARTIAL',
      });

      return NextResponse.json({
        success: true,
        data: { mode: 'batch', ...batchResult },
      });
    }
  } catch (error: any) {
    console.error('[M07] POST /students/gpa/rebuild error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
