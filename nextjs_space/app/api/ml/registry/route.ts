/**
 * ML Model Registry API
 * Manage model versions and deployments
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { modelRegistry } from '@/lib/ml/model-registry';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/ml/registry - Get model versions
 * RBAC: ML.VIEW_MODELS
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, ML.VIEW_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const modelId = searchParams.get('modelId');
    const versionId = searchParams.get('versionId');
    const action = searchParams.get('action');

    if (versionId) {
      const version = await modelRegistry.getModelVersion(parseInt(versionId));
      return NextResponse.json({ success: true, data: version });
    }

    if (modelId) {
      if (action === 'production') {
        const version = await modelRegistry.getProductionVersion(parseInt(modelId));
        return NextResponse.json({ success: true, data: version });
      }

      if (action === 'latest') {
        const version = await modelRegistry.getLatestVersion(parseInt(modelId));
        return NextResponse.json({ success: true, data: version });
      }

      if (action === 'stats') {
        const stats = await modelRegistry.getModelStats(parseInt(modelId));
        return NextResponse.json({ success: true, data: stats });
      }

      const versions = await modelRegistry.getModelVersions(parseInt(modelId));
      return NextResponse.json({ success: true, data: versions, total: versions.length });
    }

    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in model registry GET:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ml/registry - Register new model version or manage versions
 * RBAC: ML.MANAGE_MODELS
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, ML.MANAGE_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { action, ...data } = body;

    if (action === 'register') {
      const versionId = await modelRegistry.registerModel(data);
      
      await logAudit({
        userId: user.id,
        functionCode: ML.MANAGE_MODELS,
        action: 'REGISTER',
        resourceType: 'MODEL_VERSION',
        resourceId: String(versionId),
        result: 'SUCCESS',
        newValue: JSON.stringify({ version: data.version, modelId: data.modelId })
      });

      return NextResponse.json({
        success: true,
        message: 'Model version registered successfully',
        data: { versionId }
      });
    }

    if (action === 'promote' && data.versionId) {
      await modelRegistry.promoteToProduction(data.versionId, user.id);
      
      await logAudit({
        userId: user.id,
        functionCode: ML.MANAGE_MODELS,
        action: 'PROMOTE',
        resourceType: 'MODEL_VERSION',
        resourceId: String(data.versionId),
        result: 'SUCCESS'
      });

      return NextResponse.json({
        success: true,
        message: 'Model version promoted to production'
      });
    }

    if (action === 'update_status' && data.versionId && data.status) {
      await modelRegistry.updateStatus(data.versionId, data.status);
      
      await logAudit({
        userId: user.id,
        functionCode: ML.MANAGE_MODELS,
        action: 'UPDATE_STATUS',
        resourceType: 'MODEL_VERSION',
        resourceId: String(data.versionId),
        result: 'SUCCESS',
        newValue: JSON.stringify({ status: data.status })
      });

      return NextResponse.json({
        success: true,
        message: 'Model version status updated'
      });
    }

    if (action === 'archive' && data.modelId) {
      const archived = await modelRegistry.archiveOldVersions(
        data.modelId,
        data.keepLatest || 5
      );

      await logAudit({
        userId: user.id,
        functionCode: ML.MANAGE_MODELS,
        action: 'ARCHIVE',
        resourceType: 'MODEL_VERSIONS',
        resourceId: String(data.modelId),
        result: 'SUCCESS',
        metadata: { archivedCount: archived }
      });

      return NextResponse.json({
        success: true,
        message: `Archived ${archived} old versions`,
        data: { archivedCount: archived }
      });
    }

    if (action === 'compare' && data.versionIds) {
      const comparison = await modelRegistry.compareVersions(data.versionIds);
      return NextResponse.json({
        success: true,
        data: comparison
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in model registry POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ml/registry - Delete model version
 * RBAC: ML.MANAGE_MODELS
 */
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, ML.MANAGE_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const versionId = searchParams.get('versionId');

    if (!versionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: versionId' },
        { status: 400 }
      );
    }

    await modelRegistry.deleteVersion(parseInt(versionId));

    await logAudit({
      userId: user.id,
      functionCode: ML.MANAGE_MODELS,
      action: 'DELETE',
      resourceType: 'MODEL_VERSION',
      resourceId: versionId,
      result: 'SUCCESS'
    });

    return NextResponse.json({
      success: true,
      message: 'Model version deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting model version:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
