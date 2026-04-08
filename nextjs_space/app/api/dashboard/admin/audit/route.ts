import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DASHBOARD } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authorization using Function-based RBAC
    const authResult = await requireFunction(request, DASHBOARD.VIEW_ADMIN);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // Demo data - recent audit logs
    const auditLogs = [
      {
        id: '1',
        action: 'LOGIN',
        user: 'Đại tá Nguyễn Văn A',
        resource: 'System',
        severity: 'LOW',
        success: true,
        ipAddress: '192.168.1.100',
        timestamp: new Date('2025-10-15T08:30:00')
      },
      {
        id: '2',
        action: 'UPLOAD',
        user: 'Thượng tá Trần Thị B',
        resource: 'Dataset: logistics_2024.csv',
        severity: 'MEDIUM',
        success: true,
        ipAddress: '192.168.1.105',
        timestamp: new Date('2025-10-15T09:15:00')
      },
      {
        id: '3',
        action: 'PERMISSION_CHANGE',
        user: 'Admin',
        resource: 'User: levanc@hvhc.edu.vn',
        severity: 'HIGH',
        success: true,
        ipAddress: '192.168.1.1',
        timestamp: new Date('2025-10-15T10:00:00')
      },
      {
        id: '4',
        action: 'FAILED_LOGIN',
        user: 'Unknown',
        resource: 'System',
        severity: 'MEDIUM',
        success: false,
        ipAddress: '10.0.0.45',
        timestamp: new Date('2025-10-15T10:15:00')
      },
      {
        id: '5',
        action: 'DELETE',
        user: 'Thượng tá Lê Văn C',
        resource: 'Model: old_classification_v1',
        severity: 'MEDIUM',
        success: true,
        ipAddress: '192.168.1.110',
        timestamp: new Date('2025-10-15T10:30:00')
      }
    ];

    return NextResponse.json({ auditLogs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
