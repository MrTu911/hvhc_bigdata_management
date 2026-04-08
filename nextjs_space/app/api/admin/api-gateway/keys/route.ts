import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import crypto from 'crypto';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';

// Available permissions for external APIs
const AVAILABLE_PERMISSIONS = [
  'read:students',
  'read:faculty',
  'read:courses',
  'read:departments',
  'read:statistics',
  'read:research',
  'write:data',
];

function generateApiKey(): string {
  const prefix = 'hvhc_';
  const key = crypto.randomBytes(32).toString('hex');
  return prefix + key;
}

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// GET - List all API keys
export async function GET(request: NextRequest) {
  try {
    // RBAC: Require MANAGE_API_GATEWAY permission
    const authResult = await requireFunction(request, SYSTEM.MANAGE_API_GATEWAY);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { keyPrefix: { contains: search, mode: 'insensitive' } },
      ];
    }

    const keys = await prisma.externalApiKey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { accessLogs: true }
        }
      }
    });

    // Get today's request count for each key
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const keysWithStats = await Promise.all(keys.map(async (key) => {
      const todayRequests = await prisma.externalApiLog.count({
        where: {
          apiKeyId: key.id,
          createdAt: { gte: today }
        }
      });

      return {
        ...key,
        keyHash: undefined, // Don't expose hash
        todayRequests,
        totalLogs: key._count.accessLogs
      };
    }));

    return NextResponse.json({
      keys: keysWithStats,
      availablePermissions: AVAILABLE_PERMISSIONS
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// POST - Create new API key
export async function POST(request: NextRequest) {
  try {
    // RBAC: Require MANAGE_API_GATEWAY permission
    const authResult = await requireFunction(request, SYSTEM.MANAGE_API_GATEWAY);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { name, description, permissions, ipWhitelist, rateLimit, dailyLimit, expiresAt } = body;

    if (!name || !permissions || permissions.length === 0) {
      return NextResponse.json(
        { error: 'Tên và quyền truy cập là bắt buộc' },
        { status: 400 }
      );
    }

    // Validate permissions
    const invalidPermissions = permissions.filter((p: string) => !AVAILABLE_PERMISSIONS.includes(p));
    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        { error: `Quyền không hợp lệ: ${invalidPermissions.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate new API key
    const plainApiKey = generateApiKey();
    const keyHash = hashApiKey(plainApiKey);
    const keyPrefix = plainApiKey.substring(0, 12) + '...';

    const apiKey = await prisma.externalApiKey.create({
      data: {
        name,
        description,
        keyHash,
        keyPrefix,
        permissions,
        ipWhitelist: ipWhitelist || [],
        rateLimit: rateLimit || 100,
        dailyLimit: dailyLimit || 10000,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: user.id,
      },
    });

    // Log action
    await prisma.systemLog.create({
      data: {
        action: 'CREATE_API_KEY',
        description: `Tạo API key: ${name}`,
        userId: user.id,
        level: 'INFO',
        category: 'SECURITY',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        // Only show plain key once on creation
        plainKey: plainApiKey,
        message: 'Lưu ý: API key chỉ hiển thị một lần duy nhất!'
      }
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// PUT - Update API key
export async function PUT(request: NextRequest) {
  try {
    // RBAC: Require MANAGE_API_GATEWAY permission
    const authResult = await requireFunction(request, SYSTEM.MANAGE_API_GATEWAY);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { id, name, description, permissions, ipWhitelist, rateLimit, dailyLimit, status, expiresAt } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID là bắt buộc' }, { status: 400 });
    }

    const existingKey = await prisma.externalApiKey.findUnique({ where: { id } });
    if (!existingKey) {
      return NextResponse.json({ error: 'Không tìm thấy API key' }, { status: 404 });
    }

    const updatedKey = await prisma.externalApiKey.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(permissions && { permissions }),
        ...(ipWhitelist && { ipWhitelist }),
        ...(rateLimit && { rateLimit }),
        ...(dailyLimit && { dailyLimit }),
        ...(status && { status }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
    });

    await prisma.systemLog.create({
      data: {
        action: 'UPDATE_API_KEY',
        description: `Cập nhật API key: ${name || existingKey.name}`,
        userId: user.id,
        level: 'INFO',
        category: 'SECURITY',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ success: true, apiKey: { ...updatedKey, keyHash: undefined } });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// DELETE - Revoke API key
export async function DELETE(request: NextRequest) {
  try {
    // RBAC: Require MANAGE_API_GATEWAY permission
    const authResult = await requireFunction(request, SYSTEM.MANAGE_API_GATEWAY);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID là bắt buộc' }, { status: 400 });
    }

    const existingKey = await prisma.externalApiKey.findUnique({ where: { id } });
    if (!existingKey) {
      return NextResponse.json({ error: 'Không tìm thấy API key' }, { status: 404 });
    }

    // Soft delete - just revoke instead of hard delete
    await prisma.externalApiKey.update({
      where: { id },
      data: { status: 'REVOKED' },
    });

    await prisma.systemLog.create({
      data: {
        action: 'REVOKE_API_KEY',
        description: `Thu hồi API key: ${existingKey.name}`,
        userId: user.id,
        level: 'WARNING',
        category: 'SECURITY',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ success: true, message: 'API key đã được thu hồi' });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
