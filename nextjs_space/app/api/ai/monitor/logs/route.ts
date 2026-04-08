/**
 * API endpoint cho AI Logs
 * RBAC: AI.VIEW_MONITOR
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

export async function GET(request: NextRequest) {
  try {
    // RBAC Check: AI.VIEW_MONITOR
    const authResult = await requireFunction(request, AI.VIEW_MONITOR);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const provider = searchParams.get('provider');
    const success = searchParams.get('success');

    const where: any = {};
    if (provider) {
      where.provider = provider;
    }
    if (success !== null && success !== undefined && success !== '') {
      where.success = success === 'true';
    }

    const [logs, total] = await Promise.all([
      prisma.aIApiLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.aIApiLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching AI logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI logs' },
      { status: 500 }
    );
  }
}
