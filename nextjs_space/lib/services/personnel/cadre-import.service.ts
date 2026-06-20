/**
 * Cadre Import Service — nhập "Hồ sơ cán bộ điện tử" (mẫu 99 trường) từ file Excel.
 *
 * Phương án DETERMINISTIC (không dùng AI): hệ thống phát file Excel mẫu, cán bộ điền/sửa
 * rồi tải lên. Parse theo metadata field (EXTENDED_FIELD_GROUPS + CADRE_LIST_SECTIONS),
 * không đoán mò.
 *
 * Quy ước:
 *   - Trường scalar (sheet "Trường đơn"): import = OVERWRITE (idempotent, an toàn chạy lại).
 *   - Bảng danh sách (mỗi nhóm 1 sheet): import = APPEND (chỉ thêm dòng người dùng nhập).
 *     → Template KHÔNG prefill sẵn dữ liệu danh sách để tránh nhân đôi khi tải lại.
 *
 * Ghi qua đúng write-path đã có (CadreExtendedProfileService / CadreProfileSectionService)
 * nên scope + audit + mask nhạy cảm vẫn được enforce một nguồn.
 */
import 'server-only';
import ExcelJS from 'exceljs';
import {
  EXTENDED_FIELD_GROUPS,
  CADRE_LIST_SECTIONS,
  type CadreField,
  type CadreListSection,
} from '@/lib/constants/cadre-profile-sections';
import {
  CadreExtendedProfileService,
  CadreProfileSectionService,
} from '@/lib/services/personnel/cadre-profile-section.service';
import type { AuthUser } from '@/lib/rbac/types';
import type { FunctionScope } from '@prisma/client';

const SCALAR_SHEET = 'Trường đơn';
const GUIDE_SHEET = 'Hướng dẫn';
const COL_GROUP = 'Nhóm';
const COL_KEY = 'Mã trường';
const COL_LABEL = 'Tên trường';
const COL_VALUE = 'Giá trị';
const COL_HINT = 'Gợi ý / Định dạng';

const SCALAR_FIELDS: CadreField[] = EXTENDED_FIELD_GROUPS.flatMap((g) =>
  g.fields.map((f) => ({ ...f, _group: g.title } as CadreField & { _group: string })),
);

// ─── Định dạng & chuẩn hóa giá trị ──────────────────────────────────────────────

function formatDmy(value: Date | string | null | undefined): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

/** dd/mm/yyyy | yyyy-mm-dd | Date → ISO 'yyyy-mm-dd'; không hợp lệ → null. */
function toIsoDate(raw: unknown): string | null {
  if (raw == null || raw === '') return null;
  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return null;
    return `${raw.getUTCFullYear()}-${String(raw.getUTCMonth() + 1).padStart(2, '0')}-${String(raw.getUTCDate()).padStart(2, '0')}`;
  }
  const s = String(raw).trim();
  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmy) {
    const [, dd, mm, yyyy] = dmy;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : toIsoDate(parsed);
}

