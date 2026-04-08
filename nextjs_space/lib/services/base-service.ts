/**
 * Base Service với tích hợp Scope-based filtering
 * Tất cả services kế thừa từ đây để có filter unitId tự động
 */

import { FunctionScope } from '@prisma/client';
import { AuthUser } from '@/lib/rbac/types';
import { getAccessibleUnitIds, checkScope } from '@/lib/rbac/scope';

export interface ScopedQueryOptions {
  user: AuthUser;
  scope: FunctionScope;
  includeInactive?: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

/**
 * Base Service class - cung cấp các phương thức chung
 */
export abstract class BaseService {
  protected abstract readonly resourceType: string;

  /**
   * Tạo filter unitId dựa trên scope
   */
  protected async getScopedUnitFilter(
    options: ScopedQueryOptions
  ): Promise<{ unitId?: { in: string[] } } | Record<string, never>> {
    const { user, scope } = options;

    if (scope === 'ACADEMY') {
      return {};
    }

    if (scope === 'SELF') {
      return {};
    }

    const accessibleUnitIds = await getAccessibleUnitIds(user, scope);
    if (accessibleUnitIds.length === 0) {
      return { unitId: { in: [] } };
    }

    return { unitId: { in: accessibleUnitIds } };
  }

  /**
   * Tạo filter owner dựa trên scope SELF
   */
  protected getSelfFilter(
    options: ScopedQueryOptions,
    ownerField: string = 'userId'
  ): Record<string, string> | Record<string, never> {
    const { user, scope } = options;

    if (scope === 'SELF') {
      return { [ownerField]: user.id };
    }

    return {};
  }

  /**
   * Kết hợp filter scope (unitId + owner)
   */
  protected async buildScopedFilter(
    options: ScopedQueryOptions,
    ownerField: string = 'userId'
  ): Promise<Record<string, unknown>> {
    const unitFilter = await this.getScopedUnitFilter(options);
    const selfFilter = this.getSelfFilter(options, ownerField);

    return {
      ...unitFilter,
      ...selfFilter,
    };
  }

  /**
   * Kiểm tra quyền truy cập resource cụ thể
   */
  protected async canAccessResource(
    options: ScopedQueryOptions,
    resourceOwnerId?: string,
    resourceUnitId?: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const { user, scope } = options;

    return checkScope(scope, user, {
      resourceOwnerId,
      resourceUnitId,
    });
  }

  /**
   * Tạo pagination response
   */
  protected createPaginatedResponse<T>(
    data: T[],
    total: number,
    pagination: PaginationOptions
  ): ServiceResult<T[]> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }
}
