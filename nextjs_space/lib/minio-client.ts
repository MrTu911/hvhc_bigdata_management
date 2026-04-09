
/**
 * MinIO Client Configuration
 * Tích hợp với MinIO Object Storage cho hệ thống HVHC BigData
 */

import * as Minio from 'minio';

// MinIO configuration từ environment variables hoặc default values
const MINIO_CONFIG = {
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '19000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'hvhc_minio',
  secretKey: process.env.MINIO_SECRET_KEY || 'Hv2025_Minio',
};

// Tạo MinIO client instance
export const minioClient = new Minio.Client(MINIO_CONFIG);

// Default bucket cho research files
export const RESEARCH_BUCKET = 'hvhc-research-files';

/**
 * Khởi tạo bucket nếu chưa tồn tại
 */
export async function ensureBucketExists(bucketName: string = RESEARCH_BUCKET): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`✓ Bucket ${bucketName} created successfully`);
    }
  } catch (error) {
    console.error(`Error ensuring bucket exists: ${error}`);
    throw error;
  }
}

/**
 * Upload file to MinIO
 */
export async function uploadFileToMinio(
  bucketName: string,
  objectKey: string,
  fileBuffer: Buffer,
  metadata?: Record<string, string>
): Promise<string> {
  try {
    await ensureBucketExists(bucketName);
    
    await minioClient.putObject(
      bucketName,
      objectKey,
      fileBuffer,
      fileBuffer.length,
      metadata
    );
    
    return objectKey;
  } catch (error) {
    console.error(`Error uploading file to MinIO: ${error}`);
    throw error;
  }
}

/**
 * Tạo presigned URL để download file (valid 7 days)
 */
export async function getPresignedUrl(
  bucketName: string,
  objectKey: string,
  expirySeconds: number = 604800 // 7 days
): Promise<string> {
  try {
    const url = await minioClient.presignedGetObject(bucketName, objectKey, expirySeconds);
    return url;
  } catch (error) {
    console.error(`Error generating presigned URL: ${error}`);
    throw error;
  }
}

/**
 * Download file từ MinIO, trả về Buffer
 */
export async function downloadFileFromMinio(
  bucketName: string,
  objectKey: string,
): Promise<Buffer> {
  const stream = await minioClient.getObject(bucketName, objectKey);
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

/**
 * Xóa file từ MinIO
 */
export async function deleteFileFromMinio(
  bucketName: string,
  objectKey: string
): Promise<void> {
  try {
    await minioClient.removeObject(bucketName, objectKey);
  } catch (error) {
    console.error(`Error deleting file from MinIO: ${error}`);
    throw error;
  }
}

/**
 * Lấy thông tin file từ MinIO
 */
export async function getFileInfo(bucketName: string, objectKey: string) {
  try {
    const stat = await minioClient.statObject(bucketName, objectKey);
    return stat;
  } catch (error) {
    console.error(`Error getting file info: ${error}`);
    throw error;
  }
}

/**
 * List files trong bucket
 */
export async function listFiles(bucketName: string, prefix?: string): Promise<any[]> {
  try {
    const stream = minioClient.listObjects(bucketName, prefix, true);
    const objects: any[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => objects.push(obj));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(objects));
    });
  } catch (error) {
    console.error(`Error listing files: ${error}`);
    throw error;
  }
}

export default minioClient;
