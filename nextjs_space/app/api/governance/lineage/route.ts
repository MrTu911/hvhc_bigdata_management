/**
 * API: Data Lineage
 * GET /api/governance/lineage - Theo dõi nguồn gốc dữ liệu
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { GOVERNANCE } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

interface LineageNode {
  id: string;
  name: string;
  type: 'source' | 'transform' | 'destination';
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface LineageEdge {
  source: string;
  target: string;
  label?: string;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, GOVERNANCE.VIEW_LINEAGE);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('datasetId');

    const nodes: LineageNode[] = [];
    const edges: LineageEdge[] = [];

    // Lấy dữ liệu từ DataQuery
    const queries = await prisma.dataQuery.findMany({
      where: datasetId ? {
        parameters: {
          path: ['datasetId'],
          equals: datasetId,
        },
      } : undefined,
      orderBy: { submittedAt: 'desc' },
      take: 50,
    });

    // Tạo nodes từ queries
    queries.forEach((query, index) => {
      const nodeId = `query_${query.id}`;
      nodes.push({
        id: nodeId,
        name: `Query #${index + 1}: ${query.queryType}`,
        type: 'transform',
        timestamp: query.submittedAt,
        metadata: {
          queryType: query.queryType,
          status: query.status,
          executionTime: query.executionTime,
          rowsReturned: query.rowsReturned,
        },
      });

      // Tạo source node
      const sourceId = `source_${query.department || 'default'}`;
      if (!nodes.find(n => n.id === sourceId)) {
        nodes.push({
          id: sourceId,
          name: query.department || 'Dữ liệu gốc',
          type: 'source',
          timestamp: query.submittedAt,
        });
      }

      // Tạo edge
      edges.push({
        source: sourceId,
        target: nodeId,
        label: 'input',
      });

      // Nếu có kết quả, tạo destination node
      if (query.status === 'COMPLETED' && query.resultUrl) {
        const destId = `result_${query.id}`;
        nodes.push({
          id: destId,
          name: 'Kết quả Query',
          type: 'destination',
          timestamp: query.completedAt || query.submittedAt,
          metadata: {
            dataSize: query.dataSize,
            rowsReturned: query.rowsReturned,
          },
        });
        edges.push({
          source: nodeId,
          target: destId,
          label: 'output',
        });
      }
    });

    return NextResponse.json({
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Data lineage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
