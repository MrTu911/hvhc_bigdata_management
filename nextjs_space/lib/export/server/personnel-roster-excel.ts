/**
 * Dựng biểu mẫu Excel "Danh sách trích ngang cán bộ, quân nhân".
 *
 * SERVER-ONLY: dùng exceljs writeBuffer (KHÔNG dùng lib/export/excel.ts vốn là client-only).
 * Trả về Buffer để API route stream xuống client.
 */

import ExcelJS from 'exceljs';
import {
  buildExcelLetterhead,
  formatDateVi,
  formatPlaceAndDate,
  type DocumentMeta,
} from './official-document';
import {
  PERSONNEL_STATUS_LABELS,
  GENDER_LABELS,
  getRankLabel,
  getLabel,
} from '@/lib/export/labels';

/** Một dòng nhân sự tối thiểu cần để dựng danh sách trích ngang. */
export interface RosterPersonnel {
  fullName: string | null;
  dateOfBirth?: Date | string | null;
  militaryRank?: string | null;
  position?: string | null;
  unit?: { name?: string | null } | null;
  personnelCode?: string | null;
  militaryIdNumber?: string | null;
  gender?: string | null;
  ethnicity?: string | null;
  status?: string | null;
}

interface RosterColumn {
  header: string;
  width: number;
  value: (p: RosterPersonnel, index: number) => string;
  align?: 'left' | 'center';
}

const ROSTER_TITLE = 'DANH SÁCH TRÍCH NGANG CÁN BỘ, QUÂN NHÂN';

const ROSTER_COLUMNS: RosterColumn[] = [
  { header: 'TT', width: 5, align: 'center', value: (_p, i) => String(i + 1) },
  { header: 'Họ và tên', width: 26, value: (p) => p.fullName || '' },
  {
    header: 'Ngày sinh',
    width: 13,
    align: 'center',
    value: (p) => formatDateVi(p.dateOfBirth),
  },
  { header: 'Quân hàm', width: 14, value: (p) => getRankLabel(p.militaryRank) },
  { header: 'Chức vụ', width: 22, value: (p) => p.position || '' },
  { header: 'Đơn vị', width: 24, value: (p) => p.unit?.name || '' },
  { header: 'Mã nhân sự', width: 14, value: (p) => p.personnelCode || '' },
  { header: 'Số quân', width: 14, value: (p) => p.militaryIdNumber || '' },
  {
    header: 'Giới tính',
    width: 10,
    align: 'center',
    value: (p) => getLabel(GENDER_LABELS, p.gender),
  },
  { header: 'Dân tộc', width: 12, value: (p) => p.ethnicity || '' },
  {
    header: 'Trạng thái',
    width: 16,
    value: (p) => getLabel(PERSONNEL_STATUS_LABELS, p.status),
  },
];

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1F4E79' }, // xanh quân đội đậm
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

/**
 * Tạo workbook danh sách trích ngang và trả về Buffer.
 */
export async function buildPersonnelRosterWorkbook(
  personnel: RosterPersonnel[],
  meta: DocumentMeta = {}
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HVHC BigData';
  workbook.created = meta.issuedAt ?? new Date();

  const worksheet = workbook.addWorksheet('Trích ngang', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
    },
  });

  const totalColumns = ROSTER_COLUMNS.length;

  // Đặt độ rộng cột trước khi thêm dữ liệu
  ROSTER_COLUMNS.forEach((col, idx) => {
    worksheet.getColumn(idx + 1).width = col.width;
  });

  // 1) Quốc hiệu - tiêu ngữ + cơ quan chủ quản
  const letterheadRows = buildExcelLetterhead(worksheet, totalColumns, meta);

  // 2) Tiêu đề danh sách
  const titleRowIndex = letterheadRows + 2; // chừa 1 dòng trống
  worksheet.mergeCells(titleRowIndex, 1, titleRowIndex, totalColumns);
  const titleCell = worksheet.getCell(titleRowIndex, 1);
  titleCell.value = ROSTER_TITLE;
  titleCell.font = { name: 'Times New Roman', size: 15, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  const subtitleRowIndex = titleRowIndex + 1;
  worksheet.mergeCells(subtitleRowIndex, 1, subtitleRowIndex, totalColumns);
  const subtitleCell = worksheet.getCell(subtitleRowIndex, 1);
  const issuedAt = meta.issuedAt ?? new Date();
  subtitleCell.value = `${meta.unitName ? `Đơn vị: ${meta.unitName} — ` : ''}Tổng số: ${
    personnel.length
  } người — Ngày lập: ${formatDateVi(issuedAt)}`;
  subtitleCell.font = { name: 'Times New Roman', size: 11, italic: true };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // 3) Hàng tiêu đề bảng
  const headerRowIndex = subtitleRowIndex + 2; // chừa 1 dòng trống
  const headerRow = worksheet.getRow(headerRowIndex);
  ROSTER_COLUMNS.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = HEADER_FILL;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = THIN_BORDER;
  });
  headerRow.height = 28;

  // 4) Dòng dữ liệu
  personnel.forEach((person, index) => {
    const row = worksheet.getRow(headerRowIndex + 1 + index);
    ROSTER_COLUMNS.forEach((col, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = col.value(person, index);
      cell.font = { name: 'Times New Roman', size: 11 };
      cell.alignment = {
        horizontal: col.align ?? 'left',
        vertical: 'middle',
        wrapText: true,
      };
      cell.border = THIN_BORDER;
    });
  });

  // Freeze tiêu đề bảng để cuộn vẫn thấy header
  worksheet.views = [{ state: 'frozen', ySplit: headerRowIndex }];

  // 5) Khối ký duyệt
  const lastDataRow = headerRowIndex + personnel.length;
  const signDateRow = lastDataRow + 2;
  const rightStart = Math.max(1, Math.floor(totalColumns / 2)) + 1;

  worksheet.mergeCells(signDateRow, rightStart, signDateRow, totalColumns);
  const dateCell = worksheet.getCell(signDateRow, rightStart);
  dateCell.value = formatPlaceAndDate(issuedAt);
  dateCell.font = { name: 'Times New Roman', size: 11, italic: true };
  dateCell.alignment = { horizontal: 'center' };

  const signTitleRow = signDateRow + 1;
  const half = Math.max(1, Math.floor(totalColumns / 2));
  worksheet.mergeCells(signTitleRow, 1, signTitleRow, half);
  worksheet.mergeCells(signTitleRow, rightStart, signTitleRow, totalColumns);
  const preparerCell = worksheet.getCell(signTitleRow, 1);
  const approverCell = worksheet.getCell(signTitleRow, rightStart);
  preparerCell.value = 'NGƯỜI LẬP BIỂU';
  approverCell.value = 'THỦ TRƯỞNG ĐƠN VỊ';
  [preparerCell, approverCell].forEach((cell) => {
    cell.font = { name: 'Times New Roman', size: 11, bold: true };
    cell.alignment = { horizontal: 'center' };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
