/**
 * DOCX builder cho mẫu văn bản hành chính (Nghị định 30/2020/NĐ-CP).
 *
 * Sinh file .docx hợp lệ trực tiếp từ OOXML bằng PizZip (đã là dependency) —
 * KHÔNG thêm thư viện mới. Mỗi {placeholder} nằm gọn trong một <w:t> nên
 * docxtemplater nhận diện tag chính xác khi render.
 *
 * Bảng dữ liệu lặp dùng cú pháp table-row loop của docxtemplater:
 *   ô đầu chứa {#key}, ô cuối chứa {/key} → toàn bộ <w:tr> được lặp theo mảng.
 */

import PizZip from 'pizzip';
import {
  DOC_TYPE_META,
  type BodySection,
  type KvTable,
  type LoopTable,
  type TemplateSpec,
} from './types';

// ─── Hằng số layout (twips) ────────────────────────────────────────────────────
const SZ_BODY = 26; // 13pt (half-points)
const SZ_HEADING = 28; // 14pt
const SZ_SMALL = 22; // 11pt (nơi nhận)
const FIRST_LINE_INDENT = 567; // ~1cm
const CONTENT_WIDTH = 9071; // A4 trừ lề trái 30mm + phải 20mm

// ─── XML escaping ───────────────────────────────────────────────────────────────
function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── Run / paragraph helpers ────────────────────────────────────────────────────
interface RunOpts {
  bold?: boolean;
  italic?: boolean;
  size?: number;
  caps?: boolean;
}
interface ParaOpts {
  align?: 'left' | 'center' | 'right' | 'both';
  before?: number;
  after?: number;
  bottomBorder?: boolean;
  firstLineIndent?: boolean;
  /** Thụt lề trái+phải đối xứng (twips) — dùng rút ngắn & căn giữa đường gạch chân. */
  indentLR?: number;
}

function runProps(o: RunOpts): string {
  let s = '';
  if (o.bold) s += '<w:b/>';
  if (o.italic) s += '<w:i/>';
  if (o.caps) s += '<w:caps/>';
  const size = o.size ?? SZ_BODY;
  s += `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`;
  return `<w:rPr>${s}</w:rPr>`;
}

function run(text: string, o: RunOpts = {}): string {
  return `<w:r>${runProps(o)}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
}

function paraProps(o: ParaOpts): string {
  let s = '';
  if (o.align) s += `<w:jc w:val="${o.align}"/>`;
  if (o.bottomBorder)
    s += '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="auto"/></w:pBdr>';
  const indAttrs: string[] = [];
  if (o.indentLR) indAttrs.push(`w:left="${o.indentLR}"`, `w:right="${o.indentLR}"`);
  if (o.firstLineIndent) indAttrs.push(`w:firstLine="${FIRST_LINE_INDENT}"`);
  if (indAttrs.length) s += `<w:ind ${indAttrs.join(' ')}/>`;
  s += `<w:spacing w:before="${o.before ?? 0}" w:after="${o.after ?? 0}" w:line="276" w:lineRule="auto"/>`;
  return `<w:pPr>${s}</w:pPr>`;
}

function para(runsXml: string, o: ParaOpts = {}): string {
  return `<w:p>${paraProps(o)}${runsXml}</w:p>`;
}

function line(text: string, ro: RunOpts = {}, po: ParaOpts = {}): string {
  return para(run(text, ro), po);
}

function emptyPara(): string {
  return '<w:p/>';
}

// ─── Tables ─────────────────────────────────────────────────────────────────────
function borderlessTableProps(): string {
  return (
    '<w:tblPr><w:tblW w:w="5000" w:type="pct"/>' +
    '<w:tblBorders><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/>' +
    '<w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>' +
    '<w:tblLook w:val="0000"/></w:tblPr>'
  );
}

function griddedTableProps(): string {
  return (
    '<w:tblPr><w:tblW w:w="5000" w:type="pct"/>' +
    '<w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/>' +
    '<w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/>' +
    '<w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>'
  );
}

function cell(widthDxa: number, contentXml: string): string {
  return `<w:tc><w:tcPr><w:tcW w:w="${widthDxa}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>${contentXml}</w:tc>`;
}

