/**
 * M18 Template API – E1: GET schedules list, E2: POST create schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import prisma from '@/lib/db';
import { z } from 'zod';

const createScheduleSchema = z.object({
  templateId: z.string().uuid(),
  filterJson: z.record(z.unknown()).optional().default({}),
  cronExpression: z.string().min(5).max(100),
  outputFormat: z.enum(['PDF', 'DOCX', 'XLSX']),
  recipientEmails: z.array(z.string().email()).optional().default([]),
  zipName: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.MANAGE);
    if (!user) return response!;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    const [schedules, total] = await Promise.all([
      prisma.templateSchedule.findMany({
        where,
        select: {
          id: true,
          templateId: true,
          template: { select: { name: true, code: true } },
          cronExpression: true,
          outputFormat: true,
          recipientEmails: true,
          zipName: true,
          isActive: true,
          lastRunAt: true,
          lastRunStatus: true,
          nextRunAt: true,
          createdAt: true,
          createdBy: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.templateSchedule.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: schedules,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET /api/templates/schedules]', error);
    return NextResponse.json({ error: 'Lỗi lấy danh sách lịch xuất' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.MANAGE);
    if (!user) return response!;

    const body = await request.json();
    const validated = createScheduleSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    // Check template exists
    const template = await prisma.reportTemplate.findUnique({
      where: { id: validated.data.templateId },
      select: { id: true, name: true, isActive: true },
    });
    if (!template) {
      return NextResponse.json({ error: 'Template không tồn tại' }, { status: 404 });
    }
    if (!template.isActive) {
      return NextResponse.json({ error: 'Template đã bị vô hiệu hóa' }, { status: 400 });
    }

    // Validate cron expression (basic)
    const cronParts = validated.data.cronExpression.trim().split(/\s+/);
    if (cronParts.length !== 5 && cronParts.length !== 6) {
      return NextResponse.json(
        { error: 'Cron expression không hợp lệ – cần 5 hoặc 6 phần (phút giờ ngày tháng thứ [năm])' },
        { status: 400 }
      );
    }

    const schedule = await prisma.templateSchedule.create({
      data: {
        templateId: validated.data.templateId,
        filterJson: validated.data.filterJson as object,
        cronExpression: validated.data.cronExpression,
        outputFormat: validated.data.outputFormat,
        recipientEmails: validated.data.recipientEmails,
        zipName: validated.data.zipName,
        createdBy: user.id,
        isActive: true,
      },
      select: {
        id: true,
        templateId: true,
        template: { select: { name: true } },
        cronExpression: true,
        outputFormat: true,
        recipientEmails: true,
        nextRunAt: true,
        createdAt: true,
      },
    });

    await logAudit({
      userId: user.id,
      functionCode: TEMPLATES.MANAGE,
      action: 'CREATE',
      resourceType: 'TEMPLATE_SCHEDULE',
      resourceId: schedule.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ success: true, data: schedule }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi tạo lịch xuất';
    console.error('[POST /api/templates/schedules]', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
