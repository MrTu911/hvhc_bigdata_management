import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { INFRA } from '@/lib/rbac/function-codes';
import {
  listRestoreJobs,
  createRestoreJob,
  verifyRestoreJob,
} from '@/lib/services/infrastructure/backup.service';
import { logAudit, extractAuditContext } from '@/lib/audit-service';

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.BACKUP_VIEW);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(req.url);
  try {
    const result = await listRestoreJobs({
      status:   (searchParams.get('status') as any) ?? undefined,
      page:     Number(searchParams.get('page')     ?? 1),
      pageSize: Number(searchParams.get('pageSize') ?? 20),
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body   = await req.json();
  const action = body.action as 'request' | 'verify';

  // verify restore cần quyền cao hơn
  const requiredCode = action === 'verify' ? INFRA.RESTORE_MANAGE : INFRA.RESTORE_REQUEST;
  const auth = await requireFunction(req, requiredCode);
  if (!auth.allowed) return auth.response!;

  try {
    if (action === 'verify') {
      if (!body.restoreJobId || !body.verificationStatus) {
        return NextResponse.json(
          { success: false, error: 'restoreJobId and verificationStatus required' },
          { status: 400 },
        );
      }
      await verifyRestoreJob({
        restoreJobId:       body.restoreJobId,
        verificationStatus: body.verificationStatus,
        verificationNote:   body.verificationNote,
      });
      const ctx = extractAuditContext(auth.user!.id, auth.user!.role, req);
      await logAudit(ctx, 'UPDATE', 'INFRASTRUCTURE', body.restoreJobId, {
        metadata: {
          operation:          'restore_verify',
          verificationStatus: body.verificationStatus,
          verificationNote:   body.verificationNote ?? null,
        },
      });
      return NextResponse.json({ success: true });
    }

    // action === 'request'
    if (!body.backupJobId || !body.targetEnvironment) {
      return NextResponse.json(
        { success: false, error: 'backupJobId and targetEnvironment required' },
        { status: 400 },
      );
    }
    const job = await createRestoreJob({
      backupJobId:       body.backupJobId,
      targetEnvironment: body.targetEnvironment,
      requestedById:     auth.user!.id,
      notes:             body.notes,
    });
    const ctx = extractAuditContext(auth.user!.id, auth.user!.role, req);
    await logAudit(ctx, 'CREATE', 'INFRASTRUCTURE', job.id, {
      metadata: {
        operation:         'restore_request',
        backupJobId:       body.backupJobId,
        targetEnvironment: body.targetEnvironment,
      },
    });
    return NextResponse.json({ success: true, data: job }, { status: 201 });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404
                 : error.message.includes('cannot restore') ? 409 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
