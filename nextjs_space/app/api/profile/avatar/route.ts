/**
 * API: /api/profile/avatar
 * Upload and update profile photo (3x4 portrait).
 * Stores image in public/uploads/avatars/ and updates user.avatar field.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/rbac/middleware';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.allowed) return authResult.response!;
    const user = authResult.user!;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Không có file' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Chỉ chấp nhận ảnh JPG, PNG, WebP' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Kích thước ảnh tối đa 5MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Unique filename: avatar_{userId}_{timestamp}.ext
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const filename = `avatar_${user.id}_${Date.now()}.${ext}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await writeFile(path.join(uploadDir, filename), buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: avatarUrl },
    });

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error: any) {
    console.error('[Profile/avatar POST]', error);
    return NextResponse.json({ error: 'Lỗi upload ảnh: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.allowed) return authResult.response!;
    const user = authResult.user!;

    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: null },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Profile/avatar DELETE]', error);
    return NextResponse.json({ error: 'Lỗi xóa ảnh' }, { status: 500 });
  }
}
