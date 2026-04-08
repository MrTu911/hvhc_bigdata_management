import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import prisma from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const { id } = params;
    const data = await req.json();

    // Verify ownership
    const existing = await prisma.educationHistory.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const record = await prisma.educationHistory.update({
      where: { id },
      data: {
        level: data.level,
        trainingSystem: data.trainingSystem,
        major: data.major,
        institution: data.institution,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        thesisTitle: data.thesisTitle,
        supervisor: data.supervisor,
        defenseDate: data.defenseDate ? new Date(data.defenseDate) : null,
        defenseLocation: data.defenseLocation,
        examSubject: data.examSubject,
        classification: data.classification,
        certificateCode: data.certificateCode,
        certificateDate: data.certificateDate ? new Date(data.certificateDate) : null,
        notes: data.notes,
      },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: EDUCATION.UPDATE_CURRICULUM,
      action: 'UPDATE',
      resourceType: 'EDUCATION_HISTORY',
      resourceId: id,
      oldValue: existing,
      newValue: record,
      result: 'SUCCESS',
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating education:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const { id } = params;

    // Verify ownership
    const existing = await prisma.educationHistory.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.educationHistory.delete({ where: { id } });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: EDUCATION.DELETE_CURRICULUM,
      action: 'DELETE',
      resourceType: 'EDUCATION_HISTORY',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting education:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
