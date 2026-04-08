/**
 * M10 – UC-60: Graduation Rule Engine
 * GET  /api/education/graduation/audit          – danh sách kết quả xét tốt nghiệp
 * POST /api/education/graduation/audit          – chạy xét tốt nghiệp cho một học viên
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// ─── Graduation Rule Engine ────────────────────────────────────────────────────
async function runGraduationEngine(hocVienId: string) {
  const hocVien = await prisma.hocVien.findFirst({
    where: { id: hocVienId, deletedAt: null },
    select: {
      id: true, maHocVien: true, hoTen: true,
      diemTrungBinh: true,
      tinChiTichLuy: true,
      tongTinChi: true,
      currentProgramVersion: {
        select: { totalCredits: true },
      },
    },
  });

  if (!hocVien) return null;

  const requiredCredits = hocVien.currentProgramVersion?.totalCredits ?? hocVien.tongTinChi ?? 120;
  const totalCreditsEarned = hocVien.tinChiTichLuy ?? 0;
  const gpa = hocVien.diemTrungBinh ?? 0;

  // Kiểm tra rèn luyện (phải có ít nhất 1 kỳ rèn luyện đạt)
  const lastConduct = await prisma.studentConductRecord.findFirst({
    where: { hocVienId },
    orderBy: [{ academicYear: 'desc' }, { semesterCode: 'desc' }],
    select: { conductScore: true },
  });
  const conductEligible = lastConduct ? lastConduct.conductScore >= 50 : false;

  // Kiểm tra khóa luận (nếu có, phải DEFENDED)
  const thesis = await prisma.thesisProject.findFirst({
    where: { hocVienId },
    select: { status: true, defenseScore: true },
  });
  const thesisEligible = !thesis || thesis.status === 'DEFENDED';

  // Ngoại ngữ – placeholder (cần tích hợp ForeignLanguageCert từ M02)
  const languageEligible = true; // TODO: kiểm tra ForeignLanguageCert khi integrate M02

  // Tổng hợp điều kiện
  const failureReasons: { code: string; message: string }[] = [];

  if (totalCreditsEarned < requiredCredits) {
    failureReasons.push({
      code: 'INSUFFICIENT_CREDITS',
      message: `Tín chỉ tích lũy ${totalCreditsEarned} < yêu cầu ${requiredCredits}`,
    });
  }
  if (gpa < 2.0) {
    failureReasons.push({
      code: 'LOW_GPA',
      message: `GPA ${gpa.toFixed(2)} < 2.0`,
    });
  }
  if (!conductEligible) {
    failureReasons.push({
      code: 'CONDUCT_INELIGIBLE',
      message: 'Điểm rèn luyện chưa đạt (< 50)',
    });
  }
  if (!thesisEligible) {
    failureReasons.push({
      code: 'THESIS_NOT_DEFENDED',
      message: 'Khóa luận / luận văn chưa bảo vệ',
    });
  }

  const graduationEligible =
    failureReasons.length === 0 && conductEligible && thesisEligible && languageEligible;

  return {
    hocVienId,
    gpa,
    totalCreditsEarned,
    conductEligible,
    thesisEligible,
    languageEligible,
    graduationEligible,
    failureReasonsJson: failureReasons.length > 0 ? failureReasons : null,
  };
}
// ──────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_GRADUATION);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const hocVienId          = searchParams.get('hocVienId');
    const graduationEligible = searchParams.get('graduationEligible');
    const status             = searchParams.get('status');
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));

    const where: any = {};
    if (hocVienId) where.hocVienId = hocVienId;
    if (status)    where.status    = status;
    if (graduationEligible !== null && graduationEligible !== undefined) {
      where.graduationEligible = graduationEligible === 'true';
    }

    const [data, total] = await Promise.all([
      prisma.graduationAudit.findMany({
        where,
        include: {
          hocVien: { select: { id: true, maHocVien: true, hoTen: true, lop: true, khoaHoc: true } },
          diplomaRecord: { select: { id: true, diplomaNo: true, diplomaType: true, graduationDate: true } },
        },
        orderBy: { auditDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.graduationAudit.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('GET /api/education/graduation/audit error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch graduation audits' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.RUN_GRADUATION);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const body = await req.json();
    const { hocVienId, notes } = body;

    if (!hocVienId) {
      return NextResponse.json({ success: false, error: 'hocVienId là bắt buộc' }, { status: 400 });
    }

    const engineResult = await runGraduationEngine(hocVienId);
    if (!engineResult) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy học viên' }, { status: 404 });
    }

    const audit = await prisma.graduationAudit.create({
      data: {
        hocVienId,
        auditDate:           new Date(),
        totalCreditsEarned:  engineResult.totalCreditsEarned,
        gpa:                 engineResult.gpa,
        conductEligible:     engineResult.conductEligible,
        thesisEligible:      engineResult.thesisEligible,
        languageEligible:    engineResult.languageEligible,
        graduationEligible:  engineResult.graduationEligible,
        failureReasonsJson:  engineResult.failureReasonsJson,
        status:              engineResult.graduationEligible ? 'ELIGIBLE' : 'INELIGIBLE',
        notes:               notes || null,
        createdBy:           user!.id,
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.RUN_GRADUATION,
      action: 'CREATE',
      resourceType: 'GRADUATION_AUDIT',
      resourceId: audit.id,
      newValue: { hocVienId, graduationEligible: engineResult.graduationEligible, gpa: engineResult.gpa },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: audit }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/education/graduation/audit error:', error);
    return NextResponse.json({ success: false, error: 'Failed to run graduation audit' }, { status: 500 });
  }
}
