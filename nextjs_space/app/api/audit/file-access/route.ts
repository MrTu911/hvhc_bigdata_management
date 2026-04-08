/**
 * File Access Audit API
 * Endpoints for querying file access logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { AUDIT } from '@/lib/rbac/function-codes';

/**
 * GET /api/audit/file-access - Get file access logs
 */
export async function GET(req: NextRequest) {
  try {
    // RBAC: Require VIEW_LOGS permission
    const authResult = await requireFunction(req, AUDIT.VIEW_LOGS);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const fileId = searchParams.get('fileId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const success = searchParams.get('success');

    const where: any = {};
    if (fileId) where.fileId = fileId;
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (success !== null) where.success = success === 'true';

    const [logs, total] = await Promise.all([
      prisma.fileAccessLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          file: {
            select: {
              fileName: true,
              originalName: true,
              classification: true,
            },
          },
        },
      }),
      prisma.fileAccessLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
