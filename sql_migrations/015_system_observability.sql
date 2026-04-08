
-- System Observability Tables
-- Created: 2025-10-10
-- Purpose: System health monitoring, metrics collection, and observability

-- System Health Checks
CREATE TABLE IF NOT EXISTS system_health_checks (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    check_type VARCHAR(50) NOT NULL, -- 'api', 'database', 'cache', 'storage', 'ml_engine'
    status VARCHAR(20) NOT NULL, -- 'healthy', 'degraded', 'unhealthy', 'unknown'
    response_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Metrics (Time-series data)
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    metric_category VARCHAR(50) NOT NULL, -- 'cpu', 'memory', 'disk', 'network', 'database', 'api'
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit VARCHAR(20),
    instance_id VARCHAR(100),
    labels JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Performance Metrics
CREATE TABLE IF NOT EXISTS api_performance (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    user_id INTEGER REFERENCES users(id),
    client_ip VARCHAR(45),
    user_agent TEXT,
    error_message TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Database Performance Metrics
CREATE TABLE IF NOT EXISTS database_metrics (
    id SERIAL PRIMARY KEY,
    query_type VARCHAR(50), -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRANSACTION'
    execution_time_ms NUMERIC,
    rows_affected INTEGER,
    table_name VARCHAR(100),
    is_slow_query BOOLEAN DEFAULT false,
    query_hash VARCHAR(64),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resource Utilization Tracking
CREATE TABLE IF NOT EXISTS resource_utilization (
    id SERIAL PRIMARY KEY,
    resource_type VARCHAR(50) NOT NULL, -- 'cpu', 'memory', 'disk', 'gpu'
    total_capacity NUMERIC,
    used_capacity NUMERIC,
    available_capacity NUMERIC,
    utilization_percent NUMERIC,
    instance_id VARCHAR(100),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Dependencies Health
CREATE TABLE IF NOT EXISTS service_dependencies (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    dependency_name VARCHAR(100) NOT NULL,
    dependency_type VARCHAR(50), -- 'database', 'cache', 'external_api', 'message_queue'
    is_critical BOOLEAN DEFAULT false,
    health_status VARCHAR(20),
    last_check_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts and Incidents
CREATE TABLE IF NOT EXISTS system_incidents (
    id SERIAL PRIMARY KEY,
    incident_type VARCHAR(50) NOT NULL, -- 'performance', 'availability', 'security', 'data_quality'
    severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low', 'info'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    affected_services JSONB,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_health_checks_service ON system_health_checks(service_name, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_category ON system_metrics(metric_category, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_performance_endpoint ON api_performance(endpoint, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_performance_time ON api_performance(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_database_metrics_slow ON database_metrics(is_slow_query, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_resource_utilization_type ON resource_utilization(resource_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON system_incidents(status, severity);

-- Insert sample health checks
INSERT INTO system_health_checks (service_name, check_type, status, response_time_ms)
VALUES 
    ('HVHC API Server', 'api', 'healthy', 45),
    ('PostgreSQL Database', 'database', 'healthy', 12),
    ('Redis Cache', 'cache', 'healthy', 3),
    ('MinIO Storage', 'storage', 'healthy', 28),
    ('ML Training Engine', 'ml_engine', 'healthy', 156);

-- Insert sample metrics
INSERT INTO system_metrics (metric_category, metric_name, metric_value, metric_unit)
VALUES 
    ('cpu', 'usage_percent', 45.3, 'percent'),
    ('memory', 'usage_percent', 62.8, 'percent'),
    ('disk', 'usage_percent', 38.5, 'percent'),
    ('database', 'active_connections', 25, 'count'),
    ('api', 'requests_per_minute', 342, 'rpm');

-- Create function for automatic metric aggregation
CREATE OR REPLACE FUNCTION calculate_avg_response_time(
    p_endpoint VARCHAR,
    p_time_window INTERVAL DEFAULT '1 hour'
)
RETURNS NUMERIC AS $$
BEGIN
    RETURN (
        SELECT AVG(response_time_ms)
        FROM api_performance
        WHERE endpoint = p_endpoint
        AND recorded_at >= NOW() - p_time_window
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE system_health_checks IS 'System health check results for all services';
COMMENT ON TABLE system_metrics IS 'Time-series metrics for system monitoring';
COMMENT ON TABLE api_performance IS 'API endpoint performance tracking';
COMMENT ON TABLE database_metrics IS 'Database query performance metrics';
COMMENT ON TABLE resource_utilization IS 'System resource usage tracking';
