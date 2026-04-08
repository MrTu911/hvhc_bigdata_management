/**
 * API: Upload Research File
 * POST /api/data/upload
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DATA } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { uploadFile } from '@/lib/s3';
import { FileType, FileStatus } from '@prisma/client';
import { logAudit } from '@/lib/audit';

/**
 * POST - Upload file nghiên cứu lên S3
 * RBAC: DATA.CREATE
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, DATA.CREATE);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const department = formData.get('department') as string;
    const researchArea = formData.get('researchArea') as string;
    const tagsString = formData.get('tags') as string;
    const keywordsString = formData.get('keywords') as string;

    // Validate file
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Không có file được tải lên' },
        { status: 400 }
      );
    }

    // Giới hạn kích thước file (100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Kích thước file vượt quá 100MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3
    const cloud_storage_path = await uploadFile(buffer, file.name, {
      'original-name': encodeURIComponent(file.name),
      'uploaded-by': user.id || '',
      'upload-date': new Date().toISOString(),
      'category': category || 'general',
    });

    // Parse tags and keywords
    const tags = tagsString ? tagsString.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const keywords = keywordsString ? keywordsString.split(',').map((k) => k.trim()).filter(Boolean) : [];

    // Map fileType/category to enum
    const fileTypeMap: Record<string, FileType> = {
      'RESEARCH_PAPER': FileType.RESEARCH_PAPER,
      'DATASET': FileType.DATASET,
      'MODEL': FileType.MODEL,
      'REPORT': FileType.REPORT,
      'PRESENTATION': FileType.PRESENTATION,
      'OTHER': FileType.OTHER,
      'research': FileType.RESEARCH_PAPER,
      'dataset': FileType.DATASET,
      'report': FileType.REPORT,
      'thesis': FileType.REPORT,
      'other': FileType.OTHER,
    };
    const mappedFileType = fileTypeMap[fileType || category || ''] || FileType.OTHER;

    // Tạo record trong database
    const researchFile = await prisma.researchFile.create({
      data: {
        fileName: file.name.replace(/[^a-zA-Z0-9._-]/g, '_'),
        originalName: file.name,
        fileSize: file.size,
        fileType: mappedFileType,
        mimeType: file.type,
        bucketName: 's3',
        objectKey: cloud_storage_path,
        uploadedBy: user.id || '',
        department: department || null,
        researchArea: researchArea || null,
        tags,
        title: title || file.name,
        description: description || null,
        keywords,
        status: FileStatus.COMPLETED,
      },
    });

    await logAudit({
      userId: user.id,
      functionCode: DATA.CREATE,
      action: 'UPLOAD',
      resourceType: 'RESEARCH_FILE',
      resourceId: researchFile.id,
      result: 'SUCCESS',
      newValue: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        fileType: mappedFileType
      })
    });

    return NextResponse.json({
      success: true,
      data: {
        id: researchFile.id,
        fileName: researchFile.fileName,
        originalName: researchFile.originalName,
        fileSize: researchFile.fileSize,
        fileType: researchFile.fileType,
        uploadedAt: researchFile.uploadedAt,
        cloud_storage_path,
      },
      message: 'Tải lên file thành công!',
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Tải lên thất bại' },
      { status: 500 }
    );
  }
}

/**
 * GET: Lấy danh sách files đã upload
 * RBAC: DATA.VIEW
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, DATA.VIEW);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const fileType = searchParams.get('fileType');
    const department = searchParams.get('department');
    const uploadedBy = searchParams.get('uploadedBy');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (fileType && fileType !== 'ALL') where.fileType = fileType;
    if (department) where.department = department;
    if (uploadedBy) where.uploadedBy = uploadedBy;
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

    return NextResponse.json({
      success: true,
      data: {
        files,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get files error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Không thể lấy danh sách files' },
      { status: 500 }
    );
  }
}
