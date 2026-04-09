/**
 * Internal Render API – M18 UC-T09
 * POST /api/internal/templates/render
 *
 * Dành cho M10/M13/M15 gọi M18 để render + xuất file mà không qua UI.
 * Auth: Bearer <INTERNAL_API_SECRET> — KHÔNG dùng RBAC position.
 *
 * Request body:
 *   templateId   string  (required)
 *   entityId     string  (required)
 *   entityType   'personnel' | 'student' | 'party_member' | 'faculty'  (required)
 *   outputFormat 'PDF' | 'DOCX' | 'XLSX'  (required)
 *   callerModule string  (optional) — 'M10' | 'M13' | 'M15', dùng cho audit/log
 *   requestedBy  string  (optional) — userId hoặc 'system'
 *
 * Response:
 *   jobId        string  — ID của ExportJob đã tạo
 *   downloadUrl  string  — signed MinIO URL (TTL 24h)
 *   expiresIn    number  — giây cho đến khi URL hết hạn
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyInternalToken } from '@/lib/auth/internal-auth';
import { exportSingle } from '@/lib/services/export-engine-service';
import type { EntityType } from '@/lib/services/data-resolver-service';

const VALID_OUTPUT_FORMATS = ['PDF', 'DOCX', 'XLSX'] as const;
type OutputFormat = (typeof VALID_OUTPUT_FORMATS)[number];

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

  const { templateId, entityId, entityType, outputFormat, callerModule, requestedBy } =
    body as Record<string, unknown>;

  const validationError = validateRenderInput({
    templateId,
    entityId,
    entityType,
    outputFormat,
  });
  if (validationError) {
    return NextResponse.json(
      { success: false, data: null, error: validationError },
      { status: 400 },
    );
  }

  // ── Execute render ──────────────────────────────────────────────────────────
  try {
    const callerTag = typeof callerModule === 'string' ? `internal:${callerModule}` : 'internal';

    const result = await exportSingle({
      templateId: templateId as string,
      entityId: entityId as string,
      entityType: entityType as EntityType,
      outputFormat: outputFormat as OutputFormat,
      requestedBy: typeof requestedBy === 'string' ? requestedBy : 'system',
      callerType: callerTag,
    });

    console.info(
      `[POST /api/internal/templates/render] jobId=${result.jobId} caller=${callerTag} template=${templateId} entity=${entityType}/${entityId}`,
    );

    return NextResponse.json({
      success: true,
      data: result,
      error: null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi render template';
    console.error('[POST /api/internal/templates/render]', {
      templateId,
      entityId,
      entityType,
      callerModule,
      error,
    });
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}

// ── Input validation ──────────────────────────────────────────────────────────

interface RenderInput {
  templateId: unknown;
  entityId: unknown;
  entityType: unknown;
  outputFormat: unknown;
}

function validateRenderInput(input: RenderInput): string | null {
  if (!input.templateId || typeof input.templateId !== 'string') {
    return 'templateId là bắt buộc và phải là string';
  }
  if (!input.entityId || typeof input.entityId !== 'string') {
    return 'entityId là bắt buộc và phải là string';
  }
  if (!input.entityType || !VALID_ENTITY_TYPES.includes(input.entityType as EntityType)) {
    return `entityType không hợp lệ. Giá trị hợp lệ: ${VALID_ENTITY_TYPES.join(', ')}`;
  }
  if (!input.outputFormat || !VALID_OUTPUT_FORMATS.includes(input.outputFormat as OutputFormat)) {
    return `outputFormat không hợp lệ. Giá trị hợp lệ: ${VALID_OUTPUT_FORMATS.join(', ')}`;
  }
  return null;
}
