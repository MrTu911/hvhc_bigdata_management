/**
 * Placeholder Parser – M18 Integration
 *
 * Trích xuất danh sách placeholder {name} từ file template.
 *
 * Trạng thái:
 *   HTML  → READY   (regex scan trên text thuần)
 *   DOCX  → READY   (pizzip + docxtemplater đã cài)
 *   XLSX  → SKIP    (XLSX dùng data binding, không dùng placeholder text)
 *
 * Placeholder convention: {fieldName} hoặc {parent.child} hoặc {list[]}
 * Pattern: /\{([a-zA-Z_][a-zA-Z0-9_.]*(?:\[\])?)\}/g
 */

export type TemplateFormat = 'DOCX' | 'XLSX' | 'HTML';

export interface ParseResult {
  placeholders: string[];
  /** true nếu là kết quả thật; false nếu là stub (cần lib chưa cài) */
  reliable: boolean;
  /** Lý do nếu reliable = false */
  note?: string;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse placeholder từ file buffer theo format.
 * Luôn trả về kết quả — không throw — để upload không bị block khi parser chưa đủ.
 */
export async function parsePlaceholders(
  buffer: Buffer,
  format: TemplateFormat,
): Promise<ParseResult> {
  switch (format) {
    case 'DOCX':
      return parseDocx(buffer);
    case 'HTML':
      return parseHtml(buffer);
    case 'XLSX':
      return { placeholders: [], reliable: true, note: 'XLSX không dùng placeholder text' };
    default:
      return { placeholders: [], reliable: false, note: `Format không hỗ trợ: ${format}` };
  }
}

// ─── HTML (READY) ─────────────────────────────────────────────────────────────

function parseHtml(buffer: Buffer): ParseResult {
  try {
    const text = buffer.toString('utf8');
    const placeholders = extractBracketPlaceholders(text);
    return { placeholders, reliable: true };
  } catch {
    return { placeholders: [], reliable: false, note: 'Lỗi parse HTML' };
  }
}

// ─── DOCX (READY) ────────────────────────────────────────────────────────────

import PizZip from 'pizzip';

async function parseDocx(buffer: Buffer): Promise<ParseResult> {
  try {
    const zip = new PizZip(buffer);
    // Scan word/document.xml — đây là file chính chứa content của DOCX
    const xmlContent = zip.files['word/document.xml']?.asText() ?? '';
    const placeholders = extractBracketPlaceholders(xmlContent);
    return { placeholders, reliable: true };
  } catch (err) {
    return {
      placeholders: [],
      reliable: false,
      note: `DOCX parse error: ${err}`,
    };
  }
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function extractBracketPlaceholders(text: string): string[] {
  const matches = text.match(/\{([a-zA-Z_][a-zA-Z0-9_.]*(?:\[\])?)\}/g) ?? [];
  return [...new Set(matches)];
}
