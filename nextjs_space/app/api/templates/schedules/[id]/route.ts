/**
 * M18 Template API – E3: DELETE schedule, PATCH toggle active
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import prisma from '@/lib/db';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.MANAGE);
    if (!user) return response!;

    const schedule = await prisma.templateSchedule.findUnique({
      where: { id: params.id },
      select: { id: true, createdBy: true },
    });
    if (!schedule) {
      return NextResponse.json(
        { success: false, data: null, error: 'Lịch xuất không tồn tại' },
        { status: 404 },
      );
    }

    await prisma.templateSchedule.delete({ where: { id: params.id } });

    await logAudit({
      userId: user.id,
      functionCode: TEMPLATES.MANAGE,
      action: 'DELETE',
      resourceType: 'TEMPLATE_SCHEDULE',
      resourceId: params.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ success: true, data: { deletedAt: new Date().toISOString() }, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi xóa lịch xuất';
    console.error('[DELETE /api/templates/schedules/[id]]', error);
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.MANAGE);
    if (!user) return response!;

    const body = await request.json();
    const schedule = await prisma.templateSchedule.update({
      where: { id: params.id },
      data: {
        isActive: body.isActive !== undefined ? body.isActive : undefined,
      },
      select: {
        id: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: schedule });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi cập nhật lịch xuất';
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
