/**
 * POST /api/auth/change-password
 * Đổi mật khẩu tài khoản của chính user đang đăng nhập.
 * Body: { currentPassword: string, newPassword: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.allowed) return auth.response!;

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body không hợp lệ' }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Thiếu mật khẩu hiện tại hoặc mật khẩu mới' }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Mật khẩu mới phải có ít nhất 8 ký tự' }, { status: 400 });
  }

  if (currentPassword === newPassword) {
    return NextResponse.json({ error: 'Mật khẩu mới phải khác mật khẩu hiện tại' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user!.id },
    select: { id: true, password: true },
  });

  if (!user?.password) {
    return NextResponse.json({ error: 'Tài khoản không hỗ trợ đổi mật khẩu (SSO)' }, { status: 400 });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng' }, { status: 400 });
  }

  const hashedNew = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedNew },
  });

  return NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công' });
}
