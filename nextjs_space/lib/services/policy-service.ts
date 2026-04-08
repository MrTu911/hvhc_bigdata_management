/**
 * Policy Service
 * Quản lý chính sách và hồ sơ chế độ với scope-based filtering
 * Note: PolicyRecord sử dụng recordType, không có type/category
 */

import prisma from '@/lib/db';
import { BaseService, ScopedQueryOptions, PaginationOptions, ServiceResult } from './base-service';
import { PolicyRecord, User, PolicyRecordStatus, PolicyRecordType, PolicyLevel } from '@prisma/client';

export interface PolicyRecordWithRelations extends PolicyRecord {
  user?: Partial<User> | null;
}

export interface PolicyFilters {
  recordType?: PolicyRecordType;
  status?: PolicyRecordStatus;
  level?: PolicyLevel;
  userId?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

class PolicyServiceClass extends BaseService {
  protected readonly resourceType = 'POLICY';

  /**
   * Lấy danh sách hồ sơ chính sách với scope filtering
   */
  async findMany(
    options: ScopedQueryOptions,
    filters: PolicyFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<ServiceResult<PolicyRecordWithRelations[]>> {
    try {
      const scopeFilter = await this.buildScopedFilter(options);
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {
        ...scopeFilter,
        ...(filters.recordType && { recordType: filters.recordType }),
        ...(filters.status && { status: filters.status }),
        ...(filters.level && { level: filters.level }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.search && {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { reason: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
        ...(filters.startDate && filters.endDate && {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
      };

      const [data, total] = await Promise.all([
        prisma.policyRecord.findMany({
          where,
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.policyRecord.count({ where }),
      ]);

      return this.createPaginatedResponse(data as PolicyRecordWithRelations[], total, pagination);
    } catch (error) {
      console.error('[PolicyService.findMany] Error:', error);
      return { success: false, error: 'Lỗi khi tải danh sách hồ sơ chính sách' };
    }
  }

  /**
   * Lấy chi tiết hồ sơ theo ID
   */
  async findById(
    options: ScopedQueryOptions,
    id: string
  ): Promise<ServiceResult<PolicyRecordWithRelations | null>> {
    try {
      const record = await prisma.policyRecord.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!record) {
        return { success: false, error: 'Không tìm thấy hồ sơ' };
      }

      const canAccess = await this.canAccessResource(
        options,
        record.userId || undefined,
        undefined
      );
      if (!canAccess.allowed) {
        return { success: false, error: canAccess.reason || 'Không có quyền truy cập' };
      }

      return { success: true, data: record as PolicyRecordWithRelations };
    } catch (error) {
      console.error('[PolicyService.findById] Error:', error);
      return { success: false, error: 'Lỗi khi tải hồ sơ chính sách' };
    }
  }

  /**
   * Thống kê hồ sơ chính sách theo scope
   */
  async getStats(
    options: ScopedQueryOptions
  ): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const scopeFilter = await this.buildScopedFilter(options);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [total, byType, byStatus, byLevel] = await Promise.all([
        prisma.policyRecord.count({ where: scopeFilter as any }),
        prisma.policyRecord.groupBy({
          by: ['recordType'],
          where: scopeFilter as any,
          _count: true,
        }),
        prisma.policyRecord.groupBy({
          by: ['status'],
          where: scopeFilter as any,
          _count: true,
        }),
        prisma.policyRecord.groupBy({
          by: ['level'],
          where: scopeFilter as any,
          _count: true,
        }),
      ]);

      return {
        success: true,
        data: {
          total,
          byType: byType.map((t) => ({ type: t.recordType, count: t._count })),
          byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
          byLevel: byLevel.map((l) => ({ level: l.level, count: l._count })),
        },
      };
    } catch (error) {
      console.error('[PolicyService.getStats] Error:', error);
      return { success: false, error: 'Lỗi khi tải thống kê hồ sơ chính sách' };
    }
  }
}

export const PolicyService = new PolicyServiceClass();
