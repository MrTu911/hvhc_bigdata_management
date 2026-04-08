/**
 * API: Chỉ định cán bộ làm giảng viên
 * POST /api/faculty/assign
 *
 * Nghiệp vụ:
 *   - Giảng viên KHÔNG tạo mới — chọn từ danh sách cán bộ (User) hiện có
 *   - Tạo FacultyProfile liên kết với User đó
 *   - Nếu User đã có FacultyProfile → trả lỗi (dùng PATCH /api/faculty/[id] để cập nhật)
 *
 * RBAC: FACULTY.CREATE — phòng đào tạo / ban quản lý nhân sự
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, FACULTY.CREATE);
    if (!authResult.allowed) return authResult.response!;
    const { user } = authResult;

    const body = await req.json();
    const {
      userId,           // ID của User (cán bộ) sẽ được chỉ định làm giảng viên
      unitId,           // Khoa/bộ môn phụ trách
      academicRank,
      academicDegree,
      specialization,
      teachingExperience,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId là bắt buộc' }, { status: 400 });
    }

    // Kiểm tra User tồn tại
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, militaryId: true, facultyProfile: { select: { id: true } } },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Không tìm thấy cán bộ' }, { status: 404 });
    }

    if (targetUser.facultyProfile) {
      return NextResponse.json(
        {
          error: 'Cán bộ này đã có hồ sơ giảng viên',
          facultyProfileId: targetUser.facultyProfile.id,
        },
        { status: 409 }
      );
    }

    // Tạo FacultyProfile
    const profile = await prisma.facultyProfile.create({
      data: {
        userId,
        unitId: unitId || null,
        academicRank: academicRank || null,
        academicDegree: academicDegree || null,
        specialization: specialization || null,
        teachingExperience: teachingExperience || 0,
        isActive: true,
        isPublic: false,
      },
      include: {
        user: { select: { id: true, name: true, email: true, militaryId: true } },
        unit: { select: { id: true, name: true } },
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: FACULTY.CREATE,
      action: 'CREATE',
      resourceType: 'FACULTY_PROFILE',
      resourceId: profile.id,
      newValue: { ...profile, assignedBy: user!.id },
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, profile }, { status: 201 });
  } catch (error: any) {
    console.error('[Faculty Assign] Error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}

// GET: Tìm kiếm cán bộ chưa có hồ sơ giảng viên (dùng cho staff picker)
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, FACULTY.CREATE);
    if (!authResult.allowed) return authResult.response!;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const staff = await prisma.user.findMany({
      where: {
        facultyProfile: null, // chỉ cán bộ chưa được chỉ định làm giảng viên
        isActive: true,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { militaryId: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        militaryId: true,
        rank: true,
        unit: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    return NextResponse.json({ success: true, staff });
  } catch (error: any) {
    console.error('[Faculty Assign GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}
