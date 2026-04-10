/**
 * LibraryService – CSDL-KHQL Phase 4
 *
 * Upload pipeline:  receive → checksum → ClamAV scan → MinIO put → DB create → BullMQ index job
 * Download:         DB get → sensitivity+IP check → presigned URL 15min → audit log
 * Semantic search:  query → embed → pgvector cosine (fallback: empty if not indexed)
 */
import 'server-only'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { libraryRepo } from '@/lib/repositories/science/library.repo'
import { scanBuffer } from '@/lib/integrations/clamav'
import { embedText } from '@/lib/integrations/embeddings'
import { enqueueLibraryIndex } from '@/lib/queue/science-queue'
import { logAudit } from '@/lib/audit'
import {
  minioClient,
  getPresignedUrl,
  uploadFileToMinio,
  deleteFileFromMinio,
  ensureBucketExists,
} from '@/lib/minio-client'
import type { LibraryListFilter, LibraryUploadMeta, SemanticSearchInput } from '@/lib/validations/science-library'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/validations/science-library'

// ─── Constants ────────────────────────────────────────────────────────────────

const LIBRARY_BUCKET = process.env.LIBRARY_MINIO_BUCKET ?? 'hvhc-library'

/** IPs nội bộ được phép download tài liệu SECRET */
const SECRET_IP_WHITELIST = new Set(
  (process.env.LIBRARY_SECRET_IP_WHITELIST ?? '127.0.0.1,::1').split(',').map((s) => s.trim())
)

/** Expiry presigned URL: 15 phút */
const PRESIGNED_EXPIRY_SECONDS = 15 * 60

// ─── Sensitivity scope mapping ────────────────────────────────────────────────

