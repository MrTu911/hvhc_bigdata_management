/**
 * Student Service
 * Quản lý học viên với scope-based filtering
 * Note: HocVien model không có unitId, sử dụng lop/khoaHoc/nganh để filter
 */

import prisma from '@/lib/db';
import { BaseService, ScopedQueryOptions, PaginationOptions, ServiceResult } from './base-service';
import { HocVien, KetQuaHocTap } from '@prisma/client';

export interface StudentWithRelations extends HocVien {
  ketQuaHocTap?: KetQuaHocTap[];
}

export interface StudentFilters {
  lop?: string;
  khoaHoc?: string;
  nganh?: string;
  trangThai?: string;
  search?: string;
}

class StudentServiceClass extends BaseService {
  protected readonly resourceType = 'STUDENT';

  /**
   * Lấy danh sách học viên với filters
   * Note: Không dùng scope filter vì HocVien không có unitId
   */
  async findMany(
    options: ScopedQueryOptions,
    filters: StudentFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<ServiceResult<StudentWithRelations[]>> {
    try {
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {
        ...(filters.lop && { lop: filters.lop }),
        ...(filters.khoaHoc && { khoaHoc: filters.khoaHoc }),
        ...(filters.nganh && { nganh: filters.nganh }),
        ...(filters.trangThai && { trangThai: filters.trangThai }),
        ...(filters.search && {
          OR: [
            { hoTen: { contains: filters.search, mode: 'insensitive' } },
            { maHocVien: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      };

      const [data, total] = await Promise.all([
        prisma.hocVien.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            giangVienHuongDan: {
              include: { user: true }
            },
            cohort: true,
            studentClass: true,
            major: true,
            _count: {
              select: { ketQuaHocTap: true }
            }
          }
        }),
        prisma.hocVien.count({ where }),
      ]);

      return this.createPaginatedResponse(data as StudentWithRelations[], total, pagination);
    } catch (error) {
      console.error('[StudentService.findMany] Error:', error);
      return { success: false, error: 'Lỗi khi tải danh sách học viên' };
    }
  }

  /**
   * Lấy chi tiết học viên theo ID
   */
  async findById(
    options: ScopedQueryOptions,
    id: string
  ): Promise<ServiceResult<StudentWithRelations | null>> {
    try {
      const student = await prisma.hocVien.findUnique({
        where: { id },
        include: {
          ketQuaHocTap: {
            orderBy: { updatedAt: 'desc' },
          },
        },
      });

      if (!student) {
        return { success: false, error: 'Không tìm thấy học viên' };
      }

      return { success: true, data: student as StudentWithRelations };
    } catch (error) {
      console.error('[StudentService.findById] Error:', error);
      return { success: false, error: 'Lỗi khi tải thông tin học viên' };
    }
  }

  /**
   * Thống kê học viên
   */
  async getStats(
    options: ScopedQueryOptions
  ): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const [total, byLop, byKhoaHoc, grades] = await Promise.all([
        prisma.hocVien.count(),
        prisma.hocVien.groupBy({
          by: ['lop'],
          where: { lop: { not: null } },
          _count: true,
        }),
        prisma.hocVien.groupBy({
          by: ['khoaHoc'],
          where: { khoaHoc: { not: null } },
          _count: true,
        }),
        prisma.ketQuaHocTap.aggregate({
          _avg: { diemTongKet: true },
          _count: true,
        }),
      ]);

      return {
        success: true,
        data: {
          total,
          byLop: byLop.map((l) => ({ lop: l.lop, count: l._count })),
          byKhoaHoc: byKhoaHoc.map((k) => ({ khoaHoc: k.khoaHoc, count: k._count })),
          avgGrade: grades._avg.diemTongKet || 0,
          totalGrades: grades._count,
        },
      };
    } catch (error) {
      console.error('[StudentService.getStats] Error:', error);
      return { success: false, error: 'Lỗi khi tải thống kê học viên' };
    }
  }

  /**
   * Lấy kết quả học tập của học viên
   */
  async getGrades(
    options: ScopedQueryOptions,
    studentId: string
  ): Promise<ServiceResult<KetQuaHocTap[]>> {
    try {
      const grades = await prisma.ketQuaHocTap.findMany({
        where: { hocVienId: studentId },
        orderBy: { updatedAt: 'desc' },
      });

      return { success: true, data: grades };
    } catch (error) {
      console.error('[StudentService.getGrades] Error:', error);
      return { success: false, error: 'Lỗi khi tải kết quả học tập' };
    }
  }

  /**
   * Export học viên
   */
  async exportData(
    options: ScopedQueryOptions,
    filters: StudentFilters = {}
  ): Promise<ServiceResult<StudentWithRelations[]>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {
        ...(filters.lop && { lop: filters.lop }),
        ...(filters.khoaHoc && { khoaHoc: filters.khoaHoc }),
      };

      const data = await prisma.hocVien.findMany({
        where,
        orderBy: { hoTen: 'asc' },
      });

      return { success: true, data: data as StudentWithRelations[] };
    } catch (error) {
      console.error('[StudentService.exportData] Error:', error);
      return { success: false, error: 'Lỗi khi xuất dữ liệu học viên' };
    }
  }
}

export const StudentService = new StudentServiceClass();
