import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import prisma from '@/lib/db';

/**
 * API: Quản lý Quá trình đào tạo (Education History)
 * GET: Lấy danh sách
 * POST: Tạo mới
 * PUT: Cập nhật
 * DELETE: Xóa
 */

// Các trình độ học vấn hợp lệ
const VALID_EDUCATION_LEVELS = ['DAI_HOC', 'THAC_SI', 'TIEN_SI', 'CU_NHAN_NGOAI_NGU', 'KHAC'];

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, EDUCATION.VIEW_TERM);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || user.id;

    const education = await prisma.educationHistory.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json(education);
  } catch (error: any) {
    console.error('Error fetching education history:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, EDUCATION.VIEW_TERM);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { userId, level, institution, trainingSystem, major, startDate, endDate, thesisTitle, supervisor, certificateCode, certificateDate, notes } = body;

    // Validation - Kiểm tra các trường bắt buộc
    const errors: string[] = [];
    
    if (!level) {
      errors.push('Vui lòng chọn Trình độ đào tạo');
    } else if (!VALID_EDUCATION_LEVELS.includes(level)) {
      errors.push('Trình độ đào tạo không hợp lệ. Vui lòng chọn: Đại học, Thạc sĩ, Tiến sĩ, Cử nhân ngoại ngữ, hoặc Khác');
    }
    
    if (!institution || institution.trim() === '') {
      errors.push('Vui lòng nhập Cơ sở đào tạo');
    }

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        errors.push('Ngày bắt đầu không thể sau ngày kết thúc');
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        error: errors.join('. '),
        validationErrors: errors 
      }, { status: 400 });
    }

    // Sử dụng user.id nếu không truyền userId
    const targetUserId = userId || user.id;

    // Kiểm tra quyền: chỉ được tạo cho chính mình
    if (targetUserId !== user.id) {
      return NextResponse.json({ error: 'Bạn không có quyền thêm dữ liệu cho người dùng khác' }, { status: 403 });
    }

    const education = await prisma.educationHistory.create({
      data: {
        userId: targetUserId,
        level,
        institution: institution.trim(),
        trainingSystem: trainingSystem?.trim() || null,
        major: major?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        thesisTitle: thesisTitle?.trim() || null,
        supervisor: supervisor?.trim() || null,
        certificateCode: certificateCode?.trim() || null,
        certificateDate: certificateDate ? new Date(certificateDate) : null,
        notes: notes?.trim() || null,
      },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: EDUCATION.CREATE_CURRICULUM,
      action: 'CREATE',
      resourceType: 'EDUCATION_HISTORY',
      resourceId: education.id,
      newValue: education,
      result: 'SUCCESS',
    });

    return NextResponse.json(education, { status: 201 });
  } catch (error: any) {
    console.error('Error creating education history:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lưu dữ liệu. Vui lòng kiểm tra lại thông tin nhập vào.', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, EDUCATION.VIEW_TERM);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { id, level, institution, trainingSystem, major, startDate, endDate, thesisTitle, supervisor, certificateCode, certificateDate, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID bản ghi cần cập nhật' }, { status: 400 });
    }

    // Validation
    const errors: string[] = [];
    
    if (!level) {
      errors.push('Vui lòng chọn Trình độ đào tạo');
    } else if (!VALID_EDUCATION_LEVELS.includes(level)) {
      errors.push('Trình độ đào tạo không hợp lệ');
    }
    
    if (!institution || institution.trim() === '') {
      errors.push('Vui lòng nhập Cơ sở đào tạo');
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        errors.push('Ngày bắt đầu không thể sau ngày kết thúc');
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        error: errors.join('. '),
        validationErrors: errors 
      }, { status: 400 });
    }

    // Kiểm tra ownership
    const existing = await prisma.educationHistory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi cần cập nhật' }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Bạn không có quyền chỉnh sửa bản ghi này' }, { status: 403 });
    }

    const education = await prisma.educationHistory.update({
      where: { id },
      data: {
        level,
        institution: institution.trim(),
        trainingSystem: trainingSystem?.trim() || null,
        major: major?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        thesisTitle: thesisTitle?.trim() || null,
        supervisor: supervisor?.trim() || null,
        certificateCode: certificateCode?.trim() || null,
        certificateDate: certificateDate ? new Date(certificateDate) : null,
        notes: notes?.trim() || null,
      },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: EDUCATION.UPDATE_CURRICULUM,
      action: 'UPDATE',
      resourceType: 'EDUCATION_HISTORY',
      resourceId: id,
      oldValue: existing,
      newValue: education,
      result: 'SUCCESS',
    });

    return NextResponse.json(education);
  } catch (error: any) {
    console.error('Error updating education history:', error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật dữ liệu. Vui lòng thử lại.', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, EDUCATION.VIEW_TERM);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // Kiểm tra ownership
    const existing = await prisma.educationHistory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi' }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.educationHistory.delete({ where: { id } });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: EDUCATION.DELETE_CURRICULUM,
      action: 'DELETE',
      resourceType: 'EDUCATION_HISTORY',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
    });

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting education history:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
