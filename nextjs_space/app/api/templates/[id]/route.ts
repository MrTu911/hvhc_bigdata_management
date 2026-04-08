/**
 * M18 Template API
 * GET    /api/templates/[id]  – chi tiết template
 * PUT    /api/templates/[id]  – cập nhật metadata
 * DELETE /api/templates/[id]  – soft delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { getTemplate, updateTemplate, deleteTemplate } from '@/lib/services/template-service';
import { updateTemplateSchema } from '@/lib/validators/template.schema';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.VIEW);
    if (!user) return response!;

    const template = await getTemplate(params.id);

    await logAudit({
      userId: user.id,
      functionCode: TEMPLATES.VIEW,
      action: 'VIEW',
      resourceType: 'REPORT_TEMPLATE',
      resourceId: params.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ success: true, data: template, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi lấy template';
    if (msg.includes('không tồn tại')) {
      return NextResponse.json({ success: false, data: null, error: msg }, { status: 404 });
    }
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.MANAGE);
    if (!user) return response!;

    const body = await request.json();
    const parsed = updateTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const template = await updateTemplate(params.id, parsed.data);

    await logAudit({
      userId: user.id,
      functionCode: TEMPLATES.MANAGE,
      action: 'UPDATE',
      resourceType: 'REPORT_TEMPLATE',
      resourceId: params.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ success: true, data: template, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi cập nhật template';
    if (msg.includes('không tồn tại')) {
      return NextResponse.json({ success: false, data: null, error: msg }, { status: 404 });
    }
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.MANAGE);
    if (!user) return response!;

    await deleteTemplate(params.id);

    await logAudit({
      userId: user.id,
      functionCode: TEMPLATES.MANAGE,
      action: 'DELETE',
      resourceType: 'REPORT_TEMPLATE',
      resourceId: params.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ success: true, data: { archivedAt: new Date().toISOString() }, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi vô hiệu hóa template';
    if (msg.includes('không tồn tại')) {
      return NextResponse.json({ success: false, data: null, error: msg }, { status: 404 });
    }
    if (msg.includes('đang được sử dụng')) {
      return NextResponse.json({ success: false, data: null, error: msg }, { status: 409 });
    }
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
