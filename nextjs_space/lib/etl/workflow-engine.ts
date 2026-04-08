
/**
 * ETL Workflow Engine
 * Manages automated ETL workflows and orchestration
 */

import { db } from '@/lib/db';
import { ETLLogger } from './logger';
import { etlRetryManager } from './retry-manager';

export interface ETLWorkflow {
  id: number;
  name: string;
  description?: string;
  workflow_type: 'upload' | 'clean' | 'process' | 'train' | 'hybrid';
  source_config: any;
  destination_config: any;
  transformation_rules?: any;
  schedule_cron?: string;
  is_active: boolean;
  priority: number;
}

export interface ETLExecution {
  id?: number;
  workflow_id: number;
  execution_status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at?: Date;
  completed_at?: Date;
  duration_seconds?: number;
  records_processed: number;
  records_success: number;
  records_failed: number;
  error_message?: string;
  error_type?: string;
  execution_log?: any;
  triggered_by: 'manual' | 'scheduled' | 'api' | 'event';
}

export class ETLWorkflowEngine {
  /**
   * Get all active workflows
   */
  static async getActiveWorkflows(): Promise<ETLWorkflow[]> {
    const result = await db.query(
      'SELECT * FROM etl_workflows WHERE is_active = true ORDER BY priority DESC'
    );
    return result.rows;
  }

