/**
 * PROGRAMS API - Quản lý chương trình đào tạo
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION, SYSTEM } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_PROGRAM);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const programType = searchParams.get('programType');
    const status = searchParams.get('status');
    const unitId = searchParams.get('unitId');

    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (programType) where.programType = programType;
    if (status) where.status = status;
    if (unitId) where.unitId = unitId;

    const programs = await prisma.program.findMany({
      where,
      include: {
        unit: { select: { id: true, name: true, code: true } },
        _count: { select: { curriculumPlans: true } }
      },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json(programs);
  } catch (error: any) {
    console.error('GET /api/education/programs error:', error);
    return NextResponse.json({ error: 'Failed to fetch programs', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.CREATE_PROGRAM);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { 
      code, name, nameEn, programType, degreeLevel, totalCredits, durationYears,
      unitId, description, objectives, learningOutcomes, admissionReqs, effectiveDate 
    } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Missing required fields: code, name' }, { status: 400 });
    }

    const existing = await prisma.program.findUnique({ where: { code } });
    if (existing) return NextResponse.json({ error: `Program ${code} already exists` }, { status: 409 });

    const program = await prisma.program.create({
      data: {
        code, name, nameEn,
        programType: programType || 'UNDERGRADUATE',
        degreeLevel,
        totalCredits: totalCredits || 120,
        durationYears: durationYears || 4,
        unitId: unitId || null,
        description, objectives, learningOutcomes, admissionReqs,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        status: 'DRAFT',
        createdBy: user!.id,
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.CREATE_PROGRAM,
      action: 'CREATE',
      resourceType: 'PROGRAM',
      resourceId: program.id,
      newValue: { code, name },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/education/programs error:', error);
    return NextResponse.json({ error: 'Failed to create program', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.UPDATE_PROGRAM);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { id, action, ...updateData } = body;

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const existing = await prisma.program.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Program not found' }, { status: 404 });

    // Handle workflow actions
    if (action === 'approve') {
      const authApprove = await requireFunction(req, EDUCATION.APPROVE_PROGRAM);
      if (!authApprove.allowed) return authApprove.response!;
      
      const program = await prisma.program.update({
        where: { id },
        data: { status: 'ACTIVE', approvedBy: user!.id, approvedAt: new Date() },
      });
      return NextResponse.json(program);
    }

    const program = await prisma.program.update({
      where: { id },
      data: {
        ...(updateData.code && { code: updateData.code }),
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.nameEn && { nameEn: updateData.nameEn }),
        ...(updateData.programType && { programType: updateData.programType }),
        ...(updateData.degreeLevel && { degreeLevel: updateData.degreeLevel }),
        ...(updateData.totalCredits && { totalCredits: updateData.totalCredits }),
        ...(updateData.durationYears && { durationYears: updateData.durationYears }),
        ...(updateData.unitId !== undefined && { unitId: updateData.unitId }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.objectives !== undefined && { objectives: updateData.objectives }),
        ...(updateData.learningOutcomes !== undefined && { learningOutcomes: updateData.learningOutcomes }),
        ...(updateData.admissionReqs !== undefined && { admissionReqs: updateData.admissionReqs }),
        ...(updateData.version && { version: updateData.version }),
        ...(updateData.status && { status: updateData.status }),
        ...(updateData.effectiveDate && { effectiveDate: new Date(updateData.effectiveDate) }),
        ...(updateData.expiryDate && { expiryDate: new Date(updateData.expiryDate) }),
        ...(typeof updateData.isActive === 'boolean' && { isActive: updateData.isActive }),
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.UPDATE_PROGRAM,
      action: 'UPDATE',
      resourceType: 'PROGRAM',
      resourceId: id,
      oldValue: existing,
      newValue: program,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(program);
  } catch (error: any) {
    console.error('PUT /api/education/programs error:', error);
    return NextResponse.json({ error: 'Failed to update program', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.DELETE_PROGRAM);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const existing = await prisma.program.findUnique({ 
      where: { id }, 
      include: { _count: { select: { curriculumPlans: true } } } 
    });
    if (!existing) return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    if (existing._count.curriculumPlans > 0) {
      // Soft delete
      await prisma.program.update({ where: { id }, data: { isActive: false } });
    } else {
      await prisma.program.delete({ where: { id } });
    }

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.DELETE_PROGRAM,
      action: 'DELETE',
      resourceType: 'PROGRAM',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/education/programs error:', error);
    return NextResponse.json({ error: 'Failed to delete program', details: error.message }, { status: 500 });
  }
}
