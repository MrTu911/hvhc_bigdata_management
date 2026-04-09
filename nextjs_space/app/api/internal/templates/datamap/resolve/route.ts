/**
 * Internal DataMap Resolve API – M18 UC-T09
 * POST /api/internal/templates/datamap/resolve
 *
 * Dành cho M10/M13/M15 resolve dữ liệu entity theo dataMap của template,
 * trước khi render hoặc để preview dữ liệu sẽ được điền vào template.
 * Auth: Bearer <INTERNAL_API_SECRET> — KHÔNG dùng RBAC position.
 *
 * Request body:
 *   templateId  string  (required)
 *   entityId    string  (required)
 *   entityType  'personnel' | 'student' | 'party_member' | 'faculty'  (required)
 *
 * Response:
 *   templateId     string
 *   entityId       string
 *   entityType     EntityType
 *   resolvedData   Record<string, unknown> — dữ liệu đã resolve theo dataMap
 *   missingFields  string[]                — placeholder chưa có giá trị
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyInternalToken } from '@/lib/auth/internal-auth';
import { resolveEntityData, getMissingFields, EntityType } from '@/lib/services/data-resolver-service';
import prisma from '@/lib/db';

const VALID_ENTITY_TYPES: EntityType[] = ['personnel', 'student', 'party_member', 'faculty'];

export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const auth = verifyInternalToken(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, data: null, error: auth.reason ?? 'Unauthorized' },
      { status: 401 },
    );
  }

  // ── Parse & validate body ───────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: 'Request body phải là JSON hợp lệ' },
      { status: 400 },
    );
  }

  const { templateId, entityId, entityType } = body as Record<string, unknown>;

  if (!templateId || typeof templateId !== 'string') {
    return NextResponse.json(
      { success: false, data: null, error: 'templateId là bắt buộc và phải là string' },
      { status: 400 },
    );
  }
  if (!entityId || typeof entityId !== 'string') {
    return NextResponse.json(
      { success: false, data: null, error: 'entityId là bắt buộc và phải là string' },
      { status: 400 },
    );
  }
  if (!entityType || !VALID_ENTITY_TYPES.includes(entityType as EntityType)) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: `entityType không hợp lệ. Giá trị hợp lệ: ${VALID_ENTITY_TYPES.join(', ')}`,
      },
      { status: 400 },
    );
  }

  // ── Resolve ─────────────────────────────────────────────────────────────────
  try {
    // Lấy dataMap của template
    const template = await prisma.reportTemplate.findUnique({
      where: { id: templateId },
      select: { id: true, isActive: true, dataMap: true },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, data: null, error: 'Template không tồn tại' },
        { status: 404 },
      );
    }
    if (!template.isActive) {
      return NextResponse.json(
        { success: false, data: null, error: 'Template đã bị vô hiệu hóa' },
        { status: 422 },
      );
    }

    const dataMap = (template.dataMap as Record<string, unknown>) ?? {};

    const resolvedData = await resolveEntityData({
      entityId,
      entityType: entityType as EntityType,
      dataMap,
      requestedBy: 'system',
    });

    const missingFields = getMissingFields(dataMap, resolvedData);

    console.info(
      `[POST /api/internal/templates/datamap/resolve] template=${templateId} entity=${entityType}/${entityId} missing=${missingFields.length}`,
    );

    return NextResponse.json({
      success: true,
      data: {
        templateId,
        entityId,
        entityType,
        resolvedData,
        missingFields,
      },
      error: null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi resolve datamap';
    console.error('[POST /api/internal/templates/datamap/resolve]', {
      templateId,
      entityId,
      entityType,
      error,
    });
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
