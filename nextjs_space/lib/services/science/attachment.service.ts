/**
 * AttachmentService – CSDL-KHQL Phase 6: File Minh Chứng
 *
 * Upload pipeline: receive → validate MIME/size → checksum → ClamAV scan → MinIO put → DB create
 * Download:        DB get → sensitivity check → presigned URL 15min → audit log
 * Delete:          soft delete (isDeleted=true), không xóa MinIO trừ khi admin purge
 *
 * Reuse MinIO helpers từ library.service.ts cùng bucket khác: hvhc-science-attachments
 */
import 'server-only'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import prisma from '@/lib/db'
import { scanBuffer } from '@/lib/integrations/clamav'
import { logAudit } from '@/lib/audit'
import {
  uploadObject,
  getPresignedDownloadUrl,
} from '@/lib/services/infrastructure/storage.service'
import {
  MAX_ATTACHMENT_SIZE_BYTES,
  ATTACHMENT_ALLOWED_MIME_TYPES,
  ENTITY_ALLOWED_CATEGORIES,
} from '@/lib/validations/science-attachment'
import type { AttachmentUploadMeta, ScienceEntityType } from '@/lib/validations/science-attachment'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Chuyển BigInt fileSize → number để JSON.stringify không lỗi */
function serializeAttachment<T extends { fileSize: bigint }>(a: T): Omit<T, 'fileSize'> & { fileSize: number } {
  return { ...a, fileSize: Number(a.fileSize) }
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Presigned URL expiry: 15 phút */
const PRESIGNED_EXPIRY_SECONDS = 15 * 60

// ─── Service ──────────────────────────────────────────────────────────────────

export const attachmentService = {
  async listAttachments(entityType: ScienceEntityType, entityId: string) {
    const items = await prisma.scienceAttachment.findMany({
      where: { entityType, entityId, isDeleted: false },
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    })
    return { success: true as const, data: items.map(serializeAttachment) }
  },

  async uploadAttachment(
    file: Buffer,
    filename: string,
    mimeType: string,
    meta: AttachmentUploadMeta,
    userId: string,
    ipAddress?: string
  ) {
    // 1. Validate MIME type
    if (!(ATTACHMENT_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
      return { success: false as const, error: `Loại file không được phép: ${mimeType}` }
    }

    // 2. Validate file size
    if (file.length > MAX_ATTACHMENT_SIZE_BYTES) {
      return { success: false as const, error: 'File vượt quá 100MB' }
    }

    // 3. Validate docCategory phù hợp với entityType
    const allowedCats = ENTITY_ALLOWED_CATEGORIES[meta.entityType]
    if (!allowedCats.includes(meta.docCategory)) {
      return {
        success: false as const,
        error: `Loại tài liệu "${meta.docCategory}" không phù hợp với entity "${meta.entityType}"`,
      }
    }

    // 4. SHA-256 checksum
    const checksum = crypto.createHash('sha256').update(file).digest('hex')

    // 5. ClamAV scan
    const scanResult = await scanBuffer(file)
    if (!scanResult.clean) {
      await logAudit({
        userId,
        functionCode: 'SCIENCE.ATTACHMENT_UPLOAD',
        action: 'CREATE',
        resourceType: 'SCIENCE_ATTACHMENT',
        resourceId: 'N/A',
        result: 'FAIL',
        ipAddress,
        metadata: { threat: scanResult.threat, filename, entityType: meta.entityType, entityId: meta.entityId },
      })
      return { success: false as const, error: `File bị từ chối bởi ClamAV: ${scanResult.threat}` }
    }

    // 6. Upload lên MinIO: science-attachments/{entityType}/{uuid}.{ext}
    const ext = filename.includes('.') ? filename.split('.').pop()! : 'bin'
    const objectKey = `science-attachments/${meta.entityType.toLowerCase()}/${uuidv4()}.${ext}`

    await uploadObject('M09_RESEARCH', objectKey, file, {
      module:           'M09',
      'entity-type':    meta.entityType,
      'entity-id':      meta.entityId,
      'uploaded-by':    userId,
      classification:   meta.sensitivity === 'SECRET' ? 'SECRET'
                      : meta.sensitivity === 'CONFIDENTIAL' ? 'CONFIDENTIAL'
                      : 'INTERNAL',
      'x-meta-title':        meta.title,
      'x-meta-category':     meta.docCategory,
      'x-meta-checksum':     checksum,
    })

    // 7. Tạo DB record
    const attachment = await prisma.scienceAttachment.create({
      data: {
        entityType: meta.entityType,
        entityId: meta.entityId,
        docCategory: meta.docCategory,
        title: meta.title,
        description: meta.description ?? null,
        filePath: objectKey,
        fileSize: BigInt(file.length),
        mimeType,
        checksumSha256: checksum,
        sensitivity: meta.sensitivity,
        uploadedById: userId,
      },
      include: { uploadedBy: { select: { id: true, name: true } } },
    })

    await logAudit({
      userId,
      functionCode: 'SCIENCE.ATTACHMENT_UPLOAD',
      action: 'CREATE',
      resourceType: 'SCIENCE_ATTACHMENT',
      resourceId: attachment.id,
      result: 'SUCCESS',
      ipAddress,
      metadata: { objectKey, checksum, entityType: meta.entityType, entityId: meta.entityId, category: meta.docCategory },
    })

    return { success: true as const, data: serializeAttachment(attachment) }
  },

  async getDownloadUrl(
    attachmentId: string,
    userId: string,
    canViewConfidential: boolean,
    canViewSecret: boolean,
    ipAddress?: string
  ) {
    const item = await prisma.scienceAttachment.findFirst({
      where: { id: attachmentId, isDeleted: false },
    })
    if (!item) return { success: false as const, error: 'Không tìm thấy tài liệu' }

    // Sensitivity check
    if (item.sensitivity === 'CONFIDENTIAL' && !canViewConfidential) {
      return { success: false as const, error: 'Không có quyền tải tài liệu MẬT' }
    }
    if (item.sensitivity === 'SECRET' && !canViewSecret) {
      return { success: false as const, error: 'Không có quyền tải tài liệu TỐI MẬT' }
    }

    const presignedUrl = await getPresignedDownloadUrl('M09_RESEARCH', item.filePath, { expirySeconds: PRESIGNED_EXPIRY_SECONDS })

    await logAudit({
      userId,
      functionCode: 'SCIENCE.ATTACHMENT_VIEW',
      action: 'READ',
      resourceType: 'SCIENCE_ATTACHMENT',
      resourceId: attachmentId,
      result: 'SUCCESS',
      ipAddress,
      metadata: { entityType: item.entityType, entityId: item.entityId, sensitivity: item.sensitivity },
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

  async deleteAttachment(
    attachmentId: string,
    userId: string,
    ipAddress?: string
  ) {
    const item = await prisma.scienceAttachment.findFirst({
      where: { id: attachmentId, isDeleted: false },
    })
    if (!item) return { success: false as const, error: 'Không tìm thấy tài liệu' }

    // Chỉ người upload hoặc admin mới được xóa — caller tự check quyền trước khi gọi service

    await prisma.scienceAttachment.update({
      where: { id: attachmentId },
      data: { isDeleted: true, deletedById: userId },
    })

    await logAudit({
      userId,
      functionCode: 'SCIENCE.ATTACHMENT_UPLOAD',
      action: 'DELETE',
      resourceType: 'SCIENCE_ATTACHMENT',
      resourceId: attachmentId,
      result: 'SUCCESS',
      ipAddress,
      metadata: { entityType: item.entityType, entityId: item.entityId },
    })

    return { success: true as const }
  },
}
