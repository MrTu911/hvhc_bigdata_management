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

    // Demo data - system services
    const services = [
      {
        id: '1',
        name: 'PostgreSQL',
        type: 'DATABASE',
        status: 'HEALTHY',
        uptime: 99.8,
        responseTime: 12,
        lastChecked: new Date()
      },
      {
        id: '2',
        name: 'MinIO',
        type: 'STORAGE',
        status: 'HEALTHY',
        uptime: 99.9,
        responseTime: 45,
        lastChecked: new Date()
      },
      {
        id: '3',
        name: 'Apache Airflow',
        type: 'ETL',
        status: 'HEALTHY',
        uptime: 98.5,
        responseTime: 230,
        lastChecked: new Date()
      },
      {
        id: '4',
        name: 'ClickHouse',
        type: 'ANALYTICS',
        status: 'HEALTHY',
        uptime: 99.2,
        responseTime: 89,
        lastChecked: new Date()
      },
      {
        id: '5',
        name: 'Prometheus',
        type: 'MONITORING',
        status: 'HEALTHY',
        uptime: 99.5,
        responseTime: 34,
        lastChecked: new Date()
      },
      {
        id: '6',
        name: 'Grafana',
        type: 'MONITORING',
        status: 'HEALTHY',
        uptime: 99.3,
        responseTime: 156,
        lastChecked: new Date()
      },
      {
        id: '7',
        name: 'Apache Kafka',
        type: 'STREAMING',
        status: 'HEALTHY',
        uptime: 99.7,
        responseTime: 23,
        lastChecked: new Date()
      },
      {
        id: '8',
        name: 'Hadoop HDFS',
        type: 'STORAGE',
        status: 'DEGRADED',
        uptime: 95.2,
        responseTime: 450,
        lastChecked: new Date()
      },
      {
        id: '9',
        name: 'Apache Spark',
        type: 'COMPUTE',
        status: 'HEALTHY',
        uptime: 98.8,
        responseTime: 312,
        lastChecked: new Date()
      }
    ];

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
