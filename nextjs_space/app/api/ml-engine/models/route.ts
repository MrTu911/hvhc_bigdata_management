/**
 * ML Engine Models Proxy API
 * Forwards model listing requests to ML Engine (FastAPI)
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';

const ML_ENGINE_URL = process.env.ML_ENGINE_URL || 'http://localhost:8001';

/**
 * GET /api/ml-engine/models - List all trained models
 * RBAC: ML.VIEW_MODELS
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, ML.VIEW_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }

    // Forward to ML Engine
    const response = await fetch(`${ML_ENGINE_URL}/api/ml/list`, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to fetch models' },
        { status: response.status }
      );
    }

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
