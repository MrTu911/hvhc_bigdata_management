/**
 * Faculty Service
 * Quản lý giảng viên với scope-based filtering
 */

import prisma from '@/lib/db';
import { BaseService, ScopedQueryOptions, PaginationOptions, ServiceResult } from './base-service';
import { FacultyProfile, Unit, User } from '@prisma/client';

export interface FacultyWithRelations extends FacultyProfile {
  unit?: Unit | null;
  user?: Pick<User, 'id' | 'name' | 'email' | 'militaryId' | 'rank' | 'phone'> | null;
}

export interface FacultyFilters {
  unitId?: string;
  academicRank?: string;
  academicDegree?: string;
  search?: string;
}

class FacultyServiceClass extends BaseService {
  protected readonly resourceType = 'FACULTY';

  /**
   * Lấy danh sách giảng viên với scope filtering
   */
  async findMany(
    options: ScopedQueryOptions,
    filters: FacultyFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<ServiceResult<FacultyWithRelations[]>> {
    try {
      const scopeFilter = await this.buildScopedFilter(options);
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {
        ...scopeFilter,
        ...(filters.unitId && { unitId: filters.unitId }),
        ...(filters.academicRank && { academicRank: filters.academicRank }),
        ...(filters.academicDegree && { academicDegree: filters.academicDegree }),
        ...(filters.search && {
          OR: [
            { specialization: { contains: filters.search, mode: 'insensitive' } },
            { user: { name: { contains: filters.search, mode: 'insensitive' } } },
            { user: { email: { contains: filters.search, mode: 'insensitive' } } },
          ],
        }),
      };

      const [data, total] = await Promise.all([
        prisma.facultyProfile.findMany({
          where,
          include: { 
            unit: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                militaryId: true,
                rank: true,
                phone: true,
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.facultyProfile.count({ where }),
      ]);

      return this.createPaginatedResponse(data as FacultyWithRelations[], total, pagination);
    } catch (error) {
      console.error('[FacultyService.findMany] Error:', error);
      return { success: false, error: 'Lỗi khi tải danh sách giảng viên' };
    }
  }

  /**
   * Lấy chi tiết giảng viên theo ID
   */
  async findById(
    options: ScopedQueryOptions,
    id: string
  ): Promise<ServiceResult<FacultyWithRelations | null>> {
    try {
      const faculty = await prisma.facultyProfile.findUnique({
        where: { id },
        include: { unit: true },
      });

      if (!faculty) {
        return { success: false, error: 'Không tìm thấy giảng viên' };
      }

      const canAccess = await this.canAccessResource(options, faculty.userId || undefined, faculty.unitId || undefined);
      if (!canAccess.allowed) {
        return { success: false, error: canAccess.reason || 'Không có quyền truy cập' };
      }

      return { success: true, data: faculty as FacultyWithRelations };
    } catch (error) {
      console.error('[FacultyService.findById] Error:', error);
      return { success: false, error: 'Lỗi khi tải thông tin giảng viên' };
    }
  }

  /**
   * Thống kê giảng viên theo scope
   */
  async getStats(
    options: ScopedQueryOptions
  ): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const scopeFilter = await this.buildScopedFilter(options);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [total, byRank, byDegree, byUnit, totalResearch] = await Promise.all([
        prisma.facultyProfile.count({ where: scopeFilter as any }),
        prisma.facultyProfile.groupBy({
          by: ['academicRank'],
          where: scopeFilter as any,
          _count: true,
        }),
        prisma.facultyProfile.groupBy({
          by: ['academicDegree'],
          where: scopeFilter as any,
          _count: true,
        }),
        prisma.facultyProfile.groupBy({
          by: ['unitId'],
          where: { ...scopeFilter, unitId: { not: null } } as any,
          _count: true,
        }),
        prisma.facultyProfile.aggregate({
          where: scopeFilter as any,
          _sum: { researchProjects: true },
        }),
      ]);

      return {
        success: true,
        data: {
          total,
          byRank: byRank.map((r) => ({ rank: r.academicRank, count: r._count })),
          byDegree: byDegree.map((d) => ({ degree: d.academicDegree, count: d._count })),
          byUnit: byUnit.map((u) => ({ unitId: u.unitId, count: u._count })),
          totalResearchProjects: totalResearch._sum.researchProjects || 0,
        },
      };
    } catch (error) {
      console.error('[FacultyService.getStats] Error:', error);
      return { success: false, error: 'Lỗi khi tải thống kê giảng viên' };
    }
  }

  /**
   * Export giảng viên theo scope
   */
  async exportData(
    options: ScopedQueryOptions,
    filters: FacultyFilters = {}
  ): Promise<ServiceResult<FacultyWithRelations[]>> {
    try {
      const scopeFilter = await this.buildScopedFilter(options);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {
        ...scopeFilter,
        ...(filters.unitId && { unitId: filters.unitId }),
      };

      const data = await prisma.facultyProfile.findMany({
        where,
        include: { unit: true },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, data: data as FacultyWithRelations[] };
    } catch (error) {
      console.error('[FacultyService.exportData] Error:', error);
      return { success: false, error: 'Lỗi khi xuất dữ liệu giảng viên' };
    }
  }
}

export const FacultyService = new FacultyServiceClass();
