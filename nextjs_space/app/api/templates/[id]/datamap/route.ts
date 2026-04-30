/**
 * M18 Template API – B1: GET datamap, B2: PUT save datamap
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import prisma from '@/lib/db';
import { parsePlaceholders as parsePlaceholdersFromFile } from '@/lib/integrations/render/placeholder-parser';
import { downloadObject } from '@/lib/services/infrastructure/storage.service';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.VIEW);
    if (!user) return response!;

    const template = await prisma.reportTemplate.findUnique({ where: { id: params.id } });
    if (!template) return NextResponse.json({ error: 'Template không tồn tại' }, { status: 404 });

    let placeholders: string[] = [];
    // Parse placeholders từ file nếu có
    if (template.fileKey) {
      try {
        const buffer = await downloadObject('M18_TEMPLATE', template.fileKey);
        const format = template.fileKey.includes('.xlsx') ? 'XLSX' : template.fileKey.includes('.html') ? 'HTML' : 'DOCX';
        const parseResult = await parsePlaceholdersFromFile(buffer, format);
        placeholders = parseResult.placeholders;
      } catch {
        // File chưa tồn tại trong MinIO hoặc lỗi download — trả placeholder rỗng
      }
    }

    const dataMap = (template.dataMap as Record<string, unknown>) || {};
    const mappedKeys = Object.keys(dataMap);
    const unmapped = placeholders.filter((p) => {
      const key = p.replace(/[{}]/g, '');
      return !mappedKeys.includes(key);
    });

    return NextResponse.json({
      success: true,
      data: {
        dataMap,
        placeholders,
        unmappedPlaceholders: unmapped,
        version: template.version,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, data: null, error: 'Lỗi lấy data map' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.MANAGE);
    if (!user) return response!;

    const { dataMap } = await request.json();
    if (!dataMap || typeof dataMap !== 'object') {
      return NextResponse.json({ error: 'dataMap không hợp lệ' }, { status: 400 });
    }

    const template = await prisma.reportTemplate.findUnique({ where: { id: params.id } });
    if (!template) return NextResponse.json({ error: 'Template không tồn tại' }, { status: 404 });

    // Validate mappings
    const warnings: string[] = [];
    const errors: string[] = [];

    // Simple validation: check field paths are non-empty strings
    for (const [key, value] of Object.entries(dataMap)) {
      if (typeof value === 'object' && value !== null) {
        const mapping = value as Record<string, unknown>;
        if (!mapping.apiPath && !mapping.field) {
          warnings.push(`Placeholder {${key}} chưa có ánh xạ field`);
        }
      }
    }

    await prisma.reportTemplate.update({
      where: { id: params.id },
      data: {
        dataMap,
        version: template.version + 1,
      },
    });

    await logAudit({
      userId: user.id,
      functionCode: TEMPLATES.MANAGE,
      action: 'UPDATE_DATAMAP',
      resourceType: 'REPORT_TEMPLATE',
      resourceId: params.id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      validated: true,
      warnings,
      errors,
    });
  } catch (error) {
    return NextResponse.json({ success: false, data: null, error: 'Lỗi lưu data map' }, { status: 500 });
  }
}
