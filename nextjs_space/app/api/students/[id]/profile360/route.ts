/**
 * GET /api/students/[id]/profile360
 * M07 – Hồ sơ học viên 360°
 *
 * [id] = HocVien.id
 *
 * RBAC:
 *   - STUDENT.PROFILE360_VIEW bắt buộc
 *   - Scope SELF: học viên chỉ xem hồ sơ của chính mình;
 *                 giảng viên SELF chỉ xem HV do mình cố vấn hoặc trong lớp mình dạy
 *   - UNIT/DEPARTMENT/ACADEMY: mở rộng theo scope đã cấp
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { STUDENT } from '@/lib/rbac/function-codes';
import { buildStudentProfile360 } from '@/lib/services/student/student-profile360.service';
import { canActorViewStudent } from '@/lib/services/student/student-scope.service';
import { logAudit } from '@/lib/audit';
import { FunctionScope, UserRole } from '@prisma/client';

type RouteParams = { params: { id: string } };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // ── 1. Auth ───────────────────────────────────────────────────────────────
    const { user, scope, response } = await requireScopedFunction(
      req,
      STUDENT.PROFILE360_VIEW,
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
          { success: false, error: 'Không có quyền xem hồ sơ học viên này' },
          { status: 403 },
        );
      }
    }
    // UNIT/DEPARTMENT/ACADEMY: requireScopedFunction đã đảm bảo scope hợp lệ

    // ── 3. Build 360° profile ─────────────────────────────────────────────────
    const profile360 = await buildStudentProfile360(hocVienId);

    if (!profile360) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy hồ sơ học viên' },
        { status: 404 },
      );
    }

    // ── 4. Audit ──────────────────────────────────────────────────────────────
    await logAudit({
      userId: user.id,
      functionCode: STUDENT.PROFILE360_VIEW,
      action: 'VIEW',
      resourceType: 'STUDENT_PROFILE360',
      resourceId: hocVienId,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: profile360 });
  } catch (error: any) {
    console.error('[M07] GET /students/[id]/profile360 error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
