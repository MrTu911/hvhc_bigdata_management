
-- Migration: MLflow Tracking Integration
-- Created: 2025-10-07
-- Purpose: Enhanced ML experiment tracking with MLflow-compatible schema

-- Enhance ml_experiments table with MLflow fields
ALTER TABLE ml_experiments ADD COLUMN IF NOT EXISTS artifact_location VARCHAR(500);
ALTER TABLE ml_experiments ADD COLUMN IF NOT EXISTS lifecycle_stage VARCHAR(50) DEFAULT 'active';
ALTER TABLE ml_experiments ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '{}';

-- Enhance experiment_metrics for better tracking
ALTER TABLE experiment_metrics ADD COLUMN IF NOT EXISTS step INTEGER DEFAULT 0;
ALTER TABLE experiment_metrics ADD COLUMN IF NOT EXISTS timestamp BIGINT;

-- Create runs table for detailed tracking
CREATE TABLE IF NOT EXISTS ml_runs (
  run_id VARCHAR(255) PRIMARY KEY,
  experiment_id INTEGER REFERENCES ml_experiments(id) ON DELETE CASCADE,
  run_name VARCHAR(255),
  source_type VARCHAR(50), -- 'NOTEBOOK', 'JOB', 'PROJECT', 'LOCAL', 'UNKNOWN'
  source_name VARCHAR(500),
  user_id INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'RUNNING', -- 'RUNNING', 'FINISHED', 'FAILED', 'KILLED'
  start_time BIGINT NOT NULL,
  end_time BIGINT,
  artifact_uri VARCHAR(500),
  lifecycle_stage VARCHAR(50) DEFAULT 'active',
  tags JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_experiment_id (experiment_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_start_time (start_time)
);

-- Create run metrics table for step-by-step tracking
CREATE TABLE IF NOT EXISTS run_metrics (
  id SERIAL PRIMARY KEY,
  run_id VARCHAR(255) NOT NULL REFERENCES ml_runs(run_id) ON DELETE CASCADE,
  metric_key VARCHAR(255) NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  timestamp BIGINT NOT NULL,
  step INTEGER DEFAULT 0,
  
  INDEX idx_run_id (run_id),
  INDEX idx_metric_key (metric_key),
  INDEX idx_timestamp (timestamp)
);

-- Create run parameters table
CREATE TABLE IF NOT EXISTS run_parameters (
  id SERIAL PRIMARY KEY,
  run_id VARCHAR(255) NOT NULL REFERENCES ml_runs(run_id) ON DELETE CASCADE,
  param_key VARCHAR(255) NOT NULL,
  param_value TEXT NOT NULL,
  
  UNIQUE (run_id, param_key),
  INDEX idx_run_id (run_id)
);

-- Create run tags table
CREATE TABLE IF NOT EXISTS run_tags (
  id SERIAL PRIMARY KEY,
  run_id VARCHAR(255) NOT NULL REFERENCES ml_runs(run_id) ON DELETE CASCADE,
  tag_key VARCHAR(255) NOT NULL,
  tag_value TEXT NOT NULL,
  
  UNIQUE (run_id, tag_key),
  INDEX idx_run_id (run_id)
);

-- Comments
COMMENT ON TABLE ml_runs IS 'MLflow-compatible run tracking';
COMMENT ON TABLE run_metrics IS 'Step-by-step metrics during training';
COMMENT ON TABLE run_parameters IS 'Hyperparameters and configuration';
COMMENT ON TABLE run_tags IS 'Custom tags for runs';
