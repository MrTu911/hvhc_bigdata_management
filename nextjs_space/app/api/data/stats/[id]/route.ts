/**
 * API: Get detailed statistics for dataset
 * GET /api/data/stats/[id]
 * RBAC: DATA.VIEW
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DATA } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { db } from '@/lib/db-query';
import { minioClient, RESEARCH_BUCKET as DATASETS_BUCKET } from '@/lib/minio-client';
import { parseFile } from '@/lib/data-processor';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC Check
    const auth = await requireFunction(request, DATA.VIEW);
    if (!auth.allowed) {
      return auth.response!;
    }
    const { user } = auth;

    const datasetId = parseInt(params.id);
    if (isNaN(datasetId)) {
      return NextResponse.json({ error: 'Invalid dataset ID' }, { status: 400 });
    }

    // Get dataset info
    const result = await db.query(
      `SELECT id, filename, file_path, file_type, title
       FROM research_files 
       WHERE id = $1`,
      [datasetId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const dataset = result.rows[0];

    // Check for cached stats
    const cachedStats = await db.query(
      `SELECT processing_details FROM data_processing_logs
       WHERE dataset_id = $1 AND process_type = 'STATS' AND status = 'COMPLETED'
       ORDER BY completed_at DESC LIMIT 1`,
      [datasetId]
    );

    if (cachedStats.rows.length > 0) {
      // Audit log
      await logAudit({
        userId: user!.id,
        functionCode: DATA.VIEW,
        action: 'VIEW',
        resourceType: 'DATASET_STATS',
        resourceId: datasetId.toString(),
        metadata: { cached: true },
        result: 'SUCCESS',
      });

      return NextResponse.json({
        success: true,
        stats: cachedStats.rows[0].processing_details,
        cached: true
      });
    }

    // Download and parse file
    const stream = await minioClient.getObject(DATASETS_BUCKET, dataset.file_path);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const parseResult = await parseFile(buffer, dataset.filename);

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: parseResult.error
      }, { status: 400 });
    }

    // Save stats to database
    await db.query(
      `INSERT INTO data_processing_logs 
       (dataset_id, status, process_type, completed_at, processing_details, processed_by)
       VALUES ($1, $2, $3, NOW(), $4, $5)`,
      [
        datasetId,
        'COMPLETED',
        'STATS',
        JSON.stringify(parseResult.stats),
        user!.email
      ]
    );

    // Save detailed column stats to data_schemas table
    if (parseResult.stats?.columns) {
      for (const col of parseResult.stats.columns) {
        await db.query(
          `INSERT INTO data_schemas 
           (dataset_id, column_name, column_index, data_type, null_count, 
            unique_count, min_value, max_value, sample_values)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (dataset_id, column_name) 
           DO UPDATE SET 
             data_type = EXCLUDED.data_type,
             null_count = EXCLUDED.null_count,
             unique_count = EXCLUDED.unique_count,
             updated_at = NOW()`,
          [
            datasetId,
            col.name,
            col.index,
            col.type.toUpperCase(),
            col.nullCount,
            col.uniqueCount,
            col.min?.toString(),
            col.max?.toString(),
            JSON.stringify(col.sampleValues)
          ]
        );
      }
    }

    // Save quality metrics
    if (parseResult.stats) {
      await db.query(
        `INSERT INTO data_quality_metrics
         (dataset_id, total_rows, total_columns, null_percentage, 
          duplicate_rows, quality_score, column_stats, validation_errors)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          datasetId,
          parseResult.stats.totalRows,
          parseResult.stats.totalColumns,
          parseResult.stats.nullPercentage,
          parseResult.stats.duplicateRows,
          parseResult.stats.qualityScore,
          JSON.stringify(parseResult.stats.columns),
          JSON.stringify(parseResult.stats.errors)
        ]
      );
    }

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: DATA.VIEW,
      action: 'VIEW',
      resourceType: 'DATASET_STATS',
      resourceId: datasetId.toString(),
      metadata: { cached: false },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      stats: parseResult.stats,
      cached: false
    });

  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate statistics'
    }, { status: 500 });
  }
}
