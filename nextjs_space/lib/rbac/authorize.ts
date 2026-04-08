/**
 * RBAC Authorization Engine v8.3
 * 
 * FUNCTION-BASED RBAC - KHÔNG CÓ LEGACY FALLBACK
 * 
 * Nguyên tắc:
 * 1. Quyền dựa hoàn toàn vào Position → PositionFunction
 * 2. KHÔNG bypass theo role string (QUAN_TRI_HE_THONG, ADMIN)
 * 3. FAIL-CLOSED: Nếu không load được permissions → DENY
 * 4. Admin phải có Position = SYSTEM_ADMIN với đầy đủ functionCodes
 * 
 * Sử dụng:
 * const result = await authorize(user, 'UPDATE_PERSONNEL', { resourceOwnerId: personnelId });
 * if (!result.allowed) {
 *   return NextResponse.json({ error: result.deniedReason }, { status: 403 });
 * }
 */

import { FunctionScope } from '@prisma/client';
import { AuthUser, AuthContext, AuthResult } from './types';
import { hasPermission, getUserPermissions } from './policy';
import { checkScope, checkScopeAsync } from './scope';
import { logAudit, logSecurityEvent } from '../audit';

/**
 * Legacy role → Position mapping
 * CHỈ dùng cho migration/seed scripts, KHÔNG dùng runtime authorization
 * @deprecated Sẽ được xóa sau khi hoàn tất migration
 */
export const LEGACY_ROLE_TO_POSITION: Record<string, string> = {
  ADMIN: 'SYSTEM_ADMIN',
  QUAN_TRI_HE_THONG: 'SYSTEM_ADMIN',
  CHI_HUY_HOC_VIEN: 'PHO_GIAM_DOC',
  CHI_HUY_KHOA_PHONG: 'TRUONG_KHOA',
  CHU_NHIEM_BO_MON: 'CHU_NHIEM_BO_MON',
  GIANG_VIEN: 'GIANG_VIEN',
  NGHIEN_CUU_VIEN: 'NGHIEN_CUU_VIEN',
  HOC_VIEN: 'HOC_VIEN_QUAN_SU',
  HOC_VIEN_SINH_VIEN: 'HOC_VIEN_QUAN_SU',
  KY_THUAT_VIEN: 'KY_THUAT_VIEN',
};

/**
 * HÀM CHÍNH: Kiểm tra quyền (Function-based RBAC)
 * 
 * @param user - User hiện tại
 * @param functionCode - Mã chức năng cần kiểm tra
 * @param context - Ngữ cảnh (resource, unit...)
 * @returns AuthResult
 */
export async function authorize(
  user: AuthUser | null | undefined,
  functionCode: string,
  context: AuthContext = {}
): Promise<AuthResult> {
  // 1. FAIL-CLOSED: User chưa đăng nhập → DENY
  if (!user || !user.id) {
    return {
      allowed: false,
      deniedReason: 'Vui lòng đăng nhập để thực hiện thao tác này',
    };
  }

  try {
    // 2. Kiểm tra quyền từ UserPosition → PositionFunction (Function-based RBAC)
    const { hasPermission: hasPerm, scope, permission } = await hasPermission(user.id, functionCode);

    // 3. FAIL-CLOSED: Không có quyền trong database → DENY
    if (!hasPerm || !scope) {
      return {
        allowed: false,
        deniedReason: `Bạn không có quyền thực hiện chức năng: ${functionCode}`,
      };
    }

    // 4. Kiểm tra scope (INDIVIDUAL, UNIT, DEPARTMENT, ACADEMY)
    // Sử dụng async check cho DEPARTMENT scope
    const scopeCheck = scope === 'DEPARTMENT' 
      ? await checkScopeAsync(scope, user, context)
      : checkScope(scope, user, context);
    
    if (!scopeCheck.allowed) {
      return {
        allowed: false,
        deniedReason: scopeCheck.reason || 'Không đủ quyền trong phạm vi này',
      };
    }

    // 5. PASS: Có quyền và scope hợp lệ
    return {
      allowed: true,
      scope,
      reason: `Quyền ${functionCode} với scope ${scope}`,
    };

  } catch (error) {
    // FAIL-CLOSED: Lỗi hệ thống → DENY (không allow by default)
    console.error('[RBAC] Authorization error:', error);
    return {
      allowed: false,
      deniedReason: 'Lỗi kiểm tra quyền. Vui lòng thử lại.',
    };
  }
}

/**
 * Kiểm tra quyền và ghi audit log
 */
export async function authorizeWithAudit(
  user: AuthUser | null | undefined,
  functionCode: string,
  context: AuthContext & {
    resourceType: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<AuthResult> {
  const result = await authorize(user, functionCode, context);

  // Ghi audit log
  if (user?.id) {
    await logAudit({
      userId: user.id,
      functionCode,
      action: context.action,
      resourceType: context.resourceType,
      resourceId: context.resourceId,
      result: result.allowed ? 'SUCCESS' : 'DENIED',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    // Ghi security event nếu bị từ chối
    if (!result.allowed) {
      await logSecurityEvent({
        userId: user.id,
        eventType: 'UNAUTHORIZED_ACCESS',
        details: {
          functionCode,
          resourceType: context.resourceType,
          resourceId: context.resourceId,
          reason: result.deniedReason,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }
  }

  return result;
}

/**
 * Kiểm tra nhiều quyền cùng lúc (OR logic)
 */
export async function authorizeAny(
  user: AuthUser | null | undefined,
  functionCodes: string[],
  context: AuthContext = {}
): Promise<AuthResult> {
  for (const code of functionCodes) {
    const result = await authorize(user, code, context);
    if (result.allowed) {
      return result;
    }
  }

  return {
    allowed: false,
    deniedReason: `Bạn không có quyền thực hiện bất kỳ chức năng nào trong: ${functionCodes.join(', ')}`,
  };
}

/**
 * Kiểm tra tất cả quyền (AND logic)
 */
export async function authorizeAll(
  user: AuthUser | null | undefined,
  functionCodes: string[],
  context: AuthContext = {}
): Promise<AuthResult> {
  for (const code of functionCodes) {
    const result = await authorize(user, code, context);
    if (!result.allowed) {
      return result;
    }
  }

  return {
    allowed: true,
    reason: `Có tất cả quyền: ${functionCodes.join(', ')}`,
  };
}

/**
 * Chuyển đổi legacy role sang position code
 * CHỈ dùng cho migration/seed scripts
 * @deprecated Sẽ được xóa sau khi hoàn tất migration
 */
export function getLegacyPositionCode(role: string): string {
  return LEGACY_ROLE_TO_POSITION[role] || 'HOC_VIEN_QUAN_SU';
}
