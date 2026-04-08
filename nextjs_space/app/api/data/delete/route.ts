/**
 * API: Delete Research File
 * DELETE /api/data/delete?id=xxx
 * RBAC: DATA.DELETE
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DATA } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import prisma from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export async function DELETE(request: NextRequest) {
  try {
    // RBAC Check
    const auth = await requireFunction(request, DATA.DELETE);
    if (!auth.allowed) {
      return auth.response!;
    }
    const { user } = auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    // Get file from database
    const file = await prisma.researchFile.findUnique({
      where: { id },
    });

    if (!file) {
      return NextResponse.json({ success: false, error: 'File không tồn tại' }, { status: 404 });
    }

    // Store old value for audit
    const oldValue = {
      id: file.id,
      fileName: file.fileName,
      originalName: file.originalName,
      uploadedBy: file.uploadedBy,
    };

    // Delete from S3
    try {
      await deleteFile(file.objectKey);
    } catch (s3Error) {
      console.error('S3 delete error:', s3Error);
      // Continue even if S3 delete fails
    }

    // Delete access logs first (foreign key constraint)
    await prisma.fileAccessLog.deleteMany({
      where: { fileId: id },
    });

    // Delete from database
    await prisma.researchFile.delete({
      where: { id },
    });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: DATA.DELETE,
      action: 'DELETE',
      resourceType: 'RESEARCH_FILE',
      resourceId: id,
      oldValue,
      result: 'SUCCESS',
    });

    // System log
    await prisma.systemLog.create({
      data: {
        userId: user!.id,
        level: 'INFO',
        category: 'DATA_PROCESSING',
        action: 'FILE_DELETE',
        description: `Đã xóa file: ${file.originalName}`,
        metadata: {
          fileId: id,
          fileName: file.originalName,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa file thành công',
    });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Xóa file thất bại' },
      { status: 500 }
    );
  }
}
