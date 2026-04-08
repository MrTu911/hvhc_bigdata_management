import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { AWARDS } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import prisma from '@/lib/db';

/**
 * API: Quản lý Khen thưởng (Awards)
 */

// Validation constants
const VALID_AWARD_TYPES = ['KHEN_THUONG', 'KY_LUAT'];
const AWARD_TYPE_LABELS: Record<string, string> = {
  'KHEN_THUONG': 'Khen thưởng',
  'KY_LUAT': 'Kỷ luật',
};

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, AWARDS.VIEW);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || user.id;

    const awards = await prisma.awardsRecord.findMany({
      where: { userId },
      orderBy: { year: 'desc' },
    });

    return NextResponse.json(awards);
  } catch (error: any) {
    console.error('Error fetching awards:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, AWARDS.VIEW);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { userId, type, category, description, year, awardedBy, notes } = body;

    // Validation
    const errors: string[] = [];
    
    if (!type) {
      errors.push('Vui lòng chọn Loại (Khen thưởng/Kỷ luật)');
    } else if (!VALID_AWARD_TYPES.includes(type)) {
      errors.push(`Loại không hợp lệ. Vui lòng chọn: ${Object.values(AWARD_TYPE_LABELS).join(', ')}`);
    }

    if (!category || category.trim() === '') {
      errors.push('Vui lòng nhập Hình thức (Bằng khen, Giấy khen, CSTT...)');
    }

    if (!description || description.trim() === '') {
      errors.push('Vui lòng nhập Nội dung/Lý do');
    }

    if (!year) {
      errors.push('Vui lòng nhập Năm');
    } else {
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
        errors.push(`Năm không hợp lệ (phải từ 1900 đến ${new Date().getFullYear() + 1})`);
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

    const award = await prisma.awardsRecord.create({
      data: { 
        userId: targetUserId,
        type,
        category: category.trim(),
        description: description.trim(),
        year: parseInt(year),
        awardedBy: awardedBy?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: AWARDS.CREATE,
      action: 'CREATE',
      resourceType: 'AWARDS_RECORD',
      resourceId: award.id,
      newValue: award,
      result: 'SUCCESS',
    });

    return NextResponse.json(award, { status: 201 });
  } catch (error: any) {
    console.error('Error creating award:', error);
    return NextResponse.json({ error: 'Lỗi khi lưu dữ liệu. Vui lòng kiểm tra lại thông tin.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, AWARDS.VIEW);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { id, ...data } = body;

    const existing = await prisma.awardsRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi' }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const award = await prisma.awardsRecord.update({
      where: { id },
      data,
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: AWARDS.UPDATE,
      action: 'UPDATE',
      resourceType: 'AWARDS_RECORD',
      resourceId: id,
      oldValue: existing,
      newValue: award,
      result: 'SUCCESS',
    });

    return NextResponse.json(award);
  } catch (error: any) {
    console.error('Error updating award:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, AWARDS.VIEW);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const existing = await prisma.awardsRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi' }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.awardsRecord.delete({ where: { id } });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: AWARDS.DELETE,
      action: 'DELETE',
      resourceType: 'AWARDS_RECORD',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
    });

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting award:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
