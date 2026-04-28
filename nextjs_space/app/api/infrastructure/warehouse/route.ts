import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { INFRA } from '@/lib/rbac/function-codes';
import {
  listSyncJobs,
  getWarehouseStatus,
  createSyncJob,
  recordSyncResult,
  toggleSyncJobActive,
} from '@/lib/services/infrastructure/warehouse.service';

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.PIPELINE_VIEW);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');

  try {
    if (view === 'status') {
      const status = await getWarehouseStatus();
      return NextResponse.json({ success: true, data: status });
    }

    const result = await listSyncJobs({
      status:      (searchParams.get('status') as any) ?? undefined,
      sourceTable: searchParams.get('sourceTable') ?? undefined,
      page:        Number(searchParams.get('page')     ?? 1),
      pageSize:    Number(searchParams.get('pageSize') ?? 50),
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body   = await req.json();
  const action = body.action as 'create' | 'record-result';

  // record-result được gọi từ Airflow worker — cần quyền PIPELINE_MANAGE
  const requiredCode = action === 'record-result' ? INFRA.PIPELINE_MANAGE : INFRA.PIPELINE_MANAGE;
  const auth = await requireFunction(req, requiredCode);
  if (!auth.allowed) return auth.response!;

  try {
    if (action === 'record-result') {
      if (!body.jobId || !body.status) {
        return NextResponse.json(
          { success: false, error: 'jobId and status required' },
          { status: 400 },
        );
      }
      await recordSyncResult({
        jobId:          body.jobId,
        status:         body.status,
        rowCount:       body.rowCount,
        durationMs:     body.durationMs,
        watermarkValue: body.watermarkValue,
        errorMessage:   body.errorMessage,
      });
      return NextResponse.json({ success: true });
    }

    // action === 'create'
    const required = ['sourceTable', 'targetDataset', 'syncMode'];
    const missing  = required.filter((f) => !body[f]);
    if (missing.length) {
      return NextResponse.json(
        { success: false, error: `Missing fields: ${missing.join(', ')}` },
        { status: 400 },
      );
    }
    const job = await createSyncJob({
      sourceTable:    body.sourceTable,
      targetDataset:  body.targetDataset,
      syncMode:       body.syncMode,
      watermarkField: body.watermarkField,
    });
    return NextResponse.json({ success: true, data: job }, { status: 201 });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

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

    await toggleSyncJobActive(body.id, body.isActive);
    return NextResponse.json({ success: true, data: { id: body.id, isActive: body.isActive } });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
