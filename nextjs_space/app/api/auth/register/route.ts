
/**
 * API: User Registration
 * POST /api/auth/register
 * 
 * Đăng ký người dùng mới (alias của /api/signup)
 */

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/db';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      confirmPassword,
      name,
      role,
      department,
      militaryId,
      rank,
      phone,
      unit,
      dateOfBirth,
      gender,
      address,
    } = body;

    // 1. Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // 2. Validate password match
    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // 3. Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // 4. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // 5. Check militaryId uniqueness if provided
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

    // 6. Hash password
    const hashedPassword = await hash(password, 10);

    // 7. Map role string to UserRole enum
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

    // 8. Create user
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
        unit,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        address,
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
        phone: true,
        createdAt: true,
      },
    });

    // 9. Log registration event
    await prisma.systemLog.create({
      data: {
        userId: user.id,
        level: 'INFO',
        category: 'AUTH',
        action: 'USER_REGISTRATION',
        description: `New user registered: ${user.email}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User registered successfully',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
