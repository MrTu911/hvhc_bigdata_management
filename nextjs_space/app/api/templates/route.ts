/**
 * M18 Template API
 * GET  /api/templates  – danh sách template (library)
 * POST /api/templates  – tạo template mới
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { listTemplates, createTemplate } from '@/lib/services/template-service';
import { createTemplateSchema, listTemplateParamsSchema } from '@/lib/validators/template.schema';

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.VIEW);
    if (!user) return response!;

    const { searchParams } = new URL(request.url);
    const parsed = listTemplateParamsSchema.safeParse({
      module: searchParams.get('module'),
      status: searchParams.get('status'),
      format: searchParams.get('format'),
      category: searchParams.get('category'),
      search: searchParams.get('search'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await listTemplates(parsed.data);

    await logAudit({
      userId: user.id,
      functionCode: TEMPLATES.VIEW,
      action: 'VIEW',
      resourceType: 'TEMPLATE_LIST',
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      error: null,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    console.error('[GET /api/templates]', error);
    return NextResponse.json({ success: false, data: null, error: 'Lỗi lấy danh sách template' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.MANAGE);
    if (!user) return response!;

    const body = await request.json();
    const parsed = createTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const template = await createTemplate({ ...parsed.data, createdBy: user.id });

    await logAudit({
      userId: user.id,
      functionCode: TEMPLATES.MANAGE,
      action: 'CREATE',
      resourceType: 'REPORT_TEMPLATE',
      resourceId: template.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ success: true, data: template, error: null }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi tạo template';
    console.error('[POST /api/templates]', error);
    if (msg.includes('đã tồn tại')) {
      return NextResponse.json({ success: false, data: null, error: msg }, { status: 409 });
    }
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
