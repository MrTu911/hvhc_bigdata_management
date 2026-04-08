/**
 * Template Repository – M18
 * Data access layer: mọi query DB cho ReportTemplate đi qua đây.
 */

import prisma from '@/lib/db';
import { ExportJobStatus } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TemplateListFilter {
  module?: string;
  status?: 'active' | 'inactive';
  format?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TemplateCreateInput {
  code: string;
  name: string;
  description?: string;
  moduleSource: string[];
  outputFormats: string[];
  rbacCode: string;
  dataMap?: Record<string, unknown>;
  category?: string;
  createdBy: string;
}

export interface TemplateUpdateInput {
  name?: string;
  description?: string;
  rbacCode?: string;
  isActive?: boolean;
  dataMap?: Record<string, unknown>;
  category?: string;
  moduleSource?: string[];
  outputFormats?: string[];
}

// ─── Select shapes ────────────────────────────────────────────────────────────

const listSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  moduleSource: true,
  outputFormats: true,
  version: true,
  isActive: true,
  isLatest: true,
  category: true,
  rbacCode: true,
  fileKey: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { exportJobs: true } },
} as const;

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Lấy danh sách root templates (parentId = null) với filter + pagination.
 */
export async function findRootTemplates(filter: TemplateListFilter) {
  const { module, status, format, category, search, page = 1, limit = 20 } = filter;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { parentId: null };

  if (status === 'active') where.isActive = true;
  if (status === 'inactive') where.isActive = false;
  if (category) where.category = category;
  if (module) where.moduleSource = { has: module };
  if (format) where.outputFormats = { has: format };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.reportTemplate.findMany({
      where,
      select: listSelect,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reportTemplate.count({ where }),
  ]);

  return { rows, total, page, limit };
}

/**
 * Tìm root template theo code (parentId = null).
 * Dùng để kiểm tra code unique khi tạo mới.
 */
export async function findRootByCode(code: string) {
  return prisma.reportTemplate.findFirst({
    where: { code, parentId: null },
    select: { id: true, code: true },
  });
}

/**
 * Lấy chi tiết 1 template kèm danh sách version con.
 */
export async function findTemplateById(id: string) {
  return prisma.reportTemplate.findUnique({
    where: { id },
    include: {
      versions: {
        select: {
          id: true,
          version: true,
          fileKey: true,
          placeholders: true,
          changeNote: true,
          createdBy: true,
          createdAt: true,
          isLatest: true,
        },
        orderBy: { version: 'desc' },
        take: 20,
      },
      _count: { select: { exportJobs: true } },
    },
  });
}

/**
 * Tạo root template mới (version = 1, parentId = null, isLatest = true).
 */
export async function createRootTemplate(input: TemplateCreateInput) {
  return prisma.reportTemplate.create({
    data: {
      code: input.code,
      name: input.name,
      description: input.description,
      moduleSource: input.moduleSource,
      outputFormats: input.outputFormats,
      rbacCode: input.rbacCode,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dataMap: (input.dataMap ?? {}) as any,
      category: input.category,
      createdBy: input.createdBy,
      version: 1,
      isActive: true,
      isLatest: true,
    },
  });
}

/**
 * Update metadata template (không tăng version — version chỉ tăng khi upload file).
 */
export async function updateTemplateById(id: string, input: TemplateUpdateInput) {
  return prisma.reportTemplate.update({
    where: { id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: input as any,
  });
}

/**
 * Soft delete: set isActive = false.
 * Caller phải đã kiểm tra không có job đang chạy.
 */
export async function softDeleteTemplate(id: string) {
  return prisma.reportTemplate.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Kiểm tra có ExportJob đang PENDING hoặc PROCESSING cho template này không.
 * Dùng trước delete và rollback.
 */
export async function findRunningJobForTemplate(templateId: string) {
  return prisma.exportJob.findFirst({
    where: {
      templateId,
      status: { in: [ExportJobStatus.PENDING, ExportJobStatus.PROCESSING] },
    },
    select: { id: true, status: true },
  });
}

/**
 * Lấy danh sách version rows của 1 template (parentId = rootId).
 */
export async function findVersionsByParentId(parentId: string, page = 1, limit = 10) {
  const where = { parentId };
  const [rows, total] = await Promise.all([
    prisma.reportTemplate.findMany({
      where,
      select: {
        id: true,
        version: true,
        fileKey: true,
        placeholders: true,
        changeNote: true,
        dataMap: true,
        isLatest: true,
        createdBy: true,
        createdAt: true,
      },
      orderBy: { version: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reportTemplate.count({ where }),
  ]);
  return { rows, total };
}
