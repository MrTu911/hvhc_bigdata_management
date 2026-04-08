
-- Migration: AI Intelligence Layer
-- Version: 6.2
-- Date: 2025-10-15
-- Description: Add tables for NLP analysis, risk prediction, and AI recommendations

-- =====================================================
-- 1. NLP Feedback Analysis
-- =====================================================

-- Table for storing NLP analysis results
CREATE TABLE IF NOT EXISTS feedback_analysis (
  id SERIAL PRIMARY KEY,
  feedback_id INTEGER REFERENCES course_feedback(id) ON DELETE CASCADE,
  sentiment VARCHAR(20) NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral', 'constructive')),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  keywords TEXT[] DEFAULT '{}',
  entities JSONB DEFAULT '{}',
  analyzed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(feedback_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_analysis_sentiment ON feedback_analysis(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_confidence ON feedback_analysis(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_analyzed_at ON feedback_analysis(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_keywords ON feedback_analysis USING GIN(keywords);

COMMENT ON TABLE feedback_analysis IS 'NLP sentiment analysis results for course feedback';
COMMENT ON COLUMN feedback_analysis.sentiment IS 'Detected sentiment: positive, negative, neutral, or constructive';
COMMENT ON COLUMN feedback_analysis.confidence IS 'Confidence score of the sentiment prediction (0-1)';
COMMENT ON COLUMN feedback_analysis.keywords IS 'Extracted keywords from feedback text';
COMMENT ON COLUMN feedback_analysis.entities IS 'Extracted entities: topics, concerns, suggestions';

-- =====================================================
-- 2. Student Risk Profiles
-- =====================================================

-- Table for storing student risk assessments
CREATE TABLE IF NOT EXISTS student_risk_profiles (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level VARCHAR(10) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  factors JSONB DEFAULT '[]',
  recommendations TEXT[] DEFAULT '{}',
  calculated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX IF NOT EXISTS idx_student_risk_student ON student_risk_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_student_risk_course ON student_risk_profiles(course_id);
CREATE INDEX IF NOT EXISTS idx_student_risk_level ON student_risk_profiles(risk_level);
CREATE INDEX IF NOT EXISTS idx_student_risk_score ON student_risk_profiles(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_student_risk_calculated ON student_risk_profiles(calculated_at DESC);

-- Unique constraint: one active profile per student per course
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_risk_unique_active 
  ON student_risk_profiles(student_id, COALESCE(course_id, 0)) 
  WHERE expires_at > NOW();

COMMENT ON TABLE student_risk_profiles IS 'AI-predicted risk profiles for students';
COMMENT ON COLUMN student_risk_profiles.risk_score IS 'Overall risk score (0-100)';
COMMENT ON COLUMN student_risk_profiles.risk_level IS 'Risk level: low, medium, high, critical';
COMMENT ON COLUMN student_risk_profiles.factors IS 'Array of risk factors with impacts';
COMMENT ON COLUMN student_risk_profiles.recommendations IS 'AI-generated intervention recommendations';
COMMENT ON COLUMN student_risk_profiles.expires_at IS 'Cache expiration - recalculate after this time';

-- =====================================================
-- 3. Course Recommendations
-- =====================================================

-- Table for storing course recommendations
CREATE TABLE IF NOT EXISTS course_recommendations (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  similarity_score DECIMAL(3,2) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  reason TEXT,
  estimated_grade DECIMAL(3,1),
  recommended_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
  clicked BOOLEAN DEFAULT FALSE,
  enrolled BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_course_rec_student ON course_recommendations(student_id);
CREATE INDEX IF NOT EXISTS idx_course_rec_course ON course_recommendations(course_id);
CREATE INDEX IF NOT EXISTS idx_course_rec_score ON course_recommendations(similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_course_rec_recommended ON course_recommendations(recommended_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_rec_active ON course_recommendations(student_id, expires_at) 
  WHERE expires_at > NOW();

COMMENT ON TABLE course_recommendations IS 'AI-generated course recommendations for students';
COMMENT ON COLUMN course_recommendations.similarity_score IS 'Recommendation confidence (0-1)';
COMMENT ON COLUMN course_recommendations.reason IS 'Explanation for why this course is recommended';
COMMENT ON COLUMN course_recommendations.estimated_grade IS 'Predicted grade if student enrolls';
COMMENT ON COLUMN course_recommendations.clicked IS 'Whether student clicked to view details';
COMMENT ON COLUMN course_recommendations.enrolled IS 'Whether student enrolled in recommended course';

-- =====================================================
-- 4. AI Model Metadata
-- =====================================================

-- Table for tracking AI model versions and performance
CREATE TABLE IF NOT EXISTS ai_model_metadata (
  id SERIAL PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('nlp', 'prediction', 'recommendation', 'forecasting')),
  version VARCHAR(20) NOT NULL,
  accuracy DECIMAL(4,3),
  precision_score DECIMAL(4,3),
  recall_score DECIMAL(4,3),
  f1_score DECIMAL(4,3),
  training_data_size INTEGER,
  trained_at TIMESTAMP,
  deployed_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  UNIQUE(model_name, version)
);

CREATE INDEX IF NOT EXISTS idx_ai_model_type ON ai_model_metadata(model_type);
CREATE INDEX IF NOT EXISTS idx_ai_model_active ON ai_model_metadata(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_ai_model_deployed ON ai_model_metadata(deployed_at DESC);

COMMENT ON TABLE ai_model_metadata IS 'Metadata and performance metrics for AI/ML models';
COMMENT ON COLUMN ai_model_metadata.model_type IS 'Type of model: nlp, prediction, recommendation, forecasting';
COMMENT ON COLUMN ai_model_metadata.is_active IS 'Whether this model version is currently in use';
COMMENT ON COLUMN ai_model_metadata.config IS 'Model configuration and hyperparameters';

-- =====================================================
-- 5. Initial Model Records
-- =====================================================

INSERT INTO ai_model_metadata (model_name, model_type, version, accuracy, precision_score, recall_score, f1_score, trained_at, config)
VALUES
  ('vietnamese_sentiment_nlp', 'nlp', 'v1.0', 0.850, 0.830, 0.820, 0.825, '2025-10-01', '{"model": "distilbert-multilingual", "max_length": 512}'),
  ('student_risk_predictor', 'prediction', 'v1.0', 0.870, 0.840, 0.810, 0.820, '2025-10-01', '{"algorithm": "random_forest", "features": ["grades", "attendance", "assignments", "participation"]}'),
  ('course_recommender', 'recommendation', 'v1.0', 0.780, 0.750, 0.730, 0.740, '2025-10-01', '{"algorithm": "collaborative_filtering", "similarity": "cosine"}')
ON CONFLICT (model_name, version) DO NOTHING;

-- =====================================================
-- 6. Cleanup Job Function
-- =====================================================

-- Function to clean up expired AI predictions
CREATE OR REPLACE FUNCTION cleanup_expired_ai_data()
RETURNS void AS $$
BEGIN
  -- Delete expired risk profiles
  DELETE FROM student_risk_profiles WHERE expires_at < NOW();
  
  -- Delete expired recommendations
  DELETE FROM course_recommendations WHERE expires_at < NOW() AND enrolled = FALSE;
  
  -- Archive old feedback analysis (keep last 6 months)
  DELETE FROM feedback_analysis WHERE analyzed_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_ai_data() IS 'Cleanup expired AI predictions and old analysis data';

-- =====================================================
-- 7. Views for Analytics
-- =====================================================

-- View: Sentiment trends over time
CREATE OR REPLACE VIEW v_sentiment_trends AS
SELECT
  DATE_TRUNC('day', fa.analyzed_at) as date,
  cf.course_id,
  c.name as course_name,
  fa.sentiment,
  COUNT(*) as count,
  AVG(fa.confidence) as avg_confidence
FROM feedback_analysis fa
JOIN course_feedback cf ON cf.id = fa.feedback_id
JOIN courses c ON c.id = cf.course_id
WHERE fa.analyzed_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', fa.analyzed_at), cf.course_id, c.name, fa.sentiment
ORDER BY date DESC, count DESC;

COMMENT ON VIEW v_sentiment_trends IS 'Daily sentiment trends by course';

-- View: At-risk students summary
CREATE OR REPLACE VIEW v_at_risk_students_summary AS
SELECT
  srp.course_id,
  c.name as course_name,
  c.code as course_code,
  COUNT(*) FILTER (WHERE srp.risk_level = 'critical') as critical_count,
  COUNT(*) FILTER (WHERE srp.risk_level = 'high') as high_count,
  COUNT(*) FILTER (WHERE srp.risk_level = 'medium') as medium_count,
  COUNT(*) FILTER (WHERE srp.risk_level = 'low') as low_count,
  COUNT(*) as total_assessed,
  ROUND(AVG(srp.risk_score), 1) as avg_risk_score,
  MAX(srp.calculated_at) as last_calculated
FROM student_risk_profiles srp
JOIN courses c ON c.id = srp.course_id
WHERE srp.expires_at > NOW()
GROUP BY srp.course_id, c.name, c.code
ORDER BY critical_count DESC, high_count DESC;

COMMENT ON VIEW v_at_risk_students_summary IS 'Summary of at-risk students by course';

-- View: Recommendation effectiveness
CREATE OR REPLACE VIEW v_recommendation_effectiveness AS
SELECT
  DATE_TRUNC('month', cr.recommended_at) as month,
  COUNT(*) as total_recommendations,
  COUNT(*) FILTER (WHERE cr.clicked = TRUE) as click_through,
  COUNT(*) FILTER (WHERE cr.enrolled = TRUE) as enrollments,
  ROUND(100.0 * COUNT(*) FILTER (WHERE cr.clicked = TRUE) / COUNT(*), 1) as ctr_percent,
  ROUND(100.0 * COUNT(*) FILTER (WHERE cr.enrolled = TRUE) / COUNT(*), 1) as conversion_percent
FROM course_recommendations cr
WHERE cr.recommended_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', cr.recommended_at)
ORDER BY month DESC;

COMMENT ON VIEW v_recommendation_effectiveness IS 'Monthly recommendation performance metrics';

-- =====================================================
-- 8. Grants
-- =====================================================

-- Grant permissions (adjust based on your role structure)
GRANT SELECT, INSERT, UPDATE ON feedback_analysis TO authenticated;
GRANT SELECT, INSERT, UPDATE ON student_risk_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON course_recommendations TO authenticated;
GRANT SELECT ON ai_model_metadata TO authenticated;

GRANT SELECT ON v_sentiment_trends TO authenticated;
GRANT SELECT ON v_at_risk_students_summary TO authenticated;
GRANT SELECT ON v_recommendation_effectiveness TO authenticated;

-- =====================================================
-- Migration Complete
-- =====================================================

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 011: AI Intelligence Layer completed successfully';
  RAISE NOTICE 'Tables created: feedback_analysis, student_risk_profiles, course_recommendations, ai_model_metadata';
  RAISE NOTICE 'Views created: v_sentiment_trends, v_at_risk_students_summary, v_recommendation_effectiveness';
END $$;
