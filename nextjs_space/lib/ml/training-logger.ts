
/**
 * ML Training Logger
 * Comprehensive logging for ML training operations
 */

import { db } from '@/lib/db';

export type MLLogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface MLLogEntry {
  jobId?: number;
  runId?: string;
  level: MLLogLevel;
  message: string;
  details?: any;
  epoch?: number;
  step?: number;
}

export class MLTrainingLogger {
  /**
   * Log a training event
   */
  static async log(entry: MLLogEntry): Promise<void> {
    try {
      await db.query(
        `INSERT INTO ml_training_logs (job_id, run_id, log_level, log_message, log_details, epoch, step, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          entry.jobId || null,
          entry.runId || null,
          entry.level,
          entry.message,
          entry.details ? JSON.stringify(entry.details) : null,
          entry.epoch || null,
          entry.step || null
        ]
      );

      // Console output for debugging
      const consoleMethod = this.getConsoleMethod(entry.level);
      consoleMethod(
        `[ML ${entry.level}]`,
        entry.runId ? `[${entry.runId}]` : '',
        entry.message,
        entry.details || ''
      );
    } catch (error) {
      console.error('Failed to write ML training log:', error);
    }
  }

  /**
   * Log training metric
   */
  static async recordMetric(
    jobId: number,
    runId: string,
    epoch: number,
    step: number,
    metricName: string,
    metricValue: number
  ): Promise<void> {
    try {
      await db.query(
        `INSERT INTO ml_training_metrics (job_id, run_id, epoch, step, metric_name, metric_value, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [jobId, runId, epoch, step, metricName, metricValue]
      );
    } catch (error) {
      console.error('Failed to record training metric:', error);
    }
  }

  /**
   * Log training event (lifecycle events)
   */
  static async recordEvent(jobId: number, eventType: string, eventData?: any): Promise<void> {
    try {
      await db.query(
        `INSERT INTO ml_training_events (job_id, event_type, event_data, timestamp)
         VALUES ($1, $2, $3, NOW())`,
        [jobId, eventType, eventData ? JSON.stringify(eventData) : null]
      );
    } catch (error) {
      console.error('Failed to record training event:', error);
    }
  }

  /**
   * Get metrics for visualization
   */
  static async getTrainingMetrics(
    runId: string,
    metricNames?: string[]
  ): Promise<any[]> {
    const whereClause = metricNames && metricNames.length > 0
      ? `AND metric_name = ANY($2)`
      : '';
    
    const params = metricNames && metricNames.length > 0
      ? [runId, metricNames]
      : [runId];

    const result = await db.query(
      `SELECT epoch, step, metric_name, metric_value, timestamp
       FROM ml_training_metrics
       WHERE run_id = $1 ${whereClause}
       ORDER BY epoch ASC, step ASC`,
      params
    );

    return result.rows;
  }

  /**
   * Get training logs
   */
  static async getTrainingLogs(
    runId: string,
    level?: MLLogLevel,
    limit: number = 100
  ): Promise<any[]> {
    const whereClause = level ? `AND log_level = $2` : '';
    const params = level ? [runId, level, limit] : [runId, limit];

    const result = await db.query(
      `SELECT * FROM ml_training_logs
       WHERE run_id = $1 ${whereClause}
       ORDER BY timestamp DESC
       LIMIT $${params.length}`,
      params
    );

    return result.rows;
  }

  /**
   * Get training events
   */
  static async getTrainingEvents(jobId: number, eventType?: string): Promise<any[]> {
    const whereClause = eventType ? `AND event_type = $2` : '';
    const params = eventType ? [jobId, eventType] : [jobId];

    const result = await db.query(
      `SELECT * FROM ml_training_events
       WHERE job_id = $1 ${whereClause}
       ORDER BY timestamp ASC`,
      params
    );

    return result.rows;
  }

  /**
   * Get aggregated metrics for comparison
   */
  static async getAggregatedMetrics(runIds: string[]): Promise<any> {
    const result = await db.query(
      `SELECT 
         run_id,
         metric_name,
         AVG(metric_value) as avg_value,
         MIN(metric_value) as min_value,
         MAX(metric_value) as max_value,
         STDDEV(metric_value) as stddev_value,
         COUNT(*) as sample_count
       FROM ml_training_metrics
       WHERE run_id = ANY($1)
       GROUP BY run_id, metric_name
       ORDER BY run_id, metric_name`,
      [runIds]
    );

    return result.rows;
  }

  /**
   * Helper method to get console method
   */
  private static getConsoleMethod(level: MLLogLevel): (...args: any[]) => void {
    switch (level) {
      case 'DEBUG':
        return console.debug;
      case 'INFO':
        return console.info;
      case 'WARNING':
        return console.warn;
      case 'ERROR':
      case 'CRITICAL':
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Cleanup old logs
   */
  static async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const result = await db.query(
      `DELETE FROM ml_training_logs 
       WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'`
    );
    return result.rowCount || 0;
  }
}

export const mlTrainingLogger = MLTrainingLogger;
