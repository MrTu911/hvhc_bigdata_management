// lib/export/excel.ts
// CLIENT-ONLY — dùng saveAs (browser API). Không import file này trong server code hoặc API routes.
// Để xuất file từ backend, dùng export-engine-service.ts (M18).
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

/**
 * Xuất báo cáo Excel
 * @param title - Tiêu đề worksheet
 * @param columns - Các cột
 * @param rows - Dữ liệu
 * @param fileName - Tên file (không có đuôi .xlsx)
 */
export async function exportExcel(
  title: string,
  columns: ExcelColumn[],
  rows: any[],
  fileName: string
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title);

  // Set columns
  worksheet.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width || 20,
  }));

  // Style header
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' },
  };
  worksheet.getRow(1).font = { ...worksheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };

  // Add rows
  rows.forEach((r) => worksheet.addRow(r));

  // Generate buffer and save
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${fileName}_${Date.now()}.xlsx`);
}

/**
 * Xuất Excel với nhiều worksheet
 */
export async function exportExcelMultiSheet(
  sheets: Array<{
    title: string;
    columns: ExcelColumn[];
    rows: any[];
  }>,
  fileName: string
) {
  const workbook = new ExcelJS.Workbook();

  sheets.forEach((sheet) => {
    const worksheet = workbook.addWorksheet(sheet.title);

    // Set columns
    worksheet.columns = sheet.columns.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width || 20,
    }));

    // Style header
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' },
    };
    worksheet.getRow(1).font = { ...worksheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };

    // Add rows
    sheet.rows.forEach((r) => worksheet.addRow(r));
  });

  // Generate buffer and save
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${fileName}_${Date.now()}.xlsx`);
}
