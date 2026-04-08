/**
 * API Route: Security Policy
 * GET /api/security/policy - Get current security policy
 * PUT /api/security/policy - Update security policy
 * 
 * RBAC: SECURITY.VIEW_POLICY, SECURITY.MANAGE_POLICY
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, requireAuth } from '@/lib/rbac/middleware';
import { SECURITY } from '@/lib/rbac/function-codes';
import { getPasswordPolicy } from '@/lib/security/password-policy';
import { prisma as db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // RBAC Check: SECURITY.VIEW_POLICY
    const authResult = await requireFunction(request, SECURITY.VIEW_POLICY);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const policy = await getPasswordPolicy();
    
    // Get all security settings
    const settings = await db.$queryRaw`
      SELECT setting_key, setting_value, description
      FROM security_settings
      ORDER BY setting_key
    `;

    return NextResponse.json({
      success: true,
      policy,
      settings,
    });
  } catch (error: any) {
    console.error('Get security policy error:', error);
    return NextResponse.json(
      { error: 'Failed to get security policy', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // RBAC Check: SECURITY.MANAGE_POLICY
    const authResult = await requireFunction(request, SECURITY.MANAGE_POLICY);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 });
    }

    // Update settings
    for (const [key, value] of Object.entries(settings)) {
      await db.$executeRaw`
        UPDATE security_settings
        SET setting_value = ${String(value)}, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = ${key}
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Security policy updated successfully',
    });
  } catch (error: any) {
    console.error('Update security policy error:', error);
    return NextResponse.json(
      { error: 'Failed to update security policy', details: error.message },
      { status: 500 }
    );
  }
}
