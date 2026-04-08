import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { QUESTION_BANK } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET - Lấy danh sách ngân hàng câu hỏi
export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, QUESTION_BANK.VIEW);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const subjectCode = searchParams.get('subjectCode');
    const unitId = searchParams.get('unitId');
    const includeQuestions = searchParams.get('includeQuestions') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { isActive: true };
    if (subjectCode) where.subjectCode = { contains: subjectCode, mode: 'insensitive' };
    if (unitId) where.unitId = unitId;

    const [banks, total] = await Promise.all([
      prisma.questionBank.findMany({
        where,
        include: {
          unit: { select: { code: true, name: true } },
          questions: includeQuestions ? {
            where: { isActive: true },
            orderBy: { code: 'asc' },
            take: 100
          } : { select: { id: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.questionBank.count({ where })
    ]);

    // Add question count
    const banksWithCount = banks.map(bank => ({
      ...bank,
      questionCount: bank.questions.length
    }));

    await logAudit({
      userId: authResult.user!.id,
      functionCode: QUESTION_BANK.VIEW,
      action: 'VIEW',
      resourceType: 'QUESTION_BANK',
      result: 'SUCCESS'
    });

    return NextResponse.json({
      data: banksWithCount,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching question banks:', error);
    return NextResponse.json({ error: 'Lỗi khi tải danh sách ngân hàng câu hỏi' }, { status: 500 });
  }
}

// POST - Tạo ngân hàng câu hỏi mới
export async function POST(req: NextRequest) {
  const authResult = await requireFunction(req, QUESTION_BANK.CREATE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { code, name, subjectCode, subjectName, unitId, description, isPublic } = body;

    if (!code || !name || !subjectCode || !subjectName) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    const existing = await prisma.questionBank.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'Mã ngân hàng câu hỏi đã tồn tại' }, { status: 400 });
    }

    const bank = await prisma.questionBank.create({
      data: {
        code,
        name,
        subjectCode,
        subjectName,
        unitId,
        description,
        isPublic: isPublic || false,
        createdBy: authResult.user!.id
      },
      include: { unit: { select: { code: true, name: true } } }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: QUESTION_BANK.CREATE,
      action: 'CREATE',
      resourceType: 'QUESTION_BANK',
      resourceId: bank.id,
      newValue: bank,
      result: 'SUCCESS'
    });

    return NextResponse.json({ data: bank, message: 'Tạo ngân hàng câu hỏi thành công' }, { status: 201 });
  } catch (error) {
    console.error('Error creating question bank:', error);
    return NextResponse.json({ error: 'Lỗi khi tạo ngân hàng câu hỏi' }, { status: 500 });
  }
}

// PUT - Cập nhật ngân hàng câu hỏi
export async function PUT(req: NextRequest) {
  const authResult = await requireFunction(req, QUESTION_BANK.UPDATE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID ngân hàng câu hỏi' }, { status: 400 });
    }

    const existing = await prisma.questionBank.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy ngân hàng câu hỏi' }, { status: 404 });
    }

    const bank = await prisma.questionBank.update({
      where: { id },
      data: updateData,
      include: { unit: { select: { code: true, name: true } } }
    });

    // Update totalQuestions count
    const questionCount = await prisma.question.count({ where: { questionBankId: id, isActive: true } });
    await prisma.questionBank.update({
      where: { id },
      data: { totalQuestions: questionCount }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: QUESTION_BANK.UPDATE,
      action: 'UPDATE',
      resourceType: 'QUESTION_BANK',
      resourceId: id,
      oldValue: existing,
      newValue: bank,
      result: 'SUCCESS'
    });

    return NextResponse.json({ data: bank, message: 'Cập nhật ngân hàng câu hỏi thành công' });
  } catch (error) {
    console.error('Error updating question bank:', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật ngân hàng câu hỏi' }, { status: 500 });
  }
}

// DELETE - Xóa ngân hàng câu hỏi
export async function DELETE(req: NextRequest) {
  const authResult = await requireFunction(req, QUESTION_BANK.DELETE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID ngân hàng câu hỏi' }, { status: 400 });
    }

    const existing = await prisma.questionBank.findUnique({
      where: { id },
      include: { questions: { select: { id: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy ngân hàng câu hỏi' }, { status: 404 });
    }

    // Soft delete - just mark as inactive
    await prisma.questionBank.update({
      where: { id },
      data: { isActive: false }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: QUESTION_BANK.DELETE,
      action: 'DELETE',
      resourceType: 'QUESTION_BANK',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS'
    });

    return NextResponse.json({ message: 'Xóa ngân hàng câu hỏi thành công' });
  } catch (error) {
    console.error('Error deleting question bank:', error);
    return NextResponse.json({ error: 'Lỗi khi xóa ngân hàng câu hỏi' }, { status: 500 });
  }
}
