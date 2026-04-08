
-- Data Processing Pipeline Tables
-- Migration: 006_data_processing_pipeline.sql
-- Purpose: Track data processing status, versions, and quality metrics

-- Data Processing Logs
CREATE TABLE IF NOT EXISTS data_processing_logs (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER NOT NULL REFERENCES research_files(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    process_type VARCHAR(50) NOT NULL, -- PREVIEW, STATS, CLEAN, NORMALIZE, VALIDATE
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    processing_details JSONB, -- Store stats, errors, warnings
    processed_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Versions (for version control)
CREATE TABLE IF NOT EXISTS data_versions (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER NOT NULL REFERENCES research_files(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    file_path VARCHAR(500) NOT NULL, -- MinIO path
    file_size BIGINT,
    description TEXT,
    changes_summary JSONB, -- What changed from previous version
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(dataset_id, version_number)
);

-- Data Quality Metrics
CREATE TABLE IF NOT EXISTS data_quality_metrics (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER NOT NULL REFERENCES research_files(id) ON DELETE CASCADE,
    version_id INTEGER REFERENCES data_versions(id) ON DELETE CASCADE,
    total_rows INTEGER,
    total_columns INTEGER,
    null_percentage DECIMAL(5,2),
    duplicate_rows INTEGER,
    quality_score DECIMAL(5,2), -- 0-100
    column_stats JSONB, -- Detailed stats per column
    validation_errors JSONB, -- List of validation issues
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Schema Info
CREATE TABLE IF NOT EXISTS data_schemas (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER NOT NULL REFERENCES research_files(id) ON DELETE CASCADE,
    column_name VARCHAR(255) NOT NULL,
    column_index INTEGER,
    data_type VARCHAR(50), -- STRING, NUMBER, DATE, BOOLEAN, MIXED
    null_count INTEGER DEFAULT 0,
    unique_count INTEGER DEFAULT 0,
    min_value TEXT,
    max_value TEXT,
    sample_values JSONB, -- Array of sample values
    detected_format VARCHAR(100), -- e.g., 'DD/MM/YYYY' for dates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_processing_logs_dataset ON data_processing_logs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_status ON data_processing_logs(status);
CREATE INDEX IF NOT EXISTS idx_data_versions_dataset ON data_versions(dataset_id);
CREATE INDEX IF NOT EXISTS idx_data_versions_active ON data_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_dataset ON data_quality_metrics(dataset_id);
CREATE INDEX IF NOT EXISTS idx_schemas_dataset ON data_schemas(dataset_id);

-- Add processing metadata to research_files if not exists
ALTER TABLE research_files 
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'UNPROCESSED',
ADD COLUMN IF NOT EXISTS last_processed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS row_count INTEGER,
ADD COLUMN IF NOT EXISTS column_count INTEGER;

COMMENT ON TABLE data_processing_logs IS 'Tracks all data processing operations';
COMMENT ON TABLE data_versions IS 'Version control for datasets';
COMMENT ON TABLE data_quality_metrics IS 'Data quality metrics and statistics';
COMMENT ON TABLE data_schemas IS 'Detected schema information for datasets';
