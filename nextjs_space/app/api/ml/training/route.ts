/**
 * ML Training Jobs API
 * Endpoints for managing training jobs
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/ml/training - List training jobs
 * RBAC: ML.VIEW_MODELS
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, ML.VIEW_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const modelId = searchParams.get('modelId');

    const where: any = {};
    if (status) where.status = status;
    if (modelId) where.modelId = modelId;

    const [jobs, total] = await Promise.all([
      prisma.trainingJob.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          model: {
            select: {
              id: true,
              name: true,
              modelType: true,
              framework: true,
            },
          },
        },
      }),
      prisma.trainingJob.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching training jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ml/training - Create training job
 * RBAC: ML.TRAIN_MODELS
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, ML.TRAIN_MODELS);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const body = await req.json();
    const {
      modelId,
      jobName,
      config,
      hyperparameters,
      trainingDataset,
      validationDataset,
      testDataset,
      gpuAllocated,
      cpuAllocated,
      memoryAllocated,
      totalEpochs,
    } = body;

    // Validate required fields
    if (!modelId || !jobName) {
      return NextResponse.json(
        { error: 'Missing required fields: modelId, jobName' },
        { status: 400 }
      );
    }

    // Check if model exists
    const model = await prisma.mLModel.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Create training job
    const job = await prisma.trainingJob.create({
      data: {
        modelId,
        jobName,
        config,
        hyperparameters,
        trainingDataset,
        validationDataset,
        testDataset,
        gpuAllocated,
        cpuAllocated,
        memoryAllocated,
        totalEpochs,
        status: 'QUEUED',
      },
    });

    // Update model status
    await prisma.mLModel.update({
      where: { id: modelId },
      data: { status: 'TRAINING' },
    });

    // Log activity
    await logAudit({
      userId: user.id,
      functionCode: ML.TRAIN_MODELS,
      action: 'CREATE',
      resourceType: 'TRAINING_JOB',
      resourceId: job.id,
      result: 'SUCCESS',
      newValue: JSON.stringify({ jobName, modelId, modelName: model.name })
    });

    return NextResponse.json({
      success: true,
      data: job,
      message: 'Training job created successfully',
    });
  } catch (error: any) {
    console.error('Error creating training job:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
