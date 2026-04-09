/**
 * Template Import Service – M18 UC-T12
 *
 * Orchestrates: upload → analyze → suggest mappings → confirm → create template.
 *
 * analyzeAndSave  : upload file lên MinIO, parse, gợi ý mapping, lưu TemplateImportAnalysis
 * confirmAndCreate: xác nhận mapping, tạo ReportTemplate version 1
 */

import prisma from '@/lib/db';
import { uploadFileToMinio } from '@/lib/minio-client';
import { TEMPLATE_BUCKET } from './template-service';
import { analyzeTemplateBuffer, validateUploadedFile } from '@/lib/integrations/render/template-analyzer';
import { suggestMappings, SuggestedMapping } from '@/lib/integrations/ai/template-field-matcher';
import { TEMPLATES } from '@/lib/rbac/function-codes';

// TTL phân tích: 24 giờ
const ANALYSIS_TTL_MS = 24 * 60 * 60 * 1000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnalysisPayload {
  placeholders: string[];
  suggestedMappings: SuggestedMapping[];
  fileStats: {
    fileName: string;
    fileType: string;
    fileSizeBytes: number;
    reliable: boolean;
    note?: string;
  };
}

export interface AnalyzeResult {
  analysisId: string;
  expiresAt: Date;
  payload: AnalysisPayload;
}

export interface ConfirmInput {
  analysisId: string;
  templateName: string;
  templateCode: string;
  description?: string;
  category?: string;
  entityType?: string;
  outputFormats?: string[];
  /** { [placeholder]: fieldKey } — map trực tiếp thành dataMap */
  confirmedMappings: Record<string, string>;
  requestedBy: string;
}

export interface ConfirmResult {
  templateId: string;
  templateCode: string;
  version: number;
}

// ─── analyzeAndSave ───────────────────────────────────────────────────────────

/**
 * Upload file lên MinIO, phân tích placeholder, lưu TemplateImportAnalysis.
 */
export async function analyzeAndSave(
  fileBuffer: Buffer,
  fileName: string,
  requestedBy: string,
): Promise<AnalyzeResult> {
  // Validate format + size (throws nếu không hợp lệ)
  validateUploadedFile(fileName, fileBuffer.length);

  // Upload lên MinIO
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileKey = `imports/${Date.now()}_${safeFileName}`;
  await uploadFileToMinio(TEMPLATE_BUCKET, fileKey, fileBuffer, {
    'Content-Type': 'application/octet-stream',
    requestedBy,
  });

  // Phân tích buffer
  const analysisResult = await analyzeTemplateBuffer(fileBuffer, fileName);

  // Gợi ý mapping rule-based
  const suggestedMappings = suggestMappings(analysisResult.placeholders);

  const payload: AnalysisPayload = {
    placeholders: analysisResult.placeholders,
    suggestedMappings,
    fileStats: analysisResult.fileStats,
  };

  // Lưu vào DB
  const expiresAt = new Date(Date.now() + ANALYSIS_TTL_MS);
  const record = await prisma.templateImportAnalysis.create({
    data: {
      uploadedFileKey: fileKey,
      detectedPlaceholders: payload as unknown as object,
      status: 'ANALYZED',
      requestedBy,
      expiresAt,
    },
  });

  console.info(
    `[template-import] analyzed analysisId=${record.id} file=${fileName} placeholders=${analysisResult.placeholders.length} reliable=${analysisResult.fileStats.reliable}`,
  );

  return { analysisId: record.id, expiresAt, payload };
}

// ─── confirmAndCreate ─────────────────────────────────────────────────────────

/**
 * Xác nhận mapping và tạo ReportTemplate version 1.
 */
export async function confirmAndCreate(input: ConfirmInput): Promise<ConfirmResult> {
  const { analysisId, templateName, templateCode, requestedBy } = input;

  // Load analysis
  const analysis = await prisma.templateImportAnalysis.findUnique({
    where: { id: analysisId },
  });
  if (!analysis) {
    throw new Error('Phân tích không tồn tại. Vui lòng upload lại file.');
  }
  if (analysis.status === 'CONFIRMED') {
    throw new Error('Phân tích này đã được xác nhận trước đó.');
  }
  if (analysis.status === 'EXPIRED' || analysis.expiresAt < new Date()) {
    await prisma.templateImportAnalysis.update({
      where: { id: analysisId },
      data: { status: 'EXPIRED' },
    });
    throw new Error('Phiên phân tích đã hết hạn. Vui lòng upload lại file.');
  }

  // Kiểm tra code trùng version 1
  const existing = await prisma.reportTemplate.findFirst({
    where: { code: templateCode, version: 1, deletedAt: null },
  });
  if (existing) {
    throw new Error(`Code "${templateCode}" đã tồn tại. Vui lòng chọn code khác.`);
  }

  // Build dataMap từ confirmedMappings — chỉ giữ mapping có giá trị
  const dataMap: Record<string, string> = {};
  for (const [placeholder, fieldKey] of Object.entries(input.confirmedMappings)) {
    if (fieldKey && fieldKey.trim()) {
      dataMap[placeholder] = fieldKey.trim();
    }
  }

  const outputFormats = input.outputFormats?.length
    ? input.outputFormats
    : [analysis.uploadedFileKey.endsWith('.xlsx') ? 'XLSX' : 'DOCX'];

  // Tạo ReportTemplate
  const template = await prisma.reportTemplate.create({
    data: {
      code: templateCode,
      name: templateName,
      description: input.description ?? null,
      category: input.category ?? null,
      moduleSource: input.entityType ? [input.entityType] : [],
      outputFormats,
      fileKey: analysis.uploadedFileKey,
      version: 1,
      isActive: false, // pending review — admin bật sau
      isLatest: true,
      rbacCode: TEMPLATES.EXPORT_DATA,
      dataMap: dataMap as unknown as object,
      placeholders: (analysis.detectedPlaceholders as unknown as AnalysisPayload).placeholders ?? [],
      changeNote: `Imported từ file: ${(analysis.detectedPlaceholders as unknown as AnalysisPayload).fileStats?.fileName ?? 'unknown'}`,
      parentId: null,
      createdBy: requestedBy,
    },
  });

  // Update analysis status
  await prisma.templateImportAnalysis.update({
    where: { id: analysisId },
    data: {
      status: 'CONFIRMED',
      confirmedMappings: dataMap as unknown as object,
    },
  });

  console.info(
    `[template-import] confirmed analysisId=${analysisId} → templateId=${template.id} code=${templateCode}`,
  );

  return { templateId: template.id, templateCode: template.code, version: template.version };
}
