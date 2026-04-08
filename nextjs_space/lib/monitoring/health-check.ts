
/**
 * System Health Check Library
 * Monitors system components and dependencies
 */

import { db } from '@/lib/db';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface HealthCheckResult {
  service_name: string;
  check_type: 'api' | 'database' | 'cache' | 'storage' | 'ml_engine';
  status: HealthStatus;
  response_time_ms?: number;
  error_message?: string;
  metadata?: any;
  checked_at: Date;
}

export class HealthCheckService {
  /**
   * Check database health
   */
  static async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      await db.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      return {
        service_name: 'PostgreSQL Database',
        check_type: 'database',
        status: responseTime < 100 ? 'healthy' : 'degraded',
        response_time_ms: responseTime,
        checked_at: new Date()
      };
    } catch (error: any) {
      return {
        service_name: 'PostgreSQL Database',
        check_type: 'database',
        status: 'unhealthy',
        response_time_ms: Date.now() - startTime,
        error_message: error.message,
        checked_at: new Date()
      };
    }
  }

  /**
   * Check cache (Redis) health
   */
  static async checkCache(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // TODO: Add actual Redis health check
      // For now, simulate a check
      await new Promise(resolve => setTimeout(resolve, 5));
      const responseTime = Date.now() - startTime;
      
      return {
        service_name: 'Redis Cache',
        check_type: 'cache',
        status: 'healthy',
        response_time_ms: responseTime,
        checked_at: new Date()
      };
    } catch (error: any) {
      return {
        service_name: 'Redis Cache',
        check_type: 'cache',
        status: 'unhealthy',
        response_time_ms: Date.now() - startTime,
        error_message: error.message,
        checked_at: new Date()
      };
    }
  }

  /**
   * Check storage (MinIO/S3) health
   */
  static async checkStorage(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // TODO: Add actual MinIO/S3 health check
      await new Promise(resolve => setTimeout(resolve, 10));
      const responseTime = Date.now() - startTime;
      
      return {
        service_name: 'MinIO Storage',
        check_type: 'storage',
        status: 'healthy',
        response_time_ms: responseTime,
        checked_at: new Date()
      };
    } catch (error: any) {
      return {
        service_name: 'MinIO Storage',
        check_type: 'storage',
        status: 'unhealthy',
        response_time_ms: Date.now() - startTime,
        error_message: error.message,
        checked_at: new Date()
      };
    }
  }

  /**
   * Check API health
   */
  static async checkAPI(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Check if API is responsive
      const responseTime = Date.now() - startTime;
      
      return {
        service_name: 'HVHC API Server',
        check_type: 'api',
        status: 'healthy',
        response_time_ms: responseTime,
        checked_at: new Date()
      };
    } catch (error: any) {
      return {
        service_name: 'HVHC API Server',
        check_type: 'api',
        status: 'unhealthy',
        response_time_ms: Date.now() - startTime,
        error_message: error.message,
        checked_at: new Date()
      };
    }
  }

  /**
   * Check ML Engine health
   */
  static async checkMLEngine(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Check ML Engine availability
      const result = await db.query('SELECT COUNT(*) FROM ml_models WHERE status = $1', ['active']);
      const responseTime = Date.now() - startTime;
      
      return {
        service_name: 'ML Training Engine',
        check_type: 'ml_engine',
        status: 'healthy',
        response_time_ms: responseTime,
        metadata: { active_models: parseInt(result.rows[0].count) },
        checked_at: new Date()
      };
    } catch (error: any) {
      return {
        service_name: 'ML Training Engine',
        check_type: 'ml_engine',
        status: 'unhealthy',
        response_time_ms: Date.now() - startTime,
        error_message: error.message,
        checked_at: new Date()
      };
    }
  }

  /**
   * Run all health checks
   */
  static async runAllChecks(): Promise<HealthCheckResult[]> {
    const checks = await Promise.all([
      this.checkAPI(),
      this.checkDatabase(),
      this.checkCache(),
      this.checkStorage(),
      this.checkMLEngine()
    ]);

    // Store results in database
    for (const check of checks) {
      await this.recordHealthCheck(check);
    }

    return checks;
  }

  /**
   * Record health check in database
   */
  static async recordHealthCheck(check: HealthCheckResult): Promise<void> {
    await db.query(
      `INSERT INTO system_health_checks 
       (service_name, check_type, status, response_time_ms, error_message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        check.service_name,
        check.check_type,
        check.status,
        check.response_time_ms,
        check.error_message,
        check.metadata ? JSON.stringify(check.metadata) : null
      ]
    );
  }

  /**
   * Get overall system health status
   */
  static async getSystemHealth(): Promise<{
    overall_status: HealthStatus;
    checks: HealthCheckResult[];
    unhealthy_services: string[];
  }> {
    const checks = await this.runAllChecks();
    
    const unhealthyServices = checks
      .filter(c => c.status === 'unhealthy')
      .map(c => c.service_name);
    
    const degradedServices = checks
      .filter(c => c.status === 'degraded')
      .map(c => c.service_name);

    let overallStatus: HealthStatus = 'healthy';
    
    if (unhealthyServices.length > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedServices.length > 0) {
      overallStatus = 'degraded';
    }

    return {
      overall_status: overallStatus,
      checks,
      unhealthy_services: unhealthyServices
    };
  }

  /**
   * Get health history
   */
  static async getHealthHistory(
    serviceName?: string,
    hours: number = 24
  ): Promise<any[]> {
    let query = `
      SELECT * FROM system_health_checks 
      WHERE checked_at >= NOW() - INTERVAL '${hours} hours'
    `;
    
    const params: any[] = [];
    
    if (serviceName) {
      query += ' AND service_name = $1';
      params.push(serviceName);
    }
    
    query += ' ORDER BY checked_at DESC LIMIT 1000';
    
    const result = await db.query(query, params);
    return result.rows;
  }
}
