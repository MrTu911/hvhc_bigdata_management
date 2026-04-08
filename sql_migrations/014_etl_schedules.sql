
-- ETL Schedules Table
-- Stores scheduled workflow configurations

CREATE TABLE IF NOT EXISTS etl_schedules (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL UNIQUE REFERENCES etl_workflows(id) ON DELETE CASCADE,
    schedule_cron VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_etl_schedules_workflow ON etl_schedules(workflow_id);
CREATE INDEX idx_etl_schedules_active ON etl_schedules(is_active);
CREATE INDEX idx_etl_schedules_next_run ON etl_schedules(next_run);

-- ETL Logs Table
-- Detailed logs for ETL executions

CREATE TABLE IF NOT EXISTS etl_logs (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES etl_workflows(id) ON DELETE CASCADE,
    execution_id INTEGER REFERENCES etl_executions(id) ON DELETE CASCADE,
    log_level VARCHAR(20) DEFAULT 'info', -- debug, info, warning, error, critical
    log_message TEXT NOT NULL,
    log_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_etl_logs_workflow ON etl_logs(workflow_id);
CREATE INDEX idx_etl_logs_execution ON etl_logs(execution_id);
CREATE INDEX idx_etl_logs_level ON etl_logs(log_level);
CREATE INDEX idx_etl_logs_created ON etl_logs(created_at DESC);

-- System Metrics Table (for Prometheus-like monitoring)
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_labels JSONB DEFAULT '{}',
    metric_timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX idx_system_metrics_timestamp ON system_metrics(metric_timestamp DESC);
CREATE INDEX idx_system_metrics_labels ON system_metrics USING gin(metric_labels);

-- Alert Rules Table
CREATE TABLE IF NOT EXISTS alert_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(200) NOT NULL,
    rule_description TEXT,
    metric_name VARCHAR(100) NOT NULL,
    condition VARCHAR(50) NOT NULL, -- gt, lt, eq, gte, lte
    threshold_value NUMERIC NOT NULL,
    severity VARCHAR(20) DEFAULT 'warning', -- info, warning, critical
    is_active BOOLEAN DEFAULT true,
    notification_channels JSONB DEFAULT '["email"]', -- email, telegram, slack
    cooldown_minutes INTEGER DEFAULT 60,
    last_triggered TIMESTAMP,
    trigger_count INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alert_rules_metric ON alert_rules(metric_name);
CREATE INDEX idx_alert_rules_active ON alert_rules(is_active);

COMMENT ON TABLE etl_schedules IS 'Scheduled ETL workflow configurations';
COMMENT ON TABLE etl_logs IS 'Detailed ETL execution logs';
COMMENT ON TABLE system_metrics IS 'System performance and health metrics';
COMMENT ON TABLE alert_rules IS 'Automated alert rule configurations';
