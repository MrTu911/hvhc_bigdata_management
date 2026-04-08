/**
 * API: Quản lý Công bố khoa học (Publications)
 * @version 8.9: Migrated to function-based RBAC
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { RESEARCH } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// Validation constants
const VALID_PUBLICATION_TYPES = ['GIAO_TRINH', 'TAI_LIEU', 'BAI_TAP', 'BAI_BAO'];
const VALID_PUBLICATION_ROLES = ['CHU_BIEN', 'THAM_GIA', 'DONG_TAC_GIA'];
const PUBLICATION_TYPE_LABELS: Record<string, string> = {
  'GIAO_TRINH': 'Giáo trình',
  'TAI_LIEU': 'Tài liệu',
  'BAI_TAP': 'Bài tập',
  'BAI_BAO': 'Bài báo khoa học',
};
const PUBLICATION_ROLE_LABELS: Record<string, string> = {
  'CHU_BIEN': 'Chủ biên',
  'THAM_GIA': 'Tham gia',
  'DONG_TAC_GIA': 'Đồng tác giả',
};

export async function GET(req: NextRequest) {
  try {
    // RBAC: Chỉ cần đăng nhập
    const authResult = await requireFunction(req, RESEARCH.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || user!.id;
    const type = searchParams.get('type');

    const where: any = { userId };
    if (type) where.type = type;

    const publications = await prisma.scientificPublication.findMany({
      where,
      orderBy: { year: 'desc' },
    });

    return NextResponse.json(publications);
  } catch (error: any) {
    console.error('Error fetching publications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // RBAC: RESEARCH.CREATE
    const authResult = await requireFunction(req, RESEARCH.CREATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { userId, type, title, year, role, publisher, issueNumber, pageNumbers, targetUsers, coAuthors, notes } = body;

    // Validation
    const errors: string[] = [];
    
    if (!type) {
      errors.push('Vui lòng chọn Loại công trình');
    } else if (!VALID_PUBLICATION_TYPES.includes(type)) {
      errors.push(`Loại công trình không hợp lệ. Vui lòng chọn: ${Object.values(PUBLICATION_TYPE_LABELS).join(', ')}`);
    }

    if (!title || title.trim() === '') {
      errors.push('Vui lòng nhập Tên công trình');
    }

    if (!year) {
      errors.push('Vui lòng nhập Năm xuất bản');
    } else {
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
        errors.push(`Năm xuất bản không hợp lệ (phải từ 1900 đến ${new Date().getFullYear() + 1})`);
      }
    }

    if (!role) {
      errors.push('Vui lòng chọn Vai trò tham gia');
    } else if (!VALID_PUBLICATION_ROLES.includes(role)) {
      errors.push(`Vai trò không hợp lệ. Vui lòng chọn: ${Object.values(PUBLICATION_ROLE_LABELS).join(', ')}`);
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        error: errors.join('. '),
        validationErrors: errors 
      }, { status: 400 });
    }

    const targetUserId = userId || user!.id;

    if (targetUserId !== user!.id) {
      return NextResponse.json({ error: 'Bạn không có quyền thêm dữ liệu cho người dùng khác' }, { status: 403 });
    }

    const publication = await prisma.scientificPublication.create({
      data: { 
        userId: targetUserId,
        type,
        title: title.trim(),
        year: parseInt(year),
        role,
        publisher: publisher?.trim() || null,
        issueNumber: issueNumber?.trim() || null,
        pageNumbers: pageNumbers?.trim() || null,
        targetUsers: targetUsers?.trim() || null,
        coAuthors: coAuthors?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: RESEARCH.CREATE,
      action: 'CREATE',
      resourceType: 'SCIENTIFIC_PUBLICATION',
      resourceId: publication.id,
      newValue: publication,
      result: 'SUCCESS',
    });

    return NextResponse.json(publication, { status: 201 });
  } catch (error: any) {
    console.error('Error creating publication:', error);
    return NextResponse.json({ error: 'Lỗi khi lưu dữ liệu. Vui lòng kiểm tra lại thông tin nhập vào.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // RBAC: RESEARCH.UPDATE
    const authResult = await requireFunction(req, RESEARCH.UPDATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { id, ...data } = body;

    const existing = await prisma.scientificPublication.findUnique({ where: { id } });
    if (!existing || existing.userId !== user!.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const publication = await prisma.scientificPublication.update({
      where: { id },
      data,
    });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: RESEARCH.UPDATE,
      action: 'UPDATE',
      resourceType: 'SCIENTIFIC_PUBLICATION',
      resourceId: publication.id,
      oldValue: existing,
      newValue: publication,
      result: 'SUCCESS',
    });

    return NextResponse.json(publication);
  } catch (error: any) {
    console.error('Error updating publication:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // RBAC: RESEARCH.DELETE
    const authResult = await requireFunction(req, RESEARCH.DELETE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const existing = await prisma.scientificPublication.findUnique({ where: { id } });
    if (!existing || existing.userId !== user!.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.scientificPublication.delete({ where: { id } });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: RESEARCH.DELETE,
      action: 'DELETE',
      resourceType: 'SCIENTIFIC_PUBLICATION',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
    });

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting publication:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
