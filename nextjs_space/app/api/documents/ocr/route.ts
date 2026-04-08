/**
 * API: Document OCR – Nhận dạng văn bản (OCR)
 * Path: POST /api/documents/ocr
 * Extracts text from uploaded document using Abacus AI or simulated OCR.
 * Saves extracted text back to the document's keywords/description for searchability.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DIGITAL_DOCS } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import prisma from '@/lib/db';

async function callOCRService(fileUrl: string, mimeType: string): Promise<string> {
  // Try Abacus AI API if configured
  const abacusKey = process.env.ABACUS_API_KEY || process.env.OPENAI_API_KEY;
  if (abacusKey && fileUrl.startsWith('http')) {
    try {
      const resp = await fetch('https://api.abacus.ai/api/v0/describeImage', {
        method: 'POST',
        headers: {
          'apiKey': abacusKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: fileUrl,
          prompt: 'Extract all text from this document image. Return only the extracted text, preserving structure.',
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.result || data.text || data.description || '';
      }
    } catch { /* fall through to simulation */ }
  }

  // Simulation mode – return placeholder with document metadata
  return `[OCR - Mô phỏng] Văn bản được nhận dạng tự động.\n` +
         `Loại file: ${mimeType}\n` +
         `Thời gian xử lý: ${new Date().toISOString()}\n` +
         `Ghi chú: Để sử dụng OCR thật, cần cấu hình ABACUS_API_KEY trong biến môi trường.`;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, DIGITAL_DOCS.OCR);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;

    const body = await request.json();
    const { documentId, fileUrl } = body;

    if (!documentId) return NextResponse.json({ error: 'documentId là bắt buộc' }, { status: 400 });

    const doc = await prisma.researchFile.findUnique({
      where: { id: documentId },
      select: { id: true, fileName: true, mimeType: true, fileUrl: true, title: true },
    });

    if (!doc) return NextResponse.json({ error: 'Không tìm thấy văn bản' }, { status: 404 });

    const targetUrl = fileUrl || doc.fileUrl || '';
    const extractedText = await callOCRService(targetUrl, doc.mimeType);

    // Save OCR text as keywords for full-text search
    const words = extractedText
      .replace(/[\[\](){}.,;:!?]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && w.length < 50)
      .slice(0, 100); // top 100 tokens

    await prisma.researchFile.update({
      where: { id: documentId },
      data: {
        keywords: { set: [...new Set(words)] },
        description: doc.title
          ? `${doc.title}\n\n[OCR] ${extractedText.slice(0, 500)}`
          : `[OCR] ${extractedText.slice(0, 500)}`,
      },
    });

    await logAudit({
      userId: user.id,
      functionCode: DIGITAL_DOCS.OCR,
      action: 'ANALYZE',
      resourceType: 'DIGITAL_DOCUMENT',
      resourceId: documentId,
      result: 'SUCCESS',
      metadata: { textLength: extractedText.length, wordsIndexed: words.length },
    });

    return NextResponse.json({
      documentId,
      extractedText: extractedText.slice(0, 2000),
      wordsIndexed: words.length,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[OCR POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
