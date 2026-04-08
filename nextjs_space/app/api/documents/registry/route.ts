/**
 * API: Document Registry – Kho văn bản số
 * Path: /api/documents/registry
 * CRUD for digital documents backed by ResearchFile model.
 * Treats ResearchFile as a general-purpose document store.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DIGITAL_DOCS } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import prisma from '@/lib/db';

// Map FileType to document category labels
const FILE_TYPE_LABELS: Record<string, string> = {
  RESEARCH_PAPER: 'Bài báo khoa học',
  DATASET: 'Dữ liệu',
  MODEL: 'Mô hình',
  REPORT: 'Báo cáo',
  PRESENTATION: 'Trình bày',
  OTHER: 'Văn bản khác',
};

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, DIGITAL_DOCS.VIEW);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const fileType = searchParams.get('fileType') || '';
    const department = searchParams.get('department') || '';
    const classification = searchParams.get('classification') || '';
    const status = searchParams.get('status') || '';
    const uploadedBy = searchParams.get('uploadedBy') || '';
    const skip = (page - 1) * limit;

    const where: any = {
      ...(fileType && { fileType: fileType as any }),
      ...(department && { department: { contains: department, mode: 'insensitive' } }),
      ...(classification && { classification: classification as any }),
      ...(status && { status: status as any }),
      ...(uploadedBy && { uploadedBy }),
    };

    const [documents, total] = await Promise.all([
      prisma.researchFile.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          fileName: true,
          originalName: true,
          title: true,
          description: true,
          fileType: true,
          fileSize: true,
          mimeType: true,
          department: true,
          researchArea: true,
          classification: true,
          status: true,
          tags: true,
          keywords: true,
          uploadedBy: true,
          uploadedAt: true,
          updatedAt: true,
          downloadCount: true,
          viewCount: true,
          version: true,
          isLatest: true,
          checksum: true,
        },
      }),
      prisma.researchFile.count({ where }),
    ]);

    // Stats by type
    const byType = await prisma.researchFile.groupBy({
      by: ['fileType'],
      _count: { id: true },
    }).catch(() => []);

    return NextResponse.json({
      documents: documents.map(d => ({
        ...d,
        fileTypeName: FILE_TYPE_LABELS[d.fileType] || d.fileType,
        fileSizeKB: Math.round(d.fileSize / 1024),
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      stats: {
        total,
        byType: byType.reduce((acc: any, r: any) => {
          acc[r.fileType] = r._count.id; return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('[Document Registry GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, DIGITAL_DOCS.CREATE);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;

    const body = await request.json();
    const {
      fileName, originalName, title, description, fileType = 'OTHER',
      fileSize = 0, mimeType = 'application/octet-stream',
      bucketName = 'hvhc-documents', objectKey,
      department, researchArea, classification = 'INTERNAL',
      tags = [], keywords = [],
    } = body;

    if (!objectKey) return NextResponse.json({ error: 'objectKey là bắt buộc' }, { status: 400 });
    if (!fileName) return NextResponse.json({ error: 'fileName là bắt buộc' }, { status: 400 });

    const doc = await prisma.researchFile.create({
      data: {
        fileName,
        originalName: originalName || fileName,
        title: title || fileName,
        description,
        fileType: fileType as any,
        fileSize,
        mimeType,
        bucketName,
        objectKey,
        department,
        researchArea,
        classification: classification as any,
        tags,
        keywords,
        uploadedBy: user.id,
        status: 'COMPLETED',
      },
    });

    await logAudit({
      userId: user.id,
      functionCode: DIGITAL_DOCS.CREATE,
      action: 'CREATE',
      resourceType: 'DIGITAL_DOCUMENT',
      resourceId: doc.id,
      result: 'SUCCESS',
      metadata: { fileName, fileType, department },
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    console.error('[Document Registry POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
