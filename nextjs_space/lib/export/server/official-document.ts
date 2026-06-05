/**
 * Tiện ích dựng tài liệu hành chính chính quy (quốc hiệu, tiêu ngữ, đơn vị chủ quản)
 * dùng chung cho biểu mẫu Excel và tài liệu HTML/PDF.
 *
 * SERVER-ONLY helper: không dùng API trình duyệt, an toàn để gọi trong API route/worker.
 */

import type ExcelJS from 'exceljs';

/** Cơ quan chủ quản – cố định theo Học viện Hậu cần. */
export const ISSUING_AUTHORITY = {
  ministry: 'BỘ QUỐC PHÒNG',
  academy: 'HỌC VIỆN HẬU CẦN',
} as const;

/** Quốc hiệu – tiêu ngữ. */
export const NATIONAL_HEADER = {
  nation: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
  motto: 'Độc lập - Tự do - Hạnh phúc',
} as const;

export interface DocumentMeta {
  /** Tên đơn vị hiển thị dưới HỌC VIỆN HẬU CẦN (vd. tên khoa/phòng). */
  unitName?: string;
  /** Ngày lập tài liệu; mặc định là thời điểm tạo. */
  issuedAt?: Date;
}

/** Định dạng ngày DD/MM/YYYY; trả chuỗi rỗng nếu không hợp lệ. */
export function formatDateVi(value: Date | string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

/** Dòng địa danh + ngày tháng năm theo văn phong hành chính. */
export function formatPlaceAndDate(issuedAt: Date = new Date(), place = '………'): string {
  return `${place}, ngày ${issuedAt.getDate()} tháng ${
    issuedAt.getMonth() + 1
  } năm ${issuedAt.getFullYear()}`;
}

/**
 * Escape một ô cho định dạng CSV:
 * - Nhân đôi dấu nháy kép theo RFC 4180.
 * - Chống CSV/formula injection: prefix dấu nháy đơn nếu ô bắt đầu bằng = + - @ tab.
 * - Luôn bọc trong nháy kép để an toàn với dấu phẩy/xuống dòng.
 */
export function escapeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const injectionPrefixed = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  const escaped = injectionPrefixed.replace(/"/g, '""');
  return `"${escaped}"`;
}

/** Ghép một mảng giá trị thành một dòng CSV an toàn. */
export function buildCsvRow(cells: unknown[]): string {
  return cells.map(escapeCsvCell).join(',');
}

/**
 * Dựng block tiêu đề chính quy 2 cột ở đầu worksheet Excel:
 *   trái  : BỘ QUỐC PHÒNG / HỌC VIỆN HẬU CẦN (+ tên đơn vị)
 *   phải  : CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM / Độc lập - Tự do - Hạnh phúc
 *
 * @param worksheet   worksheet đích
 * @param totalColumns tổng số cột của bảng dữ liệu (để merge 2 nửa trái/phải)
 * @param meta        thông tin đơn vị + ngày lập
 * @returns số hàng đã chiếm (để biết dòng tiếp theo bắt đầu từ đâu)
 */
export function buildExcelLetterhead(
  worksheet: ExcelJS.Worksheet,
  totalColumns: number,
  meta: DocumentMeta = {}
): number {
  const half = Math.max(1, Math.floor(totalColumns / 2));
  const rightStart = half + 1;

  const leftBlock: string[] = [ISSUING_AUTHORITY.ministry, ISSUING_AUTHORITY.academy];
  if (meta.unitName) leftBlock.push(meta.unitName.toUpperCase());
  const rightBlock = [NATIONAL_HEADER.nation, NATIONAL_HEADER.motto];

  const rowCount = Math.max(leftBlock.length, rightBlock.length);

  for (let i = 0; i < rowCount; i++) {
    const rowIndex = i + 1;
    worksheet.mergeCells(rowIndex, 1, rowIndex, half);
    worksheet.mergeCells(rowIndex, rightStart, rowIndex, totalColumns);

    const leftCell = worksheet.getCell(rowIndex, 1);
    const rightCell = worksheet.getCell(rowIndex, rightStart);

    leftCell.value = leftBlock[i] ?? '';
    rightCell.value = rightBlock[i] ?? '';

    leftCell.alignment = { horizontal: 'center', vertical: 'middle' };
    rightCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Dòng đầu mỗi cột in đậm (cơ quan chủ quản / quốc hiệu)
    const isHeadLine = i === 0;
    const isMottoLine = i === 1;
    leftCell.font = { name: 'Times New Roman', size: 12, bold: isHeadLine };
    rightCell.font = {
      name: 'Times New Roman',
      size: 12,
      bold: isHeadLine || isMottoLine,
    };
  }

  return rowCount;
}