function getAllowedSensitivities(canViewConfidential: boolean, canViewSecret: boolean): string[] {
  const levels = ['NORMAL']
  if (canViewConfidential) levels.push('CONFIDENTIAL')
  if (canViewSecret) levels.push('SECRET')
  return levels
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const libraryService = {
  async listItems(
    filter: LibraryListFilter,
    canViewConfidential: boolean,
    canViewSecret: boolean
  ) {
    const allowed = getAllowedSensitivities(canViewConfidential, canViewSecret)
    const result = await libraryRepo.findMany(filter, allowed)
    return { success: true as const, data: result }
  },

  async uploadItem(
    file: Buffer,
    filename: string,
    mimeType: string,
    meta: LibraryUploadMeta,
    userId: string,
    ipAddress?: string
  ) {
    // 1. Validate file type
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
      return { success: false as const, error: `Loại file không được phép: ${mimeType}` }
    }

    // 2. Validate file size
    if (file.length > MAX_FILE_SIZE_BYTES) {
      return { success: false as const, error: 'File vượt quá 200MB' }
    }

    // 3. SHA-256 checksum
    const checksum = crypto.createHash('sha256').update(file).digest('hex')

    // 4. ClamAV virus scan
    const scanResult = await scanBuffer(file)
    if (!scanResult.clean) {
      await logAudit({
        userId,
        functionCode: 'UPLOAD_LIBRARY',
        action: 'CREATE',
        resourceType: 'LIBRARY_ITEM',
        resourceId: 'N/A',
        result: 'FAILURE',
        ipAddress,
        metadata: { threat: scanResult.threat, filename },
      })
      return { success: false as const, error: `File bị từ chối bởi ClamAV: ${scanResult.threat}` }
    }

    // 5. Upload lên MinIO: library/{sensitivity}/{uuid}.{ext}
    const ext = filename.split('.').pop() ?? 'bin'
    const objectKey = `library/${meta.sensitivity.toLowerCase()}/${uuidv4()}.${ext}`

    await ensureBucketExists(LIBRARY_BUCKET)
    await uploadFileToMinio(LIBRARY_BUCKET, objectKey, file, {
      'x-meta-title': meta.title,
      'x-meta-sensitivity': meta.sensitivity,
      'x-meta-checksum': checksum,
    })

    // 6. Tạo DB record
    const item = await libraryRepo.create({
      title: meta.title,
      filePath: objectKey,
      fileSize: BigInt(file.length),
      mimeType,
      checksumSha256: checksum,
      sensitivity: meta.sensitivity,
      workId: meta.workId,
      createdById: userId,
    })

    // 7. Enqueue indexing job (text extraction + embedding)
    const jobId = await enqueueLibraryIndex({
      jobType: 'LIBRARY_INDEX',
      libraryItemId: item.id,
      filePath: objectKey,
      mimeType,
      requestedByUserId: userId,
    })

    await logAudit({
      userId,
      functionCode: 'UPLOAD_LIBRARY',
      action: 'CREATE',
      resourceType: 'LIBRARY_ITEM',
      resourceId: item.id,
      result: 'SUCCESS',
      ipAddress,
      metadata: { objectKey, checksum, jobId, sensitivity: meta.sensitivity },
    })

    return { success: true as const, data: item, indexJobId: jobId }
  },

  async getDownloadUrl(
    id: string,
    canViewConfidential: boolean,
    canViewSecret: boolean,
    userId: string,
    clientIp?: string,
    ipAddress?: string
  ) {
    const item = await libraryRepo.findById(id)
    if (!item) return { success: false as const, error: 'Không tìm thấy tài liệu' }

    // Sensitivity check
    const allowed = getAllowedSensitivities(canViewConfidential, canViewSecret)
    if (!allowed.includes(item.sensitivity)) {
      return { success: false as const, error: 'Không có quyền tải tài liệu này' }
    }

    // SECRET: chỉ phục vụ từ IP whitelist nội bộ
    if (item.sensitivity === 'SECRET') {
      const ip = clientIp ?? ''
      if (!SECRET_IP_WHITELIST.has(ip)) {
        await logAudit({
          userId,
          functionCode: 'DOWNLOAD_LIBRARY_SECRET',
          action: 'READ',
          resourceType: 'LIBRARY_ITEM',
          resourceId: id,
          result: 'FAILURE',
          ipAddress,
          metadata: { reason: 'IP not whitelisted', ip },
        })
        return {
          success: false as const,
          error: 'Tài liệu MẬT chỉ được truy cập từ mạng nội bộ',
        }
      }
    }

    // Pre-signed URL 15 phút
    const presignedUrl = await getPresignedUrl(LIBRARY_BUCKET, item.filePath, PRESIGNED_EXPIRY_SECONDS)

    // Ghi access log + tăng counter song song
    await Promise.all([
      libraryRepo.logAccess(id, userId, 'DOWNLOAD', ipAddress),
      libraryRepo.incrementAccess(id, 'DOWNLOAD'),
    ])

    const functionCode = item.sensitivity === 'SECRET'
      ? 'DOWNLOAD_LIBRARY_SECRET'
      : 'DOWNLOAD_LIBRARY_NORMAL'

    await logAudit({
      userId,
      functionCode,
      action: 'READ',
      resourceType: 'LIBRARY_ITEM',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress,
      metadata: { sensitivity: item.sensitivity, expirySeconds: PRESIGNED_EXPIRY_SECONDS },
    })

    return {
      success: true as const,
      data: {
        url: presignedUrl,
        expiresInSeconds: PRESIGNED_EXPIRY_SECONDS,
        filename: item.title,
        mimeType: item.mimeType,
      },
    }
  },

  async semanticSearch(
    input: SemanticSearchInput,
    canViewConfidential: boolean,
    canViewSecret: boolean
  ) {
    const allowed = getAllowedSensitivities(canViewConfidential, canViewSecret)

    // Embed query
    let queryEmbedding: number[]
    try {
      queryEmbedding = await embedText(input.query)
    } catch (err: any) {
      return {
        success: false as const,
        error: `Không thể tạo embedding: ${err.message}`,
      }
    }

    const results = await libraryRepo.semanticSearch(
      queryEmbedding,
      allowed,
      input.limit,
      input.sensitivity
    )

    return {
      success: true as const,
      data: {
        query: input.query,
        results,
        note: results.length === 0
          ? 'Chưa có tài liệu được index hoặc pgvector chưa sẵn sàng. Chạy indexing job trước.'
          : undefined,
      },
    }
  },

  async deleteItem(id: string, userId: string, ipAddress?: string) {
    const item = await libraryRepo.findById(id)
    if (!item) return { success: false as const, error: 'Không tìm thấy tài liệu' }

    await libraryRepo.softDelete(id)

    await logAudit({
      userId,
      functionCode: 'UPLOAD_LIBRARY',
      action: 'DELETE',
      resourceType: 'LIBRARY_ITEM',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress,
    })

    return { success: true as const }
  },
}
