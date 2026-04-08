import "server-only";
/**
 * Audit Logging Service
 * Logs all important actions with PII masking and request tracing
 * 
 * Features:
 * - Auto-generates requestId for tracing
 * - Masks PII in before/after data
 * - Supports all CRUD operations
 * - Retention policy: 3 years
 */

import { prisma } from '@/lib/db';
import { maskPII, createAuditDiff } from './audit-masking';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@prisma/client';

/**
 * Audit action types
 */
export type AuditAction = 
  | 'CREATE'
  | 'UPDATE' 
  | 'DELETE'
  | 'VIEW'
  | 'EXPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'BULK_UPDATE'
  | 'BULK_DELETE';

/**
 * Resource types for categorization
 */
export type ResourceType =
  | 'USER'
  | 'PERSONNEL'
  | 'CAREER'
  | 'PARTY'
  | 'POLICY'
  | 'INSURANCE'
  | 'FAMILY'
  | 'UNIT'
  | 'RESEARCH'
  | 'PUBLICATION'
  | 'STUDENT'
  | 'COURSE'
  | 'GRADE'
  | 'ML_MODEL'
  | 'DATA_PIPELINE'
  | 'API_KEY'
  | 'INFRASTRUCTURE'
  | 'PERMISSION_GRANT'
  | 'SYSTEM';

/**
 * Context for audit logging
 */
export interface AuditContext {
  userId: string;
  role: UserRole | string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
}

/**
 * Options for audit log entry
 */
export interface AuditLogOptions {
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  changedFields?: string[];
  success?: boolean;
  errorMessage?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return uuidv4();
}

/**
 * Main audit logging function
 */
export async function logAudit(
  ctx: AuditContext,
  action: AuditAction,
  resourceType: ResourceType,
  resourceId: string | null,
  options: AuditLogOptions = {}
): Promise<string> {
  const requestId = ctx.requestId || generateRequestId();
  
  try {
    // Create diff with masked PII
    const diff = options.before || options.after
      ? createAuditDiff(options.before || null, options.after || null)
      : { before: null, after: null, changedFields: options.changedFields || [] };
    
    // Use raw SQL to insert (handles any schema differences)
    const result = await prisma.$executeRaw`
      INSERT INTO "audit_logs" (
        "id",
        "actorUserId",
        "actorRole",
        "actorIp",
        "actorUserAgent",
        "action",
        "resourceType",
        "resourceId",
        "beforeData",
        "afterData",
        "changedFields",
        "requestId",
        "endpoint",
        "httpMethod",
        "success",
        "errorMessage",
        "duration",
        "metadata",
        "createdAt"
      ) VALUES (
        ${uuidv4()},
        ${ctx.userId},
        ${ctx.role}::"UserRole",
        ${ctx.ip || null},
        ${ctx.userAgent || null},
        ${action},
        ${resourceType},
        ${resourceId},
        ${diff.before ? JSON.stringify(diff.before) : null}::jsonb,
        ${diff.after ? JSON.stringify(diff.after) : null}::jsonb,
        ${diff.changedFields}::text[],
        ${requestId},
        ${ctx.endpoint || null},
        ${ctx.method || null},
        ${options.success ?? true},
        ${options.errorMessage || null},
        ${options.duration || null},
        ${options.metadata ? JSON.stringify(options.metadata) : null}::jsonb,
        NOW()
      )
    `;
    
    return requestId;
  } catch (error) {
    // Log to console but don't fail the main operation
    console.error('[AuditLog] Failed to log audit:', error);
    return requestId;
  }
}

/**
 * Convenience function for logging CREATE actions
 */
export async function logCreate(
  ctx: AuditContext,
  resourceType: ResourceType,
  resourceId: string,
  data: Record<string, any>
): Promise<string> {
  return logAudit(ctx, 'CREATE', resourceType, resourceId, {
    after: data,
    success: true,
  });
}

/**
 * Convenience function for logging UPDATE actions
 */
