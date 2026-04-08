import "server-only";
/**
 * Audit Diff Logger - Ghi log theo dạng diff
 * Phase 2: Thay vì lưu before/after full, chỉ lưu changes
 */

import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

/**
 * PII fields to mask in audit logs
 */
const PII_FIELDS = [
  'citizenId',
  'militaryIdNumber',
  'bankAccount',
  'phoneNumber',
  'insuranceNumber',
  'healthInsuranceNumber',
  'partyCardNumber',
  'email',
  'password',
  'passwordHash',
  'token',
  'apiKey',
  'keyHash',
];

/**
 * Mask sensitive value
 */
export function maskValue(value: any): string {
  if (value === null || value === undefined) return '[null]';
  
  const str = String(value);
  if (str.length <= 4) {
    return '*'.repeat(str.length);
  }
  
  // Show last 4 chars
  return '*'.repeat(str.length - 4) + str.slice(-4);
}

/**
 * Check if field should be masked
 */
export function shouldMask(fieldName: string): boolean {
  const lowerField = fieldName.toLowerCase();
  return PII_FIELDS.some(pii => lowerField.includes(pii.toLowerCase()));
}

/**
 * Single field change
 */
export interface FieldChange {
  field: string;
  oldValue: string;
  newValue: string;
  masked: boolean;
}

/**
 * Calculate diff between two objects
 */
export function calculateDiff(
  before: Record<string, any> | null,
  after: Record<string, any> | null
): FieldChange[] {
  const changes: FieldChange[] = [];
  
  if (!before && !after) return changes;
  
  // CREATE - all fields are new
  if (!before && after) {
    for (const [key, value] of Object.entries(after)) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue;
      const masked = shouldMask(key);
      changes.push({
        field: key,
        oldValue: '[none]',
        newValue: masked ? maskValue(value) : formatValue(value),
        masked,
      });
    }
    return changes;
  }
  
  // DELETE - all fields removed
  if (before && !after) {
    for (const [key, value] of Object.entries(before)) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt' || key === 'deletedAt') continue;
      const masked = shouldMask(key);
      changes.push({
        field: key,
        oldValue: masked ? maskValue(value) : formatValue(value),
        newValue: '[deleted]',
        masked,
      });
    }
    return changes;
  }
  
  // UPDATE - compare fields
  if (before && after) {
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    
    for (const key of allKeys) {
      // Skip metadata fields
      if (['id', 'createdAt', 'updatedAt', 'version'].includes(key)) continue;
      
      const oldVal = before[key];
      const newVal = after[key];
      
      // Check if changed
      if (!isEqual(oldVal, newVal)) {
        const masked = shouldMask(key);
        changes.push({
          field: key,
          oldValue: masked ? maskValue(oldVal) : formatValue(oldVal),
          newValue: masked ? maskValue(newVal) : formatValue(newVal),
          masked,
        });
      }
    }
  }
  
  return changes;
}

/**
 * Format value for display
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) return '[null]';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Deep equality check
 */
function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a === undefined || b === undefined) return false;
  
  // Date comparison
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  
  // Object comparison
  if (typeof a === 'object' && typeof b === 'object') {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  
  return String(a) === String(b);
}

/**
 * Audit context
 */
export interface AuditDiffContext {
  userId: string;
  role: UserRole | string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Resource types
 */
export type ResourceType =
  | 'PERSONNEL'
  | 'CAREER'
  | 'PARTY'
  | 'INSURANCE'
  | 'FAMILY'
  | 'USER'
  | 'UNIT';

/**
 * Action types
 */
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT';

/**
 * Log audit with diff
 */
export async function logAuditDiff(
  ctx: AuditDiffContext,
  action: AuditAction,
  resourceType: ResourceType,
  resourceId: string,
  before: Record<string, any> | null,
  after: Record<string, any> | null,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const changes = calculateDiff(before, after);
    const changedFields = changes.map(c => c.field);
    
    await prisma.auditLog.create({
      data: {
        actorUserId: ctx.userId,
        actorRole: ctx.role as UserRole,
        actorIp: ctx.ip || 'unknown',
        actorUserAgent: ctx.userAgent || undefined,
        requestId: ctx.requestId || `audit-${Date.now()}`,
        action,
        resourceType,
        resourceId,
        // Store diff instead of full before/after
        beforeData: JSON.parse(JSON.stringify({ _type: 'diff', changes })),
        changedFields,
        success: true,
        metadata: metadata || undefined,
      },
    });
  } catch (error) {
    console.error('[AuditDiff] Failed to log:', error);
  }
}

/**
 * Quick log helpers
 */
export const auditDiff = {
  create: (ctx: AuditDiffContext, type: ResourceType, id: string, data: Record<string, any>) =>
    logAuditDiff(ctx, 'CREATE', type, id, null, data),
    
  update: (ctx: AuditDiffContext, type: ResourceType, id: string, before: Record<string, any>, after: Record<string, any>) =>
    logAuditDiff(ctx, 'UPDATE', type, id, before, after),
    
  delete: (ctx: AuditDiffContext, type: ResourceType, id: string, data: Record<string, any>) =>
    logAuditDiff(ctx, 'DELETE', type, id, data, null),
    
  view: (ctx: AuditDiffContext, type: ResourceType, id: string) =>
    logAuditDiff(ctx, 'VIEW', type, id, null, null),
    
  export: (ctx: AuditDiffContext, type: ResourceType, id: string, meta?: Record<string, any>) =>
    logAuditDiff(ctx, 'EXPORT', type, id, null, null, meta),
};
