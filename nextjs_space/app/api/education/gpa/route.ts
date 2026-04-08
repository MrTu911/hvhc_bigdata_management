/**
 * API: Education GPA - Tính điểm GPA học viên
 * Path: /api/education/gpa
 * Calculates weighted GPA from KetQuaHocTap using soTinChi weights
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { TRAINING } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

// Chuyển điểm 10 sang thang 4
function convertTo4Scale(diem: number): number {
  if (diem >= 9.0) return 4.0;
  if (diem >= 8.5) return 3.7;
  if (diem >= 8.0) return 3.5;
  if (diem >= 7.5) return 3.0;
  if (diem >= 7.0) return 2.5;
  if (diem >= 6.5) return 2.0;
  if (diem >= 6.0) return 1.5;
  if (diem >= 5.0) return 1.0;
  return 0.0;
}

function getLetterGrade(diem: number): string {
  if (diem >= 9.0) return 'A+';
  if (diem >= 8.5) return 'A';
  if (diem >= 8.0) return 'B+';
  if (diem >= 7.5) return 'B';
  if (diem >= 7.0) return 'C+';
  if (diem >= 6.5) return 'C';
  if (diem >= 6.0) return 'D+';
  if (diem >= 5.0) return 'D';
  return 'F';
}

function getXepLoai(gpa10: number): string {
  if (gpa10 >= 9.0) return 'Xuất sắc';
  if (gpa10 >= 8.0) return 'Giỏi';
  if (gpa10 >= 7.0) return 'Khá';
  if (gpa10 >= 5.0) return 'Trung bình';
  return 'Yếu';
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, TRAINING.VIEW_GRADE);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const hocVienId = searchParams.get('hocVienId') || '';
    const namHoc = searchParams.get('namHoc') || '';
    const hocKy = searchParams.get('hocKy') || '';
    const includeAll = searchParams.get('includeAll') === 'true'; // include DRAFT grades

    if (!hocVienId) {
      return NextResponse.json({ error: 'hocVienId là bắt buộc' }, { status: 400 });
    }

    const hocVien = await prisma.hocVien.findUnique({
      where: { id: hocVienId },
      include: {
        user: { select: { id: true, name: true, militaryId: true } },
        studentClass: { select: { id: true, name: true } },
        cohort: { select: { id: true, name: true } },
      },
    });
    if (!hocVien) return NextResponse.json({ error: 'Không tìm thấy học viên' }, { status: 404 });

    const where: any = {
      hocVienId,
      workflowStatus: includeAll ? undefined : 'APPROVED',
    };
    if (namHoc) where.namHoc = namHoc;
    if (hocKy) where.hocKy = hocKy;

    const grades = await prisma.ketQuaHocTap.findMany({
      where,
      include: {
        heSoMonHoc: {
          select: { maMon: true, tenMon: true, soTinChi: true, loaiMon: true },
        },
      },
      orderBy: [{ namHoc: 'asc' }, { hocKy: 'asc' }],
    });

    // Tính GPA theo học kỳ
    const semesterMap = new Map<string, {
      namHoc: string; hocKy: string;
      grades: typeof grades; gpa10: number; gpa4: number; totalCredits: number; passedCredits: number;
    }>();

    for (const g of grades) {
      const key = `${g.namHoc || 'N/A'}-${g.hocKy || 'N/A'}`;
      if (!semesterMap.has(key)) {
        semesterMap.set(key, { namHoc: g.namHoc || '', hocKy: g.hocKy || '', grades: [], gpa10: 0, gpa4: 0, totalCredits: 0, passedCredits: 0 });
      }
      semesterMap.get(key)!.grades.push(g);
    }

    const semesterGPAs = Array.from(semesterMap.entries()).map(([key, sem]) => {
      let totalWeightedScore = 0;
      let totalCredits = 0;
      let passedCredits = 0;

      for (const g of sem.grades) {
        const credits = g.soTinChi || 3;
        const score = g.diemTongKet ?? g.diem ?? 0;
        totalWeightedScore += score * credits;
        totalCredits += credits;
        if (score >= 5) passedCredits += credits;
      }

      const gpa10 = totalCredits > 0 ? parseFloat((totalWeightedScore / totalCredits).toFixed(2)) : 0;
      const gpa4 = convertTo4Scale(gpa10);

      return {
        namHoc: sem.namHoc,
        hocKy: sem.hocKy,
        totalSubjects: sem.grades.length,
        totalCredits,
        passedCredits,
        failedCredits: totalCredits - passedCredits,
        gpa10,
        gpa4,
        xepLoai: getXepLoai(gpa10),
        grades: sem.grades.map(g => ({
          id: g.id,
          monHoc: g.monHoc,
          maMon: g.maMon,
          soTinChi: g.soTinChi,
          diemQuaTrinh: g.diemQuaTrinh,
          diemGiuaKy: g.diemGiuaKy,
          diemThi: g.diemThi,
          diemTongKet: g.diemTongKet ?? g.diem,
          letterGrade: getLetterGrade(g.diemTongKet ?? g.diem ?? 0),
          ketQua: g.ketQua,
          xepLoai: g.xepLoai,
          workflowStatus: g.workflowStatus,
        })),
      };
    });

    // Tính GPA tích lũy toàn khóa
    let cumulativeWeighted = 0;
    let cumulativeCredits = 0;
    let cumulativePassed = 0;

    for (const g of grades) {
      const credits = g.soTinChi || 3;
      const score = g.diemTongKet ?? g.diem ?? 0;
      cumulativeWeighted += score * credits;
      cumulativeCredits += credits;
      if (score >= 5) cumulativePassed += credits;
    }

    const cumulativeGpa10 = cumulativeCredits > 0
      ? parseFloat((cumulativeWeighted / cumulativeCredits).toFixed(2))
      : 0;
    const cumulativeGpa4 = convertTo4Scale(cumulativeGpa10);

    return NextResponse.json({
      hocVien: {
        id: hocVien.id,
        maHocVien: hocVien.maHocVien,
        user: hocVien.user,
        studentClass: hocVien.studentClass,
        cohort: hocVien.cohort,
      },
      cumulative: {
        totalSubjects: grades.length,
        totalCredits: cumulativeCredits,
        passedCredits: cumulativePassed,
        failedCredits: cumulativeCredits - cumulativePassed,
        gpa10: cumulativeGpa10,
        gpa4: cumulativeGpa4,
        letterGrade: getLetterGrade(cumulativeGpa10),
        xepLoai: getXepLoai(cumulativeGpa10),
      },
      bySemester: semesterGPAs,
    });
  } catch (error) {
    console.error('[Education GPA GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
