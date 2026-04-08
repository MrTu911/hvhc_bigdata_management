import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { RESEARCH } from '@/lib/rbac/function-codes';
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

    const existing = await prisma.scientificPublication.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const record = await prisma.scientificPublication.update({
      where: { id },
      data: {
        type: data.type,
        title: data.title,
        year: data.year,
        month: data.month,
        role: data.role,
        publisher: data.publisher,
        organization: data.organization,
        issueNumber: data.issueNumber,
        pageNumbers: data.pageNumbers,
        targetUsers: data.targetUsers,
        coAuthors: data.coAuthors,
        notes: data.notes,
      },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: RESEARCH.UPDATE,
      action: 'UPDATE',
      resourceType: 'SCIENTIFIC_PUBLICATION',
      resourceId: id,
      oldValue: existing,
      newValue: record,
      result: 'SUCCESS',
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating publication:', error);
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

    const existing = await prisma.scientificPublication.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.scientificPublication.delete({ where: { id } });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: RESEARCH.DELETE,
      action: 'DELETE',
      resourceType: 'SCIENTIFIC_PUBLICATION',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting publication:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
