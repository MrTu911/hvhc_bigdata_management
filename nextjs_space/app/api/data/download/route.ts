/**
 * API: Download Research File
 * GET /api/data/download?id=xxx
 * @version 8.9 - Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DATA } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { downloadFile } from '@/lib/s3';
import { logAudit } from '@/lib/audit';

/**
 * GET - Download research file
 * RBAC: DATA.EXPORT
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, DATA.EXPORT);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

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

    // Generate presigned URL
    const url = await downloadFile(file.objectKey, 3600); // 1 hour expiry

    // Update download count
    await prisma.researchFile.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    // Log access
    await prisma.fileAccessLog.create({
      data: {
        fileId: id,
        userId: user.id || '',
        action: 'DOWNLOAD',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    await logAudit({
      userId: user.id,
      functionCode: DATA.EXPORT,
      action: 'DOWNLOAD',
      resourceType: 'RESEARCH_FILE',
      resourceId: id,
      result: 'SUCCESS',
      metadata: { filename: file.originalName }
    });

    return NextResponse.json({
      success: true,
      url,
      filename: file.originalName,
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Download failed' },
      { status: 500 }
    );
  }
}
