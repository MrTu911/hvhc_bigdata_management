/**
 * /api/education/training-materiels — Vật chất huấn luyện (Ban Vật chất).
 * GET: danh sách (RBAC VIEW). POST: tạo (RBAC CREATE + audit).
 */

import { NextRequest, NextResponse } from 'next/server';

import { logAudit } from '@/lib/audit';
import { TRAINING_MATERIEL } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';
import { listMateriels, createMateriel } from '@/lib/services/education/training-materiel.service';

export const dynamic = 'force-dynamic';

const CATEGORIES = ['WEAPON_MODEL', 'EQUIPMENT', 'FIELD_GEAR', 'SIMULATOR', 'AMMUNITION_MODEL', 'CONSUMABLE', 'OTHER'];
const CONDITIONS = ['NEW', 'GOOD', 'USABLE', 'DAMAGED', 'RETIRED'];

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, TRAINING_MATERIEL.VIEW);
  if (!auth.allowed) return auth.response!;

  try {
    const sp = new URL(req.url).searchParams;
    const result = await listMateriels({
      search: sp.get('search') || undefined,
      category: (sp.get('category') as never) || undefined,
      condition: (sp.get('condition') as never) || undefined,
      managingUnitId: sp.get('managingUnitId') || undefined,
      page: sp.get('page') ? parseInt(sp.get('page')!, 10) : undefined,
      limit: sp.get('limit') ? parseInt(sp.get('limit')!, 10) : undefined,
    });
    return NextResponse.json({ success: true, data: result, error: null });
  } catch (error) {
    console.error('GET /api/education/training-materiels error:', error);
    return NextResponse.json({ success: false, data: null, error: 'Lỗi tải danh sách vật chất' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, TRAINING_MATERIEL.CREATE);
  if (!auth.allowed) return auth.response!;

  try {
    const body = await req.json().catch(() => ({}));
    if (!body.code || !body.name) {
      return NextResponse.json({ success: false, data: null, error: 'Thiếu mã hoặc tên vật chất' }, { status: 400 });
    }
    if (body.category && !CATEGORIES.includes(body.category)) {
      return NextResponse.json({ success: false, data: null, error: 'Loại vật chất không hợp lệ' }, { status: 400 });
    }
    if (body.condition && !CONDITIONS.includes(body.condition)) {
      return NextResponse.json({ success: false, data: null, error: 'Tình trạng không hợp lệ' }, { status: 400 });
    }

    const created = await createMateriel(body);
    await logAudit({
      userId: auth.user!.id,
      functionCode: TRAINING_MATERIEL.CREATE,
      action: 'CREATE',
      resourceType: 'TRAINING_MATERIEL',
      resourceId: created.id,
      newValue: { code: created.code, name: created.name },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json({ success: true, data: created, error: null }, { status: 201 });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2002') {
      return NextResponse.json({ success: false, data: null, error: 'Mã vật chất đã tồn tại' }, { status: 409 });
    }
    console.error('POST /api/education/training-materiels error:', error);
    return NextResponse.json({ success: false, data: null, error: 'Lỗi tạo vật chất' }, { status: 500 });
  }
}
