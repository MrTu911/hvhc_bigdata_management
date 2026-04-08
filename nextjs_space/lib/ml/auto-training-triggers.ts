
/**
 * Auto-Training Triggers System
 * Automatically triggers ML training based on events and conditions
 */

import { db } from '@/lib/db';
import { MLTrainingLogger } from './training-logger';
import { notificationDispatcher } from '@/lib/notifications/dispatcher';

export interface AutoTrainingTrigger {
  id?: number;
  triggerName: string;
  modelId: number;
  triggerType: 'DATA_UPLOAD' | 'SCHEDULED' | 'METRIC_THRESHOLD' | 'MANUAL';
  triggerCondition?: any;
  scheduleCron?: string;
  isActive: boolean;
  lastTriggeredAt?: Date;
  triggerCount: number;
  config?: any;
}

export class AutoTrainingTriggers {
  /**
   * Create a new trigger
   */
  static async createTrigger(trigger: Omit<AutoTrainingTrigger, 'id' | 'triggerCount'>): Promise<number> {
    const result = await db.query(
      `INSERT INTO ml_auto_training_triggers 
       (trigger_name, model_id, trigger_type, trigger_condition, schedule_cron, is_active, config, trigger_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
       RETURNING id`,
      [
        trigger.triggerName,
        trigger.modelId,
        trigger.triggerType,
        trigger.triggerCondition ? JSON.stringify(trigger.triggerCondition) : null,
        trigger.scheduleCron || null,
        trigger.isActive,
        trigger.config ? JSON.stringify(trigger.config) : null
      ]
    );

    return result.rows[0].id;
  }

  /**
   * Get trigger by ID
   */
  static async getTrigger(id: number): Promise<AutoTrainingTrigger | null> {
    const result = await db.query(
      'SELECT * FROM ml_auto_training_triggers WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.parseTrigger(result.rows[0]);
  }

  /**
   * Get all active triggers
   */
  static async getActiveTriggers(): Promise<AutoTrainingTrigger[]> {
    const result = await db.query(
      'SELECT * FROM ml_auto_training_triggers WHERE is_active = true ORDER BY created_at DESC'
    );

    return result.rows.map(row => this.parseTrigger(row));
  }

  /**
   * Get triggers for a model
   */
  static async getModelTriggers(modelId: number): Promise<AutoTrainingTrigger[]> {
    const result = await db.query(
      'SELECT * FROM ml_auto_training_triggers WHERE model_id = $1 ORDER BY created_at DESC',
      [modelId]
    );

    return result.rows.map(row => this.parseTrigger(row));
  }

  /**
   * Check and execute data upload triggers
   */
  static async checkDataUploadTriggers(datasetId: number, datasetSize: number): Promise<void> {
    const triggers = await db.query(
      `SELECT * FROM ml_auto_training_triggers 
       WHERE trigger_type = 'DATA_UPLOAD' 
       AND is_active = true`
    );

    for (const row of triggers.rows) {
      const trigger = this.parseTrigger(row);
      
      // Check if condition is met
      if (this.evaluateDataUploadCondition(trigger.triggerCondition, datasetSize)) {
        await this.executeTrigger(trigger.id!, {
          event: 'data_upload',
          datasetId,
          datasetSize
        });
      }
    }
  }

  /**
   * Check metric threshold triggers
   */
  static async checkMetricThresholdTriggers(
    modelId: number,
    metricName: string,
    metricValue: number
  ): Promise<void> {
    const triggers = await db.query(
      `SELECT * FROM ml_auto_training_triggers 
       WHERE model_id = $1 
       AND trigger_type = 'METRIC_THRESHOLD' 
       AND is_active = true`,
      [modelId]
    );

    for (const row of triggers.rows) {
      const trigger = this.parseTrigger(row);
      
      if (this.evaluateMetricThreshold(trigger.triggerCondition, metricName, metricValue)) {
        await this.executeTrigger(trigger.id!, {
          event: 'metric_threshold',
          metricName,
          metricValue
        });
      }
    }
  }

  /**
   * Execute a trigger
   */
  static async executeTrigger(triggerId: number, context?: any): Promise<void> {
    const trigger = await this.getTrigger(triggerId);
    
    if (!trigger) {
      console.error(`Trigger ${triggerId} not found`);
      return;
    }

    if (!trigger.isActive) {
      console.log(`Trigger ${triggerId} is not active`);
      return;
    }

    try {
      // Log trigger execution
      await MLTrainingLogger.log({
        level: 'INFO',
        message: `Auto-training trigger "${trigger.triggerName}" executed`,
        details: { trigger, context }
      });

      // Update trigger stats
      await db.query(
        `UPDATE ml_auto_training_triggers 
         SET last_triggered_at = NOW(),
             trigger_count = trigger_count + 1
         WHERE id = $1`,
        [triggerId]
      );

      // Send notification
      await notificationDispatcher.sendAlert({
        title: 'Auto-Training Triggered',
        message: `Training automatically triggered for model ${trigger.modelId}: ${trigger.triggerName}`,
        severity: 'INFO',
        details: { trigger, context }
      });

      // Here you would call the actual training API
      // For now, we'll just log it
      console.log(`🤖 Auto-training triggered for model ${trigger.modelId}`);
      console.log('Training config:', trigger.config);

    } catch (error: any) {
      console.error('Error executing trigger:', error);
      
      await MLTrainingLogger.log({
        level: 'ERROR',
        message: `Failed to execute trigger "${trigger.triggerName}"`,
        details: { error: error.message, trigger, context }
      });
    }
  }

  /**
   * Update trigger
   */
  static async updateTrigger(id: number, updates: Partial<AutoTrainingTrigger>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.triggerName !== undefined) {
      fields.push(`trigger_name = $${paramIndex++}`);
      values.push(updates.triggerName);
    }

    if (updates.triggerCondition !== undefined) {
      fields.push(`trigger_condition = $${paramIndex++}`);
      values.push(JSON.stringify(updates.triggerCondition));
    }

    if (updates.scheduleCron !== undefined) {
      fields.push(`schedule_cron = $${paramIndex++}`);
      values.push(updates.scheduleCron);
    }

    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(updates.isActive);
    }

