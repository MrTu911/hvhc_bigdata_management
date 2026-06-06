/**
 * Aggregate Export Service — xuất BẢNG DANH SÁCH tổng hợp (1 file) theo CSDL,
 * lọc theo phạm vi (scope) của người dùng. Phục vụ "xuất tổ chức/đơn vị".
 *
 * Khác M18 export (1 thực thể / batch ZIP nhiều file): đây là 1 file Excel/PDF
 * dạng bảng nhiều dòng. Scope: lọc theo accessibleUnitIds (ACADEMY = toàn bộ).
 *
 * Bảo mật: chỉ trả NckhScientistProfile sensitivityLevel='NORMAL' trong danh sách
 * hàng loạt (hồ sơ mật phải xuất lẻ qua route có guard riêng).
 */

import ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import type { FunctionScope } from '@prisma/client';
import prisma from '@/lib/db';
import { uploadObject, getPresignedDownloadUrl } from '@/lib/services/infrastructure/storage.service';
import { renderHtmlToPdf } from '@/lib/services/export-engine-service';

export type AggregateEntityType = 'personnel' | 'student' | 'party_member' | 'scientist_profile';
export type AggregateFormat = 'XLSX' | 'PDF';

const PREVIEW_TTL = 86400; // 24h
const MAX_ROWS = 5000;

const TITLES: Record<AggregateEntityType, string> = {
  personnel: 'DANH SÁCH CÁN BỘ',
  student: 'DANH SÁCH HỌC VIÊN',
  party_member: 'DANH SÁCH ĐẢNG VIÊN',
  scientist_profile: 'DANH SÁCH NHÀ KHOA HỌC',
};

const PARTY_STATUS: Record<string, string> = {
  CHINH_THUC: 'Chính thức', DU_BI: 'Dự bị', QUAN_CHUNG: 'Quần chúng',
  MIEN_SINH_HOAT: 'Miễn sinh hoạt', CHUYEN_DI: 'Chuyển đi', KHAI_TRU: 'Khai trừ',
};

export interface AggregateScopeCtx {
  scope: FunctionScope;
  accessibleUnitIds: string[]; // từ getAccessibleUnitIds; rỗng = không đơn vị nào
}

export interface AggregateResult {
  downloadUrl: string;
  count: number;
  expiresIn: number;
  title: string;
}

