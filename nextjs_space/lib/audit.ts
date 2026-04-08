/**
 * AUDIT LOG & SECURITY EVENT HELPER
 * Ghi log theo chuẩn ATTT:
 * - Ghi ở SERVICE/API level (không ghi ở UI)
 * - Ghi cả SUCCESS và FAIL/DENIED
 * - Lưu trữ >= 5 năm
 */

import prisma from '@/lib/db';
import { UserRole } from '@prisma/client';

// Audit log data type
export interface AuditLogData {
  userId: string;
  /** Role của actor — nếu không cung cấp sẽ được tự động lấy từ DB */
  actorRole?: UserRole;
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
  metadata?: Record<string, unknown>;
  /** HTTP endpoint liên quan */
  endpoint?: string;
  /** HTTP method liên quan */
  httpMethod?: string;
  /** Request ID để trace cross-service */
  requestId?: string;
  /** Danh sách field đã thay đổi */
  changedFields?: string[];
}

// Security event data type
export interface SecurityEventData {
  userId?: string;
  eventType: SecurityEventType;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Security event types (SIEM-ready)
export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'UNAUTHORIZED_ACCESS'
  | 'DATA_BREACH_ATTEMPT'
  | 'MASS_DELETE'
  | 'ADMIN_ACTION'
  | 'PASSWORD_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'SENSITIVE_DATA_ACCESS'
  | 'EXPORT_DATA'
  | 'IMPORT_DATA'
  | 'SYSTEM_CONFIG_CHANGE'
  | 'RATE_LIMIT_EXCEEDED'; // v8.3: Rate limiting

/**
 * Ghi Audit Log vào bảng AuditLog (chuẩn ATTT)
 * Hỗ trợ đầy đủ: beforeData/afterData, changedFields, requestId, endpoint
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    // Resolve actorRole nếu không được cung cấp
    let actorRole = data.actorRole;
    if (!actorRole) {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { role: true },
      });
      actorRole = user?.role ?? 'GIANG_VIEN';
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: data.userId,
        actorRole,
        actorIp: data.ipAddress ?? null,
        actorUserAgent: data.userAgent ?? null,
        action: `[${data.functionCode}] ${data.action}`,
        resourceType: data.resourceType,
        resourceId: data.resourceId ?? null,
        beforeData: data.oldValue ? JSON.parse(JSON.stringify(sanitizeForLog(data.oldValue))) : undefined,
        afterData: data.newValue ? JSON.parse(JSON.stringify(sanitizeForLog(data.newValue))) : undefined,
        changedFields: data.changedFields ?? [],
        requestId: data.requestId ?? crypto.randomUUID(),
        endpoint: data.endpoint ?? null,
        httpMethod: data.httpMethod ?? null,
        success: data.result === 'SUCCESS',
        errorMessage: data.errorMessage ?? null,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      },
    });
  } catch (error) {
    // Không throw — audit thất bại không được chặn luồng nghiệp vụ
    console.error('[AUDIT_LOG_ERROR]', error);
    console.error('[AUDIT_DATA]', JSON.stringify(data));
  }
}

/**
 * Ghi Security Event (SIEM-ready)
 */
export async function logSecurityEvent(data: SecurityEventData): Promise<void> {
  const severity = data.severity || getSeverityByEventType(data.eventType);
  
  try {
    await prisma.systemLog.create({
      data: {
        action: `[SECURITY_EVENT] ${data.eventType}`,
        description: `Security event: ${data.eventType} - Severity: ${severity}`,
        level: severity === 'CRITICAL' || severity === 'HIGH' ? 'ERROR' : 'WARNING',
        category: 'SECURITY',
        metadata: JSON.parse(JSON.stringify({
          eventType: data.eventType,
          severity,
          details: sanitizeForLog(data.details),
          timestamp: new Date().toISOString(),
        })),
        userId: data.userId || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });

    // Console log for immediate alerting (integrate with monitoring)
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      console.warn(`[SECURITY_ALERT] ${data.eventType}`, {
        severity,
        userId: data.userId,
        details: data.details,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[SECURITY_LOG_ERROR]', error);
    console.error('[SECURITY_DATA]', JSON.stringify(data));
  }
}

/**
 * Ghi User Activity (backward compatibility)
 * Supports both string and object details for backward compatibility
 */
export async function logUserActivity(
  userId: string,
  action: string,
  details?: string | Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  try {
    const metadataValue = details 
      ? (typeof details === 'string' 
          ? { message: details } 
          : JSON.parse(JSON.stringify(sanitizeForLog(details))))
      : null;
      
    await prisma.systemLog.create({
      data: {
        action,
        description: `User activity: ${action}`,
        level: 'INFO',
        category: 'USER_MANAGEMENT',
        metadata: metadataValue,
        userId,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error('[USER_ACTIVITY_LOG_ERROR]', error);
  }
}

/**
 * Ghi Login Event
 */
export async function logLogin(
  userId: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  failReason?: string
): Promise<void> {
  await logSecurityEvent({
    userId,
    eventType: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
    details: {
      success,
      failReason,
    },
    ipAddress,
    userAgent,
    severity: success ? 'LOW' : 'MEDIUM',
  });
}

/**
 * Ghi Admin Action
 */
export async function logAdminAction(
  userId: string,
  action: string,
  targetType: string,
  targetId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  await logAudit({
    userId,
    functionCode: 'ADMIN_ACTION',
    action,
    resourceType: targetType,
    resourceId: targetId,
    newValue: details,
    result: 'SUCCESS',
    ipAddress,
  });

  await logSecurityEvent({
    userId,
    eventType: 'ADMIN_ACTION',
    details: {
      action,
      targetType,
      targetId,
      ...details,
    },
    ipAddress,
    severity: 'MEDIUM',
  });
}

/**
 * Ghi Data Export Event
 */
export async function logDataExport(
  userId: string,
  exportType: string,
  recordCount: number,
  filters?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  await logAudit({
    userId,
    functionCode: 'EXPORT_DATA',
    action: `Xuất dữ liệu ${exportType}`,
    resourceType: exportType,
    newValue: { recordCount, filters },
    result: 'SUCCESS',
    ipAddress,
  });

  await logSecurityEvent({
    userId,
    eventType: 'EXPORT_DATA',
    details: {
      exportType,
      recordCount,
      filters,
    },
    ipAddress,
    severity: recordCount > 100 ? 'MEDIUM' : 'LOW',
  });
}

/**
 * Ghi Sensitive Data Access
 */
export async function logSensitiveAccess(
  userId: string,
  dataType: string,
  targetId: string,
  ipAddress?: string
): Promise<void> {
  await logSecurityEvent({
    userId,
    eventType: 'SENSITIVE_DATA_ACCESS',
    details: {
      dataType,
      targetId,
    },
    ipAddress,
    severity: 'MEDIUM',
  });
}

/**
 * Ghi Mass Delete Event
 */
export async function logMassDelete(
  userId: string,
  resourceType: string,
  count: number,
  criteria?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  await logSecurityEvent({
    userId,
    eventType: 'MASS_DELETE',
    details: {
      resourceType,
      count,
      criteria,
    },
    ipAddress,
    severity: count > 10 ? 'HIGH' : 'MEDIUM',
  });
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Xác định severity theo event type
 */
function getSeverityByEventType(eventType: SecurityEventType): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const severityMap: Record<SecurityEventType, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
    LOGIN_SUCCESS: 'LOW',
    LOGIN_FAILED: 'MEDIUM',
    LOGOUT: 'LOW',
    UNAUTHORIZED_ACCESS: 'HIGH',
    DATA_BREACH_ATTEMPT: 'CRITICAL',
    MASS_DELETE: 'HIGH',
    ADMIN_ACTION: 'MEDIUM',
    PASSWORD_CHANGE: 'MEDIUM',
    PERMISSION_CHANGE: 'HIGH',
    SENSITIVE_DATA_ACCESS: 'MEDIUM',
    EXPORT_DATA: 'MEDIUM',
    IMPORT_DATA: 'MEDIUM',
    SYSTEM_CONFIG_CHANGE: 'HIGH',
    RATE_LIMIT_EXCEEDED: 'MEDIUM', // v8.3
  };
  return severityMap[eventType] || 'MEDIUM';
}

/**
 * Loại bỏ thông tin nhạy cảm trước khi ghi log
 */
function sanitizeForLog(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeForLog);
  }

  const sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'secret',
    'apiKey',
    'citizenId',
    'officerIdCard',
    'bankAccount',
    'insuranceNumber',
    'cccd',
    'cmnd',
    'cmtsq',
  ];

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (sensitiveFields.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
      sanitized[key] = '***HIDDEN***';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeForLog(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Lấy IP Address từ Request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

/**
 * Lấy User Agent từ Request headers
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}