  /**
   * Get workflow by ID
   */
  static async getWorkflow(id: number): Promise<ETLWorkflow | null> {
    const result = await db.query(
      'SELECT * FROM etl_workflows WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create new workflow
   */
  static async createWorkflow(workflow: Omit<ETLWorkflow, 'id'>): Promise<number> {
    const result = await db.query(
      `INSERT INTO etl_workflows 
       (name, description, workflow_type, source_config, destination_config, 
        transformation_rules, schedule_cron, is_active, priority, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        workflow.name,
        workflow.description,
        workflow.workflow_type,
        JSON.stringify(workflow.source_config),
        JSON.stringify(workflow.destination_config),
        workflow.transformation_rules ? JSON.stringify(workflow.transformation_rules) : null,
        workflow.schedule_cron,
        workflow.is_active,
        workflow.priority,
        null // created_by - should be passed from auth context
      ]
    );
    return result.rows[0].id;
  }

  /**
   * Start workflow execution
   */
  static async startExecution(
    workflowId: number,
    triggeredBy: 'manual' | 'scheduled' | 'api' | 'event' = 'manual'
  ): Promise<number> {
    const result = await db.query(
      `INSERT INTO etl_executions 
       (workflow_id, execution_status, started_at, triggered_by, records_processed, records_success, records_failed)
       VALUES ($1, $2, $3, $4, 0, 0, 0)
       RETURNING id`,
      [workflowId, 'running', new Date(), triggeredBy]
    );
    return result.rows[0].id;
  }

  /**
   * Update execution status
   */
  static async updateExecution(
    executionId: number,
    updates: Partial<ETLExecution>
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.execution_status) {
      fields.push(`execution_status = $${paramIndex++}`);
      values.push(updates.execution_status);
    }

    if (updates.completed_at) {
      fields.push(`completed_at = $${paramIndex++}`);
      values.push(updates.completed_at);
    }

    if (updates.duration_seconds !== undefined) {
      fields.push(`duration_seconds = $${paramIndex++}`);
      values.push(updates.duration_seconds);
    }

    if (updates.records_processed !== undefined) {
      fields.push(`records_processed = $${paramIndex++}`);
      values.push(updates.records_processed);
    }

    if (updates.records_success !== undefined) {
      fields.push(`records_success = $${paramIndex++}`);
      values.push(updates.records_success);
    }

    if (updates.records_failed !== undefined) {
      fields.push(`records_failed = $${paramIndex++}`);
      values.push(updates.records_failed);
    }

    if (updates.error_message) {
      fields.push(`error_message = $${paramIndex++}`);
      values.push(updates.error_message);
    }

    if (updates.execution_log) {
      fields.push(`execution_log = $${paramIndex++}`);
      values.push(JSON.stringify(updates.execution_log));
    }

    if (fields.length > 0) {
      values.push(executionId);
      await db.query(
        `UPDATE etl_executions SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
    }
  }

  /**
   * Get execution history for a workflow
   */
  static async getExecutionHistory(
    workflowId: number,
    limit: number = 50
  ): Promise<any[]> {
    const result = await db.query(
      `SELECT * FROM etl_executions 
       WHERE workflow_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [workflowId, limit]
    );
    return result.rows;
  }

  /**
   * Record ETL metrics
   */
  static async recordMetric(
    workflowId: number,
    executionId: number,
    metricName: string,
    metricValue: number,
    metricUnit: string
  ): Promise<void> {
    await db.query(
      `INSERT INTO etl_metrics (workflow_id, execution_id, metric_name, metric_value, metric_unit)
       VALUES ($1, $2, $3, $4, $5)`,
      [workflowId, executionId, metricName, metricValue, metricUnit]
    );
  }

  /**
   * Execute workflow (main orchestration logic)
   */
  static async executeWorkflow(workflowId: number): Promise<{ success: boolean; executionId: number; message: string }> {
    const workflow = await this.getWorkflow(workflowId);
    
    if (!workflow) {
      return { success: false, executionId: 0, message: 'Workflow not found' };
    }

    if (!workflow.is_active) {
      return { success: false, executionId: 0, message: 'Workflow is not active' };
    }

    const executionId = await this.startExecution(workflowId, 'manual');
    const startTime = Date.now();

    // Log workflow start
    await ETLLogger.info(
      workflowId,
      executionId,
      `Starting workflow execution: ${workflow.name}`,
      { workflowType: workflow.workflow_type }
    );

    try {
      // Simulate ETL processing based on workflow type
      let result;
      
      switch (workflow.workflow_type) {
        case 'upload':
          result = await this.processUpload(workflow, executionId);
          break;
        case 'clean':
          result = await this.processClean(workflow, executionId);
          break;
        case 'process':
          result = await this.processData(workflow, executionId);
          break;
        case 'train':
          result = await this.processTrain(workflow, executionId);
          break;
        default:
          throw new Error(`Unknown workflow type: ${workflow.workflow_type}`);
      }

      const duration = Math.floor((Date.now() - startTime) / 1000);

      await this.updateExecution(executionId, {
        execution_status: 'completed',
        completed_at: new Date(),
        duration_seconds: duration,
        records_processed: result.processed,
        records_success: result.success,
        records_failed: result.failed
      });

      // Log success
      await ETLLogger.info(
        workflowId,
        executionId,
        `Workflow completed successfully`,
        {
          duration,
          processed: result.processed,
          success: result.success,
          failed: result.failed
        }
      );

      return { 
        success: true, 
        executionId, 
        message: `Workflow completed successfully. Processed ${result.processed} records.` 
      };

    } catch (error: any) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      
      // Determine error type
      const errorType = this.classifyError(error);
      
      await this.updateExecution(executionId, {
        execution_status: 'failed',
        completed_at: new Date(),
        duration_seconds: duration,
        error_message: error.message,
        error_type: errorType
      });

      // Log error
      await ETLLogger.error(
        workflowId,
        executionId,
        `Workflow execution failed: ${error.message}`,
        { error: error.stack, errorType }
      );

      // Check if should retry
      const shouldRetry = await etlRetryManager.shouldRetry(executionId);
      if (shouldRetry) {
        await ETLLogger.info(
          workflowId,
          executionId,
          'Workflow will be retried automatically',
          { errorType }
        );

        // Schedule retry (non-blocking)
        setTimeout(() => {
          etlRetryManager.retryExecution(executionId).catch(err => {
            console.error('Retry failed:', err);
          });
        }, 1000);
      }

      return { 
        success: false, 
        executionId, 
        message: `Workflow failed: ${error.message}` 
      };
    }
  }

  /**
   * Classify error type for retry logic
   */
  private static classifyError(error: any): string {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'TIMEOUT';
    } else if (message.includes('connection') || message.includes('network')) {
      return 'CONNECTION';
    } else if (message.includes('temporary') || message.includes('retry')) {
      return 'TEMPORARY';
    } else if (message.includes('permission') || message.includes('unauthorized')) {
      return 'PERMISSION';
    } else if (message.includes('validation') || message.includes('invalid')) {
      return 'VALIDATION';
    }
    
    return 'UNKNOWN';
  }

  /**
   * Process upload workflow
   */
  private static async processUpload(workflow: ETLWorkflow, executionId: number): Promise<{ processed: number; success: number; failed: number }> {
    // Simulate data upload processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const processed = Math.floor(Math.random() * 10000) + 5000;
    const failed = Math.floor(Math.random() * 100);
    const success = processed - failed;

    await this.recordMetric(workflow.id, executionId, 'upload_speed', 1500, 'records/sec');
    
    return { processed, success, failed };
  }

  /**
   * Process clean workflow
   */
  private static async processClean(workflow: ETLWorkflow, executionId: number): Promise<{ processed: number; success: number; failed: number }> {
    // Simulate data cleaning
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const processed = Math.floor(Math.random() * 8000) + 3000;
    const failed = Math.floor(Math.random() * 50);
    const success = processed - failed;

    await this.recordMetric(workflow.id, executionId, 'clean_rate', 95.5, 'percent');
    
    return { processed, success, failed };
  }

  /**
   * Process data transformation
   */
  private static async processData(workflow: ETLWorkflow, executionId: number): Promise<{ processed: number; success: number; failed: number }> {
    // Simulate data processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const processed = Math.floor(Math.random() * 6000) + 2000;
    const failed = Math.floor(Math.random() * 30);
    const success = processed - failed;

    await this.recordMetric(workflow.id, executionId, 'transformation_time', 2.8, 'seconds');
    
    return { processed, success, failed };
  }

  /**
   * Process training workflow
   */
  private static async processTrain(workflow: ETLWorkflow, executionId: number): Promise<{ processed: number; success: number; failed: number }> {
    // Simulate ML training
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const processed = Math.floor(Math.random() * 5000) + 1000;
    const success = processed;
    const failed = 0;

    await this.recordMetric(workflow.id, executionId, 'model_accuracy', 92.5, 'percent');
    await this.recordMetric(workflow.id, executionId, 'training_time', 4.8, 'seconds');
    
    return { processed, success, failed };
  }
}