// ─── Header (Nghị định 30: bảng 2 cột không viền) ───────────────────────────────
function buildHeader(spec: TemplateSpec): string {
  const leftW = 3900;
  const rightW = 5200;
  const capTren = spec.headerCapTren ?? '{tenCoQuanCapTren}';
  const banHanh = spec.headerBanHanh ?? '{tenCoQuanBanHanh}';
  // bottomBorder + indentLR → đường gạch chân ngắn, căn giữa theo Nghị định 30.
  const left =
    line(capTren, { size: 24 }, { align: 'center', after: 0 }) +
    para(run(banHanh, { bold: true, size: 24 }), { align: 'center', bottomBorder: true, indentLR: 700 });
  const right =
    para(run('{quocHieu}', { bold: true, size: 24 }), { align: 'center', after: 0 }) +
    para(run('{tieuNgu}', { bold: true, size: SZ_BODY }), { align: 'center', bottomBorder: true, indentLR: 900 });
  return (
    `<w:tbl>${borderlessTableProps()}<w:tblGrid><w:gridCol w:w="${leftW}"/><w:gridCol w:w="${rightW}"/></w:tblGrid>` +
    `<w:tr>${cell(leftW, left)}${cell(rightW, right)}</w:tr></w:tbl>`
  );
}

// ─── Số / địa danh - ngày (bảng 2 cột không viền) ───────────────────────────────
function buildNumberDateRow(spec: TemplateSpec): string {
  const leftW = 3900;
  const rightW = 5200;
  const left = line(`Số: {soVanBan}/${spec.kyHieu}`, {}, { align: 'center', before: 60 });
  const right = line('{diaDanhNgayThang}', { italic: true }, { align: 'center', before: 60 });
  return (
    `<w:tbl>${borderlessTableProps()}<w:tblGrid><w:gridCol w:w="${leftW}"/><w:gridCol w:w="${rightW}"/></w:tblGrid>` +
    `<w:tr>${cell(leftW, left)}${cell(rightW, right)}</w:tr></w:tbl>`
  );
}

// ─── Tiêu đề loại văn bản + trích yếu ───────────────────────────────────────────
function buildTitle(spec: TemplateSpec): string {
  const meta = DOC_TYPE_META[spec.docType];
  const titleText = spec.titleOverride ?? meta.title;
  if (!titleText) {
    // Công văn: không có tên loại, dùng "V/v ..." in đậm ở giữa.
    return line(`V/v ${spec.trichYeu}`, { bold: true }, { align: 'center', before: 240, after: 120 });
  }
  let out = line(titleText, { bold: true, size: 30 }, { align: 'center', before: 240, after: 0 });
  if (spec.trichYeu) {
    out += line(spec.trichYeu, { bold: true }, { align: 'center', after: 120 });
  }
  return out;
}

// ─── Kính gửi (Công văn / Tờ trình) ─────────────────────────────────────────────
function buildKinhGui(spec: TemplateSpec): string {
  if (!spec.kinhGui) return '';
  return line(`Kính gửi: ${spec.kinhGui}`, { bold: true }, { align: 'left', before: 120, after: 120, firstLineIndent: true });
}

// ─── Khối căn cứ + "QUYẾT ĐỊNH:" (Quyết định) ───────────────────────────────────
function buildQuyetDinhPreamble(spec: TemplateSpec): string {
  if (spec.docType !== 'QD') return '';
  let out = line(spec.banHanhChucDanh ?? 'GIÁM ĐỐC HỌC VIỆN HẬU CẦN', { bold: true }, { align: 'center', before: 120, after: 120 });
  for (const c of spec.canCu ?? []) {
    out += line(`Căn cứ ${c};`, { italic: true }, { align: 'both', firstLineIndent: true, after: 40 });
  }
  out += line(`Theo đề nghị của ${spec.theoDeNghi ?? 'cơ quan, đơn vị chức năng'}.`, { italic: true }, { align: 'both', firstLineIndent: true, after: 120 });
  out += line('QUYẾT ĐỊNH:', { bold: true }, { align: 'center', before: 60, after: 120 });
  return out;
}

