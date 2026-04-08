
/**
 * ML Model Registry
 * Central registry for managing ML model versions, deployment, and lifecycle
 */

import { db } from '@/lib/db';

export interface ModelVersion {
  id?: number;
  modelId: number;
  version: string;
  modelPath?: string;
  modelSizeMb?: number;
  framework?: string;
  frameworkVersion?: string;
  metrics?: any;
  hyperparameters?: any;
  trainingDurationSeconds?: number;
  datasetInfo?: any;
  status: 'REGISTERED' | 'STAGED' | 'PRODUCTION' | 'ARCHIVED' | 'DEPRECATED';
  isProduction: boolean;
  promotedAt?: Date;
  promotedBy?: string;
  tags?: string[];
  description?: string;
}

export class ModelRegistry {
  /**
   * Register a new model version
   */
  static async registerModel(version: Omit<ModelVersion, 'id'>): Promise<number> {
    const result = await db.query(
      `INSERT INTO ml_model_registry 
       (model_id, version, model_path, model_size_mb, framework, framework_version,
        metrics, hyperparameters, training_duration_seconds, dataset_info, status,
        is_production, tags, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id`,
      [
        version.modelId,
        version.version,
        version.modelPath || null,
        version.modelSizeMb || null,
        version.framework || null,
        version.frameworkVersion || null,
        version.metrics ? JSON.stringify(version.metrics) : null,
        version.hyperparameters ? JSON.stringify(version.hyperparameters) : null,
        version.trainingDurationSeconds || null,
        version.datasetInfo ? JSON.stringify(version.datasetInfo) : null,
        version.status || 'REGISTERED',
        version.isProduction || false,
        version.tags || [],
        version.description || null
      ]
    );

    return result.rows[0].id;
  }

  /**
   * Get model version by ID
   */
  static async getModelVersion(id: number): Promise<ModelVersion | null> {
    const result = await db.query(
      'SELECT * FROM ml_model_registry WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.parseModelVersion(result.rows[0]);
  }

  /**
   * Get all versions for a model
   */
  static async getModelVersions(modelId: number): Promise<ModelVersion[]> {
    const result = await db.query(
      `SELECT * FROM ml_model_registry 
       WHERE model_id = $1 
       ORDER BY created_at DESC`,
      [modelId]
    );

    return result.rows.map(row => this.parseModelVersion(row));
  }

  /**
   * Get production version
   */
  static async getProductionVersion(modelId: number): Promise<ModelVersion | null> {
    const result = await db.query(
      `SELECT * FROM ml_model_registry 
       WHERE model_id = $1 AND is_production = true 
       ORDER BY promoted_at DESC 
       LIMIT 1`,
      [modelId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.parseModelVersion(result.rows[0]);
  }

  /**
   * Promote model version to production
   */
  static async promoteToProduction(
    id: number,
    promotedBy: string
  ): Promise<void> {
    // Start transaction
    await db.query('BEGIN');

    try {
      // Get the model version
      const version = await this.getModelVersion(id);
      if (!version) {
        throw new Error('Model version not found');
      }

      // Demote current production version
      await db.query(
        `UPDATE ml_model_registry 
         SET is_production = false, status = 'ARCHIVED'
         WHERE model_id = $1 AND is_production = true`,
        [version.modelId]
      );

      // Promote new version
      await db.query(
        `UPDATE ml_model_registry 
         SET is_production = true, 
             status = 'PRODUCTION',
             promoted_at = NOW(),
             promoted_by = $1
         WHERE id = $2`,
        [promotedBy, id]
      );

      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Update model version status
   */
  static async updateStatus(
    id: number,
    status: ModelVersion['status']
  ): Promise<void> {
    await db.query(
      'UPDATE ml_model_registry SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );
  }

  /**
   * Archive old versions
   */
  static async archiveOldVersions(
    modelId: number,
    keepLatest: number = 5
  ): Promise<number> {
    const result = await db.query(
      `UPDATE ml_model_registry
       SET status = 'ARCHIVED'
       WHERE model_id = $1 
       AND is_production = false
       AND status != 'ARCHIVED'
       AND id NOT IN (
         SELECT id FROM ml_model_registry
         WHERE model_id = $1 AND is_production = false
         ORDER BY created_at DESC
         LIMIT $2
       )`,
      [modelId, keepLatest]
    );

    return result.rowCount || 0;
  }

  /**
   * Compare model versions
   */
  static async compareVersions(versionIds: number[]): Promise<any> {
    const result = await db.query(
      `SELECT id, model_id, version, metrics, hyperparameters, 
              training_duration_seconds, dataset_info, status, created_at
       FROM ml_model_registry
       WHERE id = ANY($1)
       ORDER BY created_at DESC`,
      [versionIds]
    );

    return result.rows.map(row => ({
      ...this.parseModelVersion(row),
      metrics: row.metrics,
      hyperparameters: row.hyperparameters,
      datasetInfo: row.dataset_info
    }));
  }

  /**
   * Get model version statistics
   */
  static async getModelStats(modelId: number): Promise<any> {
    const result = await db.query(
      `SELECT 
         COUNT(*) as total_versions,
         COUNT(CASE WHEN status = 'PRODUCTION' THEN 1 END) as production_count,
         COUNT(CASE WHEN status = 'STAGED' THEN 1 END) as staged_count,
         COUNT(CASE WHEN status = 'ARCHIVED' THEN 1 END) as archived_count,
         AVG(model_size_mb) as avg_size_mb,
         AVG(training_duration_seconds) as avg_training_duration
       FROM ml_model_registry
       WHERE model_id = $1`,
      [modelId]
    );

    return result.rows[0];
  }

  /**
   * Search models by tags
   */
  static async searchByTags(tags: string[]): Promise<ModelVersion[]> {
    const result = await db.query(
      `SELECT * FROM ml_model_registry
       WHERE tags && $1
       ORDER BY created_at DESC`,
      [tags]
    );

    return result.rows.map(row => this.parseModelVersion(row));
  }

  /**
   * Parse database row to ModelVersion
   */
  private static parseModelVersion(row: any): ModelVersion {
    return {
      id: row.id,
      modelId: row.model_id,
      version: row.version,
      modelPath: row.model_path,
      modelSizeMb: row.model_size_mb ? parseFloat(row.model_size_mb) : undefined,
      framework: row.framework,
      frameworkVersion: row.framework_version,
      metrics: row.metrics,
      hyperparameters: row.hyperparameters,
      trainingDurationSeconds: row.training_duration_seconds,
      datasetInfo: row.dataset_info,
      status: row.status,
      isProduction: row.is_production,
      promotedAt: row.promoted_at,
      promotedBy: row.promoted_by,
      tags: row.tags || [],
      description: row.description
    };
  }

  /**
   * Delete model version
   */
  static async deleteVersion(id: number): Promise<void> {
    // Check if it's production version
    const version = await this.getModelVersion(id);
    if (version?.isProduction) {
      throw new Error('Cannot delete production version');
    }

    await db.query('DELETE FROM ml_model_registry WHERE id = $1', [id]);
  }

  /**
   * Get latest version
   */
  static async getLatestVersion(modelId: number): Promise<ModelVersion | null> {
    const result = await db.query(
      `SELECT * FROM ml_model_registry 
       WHERE model_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [modelId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.parseModelVersion(result.rows[0]);
  }
}

export const modelRegistry = ModelRegistry;
