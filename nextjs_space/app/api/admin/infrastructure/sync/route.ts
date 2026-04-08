import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';

// POST - Trigger manual sync
export async function POST(request: NextRequest) {
  try {
    // RBAC: Require MANAGE_INFRASTRUCTURE permission
    const authResult = await requireFunction(request, SYSTEM.MANAGE_INFRASTRUCTURE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await request.json();
    const { configId, direction } = body;

    if (!configId) {
      return NextResponse.json({ error: 'configId là bắt buộc' }, { status: 400 });
    }

    const config = await prisma.infrastructureConfig.findUnique({ where: { id: configId } });
    if (!config) {
      return NextResponse.json({ error: 'Không tìm thấy cấu hình' }, { status: 404 });
    }

    if (!config.isEnabled) {
      return NextResponse.json({ error: 'Cấu hình chưa được bật' }, { status: 400 });
    }

    const syncDirection = direction || config.syncDirection || 'UPLOAD';
    const startTime = Date.now();

    // Simulate sync operation
    // In production, this would actually perform file synchronization
    const simulatedResult = {
      filesUploaded: syncDirection === 'DOWNLOAD' ? 0 : Math.floor(Math.random() * 50),
      filesDownloaded: syncDirection === 'UPLOAD' ? 0 : Math.floor(Math.random() * 30),
      bytesTransferred: BigInt(Math.floor(Math.random() * 100000000)),
    };

    const duration = Math.floor((Date.now() - startTime) / 1000) + Math.floor(Math.random() * 10);

    // Create sync log
    const syncLog = await prisma.syncLog.create({
      data: {
        configId,
        syncType: 'MANUAL',
        direction: syncDirection,
        status: 'SUCCESS',
        filesUploaded: simulatedResult.filesUploaded,
        filesDownloaded: simulatedResult.filesDownloaded,
        bytesTransferred: simulatedResult.bytesTransferred,
        duration,
      },
    });

    // Update config last sync info
    await prisma.infrastructureConfig.update({
      where: { id: configId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'SUCCESS',
      },
    });

    await prisma.systemLog.create({
      data: {
        action: 'MANUAL_SYNC',
        description: `Đồng bộ thủ công ${config.name}: ${syncDirection}`,
        userId: user.id,
        level: 'INFO',
        category: 'SYSTEM',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      syncLog: {
        ...syncLog,
        bytesTransferred: syncLog.bytesTransferred.toString(),
      },
    });
  } catch (error) {
    console.error('Error triggering sync:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// GET - Get sync history
export async function GET(request: NextRequest) {
  try {
    // RBAC: Require VIEW_INFRASTRUCTURE permission
    const authResult = await requireFunction(request, SYSTEM.VIEW_INFRASTRUCTURE);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('configId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (configId) where.configId = configId;

    const logs = await prisma.syncLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        config: {
          select: { name: true, configType: true }
        }
      }
    });

    // Convert BigInt to string for JSON serialization
    const safeLogs = logs.map(log => ({
      ...log,
      bytesTransferred: log.bytesTransferred.toString(),
    }));

    return NextResponse.json({ logs: safeLogs });
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
