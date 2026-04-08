/**
 * API: Education Transcript - Bảng điểm học viên
 * Path: /api/education/transcript
 * Returns full transcript with GPA and ranking
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { TRAINING, STUDENT } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

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

function getXepLoai(gpa10: number): string {
  if (gpa10 >= 9.0) return 'Xuất sắc';
  if (gpa10 >= 8.0) return 'Giỏi';
  if (gpa10 >= 7.0) return 'Khá';
  if (gpa10 >= 5.0) return 'Trung bình';
  return 'Yếu';
}

export async function GET(request: NextRequest) {
  try {
    // Either VIEW_GRADE (instructor) or VIEW_STUDENT (admin) permission needed
    const authResult = await requireFunction(request, TRAINING.VIEW_GRADE);
    if (!authResult.allowed) {
      // Try student permission
      const authResult2 = await requireFunction(request, STUDENT.VIEW_DETAIL);
      if (!authResult2.allowed) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const hocVienId = searchParams.get('hocVienId') || '';

    if (!hocVienId) {
      return NextResponse.json({ error: 'hocVienId là bắt buộc' }, { status: 400 });
    }

    const hocVien = await prisma.hocVien.findUnique({
      where: { id: hocVienId },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, militaryId: true,
            rank: true, position: true, dateOfBirth: true,
            unitRelation: { select: { id: true, name: true } },
          },
        },
        studentClass: { select: { id: true, name: true } },
        cohort: { select: { id: true, name: true, startYear: true, endYear: true } },
        giangVienHuongDan: {
          select: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!hocVien) return NextResponse.json({ error: 'Không tìm thấy học viên' }, { status: 404 });

    // Lấy toàn bộ điểm đã duyệt
    const allGrades = await prisma.ketQuaHocTap.findMany({
      where: { hocVienId, workflowStatus: 'APPROVED' },
      include: {
        heSoMonHoc: { select: { maMon: true, tenMon: true, soTinChi: true, loaiMon: true, khoa: true } },
      },
      orderBy: [{ namHoc: 'asc' }, { hocKy: 'asc' }, { monHoc: 'asc' }],
    });

    // Tính GPA tích lũy
    let totalWeighted = 0, totalCredits = 0, passedCredits = 0;
    for (const g of allGrades) {
      const credits = g.soTinChi || 3;
      const score = g.diemTongKet ?? g.diem ?? 0;
      totalWeighted += score * credits;
      totalCredits += credits;
      if (score >= 5) passedCredits += credits;
    }
    const gpa10 = totalCredits > 0 ? parseFloat((totalWeighted / totalCredits).toFixed(2)) : 0;
    const gpa4 = convertTo4Scale(gpa10);

    // Xếp hạng trong lớp
    let classRank: number | null = null;
    if (hocVien.classId) {
      const classMates = await prisma.hocVien.findMany({
        where: { classId: hocVien.classId },
        select: { id: true },
      });
      const classGPAs = await Promise.all(
        classMates.map(async (cm) => {
          const grades = await prisma.ketQuaHocTap.findMany({
            where: { hocVienId: cm.id, workflowStatus: 'APPROVED' },
            select: { diem: true, diemTongKet: true, soTinChi: true },
          });
          let tw = 0, tc = 0;
          for (const g of grades) {
            const c = g.soTinChi || 3;
            tw += (g.diemTongKet ?? g.diem ?? 0) * c;
            tc += c;
          }
          return { id: cm.id, gpa: tc > 0 ? tw / tc : 0 };
        })
      );
      const sorted = classGPAs.sort((a, b) => b.gpa - a.gpa);
      classRank = sorted.findIndex(cm => cm.id === hocVienId) + 1;
    }

    // Nhóm theo học kỳ
    const semesterGroups: Record<string, { grades: typeof allGrades; totalCredits: number; gpa10: number }> = {};
    for (const g of allGrades) {
      const key = `${g.namHoc || 'N/A'}-HK${g.hocKy || 'N/A'}`;
      if (!semesterGroups[key]) semesterGroups[key] = { grades: [], totalCredits: 0, gpa10: 0 };
      semesterGroups[key].grades.push(g);
    }

    for (const key of Object.keys(semesterGroups)) {
      const sem = semesterGroups[key];
      let tw = 0, tc = 0;
      for (const g of sem.grades) {
        const c = g.soTinChi || 3;
        tw += (g.diemTongKet ?? g.diem ?? 0) * c;
        tc += c;
      }
      sem.totalCredits = tc;
      sem.gpa10 = tc > 0 ? parseFloat((tw / tc).toFixed(2)) : 0;
    }

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      hocVien: {
        id: hocVien.id,
        maHocVien: hocVien.maHocVien,
        user: hocVien.user,
        studentClass: hocVien.studentClass,
        cohort: hocVien.cohort,
        facultyAdvisor: hocVien.giangVienHuongDan,
      },
      transcript: {
        totalSubjects: allGrades.length,
        totalCredits,
        passedCredits,
        failedCredits: totalCredits - passedCredits,
        gpa10,
        gpa4,
        xepLoai: getXepLoai(gpa10),
        classRank,
        classSize: hocVien.classId ? (await prisma.hocVien.count({ where: { classId: hocVien.classId } })) : null,
      },
      bySemester: Object.entries(semesterGroups).map(([key, sem]) => ({
        key,
        totalCredits: sem.totalCredits,
        gpa10: sem.gpa10,
        xepLoai: getXepLoai(sem.gpa10),
        subjects: sem.grades.map(g => ({
          id: g.id,
          monHoc: g.monHoc,
          maMon: g.maMon,
          namHoc: g.namHoc,
          hocKy: g.hocKy,
          soTinChi: g.soTinChi,
          diemQuaTrinh: g.diemQuaTrinh,
          diemGiuaKy: g.diemGiuaKy,
          diemThi: g.diemThi,
          diemTongKet: g.diemTongKet ?? g.diem,
          ketQua: (g.diemTongKet ?? g.diem ?? 0) >= 5 ? 'Đạt' : 'Không đạt',
          xepLoai: g.xepLoai,
          heSoMonHoc: g.heSoMonHoc,
        })),
      })),
    });
  } catch (error) {
    console.error('[Education Transcript GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
