/**
 * Service — Danh mục nguồn dữ liệu (DataSource catalog) cho section Khai thác dữ liệu.
 *
 * Trách nhiệm:
 *  - Truy vấn DataSource (active) kèm relation owner/classification/service.
 *  - Map model → DataSourceVM (hợp đồng UI), resolve nhãn lĩnh vực qua M19,
 *    format dung lượng/cập nhật, ép BigInt → number (tránh lỗi serialize JSON).
 *
 * Route chỉ gọi service; không chứa business logic.
 */

import prisma from '@/lib/db';
import type { DataSourceVM, DataSourceStatus as VmStatus, DataSourceType } from '@/components/bigdata/types';
import type { DataSourceStatus as PrismaStatus, Prisma } from '@prisma/client';

export interface ListDataSourcesParams {
  keyword?: string;
  kind?: string;
}

const STATUS_MAP: Record<PrismaStatus, VmStatus> = {
  ACTIVE: 'ok',
  WARNING: 'warn',
  ERROR: 'err',
  SYNCING: 'syncing',
  INACTIVE: 'warn',
};

const TB = 1024 ** 4;
const GB = 1024 ** 3;

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes >= TB) return `${(bytes / TB).toFixed(1)} TB`;
  return `${(bytes / GB).toFixed(1)} GB`;
}

function formatUpdated(date: Date | null): string {
  if (!date) return '—';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return sameDay ? `${time} hôm nay` : date.toLocaleDateString('vi-VN');
}

export async function getDomainLabelMap(): Promise<Map<string, string>> {
  const items = await prisma.masterDataItem.findMany({
    where: { categoryCode: 'DATA_DOMAIN', isActive: true },
    select: { code: true, nameVi: true },
  });
  return new Map(items.map((i) => [i.code, i.nameVi]));
}

/** Liệt kê nguồn dữ liệu active, trả về theo hợp đồng DataSourceVM. */
export async function listDataSources(params: ListDataSourcesParams = {}): Promise<DataSourceVM[]> {
  const where: Prisma.DataSourceWhereInput = { isActive: true };
  if (params.kind && params.kind !== 'all') {
    where.kindCode = params.kind;
  }
  if (params.keyword) {
    const kw = params.keyword.trim();
    where.OR = [
      { title: { contains: kw, mode: 'insensitive' } },
      { code: { contains: kw, mode: 'insensitive' } },
    ];
  }

  const [rows, domainLabels] = await Promise.all([
    prisma.dataSource.findMany({
      where,
      orderBy: [{ status: 'asc' }, { title: 'asc' }],
      include: {
        ownerUnit: { select: { name: true } },
        service: { select: { type: true } },
      },
    }),
    getDomainLabelMap(),
  ]);

  return rows.map((ds) => ({
    id: ds.id,
    name: ds.code,
    title: ds.title,
    type: (ds.kindCode as DataSourceType) ?? 'warehouse',
    engine: ds.engineLabel ?? ds.service?.type ?? '—',
    status: STATUS_MAP[ds.status],
    recordCount: Number(ds.recordCount ?? 0n),
    size: formatBytes(Number(ds.sizeBytes ?? 0n)),
    tableCount: ds.tableCount ?? 0,
    owner: ds.ownerUnit?.name ?? ds.ownerLabel ?? '—',
    updated: formatUpdated(ds.lastSyncedAt ?? ds.updatedAt),
    health: ds.healthScore ?? 0,
    domain: (ds.domainCode ? domainLabels.get(ds.domainCode) : undefined) ?? ds.domainCode ?? '—',
    description: ds.description ?? '',
  }));
}
