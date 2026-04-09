/**
 * Export Engine Service – M18
 * Render template + tạo file DOCX/XLSX/PDF và upload MinIO
 */

import prisma from '@/lib/db';
import { uploadFileToMinio, getPresignedUrl, downloadFileFromMinio } from '@/lib/minio-client';
import { resolveEntityData, EntityType, getMissingFields } from './data-resolver-service';
import { TEMPLATE_BUCKET } from './template-service';
import ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import puppeteer from 'puppeteer';

const EXPORT_URL_TTL = 86400; // 24h

export interface ExportRequest {
  templateId: string;
  entityId: string;
  entityType: EntityType;
  outputFormat: 'PDF' | 'DOCX' | 'XLSX';
  requestedBy: string;
  callerType?: string;
}

export interface BatchExportRequest {
  templateId: string;
  entityIds: string[];
  entityType: EntityType;
  outputFormat: 'PDF' | 'DOCX' | 'XLSX';
  requestedBy: string;
  callerType?: string;
  zipName?: string;
}

/**
 * Xuất file đơn lẻ (sync)
 * Returns signed URL để download
 */
export async function exportSingle(req: ExportRequest): Promise<{
  jobId: string;
  downloadUrl: string;
  expiresIn: number;
}> {
  // Create job record
  const job = await prisma.exportJob.create({
    data: {
      templateId: req.templateId,
      templateVersion: 1,
      requestedBy: req.requestedBy,
      entityIds: [req.entityId],
      entityType: req.entityType,
      outputFormat: req.outputFormat,
      status: 'PROCESSING',
      progress: 0,
      callerType: req.callerType || 'user',
    },
  });

  try {
    // Get template
    const template = await prisma.reportTemplate.findUnique({
      where: { id: req.templateId },
    });
    if (!template) throw new Error('Template không tồn tại');
    if (!template.isActive) throw new Error('Template đã bị vô hiệu hóa');

    // Resolve data
    const dataMap = (template.dataMap as Record<string, unknown>) || {};
    const resolvedData = await resolveEntityData({
      entityId: req.entityId,
      entityType: req.entityType,
      dataMap,
      requestedBy: req.requestedBy,
    });

    // Render file
    const { buffer, ext, contentType } = await renderFile(
      template,
      resolvedData,
      req.outputFormat
    );

    // Upload to MinIO
    const outputKey = `exports/${job.id}/output.${ext}`;
    await uploadFileToMinio(TEMPLATE_BUCKET, outputKey, buffer, {
      'Content-Type': contentType,
      jobId: job.id,
    });

    // Generate signed URL (24h)
    const signedUrl = await getPresignedUrl(TEMPLATE_BUCKET, outputKey, EXPORT_URL_TTL);
    const urlExpiresAt = new Date(Date.now() + EXPORT_URL_TTL * 1000);

    // Update job as COMPLETED
    await prisma.exportJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        progress: 100,
        successCount: 1,
        outputKey,
        signedUrl,
        urlExpiresAt,
        completedAt: new Date(),
      },
    });

    return { jobId: job.id, downloadUrl: signedUrl, expiresIn: EXPORT_URL_TTL };
  } catch (error) {
    await prisma.exportJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        errors: [{ entityId: req.entityId, reason: String(error) }],
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

/**
 * Khởi động batch export job (async)
 * Tạo job record, đẩy vào BullMQ queue để worker xử lý.
 */
export async function startBatchExport(req: BatchExportRequest): Promise<{
  jobId: string;
  queuePosition: number;
  estimatedTime: number;
}> {
  if (req.entityIds.length > 500) {
    throw new Error('Số lượng entity không được vượt quá 500');
  }

  const template = await prisma.reportTemplate.findUnique({
    where: { id: req.templateId },
  });
  if (!template) throw new Error('Template không tồn tại');
  if (!template.isActive) throw new Error('Template đã bị vô hiệu hóa');

  const job = await prisma.exportJob.create({
    data: {
      templateId: req.templateId,
      templateVersion: template.version,
      requestedBy: req.requestedBy,
      entityIds: req.entityIds,
      entityType: req.entityType,
      outputFormat: req.outputFormat,
      status: 'PENDING',
      progress: 0,
      callerType: req.callerType || 'user',
    },
  });

  // Enqueue vào BullMQ — worker sẽ pick up và xử lý
  const { enqueueBatchExport, getQueueDepth } = await import('@/lib/queue/export-queue');
  await enqueueBatchExport({ exportJobId: job.id, request: req });
  const queuePosition = await getQueueDepth();

  return {
    jobId: job.id,
    queuePosition,
    estimatedTime: req.entityIds.length * 2, // ~2s per entity estimate
  };
}


/**
 * Render file dựa theo format
 * Exported để internal render service có thể dùng trực tiếp mà không qua exportSingle.
 *
 * DOCX: dùng docxtemplater — yêu cầu template.fileKey trỏ tới file .docx trong MinIO
 *       có chứa {placeholder} tags đúng docxtemplater syntax.
 * XLSX: dùng ExcelJS — tạo workbook từ resolvedData (không cần template file).
 * PDF:  dùng Puppeteer — render HTML → PDF. Không cần template file.
 */
export async function renderFile(
  template: { name: string; dataMap: unknown; fileKey: string | null },
  resolvedData: Record<string, unknown>,
  outputFormat: string,
): Promise<{ buffer: Buffer; ext: string; contentType: string }> {
  if (outputFormat === 'XLSX') {
    return renderXLSX(template.name, resolvedData);
  }

  if (outputFormat === 'DOCX' && template.fileKey) {
    const isDocxFile = template.fileKey.toLowerCase().endsWith('.docx');
    if (isDocxFile) {
      return renderDocx(template.fileKey, resolvedData);
    }
  }

  if (outputFormat === 'PDF') {
    const { buffer: htmlBuffer } = await renderTextDocument(template.name, resolvedData, 'HTML');
    const pdfBuffer = await renderPDF(htmlBuffer.toString('utf8'));
    return { buffer: pdfBuffer, ext: 'pdf', contentType: 'application/pdf' };
  }

  // DOCX không có file template → HTML fallback
  return renderTextDocument(template.name, resolvedData, outputFormat);
}

/**
 * Render HTML → PDF bằng Puppeteer.
 *
 * Browser singleton: launch một lần, tái sử dụng cho các lần render tiếp theo.
 * Nếu browser crash, tự restart lần tiếp theo.
 *
 * Flags --no-sandbox dùng cho môi trường Linux server (Docker/VPS).
 */

let _browser: import('puppeteer').Browser | null = null;

async function getBrowser(): Promise<import('puppeteer').Browser> {
  if (_browser) {
    try {
      // Kiểm tra browser còn sống không
      const pages = await _browser.pages();
      if (pages !== undefined) return _browser;
    } catch {
      _browser = null;
    }
  }
  _browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // tránh crash trong môi trường RAM thấp
      '--disable-gpu',
    ],
  });
  _browser.on('disconnected', () => {
    _browser = null;
  });
  return _browser;
}

