/**
 * ML Experiments API
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { prisma as db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

/**
 * GET - Lấy danh sách experiments
 * RBAC: ML.VIEW_MODELS
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, ML.VIEW_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const searchParams = request.nextUrl.searchParams;
    const modelId = searchParams.get('modelId');
    const status = searchParams.get('status');

    // Use parameterized query to prevent SQL injection
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (modelId) {
      conditions.push('model_id = $1');
      params.push(modelId);
    }
    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const experiments = await db.$queryRawUnsafe(`
      SELECT * FROM ml_experiments 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 50
    `, ...params);

    return NextResponse.json({ experiments });
  } catch (error) {
    console.error('Error fetching experiments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiments' },
      { status: 500 }
    );
  }
}

/**
 * POST - Tạo experiment mới
 * RBAC: ML.MANAGE_MODELS
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, ML.MANAGE_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { 
      name, 
      description, 
      modelId, 
      parameters, 
      tags 
    } = body;

    // Validate input
    if (!name || !modelId) {
      return NextResponse.json(
        { error: 'Name and modelId are required' },
        { status: 400 }
      );
    }

    const experimentId = `exp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await db.$executeRawUnsafe(`
      INSERT INTO ml_experiments (
        id, name, description, model_id, parameters, tags, 
        status, created_by, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'running', $7, NOW()
      )
    `, experimentId, name, description || '', modelId, 
       JSON.stringify(parameters || {}), JSON.stringify(tags || []), user.id);

    await logAudit({
      userId: user.id,
      functionCode: ML.MANAGE_MODELS,
      action: 'CREATE',
      resourceType: 'ML_EXPERIMENT',
      resourceId: experimentId,
      result: 'SUCCESS',
      newValue: JSON.stringify({ name, modelId, parameters, tags })
    });

    return NextResponse.json({ 
      experimentId,
      message: 'Experiment created successfully' 
    });
  } catch (error) {
    console.error('Error creating experiment:', error);
    return NextResponse.json(
      { error: 'Failed to create experiment' },
      { status: 500 }
    );
  }
}
