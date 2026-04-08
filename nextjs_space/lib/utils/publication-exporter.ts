/**
 * Publication Exporter – UC-46
 * Tạo CSV và Excel (Biểu 2 BQP / HĐCGSNN) từ danh sách công bố.
 * Production-ready: CSV export.
 * Scaffold: Excel template BQP / HĐCGSNN (header + data, chưa styling BQP chuẩn).
 */
import 'server-only'
import ExcelJS from 'exceljs'
import { NckhPublicationType } from '@prisma/client'

// ─── Labels ───────────────────────────────────────────────────────────────────

export const PUB_TYPE_LABELS: Record<NckhPublicationType, string> = {
  BAI_BAO_QUOC_TE: 'Bài báo quốc tế',
  BAI_BAO_TRONG_NUOC: 'Bài báo trong nước',
  SACH_CHUYEN_KHAO: 'Sách chuyên khảo',
  GIAO_TRINH: 'Giáo trình',
  SANG_KIEN: 'Sáng kiến',
  PATENT: 'Bằng sáng chế',
  BAO_CAO_KH: 'Báo cáo KH',
  LUAN_VAN: 'Luận văn',
  LUAN_AN: 'Luận án',
}

// ─── Common row type ──────────────────────────────────────────────────────────

export interface PublicationExportRow {
  stt: number
  title: string
  pubType: NckhPublicationType
  publishedYear: number
  authorsText?: string | null
  journal?: string | null
  doi?: string | null
  isISI: boolean
  isScopus: boolean
  scopusQ?: string | null
  impactFactor?: number | null
  ranking?: string | null
  citationCount: number
  unitId?: string | null
  projectCode?: string | null
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
// Production-ready

const CSV_HEADERS = [
  'STT',
  'Tiêu đề',
  'Loại',
  'Năm',
  'Tác giả',
  'Tạp chí / NXB',
  'DOI',
  'ISI',
  'Scopus',
  'Phân hạng',
  'Impact Factor',
  'Trích dẫn',
  'Đề tài',
]

function escapeCsvCell(value: unknown): string {
  const str = value == null ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function buildCsvExport(rows: PublicationExportRow[]): Buffer {
  const lines: string[] = [CSV_HEADERS.join(',')]

  for (const r of rows) {
    lines.push(
      [
        r.stt,
        r.title,
        PUB_TYPE_LABELS[r.pubType] ?? r.pubType,
        r.publishedYear,
        r.authorsText ?? '',
        r.journal ?? '',
        r.doi ?? '',
        r.isISI ? 'Có' : 'Không',
        r.isScopus ? 'Có' : 'Không',
        r.scopusQ ?? r.ranking ?? '',
        r.impactFactor ?? '',
        r.citationCount,
        r.projectCode ?? '',
      ]
        .map(escapeCsvCell)
        .join(',')
    )
  }

  const bom = '\uFEFF'
  return Buffer.from(bom + lines.join('\n'), 'utf-8')
}

// ─── Excel Export: Biểu 2 BQP (Scaffold) ─────────────────────────────────────
// Scaffold: header/data đúng, chưa có styling/logo/merge cell theo mẫu BQP thật.
// Đặt comment TODO tại điểm cần hoàn thiện.

const BQP_COLUMNS = [
  { header: 'STT', key: 'stt', width: 6 },
  { header: 'Tiêu đề công trình', key: 'title', width: 50 },
  { header: 'Loại công bố', key: 'pubType', width: 18 },
  { header: 'Năm', key: 'year', width: 8 },
  { header: 'Tác giả / Nhóm tác giả', key: 'authors', width: 30 },
  { header: 'Tạp chí / NXB / Hội thảo', key: 'journal', width: 30 },
  { header: 'DOI', key: 'doi', width: 20 },
  { header: 'ISI', key: 'isi', width: 6 },
  { header: 'Scopus', key: 'scopus', width: 8 },
  { header: 'Phân hạng', key: 'ranking', width: 10 },
  { header: 'IF', key: 'if', width: 8 },
  { header: 'Số trích dẫn', key: 'citations', width: 12 },
  { header: 'Đề tài liên quan', key: 'project', width: 20 },
]

const HĐCGSNN_COLUMNS = [
  { header: 'STT', key: 'stt', width: 6 },
  { header: 'Tên công trình / Sáng kiến', key: 'title', width: 50 },
  { header: 'Loại', key: 'pubType', width: 18 },
  { header: 'Năm', key: 'year', width: 8 },
  { header: 'Tác giả', key: 'authors', width: 30 },
  { header: 'Nơi xuất bản / Tạp chí', key: 'journal', width: 30 },
  { header: 'Ghi chú', key: 'note', width: 20 },
]

async function buildWorkbook(
  rows: PublicationExportRow[],
  columns: typeof BQP_COLUMNS,
  sheetName: string,
  title: string
): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'HVHC BigData Management – UC-46'
  wb.created = new Date()

  const ws = wb.addWorksheet(sheetName)

  // TODO: Thêm header logo / tiêu đề / merged cells theo mẫu BQP/HĐCGSNN thật.
  // Hiện tại: row 1 = tiêu đề đơn giản, row 2 = headers cột.
  ws.addRow([title])
  ws.getRow(1).font = { bold: true, size: 13 }
  ws.addRow([]) // spacer

  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width }))
  ws.getRow(3).font = { bold: true }
  ws.getRow(3).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3E0F0' },
  }

  for (const r of rows) {
    ws.addRow({
      stt: r.stt,
      title: r.title,
      pubType: PUB_TYPE_LABELS[r.pubType] ?? r.pubType,
      year: r.publishedYear,
      authors: r.authorsText ?? '',
      journal: r.journal ?? '',
      doi: r.doi ?? '',
      isi: r.isISI ? 'Có' : '',
      scopus: r.isScopus ? 'Có' : '',
      ranking: r.scopusQ ?? r.ranking ?? '',
      if: r.impactFactor ?? '',
      citations: r.citationCount,
      project: r.projectCode ?? '',
      note: '',
    })
  }

  // TODO: Thêm footer / chữ ký / đóng dấu theo mẫu thật.

  return wb.xlsx.writeBuffer()
}

export async function buildBqpExcelExport(rows: PublicationExportRow[]): Promise<Buffer> {
  const buf = await buildWorkbook(rows, BQP_COLUMNS, 'Biểu 2 BQP', 'DANH MỤC CÔNG BỐ KHOA HỌC (Biểu 2 – BQP)')
  return Buffer.from(buf as ArrayBuffer)
}

export async function buildHdcgsnnExcelExport(rows: PublicationExportRow[]): Promise<Buffer> {
  const buf = await buildWorkbook(rows, HĐCGSNN_COLUMNS, 'HĐCGSNN', 'DANH MỤC CÔNG TRÌNH KHOA HỌC (Mẫu HĐCGSNN)')
  return Buffer.from(buf as ArrayBuffer)
}
