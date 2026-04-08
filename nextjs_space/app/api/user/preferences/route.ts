
/**
 * API Route: User Preferences
 * GET /api/user/preferences - Get user preferences
 * PUT /api/user/preferences - Update user preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma as db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await db.$queryRaw`
      SELECT * FROM user_preferences WHERE user_id = ${session.user.id}
    `;

    const prefs = Array.isArray(preferences) ? preferences[0] : preferences;

    return NextResponse.json({
      success: true,
      preferences: prefs || {
        theme: 'light',
        language: 'vi',
        notifications_enabled: true,
      },
    });
  } catch (error: any) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to get preferences', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { theme, language, timezone, notifications_enabled } = body;

    // Upsert preferences
    await db.$executeRaw`
      INSERT INTO user_preferences (user_id, theme, language, timezone, notifications_enabled, updated_at)
      VALUES (${session.user.id}, ${theme || 'light'}, ${language || 'vi'}, 
              ${timezone || 'Asia/Ho_Chi_Minh'}, ${notifications_enabled !== false}, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        theme = EXCLUDED.theme,
        language = EXCLUDED.language,
        timezone = EXCLUDED.timezone,
        notifications_enabled = EXCLUDED.notifications_enabled,
        updated_at = CURRENT_TIMESTAMP
    `;

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
    });
  } catch (error: any) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences', details: error.message },
      { status: 500 }
    );
  }
}
