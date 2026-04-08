/**
 * API: Scientific Research Activities Management
 * Quản lý Hoạt động Nghiên cứu Khoa học (ScientificResearch model)
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { RESEARCH } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, RESEARCH.VIEW);
  if (!authResult.allowed) return authResult.response!;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const year = searchParams.get('year') || '';
    const level = searchParams.get('level') || '';
    const userId = searchParams.get('userId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { institution: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (year) where.year = parseInt(year);
    if (level) where.level = { contains: level, mode: 'insensitive' };
    if (userId) where.userId = userId;

    const [total, activities] = await Promise.all([
      prisma.scientificResearch.count({ where }),
      prisma.scientificResearch.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, rank: true } }
        },
        orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const stats = await prisma.scientificResearch.groupBy({
      by: ['level'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const years = await prisma.scientificResearch.findMany({
      distinct: ['year'],
      select: { year: true },
      orderBy: { year: 'desc' },
    });

    return NextResponse.json({
      activities,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats,
      years: years.map(y => y.year),
    });
  } catch (error) {
    console.error('Error fetching research activities:', error);
    return NextResponse.json({ error: 'Lỗi khi tải dữ liệu' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireFunction(req, RESEARCH.CREATE);
  if (!authResult.allowed) return authResult.response!;

  try {
    const body = await req.json();
    const { title, year, role, level, type, institution, result, notes, userId } = body;

    if (!title || !year || !role || !level || !type) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc (tiêu đề, năm, vai trò, cấp độ, loại hình)' },
        { status: 400 }
      );
    }

    const targetUserId = userId || authResult.user!.id;

    const activity = await prisma.scientificResearch.create({
      data: {
        userId: targetUserId,
        title,
        year: parseInt(year),
        role,
        level,
        type,
        institution: institution || null,
        result: result || null,
        notes: notes || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true, rank: true } }
      },
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: RESEARCH.CREATE,
      action: 'CREATE',
      resourceType: 'SCIENTIFIC_RESEARCH',
      resourceId: activity.id,
      newValue: activity,
      result: 'SUCCESS',
    });

    return NextResponse.json({ message: 'Thêm hoạt động nghiên cứu thành công', activity });
  } catch (error) {
    console.error('Error creating research activity:', error);
    return NextResponse.json({ error: 'Lỗi khi thêm hoạt động' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authResult = await requireFunction(req, RESEARCH.UPDATE);
  if (!authResult.allowed) return authResult.response!;

  try {
    const body = await req.json();
    const { id, title, year, role, level, type, institution, result, notes, userId } = body;

    if (!id) return NextResponse.json({ error: 'Thiếu ID hoạt động' }, { status: 400 });

    const oldValue = await prisma.scientificResearch.findUnique({ where: { id } });

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (year !== undefined) data.year = parseInt(year);
    if (role !== undefined) data.role = role;
    if (level !== undefined) data.level = level;
    if (type !== undefined) data.type = type;
    if (institution !== undefined) data.institution = institution || null;
    if (result !== undefined) data.result = result || null;
    if (notes !== undefined) data.notes = notes || null;
    if (userId !== undefined) data.userId = userId;

    const activity = await prisma.scientificResearch.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true, email: true, rank: true } }
      },
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: RESEARCH.UPDATE,
      action: 'UPDATE',
      resourceType: 'SCIENTIFIC_RESEARCH',
      resourceId: id,
      oldValue,
      newValue: activity,
      result: 'SUCCESS',
    });

    return NextResponse.json({ message: 'Cập nhật thành công', activity });
  } catch (error) {
    console.error('Error updating research activity:', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireFunction(req, RESEARCH.DELETE);
  if (!authResult.allowed) return authResult.response!;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Thiếu ID hoạt động' }, { status: 400 });

    const oldValue = await prisma.scientificResearch.findUnique({ where: { id } });

    await prisma.scientificResearch.delete({ where: { id } });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: RESEARCH.DELETE,
      action: 'DELETE',
      resourceType: 'SCIENTIFIC_RESEARCH',
      resourceId: id,
      oldValue,
      result: 'SUCCESS',
    });

    return NextResponse.json({ message: 'Xóa thành công' });
  } catch (error) {
    console.error('Error deleting research activity:', error);
    return NextResponse.json({ error: 'Lỗi khi xóa' }, { status: 500 });
  }
}
