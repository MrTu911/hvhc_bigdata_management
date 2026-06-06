/* Throwaway: sinh DOCX+PDF thật qua đúng pipeline preview của M18. Xoá sau khi dùng. */
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { resolveEntityData, type EntityType } from '../lib/services/data-resolver-service';
import { renderFile } from '../lib/services/export-engine-service';

const prisma = new PrismaClient();
const OUT = '/tmp/preview';

async function gen(code: string, entityType: EntityType, getEntityId: () => Promise<string | null>) {
  const tpl = await prisma.reportTemplate.findFirst({
    where: { code, isLatest: true, parentId: null },
    select: { name: true, dataMap: true, fileKey: true },
  });
  if (!tpl) { console.log(`❌ ${code}: không tìm thấy template`); return; }
  const entityId = await getEntityId();
  if (!entityId) { console.log(`❌ ${code}: không có entity ${entityType}`); return; }

  const resolved = await resolveEntityData({
    entityId, entityType, dataMap: (tpl.dataMap as Record<string, unknown>) || {}, requestedBy: 'preview-verify',
  });
  const tplArg = { name: tpl.name, dataMap: tpl.dataMap, fileKey: tpl.fileKey };

  const docx = await renderFile(tplArg, resolved, 'DOCX');
  fs.writeFileSync(`${OUT}_${code}.docx`, docx.buffer);
  const pdf = await renderFile(tplArg, resolved, 'PDF');
  fs.writeFileSync(`${OUT}_${code}.pdf`, pdf.buffer);

  const isPdf = pdf.buffer.subarray(0, 5).toString() === '%PDF-';
  console.log(`✅ ${code} (${entityType}/${entityId.slice(0,8)}…) → docx ${docx.buffer.length}B, pdf ${pdf.buffer.length}B, valid=${isPdf}`);
}

async function safeGen(...args: Parameters<typeof gen>) {
  try { await gen(...args); } catch (e) { console.log(`❌ ${args[0]}: ${(e as Error).message.split('\n')[0]}`); }
}

(async () => {
  fs.mkdirSync('/tmp', { recursive: true });
  await safeGen('TPL_M02_BC_TONGKET', 'personnel', async () => (await prisma.personnel.findFirst({ select: { id: true } }))?.id ?? null);
  await safeGen('TPL_M02_BC_CANHAN', 'personnel', async () => {
    // ưu tiên cán bộ có quá trình công tác để thấy bảng lặp
    const withHist = await prisma.personnel.findFirst({ where: { account: { workExperience: { some: {} } } }, select: { id: true } });
    return (withHist ?? (await prisma.personnel.findFirst({ select: { id: true } })))?.id ?? null;
  });
  await safeGen('TPL_M25_BC_HOSO_NHAKH', 'scientist_profile', async () => (await prisma.nckhScientistProfile.findFirst({ select: { id: true } }))?.id ?? null);
  await prisma.$disconnect();
})().catch((e) => { console.error('GEN FAIL:', e); process.exit(1); });