    if (updates.config !== undefined) {
      fields.push(`config = $${paramIndex++}`);
      values.push(JSON.stringify(updates.config));
    }

    if (fields.length > 0) {
      fields.push(`updated_at = NOW()`);
      values.push(id);
      
      await db.query(
        `UPDATE ml_auto_training_triggers 
         SET ${fields.join(', ')} 
         WHERE id = $${paramIndex}`,
        values
      );
    }
  }

  /**
   * Delete trigger
   */
  static async deleteTrigger(id: number): Promise<void> {
    await db.query('DELETE FROM ml_auto_training_triggers WHERE id = $1', [id]);
  }

  /**
   * Evaluate data upload condition
   */
  private static evaluateDataUploadCondition(condition: any, datasetSize: number): boolean {
    if (!condition) return true;

    if (condition.dataset_size) {
      const threshold = parseInt(condition.dataset_size.replace(/[^\d]/g, ''));
      if (condition.dataset_size.startsWith('>')) {
        return datasetSize > threshold;
      } else if (condition.dataset_size.startsWith('<')) {
        return datasetSize < threshold;
      } else if (condition.dataset_size.startsWith('>=')) {
        return datasetSize >= threshold;
      }
    }

    return true;
  }

  /**
   * Evaluate metric threshold condition
   */
  private static evaluateMetricThreshold(
    condition: any,
    metricName: string,
    metricValue: number
  ): boolean {
    if (!condition || !condition[metricName]) return false;

    const threshold = parseFloat(condition[metricName].replace(/[^\d.]/g, ''));
    
    if (condition[metricName].includes('>')) {
      return metricValue > threshold;
    } else if (condition[metricName].includes('<')) {
      return metricValue < threshold;
    }

    return false;
  }

  /**
   * Parse database row to AutoTrainingTrigger
   */
  private static parseTrigger(row: any): AutoTrainingTrigger {
    return {
      id: row.id,
      triggerName: row.trigger_name,
      modelId: row.model_id,
      triggerType: row.trigger_type,
      triggerCondition: row.trigger_condition,
      scheduleCron: row.schedule_cron,
      isActive: row.is_active,
      lastTriggeredAt: row.last_triggered_at,
      triggerCount: row.trigger_count,
      config: row.config
    };
  }

  /**
   * Get trigger statistics
   */
  static async getTriggerStats(modelId?: number): Promise<any> {
    const whereClause = modelId ? `WHERE model_id = ${modelId}` : '';
    
    const result = await db.query(`
      SELECT 
        trigger_type,
        COUNT(*) as total_triggers,
        COUNT(CASE WHEN is_active THEN 1 END) as active_triggers,
        SUM(trigger_count) as total_executions,
        MAX(last_triggered_at) as last_execution
      FROM ml_auto_training_triggers
      ${whereClause}
      GROUP BY trigger_type
    `);

    return result.rows;
  }
}

export const autoTrainingTriggers = AutoTrainingTriggers;
