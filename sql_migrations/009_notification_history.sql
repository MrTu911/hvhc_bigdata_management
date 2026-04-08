
-- Migration: Notification History System
-- Created: 2025-10-07
-- Purpose: Store notification history for audit and tracking

CREATE TABLE IF NOT EXISTS notification_history (
  id SERIAL PRIMARY KEY,
  notification_type VARCHAR(50) NOT NULL, -- 'email', 'telegram', 'system'
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'pending'
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_notification_type (notification_type),
  INDEX idx_recipient (recipient),
  INDEX idx_status (status),
  INDEX idx_sent_at (sent_at)
);

-- Add comments
COMMENT ON TABLE notification_history IS 'Stores history of all notifications sent by the system';
COMMENT ON COLUMN notification_history.metadata IS 'Additional metadata like priority, tags, etc.';

-- Sample data
INSERT INTO notification_history (notification_type, recipient, subject, message, status) VALUES
  ('email', 'admin@hvhc.edu.vn', 'System Alert', 'High CPU usage detected', 'sent'),
  ('telegram', '123456789', 'Training Complete', 'Model training completed successfully', 'sent'),
  ('system', 'user_123', 'Data Upload', 'Your data has been uploaded', 'sent');
