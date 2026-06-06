/**
 * Service — Tổng quan Khai thác dữ liệu (overview dashboard).
 *
 * Tính các chỉ số thật từ catalog DataSource: tổng dung lượng/bản ghi/số nguồn,
 * phân bố theo lĩnh vực, top dataset theo dung lượng. Các chuỗi thời gian
 * (nạp/truy vấn theo ngày) và heatmap vẫn là minh họa ở tầng UI vì chưa có
 * nguồn metric thật — service này chỉ trả phần dữ liệu có thật.
 */

import prisma from '@/lib/db';
import { getDomainLabelMap } from './data-source-service';

const TB = 1024 ** 4;

export interface BigDataOverview {
  kpis: {
    totalSizeTB: number;
    totalRecords: number;
    sourceCount: number;
    activeSources: number;
  };
  domainBreakdown: { name: string; valueTB: number }[];
  topDatasets: { label: string; valueTB: number }[];
}

function toTB(bytes: bigint | null): number {
  return Math.round((Number(bytes ?? 0n) / TB) * 10) / 10;
}

export async function getBigDataOverview(): Promise<BigDataOverview> {
  const [agg, activeSources, byDomain, top, domainLabels] = await Promise.all([
    prisma.dataSource.aggregate({
      where: { isActive: true },
      _sum: { sizeBytes: true, recordCount: true },
      _count: true,
    }),
    prisma.dataSource.count({ where: { isActive: true, status: 'ACTIVE' } }),
    prisma.dataSource.groupBy({
      by: ['domainCode'],
      where: { isActive: true },
      _sum: { sizeBytes: true },
    }),
    prisma.dataSource.findMany({
      where: { isActive: true },
      orderBy: { sizeBytes: 'desc' },
      take: 5,
      select: { code: true, title: true, sizeBytes: true },
    }),
    getDomainLabelMap(),
  ]);

  const domainBreakdown = byDomain
    .map((d) => ({
      name: (d.domainCode ? domainLabels.get(d.domainCode) : undefined) ?? d.domainCode ?? 'Khác',
      valueTB: toTB(d._sum.sizeBytes),
    }))
    .filter((d) => d.valueTB > 0)
    .sort((a, b) => b.valueTB - a.valueTB);

  const topDatasets = top.map((d) => ({ label: d.code, valueTB: toTB(d.sizeBytes) }));

  return {
    kpis: {
      totalSizeTB: toTB(agg._sum.sizeBytes),
      totalRecords: Number(agg._sum.recordCount ?? 0n),
      sourceCount: agg._count,
      activeSources,
    },
    domainBreakdown,
    topDatasets,
  };
}
