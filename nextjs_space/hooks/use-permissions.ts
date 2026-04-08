/**
 * Hook: Lấy quyền hiệu lực của user đang đăng nhập
 * 
 * v8.3 ENHANCEMENT:
 * - Ưu tiên dùng session.user.functionCodes (từ JWT, không cần fetch)
 * - SWR chỉ dùng để lấy thêm scopeByFunction và chi tiết positions (lazy load)
 * - Tích hợp unitId vào scope checking
 * 
 * CHUẨN FUNCTION-BASED RBAC:
 * - Không bypass theo role string (QUAN_TRI_HE_THONG)
 * - Admin phải có Position = SYSTEM_ADMIN với đầy đủ functionCodes
 * - Tất cả logic dựa trên functionCodes từ session/database
 */

import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { useMemo, useCallback } from 'react';

interface UserPermissions {
  functionCodes: string[];
  scopeByFunction: Record<string, string>;
  positions: Array<{
    id: string;
    code: string;
    name: string;
    unitId?: string;
    unitName?: string;
    isPrimary: boolean;
  }>;
  role: string;
}

// Scope priority order (higher = broader access)
const SCOPE_ORDER = { 'SELF': 1, 'INDIVIDUAL': 1, 'UNIT': 2, 'DEPARTMENT': 3, 'ACADEMY': 4 } as const;
type ScopeType = keyof typeof SCOPE_ORDER;

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch permissions');
  return res.json();
};

