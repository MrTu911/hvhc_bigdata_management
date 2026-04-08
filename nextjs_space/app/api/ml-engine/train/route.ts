/**
 * ML Engine Training Proxy API
 * Forwards training requests to ML Engine (FastAPI)
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

const ML_ENGINE_URL = process.env.ML_ENGINE_URL || 'http://localhost:8001';

/**
 * POST /api/ml-engine/train - Train a model via ML Engine
 * RBAC: ML.TRAIN_MODELS
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, ML.TRAIN_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    // Get form data from request
    const formData = await req.formData();
    
    // Forward to ML Engine
    const response = await fetch(`${ML_ENGINE_URL}/api/ml/train`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      await logAudit({
        userId: user.id,
        functionCode: ML.TRAIN_MODELS,
        action: 'TRAIN',
        resourceType: 'ML_MODEL',
        result: 'FAIL',
        metadata: { error: data.detail || 'Training failed' }
      });
      return NextResponse.json(
        { error: data.detail || 'Training failed' },
        { status: response.status }
      );
    }

    await logAudit({
      userId: user.id,
      functionCode: ML.TRAIN_MODELS,
      action: 'TRAIN',
      resourceType: 'ML_MODEL',
      resourceId: data.modelId || data.jobId,
      result: 'SUCCESS',
      newValue: JSON.stringify(data)
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying to ML Engine:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to ML Engine', 
        message: error.message,
        hint: 'Make sure ML Engine is running on port 8001'
      },
      { status: 500 }
    );
  }
}
