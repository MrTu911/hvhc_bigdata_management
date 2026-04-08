
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/db';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, department, militaryId, rank, phone } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 400 }
      );
    }

    // Check militaryId uniqueness if provided
    if (militaryId) {
      const existingMilitaryId = await prisma.user.findUnique({
        where: { militaryId },
      });

      if (existingMilitaryId) {
        return NextResponse.json(
          { success: false, error: 'Military ID already exists' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Map role string to UserRole enum
    const roleMap: Record<string, UserRole> = {
      'admin': UserRole.QUAN_TRI_HE_THONG,
      'ADMIN': UserRole.QUAN_TRI_HE_THONG,
      'QUAN_TRI_HE_THONG': UserRole.QUAN_TRI_HE_THONG,
      'teacher': UserRole.GIANG_VIEN,
      'instructor': UserRole.GIANG_VIEN,
      'GIANG_VIEN': UserRole.GIANG_VIEN,
      'student': UserRole.HOC_VIEN_SINH_VIEN,
      'HOC_VIEN': UserRole.HOC_VIEN_SINH_VIEN,
      'HOC_VIEN_SINH_VIEN': UserRole.HOC_VIEN_SINH_VIEN,
      'researcher': UserRole.NGHIEN_CUU_VIEN,
      'NGHIEN_CUU_VIEN': UserRole.NGHIEN_CUU_VIEN,
      'CHI_HUY_HOC_VIEN': UserRole.CHI_HUY_HOC_VIEN,
      'CHI_HUY_KHOA_PHONG': UserRole.CHI_HUY_KHOA_PHONG,
      'CHU_NHIEM_BO_MON': UserRole.CHU_NHIEM_BO_MON,
      'KY_THUAT_VIEN': UserRole.KY_THUAT_VIEN,
    };

    const userRole = role ? roleMap[role] || UserRole.HOC_VIEN_SINH_VIEN : UserRole.HOC_VIEN_SINH_VIEN;

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: userRole,
        department,
        militaryId,
        rank,
        phone,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        department: true,
        militaryId: true,
        rank: true,
        createdAt: true,
      },
    });

    // Log signup event
    await prisma.systemLog.create({
      data: {
        userId: user.id,
        level: 'INFO',
        category: 'AUTH',
        action: 'USER_SIGNUP',
        description: `New user registered: ${user.email}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
