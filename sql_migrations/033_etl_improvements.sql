
-- ETL Engine Improvements Migration
-- Adds logging, retry mechanism, and enhanced tracking

-- ============================
-- 1. ETL Logs Table
-- ============================
CREATE TABLE IF NOT EXISTS etl_logs (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER REFERENCES etl_workflows(id) ON DELETE CASCADE,
  execution_id INTEGER REFERENCES etl_executions(id) ON DELETE CASCADE,
  log_level VARCHAR(20) NOT NULL DEFAULT 'INFO', -- DEBUG, INFO, WARNING, ERROR, CRITICAL
  log_message TEXT NOT NULL,
  log_details JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  source VARCHAR(100), -- e.g., 'workflow-engine', 'scheduler', 'api'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_etl_logs_workflow ON etl_logs(workflow_id);
CREATE INDEX idx_etl_logs_execution ON etl_logs(execution_id);
CREATE INDEX idx_etl_logs_level ON etl_logs(log_level);
CREATE INDEX idx_etl_logs_timestamp ON etl_logs(timestamp);

-- ============================
-- 2. ETL Retry Configuration
-- ============================
CREATE TABLE IF NOT EXISTS etl_retry_config (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER UNIQUE REFERENCES etl_workflows(id) ON DELETE CASCADE,
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 300, -- 5 minutes
  exponential_backoff BOOLEAN DEFAULT true,
  retry_on_error_types VARCHAR[] DEFAULT ARRAY['TIMEOUT', 'CONNECTION', 'TEMPORARY'],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================
-- 3. ETL Retry History
-- ============================
CREATE TABLE IF NOT EXISTS etl_retry_history (
  id SERIAL PRIMARY KEY,
  execution_id INTEGER REFERENCES etl_executions(id) ON DELETE CASCADE,
  retry_attempt INTEGER NOT NULL,
  retry_reason TEXT,
  retry_started_at TIMESTAMP DEFAULT NOW(),
  retry_completed_at TIMESTAMP,
  retry_status VARCHAR(20), -- 'success', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_retry_history_execution ON etl_retry_history(execution_id);

-- ============================
-- 4. Add retry fields to etl_executions
-- ============================
ALTER TABLE etl_executions 
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_retry BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_execution_id INTEGER,
  ADD COLUMN IF NOT EXISTS error_type VARCHAR(50);

-- ============================
-- 5. ETL Performance Metrics (Real-time)
-- ============================
CREATE TABLE IF NOT EXISTS etl_performance_metrics (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER REFERENCES etl_workflows(id) ON DELETE CASCADE,
  execution_id INTEGER REFERENCES etl_executions(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC(20, 4),
  metric_unit VARCHAR(50),
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_etl_performance_workflow ON etl_performance_metrics(workflow_id);
CREATE INDEX idx_etl_performance_execution ON etl_performance_metrics(execution_id);
CREATE INDEX idx_etl_performance_timestamp ON etl_performance_metrics(timestamp);

-- ============================
-- 6. Functions for ETL Logging
-- ============================
CREATE OR REPLACE FUNCTION log_etl_event(
  p_workflow_id INTEGER,
  p_execution_id INTEGER,
  p_level VARCHAR,
  p_message TEXT,
  p_details JSONB DEFAULT NULL,
  p_source VARCHAR DEFAULT 'system'
)
RETURNS INTEGER AS $$
DECLARE
  v_log_id INTEGER;
BEGIN
  INSERT INTO etl_logs (workflow_id, execution_id, log_level, log_message, log_details, source)
  VALUES (p_workflow_id, p_execution_id, p_level, p_message, p_details, p_source)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- 7. Trigger for auto-updating timestamps
-- ============================
CREATE OR REPLACE FUNCTION update_etl_retry_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_etl_retry_config_update
BEFORE UPDATE ON etl_retry_config
FOR EACH ROW
EXECUTE FUNCTION update_etl_retry_config_timestamp();

-- ============================
-- 8. Insert default retry configs for existing workflows
-- ============================
INSERT INTO etl_retry_config (workflow_id, max_retries, retry_delay_seconds, is_active)
SELECT id, 3, 300, true 
FROM etl_workflows 
WHERE id NOT IN (SELECT workflow_id FROM etl_retry_config)
ON CONFLICT (workflow_id) DO NOTHING;

COMMENT ON TABLE etl_logs IS 'Comprehensive logging for all ETL operations';
COMMENT ON TABLE etl_retry_config IS 'Retry configuration for ETL workflows';
COMMENT ON TABLE etl_retry_history IS 'History of all retry attempts';
COMMENT ON TABLE etl_performance_metrics IS 'Real-time performance metrics for ETL workflows';
