/**
 * RBAC Module Export
 * Function-based Authorization System
 * 
 * Sử dụng:
 * import { authorize, hasPermission, getUserPermissions } from '@/lib/rbac';
 * 
 * // Kiểm tra quyền
 * const result = await authorize(user, 'UPDATE_PERSONNEL', { resourceOwnerId: id });
 * if (!result.allowed) {
 *   return NextResponse.json({ error: result.deniedReason }, { status: 403 });
 * }
 */

// Types
export type {
  AuthUser,
  AuthContext,
  AuthResult,
  PermissionEntry,
  AuditLogData,
  SecurityEventType,
} from './types';

// Authorization
export {
  authorize,
  authorizeWithAudit,
  authorizeAny,
  authorizeAll,
  getLegacyPositionCode,
} from './authorize';

// Policy
export {
  getUserPermissions,
  hasPermission,
  getUserFunctionCodes,
  clearPermissionCache,
  hasModuleAccess,
} from './policy';

// Scope
export {
  checkScope,
  checkScopeAsync,
  getAccessibleUnitIds,
  isInSameHierarchy,
} from './scope';

// Middleware (API Route Integration)
export {
  // Inline checks
  requireFunction,
  requireAnyFunction,
  requireAllFunctions,
  requireAuth,
  // HOC wrappers
  withFunction,
  withAnyFunction,
  withAllFunctions,
  withAuth,
  // Helpers
  sessionToAuthUser,
  extractContext,
} from './middleware';

export type { RBACContext, RBACHandler, RequireResult } from './middleware';

// Function Codes (Constants)
export {
  PERSONNEL,
  TRAINING,
  RESEARCH,
  PARTY,
  POLICY,
  INSURANCE,
  AWARDS,
  STUDENT,
  SYSTEM,
  DASHBOARD,
  ALL_FUNCTION_CODES,
  MODULE_NAMES,
} from './function-codes';

export type { FunctionCode } from './function-codes';
