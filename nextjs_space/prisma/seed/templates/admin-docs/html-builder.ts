/**
 * HTML builder cho mẫu văn bản hành chính (Nghị định 30/2020/NĐ-CP).
 *
 * Sinh chuỗi HTML đúng thể thức, dùng CHUNG quy ước placeholder với DOCX:
 *   - Scalar:   {fieldName}
 *   - Vòng lặp: {#listKey}...{fieldOfItem}...{/listKey}
 *
 * File HTML này được render bởi lib/integrations/render/html-renderer.ts khi
 * xuất PDF/HTML. CSS dùng dấu ngoặc nhọn có khoảng trắng nên không bị nhầm là
 * placeholder.
 */

import {
  DOC_TYPE_META,
  type BodySection,
  type LoopTable,
  type TemplateSpec,
} from './types';

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const STYLE = `
  @page { size: A4; margin: 20mm 20mm 20mm 30mm; }
  body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #000; }
  .header { width: 100%; border-collapse: collapse; }
  .header td { vertical-align: top; text-align: center; }
  .header td:first-child { width: 42%; }
  .header td:last-child { width: 58%; }
  .header .qh { font-size: 12pt; white-space: nowrap; }
  .header .uline { display: inline-block; border-bottom: 1px solid #000; padding-bottom: 2px; }
  .small-caps { text-transform: uppercase; }
  .bold { font-weight: bold; }
  .italic { font-style: italic; }
  .center { text-align: center; }
  .right { text-align: right; }
  .justify { text-align: justify; }
  .num-date { width: 100%; border-collapse: collapse; margin-top: 4px; }
  .num-date td { width: 50%; }
  .title { text-align: center; font-weight: bold; margin-top: 14px; }
  .title .name { font-size: 15pt; text-transform: uppercase; }
  .kinh-gui { font-weight: bold; margin: 10px 0; text-indent: 1cm; }
  .preamble { font-style: italic; text-align: justify; text-indent: 1cm; margin: 2px 0; }
  .qd-head { text-align: center; font-weight: bold; margin: 8px 0; }
  .section-heading { font-weight: bold; margin-top: 10px; }
  .para { text-align: justify; text-indent: 1cm; margin: 3px 0; }
  table.data { width: 100%; border-collapse: collapse; margin: 6px 0; }
  table.data th, table.data td { border: 1px solid #000; padding: 4px 6px; font-size: 13pt; }
  table.data th { text-align: center; font-weight: bold; }
  .footer { width: 100%; border-collapse: collapse; margin-top: 18px; }
  .footer td { vertical-align: top; }
  .footer .noi-nhan { width: 55%; font-size: 11pt; }
  .footer .sign { width: 45%; text-align: center; }
  .footer .noi-nhan .label { font-weight: bold; font-style: italic; }
  .sign-space { height: 60px; }
`;

function buildHeader(spec: TemplateSpec): string {
  const capTren = spec.headerCapTren ? esc(spec.headerCapTren) : '{tenCoQuanCapTren}';
  const banHanh = spec.headerBanHanh ? esc(spec.headerBanHanh) : '{tenCoQuanBanHanh}';
  return `<table class="header"><tr>
    <td>
      <div class="small-caps">${capTren}</div>
      <div class="bold small-caps"><span class="uline">${banHanh}</span></div>
    </td>
    <td>
      <div class="bold small-caps qh">{quocHieu}</div>
      <div class="bold"><span class="uline">{tieuNgu}</span></div>
    </td>
  </tr></table>`;
}

function buildNumberDate(spec: TemplateSpec): string {
  return `<table class="num-date"><tr>
    <td class="center">Số: {soVanBan}/${esc(spec.kyHieu)}</td>
    <td class="center italic">{diaDanhNgayThang}</td>
  </tr></table>`;
}

function buildTitle(spec: TemplateSpec): string {
  const meta = DOC_TYPE_META[spec.docType];
  const titleText = spec.titleOverride ?? meta.title;
  if (!titleText) {
    return `<div class="title">V/v ${esc(spec.trichYeu)}</div>`;
  }
  const trichYeu = spec.trichYeu ? `<div class="bold">${esc(spec.trichYeu)}</div>` : '';
  return `<div class="title"><div class="name">${esc(titleText)}</div>${trichYeu}</div>`;
}

