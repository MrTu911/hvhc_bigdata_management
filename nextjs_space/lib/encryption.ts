/**
 * AES-256-GCM Encryption with Random IV + Versioned Ciphertext
 * Format: enc:v1:<iv_base64>:<authTag_base64>:<cipher_base64>
 * 
 * Security Features:
 * - Random IV for each encryption (16 bytes)
 * - AES-256-GCM with AuthTag for integrity
 * - Versioned ciphertext for key rotation support
 * - No IV stored in .env (generated per encryption)
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const CURRENT_KEY_VERSION = 'v1';

/**
 * Get encryption key from environment
 * Key must be 32 bytes (64 hex characters)
 */
function getEncryptionKey(version: string = CURRENT_KEY_VERSION): Buffer {
  const keyEnvName = version === 'v1' 
    ? 'ENCRYPTION_KEY' 
    : `ENCRYPTION_KEY_${version.toUpperCase()}`;
  
  const keyHex = process.env[keyEnvName];
  
  if (!keyHex) {
    throw new Error(`Encryption key not found: ${keyEnvName}`);
  }
  
  if (keyHex.length !== 64) {
    throw new Error(`Invalid encryption key length. Expected 64 hex chars, got ${keyHex.length}`);
  }
  
  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt plaintext using AES-256-GCM with random IV
 * @param plaintext - String to encrypt
 * @returns Versioned ciphertext: enc:v1:<iv>:<authTag>:<cipher>
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    return plaintext;
  }
  
  const key = getEncryptionKey(CURRENT_KEY_VERSION);
  const iv = crypto.randomBytes(IV_LENGTH); // Random IV for each encryption
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Format: enc:v1:<iv>:<authTag>:<cipher>
  return `enc:${CURRENT_KEY_VERSION}:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt ciphertext
 * Supports multiple versions for key rotation
 * @param ciphertext - Versioned ciphertext string
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) {
    return ciphertext;
  }
  
  // Check if it's encrypted format
  if (!ciphertext.startsWith('enc:')) {
    // Return as-is if not encrypted (legacy data)
    return ciphertext;
  }
  
  const parts = ciphertext.split(':');
  
  if (parts.length < 5) {
    throw new Error('Invalid ciphertext format');
  }
  
  const version = parts[1];
  const payload = parts.slice(2);
  
  switch (version) {
    case 'v1':
      return decryptV1(payload);
    // Add more versions here for key rotation
    // case 'v2':
    //   return decryptV2(payload);
    default:
      throw new Error(`Unsupported encryption version: ${version}`);
  }
}

/**
 * Decrypt V1 format
 */
function decryptV1(payload: string[]): string {
  const [ivB64, authTagB64, cipherB64] = payload;
  
  const key = getEncryptionKey('v1');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(cipherB64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Check if a string is encrypted
 */
export function isEncrypted(value: string): boolean {
  return value?.startsWith('enc:') ?? false;
}

/**
 * Get encryption version from ciphertext
 */
export function getEncryptionVersion(ciphertext: string): string | null {
  if (!isEncrypted(ciphertext)) {
    return null;
  }
  const parts = ciphertext.split(':');
  return parts[1] || null;
}

/**
 * Re-encrypt data with new key version (for key rotation)
 * @param ciphertext - Current encrypted value
 * @param newVersion - New key version to encrypt with
 * @returns New ciphertext with updated version
 */
export async function rotateEncryption(
  ciphertext: string,
  newVersion: string = 'v2'
): Promise<string> {
  // Decrypt with current key
  const plaintext = decrypt(ciphertext);
  
  // Get new key
  const newKey = getEncryptionKey(newVersion);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, newKey, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  return `enc:${newVersion}:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Generate a new 256-bit encryption key
 * Use this to generate keys for .env
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a value (one-way, for comparison)
 * Used for API keys, etc.
 */
export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Generate a secure random token
 * Used for API keys, reset tokens, etc.
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Encrypted fields configuration
 * Maps model names to their encrypted field names
 */
export const ENCRYPTED_FIELDS: Record<string, string[]> = {
  User: ['citizenId', 'militaryIdNumber', 'bankAccount', 'phoneNumber'],
  InsuranceInfo: ['insuranceNumber', 'healthInsuranceNumber'],
  PartyMember: ['partyCardNumber'],
  FamilyRelation: ['citizenId', 'phoneNumber'],
};

/**
 * Encrypt specific fields in an object
 */
export function encryptFields<T extends Record<string, any>>(
  data: T,
  modelName: string
): T {
  const fieldsToEncrypt = ENCRYPTED_FIELDS[modelName] || [];
  const result = { ...data } as Record<string, any>;
  
  for (const field of fieldsToEncrypt) {
    if (result[field] && typeof result[field] === 'string' && !isEncrypted(result[field])) {
      result[field] = encrypt(result[field]);
    }
  }
  
  return result as T;
}

/**
 * Decrypt specific fields in an object
 */
export function decryptFields<T extends Record<string, any>>(
  data: T,
  modelName: string
): T {
  const fieldsToDecrypt = ENCRYPTED_FIELDS[modelName] || [];
  const result = { ...data } as Record<string, any>;
  
  for (const field of fieldsToDecrypt) {
    if (result[field] && typeof result[field] === 'string' && isEncrypted(result[field])) {
      try {
        result[field] = decrypt(result[field]);
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        // Keep encrypted value on error
      }
    }
  }
  
  return result as T;
}
