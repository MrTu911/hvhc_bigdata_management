import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { QUESTION_BANK } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET - Lấy danh sách câu hỏi
export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, QUESTION_BANK.VIEW_QUESTION);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const questionBankId = searchParams.get('questionBankId');
    const difficulty = searchParams.get('difficulty');
    const questionType = searchParams.get('questionType');
    const chapter = searchParams.get('chapter');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = { isActive: true };
    if (questionBankId) where.questionBankId = questionBankId;
    if (difficulty) where.difficulty = difficulty;
    if (questionType) where.questionType = questionType;
    if (chapter) where.chapter = chapter;
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { topic: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          questionBank: { select: { code: true, name: true, subjectName: true } }
        },
        orderBy: [{ chapter: 'asc' }, { code: 'asc' }],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.question.count({ where })
    ]);

    // Get difficulty distribution
    const difficultyStats = await prisma.question.groupBy({
      by: ['difficulty'],
      where: { questionBankId: questionBankId || undefined, isActive: true },
      _count: { id: true }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: QUESTION_BANK.VIEW_QUESTION,
      action: 'VIEW',
      resourceType: 'QUESTION',
      result: 'SUCCESS'
    });

    return NextResponse.json({
      data: questions,
      stats: { difficultyStats },
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Lỗi khi tải danh sách câu hỏi' }, { status: 500 });
  }
}

// POST - Tạo câu hỏi mới
export async function POST(req: NextRequest) {
  const authResult = await requireFunction(req, QUESTION_BANK.CREATE_QUESTION);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { questionBankId, code, content, contentType, questionType, options, correctAnswer, explanation, difficulty, points, chapter, topic, learningOutcome, tags } = body;

    if (!questionBankId || !code || !content) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    const bank = await prisma.questionBank.findUnique({ where: { id: questionBankId } });
    if (!bank) {
      return NextResponse.json({ error: 'Không tìm thấy ngân hàng câu hỏi' }, { status: 404 });
    }

    const existing = await prisma.question.findFirst({
      where: { questionBankId, code }
    });
    if (existing) {
      return NextResponse.json({ error: 'Mã câu hỏi đã tồn tại trong ngân hàng này' }, { status: 400 });
    }

    const question = await prisma.question.create({
      data: {
        questionBankId,
        code,
        content,
        contentType: contentType || 'TEXT',
        questionType: questionType || 'MULTIPLE_CHOICE',
        options: options || null,
        correctAnswer,
        explanation,
        difficulty: difficulty || 'MEDIUM',
        points: points || 1,
        chapter,
        topic,
        learningOutcome,
        tags: tags || [],
        status: 'ACTIVE' as const,
        createdBy: authResult.user!.id
      },
      include: { questionBank: { select: { code: true, name: true } } }
    });

    // Update question count in bank
    await prisma.questionBank.update({
      where: { id: questionBankId },
      data: { totalQuestions: { increment: 1 } }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: QUESTION_BANK.CREATE_QUESTION,
      action: 'CREATE',
      resourceType: 'QUESTION',
      resourceId: question.id,
      newValue: question,
      result: 'SUCCESS'
    });

    return NextResponse.json({ data: question, message: 'Tạo câu hỏi thành công' }, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Lỗi khi tạo câu hỏi' }, { status: 500 });
  }
}

// PUT - Cập nhật câu hỏi
export async function PUT(req: NextRequest) {
  const authResult = await requireFunction(req, QUESTION_BANK.UPDATE_QUESTION);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID câu hỏi' }, { status: 400 });
    }

    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 });
    }

    const question = await prisma.question.update({
      where: { id },
      data: updateData,
      include: { questionBank: { select: { code: true, name: true } } }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: QUESTION_BANK.UPDATE_QUESTION,
      action: 'UPDATE',
      resourceType: 'QUESTION',
      resourceId: id,
      oldValue: existing,
      newValue: question,
      result: 'SUCCESS'
    });

    return NextResponse.json({ data: question, message: 'Cập nhật câu hỏi thành công' });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật câu hỏi' }, { status: 500 });
  }
}

// DELETE - Xóa câu hỏi
export async function DELETE(req: NextRequest) {
  const authResult = await requireFunction(req, QUESTION_BANK.DELETE_QUESTION);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID câu hỏi' }, { status: 400 });
    }

    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 });
    }

    // Soft delete
    await prisma.question.update({
      where: { id },
      data: { isActive: false }
    });

    // Update question count in bank
    await prisma.questionBank.update({
      where: { id: existing.questionBankId },
      data: { totalQuestions: { decrement: 1 } }
    });

    await logAudit({
      userId: authResult.user!.id,
      functionCode: QUESTION_BANK.DELETE_QUESTION,
      action: 'DELETE',
      resourceType: 'QUESTION',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS'
    });

    return NextResponse.json({ message: 'Xóa câu hỏi thành công' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Lỗi khi xóa câu hỏi' }, { status: 500 });
  }
}
