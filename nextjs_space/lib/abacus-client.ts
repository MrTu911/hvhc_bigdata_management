/**
 * Abacus AI Client SDK
 * Chuẩn hóa tương tác với Abacus AI APIs
 */

import OpenAI from 'openai';
import { prisma } from '@/lib/db';
import { getAIConfig, needsTokenRefresh, setOfflineMode } from './abacus-config';
import { calculateOfflineEIS, OfflineEISResult } from './offline-eis';

export interface APICallOptions {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  userId?: string;
}

export interface APICallResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  responseTime: number;
  provider: 'abacus' | 'openai' | 'offline';
}

export class AbacusAIClient {
  private openaiClient: OpenAI | null = null;
  private config: any = null;
  private requestQueue: any[] = [];
  private isProcessing = false;

  constructor() {
    this.initialize();
  }

  /**
   * Khởi tạo client
   */
  private async initialize() {
    try {
      this.config = await getAIConfig();
      
      // Fallback: sử dụng env var nếu không có config từ DB
      const apiKey = this.config?.apiKey || process.env.ABACUSAI_API_KEY || process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        console.log('⚠️ AI Service in offline mode - no API key');
        return;
      }

      // Nếu có API key từ env, tạo config mặc định
      if (!this.config) {
        this.config = {
          provider: process.env.ABACUSAI_API_KEY ? 'abacus' : 'openai',
          apiKey,
          model: 'gpt-4.1-mini',
          temperature: 0.7,
          maxTokens: 4000,
          isActive: true,
          offlineMode: false,
        };
      }

      if (this.config.offlineMode) {
        console.log('⚠️ AI Service in offline mode (config)');
        return;
      }

      this.openaiClient = new OpenAI({
        apiKey,
        baseURL: this.config.provider === 'abacus'
          ? 'https://apps.abacus.ai/v1'
          : undefined,
      });

      console.log(`✅ AI Client initialized with ${this.config.provider}`);
    } catch (error) {
      console.error('Error initializing AI client:', error);
      // Fallback trực tiếp nếu có API key từ env
      const apiKey = process.env.ABACUSAI_API_KEY;
      if (apiKey) {
        this.config = {
          provider: 'abacus',
          apiKey,
          model: 'gpt-4.1-mini',
          temperature: 0.7,
          maxTokens: 4000,
          isActive: true,
          offlineMode: false,
        };
        this.openaiClient = new OpenAI({
          apiKey,
          baseURL: 'https://apps.abacus.ai/v1',
        });
        console.log('✅ AI Client initialized with fallback (abacus)');
      }
    }
  }

  /**
   * Kiểm tra và refresh token nếu cần
   */
  private async checkAndRefreshToken(): Promise<boolean> {
    try {
      if (await needsTokenRefresh()) {
        console.log('🔄 Token needs refresh, reinitializing...');
        await this.initialize();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking token:', error);
      return false;
    }
  }

  /**
   * Gọi AI API với logging và error handling
   */
  public async call<T = any>(options: APICallOptions): Promise<APICallResult<T>> {
    const startTime = Date.now();
    let logData: any = {
      provider: this.config?.provider || 'unknown',
      endpoint: options.endpoint,
      method: options.method,
      requestData: options.data,
      userId: options.userId,
    };

    try {
      // Kiểm tra offline mode
      if (!this.config || this.config.offlineMode || !this.openaiClient) {
        console.log('⚠️ Offline mode - using fallback');
        throw new Error('AI service not available - offline mode');
      }

      // Kiểm tra và refresh token
      await this.checkAndRefreshToken();

      // Gọi API
      const response = await this.executeRequest<T>(options);
      const responseTime = Date.now() - startTime;

      // Log thành công
      await this.logAPICall({
        ...logData,
        responseData: response,
        statusCode: 200,
        responseTime,
        success: true,
      });

      return {
        success: true,
        data: response,
        responseTime,
        provider: this.config.provider,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      // Log lỗi
      await this.logAPICall({
        ...logData,
        statusCode: error.status || 500,
        responseTime,
        success: false,
        errorMessage: error.message,
      });

      console.error('AI API call failed:', error);

      return {
        success: false,
        error: error.message,
        responseTime,
        provider: this.config?.provider || 'unknown',
      };
    }
  }

  /**
   * Thực thi request thực tế
   */
  private async executeRequest<T>(options: APICallOptions): Promise<T> {
    if (!this.openaiClient) {
      throw new Error('AI client not initialized');
    }

    // Đối với chat completion
    if (options.endpoint.includes('chat/completions')) {
      const response = await this.openaiClient.chat.completions.create({
        model: this.config.model,
        messages: options.data.messages,
        temperature: options.data.temperature ?? this.config.temperature,
        max_tokens: options.data.max_tokens ?? this.config.maxTokens,
        response_format: options.data.response_format,
      });

      return response as T;
    }

    // Generic API call
    throw new Error(`Unsupported endpoint: ${options.endpoint}`);
  }

  /**
   * Ghi log API call vào database
   */
  private async logAPICall(data: any): Promise<void> {
    try {
      await prisma.aIApiLog.create({
        data: {
          provider: data.provider,
          endpoint: data.endpoint,
          method: data.method,
          requestData: data.requestData || {},
          responseData: data.responseData || {},
          statusCode: data.statusCode,
          responseTime: data.responseTime,
          success: data.success,
          errorMessage: data.errorMessage,
          userId: data.userId,
        },
      });
    } catch (error) {
      console.error('Error logging API call:', error);
    }
  }

  /**
   * Lưu prediction vào Model Registry
   */
  public async savePrediction(data: {
    modelType: string;
    modelVersion?: string;
    inputData: any;
    predictionData: any;
    confidence?: number;
    targetId: string;
    targetType: string;
  }): Promise<void> {
    try {
      await prisma.modelRegistry.create({
        data: {
          modelType: data.modelType,
          modelVersion: data.modelVersion || '1.0.0',
          inputData: data.inputData,
          predictionData: data.predictionData,
          confidence: data.confidence,
          targetId: data.targetId,
          targetType: data.targetType,
        },
      });
    } catch (error) {
      console.error('Error saving prediction:', error);
    }
  }

  /**
   * Cập nhật feedback cho prediction
   */
  public async updatePredictionFeedback(
    predictionId: string,
    feedback: {
      actualData?: any;
      accuracy?: number;
      feedbackScore?: number;
      feedbackText?: string;
    }
  ): Promise<void> {
    try {
      await prisma.modelRegistry.update({
        where: { id: predictionId },
        data: feedback,
      });
    } catch (error) {
      console.error('Error updating prediction feedback:', error);
    }
  }

  /**
   * Tính EIS với fallback sang offline mode
   */
  public async calculateEIS(
    facultyId: string,
    useOffline: boolean = false
  ): Promise<OfflineEISResult | any> {
    try {
      // Nếu bắt offline hoặc không có AI service
      if (useOffline || !this.openaiClient || this.config?.offlineMode) {
        console.log('📦 Using offline EIS calculation');
        return await calculateOfflineEIS(facultyId);
      }

      // Thử gọi AI service
      try {
        // TODO: Implement AI-based EIS calculation
        // Hiện tại sử dụng offline mode
        return await calculateOfflineEIS(facultyId);
      } catch (error) {
        console.error('AI EIS failed, falling back to offline:', error);
        return await calculateOfflineEIS(facultyId);
      }
    } catch (error) {
      console.error('Error calculating EIS:', error);
      throw error;
    }
  }

  /**
   * Lấy thống kê API logs
   */
  public async getAPIStats(timeRange: {
    start: Date;
    end: Date;
  }): Promise<any> {
    try {
      const logs = await prisma.aIApiLog.findMany({
        where: {
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
      });

      const totalCalls = logs.length;
      const successCalls = logs.filter((l) => l.success).length;
      const failedCalls = totalCalls - successCalls;
      const avgResponseTime =
        logs.reduce((sum, l) => sum + (l.responseTime || 0), 0) / totalCalls || 0;

      const providerStats = logs.reduce((acc, log) => {
        acc[log.provider] = (acc[log.provider] || 0) + 1;
        return acc;
      }, {} as any);

      return {
        totalCalls,
        successCalls,
        failedCalls,
        successRate: (successCalls / totalCalls) * 100,
        avgResponseTime,
        providerStats,
      };
    } catch (error) {
      console.error('Error getting API stats:', error);
      throw error;
    }
  }

  /**
   * Xóa logs cũ (retention policy)
   */
  public async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.aIApiLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
      throw error;
    }
  }
}

// Singleton instance
let abacusClient: AbacusAIClient | null = null;

export function getAbacusClient(): AbacusAIClient {
  if (!abacusClient) {
    abacusClient = new AbacusAIClient();
  }
  return abacusClient;
}

// Export instance mặc định
export const abacus = getAbacusClient();
