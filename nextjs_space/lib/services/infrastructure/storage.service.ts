/**
 * M12 – Storage Abstraction Service
 *
 * Cổng duy nhất cho toàn bộ thao tác MinIO trong hệ thống.
 * Module nghiệp vụ KHÔNG được import minio-client trực tiếp.
 *
 * Bucket strategy và object key convention:
 *   <bucket>/<year>/<month>/<entityType>/<entityId>/<filename>
 *
 * Metadata bắt buộc trên mọi object:
 *   module, entity-type, entity-id, uploaded-by, classification
 */

import * as Minio from 'minio';
import prisma from '@/lib/db';

// ─── Client singleton ─────────────────────────────────────────────────────────

const minioClient = new Minio.Client({
  endPoint:  process.env.MINIO_ENDPOINT  ?? 'localhost',
  port:      parseInt(process.env.MINIO_PORT ?? '19000'),
  useSSL:    process.env.MINIO_USE_SSL   === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY ?? 'hvhc_minio',
  secretKey: process.env.MINIO_SECRET_KEY ?? 'Hv2025_Minio',
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type StorageDomain =
  | 'M02_PERSONNEL'
  | 'M03_PARTY'
  | 'M05_POLICY'
  | 'M09_RESEARCH'
  | 'M10_EDUCATION'
  | 'M12_BACKUP'
  | 'M12_ARCHIVE'
  | 'M18_EXPORT'
  | 'M18_TEMPLATE'
  | 'M25_SCIENCE_LIBRARY';

export interface ObjectMetadata {
  module:         string;   // vd: M09, M18
  'entity-type':  string;   // vd: research-project, template
  'entity-id':    string;
  'uploaded-by':  string;   // userId
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'SECRET';
  [key: string]:  string;   // metadata thêm tuỳ module
}

export interface UploadResult {
  bucket:     string;
  objectKey:  string;
  sizeBytes:  number;
  metadata:   ObjectMetadata;
}

export interface PresignedUrlOptions {
  expirySeconds?: number; // default 3600 (1h); tối đa 7 ngày = 604800
}

export interface ObjectInfo {
  bucket:       string;
  objectKey:    string;
  sizeBytes:    number;
  contentType:  string | undefined;
  lastModified: Date | undefined;
  metadata:     Record<string, string>;
}

// ─── Bucket registry (source of truth: storage_bucket_configs DB) ────────────

// Cache ngắn hạn để không query DB mỗi thao tác.
// Nếu DB chưa có bucket config, fallback về tên bucket mặc định.
const BUCKET_FALLBACK: Record<StorageDomain, string> = {
  M02_PERSONNEL:       'hvhc-personnel',
  M03_PARTY:           'hvhc-party',
  M05_POLICY:          'hvhc-policy',
  M09_RESEARCH:        'hvhc-research',
  M10_EDUCATION:       'hvhc-education',
  M12_BACKUP:          'hvhc-backups',
  M12_ARCHIVE:         'hvhc-archive',
  M18_EXPORT:          'hvhc-exports',
  M18_TEMPLATE:        'hvhc-templates',
  M25_SCIENCE_LIBRARY: 'hvhc-science-works',
};

let bucketCache: Map<StorageDomain, string> | null = null;

async function resolveBucketName(domain: StorageDomain): Promise<string> {
  if (!bucketCache) {
    try {
      const configs = await prisma.storageBucketConfig.findMany({
        where: { isActive: true },
        select: { moduleDomain: true, bucketName: true },
      });
      bucketCache = new Map(
        configs.map((c) => [c.moduleDomain as StorageDomain, c.bucketName])
      );
      // Cache 5 phút rồi invalidate
      setTimeout(() => { bucketCache = null; }, 5 * 60 * 1000);
    } catch {
      // DB unreachable — dùng fallback, không throw
      return BUCKET_FALLBACK[domain];
    }
  }
  return bucketCache.get(domain) ?? BUCKET_FALLBACK[domain];
}

// ─── Object key builder ───────────────────────────────────────────────────────

/**
 * Tạo object key chuẩn:
 *   <year>/<month>/<entityType>/<entityId>/<safeFilename>
 */
export function buildObjectKey(
  entityType: string,
  entityId: string,
  filename: string,
): string {
  const now = new Date();
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const safe  = filename.replace(/[^a-zA-Z0-9._\-]/g, '_');
  return `${year}/${month}/${entityType}/${entityId}/${safe}`;
}

// ─── Bucket initialisation ────────────────────────────────────────────────────

async function ensureBucket(bucketName: string): Promise<void> {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName, 'us-east-1');
  }
}

// ─── Core operations ─────────────────────────────────────────────────────────

/**
 * Upload một file vào đúng bucket theo domain.
 * Module nghiệp vụ gọi hàm này thay vì gọi minio-client trực tiếp.
 */
export async function uploadObject(
  domain:   StorageDomain,
  objectKey: string,
  data:     Buffer,
  metadata: ObjectMetadata,
): Promise<UploadResult> {
  const bucket = await resolveBucketName(domain);
  await ensureBucket(bucket);

  // MinIO chỉ chấp nhận header value dạng string
  const minioMeta: Record<string, string> = { ...metadata };

  await minioClient.putObject(bucket, objectKey, data, data.length, minioMeta);

  return { bucket, objectKey, sizeBytes: data.length, metadata };
}

/**
 * Tải nội dung object về dạng Buffer.
 */
