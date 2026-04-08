-- Theme Management System
-- Hệ thống quản lý giao diện và thương hiệu

-- Theme Settings Table
CREATE TABLE IF NOT EXISTS theme_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    category VARCHAR(50) NOT NULL,
    display_name VARCHAR(200),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Branding Assets Table
CREATE TABLE IF NOT EXISTS branding_assets (
    id SERIAL PRIMARY KEY,
    asset_type VARCHAR(50) NOT NULL,
    asset_name VARCHAR(200) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT,
    is_active BOOLEAN DEFAULT true,
    dimensions VARCHAR(50),
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Theme Presets Table
CREATE TABLE IF NOT EXISTS theme_presets (
    id SERIAL PRIMARY KEY,
    preset_name VARCHAR(100) UNIQUE NOT NULL,
    preset_label VARCHAR(200),
    preset_config JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    preview_image TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default theme settings
INSERT INTO theme_settings (setting_key, setting_value, setting_type, category, display_name, description) VALUES
('primary_color', '217 91% 45%', 'color', 'colors', 'Màu chủ đạo', 'Màu chính của hệ thống'),
('secondary_color', '142 76% 36%', 'color', 'colors', 'Màu phụ', 'Màu phụ hỗ trợ'),
('accent_color', '45 93% 47%', 'color', 'colors', 'Màu nhấn', 'Màu nhấn mạnh'),
('success_color', '142 71% 45%', 'color', 'colors', 'Màu thành công', 'Trạng thái thành công'),
('warning_color', '38 92% 50%', 'color', 'colors', 'Màu cảnh báo', 'Trạng thái cảnh báo'),
('danger_color', '0 84% 60%', 'color', 'colors', 'Màu nguy hiểm', 'Trạng thái lỗi'),
('info_color', '199 89% 48%', 'color', 'colors', 'Màu thông tin', 'Thông tin chung'),
('font_family', 'Inter', 'string', 'typography', 'Font chữ', 'Font chữ hệ thống'),
('font_size_base', '14', 'number', 'typography', 'Cỡ chữ', 'Kích thước chữ cơ bản'),
('sidebar_width', '280', 'number', 'layout', 'Độ rộng Sidebar', 'Chiều rộng menu'),
('site_title', 'HVHC BigData', 'string', 'branding', 'Tiêu đề', 'Tên hệ thống')
ON CONFLICT (setting_key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_theme_settings_category ON theme_settings(category);
CREATE INDEX IF NOT EXISTS idx_branding_assets_type ON branding_assets(asset_type);
