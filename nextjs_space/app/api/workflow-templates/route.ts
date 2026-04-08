/**
 * M13 – Workflow Templates
 * GET  /api/workflow-templates  – danh sách templates
 * POST /api/workflow-templates  – tạo template mới
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, sessionToAuthUser } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import { WorkflowTemplateService } from '@/lib/services/workflow/workflow-template.service';
import { WorkflowError } from '@/lib/services/workflow/workflow-engine.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireFunction(request, WORKFLOW.VIEW);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(request.url);
  const moduleKey = searchParams.get('moduleKey') ?? undefined;

  try {
    const templates = await WorkflowTemplateService.listTemplates(auth.user!, moduleKey);
    return NextResponse.json({ success: true, data: templates });
  } catch (err) {
    console.error('[GET /api/workflow-templates]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi tải danh sách template' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireFunction(request, WORKFLOW.DESIGN);
  if (!auth.allowed) return auth.response!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body không hợp lệ' }, { status: 400 });
  }

  const { code, name, moduleKey, description } = body as Record<string, string>;

  if (!code?.trim() || !name?.trim()) {
    return NextResponse.json(
      { success: false, error: 'code và name là bắt buộc' },
      { status: 400 }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    const actor = sessionToAuthUser(session)!;
    const template = await WorkflowTemplateService.createTemplate(
      { code: code.trim(), name: name.trim(), moduleKey: moduleKey.trim(), description },
      actor
    );
    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (err) {
    if (err instanceof WorkflowError) {
      const status = err.code === 'FORBIDDEN' ? 403 : 409;
      return NextResponse.json({ success: false, error: err.message }, { status });
    }
    console.error('[POST /api/workflow-templates]', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi tạo template' }, { status: 500 });
  }
}
