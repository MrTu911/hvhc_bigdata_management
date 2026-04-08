/**
 * API: Get dataset versions
 * GET /api/data/versions/[id]
 * RBAC: DATA.VIEW
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DATA } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { db } from '@/lib/db-query';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC Check
    const auth = await requireFunction(request, DATA.VIEW);
    if (!auth.allowed) {
      return auth.response!;
    }
    const { user } = auth;

    const datasetId = parseInt(params.id);
    if (isNaN(datasetId)) {
      return NextResponse.json({ error: 'Invalid dataset ID' }, { status: 400 });
    }

    // Get all versions
    const result = await db.query(
      `SELECT id, version_number, file_path, file_size, description,
              changes_summary, created_by, created_at, is_active
       FROM data_versions
       WHERE dataset_id = $1
       ORDER BY version_number DESC`,
      [datasetId]
    );

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: DATA.VIEW,
      action: 'VIEW',
      resourceType: 'DATASET_VERSIONS',
      resourceId: datasetId.toString(),
      metadata: { count: result.rows.length },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      versions: result.rows
    });

  } catch (error: any) {
    console.error('Versions error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
