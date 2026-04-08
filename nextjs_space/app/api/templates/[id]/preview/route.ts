/**
 * M18 Template API – B3: POST preview template with real data
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { resolveEntityData, EntityType } from '@/lib/services/data-resolver-service';
import { uploadFileToMinio, getPresignedUrl } from '@/lib/minio-client';
import { TEMPLATE_BUCKET } from '@/lib/services/template-service';
import ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.VIEW);
    if (!user) return response!;

    const { entityId, entityType, outputFormat = 'HTML' } = await request.json();
    if (!entityId || !entityType) {
      return NextResponse.json({ error: 'entityId và entityType là bắt buộc' }, { status: 400 });
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

    // Render preview as HTML
    const html = buildPreviewHTML(template.name, resolvedData);
    const previewKey = `previews/${params.id}/${uuidv4()}.html`;
    await uploadFileToMinio(TEMPLATE_BUCKET, previewKey, Buffer.from(html, 'utf8'), {
      'Content-Type': 'text/html; charset=utf-8',
    });

    const previewUrl = await getPresignedUrl(TEMPLATE_BUCKET, previewKey, 60); // 60s TTL

    return NextResponse.json({
      success: true,
      data: { previewUrl, expiresIn: 60, resolvedFields: Object.keys(resolvedData).length },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Lỗi preview template';
    console.error('[POST /api/templates/[id]/preview]', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function buildPreviewHTML(templateName: string, data: Record<string, unknown>): string {
  const rows = Object.entries(data)
    .filter(([, v]) => !Array.isArray(v))
    .map(([k, v]) => `<tr><td class="key">${k}</td><td>${String(v ?? '')}</td></tr>`)
    .join('\n');

  const arrayTables = Object.entries(data)
    .filter(([, v]) => Array.isArray(v) && (v as unknown[]).length > 0)
    .map(([k, v]) => {
      const arr = v as Record<string, unknown>[];
      const headers = Object.keys(arr[0] || {});
      return `<h3>${k}</h3>
<table>
<thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>
${arr.map((row) => `<tr>${headers.map((h) => `<td>${String(row[h] ?? '')}</td>`).join('')}</tr>`).join('\n')}
</tbody>
</table>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Preview: ${templateName}</title>
<style>
  body{font-family:'Times New Roman',serif;margin:40px;color:#000;font-size:12pt}
  h1{text-align:center;font-size:14pt;text-transform:uppercase;border-bottom:2px solid #1e4d8c;padding-bottom:8px}
  h3{color:#1e4d8c;font-size:12pt;margin-top:24px}
  table{width:100%;border-collapse:collapse;margin:12px 0}
  th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}
  th{background:#1e4d8c;color:#fff;font-weight:bold}
  .key{font-weight:bold;background:#f5f5f5;width:35%}
  tr:nth-child(even) td:not(.key){background:#fafafa}
  .watermark{color:#ccc;font-size:9pt;text-align:center;margin-top:40px}
</style>
</head>
<body>
<h1>${templateName}</h1>
<h3>Dữ liệu hồ sơ</h3>
<table><tbody>${rows}</tbody></table>
${arrayTables}
<p class="watermark">Preview – HVHC BigData M18 Template Engine</p>
</body>
</html>`;
}
