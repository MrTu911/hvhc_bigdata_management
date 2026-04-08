
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportData {
  title: string;
  subtitle?: string;
  sections: ReportSection[];
  footer?: string;
}

export interface ReportSection {
  title: string;
  content: string | TableData;
  type: 'text' | 'table' | 'chart';
}

export interface TableData {
  headers: string[];
  rows: any[][];
}

export class ReportGenerator {
  static generatePDF(data: ReportData): jsPDF {
    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title, 20, yPosition);
    yPosition += 10;

    // Subtitle
    if (data.subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(data.subtitle, 20, yPosition);
      yPosition += 10;
    }

    // Sections
    data.sections.forEach((section) => {
      yPosition += 5;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, 20, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      if (section.type === 'text' && typeof section.content === 'string') {
        const lines = doc.splitTextToSize(section.content, 170);
        doc.text(lines, 20, yPosition);
        yPosition += lines.length * 5 + 5;
      } else if (section.type === 'table' && typeof section.content !== 'string') {
        autoTable(doc, {
          head: [section.content.headers],
          body: section.content.rows,
          startY: yPosition,
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [41, 128, 185] },
        });
        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Add new page if needed
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    });

    // Footer
    if (data.footer) {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(data.footer, 20, 285);
        doc.text(`Trang ${i} / ${pageCount}`, 180, 285);
      }
    }

    return doc;
  }

  static generateCSV(data: TableData): string {
    const rows = [data.headers, ...data.rows];
    return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  }

  static generateExcel(data: TableData): Blob {
    // Simple Excel generation (CSV with .xlsx extension)
    const csvContent = this.generateCSV(data);
    return new Blob([csvContent], { type: 'application/vnd.ms-excel' });
  }
}

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
