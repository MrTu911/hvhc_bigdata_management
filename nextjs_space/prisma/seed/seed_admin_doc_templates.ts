/**
 * Seed — Mẫu văn bản hành chính (Nghị định 30/2020/NĐ-CP) cho M18.
 *
 * Với mỗi spec trong manifest:
 *   1. Sinh buffer .docx (docx-builder) + chuỗi .html (html-builder).
 *   2. Upload 2 file lên MinIO bucket M18_TEMPLATE (key cố định, ghi đè khi re-run).
 *   3. Upsert ReportTemplate theo {code, version:1} — idempotent.
 *      fileKey = key .docx; dataMap.__htmlKey = key .html (để engine render PDF/HTML).
 *
 * Lưu ý: seed là script CLI nên KHÔNG đi qua storage.service (module đó import
 * '@/lib/db' kéo theo 'server-only', vốn throw ngoài runtime Next.js). Ở đây dùng
 * MinIO client trực tiếp với cùng bucket/env. Bucket resolve theo storage_bucket_configs
 * (giống storage.service) để khớp với lúc app đọc file khi render.
 *
 * MinIO không sẵn (dev) → bỏ qua upload, vẫn upsert metadata (fileKey null) để
 * không hard-fail; render sẽ rơi về fallback bảng key/value.
 *
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_admin_doc_templates.ts
 */

import { PrismaClient, Prisma } from '@prisma/client';
import * as Minio from 'minio';
import { buildDocx } from './templates/admin-docs/docx-builder';
import { buildHtml } from './templates/admin-docs/html-builder';
import { TEMPLATE_SPECS } from './templates/admin-docs/manifest';
import type { TemplateSpec } from './templates/admin-docs/types';

const prisma = new PrismaClient();

const TEMPLATE_BUCKET_FALLBACK = 'hvhc-templates';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const HTML_MIME = 'text/html; charset=utf-8';

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
  port: parseInt(process.env.MINIO_PORT ?? '19000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY ?? '',
  secretKey: process.env.MINIO_SECRET_KEY ?? '',
});

/** Key cố định trong bucket templates để re-run ghi đè đúng object. */
const docxKey = (code: string) => `admin-docs/${code}.docx`;
const htmlKey = (code: string) => `admin-docs/${code}.html`;

/** Resolve bucket theo cấu hình (giống storage.service) để khớp khi app đọc file. */
async function resolveTemplateBucket(): Promise<string> {
  try {
    const cfg = await prisma.storageBucketConfig.findFirst({
      where: { moduleDomain: 'M18_TEMPLATE', isActive: true },
      select: { bucketName: true },
    });
    return cfg?.bucketName ?? TEMPLATE_BUCKET_FALLBACK;
  } catch {
    return TEMPLATE_BUCKET_FALLBACK;
  }
}

/** Upload an toàn: trả true nếu thành công, false nếu MinIO lỗi (không throw). */
async function tryUpload(
  bucket: string,
  key: string,
  buffer: Buffer,
  spec: TemplateSpec,
  contentType: string,
  createdBy: string,
): Promise<boolean> {
  try {
    await minioClient.putObject(bucket, key, buffer, buffer.length, {
      module: 'M18',
      'entity-type': 'template',
      'entity-id': spec.code,
      'uploaded-by': createdBy,
      classification: spec.classification,
      'content-type': contentType,
    });
    return true;
  } catch (err) {
    console.warn(`   ⚠ Upload thất bại (${key}): ${(err as Error).message}`);
    return false;
  }
}

async function resolveCreatedBy(): Promise<string> {
  const admin = await prisma.user.findFirst({
    where: { userPositions: { some: { position: { code: 'SYSTEM_ADMIN' } } } },
    select: { id: true },
  });
  const createdBy = admin?.id ?? (await prisma.user.findFirst({ select: { id: true } }))?.id;
  if (!createdBy) throw new Error('Không tìm thấy user nào để gán createdBy');
  return createdBy;
}

async function seedSpec(spec: TemplateSpec, bucket: string, createdBy: string): Promise<void> {
  const docxBuffer = buildDocx(spec);
  const htmlBuffer = Buffer.from(buildHtml(spec), 'utf8');

  const dKey = docxKey(spec.code);
  const hKey = htmlKey(spec.code);

  const docxUploaded = await tryUpload(bucket, dKey, docxBuffer, spec, DOCX_MIME, createdBy);
  const htmlUploaded = await tryUpload(bucket, hKey, htmlBuffer, spec, HTML_MIME, createdBy);

  // fileKey chỉ set khi upload .docx thành công; __htmlKey khi upload .html thành công.
  const fileKey = docxUploaded ? dKey : null;
  const dataMapObj: Record<string, unknown> = { ...(spec.dataMap ?? {}) };
  if (htmlUploaded) dataMapObj.__htmlKey = hKey;
  const dataMap = dataMapObj as Prisma.InputJsonValue;

  const outputFormats = ['DOCX', 'PDF', 'HTML'];

  await prisma.reportTemplate.upsert({
    where: { code_version: { code: spec.code, version: 1 } },
    create: {
      code: spec.code,
      version: 1,
      createdBy,
      name: spec.name,
      description: spec.description,
      category: spec.category,
      moduleSource: spec.moduleSource,
      outputFormats,
      rbacCode: spec.rbacCode,
      fileKey,
      dataMap,
      placeholders: spec.placeholders,
      isActive: true,
      isLatest: true,
    },
    update: {
      name: spec.name,
      description: spec.description,
      category: spec.category,
      moduleSource: spec.moduleSource,
      outputFormats,
      rbacCode: spec.rbacCode,
      fileKey,
      dataMap,
      placeholders: spec.placeholders,
      isActive: true,
      isLatest: true,
    },
  });

  const fileNote =
    docxUploaded && htmlUploaded ? 'docx+html' : docxUploaded ? 'docx' : htmlUploaded ? 'html' : 'metadata-only';
  console.log(`   ✓ ${spec.code} [${spec.module}/${spec.docType}] (${fileNote})`);
}

async function main() {
  console.log('📄 Seeding mẫu văn bản hành chính (Nghị định 30/2020)...\n');
  const createdBy = await resolveCreatedBy();
  const bucket = await resolveTemplateBucket();

  // Đảm bảo bucket tồn tại (bỏ qua nếu MinIO không sẵn).
  try {
    if (!(await minioClient.bucketExists(bucket))) {
      await minioClient.makeBucket(bucket, 'us-east-1');
    }
  } catch (err) {
    console.warn(`⚠ Không kết nối được MinIO (${(err as Error).message}). Sẽ chỉ upsert metadata.`);
  }

  for (const spec of TEMPLATE_SPECS) {
    await seedSpec(spec, bucket, createdBy);
  }

  console.log(`\n✅ Hoàn thành. Đã upsert ${TEMPLATE_SPECS.length} mẫu văn bản.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
