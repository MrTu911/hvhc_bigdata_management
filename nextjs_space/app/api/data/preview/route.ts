/**
 * API: Preview dataset
 * GET /api/data/preview?datasetId=123&rows=100
 * RBAC: DATA.VIEW
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DATA } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // RBAC Check
    const auth = await requireFunction(request, DATA.VIEW);
    if (!auth.allowed) {
      return auth.response!;
    }
    const { user } = auth;

    const searchParams = request.nextUrl.searchParams;
    const datasetId = searchParams.get('datasetId');
    const rows = parseInt(searchParams.get('rows') || '100');

    if (!datasetId) {
      return NextResponse.json({ error: 'datasetId is required' }, { status: 400 });
    }

    // Mock data for preview
    const mockSchema = [
      { name: 'id', type: 'NUMBER', nullCount: 0, uniqueCount: 1000, minValue: '1', maxValue: '1000', sampleValues: [1, 2, 3, 4, 5] },
      { name: 'timestamp', type: 'DATE', nullCount: 0, uniqueCount: 1000, minValue: '2024-01-01', maxValue: '2024-12-31', sampleValues: ['2024-01-15', '2024-02-20', '2024-03-10'] },
      { name: 'unit', type: 'STRING', nullCount: 5, uniqueCount: 10, sampleValues: ['Battalion A', 'Battalion B', 'Battalion C'] },
      { name: 'fuel_consumed', type: 'NUMBER', nullCount: 2, uniqueCount: 800, minValue: '0', maxValue: '5000', sampleValues: [1250, 1800, 2100, 950, 3200] },
      { name: 'distance_km', type: 'NUMBER', nullCount: 1, uniqueCount: 900, minValue: '0', maxValue: '500', sampleValues: [120, 250, 180, 95, 320] },
      { name: 'mission_type', type: 'STRING', nullCount: 0, uniqueCount: 5, sampleValues: ['Training', 'Patrol', 'Transport', 'Emergency', 'Maintenance'] },
    ];

    const mockRows = [];
    for (let i = 0; i < Math.min(rows, 100); i++) {
      mockRows.push({
        _rowId: i + 1,
        id: i + 1,
        timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        unit: ['Battalion A', 'Battalion B', 'Battalion C', 'Battalion D', 'Battalion E'][Math.floor(Math.random() * 5)],
        fuel_consumed: Math.floor(Math.random() * 5000),
        distance_km: Math.floor(Math.random() * 500),
        mission_type: ['Training', 'Patrol', 'Transport', 'Emergency', 'Maintenance'][Math.floor(Math.random() * 5)],
      });
    }

    const previewData = {
      dataset: {
        id: parseInt(datasetId),
        name: `Dataset_${datasetId}.csv`,
        size: 2456789,
        uploadedBy: user!.name || 'Unknown',
        uploadedAt: new Date().toISOString(),
        processingStatus: 'COMPLETED',
        qualityScore: 87.5,
        rowCount: 1000,
        columnCount: 6
      },
      schema: mockSchema,
      quality: {
        totalRows: 1000,
        totalColumns: 6,
        nullPercentage: 0.8,
        duplicateRows: 3,
        qualityScore: 87.5,
        calculatedAt: new Date().toISOString()
      },
      processing: {
        status: 'COMPLETED',
        processType: 'PREVIEW',
        completedAt: new Date().toISOString()
      },
      rows: mockRows
    };

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: DATA.VIEW,
      action: 'VIEW',
      resourceType: 'DATASET_PREVIEW',
      resourceId: datasetId,
      metadata: { rows },
      result: 'SUCCESS',
    });

    return NextResponse.json(previewData);

  } catch (error: any) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { error: 'Failed to preview data', details: error.message },
      { status: 500 }
    );
  }
}
