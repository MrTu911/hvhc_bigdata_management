
-- ML Engine Enhancements Migration
-- Adds visualization data, model registry, auto-training triggers

-- ============================
-- 1. ML Training Metrics (for visualization)
-- ============================
CREATE TABLE IF NOT EXISTS ml_training_metrics (
  id SERIAL PRIMARY KEY,
  job_id INTEGER, -- References TrainingJob in Prisma
  run_id VARCHAR(100),
  epoch INTEGER,
  step INTEGER,
  metric_name VARCHAR(100) NOT NULL, -- 'loss', 'accuracy', 'val_loss', 'val_accuracy', etc.
  metric_value NUMERIC(20, 8),
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ml_metrics_job ON ml_training_metrics(job_id);
CREATE INDEX idx_ml_metrics_run ON ml_training_metrics(run_id);
CREATE INDEX idx_ml_metrics_epoch ON ml_training_metrics(epoch);
CREATE INDEX idx_ml_metrics_name ON ml_training_metrics(metric_name);

-- ============================
-- 2. ML Model Registry
-- ============================
CREATE TABLE IF NOT EXISTS ml_model_registry (
  id SERIAL PRIMARY KEY,
  model_id INTEGER, -- References MLModel in Prisma
  version VARCHAR(50) NOT NULL,
  model_path VARCHAR(500),
  model_size_mb NUMERIC(10, 2),
  framework VARCHAR(100),
  framework_version VARCHAR(50),
  metrics JSONB, -- Final metrics: {accuracy: 0.95, loss: 0.05, f1_score: 0.93}
  hyperparameters JSONB,
  training_duration_seconds INTEGER,
  dataset_info JSONB, -- {train_size: 10000, val_size: 2000, test_size: 1000}
  status VARCHAR(50) DEFAULT 'REGISTERED', -- REGISTERED, STAGED, PRODUCTION, ARCHIVED, DEPRECATED
  is_production BOOLEAN DEFAULT false,
  promoted_at TIMESTAMP,
  promoted_by VARCHAR(100),
  tags VARCHAR[],
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(model_id, version)
);

CREATE INDEX idx_model_registry_model ON ml_model_registry(model_id);
CREATE INDEX idx_model_registry_status ON ml_model_registry(status);
CREATE INDEX idx_model_registry_production ON ml_model_registry(is_production);

-- ============================
-- 3. ML Training Logs (detailed logs)
-- ============================
CREATE TABLE IF NOT EXISTS ml_training_logs (
  id SERIAL PRIMARY KEY,
  job_id INTEGER,
  run_id VARCHAR(100),
  log_level VARCHAR(20) NOT NULL DEFAULT 'INFO',
  log_message TEXT NOT NULL,
  log_details JSONB,
  epoch INTEGER,
  step INTEGER,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ml_training_logs_job ON ml_training_logs(job_id);
CREATE INDEX idx_ml_training_logs_run ON ml_training_logs(run_id);
CREATE INDEX idx_ml_training_logs_level ON ml_training_logs(log_level);

-- ============================
-- 4. Auto-Training Triggers
-- ============================
CREATE TABLE IF NOT EXISTS ml_auto_training_triggers (
  id SERIAL PRIMARY KEY,
  trigger_name VARCHAR(200) NOT NULL,
  model_id INTEGER,
  trigger_type VARCHAR(50) NOT NULL, -- 'DATA_UPLOAD', 'SCHEDULED', 'METRIC_THRESHOLD', 'MANUAL'
  trigger_condition JSONB, -- {dataset_size: '>1000', new_data_percentage: '>20%'}
  schedule_cron VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP,
  trigger_count INTEGER DEFAULT 0,
  config JSONB, -- Training config to use
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_auto_training_model ON ml_auto_training_triggers(model_id);
CREATE INDEX idx_auto_training_active ON ml_auto_training_triggers(is_active);
CREATE INDEX idx_auto_training_type ON ml_auto_training_triggers(trigger_type);

-- ============================
-- 5. ML Training Events (for tracking)
-- ============================
CREATE TABLE IF NOT EXISTS ml_training_events (
  id SERIAL PRIMARY KEY,
  job_id INTEGER,
  event_type VARCHAR(100) NOT NULL, -- 'STARTED', 'EPOCH_COMPLETED', 'VALIDATION', 'CHECKPOINT', 'COMPLETED', 'FAILED'
  event_data JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_training_events_job ON ml_training_events(job_id);
CREATE INDEX idx_training_events_type ON ml_training_events(event_type);
CREATE INDEX idx_training_events_timestamp ON ml_training_events(timestamp);

-- ============================
-- 6. ML Model Comparison Cache
-- ============================
CREATE TABLE IF NOT EXISTS ml_model_comparison_cache (
  id SERIAL PRIMARY KEY,
  comparison_id VARCHAR(100) UNIQUE NOT NULL,
  model_ids INTEGER[],
  comparison_metrics JSONB,
  charts_data JSONB, -- Cached chart data for faster rendering
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX idx_comparison_cache_id ON ml_model_comparison_cache(comparison_id);
CREATE INDEX idx_comparison_cache_expires ON ml_model_comparison_cache(expires_at);

-- ============================
-- 7. Functions for ML Logging
-- ============================
CREATE OR REPLACE FUNCTION log_ml_training_event(
  p_job_id INTEGER,
  p_run_id VARCHAR,
  p_level VARCHAR,
  p_message TEXT,
  p_details JSONB DEFAULT NULL,
  p_epoch INTEGER DEFAULT NULL,
  p_step INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_log_id INTEGER;
BEGIN
  INSERT INTO ml_training_logs (job_id, run_id, log_level, log_message, log_details, epoch, step)
  VALUES (p_job_id, p_run_id, p_level, p_message, p_details, p_epoch, p_step)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- 8. Function to record training metrics
-- ============================
CREATE OR REPLACE FUNCTION record_training_metric(
  p_job_id INTEGER,
  p_run_id VARCHAR,
  p_epoch INTEGER,
  p_step INTEGER,
  p_metric_name VARCHAR,
  p_metric_value NUMERIC
)
RETURNS INTEGER AS $$
DECLARE
  v_metric_id INTEGER;
BEGIN
  INSERT INTO ml_training_metrics (job_id, run_id, epoch, step, metric_name, metric_value)
  VALUES (p_job_id, p_run_id, p_epoch, p_step, p_metric_name, p_metric_value)
  RETURNING id INTO v_metric_id;
  
  RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- 9. Trigger for auto-updating model registry
-- ============================
CREATE OR REPLACE FUNCTION update_ml_registry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ml_registry_update
BEFORE UPDATE ON ml_model_registry
FOR EACH ROW
EXECUTE FUNCTION update_ml_registry_timestamp();

CREATE TRIGGER trg_ml_auto_training_update
BEFORE UPDATE ON ml_auto_training_triggers
FOR EACH ROW
EXECUTE FUNCTION update_ml_registry_timestamp();

-- ============================
-- 10. Cleanup function for old comparison cache
-- ============================
CREATE OR REPLACE FUNCTION cleanup_expired_comparison_cache()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM ml_model_comparison_cache 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE ml_training_metrics IS 'Real-time metrics for ML training visualization';
COMMENT ON TABLE ml_model_registry IS 'Central registry for ML model versions and deployment';
COMMENT ON TABLE ml_training_logs IS 'Detailed logs for ML training operations';
COMMENT ON TABLE ml_auto_training_triggers IS 'Automated triggers for model retraining';
COMMENT ON TABLE ml_training_events IS 'Event tracking for ML training lifecycle';
