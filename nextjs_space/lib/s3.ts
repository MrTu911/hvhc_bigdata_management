
// S3 Storage Operations
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client, getBucketConfig } from "./aws-config";

const s3Client = createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();

/**
 * Upload file to S3
 * @param buffer File buffer
 * @param fileName File name
 * @param metadata Optional metadata
 * @returns Full S3 key (cloud_storage_path)
 */
export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  metadata?: Record<string, string>
): Promise<string> {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${folderPrefix}uploads/${timestamp}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    Metadata: metadata,
    ContentType: getContentType(fileName),
  });

  await s3Client.send(command);

  return key; // Return cloud_storage_path
}

/**
 * Download file from S3 (get presigned URL)
 * @param key S3 key (cloud_storage_path)
 * @param expiresIn URL expiration in seconds (default: 1 hour)
 * @returns Presigned URL
 */
export async function downloadFile(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

/**
 * Delete file from S3
 * @param key S3 key (cloud_storage_path)
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Rename/move file in S3
 * @param oldKey Current S3 key
 * @param newKey New S3 key
 */
export async function renameFile(oldKey: string, newKey: string): Promise<void> {
  // S3 doesn't have rename, so we copy and delete
  const { Body } = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: oldKey,
    })
  );

  if (!Body) {
    throw new Error("Failed to read file for rename");
  }

  // Convert stream to buffer
  const buffer = await streamToBuffer(Body as any);

  // Upload to new location
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: newKey,
      Body: buffer,
    })
  );

  // Delete old file
  await deleteFile(oldKey);
}

/**
 * Check if file exists in S3
 * @param key S3 key
 * @returns true if exists
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file metadata
 * @param key S3 key
 */
export async function getFileMetadata(key: string) {
  const response = await s3Client.send(
    new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );

  return {
    size: response.ContentLength,
    contentType: response.ContentType,
    lastModified: response.LastModified,
    metadata: response.Metadata,
  };
}

/**
 * List files in a folder
 * @param prefix Folder prefix
 * @param maxKeys Maximum number of keys to return
 */
export async function listFiles(prefix: string, maxKeys: number = 1000) {
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  const response = await s3Client.send(command);

  return (
    response.Contents?.map((item) => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
    })) || []
  );
}

/**
 * Helper: Get content type from file extension
 */
function getContentType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    
    // Spreadsheets
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv",
    
    // Data formats
    json: "application/json",
    xml: "application/xml",
    
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    svg: "image/svg+xml",
    
    // Archives
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    tar: "application/x-tar",
    gz: "application/gzip",
    
    // Text
    txt: "text/plain",
    md: "text/markdown",
  };

  return mimeTypes[ext || ""] || "application/octet-stream";
}

/**
 * Helper: Convert stream to buffer
 */
async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
}

/**
 * Generate unique file name with timestamp
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const ext = originalName.split(".").pop();
  const nameWithoutExt = originalName.replace(`.${ext}`, "");
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9-]/g, "_");
  
  return `${sanitized}_${timestamp}.${ext}`;
}
