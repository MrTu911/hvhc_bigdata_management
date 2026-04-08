/**
 * M18 Template API – POST rollback to a previous version
 *
 * Body: { targetVersion: number, changeNote?: string }
 *
 * Rule: từ chối nếu có ExportJob PENDING/PROCESSING cho template này.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { rollbackTemplate } from '@/lib/services/template-service';
import { z } from 'zod';

const rollbackSchema = z.object({
  targetVersion: z.number().int().min(1, 'targetVersion phải là số nguyên dương'),
  changeNote: z.string().max(500).optional().default(''),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.MANAGE);
    if (!user) return response!;

    const body = await request.json();
    const parsed = rollbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { targetVersion, changeNote } = parsed.data;

    const result = await rollbackTemplate(params.id, targetVersion, changeNote, user.id);

    await logAudit({
      userId: user.id,
      functionCode: TEMPLATES.MANAGE,
      action: 'ROLLBACK',
      resourceType: 'REPORT_TEMPLATE',
      resourceId: params.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi rollback template';
    console.error('[POST /api/templates/[id]/rollback]', error);
    if (msg.includes('không tồn tại')) {
      return NextResponse.json({ success: false, data: null, error: msg }, { status: 404 });
    }
    if (msg.includes('đang chạy')) {
      // business rule: block rollback khi job đang chạy
      return NextResponse.json({ success: false, data: null, error: msg }, { status: 409 });
    }
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
