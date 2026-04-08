
-- Migration: User Preferences and Settings
-- Created: 2025-10-07
-- Purpose: Store per-user preferences including theme

CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(50) DEFAULT 'light', -- 'light', 'dark', 'system'
  language VARCHAR(10) DEFAULT 'vi', -- 'vi', 'en'
  timezone VARCHAR(100) DEFAULT 'Asia/Ho_Chi_Minh',
  date_format VARCHAR(50) DEFAULT 'DD/MM/YYYY',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  telegram_notifications BOOLEAN DEFAULT FALSE,
  dashboard_layout JSONB DEFAULT '{}',
  default_data_view VARCHAR(50) DEFAULT 'table',
  items_per_page INTEGER DEFAULT 20,
  preferences JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id)
);

-- Insert default preferences for existing users
INSERT INTO user_preferences (user_id, theme, language)
SELECT id, 'light', 'vi' FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Comments
COMMENT ON TABLE user_preferences IS 'Per-user preferences and settings';
COMMENT ON COLUMN user_preferences.preferences IS 'Additional custom preferences in JSON format';
