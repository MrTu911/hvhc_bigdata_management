/**
 * API: Hệ số môn học
 * RBAC v8.8: Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction, requireAuth } from '@/lib/rbac/middleware';
import { STUDENT, EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET: Lấy danh sách hệ số môn học
export async function GET(req: NextRequest) {
  try {
    // RBAC: Chỉ cần đăng nhập để xem hệ số
    const authResult = await requireAuth(req);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(req.url);
    const maMon = searchParams.get('maMon');
    const khoa = searchParams.get('khoa');
    const loaiMon = searchParams.get('loaiMon');

    const where: any = {};
    if (maMon) where.maMon = { contains: maMon, mode: 'insensitive' };
    if (khoa) where.khoa = khoa;
    if (loaiMon) where.loaiMon = loaiMon;

    const heSoList = await prisma.heSoMonHoc.findMany({
      where,
      orderBy: { maMon: 'asc' },
    });

    return NextResponse.json(heSoList);
  } catch (error: any) {
    console.error('Error fetching he so mon hoc:', error);
    return NextResponse.json(
      { error: 'Failed to fetch he so mon hoc', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Tạo hệ số môn học mới
export async function POST(req: NextRequest) {
  try {
    // RBAC: Yêu cầu quyền quản lý học kỳ (admin/faculty head)
    const authResult = await requireFunction(req, EDUCATION.MANAGE_TERM);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const data = await req.json();

    // Validate trọng số tổng = 1.0
    const tongHeSo = (data.heSoChuyenCan || 0.1) + 
                     (data.heSoGiuaKy || 0.2) + 
                     (data.heSoBaiTap || 0.2) + 
                     (data.heSoThi || 0.5);
    
    if (Math.abs(tongHeSo - 1.0) > 0.01) {
      return NextResponse.json(
        { error: 'Tổng hệ số phải bằng 1.0 (hiện tại: ' + tongHeSo + ')' },
        { status: 400 }
      );
    }

    // Kiểm tra mã môn đã tồn tại
    const exists = await prisma.heSoMonHoc.findUnique({
      where: { maMon: data.maMon },
    });

    if (exists) {
      return NextResponse.json(
        { error: 'Mã môn học đã tồn tại' },
        { status: 400 }
      );
    }

    const heSoMon = await prisma.heSoMonHoc.create({
      data: {
        maMon: data.maMon,
        tenMon: data.tenMon,
        heSoChuyenCan: data.heSoChuyenCan || 0.1,
        heSoGiuaKy: data.heSoGiuaKy || 0.2,
        heSoBaiTap: data.heSoBaiTap || 0.2,
        heSoThi: data.heSoThi || 0.5,
        soTinChi: data.soTinChi || 3,
        loaiMon: data.loaiMon,
        khoa: data.khoa,
        moTa: data.moTa,
      },
    });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.MANAGE_TERM,
      action: 'CREATE',
      resourceType: 'HE_SO_MON_HOC',
      resourceId: heSoMon.id,
      newValue: heSoMon,
      result: 'SUCCESS',
    });

    return NextResponse.json(heSoMon, { status: 201 });
  } catch (error: any) {
    console.error('Error creating he so mon hoc:', error);
    return NextResponse.json(
      { error: 'Failed to create he so mon hoc', details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật hệ số môn học
export async function PUT(req: NextRequest) {
  try {
    // RBAC: Yêu cầu quyền quản lý học kỳ
    const authResult = await requireFunction(req, EDUCATION.MANAGE_TERM);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const data = await req.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    // Validate trọng số nếu có thay đổi
    if (updateData.heSoChuyenCan !== undefined || 
        updateData.heSoGiuaKy !== undefined ||
        updateData.heSoBaiTap !== undefined ||
        updateData.heSoThi !== undefined) {
      
      const current = await prisma.heSoMonHoc.findUnique({ where: { id } });
      if (!current) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      const tongHeSo = (updateData.heSoChuyenCan ?? current.heSoChuyenCan) + 
                       (updateData.heSoGiuaKy ?? current.heSoGiuaKy) + 
                       (updateData.heSoBaiTap ?? current.heSoBaiTap) + 
                       (updateData.heSoThi ?? current.heSoThi);
      
      if (Math.abs(tongHeSo - 1.0) > 0.01) {
        return NextResponse.json(
          { error: 'Tổng hệ số phải bằng 1.0 (hiện tại: ' + tongHeSo + ')' },
          { status: 400 }
        );
      }
    }

    // Get old value for audit
    const oldValue = await prisma.heSoMonHoc.findUnique({ where: { id } });

    const updated = await prisma.heSoMonHoc.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.MANAGE_TERM,
      action: 'UPDATE',
      resourceType: 'HE_SO_MON_HOC',
      resourceId: id,
      oldValue,
      newValue: updated,
      result: 'SUCCESS',
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating he so mon hoc:', error);
    return NextResponse.json(
      { error: 'Failed to update he so mon hoc', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Xóa hệ số môn học
export async function DELETE(req: NextRequest) {
  try {
    // RBAC: Yêu cầu quyền xóa học viên (admin only)
    const authResult = await requireFunction(req, STUDENT.DELETE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    // Get old value for audit
    const oldValue = await prisma.heSoMonHoc.findUnique({ where: { id } });

    await prisma.heSoMonHoc.delete({ where: { id } });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: STUDENT.DELETE,
      action: 'DELETE',
      resourceType: 'HE_SO_MON_HOC',
      resourceId: id,
      oldValue,
      result: 'SUCCESS',
    });

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting he so mon hoc:', error);
    return NextResponse.json(
      { error: 'Failed to delete he so mon hoc', details: error.message },
      { status: 500 }
    );
  }
}
