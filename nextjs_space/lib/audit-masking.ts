/**
 * PII Masking for Audit Logs
 * Masks sensitive personal information before logging
 * 
 * Rules:
 * - Completely mask short values (<=4 chars)
 * - Keep last 4 chars for longer values
 * - Never log passwords in any form
 */

/**
 * Fields that must be masked in audit logs
 */
const PII_FIELDS = [
  // Identity
  'citizenId',
  'militaryIdNumber', 
  'cmtsq',
  'cccd',
  
  // Financial
  'bankAccount',
  'bankAccountNumber',
  'insuranceNumber',
  'healthInsuranceNumber',
  'bhxh',
  'bhyt',
  
  // Contact
  'phoneNumber',
  'phone',
  'mobile',
  'email',
  
  // Party
  'partyCardNumber',
  
  // Auth (never log)
  'password',
  'passwordHash',
  'newPassword',
  'oldPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secretKey',
];

/**
 * Fields to completely remove from logs
 */
const REMOVE_FIELDS = [
  'password',
  'passwordHash',
  'newPassword', 
  'oldPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secretKey',
  'encryptionKey',
];

/**
 * Mask a single value
 * "123456789012" → "********9012"
 * "1234" → "****"
 */
export function maskValue(value: string | null | undefined): string {
  if (!value) return '****';
  
  const str = String(value);
  
  if (str.length <= 4) {
    return '*'.repeat(str.length || 4);
  }
  
  // Keep last 4 characters
  return '*'.repeat(str.length - 4) + str.slice(-4);
}

/**
 * Mask email address
 * "user@example.com" → "u***@e***.com"
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '****@****.***';
  
  const parts = email.split('@');
  if (parts.length !== 2) return maskValue(email);
  
  const [local, domain] = parts;
  const domainParts = domain.split('.');
  
  const maskedLocal = local.length > 1 
    ? local[0] + '*'.repeat(local.length - 1)
    : '*';
  
  const maskedDomain = domainParts.map((part, i) => 
    i === domainParts.length - 1 
      ? part 
      : (part.length > 1 ? part[0] + '*'.repeat(part.length - 1) : '*')
  ).join('.');
  
  return `${maskedLocal}@${maskedDomain}`;
}

/**
 * Check if a field name is PII
 */
export function isPIIField(fieldName: string): boolean {
  const lowerField = fieldName.toLowerCase();
  return PII_FIELDS.some(pii => lowerField.includes(pii.toLowerCase()));
}

/**
 * Check if a field should be removed entirely
 */
export function shouldRemoveField(fieldName: string): boolean {
  const lowerField = fieldName.toLowerCase();
  return REMOVE_FIELDS.some(remove => lowerField.includes(remove.toLowerCase()));
}

/**
 * Mask PII in a data object (shallow)
 * Returns a new object with PII fields masked
 */
export function maskPII<T extends Record<string, any>>(data: T | null | undefined): Record<string, any> | null {
  if (!data) return null;
  
  const masked: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Remove sensitive auth fields entirely
    if (shouldRemoveField(key)) {
      masked[key] = '[REDACTED]';
      continue;
    }
    
    // Mask PII fields
    if (isPIIField(key)) {
      if (key.toLowerCase().includes('email')) {
        masked[key] = maskEmail(value);
      } else {
        masked[key] = maskValue(value);
      }
      continue;
    }
    
    // Handle nested objects (shallow - one level)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      masked[key] = maskPII(value);
      continue;
    }
    
    // Keep other values as-is
    masked[key] = value;
  }
  
  return masked;
}

/**
 * Get list of changed fields between two objects
 * Used for audit logging
 */
export function getChangedFields(
  before: Record<string, any> | null,
  after: Record<string, any> | null
): string[] {
  if (!before && !after) return [];
  if (!before) return Object.keys(after || {});
  if (!after) return Object.keys(before);
  
  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  
  for (const key of allKeys) {
    // Skip functions and undefined
    if (typeof before[key] === 'function' || typeof after[key] === 'function') {
      continue;
    }
    
    // Compare values
    const beforeVal = JSON.stringify(before[key]);
    const afterVal = JSON.stringify(after[key]);
    
    if (beforeVal !== afterVal) {
      changed.push(key);
    }
  }
  
  return changed;
}

/**
 * Create a safe diff object for audit logging
 * Only includes changed fields, with PII masked
 */
export function createAuditDiff(
  before: Record<string, any> | null,
  after: Record<string, any> | null
): { before: Record<string, any> | null; after: Record<string, any> | null; changedFields: string[] } {
  const changedFields = getChangedFields(before, after);
  
  // Only include changed fields in before/after
  const filteredBefore: Record<string, any> = {};
  const filteredAfter: Record<string, any> = {};
  
  for (const field of changedFields) {
    if (before && field in before) {
      filteredBefore[field] = before[field];
    }
    if (after && field in after) {
      filteredAfter[field] = after[field];
    }
  }
  
  return {
    before: Object.keys(filteredBefore).length > 0 ? maskPII(filteredBefore) : null,
    after: Object.keys(filteredAfter).length > 0 ? maskPII(filteredAfter) : null,
    changedFields,
  };
}
