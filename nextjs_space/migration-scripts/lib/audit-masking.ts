/**
 * lib/audit-masking.ts
 * Mask PII fields trước khi lưu vào AuditLog
 * Khắc phục: Không mask PII khi log (lỗi #2)
 */

// ─── Danh sách PII fields ────────────────────────────────────────────────────

export const PII_FIELDS = new Set([
  // Định danh cá nhân
  'citizenId',
  'militaryIdNumber',
  'passportNumber',
  'nationalId',

  // Bảo hiểm / tài chính
  'insuranceNumber',
  'healthInsuranceNumber',
  'bankAccount',
  'bankAccountName',
  'taxCode',

  // Đảng / chính trị
  'partyCardNumber',

  // Liên lạc
  'phoneNumber',
  'email',
  'personalEmail',

  // Bảo mật
  'password',
  'passwordHash',
  'hashedPassword',
  'token',
  'refreshToken',
  'apiKey',
  'secretKey',
]);

// ─── Masking strategies ───────────────────────────────────────────────────────

type MaskStrategy = 'last4' | 'first2last2' | 'full' | 'email';

const FIELD_STRATEGY: Record<string, MaskStrategy> = {
  citizenId:              'last4',
  militaryIdNumber:       'last4',
  passportNumber:         'last4',
  insuranceNumber:        'last4',
  healthInsuranceNumber:  'last4',
  partyCardNumber:        'last4',
  bankAccount:            'last4',
  phoneNumber:            'first2last2',
  email:                  'email',
  personalEmail:          'email',
  password:               'full',
  passwordHash:           'full',
  hashedPassword:         'full',
  token:                  'full',
  refreshToken:           'full',
  apiKey:                 'full',
  secretKey:              'full',
};

function maskValue(value: string, strategy: MaskStrategy): string {
  if (!value || typeof value !== 'string') return value;

  switch (strategy) {
    case 'last4':
      // "123456789012" → "********9012"
      return value.length <= 4
        ? '****'
        : '*'.repeat(value.length - 4) + value.slice(-4);

    case 'first2last2':
      // "0912345678" → "09******78"
      return value.length <= 4
        ? '****'
        : value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2);

    case 'email':
      // "nguyenvana@military.vn" → "ng*****@military.vn"
      const [local, domain] = value.split('@');
      if (!domain) return '****@****';
      const maskedLocal = local.length <= 2
        ? '**'
        : local.slice(0, 2) + '*'.repeat(Math.min(local.length - 2, 5));
      return `${maskedLocal}@${domain}`;

    case 'full':
      return '[REDACTED]';

    default:
      return '[MASKED]';
  }
}

// ─── Main masking function ────────────────────────────────────────────────────

/**
 * Mask tất cả PII fields trong một object (deep)
 * Trả về object mới, không thay đổi original
 */
export function maskPII(data: unknown, depth = 0): unknown {
  if (depth > 10) return '[MAX_DEPTH]'; // Tránh circular ref
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') return data;
  if (typeof data === 'number' || typeof data === 'boolean') return data;

  if (Array.isArray(data)) {
    return data.map(item => maskPII(item, depth + 1));
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (PII_FIELDS.has(key)) {
        const strategy = FIELD_STRATEGY[key] ?? 'full';
        result[key] = typeof value === 'string'
          ? maskValue(value, strategy)
          : '[MASKED]';
      } else {
        result[key] = maskPII(value, depth + 1);
      }
    }
    return result;
  }

  return data;
}

/**
 * So sánh beforeData và afterData, chỉ giữ lại fields thay đổi
 * Giúp AuditLog gọn hơn, không lưu toàn bộ record
 */
export function diffObjects(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): {
  changedFields: string[];
  beforeMasked: Record<string, unknown> | null;
  afterMasked: Record<string, unknown> | null;
} {
  if (!before && !after) {
    return { changedFields: [], beforeMasked: null, afterMasked: null };
  }

  const allKeys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);

  const changedFields: string[] = [];
  const beforeFiltered: Record<string, unknown> = {};
  const afterFiltered:  Record<string, unknown> = {};

  for (const key of allKeys) {
    const bVal = before?.[key];
    const aVal = after?.[key];

    if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
      changedFields.push(key);
      if (before) beforeFiltered[key] = bVal;
      if (after)  afterFiltered[key]  = aVal;
    }
  }

  return {
    changedFields,
    beforeMasked: before ? (maskPII(beforeFiltered) as Record<string, unknown>) : null,
    afterMasked:  after  ? (maskPII(afterFiltered)  as Record<string, unknown>) : null,
  };
}