interface TableData {
  columns: string[];
  rows: string[][];
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
function fmtDate(d: Date | null | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}
function gender(g: string | null | undefined): string {
  if (g === 'M' || g === 'MALE') return 'Nam';
  if (g === 'F' || g === 'FEMALE') return 'Nữ';
  return g ?? '';
}

/** Điều kiện lọc theo đơn vị: ACADEMY → không lọc; còn lại → trong accessibleUnitIds. */
function unitInScope(ctx: AggregateScopeCtx): { in: string[] } | undefined {
  if (ctx.scope === 'ACADEMY') return undefined;
  return { in: ctx.accessibleUnitIds };
}

// ─── Build table per entity type (scope-aware) ──────────────────────────────────

async function buildPersonnelTable(ctx: AggregateScopeCtx, keyword?: string): Promise<TableData> {
  const unitFilter = unitInScope(ctx);
  const rows = await prisma.personnel.findMany({
    where: {
      ...(unitFilter ? { unitId: unitFilter } : {}),
      ...(keyword ? { fullName: { contains: keyword, mode: 'insensitive' } } : {}),
    },
    select: {
      fullName: true, militaryRank: true, position: true, dateOfBirth: true, gender: true,
      unit: { select: { name: true } },
    },
    orderBy: { fullName: 'asc' },
    take: MAX_ROWS,
  });
  return {
    columns: ['STT', 'Họ và tên', 'Cấp bậc', 'Chức vụ', 'Đơn vị', 'Ngày sinh', 'Giới tính'],
    rows: rows.map((r, i) => [
      String(i + 1), r.fullName ?? '', r.militaryRank ?? '', r.position ?? '',
      r.unit?.name ?? '', fmtDate(r.dateOfBirth), gender(r.gender),
    ]),
  };
}

async function buildStudentTable(_ctx: AggregateScopeCtx, keyword?: string): Promise<TableData> {
  // HocVien không gắn Unit (theo lớp/khóa) → dữ liệu cấp học viện, gate bằng EXPORT_BATCH.
  const rows = await prisma.hocVien.findMany({
    where: keyword
      ? { OR: [{ hoTen: { contains: keyword, mode: 'insensitive' } }, { maHocVien: { contains: keyword, mode: 'insensitive' } }] }
      : {},
    select: { maHocVien: true, hoTen: true, lop: true, khoaHoc: true, ngaySinh: true, gioiTinh: true, trangThai: true },
    orderBy: { hoTen: 'asc' },
    take: MAX_ROWS,
  });
  return {
    columns: ['STT', 'Mã học viên', 'Họ và tên', 'Lớp', 'Khóa', 'Ngày sinh', 'Trạng thái'],
    rows: rows.map((r, i) => [
      String(i + 1), r.maHocVien ?? '', r.hoTen ?? '', r.lop ?? '', r.khoaHoc ?? '',
      fmtDate(r.ngaySinh), r.trangThai ?? '',
    ]),
  };
}

async function buildPartyMemberTable(ctx: AggregateScopeCtx, keyword?: string): Promise<TableData> {
  const unitFilter = unitInScope(ctx);
  const userWhere = {
    ...(unitFilter ? { unitId: unitFilter } : {}),
    ...(keyword ? { name: { contains: keyword, mode: 'insensitive' as const } } : {}),
  };
  const rows = await prisma.partyMember.findMany({
    where: Object.keys(userWhere).length ? { user: userWhere } : {},
    select: {
      partyCell: true, joinDate: true, officialDate: true, status: true,
      user: { select: { name: true, rank: true } },
    },
    orderBy: { joinDate: 'asc' },
    take: MAX_ROWS,
  });
  return {
    columns: ['STT', 'Họ và tên', 'Cấp bậc', 'Chi bộ', 'Ngày vào Đảng', 'Ngày chính thức', 'Trạng thái'],
    rows: rows.map((r, i) => [
      String(i + 1), r.user?.name ?? '', r.user?.rank ?? '', r.partyCell ?? '',
      fmtDate(r.joinDate), fmtDate(r.officialDate), PARTY_STATUS[r.status] ?? r.status,
    ]),
  };
}

async function buildScientistTable(ctx: AggregateScopeCtx, keyword?: string): Promise<TableData> {
  const unitFilter = unitInScope(ctx);
  const userWhere = {
    ...(unitFilter ? { unitId: unitFilter } : {}),
    ...(keyword ? { name: { contains: keyword, mode: 'insensitive' as const } } : {}),
  };
  const rows = await prisma.nckhScientistProfile.findMany({
    where: {
      sensitivityLevel: 'NORMAL', // không liệt kê hồ sơ mật trong danh sách hàng loạt
      ...(Object.keys(userWhere).length ? { user: userWhere } : {}),
    },
    select: {
      degree: true, academicRank: true, primaryField: true, hIndex: true, totalPublications: true,
      user: { select: { name: true } },
    },
    orderBy: { hIndex: 'desc' },
    take: MAX_ROWS,
  });
  return {
    columns: ['STT', 'Họ và tên', 'Học vị', 'Học hàm', 'Chuyên ngành', 'h-index', 'Số công trình'],
    rows: rows.map((r, i) => [
      String(i + 1), r.user?.name ?? '', r.degree ?? '', r.academicRank ?? '',
      r.primaryField ?? '', String(r.hIndex ?? 0), String(r.totalPublications ?? 0),
    ]),
  };
}

async function buildTable(entityType: AggregateEntityType, ctx: AggregateScopeCtx, keyword?: string): Promise<TableData> {
  switch (entityType) {
    case 'personnel': return buildPersonnelTable(ctx, keyword);
    case 'student': return buildStudentTable(ctx, keyword);
    case 'party_member': return buildPartyMemberTable(ctx, keyword);
    case 'scientist_profile': return buildScientistTable(ctx, keyword);
  }
}

// ─── Renderers ──────────────────────────────────────────────────────────────────

async function renderXlsx(title: string, table: TableData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'HỌC VIỆN HẬU CẦN';
  wb.created = new Date();
  const sheet = wb.addWorksheet('DanhSach');

  const colCount = table.columns.length;
  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center' };

  const headerRow = sheet.addRow(table.columns);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E4D8C' } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  for (const row of table.rows) {
    const r = sheet.addRow(row);
    r.eachCell((c) => {
      c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
  }

  sheet.columns.forEach((col, idx) => {
    col.width = idx === 0 ? 6 : idx === 1 ? 28 : 18;
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildAggregateHtml(title: string, scopeLabel: string, table: TableData): string {
  const now = new Date();
  const headerCells = table.columns.map((c) => `<th>${esc(c)}</th>`).join('');
  const bodyRows = table.rows
    .map((row) => `<tr>${row.map((cell, i) => `<td class="${i === 0 ? 'c' : ''}">${esc(cell)}</td>`).join('')}</tr>`)
    .join('');

  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><style>
    @page { size: A4 landscape; margin: 15mm; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; }
    .hdr { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .hdr td { width: 50%; text-align: center; vertical-align: top; }
    .bold { font-weight: bold; }
    .uline { display: inline-block; border-bottom: 1px solid #000; padding-bottom: 2px; }
    .title { text-align: center; font-weight: bold; font-size: 14pt; margin: 10px 0 2px; text-transform: uppercase; }
    .sub { text-align: center; font-style: italic; margin-bottom: 10px; }
    table.data { width: 100%; border-collapse: collapse; }
    table.data th, table.data td { border: 1px solid #000; padding: 4px 6px; font-size: 11pt; }
    table.data th { text-align: center; font-weight: bold; }
    table.data td.c { text-align: center; }
    .foot { text-align: right; margin-top: 14px; font-style: italic; }
  </style></head><body>
    <table class="hdr"><tr>
      <td><div>BỘ QUỐC PHÒNG</div><div class="bold"><span class="uline">HỌC VIỆN HẬU CẦN</span></div></td>
      <td><div class="bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div><div class="bold"><span class="uline">Độc lập - Tự do - Hạnh phúc</span></div></td>
    </tr></table>
    <div class="title">${esc(title)}</div>
    <div class="sub">Phạm vi: ${esc(scopeLabel)} — Tổng số: ${table.rows.length}</div>
    <table class="data"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
    <div class="foot">Hà Nội, ngày ${pad(now.getDate())} tháng ${pad(now.getMonth() + 1)} năm ${now.getFullYear()}</div>
  </body></html>`;
}

// ─── Public entrypoint ──────────────────────────────────────────────────────────

const SCOPE_LABELS: Record<FunctionScope, string> = {
  SELF: 'Cá nhân', UNIT: 'Đơn vị', DEPARTMENT: 'Phòng/Ban (gồm cấp dưới)', ACADEMY: 'Toàn Học viện',
};

export async function exportAggregate(opts: {
  entityType: AggregateEntityType;
  format: AggregateFormat;
  keyword?: string;
  requestedBy: string;
  scopeCtx: AggregateScopeCtx;
}): Promise<AggregateResult> {
  const { entityType, format, keyword, requestedBy, scopeCtx } = opts;
  const title = TITLES[entityType];
  const scopeLabel = SCOPE_LABELS[scopeCtx.scope];

  const table = await buildTable(entityType, scopeCtx, keyword?.trim() || undefined);

  let buffer: Buffer;
  let ext: string;
  let contentType: string;
  if (format === 'XLSX') {
    buffer = await renderXlsx(title, table);
    ext = 'xlsx';
    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else {
    const html = buildAggregateHtml(title, scopeLabel, table);
    buffer = await renderHtmlToPdf(html);
    ext = 'pdf';
    contentType = 'application/pdf';
  }

  const objectKey = `aggregate/${entityType}/${uuidv4()}.${ext}`;
  await uploadObject('M18_EXPORT', objectKey, buffer, {
    module: 'M18',
    'entity-type': 'aggregate-export',
    'entity-id': entityType,
    'uploaded-by': requestedBy,
    classification: 'INTERNAL',
    'content-type': contentType,
  });
  const downloadUrl = await getPresignedDownloadUrl('M18_EXPORT', objectKey, { expirySeconds: PREVIEW_TTL });

  return { downloadUrl, count: table.rows.length, expiresIn: PREVIEW_TTL, title };
}
