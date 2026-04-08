
/**
 * ETL Scheduler with Cron Support
 * Automated workflow scheduling and management
 */

import * as cron from 'node-cron';
import { ETLWorkflowEngine } from './workflow-engine';
import { db } from '@/lib/db';
import { notificationDispatcher } from '@/lib/notifications/dispatcher';

export interface ScheduledWorkflow {
  id: number;
  workflow_id: number;
  schedule_cron: string;
  is_active: boolean;
  last_run?: Date;
  next_run?: Date;
  execution_count: number;
  success_count: number;
  failure_count: number;
}

export class ETLScheduler {
  private static instance: ETLScheduler;
  private scheduledTasks: Map<number, cron.ScheduledTask> = new Map();

  private constructor() {}

  static getInstance(): ETLScheduler {
    if (!ETLScheduler.instance) {
      ETLScheduler.instance = new ETLScheduler();
    }
    return ETLScheduler.instance;
  }

  /**
   * Initialize scheduler - load and start all active scheduled workflows
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing ETL Scheduler...');
    
    try {
      const scheduledWorkflows = await this.getScheduledWorkflows();
      
      for (const schedule of scheduledWorkflows) {
        if (schedule.is_active && schedule.schedule_cron) {
          await this.scheduleWorkflow(schedule.workflow_id, schedule.schedule_cron);
        }
      }
      
      console.log(`✅ ETL Scheduler initialized with ${scheduledWorkflows.length} workflows`);
    } catch (error) {
      console.error('❌ Failed to initialize ETL Scheduler:', error);
    }
  }

  /**
   * Schedule a workflow with cron expression
   */
  async scheduleWorkflow(workflowId: number, cronExpression: string): Promise<void> {
    try {
      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        throw new Error(`Invalid cron expression: ${cronExpression}`);
      }

      // Stop existing task if exists
      this.unscheduleWorkflow(workflowId);

      // Create new scheduled task
      const task = cron.schedule(cronExpression, async () => {
        console.log(`⚙️ Executing scheduled workflow ${workflowId}...`);
        await this.executeScheduledWorkflow(workflowId);
      });

      // Start the task (tasks are started by default)
      this.scheduledTasks.set(workflowId, task);

      // Update schedule info in database
      await this.updateScheduleInfo(workflowId, cronExpression, true);

      console.log(`📅 Workflow ${workflowId} scheduled with cron: ${cronExpression}`);
    } catch (error) {
      console.error(`❌ Failed to schedule workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Unschedule a workflow
   */
  unscheduleWorkflow(workflowId: number): void {
    const task = this.scheduledTasks.get(workflowId);
    if (task) {
      task.stop();
      task.destroy();
      this.scheduledTasks.delete(workflowId);
      console.log(`⏹️ Workflow ${workflowId} unscheduled`);
    }
  }

  /**
   * Execute scheduled workflow
   */
  private async executeScheduledWorkflow(workflowId: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Update execution count and last run
      await this.updateExecutionStats(workflowId, 'started');
      
      // Execute workflow
      const result = await ETLWorkflowEngine.executeWorkflow(workflowId);
      
      // Update stats based on result
      if (result.success) {
        await this.updateExecutionStats(workflowId, 'success');
        
        // Send success notification
        await notificationDispatcher.sendAlert({
          title: 'ETL Workflow Completed',
          message: `Workflow ${workflowId} executed successfully: ${result.message}`,
          severity: 'INFO',
          details: {
            workflowId,
            executionId: result.executionId,
            duration: Math.floor((Date.now() - startTime) / 1000)
          }
        });
      } else {
        await this.updateExecutionStats(workflowId, 'failure');
        
        // Send failure notification
        await notificationDispatcher.sendAlert({
          title: 'ETL Workflow Failed',
          message: `Workflow ${workflowId} execution failed: ${result.message}`,
          severity: 'ERROR',
          details: {
            workflowId,
            executionId: result.executionId,
            error: result.message
          }
        });
      }
      
    } catch (error: any) {
      await this.updateExecutionStats(workflowId, 'failure');
      
      console.error(`❌ Scheduled workflow ${workflowId} failed:`, error);
      
      // Send error notification
      await notificationDispatcher.sendAlert({
        title: 'ETL Workflow Error',
        message: `Workflow ${workflowId} encountered an error: ${error.message}`,
        severity: 'CRITICAL',
        details: {
          workflowId,
          error: error.message,
          stack: error.stack
        }
      });
    }
  }

  /**
   * Get all scheduled workflows
   */
  async getScheduledWorkflows(): Promise<ScheduledWorkflow[]> {
    const result = await db.query(`
      SELECT w.id as workflow_id, w.name, w.description, w.schedule_cron, w.is_active,
             s.last_run, s.next_run, s.execution_count, s.success_count, s.failure_count
      FROM etl_workflows w
      LEFT JOIN etl_schedules s ON w.id = s.workflow_id
      WHERE w.schedule_cron IS NOT NULL
      ORDER BY w.priority DESC
    `);
    
    return result.rows;
  }

  /**
   * Update schedule information
   */
  private async updateScheduleInfo(
    workflowId: number, 
    cronExpression: string, 
    isActive: boolean
  ): Promise<void> {
    // Calculate next run time
    const nextRun = this.getNextRunTime(cronExpression);
    
    await db.query(`
      INSERT INTO etl_schedules (workflow_id, schedule_cron, is_active, next_run, execution_count, success_count, failure_count)
      VALUES ($1, $2, $3, $4, 0, 0, 0)
      ON CONFLICT (workflow_id) 
      DO UPDATE SET 
        schedule_cron = $2,
        is_active = $3,
        next_run = $4,
        updated_at = NOW()
    `, [workflowId, cronExpression, isActive, nextRun]);
  }

  /**
   * Update execution statistics
   */
  private async updateExecutionStats(
    workflowId: number, 
    status: 'started' | 'success' | 'failure'
  ): Promise<void> {
    const now = new Date();
    
    switch (status) {
      case 'started':
        await db.query(`
          UPDATE etl_schedules 
          SET last_run = $1, 
              next_run = $2,
              execution_count = execution_count + 1
          WHERE workflow_id = $3
        `, [now, this.calculateNextRun(workflowId), workflowId]);
        break;
        
      case 'success':
        await db.query(`
          UPDATE etl_schedules 
          SET success_count = success_count + 1
          WHERE workflow_id = $1
        `, [workflowId]);
        break;
        
      case 'failure':
        await db.query(`
          UPDATE etl_schedules 
          SET failure_count = failure_count + 1
          WHERE workflow_id = $1
        `, [workflowId]);
        break;
    }
  }

  /**
   * Calculate next run time based on cron expression
   */
  private getNextRunTime(cronExpression: string): Date {
    // Simple implementation - for production use a proper cron parser
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Default to 5 minutes from now
    return now;
  }

  /**
   * Calculate next run for existing workflow
   */
  private async calculateNextRun(workflowId: number): Promise<Date> {
    const result = await db.query(
      'SELECT schedule_cron FROM etl_schedules WHERE workflow_id = $1',
      [workflowId]
    );
    
    if (result.rows[0]?.schedule_cron) {
      return this.getNextRunTime(result.rows[0].schedule_cron);
    }
    
    const now = new Date();
    now.setHours(now.getHours() + 1); // Default to 1 hour from now
    return now;
  }

  /**
   * Get scheduler status
   */
  getStatus(): any {
    return {
      totalScheduled: this.scheduledTasks.size,
      activeWorkflows: Array.from(this.scheduledTasks.keys()),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Stop all scheduled tasks
   */
  shutdown(): void {
    console.log('🛑 Shutting down ETL Scheduler...');
    
    for (const [workflowId, task] of this.scheduledTasks) {
      task.stop();
      task.destroy();
      console.log(`⏹️ Stopped workflow ${workflowId}`);
    }
    
    this.scheduledTasks.clear();
    console.log('✅ ETL Scheduler shutdown complete');
  }
}

// Export singleton instance
export const etlScheduler = ETLScheduler.getInstance();
