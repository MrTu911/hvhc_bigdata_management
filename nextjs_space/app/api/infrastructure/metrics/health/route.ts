import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { INFRA } from '@/lib/rbac/function-codes';
import { getHealthSnapshot } from '@/lib/services/infrastructure/health.service';

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, INFRA.VIEW);
  if (!auth.allowed) return auth.response!;

  try {
    const snapshot = await getHealthSnapshot();
    return NextResponse.json({ success: true, data: snapshot });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
