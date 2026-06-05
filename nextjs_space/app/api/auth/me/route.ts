import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authResult;

    // Đọc tươi cờ buộc đổi mật khẩu từ DB (tránh stale theo JWT)
    const account = await prisma.user.findUnique({
      where: { id: user!.id },
      select: { mustChangePassword: true },
    });

    return NextResponse.json({
      id: user!.id,
      email: user!.email,
      name: user!.name,
      role: user!.role,
      department: user!.department,
      unitId: user!.unitId,
      mustChangePassword: account?.mustChangePassword ?? false,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
