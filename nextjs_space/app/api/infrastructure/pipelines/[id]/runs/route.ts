/**
 * GET /api/infrastructure/pipelines/[id]/runs
 *
 * Run history của một PipelineDefinition cụ thể.
 * Hỗ trợ filter status, phân trang, và summary stats.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { INFRA } from '@/lib/rbac/function-codes';
import {
  listPipelineRuns,
  getPipelineRunSummary,
  getPipelineDefinition,
} from '@/lib/services/infrastructure/pipeline.service';
import type { PipelineRunStatus } from '@prisma/client';

export async function GET(
  req:     NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireFunction(req, INFRA.PIPELINE_VIEW);
  if (!auth.allowed) return auth.response!;

  const { id } = await context.params;
  const { searchParams } = new URL(req.url);

  try {
    const definition = await getPipelineDefinition(id);
    if (!definition) {
      return NextResponse.json({ success: false, error: 'Pipeline không tồn tại' }, { status: 404 });
    }

    const statusParam = searchParams.get('status') as PipelineRunStatus | null;
    const page        = Math.max(1, Number(searchParams.get('page')     ?? 1));
    const pageSize    = Math.min(100, Number(searchParams.get('pageSize') ?? 20));
    const withSummary = searchParams.get('summary') === 'true';

    const [runs, summary] = await Promise.all([
      listPipelineRuns({
        definitionId: id,
        status:       statusParam ?? undefined,
        page,
        pageSize,
      }),
      withSummary ? getPipelineRunSummary(id) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        definition: {
          id:            definition.id,
          name:          definition.name,
          pipelineType:  definition.pipelineType,
          scheduleCron:  definition.scheduleCron,
          isActive:      definition.isActive,
          lastRunAt:     definition.lastRunAt,
          lastRunStatus: definition.lastRunStatus,
        },
        runs:    runs.runs,
        total:   runs.total,
        page:    runs.page,
        pageSize: runs.pageSize,
        ...(summary ? { summary } : {}),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
