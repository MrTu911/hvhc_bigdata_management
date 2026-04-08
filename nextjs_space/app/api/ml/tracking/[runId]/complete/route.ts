/**
 * API Route: Complete ML Run
 * POST /api/ml/tracking/[runId]/complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { ML } from '@/lib/rbac/function-codes';
import { prisma as db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const authResult = await requireFunction(request, ML.TRAIN_MODELS);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const { runId } = params;
    const body = await request.json();
    const { status = 'FINISHED' } = body;

    const endTime = Date.now();

    await db.$executeRaw`
      UPDATE ml_runs
      SET status = ${status}, end_time = ${endTime}
      WHERE run_id = ${runId}
    `;

    return NextResponse.json({
      success: true,
      status,
      endTime,
    });
  } catch (error: any) {
    console.error('Complete run error:', error);
    return NextResponse.json(
      { error: 'Failed to complete run', details: error.message },
      { status: 500 }
    );
  }
}
