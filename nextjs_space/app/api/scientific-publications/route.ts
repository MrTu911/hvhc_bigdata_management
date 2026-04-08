/**
 * API: Scientific Publications Management
 * Quản lý Sáng kiến, Giáo trình, Bài tập, Bài báo
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { FUNCTION_CODES } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

const TYPE_MAP: Record<string, string> = {
  'sang-kien': 'SANG_KIEN',
  'giao-trinh': 'GIAO_TRINH',
  'bai-tap': 'BAI_TAP',
  'bai-bao': 'BAI_BAO',
  'tai-lieu': 'TAI_LIEU',
  'de-tai': 'DE_TAI',
  'giao-trinh-dt': 'GIAO_TRINH_DT',
};

const TYPE_LABELS: Record<string, string> = {
  'SANG_KIEN': 'Sáng kiến',
  'GIAO_TRINH': 'Giáo trình',
  'BAI_TAP': 'Bài tập',
  'BAI_BAO': 'Bài báo',
  'TAI_LIEU': 'Tài liệu',
  'DE_TAI': 'Đề tài NCKH',
  'GIAO_TRINH_DT': 'Giáo trình',
};

export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, FUNCTION_CODES.RESEARCH.VIEW);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || ''; // sang-kien, giao-trinh, bai-tap, bai-bao
    const year = searchParams.get('year') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const userId = searchParams.get('userId') || '';
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { publisher: { contains: search, mode: 'insensitive' } },
        { organization: { contains: search, mode: 'insensitive' } },
        { coAuthors: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (type) {
      // Accept both slug ('sang-kien') and direct enum ('SANG_KIEN')
      where.type = TYPE_MAP[type] || type;
    }

    if (year) where.year = parseInt(year);
    if (userId) where.userId = userId;

    const [total, publications] = await Promise.all([
      prisma.scientificPublication.count({ where }),
      prisma.scientificPublication.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, rank: true } }
        },
        orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    // Get statistics by type
    const stats = await prisma.scientificPublication.groupBy({
      by: ['type'],
      _count: { id: true }
    });

    // Get distinct years for filter
    const years = await prisma.scientificPublication.findMany({
      distinct: ['year'],
      select: { year: true },
      orderBy: { year: 'desc' }
    });

    return NextResponse.json({
      publications: publications.map(p => ({
        ...p,
        typeLabel: TYPE_LABELS[p.type] || p.type
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: stats.map(s => ({
        type: s.type,
        label: TYPE_LABELS[s.type] || s.type,
        count: s._count.id
      })),
      years: years.map(y => y.year)
    });
  } catch (error) {
    console.error('Error fetching publications:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tải dữ liệu' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireFunction(req, FUNCTION_CODES.RESEARCH.CREATE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { 
      type, title, year, month, role, publisher, organization, 
      issueNumber, pageNumbers, targetUsers, coAuthors, notes, userId 
    } = body;

    if (!type || !title || !year || !role) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc (loại, tiêu đề, năm, vai trò)' },
        { status: 400 }
      );
    }

    // Get userId from auth if not provided (for self-created publications)
    const targetUserId = userId || authResult.user!.id;

    const publication = await prisma.scientificPublication.create({
      data: {
        userId: targetUserId,
        type,
        title,
        year: parseInt(year),
        month: month ? parseInt(month) : null,
        role,
        publisher,
        organization,
        issueNumber,
        pageNumbers,
        targetUsers,
        coAuthors,
        notes,
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: FUNCTION_CODES.RESEARCH.CREATE,
      action: 'CREATE',
      resourceType: 'SCIENTIFIC_PUBLICATION',
      resourceId: publication.id,
      newValue: publication,
      result: 'SUCCESS'
    });

    return NextResponse.json({
      message: 'Thêm công trình thành công',
      publication: {
        ...publication,
        typeLabel: TYPE_LABELS[publication.type] || publication.type
      }
    });
  } catch (error) {
    console.error('Error creating publication:', error);
    return NextResponse.json(
      { error: 'Lỗi khi thêm công trình' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const authResult = await requireFunction(req, FUNCTION_CODES.RESEARCH.UPDATE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Thiếu ID công trình' },
        { status: 400 }
      );
    }

    // Get old value for audit
    const oldValue = await prisma.scientificPublication.findUnique({ where: { id } });

    // Prepare update data
    const data: any = {};
    if (updateData.type) data.type = updateData.type;
    if (updateData.title) data.title = updateData.title;
    if (updateData.year) data.year = parseInt(updateData.year);
    if (updateData.month !== undefined) data.month = updateData.month ? parseInt(updateData.month) : null;
    if (updateData.role) data.role = updateData.role;
    if (updateData.publisher !== undefined) data.publisher = updateData.publisher;
    if (updateData.organization !== undefined) data.organization = updateData.organization;
    if (updateData.issueNumber !== undefined) data.issueNumber = updateData.issueNumber;
    if (updateData.pageNumbers !== undefined) data.pageNumbers = updateData.pageNumbers;
    if (updateData.targetUsers !== undefined) data.targetUsers = updateData.targetUsers;
    if (updateData.coAuthors !== undefined) data.coAuthors = updateData.coAuthors;
    if (updateData.notes !== undefined) data.notes = updateData.notes;

    const publication = await prisma.scientificPublication.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: FUNCTION_CODES.RESEARCH.UPDATE,
      action: 'UPDATE',
      resourceType: 'SCIENTIFIC_PUBLICATION',
      resourceId: id,
      oldValue,
      newValue: publication,
      result: 'SUCCESS'
    });

    return NextResponse.json({
      message: 'Cập nhật thành công',
      publication: {
        ...publication,
        typeLabel: TYPE_LABELS[publication.type] || publication.type
      }
    });
  } catch (error) {
    console.error('Error updating publication:', error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireFunction(req, FUNCTION_CODES.RESEARCH.DELETE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Thiếu ID công trình' },
        { status: 400 }
      );
    }

    // Get old value for audit
    const oldValue = await prisma.scientificPublication.findUnique({ where: { id } });

    await prisma.scientificPublication.delete({
      where: { id }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: FUNCTION_CODES.RESEARCH.DELETE,
      action: 'DELETE',
      resourceType: 'SCIENTIFIC_PUBLICATION',
      resourceId: id,
      oldValue,
      result: 'SUCCESS'
    });

    return NextResponse.json({
      message: 'Xóa thành công'
    });
  } catch (error) {
    console.error('Error deleting publication:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa' },
      { status: 500 }
    );
  }
}
