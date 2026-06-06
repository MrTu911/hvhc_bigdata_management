/**
 * API: Login Audit Logs
 * 
 * v8.3: Migrated to Function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';
import { verifyInternalToken } from '@/lib/auth/internal-auth';

/**
 * GET /api/auth/audit
 * Retrieve login audit logs
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status'); // 'success', 'failed', 'blocked'
    const email = searchParams.get('email');

    // Build parameterized WHERE clause to prevent SQL injection.
    const conditions: string[] = [];
    const filterParams: any[] = [];
    if (status) {
      filterParams.push(status);
      conditions.push(`status = $${filterParams.length}`);
    }
    if (email) {
      filterParams.push(`%${email}%`);
      conditions.push(`email ILIKE $${filterParams.length}`);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Fetch logs (limit/offset bound as parameters after the filters)
    const logs = await db.$queryRawUnsafe(`
      SELECT
        id,
        user_id,
        email,
        ip_address,
        user_agent,
        location,
        status,
        failure_reason,
        login_method,
        session_id,
        created_at
      FROM login_audit
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${filterParams.length + 1} OFFSET $${filterParams.length + 2}
    `, ...filterParams, limit, offset);

    // Get total count
    const countResult: any = await db.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM login_audit
      ${whereClause}
    `, ...filterParams);

    const total = parseInt(countResult[0]?.count || '0');

    return NextResponse.json({
      logs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Failed to fetch login audit logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/auth/audit
 * Create a login audit log entry.
 * Internal/server-to-server only — protected by INTERNAL_API_SECRET Bearer token
 * (login happens pre-session, so this cannot use RBAC). Prevents audit-log spoofing.
 */
export async function POST(request: NextRequest) {
  try {
    const internalAuth = verifyInternalToken(request);
    if (!internalAuth.authorized) {
      return NextResponse.json(
        { error: internalAuth.reason || 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, userId, ipAddress, userAgent, location, status, failureReason, loginMethod, sessionId } =
      body;

    if (!email || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert log (all values bound as parameters to prevent SQL injection)
    await db.$executeRawUnsafe(`
      INSERT INTO login_audit (
        user_id,
        email,
        ip_address,
        user_agent,
        location,
        status,
        failure_reason,
        login_method,
        session_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
    `,
      userId ?? null,
      email,
      ipAddress ?? null,
      userAgent ?? null,
      location ?? null,
      status,
      failureReason ?? null,
      loginMethod ?? null,
      sessionId ?? null,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create login audit log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
