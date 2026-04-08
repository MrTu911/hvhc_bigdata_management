/**
 * RBAC Type Definitions
 * Function-based Authorization Types
 */

import { FunctionScope } from '@prisma/client';

// User context for authorization
export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: string; // Legacy role for backward compatibility
  unitId?: string | null;
  department?: string | null;
}

// Authorization context
export interface AuthContext {
  resourceId?: string;       // ID of resource being accessed
  resourceOwnerId?: string;  // Owner of the resource
  resourceUnitId?: string;   // Unit of the resource
  targetUnitId?: string;     // Target unit (for unit-specific operations)
  additionalData?: Record<string, unknown>;
}

// Authorization result
export interface AuthResult {
  allowed: boolean;
  reason?: string;
  scope?: FunctionScope;
  deniedReason?: string;
}

// Permission entry from database
export interface PermissionEntry {
  functionCode: string;
  functionName: string;
  scope: FunctionScope;
  positionCode: string;
  positionName: string;
  unitId?: string | null;
  conditions?: Record<string, unknown> | null;
}

// Audit log data
export interface AuditLogData {
  userId: string;
  functionCode: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  result: 'SUCCESS' | 'FAIL' | 'DENIED';
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
}

// Security event types
export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'UNAUTHORIZED_ACCESS'
  | 'DATA_BREACH_ATTEMPT'
  | 'MASS_DELETE'
  | 'ADMIN_ACTION'
  | 'PASSWORD_CHANGE'
  | 'PERMISSION_CHANGE';
