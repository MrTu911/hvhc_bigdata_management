import { requireFunction } from "@/lib/rbac/middleware";
import { THEME } from "@/lib/rbac/function-codes";

import { NextResponse } from 'next/server';
import { query } from '@/lib/query-executor';

// GET: Fetch all theme settings
export async function GET() {
  try {
    const result = await query(
      `SELECT * FROM theme_settings ORDER BY category, setting_key`
    );
    
    // Group by category
    const grouped = result.rows.reduce((acc: any, row: any) => {
      if (!acc[row.category]) {
        acc[row.category] = [];
      }
      acc[row.category].push(row);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        all: result.rows,
        grouped
      }
    });
  } catch (error: any) {
    // Silently handle database connection errors and return defaults
    // This is expected when database is not available
    const defaultSettings = getDefaultThemeSettings();
    return NextResponse.json({
      success: true,
      data: {
        all: defaultSettings,
        grouped: groupSettingsByCategory(defaultSettings)
      }
    });
  }
}

function getDefaultThemeSettings() {
  return [
    { id: 1, setting_key: 'primary_color', setting_value: '217 91% 45%', setting_type: 'color', category: 'colors', display_name: 'Màu chủ đạo', description: 'Màu chính của hệ thống' },
    { id: 2, setting_key: 'secondary_color', setting_value: '142 76% 36%', setting_type: 'color', category: 'colors', display_name: 'Màu phụ', description: 'Màu phụ hỗ trợ' },
    { id: 3, setting_key: 'accent_color', setting_value: '45 93% 47%', setting_type: 'color', category: 'colors', display_name: 'Màu nhấn', description: 'Màu nhấn mạnh' },
    { id: 4, setting_key: 'success_color', setting_value: '142 71% 45%', setting_type: 'color', category: 'colors', display_name: 'Màu thành công', description: 'Trạng thái thành công' },
    { id: 5, setting_key: 'warning_color', setting_value: '38 92% 50%', setting_type: 'color', category: 'colors', display_name: 'Màu cảnh báo', description: 'Trạng thái cảnh báo' },
    { id: 6, setting_key: 'danger_color', setting_value: '0 84% 60%', setting_type: 'color', category: 'colors', display_name: 'Màu nguy hiểm', description: 'Trạng thái lỗi' },
    { id: 7, setting_key: 'info_color', setting_value: '199 89% 48%', setting_type: 'color', category: 'colors', display_name: 'Màu thông tin', description: 'Thông tin chung' },
    { id: 8, setting_key: 'font_family', setting_value: 'Inter', setting_type: 'string', category: 'typography', display_name: 'Font chữ', description: 'Font chữ hệ thống' },
    { id: 9, setting_key: 'font_size_base', setting_value: '14', setting_type: 'number', category: 'typography', display_name: 'Cỡ chữ', description: 'Kích thước chữ cơ bản' },
    { id: 10, setting_key: 'sidebar_width', setting_value: '280', setting_type: 'number', category: 'layout', display_name: 'Độ rộng Sidebar', description: 'Chiều rộng menu' },
    { id: 11, setting_key: 'site_title', setting_value: 'HVHC BigData', setting_type: 'string', category: 'branding', display_name: 'Tiêu đề', description: 'Tên hệ thống' },
  ];
}

function groupSettingsByCategory(settings: any[]) {
  return settings.reduce((acc: any, row: any) => {
    if (!acc[row.category]) {
      acc[row.category] = [];
    }
    acc[row.category].push(row);
    return acc;
  }, {});
}

// PUT: Update theme settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { success: false, error: 'Settings must be an array' },
        { status: 400 }
      );
    }

    // Update each setting
    for (const setting of settings) {
      await query(
        `UPDATE theme_settings 
         SET setting_value = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE setting_key = $2`,
        [setting.value, setting.key]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Theme settings updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating theme settings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST: Create new theme setting
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value, type, category, displayName, description } = body;

    const result = await query(
      `INSERT INTO theme_settings 
       (setting_key, setting_value, setting_type, category, display_name, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [key, value, type, category, displayName, description]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating theme setting:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
