// API Route: Download file from S3 (generate presigned URL)
import { NextRequest, NextResponse } from "next/server";
import { downloadFile } from "@/lib/s3";
import prisma from "@/lib/db";
import { requireFunction } from "@/lib/rbac/middleware";
import { PERSONNEL } from "@/lib/rbac/function-codes";
import { logAudit } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC: VIEW_PERSONNEL_DETAIL (Xem chi tiết tài liệu) - scope SELF
    const authResult = await requireFunction(request, PERSONNEL.VIEW_DETAIL, { resourceId: params.id });
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const fileId = params.id;

    // Get file metadata from database
    const file = await prisma.researchFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Generate presigned URL (valid for 1 hour)
    const signedUrl = await downloadFile(file.objectKey, 3600);

    // Log access via FileAccessLog
    await prisma.fileAccessLog.create({
      data: {
        fileId: file.id,
        userId: user.id,
        action: "DOWNLOAD",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        success: true,
      },
    });

    // Update download count
    await prisma.researchFile.update({
      where: { id: fileId },
      data: {
        downloadCount: { increment: 1 },
      },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.VIEW_DETAIL,
      action: 'DOWNLOAD',
      resourceType: 'RESEARCH_FILE',
      resourceId: fileId,
      result: 'SUCCESS',
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({
      success: true,
      downloadUrl: signedUrl,
      file: {
        id: file.id,
        fileName: file.fileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
      },
      expiresIn: 3600, // seconds
    });

  } catch (error: any) {
    console.error("Download error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate download URL",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
