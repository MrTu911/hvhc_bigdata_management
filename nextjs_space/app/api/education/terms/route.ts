/**
 * TERMS API - Quản lý học kỳ
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION, SYSTEM } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_TERM);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get('academicYearId');
    const currentOnly = searchParams.get('current') === 'true';

    const where: any = { isActive: true };
    if (academicYearId) where.academicYearId = academicYearId;
    if (currentOnly) where.isCurrent = true;

    const terms = await prisma.term.findMany({
      where,
      include: {
        academicYear: { select: { id: true, code: true, name: true } },
        _count: { select: { classSections: true, trainingSessions: true } }
      },
      orderBy: [{ academicYear: { startDate: 'desc' } }, { termNumber: 'asc' }],
    });

    return NextResponse.json(terms);
  } catch (error: any) {
    console.error('GET /api/education/terms error:', error);
    return NextResponse.json({ error: 'Failed to fetch terms', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.MANAGE_TERM);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { code, name, academicYearId, termNumber, startDate, endDate, registrationStart, registrationEnd, isCurrent } = body;

    if (!code || !name || !academicYearId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await prisma.term.findUnique({ where: { code } });
    if (existing) return NextResponse.json({ error: `Term ${code} already exists` }, { status: 409 });

    if (isCurrent) {
      await prisma.term.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
    }

    const term = await prisma.term.create({
      data: {
        code, name, academicYearId,
        termNumber: termNumber || 1,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationStart: registrationStart ? new Date(registrationStart) : null,
        registrationEnd: registrationEnd ? new Date(registrationEnd) : null,
        isCurrent: isCurrent || false,
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.MANAGE_TERM,
      action: 'CREATE',
      resourceType: 'TERM',
      resourceId: term.id,
      newValue: { code, name },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(term, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/education/terms error:', error);
    return NextResponse.json({ error: 'Failed to create term', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.MANAGE_TERM);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const existing = await prisma.term.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Term not found' }, { status: 404 });

    if (updateData.isCurrent) {
      await prisma.term.updateMany({ where: { isCurrent: true, id: { not: id } }, data: { isCurrent: false } });
    }

    const term = await prisma.term.update({
      where: { id },
      data: {
        ...(updateData.code && { code: updateData.code }),
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.termNumber && { termNumber: updateData.termNumber }),
        ...(updateData.startDate && { startDate: new Date(updateData.startDate) }),
        ...(updateData.endDate && { endDate: new Date(updateData.endDate) }),
        ...(updateData.registrationStart && { registrationStart: new Date(updateData.registrationStart) }),
        ...(updateData.registrationEnd && { registrationEnd: new Date(updateData.registrationEnd) }),
        ...(typeof updateData.isCurrent === 'boolean' && { isCurrent: updateData.isCurrent }),
        ...(typeof updateData.isActive === 'boolean' && { isActive: updateData.isActive }),
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.MANAGE_TERM,
      action: 'UPDATE',
      resourceType: 'TERM',
      resourceId: id,
      oldValue: existing,
      newValue: term,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(term);
  } catch (error: any) {
    console.error('PUT /api/education/terms error:', error);
    return NextResponse.json({ error: 'Failed to update term', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireFunction(req, SYSTEM.MANAGE_UNITS);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const existing = await prisma.term.findUnique({ 
      where: { id }, 
      include: { _count: { select: { classSections: true } } } 
    });
    if (!existing) return NextResponse.json({ error: 'Term not found' }, { status: 404 });
    if (existing._count.classSections > 0) return NextResponse.json({ error: 'Cannot delete: has related class sections' }, { status: 400 });

    await prisma.term.delete({ where: { id } });

    await logAudit({
      userId: user!.id,
      functionCode: SYSTEM.MANAGE_UNITS,
      action: 'DELETE',
      resourceType: 'TERM',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/education/terms error:', error);
    return NextResponse.json({ error: 'Failed to delete term', details: error.message }, { status: 500 });
  }
}
