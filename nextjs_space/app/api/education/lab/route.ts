import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { LAB } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET - Lấy danh sách phòng thí nghiệm
export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, LAB.VIEW);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const labType = searchParams.get('labType');
    const unitId = searchParams.get('unitId');
    const status = searchParams.get('status');
    const building = searchParams.get('building');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { isActive: true };
    if (labType) where.labType = labType;
    if (unitId) where.unitId = unitId;
    if (status) where.status = status;
    if (building) where.building = { contains: building, mode: 'insensitive' };

    const [labs, total] = await Promise.all([
      prisma.lab.findMany({
        where,
        include: {
          unit: { select: { code: true, name: true } },
          labEquipments: { select: { id: true, status: true } },
          labSessions: {
            where: { sessionDate: { gte: new Date() } },
            select: { id: true, sessionDate: true, status: true },
            take: 5,
            orderBy: { sessionDate: 'asc' }
          }
        },
        orderBy: { code: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.lab.count({ where })
    ]);

    // Add equipment count
    const labsWithCount = labs.map(lab => ({
      ...lab,
      equipmentCount: lab.labEquipments.length,
      upcomingSessionCount: lab.labSessions.length
    }));

    // Get stats by type
    const typeStats = await prisma.lab.groupBy({
      by: ['labType'],
      where: { isActive: true },
      _count: { id: true }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: LAB.VIEW,
      action: 'VIEW',
      resourceType: 'LAB',
      result: 'SUCCESS'
    });

    return NextResponse.json({
      data: labsWithCount,
      stats: { typeStats },
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching labs:', error);
    return NextResponse.json({ error: 'Lỗi khi tải danh sách phòng thí nghiệm' }, { status: 500 });
  }
}

// POST - Tạo phòng thí nghiệm mới
export async function POST(req: NextRequest) {
  const authResult = await requireFunction(req, LAB.CREATE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { code, name, labType, building, floor, roomNumber, capacity, area, unitId, managerId, description, regulations, equipment } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    const existing = await prisma.lab.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'Mã phòng thí nghiệm đã tồn tại' }, { status: 400 });
    }

    const lab = await prisma.lab.create({
      data: {
        code,
        name,
        labType: labType || 'COMPUTER',
        building,
        floor,
        roomNumber,
        capacity: capacity || 30,
        area,
        unitId,
        managerId,
        description,
        regulations,
        equipment,
        status: 'AVAILABLE' as const
      },
      include: { unit: { select: { code: true, name: true } } }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: LAB.CREATE,
      action: 'CREATE',
      resourceType: 'LAB',
      resourceId: lab.id,
      newValue: lab,
      result: 'SUCCESS'
    });

    return NextResponse.json({ data: lab, message: 'Tạo phòng thí nghiệm thành công' }, { status: 201 });
  } catch (error) {
    console.error('Error creating lab:', error);
    return NextResponse.json({ error: 'Lỗi khi tạo phòng thí nghiệm' }, { status: 500 });
  }
}

// PUT - Cập nhật phòng thí nghiệm
export async function PUT(req: NextRequest) {
  const authResult = await requireFunction(req, LAB.UPDATE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID phòng thí nghiệm' }, { status: 400 });
    }

    const existing = await prisma.lab.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy phòng thí nghiệm' }, { status: 404 });
    }

    const lab = await prisma.lab.update({
      where: { id },
      data: updateData,
      include: { unit: { select: { code: true, name: true } } }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: LAB.UPDATE,
      action: 'UPDATE',
      resourceType: 'LAB',
      resourceId: id,
      oldValue: existing,
      newValue: lab,
      result: 'SUCCESS'
    });

    return NextResponse.json({ data: lab, message: 'Cập nhật phòng thí nghiệm thành công' });
  } catch (error) {
    console.error('Error updating lab:', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật phòng thí nghiệm' }, { status: 500 });
  }
}

// DELETE - Xóa phòng thí nghiệm
export async function DELETE(req: NextRequest) {
  const authResult = await requireFunction(req, LAB.DELETE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID phòng thí nghiệm' }, { status: 400 });
    }

    const existing = await prisma.lab.findUnique({
      where: { id },
      include: { labEquipments: { select: { id: true } }, labSessions: { select: { id: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy phòng thí nghiệm' }, { status: 404 });
    }

    // Soft delete
    await prisma.lab.update({
      where: { id },
      data: { isActive: false }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: LAB.DELETE,
      action: 'DELETE',
      resourceType: 'LAB',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS'
    });

    return NextResponse.json({ message: 'Xóa phòng thí nghiệm thành công' });
  } catch (error) {
    console.error('Error deleting lab:', error);
    return NextResponse.json({ error: 'Lỗi khi xóa phòng thí nghiệm' }, { status: 500 });
  }
}
