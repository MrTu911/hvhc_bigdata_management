/**
 * M10 – UC-58: Điểm rèn luyện, khen thưởng, kỷ luật người học
 * GET  /api/education/students/[id]/conduct
 * POST /api/education/students/[id]/conduct
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { getItemByCode, getItemsByCategory } from '@/lib/master-data-cache';

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_CONDUCT);
    if (!auth.allowed) return auth.response!;

    const { id } = params;

    // Confirm student exists
    const hocVien = await prisma.hocVien.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, maHocVien: true, hoTen: true },
    });
    if (!hocVien) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy học viên' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const academicYear  = searchParams.get('academicYear');
    const semesterCode  = searchParams.get('semesterCode');

    const where: any = { hocVienId: id };
    if (academicYear) where.academicYear = academicYear;
    if (semesterCode) where.semesterCode = semesterCode;

    const records = await prisma.studentConductRecord.findMany({
      where,
      orderBy: [{ academicYear: 'desc' }, { semesterCode: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      data: {
        hocVien,
        records,
      },
    });
  } catch (error: any) {
    console.error('GET /api/education/students/[id]/conduct error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch conduct records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.MANAGE_CONDUCT);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const { id } = params;

    const hocVien = await prisma.hocVien.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!hocVien) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy học viên' }, { status: 404 });
    }

    const body = await req.json();
    const { academicYear, semesterCode, conductScore, conductGrade, rewardSummary, disciplineSummary } = body;

    if (!academicYear || !semesterCode || conductScore === undefined) {
      return NextResponse.json(
        { success: false, error: 'academicYear, semesterCode, conductScore là bắt buộc' },
        { status: 400 }
      );
    }

    if (conductScore < 0 || conductScore > 100) {
      return NextResponse.json(
        { success: false, error: 'conductScore phải từ 0 đến 100' },
        { status: 400 }
      );
    }

    // Validate conductGrade theo M19 lookup MD_CONDUCT_GRADE (nếu được cung cấp)
    if (conductGrade) {
      const validItem = await getItemByCode('MD_CONDUCT_GRADE', conductGrade);
      if (validItem === null) {
        // Chỉ từ chối nếu category MD_CONDUCT_GRADE tồn tại trong M19
        // (graceful degradation: nếu category chưa seed thì bỏ qua)
        const allItems = await getItemsByCategory('MD_CONDUCT_GRADE', true);
        if (allItems.length > 0) {
          const validCodes = allItems.map((i: any) => i.code).join(', ');
          return NextResponse.json(
            {
              success: false,
              error: `conductGrade '${conductGrade}' không hợp lệ. Giá trị cho phép: ${validCodes}`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Upsert – nếu đã có bản ghi cùng học viên + năm học + học kỳ thì update
    const record = await prisma.studentConductRecord.upsert({
      where: {
        hocVienId_academicYear_semesterCode: {
          hocVienId: id,
          academicYear,
          semesterCode,
        },
      },
      create: {
        hocVienId: id,
        academicYear,
        semesterCode,
        conductScore,
        conductGrade: conductGrade || null,
        rewardSummary: rewardSummary || null,
        disciplineSummary: disciplineSummary || null,
      },
      update: {
        conductScore,
        conductGrade: conductGrade ?? undefined,
        rewardSummary: rewardSummary ?? undefined,
        disciplineSummary: disciplineSummary ?? undefined,
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.MANAGE_CONDUCT,
      action: 'CREATE',
      resourceType: 'STUDENT_CONDUCT',
      resourceId: record.id,
      newValue: { hocVienId: id, academicYear, semesterCode, conductScore },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/education/students/[id]/conduct error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save conduct record' }, { status: 500 });
  }
}
