/**
 * GET  /api/faculty/[id]/eis  – Lịch sử EIS và radar chart data cho một giảng viên
 * POST /api/faculty/[id]/eis  – Trigger tính EIS cho một giảng viên (single, cần EIS_MANAGE)
 *
 * [id] = FacultyProfile.id
 *
 * RBAC:
 *   GET  → FACULTY.EIS_VIEW
 *   POST → FACULTY.EIS_MANAGE (fail-closed: 403 nếu thiếu quyền)
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, requireScopedFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import {
  getEISHistory,
  buildRadarChartData,
  calculateAndSaveEIS,
} from '@/lib/services/faculty/faculty-eis.service';
import { logAudit } from '@/lib/audit';
import db from '@/lib/db';

type RouteParams = { params: { id: string } };

// ── GET: lịch sử EIS + radar chart data ──────────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireFunction(req, FACULTY.EIS_VIEW);
    if (!authResult.allowed) return authResult.response!;
    const user = authResult.user!;

    const facultyProfileId = params.id;
    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get('limit') ?? '6', 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 20) : 6;

    // Verify faculty exists
    const exists = await db.facultyProfile.findUnique({
      where: { id: facultyProfileId },
      select: { id: true, user: { select: { name: true } } },
    });
    if (!exists) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy hồ sơ giảng viên' },
        { status: 404 },
      );
    }

    const history = await getEISHistory(facultyProfileId, limit);

    // Latest record cho radar chart
    const latestRadar = history.length > 0 ? buildRadarChartData(history[0].dimensions) : null;

    // Statistics
    const scores = history.map((h) => h.totalEIS);
    const avgEIS =
      scores.length > 0
        ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
        : null;
    const maxEIS = scores.length > 0 ? Math.max(...scores) : null;
    const minEIS = scores.length > 0 ? Math.min(...scores) : null;

    await logAudit({
      userId: user.id,
      functionCode: FACULTY.EIS_VIEW,
      action: 'VIEW',
      resourceType: 'FACULTY_EIS',
      resourceId: facultyProfileId,
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      data: {
        facultyProfileId,
        facultyName: exists.user.name,
        history,
        latestRadarChart: latestRadar,
        statistics: { avgEIS, maxEIS, minEIS, totalRecords: history.length },
      },
    });
  } catch (error: any) {
    console.error('[M07] GET /faculty/[id]/eis error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST: trigger tính EIS single ────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    // fail-closed: 403 nếu thiếu EIS_MANAGE
    const authResult = await requireFunction(req, FACULTY.EIS_MANAGE);
    if (!authResult.allowed) return authResult.response!;
    const user = authResult.user!;

    const facultyProfileId = params.id;

    const body = await req.json().catch(() => ({}));
    const { academicYear, semesterCode } = body as {
      academicYear?: string;
      semesterCode?: string;
    };

    if (!academicYear || !semesterCode) {
      return NextResponse.json(
        { success: false, error: 'academicYear và semesterCode là bắt buộc' },
        { status: 400 },
      );
    }

    const { record, result } = await calculateAndSaveEIS(
      facultyProfileId,
      academicYear,
      semesterCode,
      user.id,
    );

    await logAudit({
      userId: user.id,
      functionCode: FACULTY.EIS_MANAGE,
      action: 'CREATE',
      resourceType: 'FACULTY_EIS',
      resourceId: record.id,
      newValue: { totalEIS: result.totalEIS, academicYear, semesterCode },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      data: {
        eisScoreId: record.id,
        facultyProfileId,
        academicYear,
        semesterCode,
        totalEIS: result.totalEIS,
        dimensions: result.dimensions,
        trend: result.trend,
      },
    });
  } catch (error: any) {
    console.error('[M07] POST /faculty/[id]/eis error:', error);
    const isNotFound = error.message?.includes('không tồn tại');
    return NextResponse.json(
      { success: false, error: isNotFound ? error.message : 'Internal server error' },
      { status: isNotFound ? 404 : 500 },
    );
  }
}
