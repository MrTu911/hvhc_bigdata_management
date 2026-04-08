
/**
 * ETL Logging System
 * Comprehensive logging for all ETL operations
 */

import { db } from '@/lib/db';

export type ETLLogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface ETLLogEntry {
  workflowId?: number;
  executionId?: number;
  level: ETLLogLevel;
  message: string;
  details?: any;
  source?: string;
}

export class ETLLogger {
  /**
   * Log an ETL event
   */
  static async log(entry: ETLLogEntry): Promise<void> {
    try {
      await db.query(
        `INSERT INTO etl_logs (workflow_id, execution_id, log_level, log_message, log_details, source, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          entry.workflowId || null,
          entry.executionId || null,
          entry.level,
          entry.message,
          entry.details ? JSON.stringify(entry.details) : null,
          entry.source || 'system'
        ]
      );

      // Also log to console for debugging
      const consoleMethod = this.getConsoleMethod(entry.level);
      consoleMethod(`[ETL ${entry.level}]`, entry.message, entry.details || '');
    } catch (error) {
      console.error('Failed to write ETL log:', error);
    }
  }

  /**
   * Log DEBUG level
   */
  static async debug(workflowId: number, executionId: number, message: string, details?: any): Promise<void> {
    await this.log({
      workflowId,
      executionId,
      level: 'DEBUG',
      message,
      details,
      source: 'workflow-engine'
    });
  }

  /**
   * Log INFO level
   */
  static async info(workflowId: number, executionId: number, message: string, details?: any): Promise<void> {
    await this.log({
      workflowId,
      executionId,
      level: 'INFO',
      message,
      details,
      source: 'workflow-engine'
    });
  }

  /**
   * Log WARNING level
   */
  static async warning(workflowId: number, executionId: number, message: string, details?: any): Promise<void> {
    await this.log({
      workflowId,
      executionId,
      level: 'WARNING',
      message,
      details,
      source: 'workflow-engine'
    });
  }

  /**
   * Log ERROR level
   */
  static async error(workflowId: number, executionId: number, message: string, details?: any): Promise<void> {
    await this.log({
      workflowId,
      executionId,
      level: 'ERROR',
      message,
      details,
      source: 'workflow-engine'
    });
  }

  /**
   * Log CRITICAL level
   */
  static async critical(workflowId: number, executionId: number, message: string, details?: any): Promise<void> {
    await this.log({
      workflowId,
      executionId,
      level: 'CRITICAL',
      message,
      details,
      source: 'workflow-engine'
    });
  }

  /**
   * Get logs for a workflow execution
   */
  static async getExecutionLogs(executionId: number, level?: ETLLogLevel): Promise<any[]> {
    const query = level
      ? 'SELECT * FROM etl_logs WHERE execution_id = $1 AND log_level = $2 ORDER BY timestamp DESC'
      : 'SELECT * FROM etl_logs WHERE execution_id = $1 ORDER BY timestamp DESC';
    
    const params = level ? [executionId, level] : [executionId];
    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get logs for a workflow (all executions)
   */
  static async getWorkflowLogs(workflowId: number, limit: number = 100): Promise<any[]> {
    const result = await db.query(
      `SELECT * FROM etl_logs 
       WHERE workflow_id = $1 
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [workflowId, limit]
    );
    return result.rows;
  }

  /**
   * Get recent errors
   */
  static async getRecentErrors(hours: number = 24, limit: number = 50): Promise<any[]> {
    const result = await db.query(
      `SELECT * FROM etl_logs 
       WHERE log_level IN ('ERROR', 'CRITICAL') 
       AND timestamp > NOW() - INTERVAL '${hours} hours'
       ORDER BY timestamp DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Clear old logs (retention policy)
   */
  static async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const result = await db.query(
      `DELETE FROM etl_logs 
       WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'`
    );
    return result.rowCount || 0;
  }

  /**
   * Get console method based on log level
   */
  private static getConsoleMethod(level: ETLLogLevel): (...args: any[]) => void {
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
   * Get log statistics
   */
  static async getLogStats(workflowId?: number, hours: number = 24): Promise<any> {
    const whereClause = workflowId 
      ? `WHERE workflow_id = ${workflowId} AND timestamp > NOW() - INTERVAL '${hours} hours'`
      : `WHERE timestamp > NOW() - INTERVAL '${hours} hours'`;

    const result = await db.query(`
      SELECT 
        log_level,
        COUNT(*) as count,
        MIN(timestamp) as first_occurrence,
        MAX(timestamp) as last_occurrence
      FROM etl_logs
      ${whereClause}
      GROUP BY log_level
      ORDER BY count DESC
    `);

    return result.rows;
  }
}

export const etlLogger = ETLLogger;
