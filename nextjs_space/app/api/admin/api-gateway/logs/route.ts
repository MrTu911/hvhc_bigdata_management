import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require MANAGE_API_GATEWAY permission
    const authResult = await requireFunction(request, SYSTEM.MANAGE_API_GATEWAY);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const apiKeyId = searchParams.get('apiKeyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const endpoint = searchParams.get('endpoint');
    const statusCode = searchParams.get('statusCode');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (apiKeyId) where.apiKeyId = apiKeyId;
    if (endpoint) where.endpoint = { contains: endpoint, mode: 'insensitive' };
    if (statusCode) where.statusCode = parseInt(statusCode);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.externalApiLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          apiKey: {
            select: { name: true, keyPrefix: true }
          }
        }
      }),
      prisma.externalApiLog.count({ where })
    ]);

    // Get statistics
    const stats = await prisma.externalApiLog.groupBy({
      by: ['statusCode'],
      where,
      _count: true,
    });

    const avgResponseTime = await prisma.externalApiLog.aggregate({
      where,
      _avg: { responseTime: true },
    });

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        byStatusCode: stats,
        avgResponseTime: Math.round(avgResponseTime._avg.responseTime || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching API logs:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
