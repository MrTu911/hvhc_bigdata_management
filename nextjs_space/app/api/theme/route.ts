import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { THEME } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

/**
 * GET /api/theme - Get theme settings (public)
 */
export async function GET(request: NextRequest) {
  try {
    // Theme can be accessed without auth for public pages
    const themeSettings: any = {
      colors: {
        primary_color: '217 91% 45%',
        secondary_color: '142 76% 36%',
        accent_color: '45 93% 47%',
        success_color: '142 71% 45%',
        warning_color: '38 92% 50%',
        danger_color: '0 84% 60%',
        info_color: '199 89% 48%'
      },
      typography: {
        font_family: 'Inter',
        font_size_base: '14'
      },
      layout: {
        sidebar_width: '280'
      },
      branding: {
        site_title: 'HVHC BigData'
      }
    };

    return NextResponse.json({ theme: themeSettings });

  } catch (error: any) {
    console.error('Theme fetch error:', error);
    return NextResponse.json({
      theme: {
        colors: {
          primary_color: '217 91% 45%',
          secondary_color: '142 76% 36%',
          accent_color: '45 93% 47%'
        },
        typography: {
          font_family: 'Inter',
          font_size_base: 14
        },
        layout: {
          sidebar_width: 280
        },
        branding: {
          site_title: 'HVHC BigData'
        }
      }
    });
  }
}

/**
 * PUT /api/theme - Update theme settings
 * RBAC: THEME.UPDATE
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, THEME.UPDATE);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json({ error: 'settings is required' }, { status: 400 });
    }

    // In production, this would update the database
    // For now, just acknowledge the update
    const updates = Object.keys(settings);

    return NextResponse.json({
      success: true,
      updated: updates,
      count: updates.length
    });

  } catch (error: any) {
    console.error('Theme update error:', error);
    return NextResponse.json(
      { error: 'Failed to update theme', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/theme/preset - Save theme as preset
 * RBAC: THEME.UPDATE
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, THEME.UPDATE);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const body = await request.json();
    const { presetName, presetLabel, config } = body;

    if (!presetName || !config) {
      return NextResponse.json({ error: 'presetName and config are required' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      presetId: Math.floor(Math.random() * 1000)
    });

  } catch (error: any) {
    console.error('Preset save error:', error);
    return NextResponse.json(
      { error: 'Failed to save preset', details: error.message },
      { status: 500 }
    );
  }
}
