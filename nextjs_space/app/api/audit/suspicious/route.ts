/**
 * Suspicious Activity Detection API
 * Endpoints for security monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { AUDIT } from '@/lib/rbac/function-codes';

/**
 * GET /api/audit/suspicious - Get suspicious activities
 */
export async function GET(req: NextRequest) {
  try {
    // RBAC: Require VIEW_SUSPICIOUS permission
    const authResult = await requireFunction(req, AUDIT.VIEW_SUSPICIOUS);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(req.url);
    const hours = parseInt(searchParams.get('hours') || '24');

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get failed access attempts
    const failedAccess = await prisma.fileAccessLog.findMany({
      where: {
        success: false,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
      include: {
        file: {
          select: {
            fileName: true,
            classification: true,
          },
        },
      },
    });

    // Group by user and IP to detect patterns
    const userAttempts: Record<string, number> = {};
    const ipAttempts: Record<string, number> = {};

    failedAccess.forEach((log) => {
      userAttempts[log.userId] = (userAttempts[log.userId] || 0) + 1;
      if (log.ipAddress) {
        ipAttempts[log.ipAddress] = (ipAttempts[log.ipAddress] || 0) + 1;
      }
    });

    // Identify suspicious users (>5 failed attempts)
    const suspiciousUsers = Object.entries(userAttempts)
      .filter(([_, count]) => count > 5)
      .map(([userId, count]) => ({ userId, failedAttempts: count }));

    // Identify suspicious IPs (>10 failed attempts)
    const suspiciousIPs = Object.entries(ipAttempts)
      .filter(([_, count]) => count > 10)
      .map(([ipAddress, count]) => ({ ipAddress, failedAttempts: count }));

    return NextResponse.json({
      success: true,
      data: {
        failedAccess,
        suspiciousUsers,
        suspiciousIPs,
        summary: {
          totalFailedAttempts: failedAccess.length,
          uniqueUsers: Object.keys(userAttempts).length,
          uniqueIPs: Object.keys(ipAttempts).length,
          timeWindow: `Last ${hours} hours`,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching suspicious activities:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
