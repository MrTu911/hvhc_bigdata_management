import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { prisma as db } from '@/lib/db';

// GET - Lấy danh sách versions của model
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const modelId = params.id;

    const versions = await db.$queryRawUnsafe(`
      SELECT * FROM model_versions 
      WHERE model_id = '${modelId}'
      ORDER BY version_number DESC
    `);

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Error fetching model versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model versions' },
      { status: 500 }
    );
  }
}

// POST - Tạo version mới cho model
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireFunction(request, ML.MANAGE_MODELS);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }
    const { user } = authResult;

    const modelId = params.id;
    const body = await request.json();
    const { 
      description, 
      experimentId, 
      metrics, 
      artifactPath,
      tags 
    } = body;

    // Lấy version number mới nhất
    const latestVersions = await db.$queryRawUnsafe<Array<{ version_number: number }>>(`
      SELECT version_number FROM model_versions 
      WHERE model_id = '${modelId}'
      ORDER BY version_number DESC
      LIMIT 1
    `);

    const newVersionNumber = latestVersions && latestVersions.length > 0
      ? latestVersions[0].version_number + 1
      : 1;

    const versionId = `ver_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await db.$executeRawUnsafe(`
      INSERT INTO model_versions (
        id, model_id, version_number, description, 
        experiment_id, metrics, artifact_path, tags, 
        status, created_by, created_at
      ) VALUES (
        '${versionId}', '${modelId}', ${newVersionNumber}, 
        '${description || ''}', '${experimentId || ''}', 
        '${JSON.stringify(metrics || {})}', '${artifactPath || ''}',
        '${JSON.stringify(tags || [])}', 'draft', 
        '${user!.id}', NOW()
      )
    `);

    return NextResponse.json({ 
      versionId,
      versionNumber: newVersionNumber,
      message: 'Model version created successfully' 
    });
  } catch (error) {
    console.error('Error creating model version:', error);
    return NextResponse.json(
      { error: 'Failed to create model version' },
      { status: 500 }
    );
  }
}
