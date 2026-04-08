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

    const existing = await prisma.foreignLanguageCert.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const record = await prisma.foreignLanguageCert.update({
      where: { id },
      data: {
        language: data.language,
        certType: data.certType,
        certLevel: data.certLevel,
        framework: data.framework,
        certNumber: data.certNumber,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        issuer: data.issuer,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        notes: data.notes,
      },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: FACULTY.UPDATE,
      action: 'UPDATE',
      resourceType: 'FOREIGN_LANGUAGE_CERT',
      resourceId: id,
      oldValue: existing,
      newValue: record,
      result: 'SUCCESS',
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating foreign language cert:', error);
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

    const existing = await prisma.foreignLanguageCert.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.foreignLanguageCert.delete({ where: { id } });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: FACULTY.DELETE,
      action: 'DELETE',
      resourceType: 'FOREIGN_LANGUAGE_CERT',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting foreign language cert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