/** Số có thể dùng dấu phẩy thập phân kiểu VN ("7,3" → 7.3). */
function parseNumberLike(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const n = Number(String(raw).trim().replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function parseBooleanLike(raw: unknown): boolean | null {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().toLowerCase();
  if (['có', 'x', 'true', '1', 'đúng', 'yes'].includes(s)) return true;
  if (['không', 'false', '0', 'no'].includes(s)) return false;
  return null;
}

/** Cho trường select: nhận label tiếng Việt HOẶC value enum → trả value enum. */
function resolveSelectValue(field: CadreField, raw: unknown): { value: string | null; invalid: boolean } {
  const s = String(raw).trim();
  if (!s) return { value: null, invalid: false };
  const opts = field.options ?? [];
  const byValue = opts.find((o) => o.value === s);
  if (byValue) return { value: byValue.value, invalid: false };
  const byLabel = opts.find((o) => o.label.toLowerCase() === s.toLowerCase());
  if (byLabel) return { value: byLabel.value, invalid: false };
  return { value: null, invalid: true };
}

/** Hiển thị value enum → label tiếng Việt khi prefill template. */
function selectLabel(field: CadreField, value: unknown): string {
  if (value == null || value === '') return '';
  const opt = field.options?.find((o) => o.value === String(value));
  return opt ? opt.label : String(value);
}

function displayPrefill(field: CadreField, value: unknown): string {
  if (value == null || value === '') return '';
  switch (field.type) {
    case 'date':
      return formatDmy(value as Date);
    case 'select':
      return selectLabel(field, value);
    case 'boolean':
      return value ? 'Có' : 'Không';
    default:
      return String(value);
  }
}

function fieldHint(field: CadreField, canSensitive = false): string {
  if (field.sensitive && !canSensitive) return 'Trường nhạy cảm — không nhập (thiếu quyền)';
  const prefix = field.sensitive ? '(Nhạy cảm) ' : '';
  switch (field.type) {
    case 'date':
      return prefix + 'Định dạng ngày: dd/mm/yyyy';
    case 'number':
      return prefix + 'Số nguyên';
    case 'decimal':
      return prefix + 'Số (dùng dấu phẩy: 7,3)';
    case 'boolean':
      return prefix + 'Nhập: Có / Không';
    case 'select':
      return prefix + 'Chọn: ' + (field.options ?? []).map((o) => o.label).join(' | ');
    default:
      return prefix.trim();
  }
}

// ─── Excel sheet name (≤31 ký tự, loại ký tự cấm) ───────────────────────────────

function sheetName(title: string, used: Set<string>): string {
  let base = title.replace(/[:\\/?*[\]]/g, ' ').trim().slice(0, 31);
  let name = base;
  let i = 2;
  while (used.has(name)) {
    const suffix = ` (${i})`;
    name = base.slice(0, 31 - suffix.length) + suffix;
    i += 1;
  }
  used.add(name);
  return name;
}

function styleHeaderRow(row: ExcelJS.Row): void {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  row.alignment = { vertical: 'middle' };
}

// ─── Build template ─────────────────────────────────────────────────────────────

export interface CadreImportPrefill {
  extended: Record<string, unknown>;
}

export async function buildImportTemplateWorkbook(
  prefill?: CadreImportPrefill,
  canSensitive = false,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HVHC BigData';
  const usedNames = new Set<string>();

  // Sheet hướng dẫn
  const guide = workbook.addWorksheet(sheetName(GUIDE_SHEET, usedNames));
  guide.columns = [{ width: 100 }];
  const guideLines = [
    'HƯỚNG DẪN NHẬP HỒ SƠ CÁN BỘ ĐIỆN TỬ (MẪU 99 TRƯỜNG)',
    '',
    `1. Sheet "${SCALAR_SHEET}": điền cột "${COL_VALUE}" cho các trường thông tin mở rộng.`,
    '   - Để trống ô nào thì trường đó KHÔNG bị thay đổi.',
    '   - Nhập đè (overwrite): nhập lại nhiều lần đều an toàn.',
    '2. Mỗi sheet danh sách (Khen thưởng, Gia đình, ...): mỗi DÒNG là một bản ghi sẽ được THÊM MỚI.',
    '   - Chỉ điền những dòng cần thêm. Tải lên nhiều lần sẽ thêm trùng — hãy cân nhắc.',
    '   - Sửa/xóa bản ghi danh sách đã có: dùng trực tiếp trên giao diện hồ sơ.',
    '3. Định dạng ngày: dd/mm/yyyy. Số thập phân dùng dấu phẩy (vd: 7,3).',
    '4. Trường nhạy cảm (lương, giá trị tài sản...) không nhập được qua trang tự phục vụ.',
    '5. KHÔNG đổi tên sheet, KHÔNG đổi tiêu đề cột.',
  ];
  guideLines.forEach((line, i) => {
    const row = guide.addRow([line]);
    if (i === 0) row.font = { bold: true, size: 14 };
  });

  // Sheet trường đơn
  const scalar = workbook.addWorksheet(sheetName(SCALAR_SHEET, usedNames));
  scalar.columns = [
    { header: COL_GROUP, key: 'group', width: 22 },
    { header: COL_KEY, key: 'key', width: 24 },
    { header: COL_LABEL, key: 'label', width: 32 },
    { header: COL_VALUE, key: 'value', width: 36 },
    { header: COL_HINT, key: 'hint', width: 48 },
  ];
  styleHeaderRow(scalar.getRow(1));
  for (const field of SCALAR_FIELDS) {
    const group = (field as CadreField & { _group?: string })._group ?? '';
    const value = field.sensitive && !canSensitive ? '' : displayPrefill(field, prefill?.extended?.[field.name]);
    scalar.addRow({ group, key: field.name, label: field.label, value, hint: fieldHint(field, canSensitive) });
  }
  scalar.getColumn('key').font = { color: { argb: 'FF6B7280' } };

  // Sheet mỗi nhóm danh sách
  for (const section of CADRE_LIST_SECTIONS) {
    const ws = workbook.addWorksheet(sheetName(section.title, usedNames));
    ws.columns = section.fields.map((f) => ({ header: f.label, key: f.name, width: 26 }));
    const header = ws.getRow(1);
    styleHeaderRow(header);
    section.fields.forEach((f, idx) => {
      const hint = fieldHint(f, canSensitive);
      if (hint) header.getCell(idx + 1).note = hint;
    });
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// ─── Parse template ──────────────────────────────────────────────────────────────

export interface CadreImportSectionPreview {
  slug: string;
  title: string;
  newCount: number;
  rows: Record<string, string>[];
}

export interface CadreImportAnalysis {
  /** Payload sẵn sàng cho service (ISO date, enum value). */
  extended: Record<string, unknown>;
  sections: Record<string, Record<string, unknown>[]>;
  /** Hiển thị cho người dùng review. */
  extendedPreview: { label: string; value: string }[];
  sectionsPreview: CadreImportSectionPreview[];
  warnings: string[];
}

function cellText(cell: ExcelJS.Cell | undefined): string {
  if (!cell) return '';
  const v = cell.value;
  if (v == null) return '';
  if (v instanceof Date) return formatDmy(v);
  if (typeof v === 'object') {
    // rich text / hyperlink / formula result
    const obj = v as { text?: string; result?: unknown; richText?: { text: string }[] };
    if (obj.richText) return obj.richText.map((r) => r.text).join('');
    if (obj.text) return obj.text;
    if (obj.result != null) return String(obj.result);
    return '';
  }
  return String(v).trim();
}

/** Chuẩn hóa 1 giá trị theo field; trả {value, warning}. */
function normalizeFieldValue(
  field: CadreField,
  raw: string,
  context: string,
): { value: unknown; warning?: string } {
  if (raw === '') return { value: null };
  switch (field.type) {
    case 'date': {
      const iso = toIsoDate(raw);
      if (!iso) return { value: null, warning: `${context}: ngày không hợp lệ "${raw}" (cần dd/mm/yyyy)` };
      return { value: iso };
    }
    case 'number': {
      const n = parseNumberLike(raw);
      if (n == null) return { value: null, warning: `${context}: số không hợp lệ "${raw}"` };
      return { value: Math.trunc(n) };
    }
    case 'decimal': {
      const n = parseNumberLike(raw);
      if (n == null) return { value: null, warning: `${context}: số không hợp lệ "${raw}"` };
      return { value: n };
    }
    case 'boolean': {
      const b = parseBooleanLike(raw);
      if (b == null) return { value: null, warning: `${context}: giá trị không hợp lệ "${raw}" (Có/Không)` };
      return { value: b };
    }
    case 'select': {
      const { value, invalid } = resolveSelectValue(field, raw);
      if (invalid) return { value: null, warning: `${context}: giá trị "${raw}" không thuộc danh sách cho phép` };
      return { value };
    }
    default:
      return { value: raw };
  }
}

export async function parseImportWorkbook(buffer: Buffer, canSensitive = false): Promise<CadreImportAnalysis> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const warnings: string[] = [];
  const extended: Record<string, unknown> = {};
  const extendedPreview: { label: string; value: string }[] = [];

  // --- Sheet trường đơn ---
  const scalarWs = workbook.getWorksheet(SCALAR_SHEET);
  if (!scalarWs) {
    warnings.push(`Không tìm thấy sheet "${SCALAR_SHEET}" — bỏ qua trường đơn.`);
  } else {
    const headerIdx = headerIndexMap(scalarWs.getRow(1));
    const keyCol = headerIdx[COL_KEY];
    const valueCol = headerIdx[COL_VALUE];
    if (!keyCol || !valueCol) {
      warnings.push(`Sheet "${SCALAR_SHEET}" thiếu cột "${COL_KEY}" hoặc "${COL_VALUE}".`);
    } else {
      const fieldByName = new Map(SCALAR_FIELDS.map((f) => [f.name, f]));
      scalarWs.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const name = cellText(row.getCell(keyCol));
        const raw = cellText(row.getCell(valueCol));
        if (!name || raw === '') return;
        const field = fieldByName.get(name);
        if (!field) return;
        if (field.sensitive && !canSensitive) {
          warnings.push(`Trường nhạy cảm "${field.label}" không nhập (thiếu quyền) — bỏ qua.`);
          return;
        }
        const { value, warning } = normalizeFieldValue(field, raw, field.label);
        if (warning) warnings.push(warning);
        if (value !== null) {
          extended[field.name] = value;
          extendedPreview.push({ label: field.label, value: displayPrefill(field, value) || raw });
        }
      });
    }
  }

  // --- Sheet danh sách ---
  const sections: Record<string, Record<string, unknown>[]> = {};
  const sectionsPreview: CadreImportSectionPreview[] = [];

  for (const section of CADRE_LIST_SECTIONS) {
    const ws = findSectionSheet(workbook, section);
    if (!ws) continue;
    const headerIdx = headerIndexMap(ws.getRow(1));
    const records: Record<string, unknown>[] = [];
    const previewRows: Record<string, string>[] = [];

    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rawByField = new Map<string, string>();
      let hasAny = false;
      for (const field of section.fields) {
        const col = headerIdx[field.label];
        const raw = col ? cellText(row.getCell(col)) : '';
        rawByField.set(field.name, raw);
        if (raw !== '') hasAny = true;
      }
      if (!hasAny) return;

      const record: Record<string, unknown> = {};
      const previewRow: Record<string, string> = {};
      let rowValid = true;
      for (const field of section.fields) {
        // Trường nhạy cảm chỉ ghi khi có quyền; nếu không, bỏ giá trị (service cũng tự loại).
        if (field.sensitive && !canSensitive) {
          record[field.name] = null;
          previewRow[field.name] = '';
          continue;
        }
        const raw = rawByField.get(field.name) ?? '';
        const ctx = `${section.title} (dòng ${rowNumber})/${field.label}`;
        const { value, warning } = normalizeFieldValue(field, raw, ctx);
        if (warning) warnings.push(warning);
        record[field.name] = value;
        previewRow[field.name] = displayPrefill(field, value) || raw;
        if (field.required && (value === null || value === '')) {
          warnings.push(`${section.title} (dòng ${rowNumber}): thiếu trường bắt buộc "${field.label}" — bỏ qua dòng.`);
          rowValid = false;
        }
      }
      if (rowValid) {
        records.push(record);
        previewRows.push(previewRow);
      }
    });

    if (records.length > 0) {
      sections[section.slug] = records;
      sectionsPreview.push({ slug: section.slug, title: section.title, newCount: records.length, rows: previewRows });
    }
  }

  return { extended, sections, extendedPreview, sectionsPreview, warnings };
}