// ─── Phần thân ──────────────────────────────────────────────────────────────────
function buildBody(spec: TemplateSpec): string {
  return spec.body.map(buildSection).join('');
}

function buildSection(section: BodySection): string {
  let out = '';
  if (section.heading) {
    out += line(section.heading, { bold: true }, { align: 'left', before: 120, after: 40 });
  }
  for (const p of section.paragraphs ?? []) {
    out += line(p, {}, { align: 'both', firstLineIndent: true, after: 40 });
  }
  if (section.kvTable) {
    out += buildKvTable(section.kvTable);
  }
  if (section.loop) {
    out += buildLoopTable(section.loop);
  }
  return out;
}

// ─── Bảng key/value 3 cột (TT | nhãn | {field}) cho phần thân scalar ────────────
function buildKvTable(kv: KvTable): string {
  const ttW = 700;
  const labelW = 3600;
  const valueW = CONTENT_WIDTH - ttW - labelW;
  const widths = [ttW, labelW, valueW];
  const grid = widths.map((w) => `<w:gridCol w:w="${w}"/>`).join('');

  const headerRow =
    '<w:tr>' +
    kv.columns
      .map((h, i) => cell(widths[i], para(run(h, { bold: true }), { align: 'center', after: 0 })))
      .join('') +
    '</w:tr>';

  // Mỗi dòng: STT (giữa) + nhãn (trái) + {field} (placeholder, một <w:t> để docxtemplater nhận tag).
  const dataRows = kv.rows
    .map(
      (r) =>
        '<w:tr>' +
        cell(ttW, para(run(r.tt), { align: 'center', after: 0 })) +
        cell(labelW, para(run(r.label), { after: 0 })) +
        cell(valueW, para(run(`{${r.field}}`), { after: 0 })) +
        '</w:tr>',
    )
    .join('');

  return `<w:tbl>${griddedTableProps()}<w:tblGrid>${grid}</w:tblGrid>${headerRow}${dataRows}</w:tbl>`;
}

function buildLoopTable(loop: LoopTable): string {
  const totalWeight = loop.columns.reduce((s, c) => s + (c.weight ?? 1), 0);
  const widths = loop.columns.map((c) => Math.round((CONTENT_WIDTH * (c.weight ?? 1)) / totalWeight));

  const grid = widths.map((w) => `<w:gridCol w:w="${w}"/>`).join('');

  // Hàng tiêu đề (in đậm, căn giữa).
  const headerRow =
    '<w:tr>' +
    loop.columns
      .map((c, i) => cell(widths[i], para(run(c.header, { bold: true }), { align: 'center', after: 0 })))
      .join('') +
    '</w:tr>';

  // Hàng dữ liệu: ô đầu chứa {#key}, ô cuối chứa {/key}.
  const dataRow =
    '<w:tr>' +
    loop.columns
      .map((c, i) => {
        const isFirst = i === 0;
        const isLast = i === loop.columns.length - 1;
        const open = isFirst ? `{#${loop.key}}` : '';
        const close = isLast ? `{/${loop.key}}` : '';
        const text = `${open}{${c.field}}${close}`;
        return cell(widths[i], para(run(text), { align: c.align ?? 'left', after: 0 }));
      })
      .join('') +
    '</w:tr>';

  return `<w:tbl>${griddedTableProps()}<w:tblGrid>${grid}</w:tblGrid>${headerRow}${dataRow}</w:tbl>`;
}

// ─── Khối ký ────────────────────────────────────────────────────────────────────
function buildSignBlock(chucVu: string[], kyGhiChu: string, hoTen: string): string {
  let s = chucVu.map((c) => line(c, { bold: true }, { align: 'center', after: 0 })).join('');
  s += line(kyGhiChu, { italic: true }, { align: 'center', after: 0 });
  s += emptyPara() + emptyPara();
  s += line(hoTen, { bold: true }, { align: 'center', after: 0 });
  return s;
}

