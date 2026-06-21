/**
 * Profile Evidence Service — minh chứng (ảnh/PDF) cho hồ sơ điện tử cá nhân.
 *
 * Một backbone dùng chung cho mọi trường/bản ghi (model ProfileEvidence, polymorphic).
 * Service giữ business logic: validate file, ownership SELF, upload MinIO, map DTO.
 * Việc chặn theo vòng đời khai báo (assertDeclaring) do ROUTE enforce — service không gắn HTTP.
 *
 * Lưu trữ: reuse bucket dùng chung 'hvhc-profile-evidence' qua minio-client.
 * View: KHÔNG tin presigned URL lưu trong DB (hết hạn) — tạo URL mới mỗi lần đọc.
 */
import 'server-only';
import { prisma } from '@/lib/db';
import { uploadFileToMinio, getPresignedUrl, deleteFileFromMinio } from '@/lib/minio-client';
import type { ProfileEvidenceTarget } from '@prisma/client';

export const EVIDENCE_BUCKET = 'hvhc-profile-evidence';
export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024; // 10MB
/** Chỉ chấp nhận ảnh và PDF theo yêu cầu nghiệp vụ. */
export const ALLOWED_EVIDENCE_MIME = new Set<string>([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
/** TTL presigned URL khi xem — ngắn để hạn chế rò rỉ link. */
const VIEW_URL_TTL_SECONDS = 60 * 60; // 1h

export interface EvidenceTarget {
  targetType: ProfileEvidenceTarget;
  targetId: string;
  sectionSlug?: string | null;
  /** Khi gắn minh chứng theo trường đơn lẻ (vd 'dateOfBirth'). */
  fieldKey?: string | null;
}

export interface EvidenceFileInput {
  fileName: string;
  buffer: Buffer;
  mimeType: string;
  fileSize: number;
  note?: string | null;
}

export interface EvidenceDTO {
  id: string;
  targetType: ProfileEvidenceTarget;
  targetId: string;
  sectionSlug: string | null;
  fieldKey: string | null;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  note: string | null;
  uploadedBy: string;
  uploadedAt: Date;
  /** Presigned URL mới (1h) để xem/tải; có thể null nếu tạo URL lỗi. */
  viewUrl: string | null;
}

export interface EvidenceValidationError {
  ok: false;
  message: string;
}

/** Kiểm tra loại + kích thước file. Trả null nếu hợp lệ. */
export function validateEvidenceFile(mimeType: string, fileSize: number): EvidenceValidationError | null {
  if (fileSize <= 0 || fileSize > MAX_EVIDENCE_BYTES) {
    return { ok: false, message: 'Kích thước file không hợp lệ (tối đa 10MB)' };
  }
  if (!ALLOWED_EVIDENCE_MIME.has(mimeType)) {
    return { ok: false, message: `Loại file không được phép (chỉ ảnh hoặc PDF): ${mimeType}` };
  }
  return null;
}

function safeName(name: string): string {
  return name.replace(/[^\w.\-]+/g, '_').slice(0, 120);
}

function buildEvidenceObjectKey(userId: string, target: EvidenceTarget, fileName: string): string {
  const segment = target.fieldKey ? `${target.targetId}/${target.fieldKey}` : target.targetId;
  return `profile-evidence/${userId}/${target.targetType}/${segment}/${Date.now()}-${safeName(fileName)}`;
}

async function toDTO(row: {
  id: string;
  targetType: ProfileEvidenceTarget;
  targetId: string;
  sectionSlug: string | null;
  fieldKey: string | null;
  fileName: string;
  objectKey: string;
  bucketName: string;
  mimeType: string | null;
  fileSize: number | null;
  note: string | null;
  uploadedBy: string;
  uploadedAt: Date;
}): Promise<EvidenceDTO> {
  let viewUrl: string | null = null;
  try {
    viewUrl = await getPresignedUrl(row.bucketName, row.objectKey, VIEW_URL_TTL_SECONDS);
  } catch {
    // Không chặn list nếu một file lỗi tạo URL — UI hiển thị "không xem được".
    viewUrl = null;
  }
  return {
    id: row.id,
    targetType: row.targetType,
    targetId: row.targetId,
    sectionSlug: row.sectionSlug,
    fieldKey: row.fieldKey,
    fileName: row.fileName,
    mimeType: row.mimeType,
    fileSize: row.fileSize,
    note: row.note,
    uploadedBy: row.uploadedBy,
    uploadedAt: row.uploadedAt,
    viewUrl,
  };
}

const SELECT = {
  id: true, targetType: true, targetId: true, sectionSlug: true, fieldKey: true,
  fileName: true, objectKey: true, bucketName: true, mimeType: true, fileSize: true,
  note: true, uploadedBy: true, uploadedAt: true,
} as const;

export const ProfileEvidenceService = {
  /** Liệt kê minh chứng (chưa xóa) của một đối tượng cụ thể, kèm viewUrl mới. */
  async list(userId: string, target: EvidenceTarget): Promise<EvidenceDTO[]> {
    const rows = await prisma.profileEvidence.findMany({
      where: {
        userId,
        targetType: target.targetType,
        targetId: target.targetId,
        ...(target.fieldKey !== undefined ? { fieldKey: target.fieldKey } : {}),
        deletedAt: null,
      },
      select: SELECT,
      orderBy: { uploadedAt: 'desc' },
    });
    return Promise.all(rows.map(toDTO));
  },

  /**
   * Đếm minh chứng theo nhiều targetId (cho 1 section/list) → map targetId → số file.
   * Dùng để hiển thị badge "N minh chứng" trên từng bản ghi mà không tạo URL.
   */
  async countByTargets(
    userId: string,
    targetType: ProfileEvidenceTarget,
    targetIds: string[],
  ): Promise<Record<string, number>> {
    if (targetIds.length === 0) return {};
    const grouped = await prisma.profileEvidence.groupBy({
      by: ['targetId'],
      where: { userId, targetType, targetId: { in: targetIds }, deletedAt: null },
      _count: { _all: true },
    });
    const result: Record<string, number> = {};
    for (const g of grouped) result[g.targetId] = g._count._all;
    return result;
  },

  /** Upload + tạo bản ghi minh chứng. Caller chịu trách nhiệm validate quyền + vòng đời. */
  async create(
    userId: string,
    uploadedBy: string,
    target: EvidenceTarget,
    file: EvidenceFileInput,
  ): Promise<EvidenceDTO> {
    const objectKey = buildEvidenceObjectKey(userId, target, file.fileName);
    await uploadFileToMinio(EVIDENCE_BUCKET, objectKey, file.buffer, {
      uploadedBy,
      ownerUserId: userId,
      targetType: target.targetType,
    });

    let fileUrl = '';
    try {
      fileUrl = await getPresignedUrl(EVIDENCE_BUCKET, objectKey, VIEW_URL_TTL_SECONDS);
    } catch {
      fileUrl = ''; // URL sẽ được tạo lại khi đọc; không chặn create.
    }

    const created = await prisma.profileEvidence.create({
      data: {
        userId,
        targetType: target.targetType,
        sectionSlug: target.sectionSlug ?? null,
        targetId: target.targetId,
        fieldKey: target.fieldKey ?? null,
        fileName: file.fileName,
        objectKey,
        bucketName: EVIDENCE_BUCKET,
        fileUrl,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        note: file.note ?? null,
        uploadedBy,
      },
      select: SELECT,
    });
    return toDTO(created);
  },

  /** Lấy 1 bản ghi của chính chủ (để tạo URL tải). Trả null nếu không thuộc sở hữu. */
  async getOwned(userId: string, id: string) {
    return prisma.profileEvidence.findFirst({
      where: { id, userId, deletedAt: null },
      select: SELECT,
    });
  },

  /** Soft-delete bản ghi + xóa object MinIO. Trả false nếu không thuộc sở hữu. */
  async softDelete(userId: string, id: string, actorId: string): Promise<boolean> {
    const row = await prisma.profileEvidence.findFirst({
      where: { id, userId, deletedAt: null },
      select: { id: true, bucketName: true, objectKey: true },
    });
    if (!row) return false;

    await prisma.profileEvidence.update({
      where: { id: row.id },
      data: { deletedAt: new Date(), deletedBy: actorId },
    });

    // Xóa object vật lý sau khi soft-delete DB; lỗi MinIO không rollback (bản ghi đã đánh dấu xóa).
    try {
      await deleteFileFromMinio(row.bucketName, row.objectKey);
    } catch (err) {
      console.error('[ProfileEvidenceService.softDelete] MinIO delete failed', { id, err });
    }
    return true;
  },
};
