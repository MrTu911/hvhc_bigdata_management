
-- ETL Automation Tables
-- Created: 2025-10-10
-- Purpose: Automated ETL workflows and scheduling

-- ETL Workflows table
CREATE TABLE IF NOT EXISTS etl_workflows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_type VARCHAR(50) NOT NULL, -- 'upload', 'clean', 'process', 'train', 'hybrid'
    source_config JSONB NOT NULL,
    destination_config JSONB NOT NULL,
    transformation_rules JSONB,
    schedule_cron VARCHAR(100), -- Cron expression for scheduling
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 5, -- 1 (lowest) to 10 (highest)
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ETL Executions table
CREATE TABLE IF NOT EXISTS etl_executions (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES etl_workflows(id) ON DELETE CASCADE,
    execution_status VARCHAR(50) NOT NULL, -- 'pending', 'running', 'completed', 'failed', 'cancelled'
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    records_processed INTEGER DEFAULT 0,
    records_success INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    execution_log JSONB,
    triggered_by VARCHAR(50) DEFAULT 'manual', -- 'manual', 'scheduled', 'api', 'event'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ETL Monitoring Metrics
CREATE TABLE IF NOT EXISTS etl_metrics (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES etl_workflows(id) ON DELETE CASCADE,
    execution_id INTEGER REFERENCES etl_executions(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC,
    metric_unit VARCHAR(50),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ETL Dependencies (for workflow chaining)
CREATE TABLE IF NOT EXISTS etl_dependencies (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES etl_workflows(id) ON DELETE CASCADE,
    depends_on_workflow_id INTEGER REFERENCES etl_workflows(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'sequential', -- 'sequential', 'parallel', 'conditional'
    condition_rule JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_etl_workflows_active ON etl_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_etl_executions_status ON etl_executions(execution_status);
CREATE INDEX IF NOT EXISTS idx_etl_executions_workflow ON etl_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_etl_metrics_workflow ON etl_metrics(workflow_id);
CREATE INDEX IF NOT EXISTS idx_etl_metrics_execution ON etl_metrics(execution_id);

-- Insert sample ETL workflows
INSERT INTO etl_workflows (name, description, workflow_type, source_config, destination_config, transformation_rules, schedule_cron, priority)
VALUES 
    ('Daily Data Upload', 'Tự động tải dữ liệu huấn luyện hàng ngày', 'upload', 
     '{"source": "sftp://data-server/training", "format": "csv"}',
     '{"destination": "s3://hvhc-data/raw", "format": "parquet"}',
     '{"clean_nulls": true, "normalize": true}',
     '0 2 * * *', 8),
    
    ('Data Cleaning Pipeline', 'Làm sạch và chuẩn hóa dữ liệu', 'clean',
     '{"source": "s3://hvhc-data/raw"}',
     '{"destination": "s3://hvhc-data/cleaned"}',
     '{"remove_duplicates": true, "validate_schema": true, "fill_missing": "mean"}',
     '0 3 * * *', 7),
    
    ('ML Training Automation', 'Tự động huấn luyện mô hình AI', 'train',
     '{"source": "s3://hvhc-data/cleaned", "model_type": "classification"}',
     '{"destination": "s3://hvhc-models", "registry": "mlflow"}',
     '{"algorithm": "random_forest", "cv_folds": 5, "optimize": true}',
     '0 4 * * *', 9);

-- Insert sample execution
INSERT INTO etl_executions (workflow_id, execution_status, started_at, records_processed, triggered_by)
VALUES (1, 'completed', NOW() - INTERVAL '1 hour', 15000, 'scheduled');

COMMENT ON TABLE etl_workflows IS 'ETL workflow definitions and configurations';
COMMENT ON TABLE etl_executions IS 'ETL execution history and status tracking';
COMMENT ON TABLE etl_metrics IS 'Performance metrics for ETL executions';
COMMENT ON TABLE etl_dependencies IS 'Workflow dependencies for orchestration';