function headerIndexMap(headerRow: ExcelJS.Row): Record<string, number> {
  const map: Record<string, number> = {};
  headerRow.eachCell((cell, colNumber) => {
    const text = cellText(cell);
    if (text) map[text] = colNumber;
  });
  return map;
}

function findSectionSheet(workbook: ExcelJS.Workbook, section: CadreListSection): ExcelJS.Worksheet | undefined {
  // Tên sheet bị cắt ≤31 ký tự — so khớp theo tiền tố title.
  const truncated = section.title.replace(/[:\\/?*[\]]/g, ' ').trim().slice(0, 31);
  return (
    workbook.getWorksheet(section.title) ||
    workbook.getWorksheet(truncated) ||
    workbook.worksheets.find((ws) => ws.name.startsWith(truncated.slice(0, 20)))
  );
}

// ─── Apply (ghi dữ liệu qua write-path đã có) ────────────────────────────────────

export type CadreImportMode = 'append' | 'replace';

export interface CadreImportResult {
  extendedUpdated: boolean;
  /** deleted: số bản ghi cũ bị xóa mềm (chế độ replace). */
  sections: { slug: string; title: string; created: number; failed: number; deleted: number }[];
  errors: string[];
}

export interface CadreImportPayload {
  extended?: Record<string, unknown>;
  sections?: Record<string, Record<string, unknown>[]>;
  /** 'append' (mặc định): thêm dòng mới. 'replace': xóa mềm dữ liệu cũ của nhóm trước khi thêm. */
  mode?: CadreImportMode;
}

