import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { INFRA } from '@/lib/rbac/function-codes';
import {
  listBackupJobs,
  createBackupJob,
  getBackupFreshnessMinutes,
} from '@/lib/services/infrastructure/backup.service';
import { logAudit, extractAuditContext } from '@/lib/audit-service';

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.BACKUP_VIEW);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');

  try {
    if (view === 'freshness') {
      const minutes = await getBackupFreshnessMinutes('POSTGRESQL_FULL');
      return NextResponse.json({ success: true, data: { freshnessMinutes: minutes } });
    }

    const result = await listBackupJobs({
      backupType: (searchParams.get('backupType') as any) ?? undefined,
      status:     (searchParams.get('status')     as any) ?? undefined,
      page:       Number(searchParams.get('page')     ?? 1),
      pageSize:   Number(searchParams.get('pageSize') ?? 20),
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Trigger manual backup — audit-sensitive
export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.BACKUP_MANAGE);
  if (!auth.allowed) return auth.response!;

  try {
    const body = await req.json();
    if (!body.backupType || !body.targetPath) {
      return NextResponse.json(
        { success: false, error: 'backupType and targetPath required' },
        { status: 400 },
      );
    }

    const job = await createBackupJob({
      backupType:    body.backupType,
      targetPath:    body.targetPath,
      triggeredBy:   'MANUAL',
      requestedById: auth.user?.id,
    });
    const ctx = extractAuditContext(auth.user!.id, auth.user!.role, req);
    await logAudit(ctx, 'CREATE', 'INFRASTRUCTURE', job.id, {
      metadata: { operation: 'manual_backup', backupType: body.backupType, targetPath: body.targetPath },
    });
    return NextResponse.json({ success: true, data: job }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