export async function logUpdate(
  ctx: AuditContext,
  resourceType: ResourceType,
  resourceId: string,
  before: Record<string, any>,
  after: Record<string, any>
): Promise<string> {
  return logAudit(ctx, 'UPDATE', resourceType, resourceId, {
    before,
    after,
    success: true,
  });
}

/**
 * Convenience function for logging DELETE actions
 */
export async function logDelete(
  ctx: AuditContext,
  resourceType: ResourceType,
  resourceId: string,
  data: Record<string, any>
): Promise<string> {
  return logAudit(ctx, 'DELETE', resourceType, resourceId, {
    before: data,
    success: true,
  });
}

/**
 * Convenience function for logging VIEW actions
 */
export async function logView(
  ctx: AuditContext,
  resourceType: ResourceType,
  resourceId: string
): Promise<string> {
  return logAudit(ctx, 'VIEW', resourceType, resourceId, {
    success: true,
  });
}

/**
 * Convenience function for logging EXPORT actions
 */
export async function logExport(
  ctx: AuditContext,
  resourceType: ResourceType,
  count: number,
  format: string
): Promise<string> {
  return logAudit(ctx, 'EXPORT', resourceType, null, {
    success: true,
    metadata: { count, format },
  });
}

/**
 * Convenience function for logging LOGIN actions
 */
export async function logLogin(
  ctx: AuditContext,
  success: boolean,
  errorMessage?: string
): Promise<string> {
  return logAudit(ctx, 'LOGIN', 'USER', ctx.userId, {
    success,
    errorMessage,
  });
}

/**
 * Convenience function for logging errors
 */
export async function logError(
  ctx: AuditContext,
  action: AuditAction,
  resourceType: ResourceType,
  resourceId: string | null,
  errorMessage: string
): Promise<string> {
  return logAudit(ctx, action, resourceType, resourceId, {
    success: false,
    errorMessage,
  });
}

/**
 * Extract audit context from Next.js request
 */
export function extractAuditContext(
  userId: string,
  role: UserRole | string,
  request?: Request,
  existingRequestId?: string
): AuditContext {
  const headers = request?.headers;
  
  return {
    userId,
    role,
    ip: headers?.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || headers?.get('x-real-ip') 
      || 'unknown',
    userAgent: headers?.get('user-agent') || undefined,
    requestId: existingRequestId || generateRequestId(),
    endpoint: request?.url ? new URL(request.url).pathname : undefined,
    method: request?.method,
  };
}

/**
 * Cleanup old audit logs (retention: 3 years by default)
 */
export async function cleanupOldAuditLogs(
  retentionYears: number = 3
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - retentionYears);
  
  try {
    const result = await prisma.$executeRaw`
      DELETE FROM "audit_logs"
      WHERE "createdAt" < ${cutoffDate}
    `;
    
    console.log(`[AuditLog] Cleaned up ${result} old audit logs (before ${cutoffDate.toISOString()})`);
    return Number(result);
  } catch (error) {
    console.error('[AuditLog] Failed to cleanup old logs:', error);
    return 0;
  }
}

/**
 * Get audit logs for a specific resource
 */
export async function getAuditLogs(
  resourceType: ResourceType,
  resourceId?: string,
  options: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    action?: AuditAction;
  } = {}
) {
  const { limit = 50, offset = 0, startDate, endDate, action } = options;
  
  const where: any = {
    resourceType,
    ...(resourceId && { resourceId }),
    ...(action && { action }),
    ...(startDate && { createdAt: { gte: startDate } }),
    ...(endDate && { createdAt: { lte: endDate } }),
  };
  
  // Use raw query for compatibility
  const logs = await prisma.$queryRaw`
    SELECT 
      al.*,
      u."fullName" as "actorName",
      u.email as "actorEmail"
    FROM "audit_logs" al
    LEFT JOIN "users" u ON al."actorUserId" = u.id
    WHERE al."resourceType" = ${resourceType}
    ${resourceId ? prisma.$queryRaw`AND al."resourceId" = ${resourceId}` : prisma.$queryRaw``}
    ORDER BY al."createdAt" DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
  
  return logs;
}
