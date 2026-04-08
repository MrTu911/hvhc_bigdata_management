
/**
 * ETL Retry Manager
 * Handles retry logic for failed ETL workflows
 */

import { db } from '@/lib/db';
import { ETLWorkflowEngine } from './workflow-engine';
import { ETLLogger } from './logger';
import { notificationDispatcher } from '@/lib/notifications/dispatcher';

export interface RetryConfig {
  maxRetries: number;
  retryDelaySeconds: number;
  exponentialBackoff: boolean;
  retryOnErrorTypes: string[];
  isActive: boolean;
}

export class ETLRetryManager {
  /**
   * Get retry configuration for a workflow
   */
  static async getRetryConfig(workflowId: number): Promise<RetryConfig | null> {
    const result = await db.query(
      'SELECT * FROM etl_retry_config WHERE workflow_id = $1',
      [workflowId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      maxRetries: row.max_retries,
      retryDelaySeconds: row.retry_delay_seconds,
      exponentialBackoff: row.exponential_backoff,
      retryOnErrorTypes: row.retry_on_error_types || [],
      isActive: row.is_active
    };
  }

  /**
   * Set retry configuration for a workflow
   */
  static async setRetryConfig(workflowId: number, config: Partial<RetryConfig>): Promise<void> {
    await db.query(
      `INSERT INTO etl_retry_config 
       (workflow_id, max_retries, retry_delay_seconds, exponential_backoff, retry_on_error_types, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (workflow_id) 
       DO UPDATE SET 
         max_retries = $2,
         retry_delay_seconds = $3,
         exponential_backoff = $4,
         retry_on_error_types = $5,
         is_active = $6,
         updated_at = NOW()`,
      [
        workflowId,
        config.maxRetries ?? 3,
        config.retryDelaySeconds ?? 300,
        config.exponentialBackoff ?? true,
        config.retryOnErrorTypes ?? ['TIMEOUT', 'CONNECTION', 'TEMPORARY'],
        config.isActive ?? true
      ]
    );
  }

  /**
   * Check if an execution should be retried
   */
  static async shouldRetry(executionId: number): Promise<boolean> {
    const result = await db.query(
      `SELECT e.workflow_id, e.retry_count, e.error_type, e.execution_status,
              r.max_retries, r.retry_on_error_types, r.is_active
       FROM etl_executions e
       LEFT JOIN etl_retry_config r ON e.workflow_id = r.workflow_id
       WHERE e.id = $1`,
      [executionId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const execution = result.rows[0];

    // Check if retry is active
    if (!execution.is_active) {
      return false;
    }

    // Check if we've exceeded max retries
    if (execution.retry_count >= (execution.max_retries || 3)) {
      await ETLLogger.warning(
        execution.workflow_id,
        executionId,
        'Max retries exceeded',
        { retryCount: execution.retry_count, maxRetries: execution.max_retries }
      );
      return false;
    }

    // Check if error type is retryable
    const retryableTypes = execution.retry_on_error_types || ['TIMEOUT', 'CONNECTION', 'TEMPORARY'];
    if (execution.error_type && !retryableTypes.includes(execution.error_type)) {
      await ETLLogger.info(
        execution.workflow_id,
        executionId,
        'Error type not retryable',
        { errorType: execution.error_type, retryableTypes }
      );
      return false;
    }

    return execution.execution_status === 'failed';
  }

  /**
   * Retry a failed execution
   */
  static async retryExecution(executionId: number): Promise<{ success: boolean; message: string; newExecutionId?: number }> {
    try {
      // Check if should retry
      const shouldRetry = await this.shouldRetry(executionId);
      if (!shouldRetry) {
        return { success: false, message: 'Execution cannot be retried' };
      }

      // Get execution details
      const execResult = await db.query(
        `SELECT workflow_id, retry_count, original_execution_id
         FROM etl_executions 
         WHERE id = $1`,
        [executionId]
      );

      if (execResult.rows.length === 0) {
        return { success: false, message: 'Execution not found' };
      }

      const { workflow_id, retry_count } = execResult.rows[0];
      const original_execution_id = execResult.rows[0].original_execution_id || executionId;

      // Get retry config
      const config = await this.getRetryConfig(workflow_id);
      if (!config) {
        return { success: false, message: 'No retry configuration found' };
      }

      // Calculate retry delay
      const delay = this.calculateRetryDelay(retry_count, config);
      
      await ETLLogger.info(
        workflow_id,
        executionId,
        `Scheduling retry attempt ${retry_count + 1} after ${delay}ms delay`,
        { config }
      );

      // Record retry attempt
      await db.query(
        `INSERT INTO etl_retry_history 
         (execution_id, retry_attempt, retry_reason, retry_started_at)
         VALUES ($1, $2, $3, NOW())`,
        [executionId, retry_count + 1, 'Automatic retry after failure']
      );

      // Wait for delay
      await new Promise(resolve => setTimeout(resolve, delay));

      // Create new execution with retry flag
      const newExecResult = await db.query(
        `INSERT INTO etl_executions 
         (workflow_id, execution_status, started_at, triggered_by, retry_count, max_retries, is_retry, original_execution_id, records_processed, records_success, records_failed)
         VALUES ($1, 'running', NOW(), 'retry', $2, $3, true, $4, 0, 0, 0)
         RETURNING id`,
        [workflow_id, retry_count + 1, config.maxRetries, original_execution_id]
      );

      const newExecutionId = newExecResult.rows[0].id;

      // Execute workflow
      const result = await ETLWorkflowEngine.executeWorkflow(workflow_id);

      // Update retry history
      await db.query(
        `UPDATE etl_retry_history 
         SET retry_completed_at = NOW(), 
             retry_status = $1,
             error_message = $2
         WHERE execution_id = $3 
         AND retry_attempt = $4`,
        [result.success ? 'success' : 'failed', result.message, executionId, retry_count + 1]
      );

      if (result.success) {
        await ETLLogger.info(
          workflow_id,
          newExecutionId,
          `Retry successful on attempt ${retry_count + 1}`,
          { originalExecutionId: executionId }
        );

        // Send success notification
        await notificationDispatcher.sendAlert({
          title: 'ETL Retry Successful',
          message: `Workflow ${workflow_id} succeeded after ${retry_count + 1} retry attempts`,
          severity: 'INFO',
          details: { workflowId: workflow_id, retryAttempt: retry_count + 1 }
        });

        return {
          success: true,
          message: `Retry successful after ${retry_count + 1} attempts`,
          newExecutionId
        };
      } else {
        // Check if we should retry again
        const shouldRetryAgain = await this.shouldRetry(newExecutionId);
        if (shouldRetryAgain) {
          // Schedule next retry
          setTimeout(() => {
            this.retryExecution(newExecutionId).catch(console.error);
          }, 1000);
        } else {
          // Max retries reached - send critical notification
          await notificationDispatcher.sendAlert({
            title: 'ETL Max Retries Exceeded',
            message: `Workflow ${workflow_id} failed after ${retry_count + 1} retry attempts`,
            severity: 'CRITICAL',
            details: { workflowId: workflow_id, totalAttempts: retry_count + 1 }
          });
        }

        return {
          success: false,
          message: `Retry failed: ${result.message}`,
          newExecutionId
        };
      }
    } catch (error: any) {
      console.error('Error during retry:', error);
      return {
        success: false,
        message: `Retry error: ${error.message}`
      };
    }
  }

  /**
   * Calculate retry delay with optional exponential backoff
   */
  private static calculateRetryDelay(retryCount: number, config: RetryConfig): number {
    const baseDelay = config.retryDelaySeconds * 1000; // Convert to milliseconds

    if (!config.exponentialBackoff) {
      return baseDelay;
    }

    // Exponential backoff: delay * (2 ^ retryCount)
    // Capped at 1 hour
    const delay = baseDelay * Math.pow(2, retryCount);
    return Math.min(delay, 3600000); // Max 1 hour
  }

  /**
   * Get retry history for an execution
   */
  static async getRetryHistory(executionId: number): Promise<any[]> {
    const result = await db.query(
      `SELECT * FROM etl_retry_history 
       WHERE execution_id = $1 
       ORDER BY retry_attempt ASC`,
      [executionId]
    );
    return result.rows;
  }

  /**
   * Get retry statistics for a workflow
   */
  static async getRetryStats(workflowId: number): Promise<any> {
    const result = await db.query(
      `SELECT 
         COUNT(DISTINCT rh.execution_id) as total_retried_executions,
         SUM(rh.retry_attempt) as total_retry_attempts,
         COUNT(CASE WHEN rh.retry_status = 'success' THEN 1 END) as successful_retries,
         COUNT(CASE WHEN rh.retry_status = 'failed' THEN 1 END) as failed_retries,
         AVG(EXTRACT(EPOCH FROM (rh.retry_completed_at - rh.retry_started_at))) as avg_retry_duration_seconds
       FROM etl_retry_history rh
       JOIN etl_executions e ON rh.execution_id = e.id
       WHERE e.workflow_id = $1`,
      [workflowId]
    );

    return result.rows[0];
  }
}

export const etlRetryManager = ETLRetryManager;
