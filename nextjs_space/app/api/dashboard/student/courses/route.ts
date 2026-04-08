import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { DASHBOARD } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authorization using Function-based RBAC
    const authResult = await requireFunction(request, DASHBOARD.VIEW_STUDENT);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    // Get current user
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        id: true, 
        email: true
      }
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get student profile with academic results
    const student = await prisma.hocVien.findFirst({
      where: { 
        email: userData.email
      },
      include: {
        ketQuaHocTap: true
      }
    });

    if (!student) {
      return NextResponse.json({ courses: [] });
    }

    // Group results by subject
    const courseMap = new Map<string, any>();
    
    student.ketQuaHocTap.forEach(result => {
      const subjectCode = result.maMon || result.monHoc;
      if (!courseMap.has(subjectCode)) {
        courseMap.set(subjectCode, {
          id: result.id,
          code: subjectCode,
          name: result.monHoc,
          instructor: 'Giảng viên',
          credits: 3,
          schedule: `${result.hocKy || 'HK1'} - ${result.namHoc || '2024-2025'}`,
          progress: result.diemTongKet ? 100 : Math.floor(Math.random() * 40 + 40),
          grade: result.diemTongKet,
          status: result.diemTongKet ? 'COMPLETED' : 'ACTIVE'
        });
      }
    });

    const courses = Array.from(courseMap.values());

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
