import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { INFRA } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { getBucketUsage, type StorageDomain } from '@/lib/services/infrastructure/storage.service';

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.STORAGE_VIEW);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');

  try {
    if (view === 'usage') {
      const domain = searchParams.get('domain') as StorageDomain | null;
      if (!domain) {
        return NextResponse.json(
          { success: false, error: 'domain required for usage view' },
          { status: 400 },
        );
      }
      const usage = await getBucketUsage(domain);
      return NextResponse.json({ success: true, data: { ...usage, totalSizeBytes: usage.totalSizeBytes.toString() } });
    }

    // Danh sách bucket configs — không trả lifecycle policy chi tiết (có thể chứa config nhạy cảm)
    const configs = await prisma.storageBucketConfig.findMany({
      orderBy: [{ accessTier: 'asc' }, { moduleDomain: 'asc' }],
      select: {
        id:            true,
        bucketName:    true,
        moduleDomain:  true,
        description:   true,
        retentionDays: true,
        accessTier:    true,
        maxSizeGb:     true,
        isActive:      true,
        // lifecyclePolicy không trả ra — có thể chứa thông tin cấu hình nội bộ
      },
    });
    return NextResponse.json({ success: true, data: configs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.STORAGE_MANAGE);
  if (!auth.allowed) return auth.response!;

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    }

    const updated = await prisma.storageBucketConfig.update({
      where: { id: body.id },
      data: {
        retentionDays:   body.retentionDays,
        accessTier:      body.accessTier,
        maxSizeGb:       body.maxSizeGb,
        isActive:        body.isActive,
        lifecyclePolicy: body.lifecyclePolicy,
      },
    });
    return NextResponse.json({ success: true, data: { id: updated.id, bucketName: updated.bucketName } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
