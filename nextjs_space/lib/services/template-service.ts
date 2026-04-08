/**
 * Template Service – M18
 * Business logic cho template CRUD và versioning.
 * DB queries đi qua template.repository, không gọi prisma trực tiếp ở đây.
 */

import { uploadFileToMinio, getPresignedUrl } from '@/lib/minio-client';
import { parsePlaceholders as parsePlaceholdersFromFile } from '@/lib/integrations/render/placeholder-parser';
import { v4 as uuidv4 } from 'uuid';
import {
  findRootTemplates,
  findRootByCode,
  findTemplateById,
  createRootTemplate,
  updateTemplateById,
  softDeleteTemplate,
  findRunningJobForTemplate,
  findVersionsByParentId,
  type TemplateListFilter,
  type TemplateCreateInput,
  type TemplateUpdateInput,
} from '@/lib/repositories/template/template.repository';
import prisma from '@/lib/db';
import { ExportJobStatus } from '@prisma/client';

export const TEMPLATE_BUCKET = 'hvhc-templates';

export const TEMPLATE_CATEGORIES = {
  NHAN_SU: 'Nhân sự',
  DANG_VIEN: 'Đảng viên',
  BAO_HIEM: 'Bảo hiểm',
  CHE_DO: 'Chế độ',
  KHEN_THUONG: 'Khen thưởng',
  DAO_TAO: 'Đào tạo',
  NCKH: 'NCKH',
  TONG_HOP: 'Tổng hợp',
} as const;

// Re-export types so callers import from here, not repository
export type { TemplateListFilter, TemplateCreateInput, TemplateUpdateInput };

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * Danh sách template (chỉ root rows — parentId = null).
 */
export async function listTemplates(params: TemplateListFilter) {
  const result = await findRootTemplates(params);
  return {
    data: result.rows,
    total: result.total,
    page: result.page,
    limit: result.limit,
  };
}

/**
 * Tạo template mới. code phải unique trong root templates.
 */
export async function createTemplate(input: TemplateCreateInput) {
  // Code unique check: code không có @unique trực tiếp nữa; kiểm tra root rows
  const existing = await findRootByCode(input.code);
  if (existing) throw new Error(`Template code "${input.code}" đã tồn tại`);

  return createRootTemplate(input);
}

/**
 * Chi tiết template kèm danh sách versions.
 */
export async function getTemplate(id: string) {
  const template = await findTemplateById(id);
  if (!template) throw new Error('Template không tồn tại');
  return template;
}

/**
 * Cập nhật metadata template.
 * Không tăng version — version chỉ tăng khi upload file (Phase 3).
 */
export async function updateTemplate(id: string, input: TemplateUpdateInput) {
  const template = await findTemplateById(id);
  if (!template) throw new Error('Template không tồn tại');

  return updateTemplateById(id, input);
}

/**
 * Soft delete template. Từ chối nếu có job đang chạy.
 */
export async function deleteTemplate(id: string) {
  const template = await findTemplateById(id);
  if (!template) throw new Error('Template không tồn tại');

  const runningJob = await findRunningJobForTemplate(id);
  if (runningJob) {
    throw new Error('Không thể vô hiệu hóa template đang được sử dụng trong export job');
  }

  return softDeleteTemplate(id);
}

// ─── Versioning (Phase 3 — chờ upload) ───────────────────────────────────────

/**
 * Lấy lịch sử version của template.
 */
export async function getTemplateVersions(id: string, page = 1, limit = 10) {
  return findVersionsByParentId(id, page, limit);
}

/**
 * Rollback về version cũ: tạo version row mới sao chép từ version target,
 * set isLatest = true cho version mới, false cho version cũ.
 * Block nếu có job PENDING hoặc PROCESSING đang chạy.
 *
 * Scope của rollback:
 * - fileKey      → restore file template
 * - dataMap      → restore field mapping (snapshot tại thời điểm version đó)
 * - placeholders → restore danh sách placeholder đã scan
 *
 * KHÔNG rollback: name, description, moduleSource, outputFormats, rbacCode, category.
 * Những field metadata này được coi là state hiện tại, không phải state cũ.
 *
 * AUDIT: caller (route hoặc internal API) có trách nhiệm gọi logAudit sau khi hàm này thành công.
 * Service không tự audit để tránh duplicate khi route đã có audit riêng.
 */