export async function applyCadreImport(
  user: AuthUser,
  scope: FunctionScope,
  userId: string,
  payload: CadreImportPayload,
  canSensitive: boolean,
  mode: CadreImportMode = 'append',
): Promise<CadreImportResult> {
  const errors: string[] = [];
  let extendedUpdated = false;

  const extended = payload.extended ?? {};
  if (Object.keys(extended).length > 0) {
    const res = await CadreExtendedProfileService.update(user, scope, userId, extended, canSensitive);
    if (res.success) extendedUpdated = true;
    else errors.push(`Trường đơn: ${res.error}`);
  }

  const sectionsResult: CadreImportResult['sections'] = [];
  for (const section of CADRE_LIST_SECTIONS) {
    const records = payload.sections?.[section.slug];
    if (!records || records.length === 0) continue;

    // Chế độ "replace": xóa mềm dữ liệu cũ của ĐÚNG nhóm có dữ liệu nhập (nhóm trống không bị động).
    let deleted = 0;
    if (mode === 'replace') {
      const del = await CadreProfileSectionService.softDeleteAll(user, scope, userId, section);
      if (del.success) deleted = del.data.deleted;
      else errors.push(`${section.title} (xóa cũ): ${del.error}`);
    }

    let created = 0;
    let failed = 0;
    for (const record of records) {
      const res = await CadreProfileSectionService.create(user, scope, userId, section, record, canSensitive);
      if (res.success) created += 1;
      else {
        failed += 1;
        errors.push(`${section.title}: ${res.error}`);
      }
    }
    sectionsResult.push({ slug: section.slug, title: section.title, created, failed, deleted });
  }

  return { extendedUpdated, sections: sectionsResult, errors };
}
