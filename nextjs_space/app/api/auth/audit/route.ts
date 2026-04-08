/**
 * API: Login Audit Logs
 * 
 * v8.3: Migrated to Function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';

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

    // Build query
    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }
    if (email) {
      whereClause.email = { contains: email, mode: 'insensitive' };
    }

    // Fetch logs
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
      ${status || email ? 'WHERE' : ''}
      ${status ? "status = '" + status + "'" : ''}
      ${status && email ? 'AND' : ''}
      ${email ? "email ILIKE '%" + email + "%'" : ''}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    // Get total count
    const countResult: any = await db.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM login_audit
      ${status || email ? 'WHERE' : ''}
      ${status ? "status = '" + status + "'" : ''}
      ${status && email ? 'AND' : ''}
      ${email ? "email ILIKE '%" + email + "%'" : ''}
    `);

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
 * Create a login audit log entry
 * Internal use only (called by auth handlers)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId, ipAddress, userAgent, location, status, failureReason, loginMethod, sessionId } =
      body;

    if (!email || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert log
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
        ${userId ? userId : 'NULL'},
        '${email}',
        ${ipAddress ? "'" + ipAddress + "'" : 'NULL'},
        ${userAgent ? "'" + userAgent.replace(/'/g, "''") + "'" : 'NULL'},
        ${location ? "'" + location + "'" : 'NULL'},
        '${status}',
        ${failureReason ? "'" + failureReason.replace(/'/g, "''") + "'" : 'NULL'},
        ${loginMethod ? "'" + loginMethod + "'" : 'NULL'},
        ${sessionId ? "'" + sessionId + "'" : 'NULL'}
      )
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create login audit log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