export function usePermissions() {
  const { data: session, status } = useSession();
  
  // v8.3: Primary source - từ JWT session (instant, no loading)
  const sessionFunctionCodes = session?.user?.functionCodes || [];
  const sessionUnitId = session?.user?.unitId || null;
  const sessionPrimaryPosition = session?.user?.primaryPositionCode || null;
  
  // v8.3: Secondary source - từ API (lazy load for scopeByFunction & positions)
  // Chỉ fetch khi cần scope/positions details, không block UI
  const { data: apiData, error, isLoading: apiLoading, mutate } = useSWR<UserPermissions>(
    status === 'authenticated' ? '/api/me/permissions' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 giây (tăng vì session đã có data)
    }
  );

  // Optimize: Convert array to Set for O(1) lookup
  // Ưu tiên session data (instant), fallback to API data
  const functionCodeSet = useMemo(() => {
    const codes = sessionFunctionCodes.length > 0 
      ? sessionFunctionCodes 
      : (apiData?.functionCodes || []);
    return new Set(codes);
  }, [sessionFunctionCodes, apiData?.functionCodes]);

  // v8.3: User's unitId từ session (instant)
  const userUnitId = useMemo(() => {
    return sessionUnitId;
  }, [sessionUnitId]);

  // Check if user has SYSTEM_ADMIN position
  const isSystemAdmin = useMemo(() => {
    // Check từ session trước (instant)
    if (sessionPrimaryPosition === 'SYSTEM_ADMIN') return true;
    // Fallback check từ API
    if (apiData?.positions) {
      return apiData.positions.some(p => p.code === 'SYSTEM_ADMIN');
    }
    return false;
  }, [sessionPrimaryPosition, apiData?.positions]);

  // v8.3: Loading state - chỉ true nếu chưa có session
  // Nếu session có data thì không cần chờ API
  const isLoading = useMemo(() => {
    if (status === 'loading') return true;
    // Nếu session có functionCodes → không cần chờ API
    if (sessionFunctionCodes.length > 0) return false;
    // Nếu session không có data → chờ API
    return apiLoading;
  }, [status, sessionFunctionCodes.length, apiLoading]);

  // Kiểm tra xem user có quyền nào đó không
  const hasPermission = useCallback((functionCode: string): boolean => {
    if (status !== 'authenticated') return false;
    // System Admin có full quyền
    if (isSystemAdmin) return true;
    return functionCodeSet.has(functionCode);
  }, [status, isSystemAdmin, functionCodeSet]);

  // Kiểm tra xem user có bất kỳ quyền nào trong danh sách
  const hasAnyPermission = useCallback((functionCodes: string[]): boolean => {
    if (status !== 'authenticated') return false;
    if (isSystemAdmin) return true;
    return functionCodes.some(code => functionCodeSet.has(code));
  }, [status, isSystemAdmin, functionCodeSet]);

  // Kiểm tra xem user có tất cả quyền trong danh sách
  const hasAllPermissions = useCallback((functionCodes: string[]): boolean => {
    if (status !== 'authenticated') return false;
    if (isSystemAdmin) return true;
    return functionCodes.every(code => functionCodeSet.has(code));
  }, [status, isSystemAdmin, functionCodeSet]);

  // Lấy scope của 1 quyền (từ API data)
  const getScope = useCallback((functionCode: string): string | null => {
    if (isSystemAdmin) return 'ACADEMY';
    return apiData?.scopeByFunction?.[functionCode] || null;
  }, [isSystemAdmin, apiData?.scopeByFunction]);

  // Kiểm tra scope có đủ rộng không
  const hasScopeAtLeast = useCallback((functionCode: string, requiredScope: ScopeType): boolean => {
    const userScope = getScope(functionCode);
    if (!userScope) return false;
    const userLevel = SCOPE_ORDER[userScope as ScopeType] || 0;
    const requiredLevel = SCOPE_ORDER[requiredScope] || 0;
    return userLevel >= requiredLevel;
  }, [getScope]);

  /**
   * v8.3: Kiểm tra quyền truy cập theo scope và unitId
   * 
   * @param functionCode - Mã quyền cần kiểm tra
   * @param targetUnitId - ID đơn vị của resource cần truy cập
   * @param targetOwnerId - (optional) ID chủ sở hữu resource
   * @returns true nếu user có quyền truy cập
   * 
   * Logic:
   * - ACADEMY scope: truy cập mọi đơn vị
   * - DEPARTMENT scope: truy cập đơn vị thuộc department của user
   * - UNIT scope: chỉ truy cập đơn vị của user
   * - SELF/INDIVIDUAL scope: chỉ truy cập resource của chính mình
   */
  const checkScopeAccess = useCallback((
    functionCode: string,
    targetUnitId?: string | null,
    targetOwnerId?: string | null
  ): boolean => {
    // Không có quyền → DENY
    if (!hasPermission(functionCode)) return false;
    
    // System Admin → full access
    if (isSystemAdmin) return true;
    
    const scope = getScope(functionCode);
    if (!scope) return false;
    
    switch (scope) {
      case 'ACADEMY':
        // Toàn học viện → luôn có quyền
        return true;
        
      case 'DEPARTMENT':
        // TODO: Cần thêm logic kiểm tra department hierarchy
        // Tạm thời: nếu có unitId thì kiểm tra, không có thì cho qua
        if (!targetUnitId) return true;
        // Fallback: chỉ check cùng unit (chờ implement department tree)
        return targetUnitId === userUnitId;
        
      case 'UNIT':
        // Chỉ đơn vị của user
        if (!targetUnitId) return true;
        return targetUnitId === userUnitId;
        
      case 'SELF':
      case 'INDIVIDUAL':
        // Chỉ resource của chính mình
        if (!targetOwnerId) return true;
        return targetOwnerId === session?.user?.id;
        
      default:
        return false;
    }
  }, [hasPermission, isSystemAdmin, getScope, userUnitId, session?.user?.id]);

  // Kiểm tra xem user có chức vụ nào đó không
  const hasPosition = useCallback((positionCode: string, unitId?: string): boolean => {
    // Check session first
    if (sessionPrimaryPosition === positionCode) {
      if (!unitId || sessionUnitId === unitId) return true;
    }
    // Check API data for non-primary positions
    if (!apiData?.positions) return false;
    if (unitId) {
      return apiData.positions.some(p => p.code === positionCode && p.unitId === unitId);
    }
    return apiData.positions.some(p => p.code === positionCode);
  }, [sessionPrimaryPosition, sessionUnitId, apiData?.positions]);

  // Lấy chức vụ chính
  const getPrimaryPosition = useCallback(() => {
    // Return từ session (instant) nếu có
    if (sessionPrimaryPosition) {
      return {
        code: sessionPrimaryPosition,
        unitId: sessionUnitId,
        isPrimary: true,
      };
    }
    // Fallback to API data
    if (!apiData?.positions) return null;
    return apiData.positions.find(p => p.isPrimary) || apiData.positions[0] || null;
  }, [sessionPrimaryPosition, sessionUnitId, apiData?.positions]);

  // v8.3: Merged permissions object (session + API)
  const permissions = useMemo(() => {
    return {
      functionCodes: Array.from(functionCodeSet),
      scopeByFunction: apiData?.scopeByFunction || {},
      positions: apiData?.positions || [],
      role: session?.user?.role || apiData?.role || '',
      unitId: userUnitId,
      primaryPositionCode: sessionPrimaryPosition,
    };
  }, [functionCodeSet, apiData, session?.user?.role, userUnitId, sessionPrimaryPosition]);

  return {
    // Core data
    permissions,
    functionCodeSet,
    userUnitId, // v8.3: Expose unitId directly
    
    // Status
    isLoading,
    isAuthenticated: status === 'authenticated',
    error,
    
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Scope checks
    getScope,
    hasScopeAtLeast,
    checkScopeAccess, // v8.3: New scope-aware check
    
    // Position checks
    hasPosition,
    getPrimaryPosition,
    
    // Admin check (based on position, not role string)
    isAdmin: isSystemAdmin,
    
    // Actions
    refresh: mutate,
  };
}

/**
 * Hook: Kiểm tra 1 quyền cụ thể
 */
export function useHasPermission(permissionCode: string) {
  const { hasPermission, isLoading } = usePermissions();
  return {
    hasPermission: hasPermission(permissionCode),
    loading: isLoading
  };
}

/**
 * Hook: Kiểm tra role
 * 
 * @deprecated v8.3: Không nên kiểm tra role trực tiếp
 * Sử dụng usePermissions().hasPermission() thay thế
 * Role chỉ nên dùng cho legacy UI, không dùng cho authorization
 */
export function useHasRole(allowedRoles: string[]) {
  const { data: session } = useSession();
  const userRole = session?.user?.role || '';
  
  // KHÔNG bypass theo QUAN_TRI_HE_THONG
  // Authorization phải dựa vào functionCodes
  return {
    hasRole: allowedRoles.includes(userRole),
    userRole
  };
}

/**
 * Hook: Lấy tất cả quyền (alias)
 * @param fetchAll - nếu true thì load tất cả permissions từ system (cho admin)
 */
export function useAllPermissions(fetchAll: boolean = false) {
  const result = usePermissions();
  return {
    ...result,
    permissions: result.permissions?.functionCodes || [],
    loading: result.isLoading
  };
}

/**
 * Hook: Lấy quyền user (alias)
 */
export function useUserPermissions() {
  return usePermissions();
}
