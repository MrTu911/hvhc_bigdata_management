
/**
 * Password Policy Enforcement
 * Implements password complexity and history checks
 */

import bcrypt from 'bcryptjs';
import { prisma as db } from '@/lib/db';

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
  expiryDays: number;
  historyCount: number;
}

export async function getPasswordPolicy(): Promise<PasswordPolicy> {
  try {
    const settings = await db.$queryRaw<any[]>`
      SELECT setting_key, setting_value 
      FROM security_settings
      WHERE setting_key LIKE 'password_%'
    `;

    const policy: PasswordPolicy = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecial: true,
      expiryDays: 90,
      historyCount: 5,
    };

    settings.forEach((setting: any) => {
      const key = setting.setting_key.replace('password_', '');
      const value = setting.setting_value;

      switch (key) {
        case 'min_length':
          policy.minLength = parseInt(value);
          break;
        case 'require_uppercase':
          policy.requireUppercase = value === 'true';
          break;
        case 'require_lowercase':
          policy.requireLowercase = value === 'true';
          break;
        case 'require_number':
          policy.requireNumber = value === 'true';
          break;
        case 'require_special':
          policy.requireSpecial = value === 'true';
          break;
        case 'expiry_days':
          policy.expiryDays = parseInt(value);
          break;
        case 'history_count':
          policy.historyCount = parseInt(value);
          break;
      }
    });

    return policy;
  } catch (error) {
    console.error('Failed to get password policy:', error);
    // Return default policy
    return {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecial: true,
      expiryDays: 90,
      historyCount: 5,
    };
  }
}

export async function validatePassword(
  password: string,
  policy?: PasswordPolicy
): Promise<{ valid: boolean; errors: string[] }> {
  const p = policy || await getPasswordPolicy();
  const errors: string[] = [];

  if (password.length < p.minLength) {
    errors.push(`Mật khẩu phải có ít nhất ${p.minLength} ký tự`);
  }

  if (p.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất 1 chữ hoa');
  }

  if (p.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất 1 chữ thường');
  }

  if (p.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất 1 số');
  }

  if (p.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function checkPasswordHistory(
  userId: number,
  newPassword: string
): Promise<boolean> {
  try {
    const policy = await getPasswordPolicy();
    
    const history = await db.$queryRaw<any[]>`
      SELECT password_hash
      FROM password_history
      WHERE user_id = ${userId}
      ORDER BY changed_at DESC
      LIMIT ${policy.historyCount}
    `;

    for (const entry of history) {
      const matches = await bcrypt.compare(newPassword, entry.password_hash);
      if (matches) {
        return false; // Password found in history
      }
    }

    return true; // Password not in history
  } catch (error) {
    console.error('Failed to check password history:', error);
    return true; // Allow on error
  }
}

export async function savePasswordToHistory(
  userId: number,
  passwordHash: string
): Promise<void> {
  try {
    await db.$executeRaw`
      INSERT INTO password_history (user_id, password_hash)
      VALUES (${userId}, ${passwordHash})
    `;

    // Clean up old history entries
    const policy = await getPasswordPolicy();
    await db.$executeRaw`
      DELETE FROM password_history
      WHERE id IN (
        SELECT id FROM password_history
        WHERE user_id = ${userId}
        ORDER BY changed_at DESC
        OFFSET ${policy.historyCount}
      )
    `;
  } catch (error) {
    console.error('Failed to save password to history:', error);
  }
}

export async function isPasswordExpired(userId: number): Promise<boolean> {
  try {
    const user = await db.$queryRaw<any[]>`
      SELECT password_changed_at, password_expires_at
      FROM users
      WHERE id = ${userId}
    `;

    if (!user || user.length === 0) return false;

    const passwordExpiresAt = user[0].password_expires_at;
    if (passwordExpiresAt && new Date() > new Date(passwordExpiresAt)) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to check password expiry:', error);
    return false;
  }
}
