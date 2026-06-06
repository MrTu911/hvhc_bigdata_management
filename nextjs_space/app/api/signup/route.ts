
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/db';
import { UserRole } from '@prisma/client';
import { checkRateLimit } from '@/lib/security/rate-limiter';

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit public self-registration to prevent mass account creation.
    const rl = await checkRateLimit(getClientIp(request), 'register');
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: `Quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau ${rl.retryAfter ?? 60} giây.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password, name, department, militaryId, rank, phone } = body;

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

    // SECURITY: public self-registration must NEVER honor a client-supplied role
    // (previously `role: 'admin'` in the body created a QUAN_TRI_HE_THONG account).
    // Privileged accounts are created only via the authenticated admin endpoint
    // (/api/admin/rbac/users). Self-signup is always the lowest-privilege role.
    const userRole = UserRole.HOC_VIEN_SINH_VIEN;

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
        // Self-registered accounts start INACTIVE and require admin activation.
        // Login is blocked for non-ACTIVE users (see lib/auth.ts).
        status: 'INACTIVE',
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
      message: 'Đăng ký thành công. Tài khoản cần được quản trị viên kích hoạt trước khi đăng nhập.',
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
