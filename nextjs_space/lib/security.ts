
/**
 * Security utilities for military-grade data protection
 * HVHC BigData Management System
 */

import crypto from 'crypto';

/**
 * Generate SHA-256 digital signature for file
 */
export function generateDigitalSignature(content: Buffer | string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Generate file checksum (MD5)
 */
export function generateChecksum(content: Buffer | string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Verify file integrity
 */
export function verifyFileIntegrity(
  content: Buffer | string,
  expectedSignature: string
): boolean {
  const actualSignature = generateDigitalSignature(content);
  return actualSignature === expectedSignature;
}

/**
 * Check if user has access to file based on classification
 */
export function hasFileAccess(
  userRole: string,
  fileClassification: string
): boolean {
  const accessMatrix: Record<string, string[]> = {
    ADMIN: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'],
    NGHIEN_CUU_VIEN: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'],
    GIANG_VIEN: ['PUBLIC', 'INTERNAL'],
    HOC_VIEN: ['PUBLIC'],
  };

  return accessMatrix[userRole]?.includes(fileClassification) || false;
}

/**
 * Sanitize filename to prevent directory traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-_]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 255);
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Encrypt sensitive data
 */
export function encryptData(data: string, key: string): string {
  const algorithm = 'aes-256-cbc';
  const secretKey = crypto.createHash('sha256').update(key).digest();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string, key: string): string {
  const algorithm = 'aes-256-cbc';
  const secretKey = crypto.createHash('sha256').update(key).digest();

  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
