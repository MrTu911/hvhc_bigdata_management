/**
 * HVHC BigData Management System
 * Encryption Helper - Mã hóa dữ liệu nhạy cảm (CCCD, CMT)
 * Chuẩn: AES-256-GCM
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Get encryption key from environment
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    // In development, use a default key (KHÔNG DÙNG TRONG PRODUCTION)
    console.warn('[SECURITY] ENCRYPTION_KEY not set, using default key (DEV ONLY)');
    return crypto.scryptSync('default-dev-key-hvhc-2026', 'salt', 32);
  }
  // Derive a 32-byte key from the provided key
  return crypto.scryptSync(key, 'hvhc-bigdata-salt', 32);
}

/**
 * Mã hóa dữ liệu nhạy cảm (CCCD, CMT, số điện thoại, etc.)
 * @param plaintext - Dữ liệu cần mã hóa
 * @returns Chuỗi mã hóa base64 (iv:authTag:encrypted)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return '';
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encrypted (all in hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('[ENCRYPTION] Failed to encrypt:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Giải mã dữ liệu
 * @param ciphertext - Chuỗi đã mã hóa (iv:authTag:encrypted)
 * @returns Dữ liệu gốc
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return '';
  
  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format');
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[DECRYPTION] Failed to decrypt:', error);
    throw new Error('Decryption failed');
  }
}

/**
 * Mã hóa CCCD/CMT với mask để hiển thị
 * @param cccd - Số CCCD gốc
 * @returns {encrypted, masked}
 */
export function encryptCCCD(cccd: string): { encrypted: string; masked: string } {
  if (!cccd) return { encrypted: '', masked: '' };
  
  const cleanCCCD = cccd.replace(/\D/g, '');
  const encrypted = encrypt(cleanCCCD);
  
  // Mask: chỉ hiện 4 số cuối (***********1234)
  const masked = cleanCCCD.length > 4 
    ? '*'.repeat(cleanCCCD.length - 4) + cleanCCCD.slice(-4)
    : cleanCCCD;
  
  return { encrypted, masked };
}

/**
 * Giải mã CCCD
 */
export function decryptCCCD(encryptedCCCD: string): string {
  return decrypt(encryptedCCCD);
}

/**
 * Mã hóa số điện thoại
 */
export function encryptPhone(phone: string): { encrypted: string; masked: string } {
  if (!phone) return { encrypted: '', masked: '' };
  
  const cleanPhone = phone.replace(/\D/g, '');
  const encrypted = encrypt(cleanPhone);
  
  // Mask: chỉ hiện 3 số cuối
  const masked = cleanPhone.length > 3
    ? '*'.repeat(cleanPhone.length - 3) + cleanPhone.slice(-3)
    : cleanPhone;
  
  return { encrypted, masked };
}

/**
 * Kiểm tra chuỗi đã được mã hóa chưa
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(':');
  return parts.length === 3 && parts[0].length === IV_LENGTH * 2;
}

/**
 * Hash one-way cho dữ liệu cần tìm kiếm nhanh (không giải mã)
 */
export function hashForSearch(plaintext: string): string {
  if (!plaintext) return '';
  return crypto
    .createHash('sha256')
    .update(plaintext + 'hvhc-salt')
    .digest('hex');
}

export default {
  encrypt,
  decrypt,
  encryptCCCD,
  decryptCCCD,
  encryptPhone,
  isEncrypted,
  hashForSearch
};
