/**
 * Template Import – Analyze API
 * POST /api/templates/import/analyze
 *
 * Nhận file multipart/form-data, phân tích placeholder, gợi ý mapping.
 * Lưu TemplateImportAnalysis với TTL 24h.
 *
 * Auth: TEMPLATES.IMPORT
 *
 * Form fields:
 *   file  — File (.docx, .xlsx, .html), max 10MB
 *
 * Response:
 *   analysisId       string
 *   expiresAt        string (ISO)
 *   placeholders     string[]
 *   suggestedMappings SuggestedMapping[]
 *   fileStats        FileStats
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { analyzeAndSave } from '@/lib/services/template/template-import.service';

export async function POST(request: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const { user, response } = await requireScopedFunction(request, TEMPLATES.IMPORT);
  if (!user) return response!;

  // ── Parse multipart ──────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: 'Request phải là multipart/form-data' },
      { status: 400 },
    );
  }

  const fileEntry = formData.get('file');
  if (!fileEntry || !(fileEntry instanceof File)) {
    return NextResponse.json(
      { success: false, data: null, error: 'Thiếu field "file" trong form data' },
      { status: 400 },
    );
  }

  const fileName = fileEntry.name;
  if (!fileName) {
    return NextResponse.json(
      { success: false, data: null, error: 'File không có tên' },
      { status: 400 },
    );
  }

  // ── Convert File → Buffer ────────────────────────────────────────────────────
  let fileBuffer: Buffer;
  try {
    const arrayBuffer = await fileEntry.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: 'Không thể đọc nội dung file' },
      { status: 400 },
    );
  }

  // ── Analyze ──────────────────────────────────────────────────────────────────
  try {
    const result = await analyzeAndSave(fileBuffer, fileName, user.id);

    return NextResponse.json({
      success: true,
      data: {
        analysisId: result.analysisId,
        expiresAt: result.expiresAt.toISOString(),
        placeholders: result.payload.placeholders,
        suggestedMappings: result.payload.suggestedMappings,
        fileStats: result.payload.fileStats,
      },
      error: null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi phân tích template';
    console.error('[POST /api/templates/import/analyze]', { fileName, userId: user.id, error });
    const status = msg.includes('vượt quá') || msg.includes('Chỉ hỗ trợ') ? 400 : 500;
    return NextResponse.json({ success: false, data: null, error: msg }, { status });
  }
}
