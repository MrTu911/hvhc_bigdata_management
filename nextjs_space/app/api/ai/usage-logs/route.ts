import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { AI } from '@/lib/rbac/function-codes';

/**
 * AI Usage Logs API
 * GET /api/ai/usage-logs - List AI usage logs with filtering and pagination
 * POST /api/ai/usage-logs - Create new AI usage log (internal use)
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const userPermissions = session.user.functionCodes || [];
    const hasPermission = userPermissions.includes(AI.VIEW_MONITOR) ||
                         userPermissions.includes('ADMIN');

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('userId');
    const model = searchParams.get('model');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (model) {
      where.model = model;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await prisma.aIUsageLog.count({ where });

    // Get logs with pagination
    const logs = await prisma.aIUsageLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get statistics
    const stats = await prisma.aIUsageLog.groupBy({
      by: ['model'],
      _count: {
        id: true,
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        estimatedCost: true,
      },
      where,
    });

    const modelStats = stats.reduce((acc: Record<string, { count: number; totalInputTokens: number; totalOutputTokens: number; totalCost: number }>, stat: any) => {
      acc[stat.model] = {
        count: stat._count.id,
        totalInputTokens: stat._sum.inputTokens || 0,
        totalOutputTokens: stat._sum.outputTokens || 0,
        totalCost: stat._sum.estimatedCost || 0,
      };
      return acc;
    }, {});

    // Get user activity stats
    const userStats = await prisma.aIUsageLog.groupBy({
      by: ['userId'],
      _count: {
        id: true,
      },
      where,
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    const topUsers = await Promise.all(
      userStats.map(async (stat: any) => {
        const user = await prisma.user.findUnique({
          where: { id: stat.userId },
          select: { id: true, name: true, email: true, role: true },
        });
        return {
          user,
          count: stat._count.id,
        };
      })
    );

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total,
        byModel: modelStats,
        topUsers,
      },
    });

  } catch (error) {
    console.error('Error fetching AI usage logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { promptVersion, model, inputTokens, outputTokens, inputHash, success, errorMessage, estimatedCost } = body;

    if (!model) {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      );
    }

    const log = await prisma.aIUsageLog.create({
      data: {
        userId: session.user.id,
        promptVersion,
        model,
        inputTokens,
        outputTokens,
        inputHash,
        success,
        errorMessage,
        estimatedCost,
      },
    });

    return NextResponse.json(log, { status: 201 });

  } catch (error) {
    console.error('Error creating AI usage log:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}