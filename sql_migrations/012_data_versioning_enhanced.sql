
-- Migration: Enhanced Data Versioning with Diff Support
-- Created: 2025-10-07
-- Purpose: Add diff tracking and comparison capabilities

-- Enhance data_versions table
ALTER TABLE data_versions ADD COLUMN IF NOT EXISTS changes_summary JSONB DEFAULT '{}';
ALTER TABLE data_versions ADD COLUMN IF NOT EXISTS diff_from_previous TEXT;
ALTER TABLE data_versions ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64);
ALTER TABLE data_versions ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Create version comparison table
CREATE TABLE IF NOT EXISTS version_comparisons (
  id SERIAL PRIMARY KEY,
  data_id INTEGER NOT NULL,
  version_a INTEGER NOT NULL,
  version_b INTEGER NOT NULL,
  comparison_type VARCHAR(50) DEFAULT 'full', -- 'full', 'summary', 'schema'
  differences JSONB DEFAULT '{}',
  compared_by INTEGER REFERENCES users(id),
  compared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_data_id (data_id),
  INDEX idx_versions (version_a, version_b),
  INDEX idx_compared_at (compared_at)
);

-- Create version rollback history
CREATE TABLE IF NOT EXISTS version_rollbacks (
  id SERIAL PRIMARY KEY,
  data_id INTEGER NOT NULL,
  from_version INTEGER NOT NULL,
  to_version INTEGER NOT NULL,
  reason TEXT,
  rolled_back_by INTEGER REFERENCES users(id),
  rolled_back_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_data_id (data_id),
  INDEX idx_rolled_back_at (rolled_back_at)
);

-- Comments
COMMENT ON COLUMN data_versions.changes_summary IS 'JSON summary of changes (rows added/modified/deleted)';
COMMENT ON COLUMN data_versions.diff_from_previous IS 'Textual diff from previous version';
COMMENT ON COLUMN data_versions.file_hash IS 'SHA-256 hash for integrity verification';
COMMENT ON TABLE version_comparisons IS 'Stores comparison results between versions';
COMMENT ON TABLE version_rollbacks IS 'Audit trail of version rollbacks';