async function renderPDF(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
    });
    return Buffer.from(pdfUint8Array);
  } finally {
    await page.close();
  }
}

/**
 * Render DOCX bằng docxtemplater.
 *
 * Quy trình:
 *   1. Download template .docx từ MinIO
 *   2. PizZip giải nén ZIP của DOCX
 *   3. Docxtemplater thay thế {placeholder} bằng resolvedData
 *   4. Trả buffer DOCX đã render
 *
 * Array fields: resolvedData có thể chứa array (vd. congTac_list).
 * Template cần dùng docxtemplater loop syntax: {#congTac_list}{tuNgay} ... {/congTac_list}
 */
async function renderDocx(
  templateFileKey: string,
  resolvedData: Record<string, unknown>,
): Promise<{ buffer: Buffer; ext: string; contentType: string }> {
  const templateBuffer = await downloadFileFromMinio(TEMPLATE_BUCKET, templateFileKey);

  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    // Trả lỗi rõ nếu placeholder không có trong data — giúp debug
    errorLogging: false,
  });

  // Flatten array keys: docxtemplater dùng đúng tên key từ resolvedData
  doc.render(resolvedData);

  const outputBuffer = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  return {
    buffer: Buffer.from(outputBuffer),
    ext: 'docx',
    contentType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
}

