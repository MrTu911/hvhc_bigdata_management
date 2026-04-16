/**
 * GET /api/students/[id]/gpa-trend
 * M07 – Lịch sử GPA theo kỳ của học viên (trend chart data)
 *
 * [id] = HocVien.id
 *
 * Query params:
 *   limit  – số kỳ lấy về (mặc định 8, tối đa 20)
 *
 * RBAC: STUDENT.GPA_VIEW
 * Scope: SELF hoặc UNIT/DEPARTMENT/ACADEMY
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { STUDENT } from '@/lib/rbac/function-codes';
import { canActorViewStudent } from '@/lib/services/student/student-scope.service';
import { logAudit } from '@/lib/audit';
import { FunctionScope, UserRole } from '@prisma/client';
import db from '@/lib/db';

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
          { success: false, error: 'Không có quyền xem GPA học viên này' },
          { status: 403 },
        );
      }
    }

    // ── 3. Parse params ───────────────────────────────────────────────────────
    const { searchParams } = new URL(req.url);
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') ?? '8', 10)));

    // ── 4. Query GPA history ──────────────────────────────────────────────────
    const [hocVien, gpaHistories] = await Promise.all([
      db.hocVien.findUnique({
        where: { id: hocVienId, deletedAt: null },
        select: {
          id: true,
          maHocVien: true,
          hoTen: true,
          diemTrungBinh: true,
          academicStatus: true,
          tinChiTichLuy: true,
          tongTinChi: true,
        },
      }),
      db.studentGpaHistory.findMany({
        where: { hocVienId },
        orderBy: [{ academicYear: 'asc' }, { semesterCode: 'asc' }],
        take: limit,
        select: {
          academicYear: true,
          semesterCode: true,
          semesterGpa: true,
          cumulativeGpa: true,
          creditsEarned: true,
          totalCreditsAccumulated: true,
          academicStatus: true,
          builtAt: true,
        },
      }),
    ]);

    if (!hocVien) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy học viên' },
        { status: 404 },
      );
    }

    await logAudit({
      userId: user.id,
      functionCode: STUDENT.GPA_VIEW,
      action: 'VIEW',
      resourceType: 'STUDENT_GPA_TREND',
      resourceId: hocVienId,
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: hocVien.id,
          maHocVien: hocVien.maHocVien,
          hoTen: hocVien.hoTen,
          cumulativeGpa: hocVien.diemTrungBinh,
          academicStatus: hocVien.academicStatus,
          creditsAccumulated: hocVien.tinChiTichLuy ?? 0,
          totalProgramCredits: hocVien.tongTinChi ?? 0,
        },
        trend: gpaHistories,
      },
    });
  } catch (error: any) {
    console.error('[M07] GET /students/[id]/gpa-trend error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
