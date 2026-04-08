/**
 * ML Model Details API
 * Endpoints for managing individual ML models
 * 
 * RBAC: ML.VIEW_MODELS, ML.MANAGE_MODELS
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, requireAuth } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';
import { logUserActivity } from '@/lib/audit';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/ml/models/[id] - Get model details
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // RBAC Check: ML.VIEW_MODELS
    const authResult = await requireFunction(req, ML.VIEW_MODELS);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const model = await prisma.mLModel.findUnique({
      where: { id: params.id },
      include: {
        trainingJobs: {
          orderBy: { createdAt: 'desc' },
        },
        predictions: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: model,
    });
  } catch (error: any) {
    console.error('Error fetching model:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ml/models/[id] - Update model
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    // RBAC Check: ML.MANAGE_MODELS
    const authResult = await requireFunction(req, ML.MANAGE_MODELS);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await req.json();

    // Check if model exists
    const existingModel = await prisma.mLModel.findUnique({
      where: { id: params.id },
    });

    if (!existingModel) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Update model
    const updatedModel = await prisma.mLModel.update({
      where: { id: params.id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    // Log activity
    await logUserActivity(
      user.id,
      'UPDATE_MODEL',
      `ml_models/${params.id}`,
      `Updated ML model: ${updatedModel.name}`
    );

    return NextResponse.json({
      success: true,
      data: updatedModel,
      message: 'Model updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating model:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ml/models/[id] - Delete model
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    // RBAC Check: ML.MANAGE_MODELS
    const authResult = await requireFunction(req, ML.MANAGE_MODELS);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    // Check if model exists
    const existingModel = await prisma.mLModel.findUnique({
      where: { id: params.id },
    });

    if (!existingModel) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Delete model
    await prisma.mLModel.delete({
      where: { id: params.id },
    });

    // Log activity
    await logUserActivity(
      user.id,
      'DELETE_MODEL',
      `ml_models/${params.id}`,
      `Deleted ML model: ${existingModel.name}`
    );

    return NextResponse.json({
      success: true,
      message: 'Model deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting model:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
