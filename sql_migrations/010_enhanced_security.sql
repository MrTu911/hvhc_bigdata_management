
-- Migration: Enhanced Security Features
-- Created: 2025-10-07
-- Purpose: Add session timeout, password policies, and security settings

-- Add password policy fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change_reminder TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;

-- Create password history table
CREATE TABLE IF NOT EXISTS password_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_changed_at (changed_at)
);

-- Create session management table
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(500) NOT NULL UNIQUE,
  ip_address VARCHAR(50),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_session_token (session_token),
  INDEX idx_expires_at (expires_at)
);

-- Create security settings table
CREATE TABLE IF NOT EXISTS security_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id)
);

-- Insert default security settings
INSERT INTO security_settings (setting_key, setting_value, description) VALUES
  ('password_min_length', '8', 'Minimum password length'),
  ('password_require_uppercase', 'true', 'Require at least one uppercase letter'),
  ('password_require_lowercase', 'true', 'Require at least one lowercase letter'),
  ('password_require_number', 'true', 'Require at least one number'),
  ('password_require_special', 'true', 'Require at least one special character'),
  ('password_expiry_days', '90', 'Password expires after N days'),
  ('max_failed_login_attempts', '5', 'Max failed login attempts before account lock'),
  ('account_lock_duration_minutes', '30', 'Duration to lock account after max failed attempts'),
  ('session_timeout_minutes', '60', 'Session timeout in minutes'),
  ('session_absolute_timeout_hours', '24', 'Absolute session timeout in hours'),
  ('password_history_count', '5', 'Number of previous passwords to remember')
ON CONFLICT (setting_key) DO NOTHING;

-- Comments
COMMENT ON TABLE password_history IS 'Stores previous passwords to prevent reuse';
COMMENT ON TABLE user_sessions IS 'Tracks active user sessions for timeout management';
COMMENT ON TABLE security_settings IS 'Configurable security policy settings';
