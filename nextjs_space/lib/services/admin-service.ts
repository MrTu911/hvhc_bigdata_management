/**
 * Admin Service
 * Quản lý hệ thống và người dùng (ACADEMY scope only)
 */

import prisma from '@/lib/db';
import { BaseService, ScopedQueryOptions, PaginationOptions, ServiceResult } from './base-service';
import { User, AuditLog, Unit, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

export interface UserWithRelations extends User {
  unitRelation?: Unit | null;
}

export interface UserFilters {
  role?: UserRole;
  unitId?: string;
  search?: string;
}

export interface AuditFilters {
  actorUserId?: string;
  action?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
}

class AdminServiceClass extends BaseService {
  protected readonly resourceType = 'ADMIN';

  /**
   * Lấy danh sách người dùng
   */
  async getUsers(
    options: ScopedQueryOptions,
    filters: UserFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<ServiceResult<UserWithRelations[]>> {
    try {
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {
        ...(filters.role && { role: filters.role }),
        ...(filters.unitId && { unitId: filters.unitId }),
        ...(filters.search && {
          OR: [
            { email: { contains: filters.search, mode: 'insensitive' } },
            { name: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      };

      const [data, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: { unitRelation: true },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.user.count({ where }),
      ]);

      return this.createPaginatedResponse(data as UserWithRelations[], total, pagination);
    } catch (error) {
      console.error('[AdminService.getUsers] Error:', error);
      return { success: false, error: 'Lỗi khi tải danh sách người dùng' };
    }
  }

  /**
   * Tạo người dùng mới
   */
  async createUser(
    options: ScopedQueryOptions,
    data: {
      email: string;
      password: string;
      name: string;
      role?: UserRole;
      unitId?: string;
    }
  ): Promise<ServiceResult<User>> {
    try {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) {
        return { success: false, error: 'Email đã tồn tại' };
      }

      const hashedPassword = await hash(data.password, 12);

      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          role: data.role || ('USER' as UserRole),
          unitId: data.unitId,
        },
      });

      return { success: true, data: user };
    } catch (error) {
      console.error('[AdminService.createUser] Error:', error);
      return { success: false, error: 'Lỗi khi tạo người dùng' };
    }
  }

  /**
   * Thống kê hệ thống
   */
  async getSystemStats(): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const [totalUsers, totalUnits, totalPersonnel, totalStudents, recentAudit] = await Promise.all([
        prisma.user.count(),
        prisma.unit.count({ where: { active: true } }),
        prisma.personnel.count(),
        prisma.hocVien.count(),
        prisma.auditLog.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

      const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        _count: true,
      });

      return {
        success: true,
        data: {
          totalUsers,
          totalUnits,
          totalPersonnel,
          totalStudents,
          recentAuditLogs: recentAudit,
          usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count })),
        },
      };
    } catch (error) {
      console.error('[AdminService.getSystemStats] Error:', error);
      return { success: false, error: 'Lỗi khi tải thống kê hệ thống' };
    }
  }

  /**
   * Lấy audit logs
   */
  async getAuditLogs(
    filters: AuditFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<ServiceResult<AuditLog[]>> {
    try {
      const { page = 1, limit = 50, sortOrder = 'desc' } = pagination;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {
        ...(filters.actorUserId && { actorUserId: filters.actorUserId }),
        ...(filters.action && { action: { contains: filters.action, mode: 'insensitive' } }),
        ...(filters.resourceType && { resourceType: filters.resourceType }),
        ...(filters.startDate && filters.endDate && {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
      };

      const [data, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: sortOrder },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return this.createPaginatedResponse(data, total, pagination);
    } catch (error) {
      console.error('[AdminService.getAuditLogs] Error:', error);
      return { success: false, error: 'Lỗi khi tải audit logs' };
    }
  }
}

export const AdminService = new AdminServiceClass();
