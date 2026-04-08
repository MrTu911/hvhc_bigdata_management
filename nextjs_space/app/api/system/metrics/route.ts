import { requireFunction } from "@/lib/rbac/middleware";
import { SYSTEM } from "@/lib/rbac/function-codes";

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/system/metrics - Get system metrics
 * RBAC: SYSTEM.VIEW_SYSTEM_STATS
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, SYSTEM.VIEW_SYSTEM_STATS);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const hours = parseInt(searchParams.get('hours') || '1');
    
    let query = `
      SELECT 
        metric_category,
        metric_name,
        metric_value,
        metric_unit,
        recorded_at
      FROM system_metrics
      WHERE recorded_at >= NOW() - INTERVAL '${hours} hours'
    `;
    
    const params: any[] = [];
    
    if (category) {
      query += ' AND metric_category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY recorded_at DESC LIMIT 1000';
    
    const result = await db.query(query, params);
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching system metrics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/system/metrics - Record system metric
 * RBAC: SYSTEM.VIEW_SYSTEM_STATS
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, SYSTEM.VIEW_SYSTEM_STATS);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const body = await request.json();
    
    await db.query(
      `INSERT INTO system_metrics 
       (metric_category, metric_name, metric_value, metric_unit, instance_id, labels)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        body.metric_category,
        body.metric_name,
        body.metric_value,
        body.metric_unit,
        body.instance_id,
        body.labels ? JSON.stringify(body.labels) : null
      ]
    );
    
    return NextResponse.json({
      success: true,
      message: 'Metric recorded successfully'
    });
  } catch (error: any) {
    console.error('Error recording metric:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
