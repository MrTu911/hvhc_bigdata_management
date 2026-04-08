/**
 * M10 – UC-59: Quản lý khóa luận / luận văn / đồ án
 * GET  /api/education/thesis  – danh sách
 * POST /api/education/thesis  – tạo mới
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_THESIS);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const hocVienId  = searchParams.get('hocVienId');
    const status     = searchParams.get('status');
    const thesisType = searchParams.get('thesisType');
    const advisorId  = searchParams.get('advisorId');
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));

    const where: any = {};
    if (hocVienId)  where.hocVienId  = hocVienId;
    if (status)     where.status     = status;
    if (thesisType) where.thesisType = thesisType;
    if (advisorId)  where.advisorId  = advisorId;

    const [data, total] = await Promise.all([
      prisma.thesisProject.findMany({
        where,
        include: {
          hocVien:  { select: { id: true, maHocVien: true, hoTen: true, lop: true } },
          advisor:  { select: { id: true, user: { select: { name: true } } } },
          reviewer: { select: { id: true, user: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.thesisProject.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('GET /api/education/thesis error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch thesis list' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.MANAGE_THESIS);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const body = await req.json();
    const {
      hocVienId, thesisType, title, titleEn,
      advisorId, reviewerId,
      defenseDate, defenseScore,
      abstractText, keywords, notes,
      repositoryFileUrl,
    } = body;

    if (!hocVienId || !thesisType || !title) {
      return NextResponse.json(
        { success: false, error: 'hocVienId, thesisType, title là bắt buộc' },
        { status: 400 }
      );
    }

    const hocVien = await prisma.hocVien.findFirst({ where: { id: hocVienId, deletedAt: null }, select: { id: true } });
    if (!hocVien) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy học viên' }, { status: 404 });
    }

    const thesis = await prisma.thesisProject.create({
      data: {
        hocVienId,
        thesisType,
        title,
        titleEn:           titleEn           || null,
        advisorId:         advisorId         || null,
        reviewerId:        reviewerId        || null,
        defenseDate:       defenseDate       ? new Date(defenseDate) : null,
        defenseScore:      defenseScore      != null ? parseFloat(defenseScore) : null,
        abstractText:      abstractText      || null,
        keywords:          keywords          || null,
        notes:             notes             || null,
        repositoryFileUrl: repositoryFileUrl || null,
        createdBy: user!.id,
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.MANAGE_THESIS,
      action: 'CREATE',
      resourceType: 'THESIS_PROJECT',
      resourceId: thesis.id,
      newValue: { hocVienId, thesisType, title },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: thesis }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/education/thesis error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create thesis' }, { status: 500 });
  }
}
