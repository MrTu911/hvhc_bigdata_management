/**
 * API: Export 2A-LLDV – Xuất lý lịch quân nhân dạng 2A
 * Path: /api/personnel/export-2a?personnelId=xxx        (ưu tiên)
 *       /api/personnel/export-2a?userId=xxx             (legacy, map qua tài khoản)
 *
 * Nguồn dữ liệu: model Personnel (backbone M02). Toàn bộ dựng tài liệu nằm ở
 * lib/export/server/personnel-2a-document.ts — route chỉ parse input, RBAC, audit, chọn format.
 *
 * format=html (mặc định): trả HTML preview
 * format=pdf            : trả file PDF (A4) render bằng puppeteer
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import {
  loadPersonnel2aData,
  resolvePersonnelIdFromUserId,
  buildPersonnel2aHtml,
  buildPersonnel2aPdf,
} from '@/lib/export/server/personnel-2a-document';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.EXPORT);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'html';

    // Ưu tiên personnelId; giữ tương thích userId cũ bằng cách map qua tài khoản
    let personnelId = searchParams.get('personnelId');
    const userId = searchParams.get('userId');
    if (!personnelId && userId) {
      personnelId = await resolvePersonnelIdFromUserId(userId);
    }
    if (!personnelId) {
      return NextResponse.json({ error: 'Thiếu personnelId hoặc userId hợp lệ' }, { status: 400 });
    }

    const data = await loadPersonnel2aData(personnelId);
    if (!data) {
      return NextResponse.json({ error: 'Không tìm thấy cán bộ' }, { status: 404 });
    }

    const html = buildPersonnel2aHtml(data);

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.EXPORT,
      action: 'EXPORT',
      resourceType: 'PERSONNEL',
      resourceId: personnelId,
      result: 'SUCCESS',
      metadata: { format: `2A-LLDV/${format}`, targetName: data.fullName },
    });

    if (format === 'pdf') {
      try {
        const pdf = await buildPersonnel2aPdf(html);
        return new NextResponse(new Uint8Array(pdf), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="2A_LLDV_${data.militaryIdNumber || personnelId}.pdf"`,
          },
        });
      } catch (pdfError) {
        // Fallback: môi trường không có Chromium → trả HTML thay vì vỡ route
        console.error('[Export 2A-LLDV] PDF render failed, fallback to HTML:', pdfError);
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Pdf-Fallback': 'true',
          },
        });
      }
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="2A_LLDV_${data.militaryIdNumber || personnelId}.html"`,
      },
    });
  } catch (error) {
    console.error('[Export 2A-LLDV GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
