// lib/export/pdf.ts
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface ReportColumn {
  header: string;
  dataKey: string;
}

/**
 * Xuất báo cáo PDF
 * @param title - Tiêu đề báo cáo
 * @param columns - Các cột của bảng
 * @param rows - Dữ liệu các dòng
 * @param fileName - Tên file (không có đuôi .pdf)
 */
export function exportPDF(
  title: string,
  columns: ReportColumn[],
  rows: any[],
  fileName: string
) {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Title
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  // Table
  (doc as any).autoTable({
    startY: 28,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => r[c.dataKey] ?? '')),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] }, // Blue header
    alternateRowStyles: { fillColor: [245, 247, 250] }, // Light gray alternate
  });

  // Footer with date
  const date = new Date().toLocaleDateString('vi-VN');
  doc.setFontSize(9);
  doc.text(`Ngày xuất: ${date}`, 14, (doc as any).lastAutoTable.finalY + 10);

  // Download
  doc.save(`${fileName}_${Date.now()}.pdf`);
}

/**
 * Xuất báo cáo PDF với thống kê
 */
export function exportPDFWithStats(
  title: string,
  statistics: { [key: string]: any },
  columns: ReportColumn[],
  rows: any[],
  fileName: string
) {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Title
  doc.setFontSize(16);
  doc.text(title, 14, 15);

  // Statistics
  doc.setFontSize(10);
  let yPos = 25;
  Object.entries(statistics).forEach(([key, value]) => {
    doc.text(`${key}: ${value}`, 14, yPos);
    yPos += 6;
  });

  // Table
  (doc as any).autoTable({
    startY: yPos + 5,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => r[c.dataKey] ?? '')),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  // Footer
  const date = new Date().toLocaleDateString('vi-VN');
  doc.setFontSize(9);
  doc.text(`Ngày xuất: ${date}`, 14, (doc as any).lastAutoTable.finalY + 10);

  // Download
  doc.save(`${fileName}_${Date.now()}.pdf`);
}
