
-- Phase 3: Seed Data for Monitoring & Services
-- This script populates initial data for BigData services monitoring

-- Insert BigData Services
INSERT INTO bigdata_services (id, name, type, status, host, port, url, version, description, is_active, created_at, updated_at) VALUES
('service_postgresql', 'PostgreSQL Database', 'POSTGRESQL', 'HEALTHY', 'localhost', 5432, 'postgresql://localhost:5432', '14.0', 'Primary relational database for structured data storage', true, NOW(), NOW()),
('service_minio', 'MinIO Object Storage', 'MINIO', 'HEALTHY', 'localhost', 9000, 'http://localhost:9000', '2024.1.1', 'S3-compatible object storage for files and datasets', true, NOW(), NOW()),
('service_airflow', 'Apache Airflow', 'AIRFLOW', 'HEALTHY', 'localhost', 8080, 'http://localhost:8080', '2.7.0', 'Workflow orchestration and data pipeline management', true, NOW(), NOW()),
('service_clickhouse', 'ClickHouse Analytics', 'CLICKHOUSE', 'HEALTHY', 'localhost', 8123, 'http://localhost:8123', '23.8', 'OLAP database for real-time analytics', true, NOW(), NOW()),
('service_prometheus', 'Prometheus Monitoring', 'PROMETHEUS', 'HEALTHY', 'localhost', 9090, 'http://localhost:9090', '2.45.0', 'Metrics collection and alerting system', true, NOW(), NOW()),
('service_grafana', 'Grafana Dashboard', 'GRAFANA', 'HEALTHY', 'localhost', 3001, 'http://localhost:3001', '10.0.0', 'Visualization and monitoring dashboard', true, NOW(), NOW()),
('service_superset', 'Apache Superset', 'SUPERSET', 'HEALTHY', 'localhost', 8088, 'http://localhost:8088', '3.0.0', 'Business intelligence and data exploration', true, NOW(), NOW()),
('service_kafka', 'Apache Kafka', 'KAFKA', 'HEALTHY', 'localhost', 9092, NULL, '3.5.0', 'Distributed event streaming platform', true, NOW(), NOW()),
('service_zookeeper', 'Apache ZooKeeper', 'ZOOKEEPER', 'HEALTHY', 'localhost', 2181, NULL, '3.8.0', 'Coordination service for distributed systems', true, NOW(), NOW()),
('service_hadoop', 'Hadoop HDFS', 'HADOOP', 'HEALTHY', 'localhost', 9870, 'http://localhost:9870', '3.3.0', 'Distributed file system for big data storage', true, NOW(), NOW()),
('service_spark', 'Apache Spark', 'SPARK', 'HEALTHY', 'localhost', 8081, 'http://localhost:8081', '3.5.0', 'Distributed data processing engine', true, NOW(), NOW());

-- Insert Sample Service Metrics (last 24 hours)
INSERT INTO service_metrics (service_id, metric_name, metric_value, unit, cpu_usage, memory_usage, disk_usage, timestamp) VALUES
-- PostgreSQL
('service_postgresql', 'response_time', 15.3, 'ms', 25.4, 45.2, 68.3, NOW() - INTERVAL '1 hour'),
('service_postgresql', 'active_connections', 42, 'connections', 25.4, 45.2, 68.3, NOW() - INTERVAL '1 hour'),
('service_postgresql', 'transactions_per_sec', 156, 'tps', 28.1, 46.5, 68.3, NOW() - INTERVAL '30 minutes'),
-- MinIO
('service_minio', 'storage_used', 234.5, 'GB', 15.2, 35.8, 45.2, NOW() - INTERVAL '1 hour'),
('service_minio', 'requests_per_sec', 89, 'rps', 15.2, 35.8, 45.2, NOW() - INTERVAL '1 hour'),
-- Airflow
('service_airflow', 'running_tasks', 8, 'tasks', 32.5, 52.3, 25.4, NOW() - INTERVAL '1 hour'),
('service_airflow', 'queued_tasks', 3, 'tasks', 32.5, 52.3, 25.4, NOW() - INTERVAL '1 hour'),
-- ClickHouse
('service_clickhouse', 'queries_per_sec', 245, 'qps', 45.2, 65.8, 78.2, NOW() - INTERVAL '1 hour'),
('service_clickhouse', 'query_duration', 23.4, 'ms', 45.2, 65.8, 78.2, NOW() - INTERVAL '1 hour'),
-- Prometheus
('service_prometheus', 'samples_ingested', 15234, 'samples/s', 12.5, 28.4, 15.2, NOW() - INTERVAL '1 hour'),
-- Grafana
('service_grafana', 'active_users', 12, 'users', 8.3, 18.5, 12.1, NOW() - INTERVAL '1 hour'),
-- Kafka
('service_kafka', 'messages_per_sec', 3456, 'msg/s', 38.5, 58.2, 35.4, NOW() - INTERVAL '1 hour'),
('service_kafka', 'consumer_lag', 234, 'messages', 38.5, 58.2, 35.4, NOW() - INTERVAL '1 hour'),
-- Spark
('service_spark', 'active_jobs', 5, 'jobs', 55.4, 72.3, 42.1, NOW() - INTERVAL '1 hour');

