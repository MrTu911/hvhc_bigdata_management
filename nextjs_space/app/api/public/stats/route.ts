/**
 * API: Public Statistics (D3.1-D3.4)
 * GET /api/public/stats
 * Dynamic stats từ database cho trang chủ - không cần auth
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache 60s

export async function GET(request: NextRequest) {
  try {
    // Query all stats in parallel for performance
    const [
      totalUsers,
      totalUnits,
      totalDepartments,
      totalCourses,
      totalProjects,
      totalStudents,
      activeUsers,
      totalFaculty,
      totalPartyMembers,
      totalInsurance,
      totalPolicy,
      totalPublications,
      totalPrograms,
      totalRooms
    ] = await Promise.all([
      prisma.user.count(),
      prisma.unit.count(),
      prisma.department.count(),
      prisma.course.count(),
      prisma.researchProject.count(),
      prisma.hocVien.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.facultyProfile.count({ where: { isActive: true } }),
      prisma.partyMember.count(),
      prisma.insuranceInfo.count(),
      prisma.policyRecord.count(),
      prisma.facultyProfile.aggregate({ _sum: { publications: true } }),
      prisma.program.count(),
      prisma.room.count()
    ]);

    // Tính số CSDL (miền nghiệp vụ)
    const totalDatabases = 8; // 8 miền: Quân nhân, Đảng viên, Thi đua KT, Chính sách, Bảo hiểm XH, Giảng viên, Học viên, Đào tạo-Huấn luyện

    // Stats response cho hero section
    return NextResponse.json({
      success: true,
      data: {
        totalPersonnel: totalUsers,
        totalUnits: totalUnits + totalDepartments,
        totalDatabases: totalDatabases,
        totalCourses: totalCourses,
        totalProjects: totalProjects,
        totalStudents: totalStudents,
        activeUsers: activeUsers,
        totalFaculty: totalFaculty,
        totalPartyMembers: totalPartyMembers,
        totalInsurance: totalInsurance,
        totalPolicy: totalPolicy,
        totalPublications: totalPublications._sum.publications || 0,
        totalPrograms: totalPrograms,
        totalRooms: totalRooms,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    // Return default values on error
    return NextResponse.json({
      success: true,
      data: {
        totalPersonnel: 287,
        totalUnits: 50,
        totalDatabases: 8,
        totalCourses: 128,
        totalProjects: 78,
        totalStudents: 200,
        activeUsers: 287,
        totalFaculty: 50,
        totalPartyMembers: 251,
        totalInsurance: 287,
        totalPolicy: 287,
        totalPublications: 94,
        totalPrograms: 8,
        totalRooms: 14,
        lastUpdated: new Date().toISOString()
      }
    });
  }
}
