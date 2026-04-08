/**
 * API Route: Compare Data Versions
 * POST /api/data/versions/compare
 * RBAC: DATA.VIEW
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DATA } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { prisma as db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // RBAC Check
    const auth = await requireFunction(request, DATA.VIEW);
    if (!auth.allowed) {
      return auth.response!;
    }
    const { user } = auth;

    const body = await request.json();
    const { dataId, versionA, versionB, comparisonType = 'summary' } = body;

    if (!dataId || !versionA || !versionB) {
      return NextResponse.json(
        { error: 'dataId, versionA, and versionB are required' },
        { status: 400 }
      );
    }

    // Get both versions
    const versions = await db.$queryRaw<any[]>`
      SELECT version_number, changes_summary, file_size, created_at
      FROM data_versions
      WHERE data_id = ${dataId} 
        AND version_number IN (${versionA}, ${versionB})
      ORDER BY version_number
    `;

    if (versions.length !== 2) {
      return NextResponse.json(
        { error: 'One or both versions not found' },
        { status: 404 }
      );
    }

    // Simple comparison
    const differences = {
      versionA: {
        version: versions[0].version_number,
        size: versions[0].file_size,
        changes: versions[0].changes_summary,
        createdAt: versions[0].created_at,
      },
      versionB: {
        version: versions[1].version_number,
        size: versions[1].file_size,
        changes: versions[1].changes_summary,
        createdAt: versions[1].created_at,
      },
      sizeDifference: (versions[1].file_size || 0) - (versions[0].file_size || 0),
      timeDifference: new Date(versions[1].created_at).getTime() - new Date(versions[0].created_at).getTime(),
    };

    // Save comparison history
    await db.$executeRaw`
      INSERT INTO version_comparisons (
        data_id, version_a, version_b, comparison_type, 
        differences, compared_by
      ) VALUES (
        ${dataId}, ${versionA}, ${versionB}, ${comparisonType},
        ${JSON.stringify(differences)}::jsonb, ${user!.id}
      )
    `;

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: DATA.VIEW,
      action: 'VIEW',
      resourceType: 'VERSION_COMPARISON',
      resourceId: dataId.toString(),
      metadata: { versionA, versionB, comparisonType },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      differences,
    });
  } catch (error: any) {
    console.error('Compare versions error:', error);
    return NextResponse.json(
      { error: 'Failed to compare versions', details: error.message },
      { status: 500 }
    );
  }
}
