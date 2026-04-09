/**
 * Template Import – Confirm API
 * POST /api/templates/import/confirm
 *
 * Xác nhận mapping và tạo ReportTemplate version 1.
 * Template tạo ra có isActive = false — admin review rồi mới bật.
 *
 * Auth: TEMPLATES.IMPORT
 *
 * Request body:
 *   analysisId        string   (required)
 *   templateName      string   (required)
 *   templateCode      string   (required) — unique per version
 *   description       string?
 *   category          string?
 *   entityType        string?  — 'personnel' | 'student' | 'party_member' | 'faculty'
 *   outputFormats     string[] — ['DOCX'] | ['XLSX'] | ['PDF', 'DOCX'] ...
 *   confirmedMappings Record<string, string> — { [placeholder]: fieldKey }
 *
 * Response:
 *   templateId    string
 *   templateCode  string
 *   version       number
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { confirmAndCreate } from '@/lib/services/template/template-import.service';

const VALID_ENTITY_TYPES = ['personnel', 'student', 'party_member', 'faculty'] as const;
const VALID_OUTPUT_FORMATS = ['DOCX', 'XLSX', 'PDF'] as const;

export async function POST(request: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const { user, response } = await requireScopedFunction(request, TEMPLATES.IMPORT);
  if (!user) return response!;

  // ── Parse body ───────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: 'Request body phải là JSON hợp lệ' },
      { status: 400 },
    );
  }

  const {
    analysisId,
    templateName,
    templateCode,
    description,
    category,
    entityType,
    outputFormats,
    confirmedMappings,
  } = body;

  // ── Validate required fields ──────────────────────────────────────────────────
  if (!analysisId || typeof analysisId !== 'string') {
    return NextResponse.json(
      { success: false, data: null, error: 'analysisId là bắt buộc' },
      { status: 400 },
    );
  }
  if (!templateName || typeof templateName !== 'string' || !templateName.trim()) {
    return NextResponse.json(
      { success: false, data: null, error: 'templateName là bắt buộc' },
      { status: 400 },
    );
  }
  if (!templateCode || typeof templateCode !== 'string' || !templateCode.trim()) {
    return NextResponse.json(
      { success: false, data: null, error: 'templateCode là bắt buộc' },
      { status: 400 },
    );
  }
  if (!/^[A-Z0-9_-]+$/.test(templateCode as string)) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'templateCode chỉ được chứa chữ HOA, số, dấu gạch dưới và gạch ngang (VD: LY_LICH_CB)',
      },
      { status: 400 },
    );
  }
  if (entityType !== undefined && !VALID_ENTITY_TYPES.includes(entityType as typeof VALID_ENTITY_TYPES[number])) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: `entityType không hợp lệ. Giá trị hợp lệ: ${VALID_ENTITY_TYPES.join(', ')}`,
      },
      { status: 400 },
    );
  }
  if (outputFormats !== undefined) {
    if (!Array.isArray(outputFormats) || outputFormats.length === 0) {
      return NextResponse.json(
        { success: false, data: null, error: 'outputFormats phải là mảng không rỗng' },
        { status: 400 },
      );
    }
    const invalidFormats = (outputFormats as string[]).filter(
      (f) => !VALID_OUTPUT_FORMATS.includes(f as typeof VALID_OUTPUT_FORMATS[number]),
    );
    if (invalidFormats.length > 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: `outputFormats không hợp lệ: ${invalidFormats.join(', ')}`,
        },
        { status: 400 },
      );
    }
  }
  if (!confirmedMappings || typeof confirmedMappings !== 'object' || Array.isArray(confirmedMappings)) {
    return NextResponse.json(
      { success: false, data: null, error: 'confirmedMappings phải là object { placeholder: fieldKey }' },
      { status: 400 },
    );
  }

  // ── Confirm ───────────────────────────────────────────────────────────────────
  try {
    const result = await confirmAndCreate({
      analysisId,
      templateName: (templateName as string).trim(),
      templateCode: (templateCode as string).trim().toUpperCase(),
      description: typeof description === 'string' ? description.trim() || undefined : undefined,
      category: typeof category === 'string' ? category.trim() || undefined : undefined,
      entityType: entityType as string | undefined,
      outputFormats: outputFormats as string[] | undefined,
      confirmedMappings: confirmedMappings as Record<string, string>,
      requestedBy: user.id,
    });

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi tạo template';
    console.error('[POST /api/templates/import/confirm]', { analysisId, templateCode, userId: user.id, error });
    const status = msg.includes('đã tồn tại') || msg.includes('hết hạn') || msg.includes('đã được xác nhận') ? 422 : 500;
    return NextResponse.json({ success: false, data: null, error: msg }, { status });
  }
}
