/**
 * API: List all datasets with processing info
 * GET /api/data/list
 * RBAC: DATA.VIEW
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DATA } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // RBAC Check
    const auth = await requireFunction(request, DATA.VIEW);
    if (!auth.allowed) {
      return auth.response!;
    }
    const { user } = auth;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const fileType = searchParams.get('fileType');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (fileType && fileType !== 'all' && fileType !== 'ALL') {
      where.fileType = fileType;
    }
    if (status && status !== 'all' && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Query database
    const [files, total] = await Promise.all([
      prisma.researchFile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.researchFile.count({ where }),
    ]);

    // Get uploader names
    const uploaderIds = [...new Set(files.map(f => f.uploadedBy))];
    const uploaders = await prisma.user.findMany({
      where: { id: { in: uploaderIds } },
      select: { id: true, name: true, email: true },
    });
    const uploaderMap = new Map(uploaders.map(u => [u.id, u]));

    // Transform to expected format
    const datasets = files.map(file => ({
      id: file.id,
      filename: file.fileName,
      originalName: file.originalName,
      title: file.title || file.originalName,
      description: file.description,
      file_size: file.fileSize,
      fileSize: file.fileSize,
      file_type: file.fileType,
      fileType: file.fileType,
      mimeType: file.mimeType,
      uploaded_by: file.uploadedBy,
      uploadedBy: file.uploadedBy,
      uploaderName: uploaderMap.get(file.uploadedBy)?.name || 'Unknown',
      uploaderEmail: uploaderMap.get(file.uploadedBy)?.email || '',
      created_at: file.uploadedAt.toISOString(),
      uploadedAt: file.uploadedAt.toISOString(),
      processing_status: file.status,
      status: file.status,
      tags: file.tags,
      keywords: file.keywords,
      department: file.department,
      researchArea: file.researchArea,
      downloadCount: file.downloadCount,
      viewCount: file.viewCount,
      objectKey: file.objectKey,
      classification: file.classification,
    }));

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: DATA.VIEW,
      action: 'VIEW',
      resourceType: 'DATASET_LIST',
      metadata: { page, limit, fileType, status, search, count: datasets.length },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      datasets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('List datasets error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
