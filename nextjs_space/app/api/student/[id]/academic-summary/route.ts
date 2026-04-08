/**
 * GET /api/student/[id]/academic-summary
 * M07 – Tóm tắt học lực học viên: GPA tích lũy, lịch sử GPA, cảnh báo học vụ.
 *
 * Path param: id = HocVien.id
 *
 * RBAC: STUDENT.GPA_VIEW
 * Scope: quản trị đào tạo thấy tất cả; cố vấn học tập chỉ thấy HV trong phạm vi cố vấn;
 *        học viên chỉ thấy của mình (kiểm tra userId = HocVien.userId).
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { STUDENT } from '@/lib/rbac/function-codes';
import { getStudentAcademicSummary } from '@/lib/services/student/student-gpa.service';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireFunction(req, STUDENT.GPA_VIEW);
    if (!authResult.allowed) return authResult.response!;

    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'id là bắt buộc' }, { status: 400 });
    }

    const summary = await getStudentAcademicSummary(id);
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
