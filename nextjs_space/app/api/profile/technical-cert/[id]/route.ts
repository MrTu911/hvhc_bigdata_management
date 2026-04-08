import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
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

    const existing = await prisma.technicalCertificate.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const record = await prisma.technicalCertificate.update({
      where: { id },
      data: {
        certType: data.certType,
        certName: data.certName,
        certNumber: data.certNumber,
        classification: data.classification,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        issuer: data.issuer,
        decisionNumber: data.decisionNumber,
        decisionDate: data.decisionDate ? new Date(data.decisionDate) : null,
        notes: data.notes,
      },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: FACULTY.UPDATE,
      action: 'UPDATE',
      resourceType: 'TECHNICAL_CERTIFICATE',
      resourceId: id,
      oldValue: existing,
      newValue: record,
      result: 'SUCCESS',
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating technical cert:', error);
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

    const existing = await prisma.technicalCertificate.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.technicalCertificate.delete({ where: { id } });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: FACULTY.DELETE,
      action: 'DELETE',
      resourceType: 'TECHNICAL_CERTIFICATE',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting technical cert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
