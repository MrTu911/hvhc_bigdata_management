/**
 * lib/encryption.ts
 * AES-256-GCM với Random IV + Key Versioning
 * Khắc phục: IV cố định trong .env (lỗi nghiêm trọng #1)
 *
 * Format ciphertext: enc:v1:<iv_base64>:<authTag_base64>:<cipher_base64>
 */

import crypto from 'crypto';

// ─── Cấu hình ───────────────────────────────────────────────────────────────

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;       // 96-bit IV (chuẩn cho GCM)
const TAG_LENGTH = 16;      // 128-bit authentication tag
const KEY_LENGTH = 32;      // 256-bit key

/** Map version → hex key, hỗ trợ key rotation */
function getKeyMap(): Record<string, Buffer> {
  const keyMap: Record<string, Buffer> = {};

  // Key hiện tại (v1)
  const v1hex = process.env.ENCRYPTION_KEY_V1;
  if (!v1hex) throw new Error('[Encryption] ENCRYPTION_KEY_V1 is not set in environment');
  if (v1hex.length !== KEY_LENGTH * 2)
    throw new Error(`[Encryption] ENCRYPTION_KEY_V1 must be ${KEY_LENGTH * 2} hex chars (${KEY_LENGTH} bytes)`);
  keyMap['v1'] = Buffer.from(v1hex, 'hex');

  // Key cũ (v0) – chỉ dùng để DECRYPT dữ liệu cũ, KHÔNG encrypt mới
  const v0hex = process.env.ENCRYPTION_KEY_V0;
  if (v0hex) {
    if (v0hex.length !== KEY_LENGTH * 2)
      throw new Error(`[Encryption] ENCRYPTION_KEY_V0 must be ${KEY_LENGTH * 2} hex chars`);
    keyMap['v0'] = Buffer.from(v0hex, 'hex');
  }

  return keyMap;
}

/** Version hiện tại dùng để encrypt */
const CURRENT_VERSION = 'v1';

// ─── Encrypt ────────────────────────────────────────────────────────────────

/**
 * Mã hoá plaintext → chuỗi enc:v1:<iv>:<authTag>:<cipher>
 * IV random mỗi lần → cùng plaintext → kết quả khác nhau → an toàn
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;

  const keys = getKeyMap();
  const key = keys[CURRENT_VERSION];

  // IV ngẫu nhiên mỗi lần encrypt
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    'enc',
    CURRENT_VERSION,
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

// ─── Decrypt ────────────────────────────────────────────────────────────────

/**
 * Giải mã chuỗi enc:vX:<iv>:<authTag>:<cipher>
 * Hỗ trợ cả v0 (key cũ) và v1 (key hiện tại)
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ciphertext;

  // Dữ liệu chưa mã hoá (plain text cũ) – fallback
  if (!ciphertext.startsWith('enc:')) {
    console.warn('[Encryption] decrypt() received non-encrypted value – returning as-is');
    return ciphertext;
  }

  const parts = ciphertext.split(':');
  if (parts.length !== 5 || parts[0] !== 'enc') {
    throw new Error('[Encryption] Invalid ciphertext format');
  }

  const [, version, ivB64, authTagB64, dataB64] = parts;

  const keys = getKeyMap();
  const key = keys[version];
  if (!key) throw new Error(`[Encryption] Unknown key version: ${version}`);

  const iv      = Buffer.from(ivB64,     'base64');
  const authTag = Buffer.from(authTagB64,'base64');
  const data    = Buffer.from(dataB64,   'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(data),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

// ─── Utility ────────────────────────────────────────────────────────────────

/** Kiểm tra xem chuỗi đã được mã hoá chưa */
export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.startsWith('enc:');
}

/** Kiểm tra version của ciphertext */
export function getCiphertextVersion(value: string): string | null {
  if (!isEncrypted(value)) return null;
  return value.split(':')[1] ?? null;
}

/** Cần re-encrypt? (nếu version khác CURRENT_VERSION) */
export function needsReEncrypt(value: string): boolean {
  const ver = getCiphertextVersion(value);
  return ver !== null && ver !== CURRENT_VERSION;
}

/**
 * Re-encrypt an toàn: decrypt với key cũ → encrypt lại với key hiện tại
 * Dùng trong migration script
 */
export function reEncrypt(oldCiphertext: string): string {
  const plain = decrypt(oldCiphertext);
  return encrypt(plain);
}

/**
 * Generate hex key ngẫu nhiên (dùng 1 lần khi setup .env)
 * Chạy: npx ts-node -e "require('./lib/encryption').generateKey()"
 */
export function generateKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

// ─── Prisma Field Transformer ────────────────────────────────────────────────

/** Danh sách fields cần encrypt trong SensitiveIdentity */
export const SENSITIVE_FIELDS = [
  'citizenId',
  'militaryIdNumber',
  'passportNumber',
  'insuranceNumber',
  'healthInsuranceNumber',
  'partyCardNumber',
  'bankAccount',
  'bankAccountName',
] as const;

export type SensitiveField = typeof SENSITIVE_FIELDS[number];

/** Encrypt tất cả sensitive fields trước khi lưu vào DB */
export function encryptSensitiveData<T extends Partial<Record<SensitiveField, string | null>>>(
  data: T
): T {
  const result = { ...data } as T;
  for (const field of SENSITIVE_FIELDS) {
    if (result[field] && typeof result[field] === 'string') {
      (result as Record<string, unknown>)[field] = encrypt(result[field] as string);
    }
  }
  return result;
}

/** Decrypt tất cả sensitive fields sau khi đọc từ DB */
export function decryptSensitiveData<T extends Partial<Record<SensitiveField, string | null>>>(
  data: T
): T {
  const result = { ...data } as T;
  for (const field of SENSITIVE_FIELDS) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        (result as Record<string, unknown>)[field] = decrypt(result[field] as string);
      } catch (err) {
        console.error(`[Encryption] Failed to decrypt field "${field}":`, err);
        // Giữ nguyên nếu decrypt lỗi (tránh crash)
      }
    }
  }
  return result;
}