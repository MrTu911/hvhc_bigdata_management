/**
 * ML Engine Health Check Proxy API
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';

const ML_ENGINE_URL = process.env.ML_ENGINE_URL || 'http://localhost:8001';

/**
 * GET /api/ml-engine/health - Check ML Engine health
 * RBAC: ML.VIEW_MODELS
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, ML.VIEW_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const response = await fetch(`${ML_ENGINE_URL}/health`, {
      method: 'GET',
    });

    const data = await response.json();

    return NextResponse.json({
      success: response.ok,
      mlEngineUrl: ML_ENGINE_URL,
      ...data
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        mlEngineUrl: ML_ENGINE_URL,
        error: 'ML Engine không khả dụng', 
        message: error.message,
        hint: 'Vui lòng khởi động ML Engine: cd ml_engine && python main.py'
      },
      { status: 503 }
    );
  }
}
