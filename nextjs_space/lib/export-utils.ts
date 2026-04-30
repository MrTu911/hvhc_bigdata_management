// CLIENT-ONLY — dùng jsPDF + XLSX (browser APIs). Không import file này trong API routes.
// Dùng M18 export-engine-service.ts cho xuất file từ backend.
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Vietnamese font configuration for jsPDF
export function setupVietnameseFont(doc: jsPDF) {
  // Using helvetica as fallback (built-in font)
  doc.setFont('helvetica');
}

// Create PDF header with logo and title
export function addPDFHeader(doc: jsPDF, title: string, subtitle?: string) {
  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);

  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 14, 27);
  }

  // Add date
  doc.setFontSize(9);
  doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, 14, subtitle ? 33 : 27);

  // Add line separator
  const yPos = subtitle ? 38 : 32;
  doc.setLineWidth(0.5);
  doc.line(14, yPos, 196, yPos);

  return yPos + 5; // Return Y position for next content
}

// Create PDF footer with page numbers
export function addPDFFooter(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Trang ${i} / ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
}

// Export data to styled PDF
export function exportToPDF({
  title,
  subtitle,
  headers,
  data,
  filename,
  summary,
}: {
  title: string;
  subtitle?: string;
  headers: string[];
  data: any[][];
  filename: string;
  summary?: { label: string; value: string | number }[];
}) {
  const doc = new jsPDF();
  setupVietnameseFont(doc);

  // Add header
  let startY = addPDFHeader(doc, title, subtitle);

  // Add summary if provided
  if (summary && summary.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    summary.forEach((item, index) => {
      doc.text(`${item.label}: ${item.value}`, 14, startY + index * 6);
    });
    startY += summary.length * 6 + 5;
  }

  // Add table
  (doc as any).autoTable({
    startY,
    head: [headers],
    body: data,
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
    },
    margin: { top: 10, right: 14, bottom: 20, left: 14 },
  });

  // Add footer
  addPDFFooter(doc);

  // Save
  doc.save(filename);
}

// Export data to styled Excel
export function exportToExcel({
  filename,
  sheets,
}: {
  filename: string;
  sheets: {
    name: string;
    data: any[];
    columns?: { header: string; key: string; width?: number }[];
  }[];
}) {
  const wb = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(sheet.data);

    // Auto-size columns
    const maxWidth = 50;
    const colWidths: { wch: number }[] = [];

    if (sheet.data.length > 0) {
      const keys = Object.keys(sheet.data[0]);
      keys.forEach((key, index) => {
        // Calculate max width for this column
        let maxLen = key.length;
        sheet.data.forEach((row) => {
          const cellValue = String(row[key] || '');
          maxLen = Math.max(maxLen, cellValue.length);
        });
        colWidths.push({ wch: Math.min(maxLen + 2, maxWidth) });
      });
      ws['!cols'] = colWidths;
    }

    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });

  XLSX.writeFile(wb, filename);
}

// Export data to CSV with UTF-8 BOM
export function exportToCSV({
  headers,
  data,
  filename,
}: {
  headers: string[];
  data: any[][];
  filename: string;
}) {
  const csvContent = [
    headers.join(','),
    ...data.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.click();
  URL.revokeObjectURL(url);
}
