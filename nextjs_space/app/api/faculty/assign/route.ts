/**
 * API: Chỉ định cán bộ làm giảng viên
 * POST /api/faculty/assign
 *
 * Hỗ trợ 2 nhánh:
 *   1. Cán bộ nội bộ: chọn từ User có sẵn (body.userId)
 *   2. Thỉnh giảng ngoài HV: tạo User phantom (body.isExternalGuest = true)
 *
 * RBAC: FACULTY.CREATE — phòng đào tạo / ban quản lý nhân sự
 */

import { NextRequest, NextResponse } from 'next/server';
import { createId } from '@paralleldrive/cuid2';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildProfileData(body: Record<string, unknown>, userId: string) {
  return {
    userId,
    unitId: (body.unitId as string) || null,
    academicRank: (body.academicRank as string) || null,
    academicDegree: (body.academicDegree as string) || null,
    specialization: (body.specialization as string) || null,
    teachingExperience: parseInt(String(body.teachingExperience ?? 0)) || 0,
    teachingPosition: (body.teachingPosition as string) || null,
    weeklyHoursLimit: body.weeklyHoursLimit ? parseFloat(String(body.weeklyHoursLimit)) : 16,
    teachingStart: body.teachingStart ? new Date(body.teachingStart as string) : null,
    homeInstitution: (body.homeInstitution as string) || null,
    contractEndDate: body.contractEndDate ? new Date(body.contractEndDate as string) : null,
    isActive: true,
    isPublic: false,
  };
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, FACULTY.CREATE);
    if (!authResult.allowed) return authResult.response!;
    const { user } = authResult;

    const body = await req.json();
    const { isExternalGuest } = body;

    // ── Nhánh 1: Thỉnh giảng ngoài HV (tạo User phantom) ──────────────────────
    if (isExternalGuest) {
      const { externalName, externalEmail, externalPhone, homeInstitution } = body;

      if (!externalName?.trim()) {
        return NextResponse.json({ error: 'Họ tên giảng viên là bắt buộc' }, { status: 400 });
      }
      if (!homeInstitution?.trim()) {
        return NextResponse.json({ error: 'Đơn vị công tác gốc là bắt buộc' }, { status: 400 });
      }

      // Nếu cung cấp email thật — kiểm tra trùng
      if (externalEmail?.trim()) {
        const existing = await prisma.user.findUnique({ where: { email: externalEmail.trim() } });
        if (existing) {
          return NextResponse.json(
            { error: `Email ${externalEmail} đã tồn tại trong hệ thống` },
            { status: 409 }
          );
        }
      }

      // Tạo phantom email duy nhất (không thể đăng nhập)
      const phantomId = createId();
      const phantomEmail = externalEmail?.trim() || `phantom-${phantomId}@external.hvhc.local`;
      const phantomPassword = await bcrypt.hash(createId() + createId(), 10);

      // Tạo User phantom + FacultyProfile trong transaction
      const result = await prisma.$transaction(async (tx) => {
        const phantomUser = await tx.user.create({
          data: {
            email: phantomEmail,
            name: externalName.trim(),
            password: phantomPassword,
            role: 'GIANG_VIEN',
            status: 'ACTIVE',
            ...(externalPhone?.trim() && { phone: externalPhone.trim() }),
          },
        });

        const profile = await tx.facultyProfile.create({
          data: buildProfileData(body, phantomUser.id),
          include: {
            user: { select: { id: true, name: true, email: true, militaryId: true } },
            unit: { select: { id: true, name: true } },
          },
        });

        return { phantomUser, profile };
      });

      await logAudit({
        userId: user!.id,
        functionCode: FACULTY.CREATE,
        action: 'CREATE',
        resourceType: 'FACULTY_PROFILE',
        resourceId: result.profile.id,
        newValue: {
          profileId: result.profile.id,
          phantomUserId: result.phantomUser.id,
          isExternalGuest: true,
          homeInstitution,
          assignedBy: user!.id,
        },
        result: 'SUCCESS',
      });

      return NextResponse.json(
        { success: true, profile: result.profile, isExternalGuest: true },
        { status: 201 }
      );
    }

    // ── Nhánh 2: Cán bộ nội bộ (chọn User có sẵn) ────────────────────────────
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId hoặc isExternalGuest là bắt buộc' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, militaryId: true, facultyProfile: { select: { id: true } } },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Không tìm thấy cán bộ' }, { status: 404 });
    }

    if (targetUser.facultyProfile) {
      return NextResponse.json(
        { error: 'Cán bộ này đã có hồ sơ giảng viên', facultyProfileId: targetUser.facultyProfile.id },
        { status: 409 }
      );
    }

    const profile = await prisma.facultyProfile.create({
      data: buildProfileData(body, userId),
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

  } catch (error: unknown) {
    console.error('[Faculty Assign] Error:', error);
    const msg = error instanceof Error ? error.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── GET: Tìm cán bộ nội bộ chưa có hồ sơ GV ────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, FACULTY.CREATE);
    if (!authResult.allowed) return authResult.response!;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    const staff = await prisma.user.findMany({
      where: {
        facultyProfile: null,
        status: 'ACTIVE',
        // Loại trừ học viên và phantom users
        role: { notIn: ['HOC_VIEN', 'HOC_VIEN_SINH_VIEN'] },
        // Loại trừ phantom users (email pattern nội bộ)
        NOT: { email: { endsWith: '@external.hvhc.local' } },
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { militaryId: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      select: {
        id: true, name: true, email: true,
        militaryId: true, rank: true, role: true,
        personnelType: true, unitId: true,
        unitRelation: { select: { id: true, name: true } },
      },
      orderBy: [{ name: 'asc' }],
      take: limit,
    });

    const normalized = staff.map(({ unitRelation, ...rest }) => ({
      ...rest,
      unit: unitRelation ?? null,
    }));

    return NextResponse.json({ success: true, staff: normalized });
  } catch (error: unknown) {
    console.error('[Faculty Assign GET] Error:', error);
    const msg = error instanceof Error ? error.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
