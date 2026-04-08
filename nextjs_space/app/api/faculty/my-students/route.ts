/**
 * API: Faculty My Students
 * RBAC v8.8: Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY, STUDENT } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET /api/faculty/my-students - Lấy danh sách học viên hướng dẫn
export async function GET(req: NextRequest) {
  try {
    // RBAC: Yêu cầu quyền xem giảng viên hoặc xem học viên
    const authResult = await requireFunction(req, FACULTY.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const { user, session } = authResult;

    // Lấy faculty profile của giảng viên hiện tại
    const currentUser = await prisma.user.findUnique({
      where: { id: user!.id },
      include: { facultyProfile: true },
    });

    if (!currentUser?.facultyProfile) {
      return NextResponse.json(
        { success: false, error: 'Faculty profile not found' },
        { status: 404 }
      );
    }

    const facultyId = currentUser.facultyProfile.id;

    // Lấy danh sách học viên hướng dẫn với kết quả học tập
    const students = await prisma.hocVien.findMany({
      where: {
        giangVienHuongDanId: facultyId,
      },
      include: {
        ketQuaHocTap: {
          select: {
            diemTongKet: true,
            hocKy: true,
            namHoc: true,
          },
        },
      },
      orderBy: {
        hoTen: 'asc',
      },
    });

    // Tính toán statistics
    let totalGPA = 0;
    let countGPA = 0;
    let xuatSac = 0;
    let gioi = 0;
    let kha = 0;
    let trungBinh = 0;
    let yeu = 0;

    const studentsWithGPA = students.map((student) => {
      // Tính GPA từ kết quả học tập
      const validScores = student.ketQuaHocTap
        .filter((kt) => kt.diemTongKet !== null && kt.diemTongKet !== undefined)
        .map((kt) => kt.diemTongKet as number);

      let gpa = student.diemTrungBinh || 0;
      if (validScores.length > 0) {
        gpa = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
      }

      // Xếp loại
      let hocLuc = 'Chưa xếp loại';
      if (gpa >= 9.0) {
        hocLuc = 'Xuất sắc';
        xuatSac++;
      } else if (gpa >= 8.0) {
        hocLuc = 'Giỏi';
        gioi++;
      } else if (gpa >= 6.5) {
        hocLuc = 'Khá';
        kha++;
      } else if (gpa >= 5.0) {
        hocLuc = 'Trung bình';
        trungBinh++;
      } else if (gpa > 0) {
        hocLuc = 'Yếu';
        yeu++;
      }

      if (gpa > 0) {
        totalGPA += gpa;
        countGPA++;
      }

      return {
        id: student.id,
        maHocVien: student.maHocVien,
        hoTen: student.hoTen,
        lop: student.lop,
        khoaHoc: student.khoaHoc,
        nganh: student.nganh,
        email: student.email,
        dienThoai: student.dienThoai,
        trangThai: student.trangThai,
        gpa: parseFloat(gpa.toFixed(2)),
        hocLuc,
        soMonHoc: student.ketQuaHocTap.length,
      };
    });

    const avgGPA = countGPA > 0 ? totalGPA / countGPA : 0;

    // Thống kê
    const statistics = {
      total: students.length,
      avgGPA: parseFloat(avgGPA.toFixed(2)),
      xuatSac,
      gioi,
      kha,
      trungBinh,
      yeu,
      chuaXepLoai: students.length - (xuatSac + gioi + kha + trungBinh + yeu),
    };

    // Phân bố học lực
    const distribution = [
      { name: 'Xuất sắc', value: xuatSac, color: '#10b981' },
      { name: 'Giỏi', value: gioi, color: '#3b82f6' },
      { name: 'Khá', value: kha, color: '#f59e0b' },
      { name: 'Trung bình', value: trungBinh, color: '#ef4444' },
      { name: 'Yếu', value: yeu, color: '#dc2626' },
    ].filter((item) => item.value > 0);

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: FACULTY.VIEW,
      action: 'VIEW',
      resourceType: 'MY_STUDENTS',
      resourceId: facultyId,
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      students: studentsWithGPA,
      statistics,
      distribution,
    });
  } catch (error) {
    console.error('Error fetching my students:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch students',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
