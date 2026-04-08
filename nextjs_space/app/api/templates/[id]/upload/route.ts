/**
 * M18 Template API – POST upload template file
 *
 * multipart/form-data:
 *   file        File      bắt buộc (.docx / .xlsx / .html, max 20MB)
 *   format      string?   override DOCX|XLSX|HTML nếu MIME detection sai
 *   changeNote  string?   ghi chú lý do upload version mới
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { uploadTemplateFile } from '@/lib/services/template-service';

const ALLOWED_MIME: Record<string, 'DOCX' | 'XLSX' | 'HTML'> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'text/html': 'HTML',
  'application/octet-stream': 'DOCX', // fallback khi browser không detect đúng
};

const ALLOWED_EXT: Record<string, 'DOCX' | 'XLSX' | 'HTML'> = {
  docx: 'DOCX',
  xlsx: 'XLSX',
  html: 'HTML',
  htm: 'HTML',
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.MANAGE);
    if (!user) return response!;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const formatOverride = formData.get('format') as string | null;
    const changeNote = (formData.get('changeNote') as string | null) ?? '';

    if (!file) {
      return NextResponse.json(
        { success: false, data: null, error: 'Không tìm thấy file trong request' },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, data: null, error: 'File quá lớn. Giới hạn 20MB' },
        { status: 400 },
      );
    }

    // Detect format: override → MIME → extension
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const detectedFormat = ALLOWED_MIME[file.type] ?? ALLOWED_EXT[ext];
    const format = (formatOverride as 'DOCX' | 'XLSX' | 'HTML' | null) ?? detectedFormat;

    if (!format || !['DOCX', 'XLSX', 'HTML'].includes(format)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Định dạng file không được hỗ trợ. Chấp nhận: .docx, .xlsx, .html',
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadTemplateFile(
      params.id,
      buffer,
      file.name,
      format,
      changeNote,
      user.id,
    );

    await logAudit({
      userId: user.id,
      functionCode: TEMPLATES.MANAGE,
      action: 'UPLOAD',
      resourceType: 'REPORT_TEMPLATE',
      resourceId: params.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      error: null,
      data: {
        fileKey: result.versionRow.fileKey,
        version: result.template.version,
        placeholders: result.placeholders,
        placeholderParseReliable: result.placeholderParseReliable,
        placeholderNote: result.placeholderNote,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi upload file';
    console.error('[POST /api/templates/[id]/upload]', error);
    if (msg.includes('không tồn tại')) {
      return NextResponse.json({ success: false, data: null, error: msg }, { status: 404 });
    }
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
