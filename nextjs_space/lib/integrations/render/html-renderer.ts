/**
 * HTML Template Renderer – M18
 *
 * Render một template HTML (lưu trong MinIO M18_TEMPLATE) thành HTML hoàn chỉnh
 * để Puppeteer xuất PDF hoặc trả trực tiếp dưới dạng HTML.
 *
 * Dùng CHUNG quy ước placeholder với docxtemplater để một bộ mẫu phục vụ cả
 * DOCX lẫn HTML/PDF:
 *   - Scalar:   {fieldName} hoặc {parent.child}
 *   - Vòng lặp: {#listKey}...{fieldOfItem}...{/listKey}
 *
 * Hàm thuần, không phụ thuộc DB/service nên test độc lập được. Giá trị dữ liệu
 * được HTML-escape khi chèn (chống vỡ markup); chỉ thay placeholder dạng {tenToken}
 * (không khoảng trắng) nên KHÔNG đụng tới dấu ngoặc nhọn trong CSS ("body { ... }").
 */

/** Token placeholder hợp lệ: bắt đầu bằng chữ/underscore, cho phép dot-path. */
const PLACEHOLDER_TOKEN = /\{([a-zA-Z_][a-zA-Z0-9_.]*)\}/g;

/**
 * Render template HTML với dữ liệu đã resolve.
 *   1. Bung các block vòng lặp {#list}...{/list}.
 *   2. Thay scalar còn lại; placeholder không khớp -> chuỗi rỗng.
 */
export function renderHtmlTemplate(
  template: string,
  data: Record<string, unknown>,
): string {
  const expanded = expandLoops(template, data);
  return renderScalars(expanded, data);
}

/**
 * Bung mọi block {#key}...{/key}. Mỗi item lặp được render với context gộp
 * { ...outerData, ...item } để vừa truy cập field của item vừa giữ scalar ngoài.
 * Mảng rỗng / không phải mảng -> bỏ hẳn block.
 */
function expandLoops(template: string, data: Record<string, unknown>): string {
  let result = '';
  let cursor = 0;

  while (cursor < template.length) {
    const open = findNextLoopOpen(template, cursor);
    if (!open) {
      result += template.slice(cursor);
      break;
    }

    // Phần tĩnh trước block vòng lặp giữ nguyên.
    result += template.slice(cursor, open.start);

    const closeTag = `{/${open.key}}`;
    const closeIndex = template.indexOf(closeTag, open.contentStart);
    if (closeIndex === -1) {
      // Thiếu thẻ đóng -> coi như văn bản thường để không nuốt nội dung.
      result += template.slice(open.start);
      break;
    }

    const inner = template.slice(open.contentStart, closeIndex);
    const items = data[open.key];
    if (Array.isArray(items)) {
      for (const item of items) {
        const itemContext = isPlainObject(item)
          ? { ...data, ...(item as Record<string, unknown>) }
          : { ...data, value: item };
        // Hỗ trợ lồng nhau an toàn (đệ quy bung loop con nếu có).
        result += renderScalars(expandLoops(inner, itemContext), itemContext);
      }
    }
    // items không phải mảng -> block bị loại bỏ.

    cursor = closeIndex + closeTag.length;
  }

  return result;
}

interface LoopOpen {
  key: string;
  start: number; // vị trí ký tự '{'
  contentStart: number; // vị trí ngay sau '}'
}

/** Tìm thẻ mở vòng lặp {#key} kế tiếp từ vị trí from. */
function findNextLoopOpen(template: string, from: number): LoopOpen | null {
  const openRegex = /\{#([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  openRegex.lastIndex = from;
  const match = openRegex.exec(template);
  if (!match) return null;
  return {
    key: match[1],
    start: match.index,
    contentStart: match.index + match[0].length,
  };
}

/** Thay scalar {token}; mảng/undefined/null -> rỗng; giá trị được HTML-escape. */
function renderScalars(html: string, data: Record<string, unknown>): string {
  return html.replace(PLACEHOLDER_TOKEN, (_match, key: string) => {
    const value = getByPath(data, key);
    if (value === undefined || value === null || Array.isArray(value)) return '';
    return escapeHtml(String(value));
  });
}

/** Lấy giá trị theo key (hỗ trợ dot-path cho field lồng nhau). */
function getByPath(obj: Record<string, unknown>, path: string): unknown {
  if (path in obj) return obj[path];
  return path
    .split('.')
    .reduce<unknown>((acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]), obj);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
