/**
 * API: Data Query Execution
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DATA } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { executeQuery, validateQuery } from '@/lib/query-executor';
import { QueryType, QueryStatus } from '@prisma/client';
import { logAudit } from '@/lib/audit';

/**
 * POST - Thực thi query trên các hệ thống BigData
 * RBAC: DATA.QUERY
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, DATA.QUERY);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    // Parse request body
    const body = await request.json();
    const { queryText, queryType, department, parameters } = body;

    // Validate inputs
    if (!queryText || !queryType) {
      return NextResponse.json(
        { success: false, error: 'Missing query text or query type' },
        { status: 400 }
      );
    }

    // Validate query safety
    const validation = validateQuery(queryText);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.reason },
        { status: 400 }
      );
    }

    // Map queryType string to enum
    const queryTypeMap: Record<string, QueryType> = {
      'POSTGRESQL': QueryType.POSTGRESQL,
      'CLICKHOUSE': QueryType.CLICKHOUSE,
      'HADOOP': QueryType.HADOOP,
      'SPARK': QueryType.SPARK,
      'CUSTOM': QueryType.CUSTOM,
    };
    const mappedQueryType = queryTypeMap[queryType] || QueryType.POSTGRESQL;

    // Tạo query record trong database
    const dataQuery = await prisma.dataQuery.create({
      data: {
        queryText,
        queryType: mappedQueryType,
        executedBy: user.id,
        department,
        status: QueryStatus.RUNNING,
        parameters: parameters || {},
        startedAt: new Date(),
      },
    });

    try {
      // Thực thi query
      const result = await executeQuery(mappedQueryType, queryText, parameters);

      // Calculate data size (rough estimate)
      const dataSize = (JSON.stringify(result.rows).length / (1024 * 1024)).toFixed(2);

      // Update query record với kết quả
      await prisma.dataQuery.update({
        where: { id: dataQuery.id },
        data: {
          status: QueryStatus.COMPLETED,
          executionTime: result.executionTime,
          rowsReturned: result.rowCount,
          dataSize: parseFloat(dataSize),
          completedAt: new Date(),
        },
      });

      await logAudit({
        userId: user.id,
        functionCode: DATA.QUERY,
        action: 'EXECUTE',
        resourceType: 'DATA_QUERY',
        resourceId: dataQuery.id,
        result: 'SUCCESS',
        metadata: {
          queryType: mappedQueryType,
          executionTime: result.executionTime,
          rowsReturned: result.rowCount
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          queryId: dataQuery.id,
          rows: result.rows,
          rowCount: result.rowCount,
          executionTime: result.executionTime,
          dataSize: parseFloat(dataSize),
        },
        message: 'Query executed successfully',
      });
    } catch (executionError: any) {
      // Query failed - update status
      await prisma.dataQuery.update({
        where: { id: dataQuery.id },
        data: {
          status: QueryStatus.FAILED,
          errorMessage: executionError.message,
          completedAt: new Date(),
        },
      });

      return NextResponse.json(
        { 
          success: false, 
          error: executionError.message,
          queryId: dataQuery.id 
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Query execution error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Query execution failed' },
      { status: 500 }
    );
  }
}

/**
 * GET: Lấy lịch sử query
 * RBAC: DATA.VIEW
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, DATA.VIEW);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const queryType = searchParams.get('queryType');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { executedBy: user.id };
    if (queryType) where.queryType = queryType;
    if (status) where.status = status;

    // Query database
    const [queries, total] = await Promise.all([
      prisma.dataQuery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          queryText: true,
          queryType: true,
          status: true,
          executionTime: true,
          rowsReturned: true,
          dataSize: true,
          errorMessage: true,
          submittedAt: true,
          completedAt: true,
        },
      }),
      prisma.dataQuery.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        queries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get query history error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get query history' },
      { status: 500 }
    );
  }
}
