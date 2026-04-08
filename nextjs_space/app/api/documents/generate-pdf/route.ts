/**
 * API: Generate PDF from HTML
 * POST /api/documents/generate-pdf
 * Sử dụng Abacus AI HTML2PDF API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { html_content, pdf_options, css_stylesheet, filename } = await request.json();

    if (!html_content) {
      return NextResponse.json({ success: false, error: 'Missing html_content' }, { status: 400 });
    }

    // Step 1: Create PDF request
    const createResponse = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        html_content: html_content,
        pdf_options: pdf_options || {
          format: 'A4',
          margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '25mm' },
          print_background: true,
        },
        base_url: process.env.NEXTAUTH_URL || '',
        css_stylesheet: css_stylesheet,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json().catch(() => ({ error: 'Failed to create PDF request' }));
      return NextResponse.json({ success: false, error: error.error }, { status: 500 });
    }

    const { request_id } = await createResponse.json();
    if (!request_id) {
      return NextResponse.json({ success: false, error: 'No request ID returned' }, { status: 500 });
    }

    // Step 2: Poll for status
    const maxAttempts = 120; // 2 minutes
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch('https://apps.abacus.ai/api/getConvertHtmlToPdfStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id, deployment_token: process.env.ABACUSAI_API_KEY }),
      });

      const statusResult = await statusResponse.json();
      const status = statusResult?.status || 'FAILED';
      const result = statusResult?.result || null;

      if (status === 'SUCCESS') {
        if (result && result.result) {
          const pdfBuffer = Buffer.from(result.result, 'base64');
          const safeFilename = filename || 'document.pdf';
          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${safeFilename}"`,
            },
          });
        }
        return NextResponse.json({ success: false, error: 'No result data' }, { status: 500 });
      } else if (status === 'FAILED') {
        return NextResponse.json({ success: false, error: result?.error || 'PDF generation failed' }, { status: 500 });
      }
      attempts++;
    }

    return NextResponse.json({ success: false, error: 'Timeout' }, { status: 500 });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
