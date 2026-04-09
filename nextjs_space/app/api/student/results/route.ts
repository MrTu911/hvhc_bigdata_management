/**
 * @deprecated Dùng /api/education/grades/ thay thế (M10 backbone – ClassEnrollment với ScoreHistory).
 * Route này sẽ bị tắt vào 2026-10-01. Không mở rộng thêm.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction, requireAnyFunction } from '@/lib/rbac/middleware';
import { TRAINING, STUDENT } from '@/lib/rbac/function-codes';
import { logAudit, logSecurityEvent } from '@/lib/audit';

// Helper function to calculate grades automatically
async function calculateGrades(data: any, maMon?: string) {
  let heSo = null;
  
  // Try to find coefficient by maMon
  if (maMon || data.maMon) {
    heSo = await prisma.heSoMonHoc.findUnique({
      where: { maMon: maMon || data.maMon },
    });
  }
  
  // Use default coefficients if not found
  const heSoCC = heSo?.heSoChuyenCan || 0.1;
  const heSoGK = heSo?.heSoGiuaKy || 0.2;
  const heSoBT = heSo?.heSoBaiTap || 0.2;
  const heSoThi = heSo?.heSoThi || 0.5;
  
  // Get individual grade components
  const diemCC = data.diemChuyenCan ?? 0;
  const diemGK = data.diemGiuaKy ?? 0;
  const diemBT = data.diemBaiTap ?? 0;
  const diemThi = data.diemThi ?? 0;
  
  // Calculate process grade (excluding final exam)
  const totalProcessWeight = heSoCC + heSoGK + heSoBT;
  const diemQuaTrinh = totalProcessWeight > 0
    ? (diemCC * heSoCC + diemGK * heSoGK + diemBT * heSoBT) / totalProcessWeight
    : 0;
  
  // Calculate final grade
  const diemTongKet = diemCC * heSoCC + diemGK * heSoGK + diemBT * heSoBT + diemThi * heSoThi;
  
  // Determine result and classification
  const ketQua = diemTongKet >= 5 ? 'Đạt' : 'Không đạt';
  let xepLoai = '';
  if (diemTongKet >= 9) xepLoai = 'Xuất sắc';
  else if (diemTongKet >= 8) xepLoai = 'Giỏi';
  else if (diemTongKet >= 7) xepLoai = 'Khá';
  else if (diemTongKet >= 5) xepLoai = 'Trung bình';
  else xepLoai = 'Yếu';
  
  return {
    diemQuaTrinh: Math.round(diemQuaTrinh * 100) / 100,
    diemTongKet: Math.round(diemTongKet * 100) / 100,
    diem: Math.round(diemTongKet * 100) / 100, // Alias for backward compatibility
    ketQua,
    xepLoai,
    heSoMonHocId: heSo?.id,
  };
}

// GET: Lấy kết quả học tập của học viên
export async function GET(request: NextRequest) {
  try {
    // RBAC: VIEW_GRADE (Xem điểm) - scope SELF/UNIT
    const authResult = await requireFunction(request, TRAINING.VIEW_GRADE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const hocVienId = searchParams.get('hocVienId');
    const hocKy = searchParams.get('hocKy');
    const namHoc = searchParams.get('namHoc');

    if (!hocVienId) {
      return NextResponse.json(
        { error: 'hocVienId is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = { hocVienId };
    if (hocKy) where.hocKy = hocKy;
    if (namHoc) where.namHoc = namHoc;

    const results = await prisma.ketQuaHocTap.findMany({
      where,
      include: {
        heSoMonHoc: true,
      },
      orderBy: [
        { namHoc: 'desc' },
        { hocKy: 'desc' },
        { monHoc: 'asc' },
      ],
    });

    // Calculate GPA
    const totalGrades = results.filter(r => r.diem !== null);
    const gpa = totalGrades.length > 0
      ? totalGrades.reduce((sum, r) => sum + (r.diem || 0), 0) / totalGrades.length
      : 0;

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: TRAINING.VIEW_GRADE,
      action: 'VIEW',
      resourceType: 'STUDENT_RESULTS',
      resourceId: hocVienId,
      result: 'SUCCESS',
    });

    return NextResponse.json({
      results,
      stats: {
        totalSubjects: results.length,
        gpa: gpa.toFixed(2),
        passed: results.filter(r => r.ketQua === 'Đạt').length,
        failed: results.filter(r => r.ketQua === 'Không đạt').length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Thêm kết quả học tập (DRAFT)
export async function POST(request: NextRequest) {
  try {
    // RBAC: CREATE_GRADE_DRAFT (Tạo điểm nháp) - scope UNIT
    const authResult = await requireFunction(request, TRAINING.CREATE_GRADE_DRAFT);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const data = await request.json();

    // Validate required fields
    if (!data.hocVienId || !data.monHoc) {
      return NextResponse.json(
        { error: 'hocVienId và monHoc là bắt buộc' },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await prisma.hocVien.findUnique({
      where: { id: data.hocVienId },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Không tìm thấy học viên' },
        { status: 404 }
      );
    }

    // Calculate final grade and result using coefficient
    const calculated = await calculateGrades(data, data.maMon);

    // Create result
    const result = await prisma.ketQuaHocTap.create({
      data: {
        hocVienId: data.hocVienId,
        monHoc: data.monHoc,
        maMon: data.maMon,
        soTinChi: data.soTinChi || 3,
        diemChuyenCan: data.diemChuyenCan,
        diemGiuaKy: data.diemGiuaKy,
        diemBaiTap: data.diemBaiTap,
        diemThi: data.diemThi,
        diemQuaTrinh: calculated.diemQuaTrinh,
        diemTongKet: calculated.diemTongKet,
        diem: calculated.diem,
        hocKy: data.hocKy,
        namHoc: data.namHoc,
        ketQua: calculated.ketQua,
        xepLoai: calculated.xepLoai,
        nhanXet: data.nhanXet,
        giangVienId: user.id,
        heSoMonHocId: calculated.heSoMonHocId,
      },
    });

    // Update student GPA
    const allResults = await prisma.ketQuaHocTap.findMany({
      where: { hocVienId: data.hocVienId },
    });

    const totalGrades = allResults.filter(r => r.diem !== null);
    const gpa = totalGrades.length > 0
      ? totalGrades.reduce((sum, r) => sum + (r.diem || 0), 0) / totalGrades.length
      : 0;

    await prisma.hocVien.update({
      where: { id: data.hocVienId },
      data: { diemTrungBinh: gpa },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: TRAINING.CREATE_GRADE_DRAFT,
      action: 'CREATE',
      resourceType: 'STUDENT_RESULTS',
      resourceId: result.id,
      newValue: result,
      result: 'SUCCESS',
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating result:', error);
    return NextResponse.json(
      { error: 'Failed to create result', details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật/Submit kết quả học tập
export async function PUT(request: NextRequest) {
  try {
    // RBAC: SUBMIT_GRADE (Gửi điểm lên duyệt) - scope UNIT
    const authResult = await requireFunction(request, TRAINING.SUBMIT_GRADE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const data = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: 'Result id is required' },
        { status: 400 }
      );
    }

    // Check if result exists
    const existing = await prisma.ketQuaHocTap.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Không tìm thấy kết quả học tập' },
        { status: 404 }
      );
    }

    // Merge existing data with new data for calculation
    const mergedData = {
      diemChuyenCan: data.diemChuyenCan ?? existing.diemChuyenCan,
      diemGiuaKy: data.diemGiuaKy ?? existing.diemGiuaKy,
      diemBaiTap: data.diemBaiTap ?? existing.diemBaiTap,
      diemThi: data.diemThi ?? existing.diemThi,
      maMon: data.maMon ?? existing.maMon,
    };

    // Calculate final grade and result using coefficient
    const calculated = await calculateGrades(mergedData, mergedData.maMon);

    // Update result
    const result = await prisma.ketQuaHocTap.update({
      where: { id: data.id },
      data: {
        monHoc: data.monHoc ?? existing.monHoc,
        maMon: data.maMon ?? existing.maMon,
        soTinChi: data.soTinChi ?? existing.soTinChi,
        diemChuyenCan: data.diemChuyenCan ?? existing.diemChuyenCan,
        diemGiuaKy: data.diemGiuaKy ?? existing.diemGiuaKy,
        diemBaiTap: data.diemBaiTap ?? existing.diemBaiTap,
        diemThi: data.diemThi ?? existing.diemThi,
        diemQuaTrinh: calculated.diemQuaTrinh,
        diemTongKet: calculated.diemTongKet,
        diem: calculated.diem,
        hocKy: data.hocKy ?? existing.hocKy,
        namHoc: data.namHoc ?? existing.namHoc,
        ketQua: calculated.ketQua,
        xepLoai: calculated.xepLoai,
        nhanXet: data.nhanXet ?? existing.nhanXet,
        giangVienId: data.giangVienId ?? existing.giangVienId ?? user.id,
        heSoMonHocId: calculated.heSoMonHocId,
      },
    });

    // Update student GPA
    const allResults = await prisma.ketQuaHocTap.findMany({
      where: { hocVienId: existing.hocVienId },
    });

    const totalGrades = allResults.filter(r => r.diem !== null);
    const gpa = totalGrades.length > 0
      ? totalGrades.reduce((sum, r) => sum + (r.diem || 0), 0) / totalGrades.length
      : 0;

    await prisma.hocVien.update({
      where: { id: existing.hocVienId },
      data: { diemTrungBinh: gpa },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: TRAINING.SUBMIT_GRADE,
      action: 'UPDATE',
      resourceType: 'STUDENT_RESULTS',
      resourceId: data.id,
      oldValue: existing,
      newValue: result,
      result: 'SUCCESS',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating result:', error);
    return NextResponse.json(
      { error: 'Failed to update result', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Xóa kết quả học tập
export async function DELETE(request: NextRequest) {
  try {
    // RBAC: DELETE_STUDENT (Xóa học viên/kết quả) - scope ACADEMY
    const authResult = await requireFunction(request, STUDENT.DELETE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Result id is required' },
        { status: 400 }
      );
    }

    // Check if result exists
    const existing = await prisma.ketQuaHocTap.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Không tìm thấy kết quả học tập' },
        { status: 404 }
      );
    }

    // Delete result
    await prisma.ketQuaHocTap.delete({
      where: { id },
    });

    // Update student GPA
    const allResults = await prisma.ketQuaHocTap.findMany({
      where: { hocVienId: existing.hocVienId },
    });

    const totalGrades = allResults.filter(r => r.diem !== null);
    const gpa = totalGrades.length > 0
      ? totalGrades.reduce((sum, r) => sum + (r.diem || 0), 0) / totalGrades.length
      : 0;

    await prisma.hocVien.update({
      where: { id: existing.hocVienId },
      data: { diemTrungBinh: gpa },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: STUDENT.DELETE,
      action: 'DELETE',
      resourceType: 'STUDENT_RESULTS',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
    });

    return NextResponse.json({ message: 'Xóa kết quả thành công' });
  } catch (error: any) {
    console.error('Error deleting result:', error);
    return NextResponse.json(
      { error: 'Failed to delete result', details: error.message },
      { status: 500 }
    );
  }
}
