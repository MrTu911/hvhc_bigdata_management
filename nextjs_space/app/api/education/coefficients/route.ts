/**
 * API Hệ số môn học - Course Coefficients
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { TRAINING } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET - Lấy danh sách hệ số
export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, TRAINING.VIEW_COURSE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    
    if (search) {
      where.OR = [
        { maMon: { contains: search, mode: 'insensitive' } },
        { tenMon: { contains: search, mode: 'insensitive' } },
        { khoa: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [coefficients, total] = await Promise.all([
      prisma.heSoMonHoc.findMany({
        where,
        orderBy: [{ khoa: 'asc' }, { maMon: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.heSoMonHoc.count({ where }),
    ]);

    await logAudit({
      userId: authResult.user!.id,
      functionCode: TRAINING.VIEW_COURSE,
      action: 'VIEW',
      resourceType: 'COEFFICIENT',
      result: 'SUCCESS',
    });

    return NextResponse.json({
      data: coefficients,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('GET /api/education/coefficients error:', error);
    return NextResponse.json({ error: 'Lỗi khi tải danh sách hệ số', details: error.message }, { status: 500 });
  }
}

// POST - Thêm hệ số mới
export async function POST(req: NextRequest) {
  const authResult = await requireFunction(req, TRAINING.CREATE_COURSE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { maMon, tenMon, soTinChi, heSoChuyenCan, heSoGiuaKy, heSoBaiTap, heSoThi, khoa, moTa } = body;

    if (!maMon || !tenMon) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    // Kiểm tra tổng hệ số
    const total = (heSoChuyenCan || 0) + (heSoGiuaKy || 0) + (heSoBaiTap || 0) + (heSoThi || 0);
    if (Math.abs(total - 1) >= 0.001) {
      return NextResponse.json({ error: 'Tổng hệ số phải bằng 1.0' }, { status: 400 });
    }

    // Kiểm tra đã tồn tại
    const existing = await prisma.heSoMonHoc.findFirst({ where: { maMon } });
    if (existing) {
      return NextResponse.json({ error: 'Hệ số cho môn học này đã tồn tại' }, { status: 400 });
    }

    const coefficient = await prisma.heSoMonHoc.create({
      data: {
        maMon,
        tenMon,
        soTinChi: soTinChi || 3,
        heSoChuyenCan: heSoChuyenCan || 0.1,
        heSoGiuaKy: heSoGiuaKy || 0.2,
        heSoBaiTap: heSoBaiTap || 0.2,
        heSoThi: heSoThi || 0.5,
        khoa: khoa || '',
        moTa: moTa || '',
      },
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: TRAINING.CREATE_COURSE,
      action: 'CREATE',
      resourceType: 'COEFFICIENT',
      resourceId: coefficient.id,
      newValue: coefficient,
      result: 'SUCCESS',
    });

    return NextResponse.json({ data: coefficient, message: 'Thêm hệ số thành công' }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/education/coefficients error:', error);
    return NextResponse.json({ error: 'Lỗi khi thêm hệ số', details: error.message }, { status: 500 });
  }
}

// PUT - Cập nhật hệ số
export async function PUT(req: NextRequest) {
  const authResult = await requireFunction(req, TRAINING.UPDATE_COURSE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID' }, { status: 400 });
    }

    // Kiểm tra tổng hệ số
    const total = (updateData.heSoChuyenCan || 0) + (updateData.heSoGiuaKy || 0) + 
                  (updateData.heSoBaiTap || 0) + (updateData.heSoThi || 0);
    if (Math.abs(total - 1) >= 0.001) {
      return NextResponse.json({ error: 'Tổng hệ số phải bằng 1.0' }, { status: 400 });
    }

    const existing = await prisma.heSoMonHoc.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy hệ số' }, { status: 404 });
    }

    const coefficient = await prisma.heSoMonHoc.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: TRAINING.UPDATE_COURSE,
      action: 'UPDATE',
      resourceType: 'COEFFICIENT',
      resourceId: id,
      oldValue: existing,
      newValue: coefficient,
      result: 'SUCCESS',
    });

    return NextResponse.json({ data: coefficient, message: 'Cập nhật thành công' });
  } catch (error: any) {
    console.error('PUT /api/education/coefficients error:', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật', details: error.message }, { status: 500 });
  }
}

// DELETE - Xóa hệ số
export async function DELETE(req: NextRequest) {
  const authResult = await requireFunction(req, TRAINING.DELETE_COURSE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID' }, { status: 400 });
    }

    const existing = await prisma.heSoMonHoc.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy hệ số' }, { status: 404 });
    }

    await prisma.heSoMonHoc.delete({ where: { id } });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: TRAINING.DELETE_COURSE,
      action: 'DELETE',
      resourceType: 'COEFFICIENT',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
    });

    return NextResponse.json({ message: 'Xóa thành công' });
  } catch (error: any) {
    console.error('DELETE /api/education/coefficients error:', error);
    return NextResponse.json({ error: 'Lỗi khi xóa', details: error.message }, { status: 500 });
  }
}
