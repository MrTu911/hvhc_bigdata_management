/**
 * Personnel Service
 * Quản lý nhân sự với scope-based filtering
 */

import prisma from '@/lib/db';
import { BaseService, ScopedQueryOptions, PaginationOptions, ServiceResult } from './base-service';
import { Personnel, Unit } from '@prisma/client';

export interface PersonnelWithRelations extends Personnel {
  unit?: Unit | null;
}

export interface PersonnelFilters {
  unitId?: string;
  militaryRank?: string;
  position?: string;
  status?: string;
  search?: string;
}

class PersonnelServiceClass extends BaseService {
  protected readonly resourceType = 'PERSONNEL';

  /**
   * Lấy danh sách nhân sự với scope filtering
   */
  async findMany(
    options: ScopedQueryOptions,
    filters: PersonnelFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<ServiceResult<PersonnelWithRelations[]>> {
    try {
      const scopeFilter = await this.buildScopedFilter(options, 'id');
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {
        ...scopeFilter,
        ...(filters.unitId && { unitId: filters.unitId }),
        ...(filters.militaryRank && { militaryRank: filters.militaryRank }),
        ...(filters.position && { position: { contains: filters.position, mode: 'insensitive' } }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && {
          OR: [
            { fullName: { contains: filters.search, mode: 'insensitive' } },
            { militaryIdNumber: { contains: filters.search, mode: 'insensitive' } },
            { personnelCode: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      };

      const [data, total] = await Promise.all([
        prisma.personnel.findMany({
          where,
          include: { unit: true },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.personnel.count({ where }),
      ]);

      return this.createPaginatedResponse(data as PersonnelWithRelations[], total, pagination);
    } catch (error) {
      console.error('[PersonnelService.findMany] Error:', error);
      return { success: false, error: 'Lỗi khi tải danh sách nhân sự' };
    }
  }

  /**
   * Lấy chi tiết nhân sự theo ID
   */
  async findById(
    options: ScopedQueryOptions,
    id: string
  ): Promise<ServiceResult<PersonnelWithRelations | null>> {
    try {
      const personnel = await prisma.personnel.findUnique({
        where: { id },
        include: { unit: true },
      });

      if (!personnel) {
        return { success: false, error: 'Không tìm thấy nhân sự' };
      }

      const canAccess = await this.canAccessResource(options, undefined, personnel.unitId || undefined);
      if (!canAccess.allowed) {
        return { success: false, error: canAccess.reason || 'Không có quyền truy cập' };
      }

      return { success: true, data: personnel as PersonnelWithRelations };
    } catch (error) {
      console.error('[PersonnelService.findById] Error:', error);
      return { success: false, error: 'Lỗi khi tải thông tin nhân sự' };
    }
  }

  /**
   * Thống kê nhân sự theo scope
   */
  async getStats(
    options: ScopedQueryOptions
  ): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const scopeFilter = await this.buildScopedFilter(options, 'id');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [total, byUnit, byStatus] = await Promise.all([
        prisma.personnel.count({ where: scopeFilter as any }),
        prisma.personnel.groupBy({
          by: ['unitId'],
          where: { ...scopeFilter, unitId: { not: null } } as any,
          _count: true,
        }),
        prisma.personnel.groupBy({
          by: ['status'],
          where: scopeFilter as any,
          _count: true,
        }),
      ]);

      return {
        success: true,
        data: {
          total,
          byUnit: byUnit.map((u) => ({ unitId: u.unitId, count: u._count })),
          byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
        },
      };
    } catch (error) {
      console.error('[PersonnelService.getStats] Error:', error);
      return { success: false, error: 'Lỗi khi tải thống kê nhân sự' };
    }
  }

  /**
   * Export nhân sự theo scope
   */
  async exportData(
    options: ScopedQueryOptions,
    filters: PersonnelFilters = {}
  ): Promise<ServiceResult<PersonnelWithRelations[]>> {
    try {
      const scopeFilter = await this.buildScopedFilter(options, 'id');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {
        ...scopeFilter,
        ...(filters.unitId && { unitId: filters.unitId }),
      };

      const data = await prisma.personnel.findMany({
        where,
        include: { unit: true },
        orderBy: { fullName: 'asc' },
      });

      return { success: true, data: data as PersonnelWithRelations[] };
    } catch (error) {
      console.error('[PersonnelService.exportData] Error:', error);
      return { success: false, error: 'Lỗi khi xuất dữ liệu nhân sự' };
    }
  }
}

export const PersonnelService = new PersonnelServiceClass();
