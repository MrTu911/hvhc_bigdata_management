/**
 * API: Quản lý Đề tài nghiên cứu (Scientific Research)
 * RBAC v8.8: Migrated to function-based RBAC
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { RESEARCH } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// Validation constants
const VALID_RESEARCH_ROLES = ['CHU_NHIEM', 'THAM_GIA', 'THANH_VIEN'];
const RESEARCH_ROLE_LABELS: Record<string, string> = {
  'CHU_NHIEM': 'Chủ nhiệm',
  'THAM_GIA': 'Tham gia',
  'THANH_VIEN': 'Thành viên',
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

    const research = await prisma.scientificResearch.findMany({
      where: { userId },
      orderBy: { year: 'desc' },
    });

    return NextResponse.json(research);
  } catch (error: any) {
    console.error('Error fetching research:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // RBAC: Chỉ cần đăng nhập
    const authResult = await requireFunction(req, RESEARCH.CREATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { userId, title, year, role, level, type, institution, result, notes } = body;

    // Validation
    const errors: string[] = [];
    
    if (!title || title.trim() === '') {
      errors.push('Vui lòng nhập Tên đề tài/Sáng kiến');
    }
    
    if (!year) {
      errors.push('Vui lòng nhập Năm thực hiện');
    } else {
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
        errors.push(`Năm thực hiện không hợp lệ (phải từ 1900 đến ${new Date().getFullYear() + 1})`);
      }
    }

    if (!role) {
      errors.push('Vui lòng chọn Vai trò');
    } else if (!VALID_RESEARCH_ROLES.includes(role)) {
      errors.push(`Vai trò không hợp lệ. Vui lòng chọn: ${Object.values(RESEARCH_ROLE_LABELS).join(', ')}`);
    }

    if (!level || level.trim() === '') {
      errors.push('Vui lòng nhập Cấp đề tài (Học viện, Bộ, Nhà nước...)');
    }

    if (!type || type.trim() === '') {
      errors.push('Vui lòng nhập Loại hình (Đề tài, Sáng kiến, Nhiệm vụ...)');
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

    const research = await prisma.scientificResearch.create({
      data: { 
        userId: targetUserId,
        title: title.trim(),
        year: parseInt(year),
        role,
        level: level.trim(),
        type: type.trim(),
        institution: institution?.trim() || null,
        result: result?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: RESEARCH.CREATE,
      action: 'CREATE',
      resourceType: 'SCIENTIFIC_RESEARCH',
      resourceId: research.id,
      newValue: research,
      result: 'SUCCESS',
    });

    return NextResponse.json(research, { status: 201 });
  } catch (error: any) {
    console.error('Error creating research:', error);
    return NextResponse.json({ error: 'Lỗi khi lưu dữ liệu. Vui lòng kiểm tra lại thông tin.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // RBAC: Chỉ cần đăng nhập
    const authResult = await requireFunction(req, RESEARCH.UPDATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { id, ...data } = body;

    const existing = await prisma.scientificResearch.findUnique({ where: { id } });
    if (!existing || existing.userId !== user!.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const research = await prisma.scientificResearch.update({
      where: { id },
      data,
    });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: RESEARCH.UPDATE,
      action: 'UPDATE',
      resourceType: 'SCIENTIFIC_RESEARCH',
      resourceId: research.id,
      oldValue: existing,
      newValue: research,
      result: 'SUCCESS',
    });

    return NextResponse.json(research);
  } catch (error: any) {
    console.error('Error updating research:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // RBAC: Chỉ cần đăng nhập
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

    const existing = await prisma.scientificResearch.findUnique({ where: { id } });
    if (!existing || existing.userId !== user!.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.scientificResearch.delete({ where: { id } });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: RESEARCH.DELETE,
      action: 'DELETE',
      resourceType: 'SCIENTIFIC_RESEARCH',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
    });

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting research:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
