/**
 * API: Preview dataset by ID
 * GET /api/data/preview/[id]?limit=100
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

    // Get limit from query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    // Get dataset info from database
    const result = await db.query(
      `SELECT id, filename, file_path, file_type, file_size, title, description, 
              uploaded_by, created_at, processing_status, quality_score
       FROM research_files 
       WHERE id = $1`,
      [datasetId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const dataset = result.rows[0];

    // Check if file type is supported for preview
    const supportedTypes = ['.csv', '.xlsx', '.xls', '.json'];
    const fileExt = dataset.filename.toLowerCase().match(/\.(csv|xlsx|xls|json)$/)?.[0];
    
    if (!fileExt || !supportedTypes.includes(fileExt)) {
      return NextResponse.json({
        error: 'Preview not supported for this file type',
        supportedTypes
      }, { status: 400 });
    }

    // Check if we have cached processing results
    const cachedStats = await db.query(
      `SELECT processing_details FROM data_processing_logs
       WHERE dataset_id = $1 AND process_type = 'PREVIEW' AND status = 'COMPLETED'
       ORDER BY completed_at DESC LIMIT 1`,
      [datasetId]
    );

    if (cachedStats.rows.length > 0 && cachedStats.rows[0].processing_details) {
      const cached = cachedStats.rows[0].processing_details;
      
      // Audit log
      await logAudit({
        userId: user!.id,
        functionCode: DATA.VIEW,
        action: 'VIEW',
        resourceType: 'DATASET_PREVIEW',
        resourceId: datasetId.toString(),
        metadata: { limit, cached: true },
        result: 'SUCCESS',
      });

      return NextResponse.json({
        success: true,
        dataset: {
          id: dataset.id,
          filename: dataset.filename,
          title: dataset.title,
          description: dataset.description,
          fileSize: dataset.file_size,
          uploadedBy: dataset.uploaded_by,
          createdAt: dataset.created_at,
          processingStatus: dataset.processing_status,
          qualityScore: dataset.quality_score
        },
        preview: {
          data: cached.sampleData?.slice(0, limit) || [],
          stats: cached.stats,
          cached: true
        }
      });
    }

    // Download file from MinIO
    const stream = await minioClient.getObject(DATASETS_BUCKET, dataset.file_path);
    
    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Parse file
    const parseResult = await parseFile(buffer, dataset.filename);

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: parseResult.error
      }, { status: 400 });
    }

    // Log processing
    await db.query(
      `INSERT INTO data_processing_logs 
       (dataset_id, status, process_type, completed_at, processing_details, processed_by)
       VALUES ($1, $2, $3, NOW(), $4, $5)`,
      [
        datasetId,
        'COMPLETED',
        'PREVIEW',
        JSON.stringify({
          stats: parseResult.stats,
          sampleData: parseResult.data?.slice(0, limit)
        }),
        user!.email
      ]
    );

    // Update research_files with stats
    if (parseResult.stats) {
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
    }

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: DATA.VIEW,
      action: 'VIEW',
      resourceType: 'DATASET_PREVIEW',
      resourceId: datasetId.toString(),
      metadata: { limit, cached: false },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      dataset: {
        id: dataset.id,
        filename: dataset.filename,
        title: dataset.title,
        description: dataset.description,
        fileSize: dataset.file_size,
        uploadedBy: dataset.uploaded_by,
        createdAt: dataset.created_at,
        processingStatus: 'PROCESSED',
        qualityScore: parseResult.stats?.qualityScore
      },
      preview: {
        data: parseResult.data?.slice(0, limit) || [],
        stats: parseResult.stats,
        cached: false
      }
    });

  } catch (error: any) {
    console.error('Preview error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to preview dataset'
    }, { status: 500 });
  }
}
