
-- SQL Migration for Advanced ML Features
-- Q2 Features: Experiments, Model Versioning, Workflows

-- Table: ml_experiments
CREATE TABLE IF NOT EXISTS ml_experiments (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    model_id VARCHAR(255),
    parameters JSONB DEFAULT '{}',
    tags JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'pending',
    results JSONB DEFAULT '{}',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: experiment_metrics
CREATE TABLE IF NOT EXISTS experiment_metrics (
    id VARCHAR(255) PRIMARY KEY,
    experiment_id VARCHAR(255) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    metric_value FLOAT NOT NULL,
    step INTEGER DEFAULT 0,
    epoch INTEGER DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: experiment_artifacts
CREATE TABLE IF NOT EXISTS experiment_artifacts (
    id VARCHAR(255) PRIMARY KEY,
    experiment_id VARCHAR(255) NOT NULL,
    artifact_name VARCHAR(255) NOT NULL,
    artifact_type VARCHAR(50),
    artifact_path TEXT,
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: model_versions
CREATE TABLE IF NOT EXISTS model_versions (
    id VARCHAR(255) PRIMARY KEY,
    model_id VARCHAR(255) NOT NULL,
    version_number INTEGER NOT NULL,
    description TEXT,
    experiment_id VARCHAR(255),
    metrics JSONB DEFAULT '{}',
    artifact_path TEXT,
    tags JSONB DEFAULT '[]',
    stage VARCHAR(50) DEFAULT 'development',
    status VARCHAR(50) DEFAULT 'draft',
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (model_id, version_number)
);

-- Table: ml_workflows
CREATE TABLE IF NOT EXISTS ml_workflows (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    model_id VARCHAR(255),
    steps JSONB DEFAULT '[]',
    schedule JSONB DEFAULT '{}',
    parameters JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft',
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: workflow_executions
CREATE TABLE IF NOT EXISTS workflow_executions (
    id VARCHAR(255) PRIMARY KEY,
    workflow_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    parameters JSONB DEFAULT '{}',
    current_step INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0,
    results JSONB DEFAULT '{}',
    error TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    started_by VARCHAR(255)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_experiments_model ON ml_experiments(model_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON ml_experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_created ON ml_experiments(created_at);

CREATE INDEX IF NOT EXISTS idx_metrics_experiment ON experiment_metrics(experiment_id);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON experiment_metrics(metric_name);

CREATE INDEX IF NOT EXISTS idx_artifacts_experiment ON experiment_artifacts(experiment_id);

CREATE INDEX IF NOT EXISTS idx_versions_model ON model_versions(model_id);
CREATE INDEX IF NOT EXISTS idx_versions_stage ON model_versions(stage);
CREATE INDEX IF NOT EXISTS idx_versions_created ON model_versions(created_at);

CREATE INDEX IF NOT EXISTS idx_workflows_model ON ml_workflows(model_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON ml_workflows(status);

CREATE INDEX IF NOT EXISTS idx_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON workflow_executions(status);
