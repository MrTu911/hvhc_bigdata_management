/**
 * GET /api/faculty/[id]/profile360
 * M07 – Hồ sơ giảng viên 360°
 *
 * [id] = FacultyProfile.id
 *
 * RBAC:
 *   - FACULTY.PROFILE360_VIEW bắt buộc
 *   - Scope: SELF chỉ xem hồ sơ của chính mình
 *             UNIT/DEPARTMENT/ACADEMY xem rộng hơn theo scope
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { buildFacultyProfile360 } from '@/lib/services/faculty/faculty-profile360.service';
import { logAudit } from '@/lib/audit';
import db from '@/lib/db';

type RouteParams = { params: { id: string } };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // ── 1. Auth ───────────────────────────────────────────────────────────────
    const { user, scope, response } = await requireScopedFunction(
      req,
      FACULTY.PROFILE360_VIEW,
    );
    if (!user) return response!;

    const facultyProfileId = params.id;

    // ── 2. Scope check ────────────────────────────────────────────────────────
    if (scope === 'SELF') {
      const profile = await db.facultyProfile.findUnique({
        where: { id: facultyProfileId },
        select: { userId: true },
      });
      if (!profile || profile.userId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Không có quyền xem hồ sơ này' },
          { status: 403 },
        );
      }
    }
    // UNIT/DEPARTMENT/ACADEMY: scope đã được kiểm soát ở requireScopedFunction

    // ── 3. Build 360° profile ─────────────────────────────────────────────────
    const profile360 = await buildFacultyProfile360(facultyProfileId);

    if (!profile360) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy hồ sơ giảng viên' },
        { status: 404 },
      );
    }

    // ── 4. Audit ──────────────────────────────────────────────────────────────
    await logAudit({
      userId: user.id,
      functionCode: FACULTY.PROFILE360_VIEW,
      action: 'VIEW',
      resourceType: 'FACULTY_PROFILE360',
      resourceId: facultyProfileId,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: profile360 });
  } catch (error: any) {
    console.error('[M07] GET /faculty/[id]/profile360 error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