// ─── Footer: 2 chữ ký (biên bản) hoặc nơi nhận + 1 chữ ký (mặc định) ─────────────
function buildFooter(spec: TemplateSpec): string {
  // Biên bản: 2 cột chữ ký, bỏ nơi nhận.
  if (spec.signatures && spec.signatures.length === 2) {
    const w = 4550;
    const [a, b] = spec.signatures;
    const left = buildSignBlock(a.chucVu, a.kyGhiChu ?? '(Ký, ghi rõ họ tên)', a.hoTen ?? '{hoTenNguoiKy}');
    const right = buildSignBlock(b.chucVu, b.kyGhiChu ?? '(Ký, ghi rõ họ tên)', b.hoTen ?? '{hoTenNguoiKy}');
    return (
      `<w:tbl>${borderlessTableProps()}<w:tblGrid><w:gridCol w:w="${w}"/><w:gridCol w:w="${w}"/></w:tblGrid>` +
      `<w:tr>${cell(w, left)}${cell(w, right)}</w:tr></w:tbl>`
    );
  }

  const leftW = 5000;
  const rightW = 4100;

  // Nơi nhận (trái, cỡ nhỏ)
  let noiNhan = para(run('Nơi nhận:', { bold: true, italic: true, size: SZ_SMALL }), { after: 0 });
  for (const n of spec.noiNhan ?? ['- Như trên;']) {
    noiNhan += line(n, { size: SZ_SMALL }, { after: 0 });
  }
  noiNhan += line(`- Lưu: VT, ${spec.luuBoPhan ?? 'BKHHCQS'}.`, { size: SZ_SMALL }, { after: 0 });

  // Khối ký (phải)
  const sign = buildSignBlock(spec.chuKyChucVu ?? ['GIÁM ĐỐC'], '(Ký, đóng dấu)', '{hoTenNguoiKy}');

  return (
    `<w:tbl>${borderlessTableProps()}<w:tblGrid><w:gridCol w:w="${leftW}"/><w:gridCol w:w="${rightW}"/></w:tblGrid>` +
    `<w:tr>${cell(leftW, noiNhan)}${cell(rightW, sign)}</w:tr></w:tbl>`
  );
}

// ─── sectPr (A4, lề Nghị định 30) ───────────────────────────────────────────────
function sectPr(): string {
  return (
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
    '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1701" w:header="720" w:footer="720" w:gutter="0"/>' +
    '</w:sectPr>'
  );
}

// ─── Document body ──────────────────────────────────────────────────────────────
function buildDocumentXml(spec: TemplateSpec): string {
  const body =
    buildHeader(spec) +
    buildNumberDateRow(spec) +
    buildTitle(spec) +
    buildKinhGui(spec) +
    buildQuyetDinhPreamble(spec) +
    buildBody(spec) +
    emptyPara() +
    buildFooter(spec) +
    sectPr();

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    `<w:body>${body}</w:body></w:document>`
  );
}

// ─── Các part cố định của gói .docx ─────────────────────────────────────────────
const CONTENT_TYPES_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
  '</Types>';

const ROOT_RELS_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  '</Relationships>';

const DOC_RELS_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
  '</Relationships>';

const STYLES_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  '<w:docDefaults><w:rPrDefault><w:rPr>' +
  '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>' +
  `<w:sz w:val="${SZ_BODY}"/><w:szCs w:val="${SZ_BODY}"/><w:lang w:val="vi-VN"/>` +
  '</w:rPr></w:rPrDefault>' +
  '<w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault>' +
  '</w:docDefaults>' +
  '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>' +
  '</w:styles>';

/** Tạo buffer .docx hoàn chỉnh từ spec (đã chèn sẵn tag docxtemplater). */
export function buildDocx(spec: TemplateSpec): Buffer {
  const zip = new PizZip();
  zip.file('[Content_Types].xml', CONTENT_TYPES_XML);
  zip.file('_rels/.rels', ROOT_RELS_XML);
  zip.file('word/_rels/document.xml.rels', DOC_RELS_XML);
  zip.file('word/styles.xml', STYLES_XML);
  zip.file('word/document.xml', buildDocumentXml(spec));
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}