-- Insert Sample Alerts
INSERT INTO service_alerts (service_id, title, message, severity, status, triggered_at) VALUES
('service_clickhouse', 'High CPU Usage', 'ClickHouse CPU usage exceeded 80% threshold', 'WARNING', 'ACTIVE', NOW() - INTERVAL '2 hours'),
('service_kafka', 'Consumer Lag Increasing', 'Kafka consumer lag is increasing, current lag: 234 messages', 'WARNING', 'ACTIVE', NOW() - INTERVAL '1 hour'),
('service_minio', 'Storage Usage High', 'MinIO storage usage is at 85% capacity', 'INFO', 'ACTIVE', NOW() - INTERVAL '30 minutes');

-- Insert Sample Airflow DAGs
INSERT INTO airflow_dags (dag_id, dag_name, description, status, is_paused, last_run_time, success_count, failed_count) VALUES
('data_ingestion_pipeline', 'Data Ingestion Pipeline', 'Daily data ingestion from multiple sources', 'SUCCESS', false, NOW() - INTERVAL '6 hours', 45, 2),
('ml_training_workflow', 'ML Model Training Workflow', 'Automated ML model training and evaluation', 'SUCCESS', false, NOW() - INTERVAL '12 hours', 23, 1),
('data_quality_check', 'Data Quality Validation', 'Automated data quality checks and validation', 'SUCCESS', false, NOW() - INTERVAL '2 hours', 67, 0),
('report_generation', 'Daily Report Generation', 'Generate and distribute daily analytics reports', 'SUCCESS', false, NOW() - INTERVAL '8 hours', 89, 3);

-- Insert Sample DAG Runs
INSERT INTO dag_runs (dag_id, run_id, status, start_date, end_date, duration) VALUES
((SELECT id FROM airflow_dags WHERE dag_id = 'data_ingestion_pipeline'), 'manual_2025-10-06_12:00:00', 'SUCCESS', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 45 minutes', 900),
((SELECT id FROM airflow_dags WHERE dag_id = 'ml_training_workflow'), 'scheduled_2025-10-06_00:00:00', 'SUCCESS', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '10 hours', 7200),
((SELECT id FROM airflow_dags WHERE dag_id = 'data_quality_check'), 'scheduled_2025-10-06_16:00:00', 'SUCCESS', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 55 minutes', 300);

-- Insert System Configuration
INSERT INTO system_configs (key, value, category, description, is_editable) VALUES
('max_file_upload_size', '524288000', 'storage', 'Maximum file upload size in bytes (500MB)', true),
('session_timeout', '3600', 'security', 'User session timeout in seconds', true),
('enable_monitoring', 'true', 'monitoring', 'Enable system monitoring and metrics collection', true),
('alert_email', 'admin@hvhc.edu.vn', 'monitoring', 'Email address for system alerts', true),
('data_retention_days', '90', 'storage', 'Number of days to retain data before archival', true),
('max_concurrent_jobs', '10', 'processing', 'Maximum number of concurrent processing jobs', true),
('prometheus_scrape_interval', '30', 'monitoring', 'Prometheus metrics scrape interval in seconds', true),
('enable_audit_logging', 'true', 'security', 'Enable comprehensive audit logging', true);

-- Insert Sample Analytics Summary (for quick dashboard loading)
INSERT INTO analytics_summaries (summary_type, summary_date, total_users, active_users, new_users, total_services, healthy_services, down_services, total_files, total_queries, total_storage, data_uploaded, queries_executed, avg_query_time, avg_cpu_usage, avg_memory_usage, avg_disk_usage) VALUES
('daily', CURRENT_DATE, 45, 32, 3, 11, 10, 0, 234, 1567, 456.7, 12.3, 1567, 45.6, 35.2, 48.5, 52.3),
('daily', CURRENT_DATE - INTERVAL '1 day', 42, 28, 2, 11, 11, 0, 228, 1423, 444.4, 10.8, 1423, 42.3, 32.8, 46.2, 50.1),
('weekly', DATE_TRUNC('week', CURRENT_DATE), 48, 35, 8, 11, 10, 0, 234, 10234, 456.7, 78.5, 10234, 43.2, 34.5, 47.8, 51.5),
('monthly', DATE_TRUNC('month', CURRENT_DATE), 52, 38, 12, 11, 10, 0, 234, 42567, 456.7, 234.5, 42567, 44.8, 33.2, 46.5, 50.8);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_service_metrics_service_timestamp ON service_metrics(service_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_service_alerts_active ON service_alerts(service_id, status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_dag_runs_dag_status ON dag_runs(dag_id, status);
CREATE INDEX IF NOT EXISTS idx_analytics_summaries_lookup ON analytics_summaries(summary_type, summary_date DESC);

-- Update service uptimes (simulated)
UPDATE bigdata_services SET uptime = 99.9 WHERE type IN ('POSTGRESQL', 'MINIO');
UPDATE bigdata_services SET uptime = 99.5 WHERE type IN ('AIRFLOW', 'CLICKHOUSE');
UPDATE bigdata_services SET uptime = 98.8 WHERE type IN ('PROMETHEUS', 'GRAFANA');
UPDATE bigdata_services SET uptime = 99.2 WHERE type IN ('KAFKA', 'HADOOP', 'SPARK');

-- Set last checked times
UPDATE bigdata_services SET last_checked = NOW() - INTERVAL '5 minutes';

COMMIT;
