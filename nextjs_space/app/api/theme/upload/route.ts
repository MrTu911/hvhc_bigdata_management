import { requireFunction } from "@/lib/rbac/middleware";
import { THEME } from "@/lib/rbac/function-codes";

import { NextResponse } from 'next/server';
import { uploadFile } from '@/lib/s3';
import { getBucketConfig } from '@/lib/aws-config';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const assetType = formData.get('assetType') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images allowed.' },
        { status: 400 }
      );
    }

    // Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate S3 key
    const { folderPrefix } = getBucketConfig();
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `${folderPrefix}branding/${assetType}/${timestamp}-${sanitizedName}`;

    // Upload to S3
    const cloud_storage_path = await uploadFile(buffer, s3Key);

    // Get file info
    const dimensions = formData.get('dimensions') as string || '';
    
    return NextResponse.json({
      success: true,
      data: {
        filePath: cloud_storage_path,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        dimensions
      }
    });
  } catch (error: any) {
    console.error('Error uploading branding asset:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
