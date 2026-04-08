
-- Migration: ML Training Logs Table
-- Created: 2025-10-05
-- Purpose: Store ML training history and model metadata

-- Create ml_training_logs table
CREATE TABLE IF NOT EXISTS ml_training_logs (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL,
    algorithm VARCHAR(100) NOT NULL,
    dataset_name VARCHAR(255),
    accuracy FLOAT,
    parameters JSONB,
    model_path TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ml_training_created_at ON ml_training_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ml_training_model_name ON ml_training_logs(model_name);
CREATE INDEX IF NOT EXISTS idx_ml_training_algorithm ON ml_training_logs(algorithm);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_ml_training_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ml_training_updated_at
    BEFORE UPDATE ON ml_training_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_training_updated_at();

-- Add comment
COMMENT ON TABLE ml_training_logs IS 'Stores ML training history and model metadata for HVHC BigData Platform';

-- Insert sample data (optional, for testing)
-- INSERT INTO ml_training_logs (model_name, algorithm, dataset_name, accuracy, parameters, model_path)
-- VALUES 
--     ('test_classifier', 'random_forest', 'test_dataset', 0.95, '{"n_estimators": 100, "max_depth": 10}', 'models/test_classifier.pkl');
