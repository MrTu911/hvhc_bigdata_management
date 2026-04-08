
// API Route: Upload files to S3 Cloud Storage
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadFile } from "@/lib/s3";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileType = formData.get("fileType") as string || "OTHER";
    const department = formData.get("department") as string || "";
    const researchArea = formData.get("researchArea") as string || "";
    const classification = formData.get("classification") as string || "INTERNAL";
    const title = formData.get("title") as string || "";
    const description = formData.get("description") as string || "";
    const tags = formData.get("tags") as string || "";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 500MB limit" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const cloud_storage_path = await uploadFile(
      buffer,
      file.name,
      {
        uploadedBy: session.user.id!,
        department,
        classification,
      }
    );

    // Calculate checksum for integrity
    const crypto = require("crypto");
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    // Save metadata to database
    const researchFile = await prisma.researchFile.create({
      data: {
        fileName: file.name,
        originalName: file.name,
        fileSize: file.size,
        fileType: fileType as any,
        mimeType: file.type,
        
        bucketName: process.env.AWS_BUCKET_NAME || "",
        objectKey: cloud_storage_path,
        fileUrl: null, // Will generate signed URL on demand
        
        uploadedBy: session.user.id!,
        department,
        researchArea: researchArea || null,
        tags: tags ? tags.split(",").map(t => t.trim()) : [],
        
        classification: classification as any,
        checksum,
        
        status: "PROCESSING",
        
        title: title || file.name,
        description: description || null,
      },
    });

    // Trigger async processing (we'll create this worker later)
    // await triggerDataProcessing(researchFile.id);

    return NextResponse.json({
      success: true,
      file: {
        id: researchFile.id,
        fileName: researchFile.fileName,
        fileSize: researchFile.fileSize,
        status: researchFile.status,
        cloud_storage_path,
      },
      message: "File uploaded successfully and queued for processing",
    });

  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's uploaded files
    const files = await prisma.researchFile.findMany({
      where: {
        uploadedBy: session.user.id!,
      },
      orderBy: {
        uploadedAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      files,
      total: files.length,
    });

  } catch (error: any) {
    console.error("Get files error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve files",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
