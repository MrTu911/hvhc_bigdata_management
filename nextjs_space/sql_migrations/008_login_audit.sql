
-- Login Audit System
-- Track all login attempts for security monitoring

CREATE TABLE IF NOT EXISTS login_audit (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  location VARCHAR(255),
  status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'blocked'
  failure_reason TEXT,
  login_method VARCHAR(50), -- 'credentials', 'oauth', 'sso'
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_login_audit_user ON login_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_login_audit_email ON login_audit(email);
CREATE INDEX IF NOT EXISTS idx_login_audit_status ON login_audit(status);
CREATE INDEX IF NOT EXISTS idx_login_audit_created ON login_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_audit_ip ON login_audit(ip_address);

-- Login statistics view
CREATE OR REPLACE VIEW login_stats AS
SELECT
  DATE(created_at) as login_date,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE status = 'success') as successful_logins,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_logins,
  COUNT(*) FILTER (WHERE status = 'blocked') as blocked_attempts,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_address) as unique_ips
FROM login_audit
GROUP BY DATE(created_at)
ORDER BY login_date DESC;

-- Suspicious activity detection view
CREATE OR REPLACE VIEW suspicious_logins AS
SELECT
  email,
  ip_address,
  COUNT(*) as failed_attempts,
  MAX(created_at) as last_attempt,
  array_agg(DISTINCT user_agent ORDER BY user_agent) as user_agents
FROM login_audit
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY email, ip_address
HAVING COUNT(*) >= 5
ORDER BY failed_attempts DESC;

-- User login history view
CREATE OR REPLACE VIEW user_login_history AS
SELECT
  la.id,
  la.user_id,
  u.name as user_name,
  la.email,
  la.ip_address,
  la.location,
  la.status,
  la.login_method,
  la.created_at
FROM login_audit la
LEFT JOIN users u ON la.user_id = u.id
ORDER BY la.created_at DESC;

-- Function to clean old audit logs (older than 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_login_audit()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM login_audit
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing
INSERT INTO login_audit (email, ip_address, user_agent, location, status, login_method, session_id) VALUES
('admin@hvhc.edu.vn', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Hanoi, Vietnam', 'success', 'credentials', 'sess_' || md5(random()::text)),
('user@hvhc.edu.vn', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Hanoi, Vietnam', 'success', 'credentials', 'sess_' || md5(random()::text)),
('test@hvhc.edu.vn', '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64)', 'Ho Chi Minh, Vietnam', 'failed', 'credentials', NULL),
('admin@hvhc.edu.vn', '192.168.1.100', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', 'Hanoi, Vietnam', 'success', 'credentials', 'sess_' || md5(random()::text));

COMMENT ON TABLE login_audit IS 'Tracks all login attempts for security monitoring and audit purposes';
COMMENT ON COLUMN login_audit.status IS 'Login attempt status: success, failed, blocked';
COMMENT ON COLUMN login_audit.failure_reason IS 'Reason for failed login: invalid_password, user_not_found, account_locked, etc';
COMMENT ON VIEW suspicious_logins IS 'Detects potential brute force attacks with 5+ failed attempts in 1 hour';
