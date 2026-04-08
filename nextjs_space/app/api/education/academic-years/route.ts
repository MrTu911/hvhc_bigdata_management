/**
 * ACADEMIC YEARS API - Quản lý năm học
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_TERM);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const includeTerms = searchParams.get('includeTerms') === 'true';
    const currentOnly = searchParams.get('current') === 'true';

    const where: any = { isActive: true };
    if (currentOnly) where.isCurrent = true;

    const academicYears = await prisma.academicYear.findMany({
      where,
      include: includeTerms ? {
        terms: { orderBy: { termNumber: 'asc' } },
        _count: { select: { curriculumPlans: true } }
      } : {
        _count: { select: { terms: true, curriculumPlans: true } }
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json(academicYears);
  } catch (error: any) {
    console.error('GET /api/education/academic-years error:', error);
    return NextResponse.json({ error: 'Failed to fetch academic years', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.MANAGE_TERM);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { code, name, startDate, endDate, isCurrent } = body;

    if (!code || !name || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields: code, name, startDate, endDate' }, { status: 400 });
    }

    const existing = await prisma.academicYear.findUnique({ where: { code } });
    if (existing) return NextResponse.json({ error: `Academic year ${code} already exists` }, { status: 409 });

    // If this is set as current, unset others
    if (isCurrent) {
      await prisma.academicYear.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        code, name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: isCurrent || false,
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.MANAGE_TERM,
      action: 'CREATE',
      resourceType: 'ACADEMIC_YEAR',
      resourceId: academicYear.id,
      newValue: { code, name },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(academicYear, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/education/academic-years error:', error);
    return NextResponse.json({ error: 'Failed to create academic year', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.MANAGE_TERM);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { id, code, name, startDate, endDate, isCurrent, isActive } = body;

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const existing = await prisma.academicYear.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });

    if (isCurrent) {
      await prisma.academicYear.updateMany({ where: { isCurrent: true, id: { not: id } }, data: { isCurrent: false } });
    }

    const academicYear = await prisma.academicYear.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(typeof isCurrent === 'boolean' && { isCurrent }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.MANAGE_TERM,
      action: 'UPDATE',
      resourceType: 'ACADEMIC_YEAR',
      resourceId: id,
      oldValue: existing,
      newValue: academicYear,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(academicYear);
  } catch (error: any) {
    console.error('PUT /api/education/academic-years error:', error);
    return NextResponse.json({ error: 'Failed to update academic year', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.MANAGE_TERM);
    if (!auth.allowed) return auth.response!;

    const { user } = auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const existing = await prisma.academicYear.findUnique({ where: { id }, include: { _count: { select: { terms: true } } } });
    if (!existing) return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    if (existing._count.terms > 0) return NextResponse.json({ error: 'Cannot delete: has related terms' }, { status: 400 });

    await prisma.academicYear.delete({ where: { id } });

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.MANAGE_TERM,
      action: 'DELETE',
      resourceType: 'ACADEMIC_YEAR',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/education/academic-years error:', error);
    return NextResponse.json({ error: 'Failed to delete academic year', details: error.message }, { status: 500 });
  }
}
