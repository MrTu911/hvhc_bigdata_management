/**
 * /api/education/maps — Vật chất bản đồ (Ban Bản đồ), giấy + số.
 * GET: danh sách (RBAC VIEW; bản đồ mật chỉ hiện khi có VIEW_MAP_SECRET).
 * POST: tạo (RBAC CREATE; tạo bản đồ mật cần VIEW_MAP_SECRET) + audit.
 */

import { NextRequest, NextResponse } from 'next/server';

import { logAudit } from '@/lib/audit';
import { MAP } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';
import { hasPermission } from '@/lib/rbac/policy';
import {
  listMapAssets, createMapAsset, RESTRICTED_SECURITY_LEVELS,
} from '@/lib/services/education/map-asset.service';

export const dynamic = 'force-dynamic';

const MAP_TYPES = ['TOPOGRAPHIC', 'TACTICAL', 'ADMINISTRATIVE', 'OPERATIONAL', 'DIGITAL_LAYER', 'OTHER'];
const FORMATS = ['PAPER', 'DIGITAL'];
const SECURITY_LEVELS = ['NORMAL', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'];

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, MAP.VIEW);
  if (!auth.allowed) return auth.response!;

  try {
    const { hasPermission: canSecret } = await hasPermission(auth.user!.id, MAP.VIEW_SECRET);
    const sp = new URL(req.url).searchParams;
    const result = await listMapAssets({
      search: sp.get('search') || undefined,
      mapType: (sp.get('mapType') as never) || undefined,
      format: (sp.get('format') as never) || undefined,
      managingUnitId: sp.get('managingUnitId') || undefined,
      includeSecret: canSecret,
      page: sp.get('page') ? parseInt(sp.get('page')!, 10) : undefined,
      limit: sp.get('limit') ? parseInt(sp.get('limit')!, 10) : undefined,
    });
    return NextResponse.json({ success: true, data: { ...result, canSecret }, error: null });
  } catch (error) {
    console.error('GET /api/education/maps error:', error);
    return NextResponse.json({ success: false, data: null, error: 'Lỗi tải danh sách bản đồ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, MAP.CREATE);
  if (!auth.allowed) return auth.response!;

  try {
    const body = await req.json().catch(() => ({}));
    if (!body.code || !body.name) {
      return NextResponse.json({ success: false, data: null, error: 'Thiếu mã hoặc tên bản đồ' }, { status: 400 });
    }
    if (body.mapType && !MAP_TYPES.includes(body.mapType)) {
      return NextResponse.json({ success: false, data: null, error: 'Loại bản đồ không hợp lệ' }, { status: 400 });
    }
    if (body.format && !FORMATS.includes(body.format)) {
      return NextResponse.json({ success: false, data: null, error: 'Định dạng không hợp lệ' }, { status: 400 });
    }
    if (body.securityLevel && !SECURITY_LEVELS.includes(body.securityLevel)) {
      return NextResponse.json({ success: false, data: null, error: 'Cấp độ mật không hợp lệ' }, { status: 400 });
    }
    // Tạo bản đồ mật phải có quyền nhạy cảm
    if (body.securityLevel && RESTRICTED_SECURITY_LEVELS.includes(body.securityLevel)) {
      const { hasPermission: canSecret } = await hasPermission(auth.user!.id, MAP.VIEW_SECRET);
      if (!canSecret) {
        return NextResponse.json({ success: false, data: null, error: 'Không có quyền quản lý bản đồ mật' }, { status: 403 });
      }
    }

    const created = await createMapAsset(body);
    await logAudit({
      userId: auth.user!.id, functionCode: MAP.CREATE, action: 'CREATE',
      resourceType: 'MAP_ASSET', resourceId: created.id,
      newValue: { code: created.code, securityLevel: created.securityLevel }, result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json({ success: true, data: created, error: null }, { status: 201 });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2002') {
      return NextResponse.json({ success: false, data: null, error: 'Mã bản đồ đã tồn tại' }, { status: 409 });
    }
    console.error('POST /api/education/maps error:', error);
    return NextResponse.json({ success: false, data: null, error: 'Lỗi tạo bản đồ' }, { status: 500 });
  }
}
