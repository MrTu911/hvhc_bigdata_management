/**
 * M10 – UC-51: Hồ sơ người học toàn trình
 * GET  /api/education/students  – danh sách học viên
 * POST /api/education/students  – tạo hồ sơ học viên
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import {
  listStudents,
  createStudent,
  ServiceValidationError,
  ServiceConflictError,
  type ListStudentsParams,
  type UserScopeContext,
} from '@/lib/services/education/student-profile.service';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_STUDENT);
    if (!auth.allowed) return auth.response!;
    const { user, authResult } = auth;

    const { searchParams } = new URL(req.url);
    const params: ListStudentsParams = {
      page:                 Math.max(1, parseInt(searchParams.get('page') || '1')),
      limit:                Math.min(100, parseInt(searchParams.get('limit') || '20')),
      search:               searchParams.get('search') || undefined,
      studentType:          (searchParams.get('studentType') || undefined) as 'civil' | 'military' | undefined,
      currentStatus:        searchParams.get('currentStatus') || undefined,
      lop:                  searchParams.get('lop') || undefined,
      khoaHoc:              searchParams.get('khoaHoc') || undefined,
      nganh:                searchParams.get('nganh') || undefined,
      studyMode:            searchParams.get('studyMode') || undefined,
      trainingSystemUnitId: searchParams.get('trainingSystemUnitId') || undefined,
      battalionUnitId:      searchParams.get('battalionUnitId') || undefined,
      heDaoTao:             searchParams.get('heDaoTao') || undefined,
    };

    const scopeCtx: UserScopeContext = user
      ? { userId: user.id, unitId: user.unitId, scope: authResult?.scope ?? 'SELF' }
      : { userId: '' };

    const result = await listStudents(params, scopeCtx);

    const byStatus = result.statusGroups.reduce<Record<string, number>>((acc, g) => {
      acc[g.currentStatus] = g._count.id;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: result.students,
      meta: {
        total:      result.total,
        page:       params.page,
        limit:      params.limit,
        totalPages: Math.ceil(result.total / params.limit),
      },
      aggregateStats: { byStatus, lowGpaCount: result.lowGpaCount, warningCount: result.warningCount },
    });
  } catch (error: any) {
    console.error('GET /api/education/students error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.CREATE_STUDENT);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const body = await req.json();
    const hocVien = await createStudent(body);

    await logAudit({
      userId:       user!.id,
      functionCode: EDUCATION.CREATE_STUDENT,
      action:       'CREATE',
      resourceType: 'HOC_VIEN',
      resourceId:   hocVien.id,
      newValue:     { maHocVien: hocVien.maHocVien, hoTen: hocVien.hoTen },
      result:       'SUCCESS',
      ipAddress:    req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: hocVien }, { status: 201 });
  } catch (error: any) {
    if (error instanceof ServiceValidationError || error instanceof ServiceConflictError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('POST /api/education/students error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create student' }, { status: 500 });
  }
}
