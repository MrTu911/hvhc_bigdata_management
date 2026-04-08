/**
 * API: Quản lý Lý lịch khoa học tổng thể
 * @version 8.9: Migrated to function-based RBAC
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { RESEARCH } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

/**
 * GET: Lấy thông tin lý lịch khoa học của user
 * RBAC: RESEARCH.VIEW
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, RESEARCH.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || user!.id;

    // Lấy thông tin user
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        rank: true,
        position: true,
        unit: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Lấy tất cả thông tin lý lịch khoa học
    const [profile, education, workExp, publications, research, awards] = await Promise.all([
      prisma.scientificProfile.findUnique({ where: { userId } }),
      prisma.educationHistory.findMany({ 
        where: { userId },
        orderBy: { startDate: 'desc' }
      }),
      prisma.workExperience.findMany({ 
        where: { userId },
        orderBy: { startDate: 'desc' }
      }),
      prisma.scientificPublication.findMany({ 
        where: { userId },
        orderBy: { year: 'desc' }
      }),
      prisma.scientificResearch.findMany({ 
        where: { userId },
        orderBy: { year: 'desc' }
      }),
      prisma.awardsRecord.findMany({ 
        where: { userId },
        orderBy: { year: 'desc' }
      }),
    ]);

    return NextResponse.json({
      user: userData,
      profile,
      education,
      workExperience: workExp,
      publications,
      research,
      awards,
    });
  } catch (error: any) {
    console.error('Error fetching scientific profile:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST: Tạo hoặc cập nhật summary
 * RBAC: RESEARCH.CREATE
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, RESEARCH.CREATE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { userId, summary, isPublic } = body;

    // Kiểm tra quyền: chỉ được update profile của mình
    if (userId && userId !== user!.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetUserId = userId || user!.id;

    // Upsert scientific profile
    const profile = await prisma.scientificProfile.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        summary,
        isPublic: isPublic || false,
      },
      update: {
        summary,
        isPublic,
        updatedAt: new Date(),
      },
    });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: RESEARCH.UPDATE,
      action: 'UPSERT',
      resourceType: 'SCIENTIFIC_PROFILE',
      resourceId: profile.id,
      newValue: profile,
      result: 'SUCCESS',
    });

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('Error updating scientific profile:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
