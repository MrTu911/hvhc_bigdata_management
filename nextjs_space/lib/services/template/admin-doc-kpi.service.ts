/**
 * Admin-Doc Group KPI Service – M18
 *
 * KPI/analytics cho NHÓM mẫu văn bản hành chính (Nghị định 30/2020) — nhận diện
 * qua dataMap.__group = 'admin-docs'. Tập trung vào "độ phủ" (coverage) thể thức
 * theo module + thống kê sử dụng (lượt xuất) từ ExportJob.
 *
 * KPI catalog (coverage) đọc từ ReportTemplate; KPI sử dụng đọc từ ExportJob.
 */

import prisma from '@/lib/db';

const ADMIN_DOC_GROUP = 'admin-docs';

/** Thứ tự hiển thị thể thức trong ma trận độ phủ. */
const DOC_TYPE_ORDER = ['BC', 'CV', 'KH', 'TTr', 'QD', 'TB', 'GM', 'GGT'] as const;
const DOC_TYPE_LABELS: Record<string, string> = {
  BC: 'Báo cáo', CV: 'Công văn', KH: 'Kế hoạch', TTr: 'Tờ trình',
  QD: 'Quyết định', TB: 'Thông báo', GM: 'Giấy mời', GGT: 'Giấy giới thiệu',
};

export interface CountItem {
  key: string;
  label: string;
  count: number;
}

export interface CoverageRow {
  module: string;
  counts: Record<string, number>; // docType -> count
  total: number;
}

export interface AdminDocKpis {
  total: number;
  entityBound: number;
  skeleton: number;
  modulesCovered: number;
  docTypesCovered: number;
  byModule: CountItem[];
  byDocType: CountItem[];
  byCategory: CountItem[];
  byClassification: CountItem[];
  coverage: { docTypes: { key: string; label: string }[]; rows: CoverageRow[] };
  usage: {
    totalJobs: number;
    totalExports: number;
    failCount: number;
    successRate: number;
    topUsed: { code: string; name: string; exports: number }[];
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  NHAN_SU: 'Nhân sự', DANG_VIEN: 'Đảng viên', BAO_HIEM: 'Bảo hiểm',
  CHE_DO: 'Chế độ', KHEN_THUONG: 'Khen thưởng', DAO_TAO: 'Đào tạo',
  NCKH: 'NCKH', TONG_HOP: 'Tổng hợp',
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  INTERNAL: 'Nội bộ', CONFIDENTIAL: 'Mật', SECRET: 'Tối mật', PUBLIC: 'Công khai',
};

interface GroupRow {
  id: string;
  code: string;
  name: string;
  category: string | null;
  module: string;
  docType: string;
  entity: string;
  classification: string;
}

/** Tăng đếm theo key trong map. */
function bump(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function toCountItems(map: Map<string, number>, labels: Record<string, string>): CountItem[] {
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, label: labels[key] ?? key, count }))
    .sort((a, b) => b.count - a.count);
}

/** Đọc các mẫu thuộc nhóm admin-docs từ dataMap.__group. */
async function loadGroupTemplates(): Promise<GroupRow[]> {
  const rows = await prisma.reportTemplate.findMany({
    where: { parentId: null, deletedAt: null },
    select: { id: true, code: true, name: true, category: true, dataMap: true },
  });

  const result: GroupRow[] = [];
  for (const r of rows) {
    const meta = (r.dataMap ?? {}) as Record<string, unknown>;
    if (meta.__group !== ADMIN_DOC_GROUP) continue;
    result.push({
      id: r.id,
      code: r.code,
      name: r.name,
      category: r.category,
      module: typeof meta.__module === 'string' ? meta.__module : '—',
      docType: typeof meta.__docType === 'string' ? meta.__docType : '—',
      entity: typeof meta.__entity === 'string' ? meta.__entity : '',
      classification: typeof meta.__classification === 'string' ? meta.__classification : 'INTERNAL',
    });
  }
  return result;
}

