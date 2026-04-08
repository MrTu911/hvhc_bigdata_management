/**
 * API: Auto-process uploaded data
 * POST /api/data/process
 * Body: { datasetId }
 * RBAC: DATA.UPDATE
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DATA } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { db } from '@/lib/db-query';
import { minioClient, RESEARCH_BUCKET as DATASETS_BUCKET } from '@/lib/minio-client';
import { parseFile } from '@/lib/data-processor';

export async function POST(request: NextRequest) {
  try {
    // RBAC Check
    const auth = await requireFunction(request, DATA.UPDATE);
    if (!auth.allowed) {
      return auth.response!;
    }
    const { user } = auth;

    const body = await request.json();
    const { datasetId } = body;

    if (!datasetId) {
      return NextResponse.json({ error: 'Dataset ID required' }, { status: 400 });
    }

    // Get dataset info
    const result = await db.query(
      `SELECT id, filename, file_path, file_type FROM research_files WHERE id = $1`,
      [datasetId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const dataset = result.rows[0];

    // Check if already processed
    const existingLog = await db.query(
      `SELECT id FROM data_processing_logs
       WHERE dataset_id = $1 AND process_type = 'STATS' AND status = 'COMPLETED'
       LIMIT 1`,
      [datasetId]
    );

    if (existingLog.rows.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Dataset already processed',
        alreadyProcessed: true
      });
    }

    // Start processing
    const logResult = await db.query(
      `INSERT INTO data_processing_logs 
       (dataset_id, status, process_type, processed_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [datasetId, 'PROCESSING', 'AUTO_PROCESS', user!.email]
    );
    const logId = logResult.rows[0].id;

    try {
      // Download file
      const stream = await minioClient.getObject(DATASETS_BUCKET, dataset.file_path);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Parse and analyze
      const parseResult = await parseFile(buffer, dataset.filename);

      if (!parseResult.success) {
        throw new Error(parseResult.error);
      }

      // Save stats
      if (parseResult.stats) {
        // Update research_files
        await db.query(
          `UPDATE research_files 
           SET processing_status = 'PROCESSED',
               last_processed_at = NOW(),
               quality_score = $1,
               row_count = $2,
               column_count = $3
           WHERE id = $4`,
          [
            parseResult.stats.qualityScore,
            parseResult.stats.totalRows,
            parseResult.stats.totalColumns,
            datasetId
          ]
        );

        // Save quality metrics
        await db.query(
          `INSERT INTO data_quality_metrics
           (dataset_id, total_rows, total_columns, null_percentage, 
            duplicate_rows, quality_score, column_stats)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            datasetId,
            parseResult.stats.totalRows,
            parseResult.stats.totalColumns,
            parseResult.stats.nullPercentage,
            parseResult.stats.duplicateRows,
            parseResult.stats.qualityScore,
            JSON.stringify(parseResult.stats.columns)
          ]
        );

        // Save schema
        for (const col of parseResult.stats.columns) {
          await db.query(
            `INSERT INTO data_schemas 
             (dataset_id, column_name, column_index, data_type, null_count, unique_count, sample_values)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              datasetId,
              col.name,
              col.index,
              col.type.toUpperCase(),
              col.nullCount,
              col.uniqueCount,
              JSON.stringify(col.sampleValues)
            ]
          );
        }
      }

      // Update log
      await db.query(
        `UPDATE data_processing_logs 
         SET status = 'COMPLETED',
             completed_at = NOW(),
             processing_details = $1
         WHERE id = $2`,
        [JSON.stringify(parseResult.stats), logId]
      );

      // Audit log
      await logAudit({
        userId: user!.id,
        functionCode: DATA.UPDATE,
        action: 'UPDATE',
        resourceType: 'DATASET_PROCESS',
        resourceId: datasetId.toString(),
        metadata: parseResult.stats as unknown as Record<string, unknown>,
        result: 'SUCCESS',
      });

      return NextResponse.json({
        success: true,
        message: 'Dataset processed successfully',
        stats: parseResult.stats
      });

    } catch (error: any) {
      await db.query(
        `UPDATE data_processing_logs 
         SET status = 'FAILED',
             completed_at = NOW(),
             error_message = $1
         WHERE id = $2`,
        [error.message, logId]
      );
      throw error;
    }

  } catch (error: any) {
    console.error('Process error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
