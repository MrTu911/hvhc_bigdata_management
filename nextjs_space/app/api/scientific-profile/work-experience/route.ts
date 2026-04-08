import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import prisma from '@/lib/db';

/**
 * API: Quản lý Quá trình công tác (Work Experience)
 */

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, FACULTY.VIEW);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || user.id;

    const workExp = await prisma.workExperience.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json(workExp);
  } catch (error: any) {
    console.error('Error fetching work experience:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, FACULTY.VIEW);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { userId, organization, position, startDate, endDate, description } = body;

    // Validation
    const errors: string[] = [];
    
    if (!organization || organization.trim() === '') {
      errors.push('Vui lòng nhập Nơi công tác');
    }
    
    if (!position || position.trim() === '') {
      errors.push('Vui lòng nhập Chức vụ/Công việc');
    }
    
    if (!startDate) {
      errors.push('Vui lòng nhập Thời gian bắt đầu');
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        errors.push('Thời gian bắt đầu không thể sau thời gian kết thúc');
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        error: errors.join('. '),
        validationErrors: errors 
      }, { status: 400 });
    }

    const targetUserId = userId || user.id;

    if (targetUserId !== user.id) {
      return NextResponse.json({ error: 'Bạn không có quyền thêm dữ liệu cho người dùng khác' }, { status: 403 });
    }

    const workExp = await prisma.workExperience.create({
      data: { 
        userId: targetUserId,
        organization: organization.trim(),
        position: position.trim(),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        description: description?.trim() || null,
      },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: FACULTY.CREATE,
      action: 'CREATE',
      resourceType: 'WORK_EXPERIENCE',
      resourceId: workExp.id,
      newValue: workExp,
      result: 'SUCCESS',
    });

    return NextResponse.json(workExp, { status: 201 });
  } catch (error: any) {
    console.error('Error creating work experience:', error);
    return NextResponse.json({ error: 'Lỗi khi lưu dữ liệu. Vui lòng kiểm tra lại thông tin.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, FACULTY.VIEW);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { id, ...data } = body;

    const existing = await prisma.workExperience.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi' }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const workExp = await prisma.workExperience.update({
      where: { id },
      data,
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: FACULTY.UPDATE,
      action: 'UPDATE',
      resourceType: 'WORK_EXPERIENCE',
      resourceId: id,
      oldValue: existing,
      newValue: workExp,
      result: 'SUCCESS',
    });

    return NextResponse.json(workExp);
  } catch (error: any) {
    console.error('Error updating work experience:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, FACULTY.VIEW);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const existing = await prisma.workExperience.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi' }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.workExperience.delete({ where: { id } });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: FACULTY.DELETE,
      action: 'DELETE',
      resourceType: 'WORK_EXPERIENCE',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
    });

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting work experience:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