export async function downloadObject(
  domain:    StorageDomain,
  objectKey: string,
): Promise<Buffer> {
  const bucket = await resolveBucketName(domain);
  const stream = await minioClient.getObject(bucket, objectKey);

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

/**
 * Tạo presigned URL download với TTL an toàn.
 * Tối đa 7 ngày = 604800s; default 1h.
 */
export async function getPresignedDownloadUrl(
  domain:    StorageDomain,
  objectKey: string,
  opts:      PresignedUrlOptions = {},
): Promise<string> {
  const bucket  = await resolveBucketName(domain);
  const expiry  = Math.min(opts.expirySeconds ?? 3600, 604800);
  return minioClient.presignedGetObject(bucket, objectKey, expiry);
}

/**
 * Tạo presigned URL upload (dùng cho upload trực tiếp từ client nếu cần).
 * TTL ngắn — tối đa 15 phút.
 */
export async function getPresignedUploadUrl(
  domain:    StorageDomain,
  objectKey: string,
  expirySeconds = 900,
): Promise<string> {
  const bucket = await resolveBucketName(domain);
  await ensureBucket(bucket);
  return minioClient.presignedPutObject(bucket, objectKey, expirySeconds);
}

/**
 * Xoá một object. Chỉ dùng khi thiết kế module cho phép hard delete.
 */
export async function deleteObject(
  domain:    StorageDomain,
  objectKey: string,
): Promise<void> {
  const bucket = await resolveBucketName(domain);
  await minioClient.removeObject(bucket, objectKey);
}

/**
 * Lấy metadata và thông tin của object.
 */
export async function getObjectInfo(
  domain:    StorageDomain,
  objectKey: string,
): Promise<ObjectInfo> {
  const bucket = await resolveBucketName(domain);
  const stat   = await minioClient.statObject(bucket, objectKey);
  return {
    bucket,
    objectKey,
    sizeBytes:    stat.size,
    contentType:  stat.metaData?.['content-type'],
    lastModified: stat.lastModified,
    metadata:     (stat.metaData as Record<string, string>) ?? {},
  };
}

/**
 * List objects trong một prefix (entityType/entityId hoặc custom prefix).
 */
export async function listObjects(
  domain:  StorageDomain,
  prefix:  string,
): Promise<Array<{ objectKey: string; sizeBytes: number; lastModified: Date | undefined }>> {
  const bucket  = await resolveBucketName(domain);
  const stream  = minioClient.listObjects(bucket, prefix, true);
  const results: Array<{ objectKey: string; sizeBytes: number; lastModified: Date | undefined }> = [];

  return new Promise((resolve, reject) => {
    stream.on('data', (obj) => {
      if (obj.name) {
        results.push({
          objectKey:    obj.name,
          sizeBytes:    obj.size ?? 0,
          lastModified: obj.lastModified,
        });
      }
    });
    stream.on('error', reject);
    stream.on('end', () => resolve(results));
  });
}

// ─── Lifecycle / archive hooks ────────────────────────────────────────────────

/**
 * Áp lifecycle policy lên bucket theo cấu hình trong storage_bucket_configs.
 * Gọi khi khởi tạo bucket hoặc khi admin cập nhật policy.
 *
 * MinIO dùng S3-compatible XML lifecycle config.
 * Nếu retentionDays null (vĩnh viễn) — không set expiry rule.
 */
export async function applyBucketLifecycle(domain: StorageDomain): Promise<void> {
  const config = await prisma.storageBucketConfig.findFirst({
    where: { moduleDomain: domain, isActive: true },
  });
  if (!config || config.retentionDays === null) return;

  const bucket = config.bucketName;
  await ensureBucket(bucket);

  const lifecycleXml = buildLifecycleXml(config.retentionDays);
  // MinIO node SDK chưa expose setLifecycle trực tiếp — dùng setBucketLifecycle từ phiên bản >= 7
  // Nếu SDK không hỗ trợ, bỏ qua và log warning để admin cấu hình thủ công qua MinIO console.
  if (typeof (minioClient as any).setBucketLifecycle === 'function') {
    await (minioClient as any).setBucketLifecycle(bucket, lifecycleXml);
  }
}

function buildLifecycleXml(retentionDays: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<LifecycleConfiguration>
  <Rule>
    <ID>auto-expire-${retentionDays}d</ID>
    <Status>Enabled</Status>
    <Filter><Prefix></Prefix></Filter>
    <Expiration><Days>${retentionDays}</Days></Expiration>
  </Rule>
</LifecycleConfiguration>`;
}

// ─── Storage usage (for admin dashboard) ─────────────────────────────────────

export interface BucketUsageSummary {
  domain:        StorageDomain;
  bucket:        string;
  objectCount:   number;
  totalSizeBytes: bigint;
}

/**
 * Thống kê dung lượng cho một domain — dùng cho admin dashboard M12.
 */
export async function getBucketUsage(domain: StorageDomain): Promise<BucketUsageSummary> {
  const bucket  = await resolveBucketName(domain);
  const objects = await listObjects(domain, '');

  const totalSizeBytes = objects.reduce(
    (sum, obj) => sum + BigInt(obj.sizeBytes),
    BigInt(0),
  );

  return {
    domain,
    bucket,
    objectCount:    objects.length,
    totalSizeBytes,
  };
}

// ─── MIME helpers ─────────────────────────────────────────────────────────────

const MIME_MAP: Record<string, string> = {
  pdf:  'application/pdf',
  doc:  'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls:  'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv:  'text/csv',
  json: 'application/json',
  xml:  'application/xml',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  zip:  'application/zip',
  gz:   'application/gzip',
  txt:  'text/plain',
};

export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return MIME_MAP[ext] ?? 'application/octet-stream';
}
