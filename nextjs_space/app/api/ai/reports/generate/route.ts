import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { writeFile } from 'fs/promises';
import path from 'path';
import { generateTrainingInsights } from '@/lib/ai-service';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';

/**
 * API Generate Monthly Reports
 * Tạo báo cáo hàng tháng tự động
 * POST: Tạo báo cáo mới
 * 
 * RBAC: AI.GENERATE_REPORT
 */

export async function POST(request: NextRequest) {
  try {
    // RBAC Check: AI.GENERATE_REPORT
    const authResult = await requireFunction(request, AI.GENERATE_REPORT);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { reportType, targetId, month, year } = body;

    if (!reportType || !month || !year) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Kiểm tra báo cáo đã tồn tại chưa
    const existingReport = await prisma.monthlyReport.findUnique({
      where: {
        reportType_targetId_year_month: {
          reportType,
          targetId: targetId || '',
          year,
          month,
        },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'Report already exists for this period' },
        { status: 409 }
      );
    }

    let reportData: any = {};
    let summary: any = {};

    // Tạo báo cáo theo loại
    if (reportType === 'student') {
      // Báo cáo sinh viên
      const students = await prisma.hocVien.findMany({
        include: {
          ketQuaHocTap: true,
        },
      });

      const totalStudents = students.length;
      const avgGPA =
        students.reduce((sum, s) => sum + s.diemTrungBinh, 0) / Math.max(totalStudents, 1);

      const xuatSac = students.filter((s) => s.diemTrungBinh >= 3.6).length;
      const gioi = students.filter((s) => s.diemTrungBinh >= 3.2 && s.diemTrungBinh < 3.6).length;
      const kha = students.filter((s) => s.diemTrungBinh >= 2.5 && s.diemTrungBinh < 3.2).length;
      const trungBinh = students.filter((s) => s.diemTrungBinh >= 2.0 && s.diemTrungBinh < 2.5)
        .length;
      const yeu = students.filter((s) => s.diemTrungBinh < 2.0).length;

      reportData = {
        totalStudents,
        avgGPA: parseFloat(avgGPA.toFixed(2)),
        distribution: { xuatSac, gioi, kha, trungBinh, yeu },
      };

      summary = {
        title: `Báo cáo học viên tháng ${month}/${year}`,
        highlights: [
          `Tổng số học viên: ${totalStudents}`,
          `GPA trung bình: ${avgGPA.toFixed(2)}`,
          `Xuất sắc: ${xuatSac} (${((xuatSac / totalStudents) * 100).toFixed(1)}%)`,
        ],
      };
    } else if (reportType === 'faculty') {
      // Báo cáo giảng viên
      const faculties = await prisma.facultyProfile.findMany({
        include: {
          hocVienHuongDan: { include: { ketQuaHocTap: true } },
          researchProjectsList: true,
          teachingSubjectsList: true,
        },
      });

      const totalFaculties = faculties.length;
      const totalResearch = faculties.reduce((sum, f) => sum + (f.researchProjectsList?.length || 0), 0);
      const completedResearch = faculties.reduce(
        (sum, f) =>
          sum + (f.researchProjectsList?.filter((r: any) => r.trangThai === 'Hoàn thành').length || 0),
        0
      );

      reportData = {
        totalFaculties,
        totalResearch,
        completedResearch,
      };

      summary = {
        title: `Báo cáo giảng viên tháng ${month}/${year}`,
        highlights: [
          `Tổng số giảng viên: ${totalFaculties}`,
          `Tổng số nghiên cứu: ${totalResearch}`,
          `Đã hoàn thành: ${completedResearch}`,
        ],
      };
    } else if (reportType === 'academy') {
      // Báo cáo tổng hợp học viện
      const [students, faculties] = await Promise.all([
        prisma.hocVien.count(),
        prisma.facultyProfile.count(),
      ]);

      reportData = {
        totalStudents: students,
        totalFaculties: faculties,
      };

      summary = {
        title: `Báo cáo tổng hợp tháng ${month}/${year}`,
        highlights: [
          `Tổng số học viên: ${students}`,
          `Tổng số giảng viên: ${faculties}`,
        ],
      };
    }

    // Gọi AI để tạo insights (optional)
    let aiInsights = '';
    try {
      aiInsights = await generateTrainingInsights(reportData);
      summary.aiInsights = aiInsights;
    } catch (error) {
      console.error('AI insights generation failed:', error);
    }

    // Tạo PDF
    const pdf = new jsPDF();
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text(summary.title, 105, 20, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    let yPos = 40;
    summary.highlights.forEach((highlight: string) => {
      pdf.text(highlight, 20, yPos);
      yPos += 10;
    });

    if (aiInsights) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI Insights:', 20, yPos + 10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(aiInsights.substring(0, 500), 20, yPos + 20, { maxWidth: 170 });
    }

    const pdfFilename = `report_${reportType}_${year}_${month}.pdf`;
    const pdfPath = path.join(process.cwd(), 'public', 'reports', pdfFilename);
    await writeFile(pdfPath, Buffer.from(pdf.output('arraybuffer')));

    // Tạo Excel
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['Report Type', reportType],
      ['Month', month],
      ['Year', year],
      ['Generated At', new Date().toISOString()],
      [],
      ...summary.highlights.map((h: string) => [h]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');

    const excelFilename = `report_${reportType}_${year}_${month}.xlsx`;
    const excelPath = path.join(process.cwd(), 'public', 'reports', excelFilename);
    XLSX.writeFile(wb, excelPath);

    // Lưu thông tin báo cáo vào database
    const report = await prisma.monthlyReport.create({
      data: {
        reportType,
        targetId: targetId || null,
        month,
        year,
        pdfPath: `/reports/${pdfFilename}`,
        excelPath: `/reports/${excelFilename}`,
        summary: summary as any,
        generatedBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        pdfPath: report.pdfPath,
        excelPath: report.excelPath,
        summary: report.summary,
      },
    });
  } catch (error: any) {
    console.error('Generate report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error.message },
      { status: 500 }
    );
  }
}
