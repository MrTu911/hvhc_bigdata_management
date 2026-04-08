/**
 * API Route: Infrastructure Configuration
 * GET - List all infrastructure configs
 * POST - Create new infrastructure config
 * PUT - Update infrastructure config
 * DELETE - Remove infrastructure config
 * 
 * RBAC: SYSTEM.VIEW_INFRASTRUCTURE, SYSTEM.MANAGE_INFRASTRUCTURE
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET - List all infrastructure configs
export async function GET(request: NextRequest) {
  try {
    // RBAC Check: SYSTEM.VIEW_INFRASTRUCTURE
    const authResult = await requireFunction(request, SYSTEM.VIEW_INFRASTRUCTURE);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const configType = searchParams.get('type');

    const where: any = {};
    if (configType && configType !== 'ALL') where.configType = configType;

    const configs = await prisma.infrastructureConfig.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { syncLogs: true } }
      }
    });

    // Mask sensitive data
    const safeConfigs = configs.map(config => ({
      ...config,
      passwordHash: config.passwordHash ? '********' : null,
      username: config.username ? config.username.substring(0, 2) + '***' : null,
      totalSyncs: config._count.syncLogs
    }));

    return NextResponse.json({ configs: safeConfigs });
  } catch (error) {
    console.error('Error fetching infrastructure configs:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// POST - Create new infrastructure config
export async function POST(request: NextRequest) {
  try {
    // RBAC Check: SYSTEM.MANAGE_INFRASTRUCTURE
    const authResult = await requireFunction(request, SYSTEM.MANAGE_INFRASTRUCTURE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const {
      configType,
      name,
      description,
      connectionUrl,
      protocol,
      port,
      username,
      password,
      sshKeyPath,
      basePath,
      gpuCount,
      gpuType,
      memoryGB,
      storageGB,
      syncEnabled,
      syncInterval,
      syncDirection,
    } = body;

    if (!configType || !name || !connectionUrl) {
      return NextResponse.json(
        { error: 'configType, name, và connectionUrl là bắt buộc' },
        { status: 400 }
      );
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const config = await prisma.infrastructureConfig.create({
      data: {
        configType,
        name,
        description,
        connectionUrl,
        protocol,
        port,
        username,
        passwordHash,
        sshKeyPath,
        basePath,
        gpuCount,
        gpuType,
        memoryGB,
        storageGB,
        syncEnabled: syncEnabled || false,
        syncInterval,
        syncDirection,
        createdById: user.id,
      },
    });

    await prisma.systemLog.create({
      data: {
        action: 'CREATE_INFRA_CONFIG',
        description: `Tạo cấu hình ${configType}: ${name}`,
        userId: user.id,
        level: 'INFO',
        category: 'SYSTEM',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ success: true, config: { ...config, passwordHash: undefined } });
  } catch (error) {
    console.error('Error creating infrastructure config:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// PUT - Update infrastructure config
export async function PUT(request: NextRequest) {
  try {
    // RBAC Check: SYSTEM.MANAGE_INFRASTRUCTURE
    const authResult = await requireFunction(request, SYSTEM.MANAGE_INFRASTRUCTURE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { id, password, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID là bắt buộc' }, { status: 400 });
    }

    const existingConfig = await prisma.infrastructureConfig.findUnique({ where: { id } });
    if (!existingConfig) {
      return NextResponse.json({ error: 'Không tìm thấy cấu hình' }, { status: 404 });
    }

    // Hash new password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const config = await prisma.infrastructureConfig.update({
      where: { id },
      data: updateData,
    });

    await prisma.systemLog.create({
      data: {
        action: 'UPDATE_INFRA_CONFIG',
        description: `Cập nhật cấu hình ${config.configType}: ${config.name}`,
        userId: user.id,
        level: 'INFO',
        category: 'SYSTEM',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ success: true, config: { ...config, passwordHash: undefined } });
  } catch (error) {
    console.error('Error updating infrastructure config:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// DELETE - Remove infrastructure config
export async function DELETE(request: NextRequest) {
  try {
    // RBAC Check: SYSTEM.MANAGE_INFRASTRUCTURE
    const authResult = await requireFunction(request, SYSTEM.MANAGE_INFRASTRUCTURE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID là bắt buộc' }, { status: 400 });
    }

    const existingConfig = await prisma.infrastructureConfig.findUnique({ where: { id } });
    if (!existingConfig) {
      return NextResponse.json({ error: 'Không tìm thấy cấu hình' }, { status: 404 });
    }

    await prisma.infrastructureConfig.delete({ where: { id } });

    await prisma.systemLog.create({
      data: {
        action: 'DELETE_INFRA_CONFIG',
        description: `Xóa cấu hình ${existingConfig.configType}: ${existingConfig.name}`,
        userId: user.id,
        level: 'WARNING',
        category: 'SYSTEM',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ success: true, message: 'Cấu hình đã được xóa' });
  } catch (error) {
    console.error('Error deleting infrastructure config:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
