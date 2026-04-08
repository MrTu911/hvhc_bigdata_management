/**
 * GET /api/faculty/[id]/eis/explain
 * M07 – Giải thích chi tiết điểm EIS từng chiều cho một giảng viên.
 *
 * Query params (đều optional – nếu thiếu lấy kỳ gần nhất):
 *   academicYear  – VD: "2025-2026"
 *   semesterCode  – HK1 | HK2 | HK3
 *
 * [id] = FacultyProfile.id
 *
 * RBAC: FACULTY.EIS_VIEW
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { getEISExplanation } from '@/lib/services/faculty/faculty-eis-explain.service';

type RouteParams = { params: { id: string } };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireFunction(req, FACULTY.EIS_VIEW);
    if (!authResult.allowed) return authResult.response!;

    const { id: facultyProfileId } = params;
    const { searchParams } = new URL(req.url);
    const academicYear  = searchParams.get('academicYear')  ?? undefined;
    const semesterCode  = searchParams.get('semesterCode')  ?? undefined;

    const explanation = await getEISExplanation(facultyProfileId, academicYear, semesterCode);

    if (!explanation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Không tìm thấy bản ghi EIS. Hãy chạy tính EIS trước.',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: explanation });
  } catch (error: any) {
    console.error('[M07] GET /faculty/[id]/eis/explain error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
