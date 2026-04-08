import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { LAB } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET - Lấy danh sách thiết bị
export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, LAB.VIEW_EQUIPMENT);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const labId = searchParams.get('labId');
    const equipmentType = searchParams.get('equipmentType');
    const status = searchParams.get('status');
    const condition = searchParams.get('condition');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = { isActive: true };
    if (labId) where.labId = labId;
    if (equipmentType) where.equipmentType = equipmentType;
    if (status) where.status = status;
    if (condition) where.condition = condition;

    const [equipment, total] = await Promise.all([
      prisma.labEquipment.findMany({
        where,
        include: {
          lab: { select: { code: true, name: true, building: true } },
          maintenanceLogs: {
            orderBy: { performedDate: 'desc' },
            take: 3
          }
        },
        orderBy: [{ lab: { code: 'asc' } }, { code: 'asc' }],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.labEquipment.count({ where })
    ]);

    // Get stats
    const statusStats = await prisma.labEquipment.groupBy({
      by: ['status'],
      where: { isActive: true },
      _count: { id: true }
    });

    const typeStats = await prisma.labEquipment.groupBy({
      by: ['equipmentType'],
      where: { isActive: true },
      _count: { id: true }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: LAB.VIEW_EQUIPMENT,
      action: 'VIEW',
      resourceType: 'LAB_EQUIPMENT',
      result: 'SUCCESS'
    });

    return NextResponse.json({
      data: equipment,
      stats: { statusStats, typeStats },
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json({ error: 'Lỗi khi tải danh sách thiết bị' }, { status: 500 });
  }
}

// POST - Thêm thiết bị mới
export async function POST(req: NextRequest) {
  const authResult = await requireFunction(req, LAB.CREATE_EQUIPMENT);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { code, name, labId, equipmentType, brand, model, serialNumber, purchaseDate, warrantyExpiry, purchasePrice, currentValue, specifications, location, notes } = body;

    if (!code || !name || !labId) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    const existing = await prisma.labEquipment.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'Mã thiết bị đã tồn tại' }, { status: 400 });
    }

    const lab = await prisma.lab.findUnique({ where: { id: labId } });
    if (!lab) {
      return NextResponse.json({ error: 'Không tìm thấy phòng thí nghiệm' }, { status: 404 });
    }

    const equipment = await prisma.labEquipment.create({
      data: {
        code,
        name,
        labId,
        equipmentType: equipmentType || 'COMPUTER',
        brand,
        model,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        purchasePrice,
        currentValue,
        specifications,
        location,
        status: 'OPERATIONAL' as const,
        condition: 'GOOD' as const,
        notes
      },
      include: { lab: { select: { code: true, name: true } } }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: LAB.CREATE_EQUIPMENT,
      action: 'CREATE',
      resourceType: 'LAB_EQUIPMENT',
      resourceId: equipment.id,
      newValue: equipment,
      result: 'SUCCESS'
    });

    return NextResponse.json({ data: equipment, message: 'Thêm thiết bị thành công' }, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json({ error: 'Lỗi khi thêm thiết bị' }, { status: 500 });
  }
}

// PUT - Cập nhật thiết bị
export async function PUT(req: NextRequest) {
  const authResult = await requireFunction(req, LAB.UPDATE_EQUIPMENT);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID thiết bị' }, { status: 400 });
    }

    const existing = await prisma.labEquipment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy thiết bị' }, { status: 404 });
    }

    // Parse dates if provided
    if (updateData.purchaseDate) updateData.purchaseDate = new Date(updateData.purchaseDate);
    if (updateData.warrantyExpiry) updateData.warrantyExpiry = new Date(updateData.warrantyExpiry);
    if (updateData.lastMaintenanceDate) updateData.lastMaintenanceDate = new Date(updateData.lastMaintenanceDate);
    if (updateData.nextMaintenanceDate) updateData.nextMaintenanceDate = new Date(updateData.nextMaintenanceDate);

    const equipment = await prisma.labEquipment.update({
      where: { id },
      data: updateData,
      include: { lab: { select: { code: true, name: true } } }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: LAB.UPDATE_EQUIPMENT,
      action: 'UPDATE',
      resourceType: 'LAB_EQUIPMENT',
      resourceId: id,
      oldValue: existing,
      newValue: equipment,
      result: 'SUCCESS'
    });

    return NextResponse.json({ data: equipment, message: 'Cập nhật thiết bị thành công' });
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật thiết bị' }, { status: 500 });
  }
}

// DELETE - Xóa thiết bị
export async function DELETE(req: NextRequest) {
  const authResult = await requireFunction(req, LAB.DELETE_EQUIPMENT);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID thiết bị' }, { status: 400 });
    }

    const existing = await prisma.labEquipment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy thiết bị' }, { status: 404 });
    }

    // Soft delete
    await prisma.labEquipment.update({
      where: { id },
      data: { isActive: false, status: 'RETIRED' as const }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: LAB.DELETE_EQUIPMENT,
      action: 'DELETE',
      resourceType: 'LAB_EQUIPMENT',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS'
    });

    return NextResponse.json({ message: 'Xóa thiết bị thành công' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json({ error: 'Lỗi khi xóa thiết bị' }, { status: 500 });
  }
}
