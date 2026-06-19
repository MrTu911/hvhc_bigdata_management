/**
 * Test render template hồ sơ cán bộ điện tử: builder + spec phải nội nhất quán —
 * HTML và DOCX render với dữ liệu mẫu KHÔNG còn placeholder thừa, và mọi nhóm
 * scalar (kvTable) + danh sách (loop) đều hiện.
 */
import { describe, it, expect } from 'vitest';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { buildHtml } from '../../../../prisma/seed/templates/admin-docs/html-builder';
import { buildDocx } from '../../../../prisma/seed/templates/admin-docs/docx-builder';
import { M02_HSCB_SPECS } from '../../../../prisma/seed/templates/admin-docs/specs/m02-hscb';
import { renderHtmlTemplate } from '@/lib/integrations/render/html-renderer';

const spec = M02_HSCB_SPECS[0];

/** Dựng dữ liệu mẫu: mọi scalar = 'X'; mỗi loop 1 dòng đủ các cột. */
function sampleData(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const ph of spec.placeholders) {
    if (ph.startsWith('{#')) continue;
    data[ph.replace(/[{}]/g, '')] = 'X';
  }
  for (const sec of spec.body) {
    if (!sec.loop) continue;
    const item: Record<string, unknown> = {};
    for (const col of sec.loop.columns) item[col.field] = 'Y';
    data[sec.loop.key] = [item, { ...item }];
  }
  return data;
}

describe('template TPL_M02_HSCB_DIENTU', () => {
  it('HTML render không còn placeholder thừa', () => {
    const out = renderHtmlTemplate(buildHtml(spec), sampleData());
    const leftover = out.match(/\{[a-zA-Z_][a-zA-Z0-9_.]*\}/g) || [];
    expect([...new Set(leftover)]).toEqual([]);
  });

  it('DOCX render được, không còn tag {placeholder}', () => {
    const buf = buildDocx(spec);
    const doc = new Docxtemplater(new PizZip(buf), { paragraphLoop: true, linebreaks: true });
    doc.render(sampleData());
    const xml = new PizZip(doc.getZip().generate({ type: 'nodebuffer' })).file('word/document.xml')!.asText();
    expect(/\{[a-zA-Z#/]/.test(xml)).toBe(false);
  });

  it('có đủ 18 bảng lặp + tiêu đề khối ký', () => {
    const out = renderHtmlTemplate(buildHtml(spec), sampleData());
    const loopCount = spec.body.filter((b) => b.loop).length;
    expect(loopCount).toBe(18);
    expect(out).toContain('NGƯỜI BỔ SUNG');
    expect(out).toContain('KT. VIỆN TRƯỞNG');
    expect(out).toContain('PHIẾU CẬP NHẬT THÔNG TIN HỒ SƠ CÁN BỘ ĐIỆN TỬ');
  });
});