export async function rollbackTemplate(
  id: string,
  targetVersion: number,
  changeNote: string,
  userId: string,
) {
  const runningJob = await findRunningJobForTemplate(id);
  if (runningJob) throw new Error('Không thể rollback khi có export job đang chạy');

  const template = await findTemplateById(id);
  if (!template) throw new Error('Template không tồn tại');

  // Tìm version target trong version rows (parentId = id)
  const sourceRow = await prisma.reportTemplate.findFirst({
    where: { parentId: id, version: targetVersion },
  });
  if (!sourceRow) throw new Error(`Phiên bản ${targetVersion} không tồn tại`);

  const newVersion = template.version + 1;

  // Transaction: unset isLatest cũ, tạo version row mới
  const [, newVersionRow] = await prisma.$transaction([
    prisma.reportTemplate.updateMany({
      where: { parentId: id, isLatest: true },
      data: { isLatest: false },
    }),
    prisma.reportTemplate.create({
      data: {
        code: template.code,
        name: template.name,
        description: template.description,
        moduleSource: template.moduleSource,
        outputFormats: template.outputFormats,
        rbacCode: template.rbacCode,
        fileKey: sourceRow.fileKey,
        placeholders: sourceRow.placeholders ?? undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataMap: sourceRow.dataMap as any,
        category: template.category,
        parentId: id,
        version: newVersion,
        isActive: true,
        isLatest: true,
        changeNote,
        createdBy: userId,
      },
    }),
  ]);

  // Cập nhật root template: file + dataMap + placeholders phải khớp version đã rollback về.
  // Nếu thiếu dataMap/placeholders, root sẽ trả dữ liệu sai cho consumer đọc root row trực tiếp.
  await prisma.reportTemplate.update({
    where: { id },
    data: {
      fileKey: sourceRow.fileKey,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dataMap: sourceRow.dataMap as any,
      placeholders: sourceRow.placeholders ?? undefined,
      version: newVersion,
      isLatest: true,
    },
  });

  return { id, newVersion, rolledBackTo: targetVersion, versionRowId: newVersionRow.id };
}

// ─── Upload (Phase 3 — placeholder, chưa hoàn chỉnh) ─────────────────────────

/**
 * Upload file template lên MinIO.
 * Tạo version row mới, set isLatest, cập nhật root fileKey.
 * Gọi sau khi Phase 3 hoàn thiện.
 */
export async function uploadTemplateFile(
  id: string,
  fileBuffer: Buffer,
  filename: string,
  format: 'DOCX' | 'XLSX' | 'HTML',
  changeNote: string,
  uploadedBy: string,
) {
  const template = await findTemplateById(id);
  if (!template) throw new Error('Template không tồn tại');

  const ext = filename.split('.').pop() || format.toLowerCase();
  const newVersion = template.version + 1;
  const fileKey = `templates/${id}/v${newVersion}_${uuidv4()}.${ext}`;

  const contentTypeMap: Record<string, string> = {
    DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    HTML: 'text/html',
  };

  await uploadFileToMinio(TEMPLATE_BUCKET, fileKey, fileBuffer, {
    'Content-Type': contentTypeMap[format],
    templateId: id,
    format,
  });

  const parseResult = await parsePlaceholdersFromFile(fileBuffer, format);

  // Transaction: unset isLatest cũ → tạo version row → update root
  const [, versionRow] = await prisma.$transaction([
    prisma.reportTemplate.updateMany({
      where: { parentId: id, isLatest: true },
      data: { isLatest: false },
    }),
    prisma.reportTemplate.create({
      data: {
        code: template.code,
        name: template.name,
        description: template.description,
        moduleSource: template.moduleSource,
        outputFormats: Array.from(new Set([...template.outputFormats, format])),
        rbacCode: template.rbacCode,
        fileKey,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        placeholders: parseResult.placeholders as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataMap: template.dataMap as any,
        category: template.category,
        parentId: id,
        version: newVersion,
        isActive: true,
        isLatest: true,
        changeNote,
        createdBy: uploadedBy,
      },
    }),
  ]);

  await prisma.reportTemplate.update({
    where: { id },
    data: {
      fileKey,
      version: newVersion,
      outputFormats: Array.from(new Set([...template.outputFormats, format])),
    },
  });

  return {
    template: { ...template, version: newVersion, fileKey },
    placeholders: parseResult.placeholders,
    placeholderParseReliable: parseResult.reliable,
    placeholderNote: parseResult.note,
    versionRow,
  };
}

/**
 * Presigned download URL cho template file hiện tại.
 */
export async function getTemplateDownloadUrl(id: string, expirySeconds = 3600) {
  const template = await findTemplateById(id);
  if (!template?.fileKey) throw new Error('Template chưa có file');
  return getPresignedUrl(TEMPLATE_BUCKET, template.fileKey, expirySeconds);
}
