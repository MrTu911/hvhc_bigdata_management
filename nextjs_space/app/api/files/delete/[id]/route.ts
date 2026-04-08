// API Route: Delete file from S3 and database
import { NextRequest, NextResponse } from "next/server";
import { deleteFile } from "@/lib/s3";
import prisma from "@/lib/db";
import { requireFunction } from "@/lib/rbac/middleware";
import { PERSONNEL } from "@/lib/rbac/function-codes";
import { logAudit, logSecurityEvent } from "@/lib/audit";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC: DELETE_PERSONNEL (Xóa tài liệu) - scope SELF
    const authResult = await requireFunction(request, PERSONNEL.DELETE, { resourceId: params.id });
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const fileId = params.id;

    // Get file metadata
    const file = await prisma.researchFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Additional check: owner can delete own files
    if (file.uploadedBy !== user.id) {
      // Log security event for attempt to delete other's file
      await logSecurityEvent({
        userId: user.id,
        eventType: 'DATA_BREACH_ATTEMPT',
        severity: 'HIGH',
        details: {
          action: 'DELETE_FILE',
          fileId,
          fileOwner: file.uploadedBy,
          attemptedBy: user.id,
        },
      });
      return NextResponse.json(
        { error: "Access denied - can only delete own files" },
        { status: 403 }
      );
    }

    // Delete from S3
    await deleteFile(file.objectKey);

    // Delete from database
    await prisma.researchFile.delete({
      where: { id: fileId },
    });

    // Log deletion via FileAccessLog
    await prisma.fileAccessLog.create({
      data: {
        fileId: file.id,
        userId: user.id,
        action: "DELETE",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        success: true,
      },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.DELETE,
      action: 'DELETE',
      resourceType: 'RESEARCH_FILE',
      resourceId: fileId,
      oldValue: file,
      result: 'SUCCESS',
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });

  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete file",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
