import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { LEARNING_MATERIAL } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET - Lấy danh sách học liệu
export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, LEARNING_MATERIAL.VIEW);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const subjectCode = searchParams.get('subjectCode');
    const materialType = searchParams.get('materialType');
    const unitId = searchParams.get('unitId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { isActive: true };
    if (subjectCode) where.subjectCode = { contains: subjectCode, mode: 'insensitive' };
    if (materialType) where.materialType = materialType;
    if (unitId) where.unitId = unitId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { subjectName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [materials, total] = await Promise.all([
      prisma.learningMaterial.findMany({
        where,
        include: {
          unit: { select: { code: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.learningMaterial.count({ where })
    ]);

    // Get stats by type
    const typeStats = await prisma.learningMaterial.groupBy({
      by: ['materialType'],
      where: { isActive: true },
      _count: { id: true }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: LEARNING_MATERIAL.VIEW,
      action: 'VIEW',
      resourceType: 'LEARNING_MATERIAL',
      result: 'SUCCESS'
    });

    return NextResponse.json({
      data: materials,
      stats: { typeStats },
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching learning materials:', error);
    return NextResponse.json({ error: 'Lỗi khi tải danh sách học liệu' }, { status: 500 });
  }
}

// POST - Tạo học liệu mới
export async function POST(req: NextRequest) {
  const authResult = await requireFunction(req, LEARNING_MATERIAL.CREATE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { code, title, description, subjectCode, subjectName, materialType, format, fileUrl, fileName, fileSize, duration, thumbnailUrl, unitId, chapter, topic, tags, accessLevel } = body;

    if (!code || !title) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    const existing = await prisma.learningMaterial.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'Mã học liệu đã tồn tại' }, { status: 400 });
    }

    const material = await prisma.learningMaterial.create({
      data: {
        code,
        title,
        description,
        subjectCode,
        subjectName,
        materialType: materialType || 'DOCUMENT',
        format,
        fileUrl,
        fileName,
        fileSize,
        duration,
        thumbnailUrl,
        unitId,
        authorId: authResult.user!.id,
        chapter,
        topic,
        tags: tags || [],
        accessLevel: accessLevel || 'INTERNAL',
        publishedAt: new Date()
      },
      include: { unit: { select: { code: true, name: true } } }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: LEARNING_MATERIAL.CREATE,
      action: 'CREATE',
      resourceType: 'LEARNING_MATERIAL',
      resourceId: material.id,
      newValue: material,
      result: 'SUCCESS'
    });

    return NextResponse.json({ data: material, message: 'Tạo học liệu thành công' }, { status: 201 });
  } catch (error) {
    console.error('Error creating learning material:', error);
    return NextResponse.json({ error: 'Lỗi khi tạo học liệu' }, { status: 500 });
  }
}

// PUT - Cập nhật học liệu
export async function PUT(req: NextRequest) {
  const authResult = await requireFunction(req, LEARNING_MATERIAL.UPDATE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID học liệu' }, { status: 400 });
    }

    const existing = await prisma.learningMaterial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy học liệu' }, { status: 404 });
    }

    const material = await prisma.learningMaterial.update({
      where: { id },
      data: updateData,
      include: { unit: { select: { code: true, name: true } } }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: LEARNING_MATERIAL.UPDATE,
      action: 'UPDATE',
      resourceType: 'LEARNING_MATERIAL',
      resourceId: id,
      oldValue: existing,
      newValue: material,
      result: 'SUCCESS'
    });

    return NextResponse.json({ data: material, message: 'Cập nhật học liệu thành công' });
  } catch (error) {
    console.error('Error updating learning material:', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật học liệu' }, { status: 500 });
  }
}

// DELETE - Xóa học liệu
export async function DELETE(req: NextRequest) {
  const authResult = await requireFunction(req, LEARNING_MATERIAL.DELETE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID học liệu' }, { status: 400 });
    }

    const existing = await prisma.learningMaterial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy học liệu' }, { status: 404 });
    }

    // Soft delete
    await prisma.learningMaterial.update({
      where: { id },
      data: { isActive: false }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: LEARNING_MATERIAL.DELETE,
      action: 'DELETE',
      resourceType: 'LEARNING_MATERIAL',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS'
    });

    return NextResponse.json({ message: 'Xóa học liệu thành công' });
  } catch (error) {
    console.error('Error deleting learning material:', error);
    return NextResponse.json({ error: 'Lỗi khi xóa học liệu' }, { status: 500 });
  }
}
