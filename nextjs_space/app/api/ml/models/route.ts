/**
 * ML Models API
 * Endpoints for managing machine learning models
 * 
 * RBAC: ML.VIEW_MODELS, ML.MANAGE_MODELS
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, requireAuth } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';
import { logUserActivity } from '@/lib/audit';

/**
 * GET /api/ml/models - List all ML models
 */
export async function GET(req: NextRequest) {
  try {
    // RBAC Check: ML.VIEW_MODELS
    const authResult = await requireFunction(req, ML.VIEW_MODELS);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const modelType = searchParams.get('modelType');
    const framework = searchParams.get('framework');

    const where: any = {};
    if (status) where.status = status;
    if (modelType) where.modelType = modelType;
    if (framework) where.framework = framework;

    const [models, total] = await Promise.all([
      prisma.mLModel.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          trainingJobs: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.mLModel.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: models,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching ML models:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ml/models - Create new ML model
 */
export async function POST(req: NextRequest) {
  try {
    // RBAC Check: ML.MANAGE_MODELS
    const authResult = await requireFunction(req, ML.MANAGE_MODELS);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await req.json();
    const {
      name,
      description,
      modelType,
      framework,
      classification = 'INTERNAL',
      trainingDatasetId,
      validationDatasetId,
      hyperparameters,
      trainingConfig,
      tags,
    } = body;

    // Validate required fields
    if (!name || !modelType || !framework) {
      return NextResponse.json(
        { error: 'Missing required fields: name, modelType, framework' },
        { status: 400 }
      );
    }

    // Create model
    const model = await prisma.mLModel.create({
      data: {
        name,
        description,
        modelType,
        framework,
        ownerId: user.id,
        department: user.department,
        classification,
        trainingDatasetId,
        validationDatasetId,
        hyperparameters,
        trainingConfig,
        tags: tags || [],
        status: 'DRAFT',
      },
    });

    // Log activity
    await logUserActivity(
      user.id,
      'CREATE_MODEL',
      `ml_models/${model.id}`,
      `Created ML model: ${name}`
    );

    return NextResponse.json({
      success: true,
      data: model,
      message: 'Model created successfully',
    });
  } catch (error: any) {
    console.error('Error creating ML model:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
