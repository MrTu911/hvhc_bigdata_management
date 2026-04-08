import { requireFunction } from "@/lib/rbac/middleware";
import { THEME } from "@/lib/rbac/function-codes";

import { NextResponse } from 'next/server';
import { query } from '@/lib/query-executor';

// GET: Fetch all branding assets
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get('type');

    let sql = 'SELECT * FROM branding_assets WHERE is_active = true';
    const params: any[] = [];

    if (assetType) {
      sql += ' AND asset_type = $1';
      params.push(assetType);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    // Silently handle database errors - return empty array when DB unavailable
    return NextResponse.json({
      success: true,
      data: []
    });
  }
}

// POST: Upload new branding asset
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assetType, assetName, filePath, fileUrl, dimensions, fileSize, mimeType } = body;

    // Deactivate previous assets of the same type if it's logo or favicon
    if (assetType === 'logo' || assetType === 'favicon') {
      await query(
        'UPDATE branding_assets SET is_active = false WHERE asset_type = $1',
        [assetType]
      );
    }

    const result = await query(
      `INSERT INTO branding_assets 
       (asset_type, asset_name, file_path, file_url, dimensions, file_size, mime_type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [assetType, assetName, filePath, fileUrl, dimensions, fileSize, mimeType]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating branding asset:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Remove branding asset
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Asset ID required' },
        { status: 400 }
      );
    }

    await query(
      'UPDATE branding_assets SET is_active = false WHERE id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting branding asset:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
