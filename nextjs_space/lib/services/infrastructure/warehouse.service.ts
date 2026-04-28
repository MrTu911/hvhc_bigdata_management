/**
 * M12 – Warehouse Sync Service
 *
 * Quản lý danh sách WarehouseSyncJob (PostgreSQL → ClickHouse).
 * Không thực thi sync trực tiếp — Airflow DAG mới là bên chạy thực,
 * service này chỉ là control plane: đọc trạng thái, ghi kết quả, quản lý config.
 */

import prisma from '@/lib/db';
import type { WarehouseSyncMode, WarehoueSyncStatus } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateSyncJobInput {
  sourceTable:     string;
  targetDataset:   string;
  syncMode:        WarehouseSyncMode;
  watermarkField?: string;
}

export interface RecordSyncResultInput {
  jobId:          string;
  status:         WarehoueSyncStatus;
  rowCount?:      number;
  durationMs?:    number;
  watermarkValue?: string;
  errorMessage?:  string;
}

export interface ListSyncJobsFilter {
  status?:      WarehoueSyncStatus;
  sourceTable?: string;
  page?:        number;
  pageSize?:    number;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listSyncJobs(filter: ListSyncJobsFilter = {}) {
  const page     = filter.page     ?? 1;
  const pageSize = filter.pageSize ?? 50;

  const where: Record<string, unknown> = {};
  if (filter.status)      where.status      = filter.status;
  if (filter.sourceTable) where.sourceTable = { contains: filter.sourceTable, mode: 'insensitive' };

  const [jobs, total] = await prisma.$transaction([
    prisma.warehouseSyncJob.findMany({
      where,
      orderBy: [{ status: 'asc' }, { sourceTable: 'asc' }],
      skip:    (page - 1) * pageSize,
      take:    pageSize,
    }),
    prisma.warehouseSyncJob.count({ where }),
  ]);

  return { jobs, total, page, pageSize };
}

/**
 * Tóm tắt trạng thái toàn bộ warehouse:
 * - số job theo status
 * - job stale (lastSyncAt > 2 giờ hoặc chưa bao giờ sync)
 * - tỉ lệ FAILED
 */
export async function getWarehouseStatus() {
  const [all, running, failed, staleJobs] = await prisma.$transaction([
    prisma.warehouseSyncJob.count({ where: { isActive: true } }),
    prisma.warehouseSyncJob.count({ where: { isActive: true, status: 'RUNNING' } }),
    prisma.warehouseSyncJob.count({ where: { isActive: true, status: 'FAILED'  } }),
    prisma.warehouseSyncJob.findMany({
      where: {
        isActive: true,
        OR: [
          { lastSyncAt: null },
          { lastSyncAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) } },
        ],
      },
      select: { id: true, sourceTable: true, targetDataset: true, lastSyncAt: true, status: true },
      orderBy: { lastSyncAt: 'asc' },
    }),
  ]);

  return {
    totalActive: all,
    running,
    failed,
    staleCount: staleJobs.length,
    staleJobs,
    failRate: all > 0 ? Number((failed / all).toFixed(4)) : 0,
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createSyncJob(input: CreateSyncJobInput) {
  return prisma.warehouseSyncJob.create({
    data: {
      sourceTable:    input.sourceTable,
      targetDataset:  input.targetDataset,
      syncMode:       input.syncMode,
      watermarkField: input.watermarkField,
      status:         'IDLE',
      isActive:       true,
    },
  });
}

/**
 * Airflow gọi sau khi mỗi DAG run xong để ghi kết quả vào control plane.
 */
export async function recordSyncResult(input: RecordSyncResultInput) {
  const job = await prisma.warehouseSyncJob.findUnique({ where: { id: input.jobId } });
  if (!job) throw new Error(`WarehouseSyncJob ${input.jobId} not found`);

  return prisma.warehouseSyncJob.update({
    where: { id: input.jobId },
    data: {
      status:               input.status,
      lastSyncAt:           input.status === 'COMPLETED' ? new Date() : undefined,
      lastSyncRowCount:     input.rowCount,
      lastSyncDurationMs:   input.durationMs,
      watermarkValue:       input.watermarkValue,
      errorMessage:         input.errorMessage ?? null,
    },
  });
}

export async function toggleSyncJobActive(jobId: string, isActive: boolean) {
  return prisma.warehouseSyncJob.update({
    where: { id: jobId },
    data:  { isActive, status: isActive ? 'IDLE' : 'IDLE' },
  });
}
