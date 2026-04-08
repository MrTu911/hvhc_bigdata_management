import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { GOVERNANCE } from '@/lib/rbac/function-codes';
import { DEFAULT_RETENTION_POLICIES } from '@/lib/data-governance';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, GOVERNANCE.VIEW_RETENTION);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ policies: DEFAULT_RETENTION_POLICIES });
  } catch (error) {
    console.error('Error fetching retention policies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
