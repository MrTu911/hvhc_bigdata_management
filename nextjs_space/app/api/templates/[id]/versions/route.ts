/**
 * M18 Template API – GET version history
 *
 * GET /api/templates/[id]/versions?page=1&limit=10
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { getTemplateVersions } from '@/lib/services/template-service';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.VIEW);
    if (!user) return response!;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    const result = await getTemplateVersions(params.id, page, limit);

    return NextResponse.json({
      success: true,
      data: result.rows,
      error: null,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi lấy lịch sử phiên bản';
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
