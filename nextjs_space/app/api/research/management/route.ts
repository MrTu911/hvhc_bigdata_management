import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { RESEARCH } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, RESEARCH.VIEW);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const level = searchParams.get('level') || '';
    const type = searchParams.get('type') || 'project'; // project, initiative, textbook, article

    const where: any = {};
    
    if (search) {
      where.OR = [
        { projectName: { contains: search, mode: 'insensitive' } },
        { projectCode: { contains: search, mode: 'insensitive' } },
        { field: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (level) {
      where.level = level;
    }

    const projects = await prisma.researchProject.findMany({
      where,
      include: {
        faculty: {
          include: {
            user: { select: { name: true, email: true } },
            unit: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get filter options
    const [statuses, levels] = await Promise.all([
      prisma.researchProject.findMany({
        distinct: ['status'],
        select: { status: true }
      }),
      prisma.researchProject.findMany({
        distinct: ['level'],
        select: { level: true },
        where: { level: { not: null } }
      })
    ]);

    return NextResponse.json({
      projects,
      filters: {
        statuses: statuses.map(s => s.status),
        levels: levels.map(l => l.level).filter(Boolean)
      }
    });
  } catch (error) {
    console.error('Error fetching research management:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tải dữ liệu' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireFunction(req, RESEARCH.CREATE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { projectName, projectCode, facultyId, field, level, fundingAmount, startYear, endYear, description, status } = body;

    if (!projectName || !facultyId) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    const project = await prisma.researchProject.create({
      data: {
        projectName,
        projectCode,
        facultyId,
        field,
        level,
        fundingAmount: fundingAmount || 0,
        startYear,
        endYear,
        description,
        status: status || 'Đang thực hiện'
      },
      include: {
        faculty: {
          include: { user: { select: { name: true } } }
        }
      }
    });

    return NextResponse.json({
      message: 'Thêm đề tài thành công',
      project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Lỗi khi thêm đề tài' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const authResult = await requireFunction(req, RESEARCH.UPDATE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Thiếu ID đề tài' },
        { status: 400 }
      );
    }

    const project = await prisma.researchProject.update({
      where: { id },
      data: updateData,
      include: {
        faculty: {
          include: { user: { select: { name: true } } }
        }
      }
    });

    return NextResponse.json({
      message: 'Cập nhật thành công',
      project
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật đề tài' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireFunction(req, RESEARCH.DELETE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Thiếu ID đề tài' },
        { status: 400 }
      );
    }

    await prisma.researchProject.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Xóa thành công'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa đề tài' },
      { status: 500 }
    );
  }
}
