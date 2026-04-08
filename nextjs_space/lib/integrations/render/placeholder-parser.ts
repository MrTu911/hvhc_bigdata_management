/**
 * Placeholder Parser – M18 Integration
 *
 * Trích xuất danh sách placeholder {name} từ file template.
 *
 * Trạng thái:
 *   HTML  → READY   (regex scan trên text thuần)
 *   DOCX  → STUB    (cần cài: npm install pizzip docxtemplater)
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

// ─── DOCX (STUB) ─────────────────────────────────────────────────────────────
//
// DOCX là ZIP chứa XML — không thể scan raw bytes vì:
//   1. Binary ZIP header sẽ corrupt khi decode UTF-8
//   2. Placeholder nằm trong word/document.xml bên trong ZIP
//
// Để enable:
//   npm install pizzip docxtemplater
//   Uncomment implementation bên dưới và xóa stub return.
//
// Implementation sẵn sàng (chỉ cần uncomment):
//
//   import PizZip from 'pizzip';
//   import Docxtemplater from 'docxtemplater';
//
//   async function parseDocx(buffer: Buffer): Promise<ParseResult> {
//     try {
//       const zip = new PizZip(buffer);
//       const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
//       // docxtemplater expose tags sau khi render dry-run
//       const tags: string[] = [];
//       const xmlContent = zip.files['word/document.xml']?.asText() ?? '';
//       const found = extractBracketPlaceholders(xmlContent);
//       return { placeholders: found, reliable: true };
//     } catch (err) {
//       return { placeholders: [], reliable: false, note: `DOCX parse error: ${err}` };
//     }
//   }

async function parseDocx(buffer: Buffer): Promise<ParseResult> {
  // STUB: pizzip + docxtemplater chưa được cài.
  // Thực hiện best-effort scan trên raw bytes để có kết quả gần đúng.
  // Kết quả KHÔNG đáng tin — dùng làm gợi ý ban đầu cho người dùng kiểm tra thủ công.
  try {
    // DOCX là ZIP — cắt phần header ZIP trước để tránh garbage bytes
    const text = buffer.toString('latin1'); // latin1 không mất byte, an toàn hơn utf8 cho binary
    const xmlLike = text.replace(/[^\x20-\x7E{}\[\]._ ]/g, ' '); // giữ printable + placeholder chars
    const placeholders = extractBracketPlaceholders(xmlLike);
    return {
      placeholders,
      reliable: false,
      note: 'STUB: cài pizzip + docxtemplater để parse DOCX chính xác',
    };
  } catch {
    return {
      placeholders: [],
      reliable: false,
      note: 'STUB: cài pizzip + docxtemplater để parse DOCX chính xác',
    };
  }
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function extractBracketPlaceholders(text: string): string[] {
  const matches = text.match(/\{([a-zA-Z_][a-zA-Z0-9_.]*(?:\[\])?)\}/g) ?? [];
  return [...new Set(matches)];
}
