/**
 * API: Document Registry [id] – Chi tiết / Cập nhật / Xóa văn bản
 * Path: /api/documents/registry/[id]
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DIGITAL_DOCS } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import prisma from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireFunction(request, DIGITAL_DOCS.VIEW);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;

    const doc = await prisma.researchFile.findUnique({
      where: { id: params.id },
      include: {
        accessLogs: {
          orderBy: { timestamp: 'desc' },
          take: 10,
          select: { id: true, userId: true, action: true, timestamp: true, ipAddress: true },
        },
      },
    });

    if (!doc) return NextResponse.json({ error: 'Không tìm thấy văn bản' }, { status: 404 });

    // Increment view count
    await prisma.researchFile.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    await prisma.fileAccessLog.create({
      data: {
        fileId: params.id,
        userId: user.id,
        action: 'VIEW',
        success: true,
      },
    }).catch(() => {});

    return NextResponse.json({ document: doc });
  } catch (error) {
    console.error('[Document Registry GET by ID]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireFunction(request, DIGITAL_DOCS.UPDATE);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;

    const body = await request.json();
    const { title, description, department, researchArea, classification, tags, keywords } = body;

    const doc = await prisma.researchFile.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(department !== undefined && { department }),
        ...(researchArea !== undefined && { researchArea }),
        ...(classification !== undefined && { classification: classification as any }),
        ...(tags !== undefined && { tags }),
        ...(keywords !== undefined && { keywords }),
      },
    });

    await logAudit({
      userId: user.id,
      functionCode: DIGITAL_DOCS.UPDATE,
      action: 'UPDATE',
      resourceType: 'DIGITAL_DOCUMENT',
      resourceId: params.id,
      result: 'SUCCESS',
    });

    return NextResponse.json({ document: doc });
  } catch (error) {
    console.error('[Document Registry PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireFunction(request, DIGITAL_DOCS.DELETE);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;

    const doc = await prisma.researchFile.findUnique({
      where: { id: params.id },
      select: { id: true, uploadedBy: true, title: true },
    });

    if (!doc) return NextResponse.json({ error: 'Không tìm thấy văn bản' }, { status: 404 });

    await prisma.researchFile.delete({ where: { id: params.id } });

    await logAudit({
      userId: user.id,
      functionCode: DIGITAL_DOCS.DELETE,
      action: 'DELETE',
      resourceType: 'DIGITAL_DOCUMENT',
      resourceId: params.id,
      result: 'SUCCESS',
      metadata: { title: doc.title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Document Registry DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