function buildKinhGui(spec: TemplateSpec): string {
  if (!spec.kinhGui) return '';
  return `<div class="kinh-gui">Kính gửi: ${esc(spec.kinhGui)}</div>`;
}

function buildQuyetDinhPreamble(spec: TemplateSpec): string {
  if (spec.docType !== 'QD') return '';
  const head = `<div class="qd-head">${esc(spec.banHanhChucDanh ?? 'GIÁM ĐỐC HỌC VIỆN HẬU CẦN')}</div>`;
  const canCu = (spec.canCu ?? []).map((c) => `<div class="preamble">Căn cứ ${esc(c)};</div>`).join('');
  const deNghi = `<div class="preamble">Theo đề nghị của ${esc(spec.theoDeNghi ?? 'cơ quan, đơn vị chức năng')}.</div>`;
  const qd = `<div class="qd-head">QUYẾT ĐỊNH:</div>`;
  return head + canCu + deNghi + qd;
}

function buildSection(section: BodySection): string {
  let out = '';
  if (section.heading) out += `<div class="section-heading">${esc(section.heading)}</div>`;
  for (const p of section.paragraphs ?? []) out += `<div class="para">${esc(p)}</div>`;
  if (section.loop) out += buildLoopTable(section.loop);
  return out;
}

function buildLoopTable(loop: LoopTable): string {
  const headerCells = loop.columns.map((c) => `<th>${esc(c.header)}</th>`).join('');
  const dataCells = loop.columns
    .map((c) => `<td class="${c.align === 'center' ? 'center' : c.align === 'right' ? 'right' : ''}">{${c.field}}</td>`)
    .join('');
  return `<table class="data"><tr>${headerCells}</tr>{#${loop.key}}<tr>${dataCells}</tr>{/${loop.key}}</table>`;
}

function buildBody(spec: TemplateSpec): string {
  return spec.body.map(buildSection).join('');
}

function buildSignHtml(chucVu: string[], kyGhiChu: string, hoTen: string): string {
  return (
    chucVu.map((c) => `<div class="bold">${esc(c)}</div>`).join('') +
    `<div class="italic">${esc(kyGhiChu)}</div>` +
    `<div class="sign-space"></div>` +
    `<div class="bold">${hoTen}</div>`
  );
}

function buildFooter(spec: TemplateSpec): string {
  // Biên bản: 2 cột chữ ký, bỏ nơi nhận.
  if (spec.signatures && spec.signatures.length === 2) {
    const [a, b] = spec.signatures;
    return `<table class="footer"><tr>
    <td class="sign">${buildSignHtml(a.chucVu, a.kyGhiChu ?? '(Ký, ghi rõ họ tên)', a.hoTen ?? '{hoTenNguoiKy}')}</td>
    <td class="sign">${buildSignHtml(b.chucVu, b.kyGhiChu ?? '(Ký, ghi rõ họ tên)', b.hoTen ?? '{hoTenNguoiKy}')}</td>
  </tr></table>`;
  }

  const noiNhanLines = [
    `<div class="label">Nơi nhận:</div>`,
    ...(spec.noiNhan ?? ['- Như trên;']).map((n) => `<div>${esc(n)}</div>`),
    `<div>- Lưu: VT, ${esc(spec.luuBoPhan ?? 'BKHHCQS')}.</div>`,
  ].join('');

  const sign = buildSignHtml(spec.chuKyChucVu ?? ['GIÁM ĐỐC'], '(Ký, đóng dấu)', '{hoTenNguoiKy}');

  return `<table class="footer"><tr>
    <td class="noi-nhan">${noiNhanLines}</td>
    <td class="sign">${sign}</td>
  </tr></table>`;
}

/** Tạo chuỗi HTML hoàn chỉnh (có placeholder) từ spec. */
export function buildHtml(spec: TemplateSpec): string {
  const inner =
    buildHeader(spec) +
    buildNumberDate(spec) +
    buildTitle(spec) +
    buildKinhGui(spec) +
    buildQuyetDinhPreamble(spec) +
    buildBody(spec) +
    buildFooter(spec);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>${esc(spec.name)}</title>
<style>${STYLE}</style>
</head>
<body>
${inner}
</body>
</html>`;
}
