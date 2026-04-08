/**
 * API: Clean dataset by ID
 * POST /api/data/clean/[id]
 * Body: { removeNulls, removeDuplicates, fillNulls, fillValue, createVersion }
 * RBAC: DATA.UPDATE
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DATA } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { db } from '@/lib/db-query';
import { minioClient, RESEARCH_BUCKET as DATASETS_BUCKET } from '@/lib/minio-client';
import { parseFile, cleanData, analyzeData } from '@/lib/data-processor';
import Papa from 'papaparse';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC Check
    const auth = await requireFunction(request, DATA.UPDATE);
    if (!auth.allowed) {
      return auth.response!;
    }
    const { user } = auth;

    const datasetId = parseInt(params.id);
    if (isNaN(datasetId)) {
      return NextResponse.json({ error: 'Invalid dataset ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      removeNulls = false,
      removeDuplicates = false,
      fillNulls = false,
      fillValue = '',
      createVersion = true
    } = body;

    // Get dataset info
    const result = await db.query(
      `SELECT id, filename, file_path, file_type FROM research_files WHERE id = $1`,
      [datasetId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const dataset = result.rows[0];

    // Log start of processing
    const logResult = await db.query(
      `INSERT INTO data_processing_logs 
       (dataset_id, status, process_type, processing_details, processed_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        datasetId,
        'PROCESSING',
        'CLEAN',
        JSON.stringify({ removeNulls, removeDuplicates, fillNulls, fillValue }),
        user!.email
      ]
    );
    const logId = logResult.rows[0].id;

    try {
      // Download file from MinIO
      const stream = await minioClient.getObject(DATASETS_BUCKET, dataset.file_path);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Parse file
      const parseResult = await parseFile(buffer, dataset.filename);

      if (!parseResult.success || !parseResult.data) {
        throw new Error(parseResult.error || 'Failed to parse file');
      }

      const originalData = parseResult.data;
      const originalStats = parseResult.stats;

      // Clean data
      const cleanedData = cleanData(originalData, {
        removeNulls,
        removeDuplicates,
        fillNulls,
        fillValue
      });

      // Analyze cleaned data
      const cleanedStats = analyzeData(cleanedData);

      // Convert back to CSV (most common format)
      const csv = Papa.unparse(cleanedData);
      const cleanedBuffer = Buffer.from(csv, 'utf-8');

      let newFilePath = dataset.file_path;

      if (createVersion) {
        // Get current version number
        const versionResult = await db.query(
          `SELECT COALESCE(MAX(version_number), 0) as max_version 
           FROM data_versions WHERE dataset_id = $1`,
          [datasetId]
        );
        const newVersion = versionResult.rows[0].max_version + 1;

        // Create new file path
        const timestamp = Date.now();
        const baseName = dataset.filename.replace(/\.[^.]+$/, '');
        newFilePath = `${baseName}_v${newVersion}_${timestamp}.csv`;

        // Upload cleaned file to MinIO
        await minioClient.putObject(
          DATASETS_BUCKET,
          newFilePath,
          cleanedBuffer,
          cleanedBuffer.length,
          {
            'Content-Type': 'text/csv',
            'X-Original-File': dataset.filename
          }
        );

        // Save version to database
        await db.query(
          `INSERT INTO data_versions
           (dataset_id, version_number, file_path, file_size, description, 
            changes_summary, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            datasetId,
            newVersion,
            newFilePath,
            cleanedBuffer.length,
            'Cleaned version',
            JSON.stringify({
              removeNulls,
              removeDuplicates,
              fillNulls,
              originalRows: originalStats?.totalRows,
              cleanedRows: cleanedStats.totalRows,
              removedRows: (originalStats?.totalRows || 0) - cleanedStats.totalRows
            }),
            user!.email
          ]
        );

        // Deactivate previous versions
        await db.query(
          `UPDATE data_versions SET is_active = false 
           WHERE dataset_id = $1 AND version_number < $2`,
          [datasetId, newVersion]
        );

        // Update research_files to point to new version
        await db.query(
          `UPDATE research_files 
           SET file_path = $1, 
               file_size = $2,
               processing_status = 'CLEANED',
               quality_score = $3,
               row_count = $4,
               column_count = $5,
               last_processed_at = NOW()
           WHERE id = $6`,
          [
            newFilePath,
            cleanedBuffer.length,
            cleanedStats.qualityScore,
            cleanedStats.totalRows,
            cleanedStats.totalColumns,
            datasetId
          ]
        );
      } else {
        // Overwrite original file
        await minioClient.putObject(
          DATASETS_BUCKET,
          dataset.file_path,
          cleanedBuffer,
          cleanedBuffer.length,
          { 'Content-Type': 'text/csv' }
        );

        await db.query(
          `UPDATE research_files 
           SET file_size = $1,
               processing_status = 'CLEANED',
               quality_score = $2,
               row_count = $3,
               column_count = $4,
               last_processed_at = NOW()
           WHERE id = $5`,
          [
            cleanedBuffer.length,
            cleanedStats.qualityScore,
            cleanedStats.totalRows,
            cleanedStats.totalColumns,
            datasetId
          ]
        );
      }

      // Update processing log
      await db.query(
        `UPDATE data_processing_logs 
         SET status = 'COMPLETED',
             completed_at = NOW(),
             processing_details = $1
         WHERE id = $2`,
        [
          JSON.stringify({
            originalStats,
            cleanedStats,
            changes: {
              removeNulls,
              removeDuplicates,
              fillNulls,
              rowsRemoved: (originalStats?.totalRows || 0) - cleanedStats.totalRows
            }
          }),
          logId
        ]
      );

      // Audit log
      await logAudit({
        userId: user!.id,
        functionCode: DATA.UPDATE,
        action: 'UPDATE',
        resourceType: 'DATASET',
        resourceId: datasetId.toString(),
        oldValue: { rows: originalStats?.totalRows, qualityScore: originalStats?.qualityScore },
        newValue: { rows: cleanedStats.totalRows, qualityScore: cleanedStats.qualityScore },
        metadata: { removeNulls, removeDuplicates, fillNulls, createVersion },
        result: 'SUCCESS',
      });

      return NextResponse.json({
        success: true,
        message: 'Dataset cleaned successfully',
        original: {
          rows: originalStats?.totalRows,
          qualityScore: originalStats?.qualityScore
        },
        cleaned: {
          rows: cleanedStats.totalRows,
          qualityScore: cleanedStats.qualityScore,
          filePath: newFilePath
        },
        changes: {
          rowsRemoved: (originalStats?.totalRows || 0) - cleanedStats.totalRows,
          qualityImprovement: (cleanedStats.qualityScore - (originalStats?.qualityScore || 0)).toFixed(2)
        }
      });

    } catch (error: any) {
      // Update log with error
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
    console.error('Clean error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to clean dataset'
    }, { status: 500 });
  }
}