/** Thống kê sử dụng (lượt xuất) của nhóm từ ExportJob. */
async function buildUsage(group: GroupRow[]): Promise<AdminDocKpis['usage']> {
  const ids = group.map((g) => g.id);
  if (ids.length === 0) {
    return { totalJobs: 0, totalExports: 0, failCount: 0, successRate: 0, topUsed: [] };
  }

  const [agg, grouped] = await Promise.all([
    prisma.exportJob.aggregate({
      where: { templateId: { in: ids } },
      _count: { id: true },
      _sum: { successCount: true, failCount: true },
    }),
    prisma.exportJob.groupBy({
      by: ['templateId'],
      where: { templateId: { in: ids } },
      _sum: { successCount: true },
      orderBy: { _sum: { successCount: 'desc' } },
      take: 5,
    }),
  ]);

  const totalExports = agg._sum.successCount ?? 0;
  const failCount = agg._sum.failCount ?? 0;
  const denom = totalExports + failCount;
  const byId = new Map(group.map((g) => [g.id, g]));

  return {
    totalJobs: agg._count.id,
    totalExports,
    failCount,
    successRate: denom > 0 ? Math.round((totalExports / denom) * 100) : 0,
    topUsed: grouped
      .filter((g) => (g._sum.successCount ?? 0) > 0)
      .map((g) => ({
        code: byId.get(g.templateId)?.code ?? g.templateId.slice(0, 8),
        name: byId.get(g.templateId)?.name ?? '(đã xóa)',
        exports: g._sum.successCount ?? 0,
      })),
  };
}

/** Tổng hợp KPI nhóm mẫu văn bản hành chính. */
export async function getAdminDocGroupKpis(): Promise<AdminDocKpis> {
  const group = await loadGroupTemplates();

  const moduleMap = new Map<string, number>();
  const docTypeMap = new Map<string, number>();
  const categoryMap = new Map<string, number>();
  const classificationMap = new Map<string, number>();
  const coverageMap = new Map<string, Map<string, number>>(); // module -> (docType -> count)
  let entityBound = 0;

  for (const t of group) {
    bump(moduleMap, t.module);
    bump(docTypeMap, t.docType);
    if (t.category) bump(categoryMap, t.category);
    bump(classificationMap, t.classification);
    if (t.entity) entityBound++;

    const rowMap = coverageMap.get(t.module) ?? new Map<string, number>();
    bump(rowMap, t.docType);
    coverageMap.set(t.module, rowMap);
  }

  // Cột ma trận = các docType có mặt, theo thứ tự chuẩn.
  const presentDocTypes = DOC_TYPE_ORDER.filter((d) => docTypeMap.has(d));
  const coverageRows: CoverageRow[] = Array.from(coverageMap.entries())
    .map(([module, rowMap]) => {
      const counts: Record<string, number> = {};
      let total = 0;
      for (const d of presentDocTypes) {
        const c = rowMap.get(d) ?? 0;
        counts[d] = c;
        total += c;
      }
      return { module, counts, total };
    })
    .sort((a, b) => a.module.localeCompare(b.module));

  const usage = await buildUsage(group);

  return {
    total: group.length,
    entityBound,
    skeleton: group.length - entityBound,
    modulesCovered: moduleMap.size,
    docTypesCovered: docTypeMap.size,
    byModule: Array.from(moduleMap.entries())
      .map(([key, count]) => ({ key, label: key, count }))
      .sort((a, b) => a.key.localeCompare(b.key)),
    byDocType: presentDocTypes.map((d) => ({ key: d, label: DOC_TYPE_LABELS[d] ?? d, count: docTypeMap.get(d) ?? 0 })),
    byCategory: toCountItems(categoryMap, CATEGORY_LABELS),
    byClassification: toCountItems(classificationMap, CLASSIFICATION_LABELS),
    coverage: {
      docTypes: presentDocTypes.map((d) => ({ key: d, label: DOC_TYPE_LABELS[d] ?? d })),
      rows: coverageRows,
    },
    usage,
  };
}
