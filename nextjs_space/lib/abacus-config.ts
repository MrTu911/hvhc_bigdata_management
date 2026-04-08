/**
 * Abacus AI Configuration Management
 * Quản lý cấu hình động cho AI service
 */

import { prisma } from '@/lib/db';
import { createHash } from 'crypto';

export interface AIConfig {
  provider: 'abacus' | 'openai' | 'none';
  apiKey?: string;
  baseUrl?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isActive: boolean;
  offlineMode: boolean;
}

/**
 * Hash API key để lưu trữ an toàn
 */
export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Lấy cấu hình AI hiện tại
 */
export async function getAIConfig(): Promise<AIConfig | null> {
  try {
    const config = await prisma.aIConfiguration.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!config) {
      return null;
    }

    // Kiểm tra xem có API key trong env không
    const apiKey = process.env.ABACUSAI_API_KEY || process.env.OPENAI_API_KEY;

    return {
      provider: config.provider as any,
      apiKey,
      baseUrl: config.baseUrl || undefined,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      isActive: config.isActive,
      offlineMode: config.offlineMode,
    };
  } catch (error) {
    console.error('Error loading AI config:', error);
    return null;
  }
}

/**
 * Cập nhật cấu hình AI
 */
export async function updateAIConfig(
  config: Partial<AIConfig>,
  userId?: string
): Promise<void> {
  try {
    // Tìm config hiện tại hoặc tạo mới
    const existing = await prisma.aIConfiguration.findFirst({
      where: { isActive: true },
    });

    const data: any = {
      provider: config.provider,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      isActive: config.isActive ?? true,
      offlineMode: config.offlineMode ?? false,
      baseUrl: config.baseUrl,
      updatedBy: userId,
    };

    // Hash API key nếu có
    if (config.apiKey) {
      data.apiKeyHash = hashApiKey(config.apiKey);
    }

    if (existing) {
      await prisma.aIConfiguration.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.aIConfiguration.create({ data });
    }
  } catch (error) {
    console.error('Error updating AI config:', error);
    throw error;
  }
}

/**
 * Kiểm tra xem token có cần refresh không
 */
export async function needsTokenRefresh(): Promise<boolean> {
  try {
    const config = await prisma.aIConfiguration.findFirst({
      where: { isActive: true },
    });

    if (!config || !config.tokenExpiresAt) {
      return false;
    }

    // Refresh 5 phút trước khi hết hạn
    const now = new Date();
    const expiresAt = new Date(config.tokenExpiresAt);
    const fiveMinutes = 5 * 60 * 1000;

    return expiresAt.getTime() - now.getTime() < fiveMinutes;
  } catch (error) {
    console.error('Error checking token refresh:', error);
    return false;
  }
}

/**
 * Cập nhật thông tin token
 */
export async function updateTokenInfo(expiresAt: Date): Promise<void> {
  try {
    const config = await prisma.aIConfiguration.findFirst({
      where: { isActive: true },
    });

    if (config) {
      await prisma.aIConfiguration.update({
        where: { id: config.id },
        data: {
          lastTokenRefresh: new Date(),
          tokenExpiresAt: expiresAt,
        },
      });
    }
  } catch (error) {
    console.error('Error updating token info:', error);
  }
}

/**
 * Bật/tắt chế độ offline
 */
export async function setOfflineMode(enabled: boolean): Promise<void> {
  try {
    const config = await prisma.aIConfiguration.findFirst({
      where: { isActive: true },
    });

    if (config) {
      await prisma.aIConfiguration.update({
        where: { id: config.id },
        data: { offlineMode: enabled },
      });
    }
  } catch (error) {
    console.error('Error setting offline mode:', error);
  }
}
