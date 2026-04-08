/**
 * ML Engine Prediction Proxy API
 * Forwards prediction requests to ML Engine (FastAPI)
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

const ML_ENGINE_URL = process.env.ML_ENGINE_URL || 'http://localhost:8001';

/**
 * POST /api/ml-engine/predict - Make predictions via ML Engine
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
    
    // Forward to ML Engine
    const response = await fetch(`${ML_ENGINE_URL}/api/ml/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      await logAudit({
        userId: user.id,
        functionCode: ML.MANAGE_MODELS,
        action: 'PREDICT',
        resourceType: 'ML_MODEL',
        result: 'FAIL',
        metadata: { error: data.detail || 'Prediction failed' }
      });
      return NextResponse.json(
        { error: data.detail || 'Prediction failed' },
        { status: response.status }
      );
    }

    await logAudit({
      userId: user.id,
      functionCode: ML.MANAGE_MODELS,
      action: 'PREDICT',
      resourceType: 'ML_MODEL',
      resourceId: body.modelId,
      result: 'SUCCESS'
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying to ML Engine:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to ML Engine', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}
