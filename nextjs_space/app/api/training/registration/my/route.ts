import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/training/registration/my
 * Lấy danh sách học phần đã đăng ký của học viên hiện tại
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tìm học viên tương ứng với user hiện tại
    // Giả sử email của user = email của hocVien
    const hocVien = await prisma.hocVien.findFirst({
      where: { email: session.user.email },
    });

    if (!hocVien) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const semester = searchParams.get('semester');
    const year = searchParams.get('year');

    const where: any = { hocVienId: hocVien.id };
    if (status) where.status = status;

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
            semester: true,
            year: true,
            faculty: {
              select: {
                user: { select: { name: true } },
                academicRank: true,
              },
            },
            room: {
              select: { code: true, name: true, building: true },
            },
          },
        },
        gradeRecords: {
          select: {
            totalScore: true,
            letterGrade: true,
            status: true,
          },
        },
      },
      orderBy: [
        { course: { year: 'desc' } },
        { course: { semester: 'desc' } },
        { registeredAt: 'desc' },
      ],
    });

    // Lọc theo semester/year nếu có
    let filtered = registrations;
    if (semester) {
      filtered = filtered.filter(r => r.course?.semester === semester);
    }
    if (year) {
      filtered = filtered.filter(r => r.course?.year === parseInt(year));
    }

    return NextResponse.json(filtered);
  } catch (error: any) {
    console.error('GET /api/training/registration/my error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations', details: error.message },
      { status: 500 }
    );
  }
}