/**
 * Render XLSX sử dụng ExcelJS
 */
async function renderXLSX(
  templateName: string,
  data: Record<string, unknown>
): Promise<{ buffer: Buffer; ext: string; contentType: string }> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HVHC BigData M18';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(templateName.slice(0, 31));

  // Header row
  sheet.addRow(['Trường dữ liệu', 'Giá trị']);
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E4D8C' },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Data rows
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      sheet.addRow([key, `[${(value as unknown[]).length} items]`]);
    } else {
      sheet.addRow([key, String(value ?? '')]);
    }
  }

  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 60;

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return {
    buffer,
    ext: 'xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

/**
 * Render text document (fallback khi không có docxtemplater)
 */
async function renderTextDocument(
  templateName: string,
  data: Record<string, unknown>,
  format: string
): Promise<{ buffer: Buffer; ext: string; contentType: string }> {
  // Generate HTML representation
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>${templateName}</title>
<style>
  body { font-family: 'Times New Roman', serif; margin: 40px; color: #000; }
  h1 { text-align: center; font-size: 16pt; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th, td { border: 1px solid #333; padding: 6px 10px; }
  th { background: #f0f0f0; font-weight: bold; }
  .label { font-weight: bold; width: 35%; }
</style>
</head>
<body>
<h1>${templateName}</h1>
<table>
<tr><th>Trường</th><th>Giá trị</th></tr>
${Object.entries(data)
  .filter(([, v]) => !Array.isArray(v))
  .map(([k, v]) => `<tr><td class="label">${k}</td><td>${String(v ?? '')}</td></tr>`)
  .join('\n')}
</table>
${Object.entries(data)
  .filter(([, v]) => Array.isArray(v) && (v as unknown[]).length > 0)
  .map(
    ([k, v]) => `
<h3>${k}</h3>
<table>
<tr>${Object.keys((v as Record<string, unknown>[])[0] || {})
  .map((h) => `<th>${h}</th>`)
  .join('')}</tr>
${(v as Record<string, unknown>[])
  .map(
    (row) => `<tr>${Object.values(row)
      .map((cell) => `<td>${String(cell ?? '')}</td>`)
      .join('')}</tr>`
  )
  .join('\n')}
</table>`
  )
  .join('\n')}
</body>
</html>`;

  const buffer = Buffer.from(html, 'utf8');
  const ext = format === 'PDF' ? 'html' : 'html'; // PDF requires puppeteer
  return {
    buffer,
    ext,
    contentType: 'text/html; charset=utf-8',
  };
}

/**
 * Lấy job status
 */
export async function getJobStatus(jobId: string, requestedBy: string) {
  const job = await prisma.exportJob.findFirst({
    where: { id: jobId, requestedBy },
  });
  if (!job) throw new Error('Export job không tồn tại hoặc không có quyền truy cập');

  // Renew signed URL nếu sắp hết hạn
  if (job.outputKey && job.status === 'COMPLETED') {
    const now = new Date();
    const expiresAt = job.urlExpiresAt;
    if (!expiresAt || expiresAt.getTime() - now.getTime() < 3600000) {
      const newUrl = await getPresignedUrl(TEMPLATE_BUCKET, job.outputKey, EXPORT_URL_TTL);
      const newExpiry = new Date(Date.now() + EXPORT_URL_TTL * 1000);
      await prisma.exportJob.update({
        where: { id: jobId },
        data: { signedUrl: newUrl, urlExpiresAt: newExpiry },
      });
      return { ...job, signedUrl: newUrl, urlExpiresAt: newExpiry };
    }
  }

  return job;
}
