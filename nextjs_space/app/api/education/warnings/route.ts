/**
 * M10 – UC-57: Cảnh báo học vụ
 * GET  /api/education/warnings  – danh sách cảnh báo
 * POST /api/education/warnings  – tạo/upsert cảnh báo thủ công
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_WARNING);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const hocVienId   = searchParams.get('hocVienId');
    const academicYear = searchParams.get('academicYear');
    const semesterCode = searchParams.get('semesterCode');
    const warningLevel = searchParams.get('warningLevel');
    const isResolved  = searchParams.get('isResolved');
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));

    const where: any = {};
    if (hocVienId)   where.hocVienId   = hocVienId;
    if (academicYear) where.academicYear = academicYear;
    if (semesterCode) where.semesterCode = semesterCode;
    if (warningLevel) where.warningLevel = warningLevel;
    if (isResolved !== null && isResolved !== undefined) {
      where.isResolved = isResolved === 'true';
    }

    const [data, total] = await Promise.all([
      prisma.academicWarning.findMany({
        where,
        include: {
          hocVien: {
            select: { id: true, maHocVien: true, hoTen: true, lop: true },
          },
        },
        orderBy: [
          { warningLevel: 'desc' },
          { generatedAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.academicWarning.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('GET /api/education/warnings error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch warnings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.MANAGE_WARNING);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const body = await req.json();
    const {
      hocVienId, academicYear, semesterCode,
      warningLevel, warningReasonJson, suggestedAction,
    } = body;

    if (!hocVienId || !academicYear || !semesterCode || !warningLevel) {
      return NextResponse.json(
        { success: false, error: 'hocVienId, academicYear, semesterCode, warningLevel là bắt buộc' },
        { status: 400 }
      );
    }

    const validLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validLevels.includes(warningLevel)) {
      return NextResponse.json(
        { success: false, error: `warningLevel phải là một trong: ${validLevels.join(', ')}` },
        { status: 400 }
      );
    }

    const hocVien = await prisma.hocVien.findFirst({ where: { id: hocVienId, deletedAt: null }, select: { id: true } });
    if (!hocVien) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy học viên' }, { status: 404 });
    }

    // Upsert – unique (hocVienId, academicYear, semesterCode)
    const warning = await prisma.academicWarning.upsert({
      where: { hocVienId_academicYear_semesterCode: { hocVienId, academicYear, semesterCode } },
      create: {
        hocVienId, academicYear, semesterCode,
        warningLevel,
        warningReasonJson: warningReasonJson || null,
        suggestedAction: suggestedAction || null,
      },
      update: {
        warningLevel,
        warningReasonJson: warningReasonJson ?? undefined,
        suggestedAction:   suggestedAction   ?? undefined,
        isResolved: false,
        resolvedAt: null,
        resolvedBy: null,
        generatedAt: new Date(),
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.MANAGE_WARNING,
      action: 'CREATE',
      resourceType: 'ACADEMIC_WARNING',
      resourceId: warning.id,
      newValue: { hocVienId, academicYear, semesterCode, warningLevel },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: warning }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/education/warnings error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create warning' }, { status: 500 });
  }
}
