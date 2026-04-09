/**
 * API: Faculty My Students
 * RBAC v8.8: Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { getAdviseesByFaculty } from '@/lib/services/faculty/my-students.service';

// GET /api/faculty/my-students - Lấy danh sách học viên hướng dẫn
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, FACULTY.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const { user } = authResult;

    const currentUser = await prisma.user.findUnique({
      where: { id: user!.id },
      include: { facultyProfile: true },
    });

    if (!currentUser?.facultyProfile) {
      return NextResponse.json(
        { success: false, error: 'Faculty profile not found' },
        { status: 404 }
      );
    }

    const { students, statistics, distribution } = await getAdviseesByFaculty(
      currentUser.facultyProfile.id
    );

    await logAudit({
      userId: user!.id,
      functionCode: FACULTY.VIEW,
      action: 'VIEW',
      resourceType: 'MY_STUDENTS',
      resourceId: currentUser.facultyProfile.id,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, students, statistics, distribution });
  } catch (error) {
    console.error('Error fetching my students:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch students',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
