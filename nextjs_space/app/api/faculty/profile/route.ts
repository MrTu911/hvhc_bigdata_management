/**
 * API: Faculty Profile
 * RBAC v8.8: Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction, requireAuth } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET: Lấy faculty profile của user hiện tại
export async function GET(req: NextRequest) {
  try {
    // RBAC: Chỉ cần đăng nhập để xem profile của mình
    const authResult = await requireAuth(req);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    // Lấy user info
    const currentUser = await prisma.user.findUnique({
      where: { id: user!.id },
      include: {
        facultyProfile: {
          include: {
            unit: true
          }
        }
      }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: currentUser, profile: currentUser.facultyProfile });
  } catch (error: any) {
    console.error('Error fetching faculty profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Cập nhật faculty profile
export async function PUT(req: NextRequest) {
  try {
    // RBAC: Chỉ cần đăng nhập để cập nhật profile của mình
    const authResult = await requireAuth(req);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const currentUser = await prisma.user.findUnique({
      where: { id: user!.id }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      departmentId,
      academicRank,
      academicDegree,
      specialization,
      teachingSubjects,
      researchInterests,
      researchProjects,
      publications,
      citations,
      teachingExperience,
      industryExperience,
      biography,
      achievements,
      certifications,
      linkedinUrl,
      googleScholarUrl,
      researchGateUrl,
      orcidId,
      isPublic
    } = body;

    // Upsert profile
    const profile = await prisma.facultyProfile.upsert({
      where: { userId: currentUser.id },
      update: {
        departmentId,
        academicRank,
        academicDegree,
        specialization,
        teachingSubjects,
        researchInterests,
        researchProjects: researchProjects || 0,
        publications: publications || 0,
        citations: citations || 0,
        teachingExperience: teachingExperience || 0,
        industryExperience: industryExperience || 0,
        biography,
        achievements,
        certifications,
        linkedinUrl,
        googleScholarUrl,
        researchGateUrl,
        orcidId,
        isPublic: isPublic || false,
        updatedAt: new Date()
      },
      create: {
        userId: currentUser.id,
        departmentId,
        academicRank,
        academicDegree,
        specialization,
        teachingSubjects,
        researchInterests,
        researchProjects: researchProjects || 0,
        publications: publications || 0,
        citations: citations || 0,
        teachingExperience: teachingExperience || 0,
        industryExperience: industryExperience || 0,
        biography,
        achievements,
        certifications,
        linkedinUrl,
        googleScholarUrl,
        researchGateUrl,
        orcidId,
        isPublic: isPublic || false
      },
      include: {
        unit: true
      }
    });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: FACULTY.UPDATE,
      action: 'UPDATE',
      resourceType: 'FACULTY_PROFILE',
      resourceId: profile.id,
      newValue: profile,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error('Error updating faculty profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Tạo faculty profile mới
export async function POST(req: NextRequest) {
  try {
    // RBAC: Chỉ cần đăng nhập để tạo profile của mình
    const authResult = await requireAuth(req);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const currentUser = await prisma.user.findUnique({
      where: { id: user!.id },
      include: { facultyProfile: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (currentUser.facultyProfile) {
      return NextResponse.json(
        { error: 'Faculty profile already exists. Use PUT to update.' }, 
        { status: 400 }
      );
    }

    const body = await req.json();

    const profile = await prisma.facultyProfile.create({
      data: {
        userId: currentUser.id,
        ...body
      },
      include: {
        unit: true
      }
    });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: FACULTY.CREATE,
      action: 'CREATE',
      resourceType: 'FACULTY_PROFILE',
      resourceId: profile.id,
      newValue: profile,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, profile }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating faculty profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Xóa faculty profile (chỉ admin)
export async function DELETE(req: NextRequest) {
  try {
    // RBAC: Yêu cầu quyền xóa giảng viên
    const authResult = await requireFunction(req, FACULTY.DELETE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get('id');

    if (!facultyId) {
      return NextResponse.json(
        { error: 'Faculty ID is required' },
        { status: 400 }
      );
    }

    // Get old value for audit
    const oldProfile = await prisma.facultyProfile.findUnique({
      where: { id: facultyId }
    });

    // Delete faculty profile (cascade will delete related subjects and projects)
    await prisma.facultyProfile.delete({
      where: { id: facultyId }
    });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: FACULTY.DELETE,
      action: 'DELETE',
      resourceType: 'FACULTY_PROFILE',
      resourceId: facultyId,
      oldValue: oldProfile,
      result: 'SUCCESS',
    });

    return NextResponse.json({ 
      success: true,
      message: 'Faculty profile deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting faculty profile:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
