import "server-only";

/**
 * Authentication & Authorization Utilities v8.3
 * 
 * FUNCTION-BASED RBAC - Không bypass theo role
 * 
 * Sử dụng authorize() từ lib/rbac/authorize.ts
 */

import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { redirect } from 'next/navigation';
import { authorize } from './rbac/authorize';
import { getUserPermissions } from './rbac/policy';

/**
 * Lấy session hiện tại (server-side)
 * Nếu không có session, redirect về trang login
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }
  
  return session;
}

/**
 * Kiểm tra user có quyền (function code) cụ thể
 * FUNCTION-BASED - Không bypass theo role
 * 
 * @param functionCode - Mã chức năng cần kiểm tra
 */
export async function requirePermission(functionCode: string) {
  const session = await requireAuth();
  
  const result = await authorize(
    { 
      id: session.user.id!, 
      email: session.user.email!,
      role: session.user.role || '',
      unitId: (session.user as any).unitId || undefined,
    }, 
    functionCode
  );
  
  if (!result.allowed) {
    // Redirect về dashboard chung thay vì role-based
    redirect('/dashboard?error=access_denied');
  }
  
  return session;
}

/**
 * Kiểm tra user có bất kỳ quyền nào trong danh sách
 * FUNCTION-BASED - Không bypass theo role
 */
export async function requireAnyPermission(functionCodes: string[]) {
  const session = await requireAuth();
  
  // Lấy permissions của user (array of PermissionEntry)
  const permissions = await getUserPermissions(session.user.id!);
  
  // Extract function codes từ permissions
  const userFunctionCodes = permissions.map(p => p.functionCode);
  
  const hasAny = functionCodes.some(code => userFunctionCodes.includes(code));
  
  if (!hasAny) {
    redirect('/dashboard?error=access_denied');
  }
  
  return session;
}

/**
 * @deprecated v8.3: Không nên kiểm tra role trực tiếp
 * Sử dụng requirePermission() hoặc requireAnyPermission() thay thế
 */
export async function requireRole(..._allowedRoles: string[]) {
  console.warn('[DEPRECATED] requireRole() is deprecated. Use requirePermission() instead.');
  const session = await requireAuth();
  // Không kiểm tra role, chỉ yêu cầu authenticated
  return session;
}

/**
 * @deprecated v8.3: Không nên kiểm tra admin theo role
 * Sử dụng requirePermission('SYSTEM.MANAGE_USERS') thay thế
 */
export async function requireAdmin() {
  console.warn('[DEPRECATED] requireAdmin() is deprecated. Use requirePermission() instead.');
  return requirePermission('SYSTEM.MANAGE_USERS');
}

/**
 * Lấy thông tin user hiện tại (server-side)
 * Không bắt buộc phải đăng nhập
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}
