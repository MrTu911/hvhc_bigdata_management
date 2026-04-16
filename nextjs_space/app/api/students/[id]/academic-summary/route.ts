/**
 * GET /api/students/[id]/academic-summary
 * M07 – Tóm tắt tình trạng học tập tổng hợp của học viên
 *
 * [id] = HocVien.id
 *
 * Trả về: GPA hiện tại, cảnh báo học vụ còn mở, lịch sử GPA gần nhất (8 kỳ),
 *          tín chỉ tích lũy, trạng thái học lực.
 *
 * RBAC: STUDENT.GPA_VIEW
 * Scope: SELF hoặc UNIT/DEPARTMENT/ACADEMY
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { STUDENT } from '@/lib/rbac/function-codes';
import { canActorViewStudent } from '@/lib/services/student/student-scope.service';
import { getStudentAcademicSummary } from '@/lib/services/student/student-gpa.service';
import { logAudit } from '@/lib/audit';
import { FunctionScope, UserRole } from '@prisma/client';

type RouteParams = { params: { id: string } };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // ── 1. Auth ───────────────────────────────────────────────────────────────
    const { user, scope, response } = await requireScopedFunction(
      req,
      STUDENT.GPA_VIEW,
    );
    if (!user) return response!;

    const hocVienId = params.id;

    // ── 2. Scope check ────────────────────────────────────────────────────────
    if (scope === FunctionScope.SELF) {
      const allowed = await canActorViewStudent(
        user.id,
        user.role as UserRole,
        FunctionScope.SELF,
        hocVienId,
      );
      if (!allowed) {
        return NextResponse.json(
          { success: false, error: 'Không có quyền xem tóm tắt học tập của học viên này' },
          { status: 403 },
        );
      }
    }

    // ── 3. Lấy academic summary ───────────────────────────────────────────────
    const summary = await getStudentAcademicSummary(hocVienId);

    if (!summary) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy học viên' },
        { status: 404 },
      );
    }

    // ── 4. Audit ──────────────────────────────────────────────────────────────
    await logAudit({
      userId: user.id,
      functionCode: STUDENT.GPA_VIEW,
      action: 'VIEW',
      resourceType: 'STUDENT_ACADEMIC_SUMMARY',
      resourceId: hocVienId,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('[M07] GET /students/[id]/academic-summary error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
