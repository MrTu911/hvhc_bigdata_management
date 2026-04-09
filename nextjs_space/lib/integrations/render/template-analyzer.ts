/**
 * Template Analyzer – M18 Integration
 *
 * Phân tích file template upload (DOCX/XLSX/HTML):
 *   - trích xuất placeholder
 *   - đo thống kê file
 *
 * Không lưu DB, không upload MinIO — chỉ thuần phân tích buffer.
 * Caller (template-import.service) chịu trách nhiệm I/O.
 */

import { parsePlaceholders, TemplateFormat } from './placeholder-parser';

export interface FileStats {
  fileName: string;
  fileType: TemplateFormat;
  fileSizeBytes: number;
  reliable: boolean;
  note?: string;
}

export interface TemplateAnalysisResult {
  placeholders: string[];
  fileStats: FileStats;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Xác định format từ tên file.
 * Trả null nếu không phải DOCX/XLSX/HTML.
 */
export function detectFormat(fileName: string): TemplateFormat | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.docx')) return 'DOCX';
  if (lower.endsWith('.xlsx')) return 'XLSX';
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'HTML';
  return null;
}

/**
 * Validate file trước khi phân tích.
 * Throw nếu không hợp lệ.
 */
export function validateUploadedFile(fileName: string, fileSizeBytes: number): TemplateFormat {
  const format = detectFormat(fileName);
  if (!format) {
    throw new Error('Chỉ hỗ trợ file .docx, .xlsx, .html. Vui lòng chọn đúng định dạng.');
  }
  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File vượt quá giới hạn 10MB (${(fileSizeBytes / 1024 / 1024).toFixed(1)} MB).`);
  }
  return format;
}

/**
 * Phân tích buffer template, trả về placeholder list và file stats.
 */
export async function analyzeTemplateBuffer(
  buffer: Buffer,
  fileName: string,
): Promise<TemplateAnalysisResult> {
  const format = validateUploadedFile(fileName, buffer.length);

  const parseResult = await parsePlaceholders(buffer, format);

  return {
    placeholders: parseResult.placeholders,
    fileStats: {
      fileName,
      fileType: format,
      fileSizeBytes: buffer.length,
      reliable: parseResult.reliable,
      note: parseResult.note,
    },
  };
}
