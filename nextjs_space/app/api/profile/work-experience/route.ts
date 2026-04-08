/**
 * API: /api/profile/work-experience
 * CRUD cho quá trình công tác của người dùng hiện tại
 */

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/rbac/middleware';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { organization, position, startDate, endDate, description } = body;

    if (!organization || !position) {
      return NextResponse.json({ error: 'Vui lòng nhập đơn vị và chức vụ' }, { status: 400 });
    }

    const workExp = await prisma.workExperience.create({
      data: {
        userId: user.id,
        organization,
        position,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : undefined,
        description: description || null,
      }
    });

    return NextResponse.json({ success: true, data: workExp });
  } catch (error: any) {
    console.error('[Work Experience POST]', error);
    return NextResponse.json({ error: 'Lỗi: ' + error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { id, organization, position, startDate, endDate, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID' }, { status: 400 });
    }

    // Kiểm tra quyền sở hữu
    const existing = await prisma.workExperience.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy hoặc không có quyền' }, { status: 404 });
    }

    const updated = await prisma.workExperience.update({
      where: { id },
      data: {
        organization: organization || existing.organization,
        position: position || existing.position,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate ? new Date(endDate) : existing.endDate,
        description: description !== undefined ? description : existing.description,
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('[Work Experience PUT]', error);
    return NextResponse.json({ error: 'Lỗi: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID' }, { status: 400 });
    }

    // Kiểm tra quyền sở hữu
    const existing = await prisma.workExperience.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy hoặc không có quyền' }, { status: 404 });
    }

    await prisma.workExperience.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Work Experience DELETE]', error);
    return NextResponse.json({ error: 'Lỗi: ' + error.message }, { status: 500 });
  }
}
