/**
 * API: Login Audit Statistics
 * 
 * v8.3: Migrated to Function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';

/**
 * GET /api/auth/audit/stats
 * Get login audit statistics
 * Requires: VIEW_AUDIT_LOG
 */
export async function GET(request: NextRequest) {
  // RBAC Check: VIEW_AUDIT_LOG
  const authResult = await requireFunction(request, SYSTEM.VIEW_AUDIT_LOG);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Get daily statistics
    const dailyStats: any = await db.$queryRawUnsafe(`
      SELECT * FROM login_stats
      WHERE login_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY login_date DESC
    `);

    // Get suspicious logins
    const suspiciousLogins: any = await db.$queryRawUnsafe(`
      SELECT * FROM suspicious_logins
      LIMIT 20
    `);

    // Get overall statistics
    const overallStats: any = await db.$queryRawUnsafe(`
      SELECT
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE status = 'success') as successful_logins,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_logins,
        COUNT(*) FILTER (WHERE status = 'blocked') as blocked_attempts,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT ip_address) as unique_ips
      FROM login_audit
      WHERE created_at >= NOW() - INTERVAL '${days} days'
    `);

    // Get top users by login count
    const topUsers: any = await db.$queryRawUnsafe(`
      SELECT
        u.name,
        la.email,
        COUNT(*) as login_count,
        COUNT(*) FILTER (WHERE la.status = 'failed') as failed_count,
        MAX(la.created_at) as last_login
      FROM login_audit la
      LEFT JOIN users u ON la.user_id = u.id
      WHERE la.created_at >= NOW() - INTERVAL '${days} days'
        AND la.status = 'success'
      GROUP BY u.name, la.email
      ORDER BY login_count DESC
      LIMIT 10
    `);

    // Get top IPs
    const topIPs: any = await db.$queryRawUnsafe(`
      SELECT
        ip_address,
        location,
        COUNT(*) as attempt_count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count
      FROM login_audit
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY ip_address, location
      ORDER BY attempt_count DESC
      LIMIT 10
    `);

    return NextResponse.json({
      dailyStats,
      suspiciousLogins,
      overallStats: overallStats[0],
      topUsers,
      topIPs,
    });
  } catch (error) {
    console.error('Failed to fetch login audit statistics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
