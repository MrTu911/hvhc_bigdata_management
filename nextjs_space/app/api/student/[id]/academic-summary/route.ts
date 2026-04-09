/**
 * @deprecated Dùng /api/education/students/[id]/profile360 thay thế (M10 backbone).
 * Route này sẽ bị tắt vào 2026-10-01. Không mở rộng thêm.
 */

/**
 * GET /api/student/[id]/academic-summary
 * M07 – Tóm tắt học lực học viên: GPA tích lũy, lịch sử GPA, cảnh báo học vụ.
 *
 * Path param: id = HocVien.id
 *
 * RBAC: STUDENT.GPA_VIEW (function code)
 * Scope enforcement (service layer – không chỉ ở UI):
 *   ACADEMY    → xem tất cả
 *   DEPARTMENT → xem HV trong đơn vị/khoa phụ trách
 *   UNIT       → xem HV trong đơn vị nhỏ hơn
 *   SELF       → giảng viên: chỉ HV cố vấn/lớp dạy; học viên: chỉ của mình
 *
 * Fail-closed: nếu scope không cho xem, trả 403 (không phải 404) để tránh enumeration.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction, getScopeFromAuthResult } from '@/lib/rbac/middleware';
import { STUDENT } from '@/lib/rbac/function-codes';
import { UserRole } from '@prisma/client';
import { getStudentAcademicSummary } from '@/lib/services/student/student-gpa.service';
import { canActorViewStudent } from '@/lib/services/student/student-scope.service';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireScopedFunction(req, STUDENT.GPA_VIEW);
    if (!authResult.allowed) return authResult.response!;

    const user  = authResult.user!;
    const scope = authResult.scope!;
    const { id: hocVienId } = params;

    if (!hocVienId) {
      return NextResponse.json({ success: false, error: 'id là bắt buộc' }, { status: 400 });
    }

    // ── Scope check trước khi load data (fail-closed) ──────────────────────
    const allowed = await canActorViewStudent(
      user.id,
      user.role as UserRole,
      scope,
      hocVienId,
    );

    if (!allowed) {
      // Trả 403 thay vì 404 để không lộ sự tồn tại của HV với actor không có quyền
      return NextResponse.json(
        { success: false, error: 'Không có quyền xem hồ sơ học viên này' },
        { status: 403 },
      );
    }

    // ── Load summary ────────────────────────────────────────────────────────
    const summary = await getStudentAcademicSummary(hocVienId);
    if (!summary) {
      return NextResponse.json(
        { success: false, error: 'Học viên không tồn tại' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('[M07] GET /student/[id]/academic-summary error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
