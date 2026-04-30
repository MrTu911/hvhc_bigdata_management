import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { INFRA } from '@/lib/rbac/function-codes';
import {
  listPipelineDefinitions,
  createPipelineDefinition,
  listPipelineRuns,
  triggerPipelineRun,
  triggerWithAirflow,
  togglePipelineActive,
} from '@/lib/services/infrastructure/pipeline.service';
import { logAudit, extractAuditContext } from '@/lib/audit-service';

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.PIPELINE_VIEW);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view') ?? 'definitions';

  try {
    if (view === 'runs') {
      const result = await listPipelineRuns({
        definitionId: searchParams.get('definitionId') ?? undefined,
        status:       (searchParams.get('status') as any) ?? undefined,
        page:         Number(searchParams.get('page') ?? 1),
        pageSize:     Number(searchParams.get('pageSize') ?? 20),
      });
      return NextResponse.json({ success: true, data: result });
    }

    const definitions = await listPipelineDefinitions();
    return NextResponse.json({ success: true, data: definitions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.PIPELINE_MANAGE);
  if (!auth.allowed) return auth.response!;

  try {
    const body = await req.json();
    const action = body.action as 'create' | 'trigger' | 'trigger-airflow';

    if (action === 'trigger') {
      if (!body.definitionId) {
        return NextResponse.json({ success: false, error: 'definitionId required' }, { status: 400 });
      }
      const run = await triggerPipelineRun({
        definitionId:  body.definitionId,
        triggeredBy:   'MANUAL',
        triggeredById: auth.user?.id,
        metadata:      body.metadata,
      });
      const ctx = extractAuditContext(auth.user!.id, auth.user!.role, req);
      await logAudit(ctx, 'UPDATE', 'INFRASTRUCTURE', body.definitionId, {
        metadata: { operation: 'pipeline_trigger', runId: run.id, triggeredBy: 'MANUAL' },
      });
      return NextResponse.json({ success: true, data: run }, { status: 201 });
    }

    if (action === 'trigger-airflow') {
      if (!body.definitionId || !body.dagId) {
        return NextResponse.json(
          { success: false, error: 'definitionId and dagId required' },
          { status: 400 },
        );
      }
      const result = await triggerWithAirflow({
        definitionId:  body.definitionId,
        dagId:         body.dagId,
        triggeredBy:   'MANUAL',
        triggeredById: auth.user?.id,
        dagConf:       body.dagConf,
      });
      const ctx = extractAuditContext(auth.user!.id, auth.user!.role, req);
      await logAudit(ctx, 'UPDATE', 'INFRASTRUCTURE', body.definitionId, {
        metadata: {
          operation: 'pipeline_trigger_airflow',
          runId:     result.run.id,
          dagId:     body.dagId,
          dagRunId:  result.dagRunId,
          mockMode:  result.mockMode,
        },
      });
      return NextResponse.json({ success: true, data: result }, { status: 201 });
    }

    // action === 'create'
    const required = ['name', 'pipelineType', 'sourceDataset', 'steps'];
    const missing  = required.filter((f) => !body[f]);
    if (missing.length) {
      return NextResponse.json(
        { success: false, error: `Missing fields: ${missing.join(', ')}` },
        { status: 400 },
      );
    }

    const def = await createPipelineDefinition({
      name:          body.name,
      description:   body.description,
      pipelineType:  body.pipelineType,
      sourceDataset: body.sourceDataset,
      targetDataset: body.targetDataset,
      scheduleCron:  body.scheduleCron,
      steps:         body.steps,
      parameters:    body.parameters,
      createdById:   auth.user!.id,
    });
    return NextResponse.json({ success: true, data: def }, { status: 201 });
  } catch (error: any) {
    const status = error.message.includes('already running') ? 409 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

// PATCH — enable/disable pipeline (emergency-stop hoặc re-enable)
export async function PATCH(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.PIPELINE_MANAGE);
  if (!auth.allowed) return auth.response!;

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    }
    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json({ success: false, error: 'isActive (boolean) required' }, { status: 400 });
    }

    await togglePipelineActive(body.id, body.isActive);
    const ctx = extractAuditContext(auth.user!.id, auth.user!.role, req);
    await logAudit(ctx, 'UPDATE', 'INFRASTRUCTURE', body.id, {
      before:   { isActive: !body.isActive },
      after:    { isActive: body.isActive },
      metadata: { operation: body.isActive ? 'pipeline_enable' : 'pipeline_emergency_stop' },
    });
    return NextResponse.json({
      success: true,
      data: { id: body.id, isActive: body.isActive },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
