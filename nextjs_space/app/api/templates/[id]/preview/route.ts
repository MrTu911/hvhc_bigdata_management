/**
 * M18 Template API – B3: POST preview template with real data
 *
 * Preview dùng CHÍNH render engine của export (renderFile) để "what-you-preview =
 * what-you-export": nếu template có file .docx → render qua docxtemplater theo file mẫu;
 * PDF/XLSX/HTML render từ dữ liệu đã resolve. File preview ghi vào domain M18_EXPORT
 * (storageService) với TTL ngắn — không dùng bucket/minio-client deprecated nữa.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { resolveEntityData, EntityType } from '@/lib/services/data-resolver-service';
import { renderFile } from '@/lib/services/export-engine-service';
import { uploadObject, getPresignedDownloadUrl } from '@/lib/services/infrastructure/storage.service';
import { v4 as uuidv4 } from 'uuid';

const PREVIEW_URL_TTL = 300; // 5 phút
const ALLOWED_FORMATS = ['PDF', 'DOCX', 'XLSX', 'HTML'] as const;

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.VIEW);
    if (!user) return response!;

    const { entityId, entityType, outputFormat = 'PDF' } = await request.json();
    if (!entityId || !entityType) {
      return NextResponse.json({ error: 'entityId và entityType là bắt buộc' }, { status: 400 });
    }

    const format = String(outputFormat).toUpperCase();
    if (!ALLOWED_FORMATS.includes(format as (typeof ALLOWED_FORMATS)[number])) {
      return NextResponse.json({ error: 'Định dạng preview không hợp lệ' }, { status: 400 });
    }

    const template = await prisma.reportTemplate.findUnique({ where: { id: params.id } });
    if (!template) return NextResponse.json({ error: 'Template không tồn tại' }, { status: 404 });
    if (!template.isActive) return NextResponse.json({ error: 'Template đã bị vô hiệu hóa' }, { status: 400 });

    const dataMap = (template.dataMap as Record<string, unknown>) || {};
    const resolvedData = await resolveEntityData({
      entityId,
      entityType: entityType as EntityType,
      dataMap,
      requestedBy: user.id,
    });

    // Render đúng theo cách export sẽ làm (dùng file mẫu nếu là DOCX có file).
    const { buffer, ext, contentType } = await renderFile(
      { name: template.name, dataMap: template.dataMap, fileKey: template.fileKey },
      resolvedData,
      format,
    );

    const previewKey = `previews/${params.id}/${uuidv4()}.${ext}`;
    await uploadObject('M18_EXPORT', previewKey, buffer, {
      module:         'M18',
      'entity-type':  'template-preview',
      'entity-id':    params.id,
      'uploaded-by':  user.id,
      classification: 'INTERNAL',
      'content-type': contentType,
      templateId:     params.id,
    });

    const previewUrl = await getPresignedDownloadUrl('M18_EXPORT', previewKey, {
      expirySeconds: PREVIEW_URL_TTL,
    });

    return NextResponse.json({
      success: true,
      data: {
        previewUrl,
        format,
        usedTemplateFile: format === 'DOCX' && !!template.fileKey,
        expiresIn: PREVIEW_URL_TTL,
        resolvedFields: Object.keys(resolvedData).length,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi preview template';
    console.error('[POST /api/templates/[id]/preview]', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
