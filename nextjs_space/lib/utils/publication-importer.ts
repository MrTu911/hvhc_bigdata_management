/**
 * Publication Importer – UC-46
 * Abstraction layer cho import BibTeX và Excel.
 * Mỗi format được tách ra để dễ mở rộng độc lập.
 */
import 'server-only'
import { parseBibTex, type ParsedPublication } from './bibtex-parser'
import type { NckhPublicationCreateInput } from '@/lib/validations/nckh-publication'
import { NckhPublicationType } from '@prisma/client'

export interface ImportResult {
  success: ParsedPublication[]
  errors: Array<{ index: number; citeKey?: string; reason: string }>
  totalRows: number
}

// ─── BibTeX ───────────────────────────────────────────────────────────────────

export function importFromBibTex(text: string): ImportResult {
  const { parsed, errors } = parseBibTex(text)

  return {
    success: parsed,
    errors: errors.map((e, i) => ({ index: i, citeKey: e.citeKey, reason: e.reason })),
    totalRows: parsed.length + errors.length,
  }
}

// ─── Excel template column mapping ───────────────────────────────────────────
// Columns theo thứ tự trong template Excel chuẩn UC-46
// Thay đổi INDEX_MAP nếu template thay đổi – không cần sửa logic parser.

export const EXCEL_COLUMN_MAP: Record<string, keyof NckhPublicationCreateInput> = {
  'Tiêu đề': 'title',
  'Tiêu đề (EN)': 'titleEn',
  'Loại công bố': 'pubType',
  'Năm công bố': 'publishedYear',
  'Danh sách tác giả': 'authorsText',
  'DOI': 'doi',
  'ISSN': 'issn',
  'ISBN': 'isbn',
  'Tạp chí / Hội thảo / NXB': 'journal',
  'Tập (Volume)': 'volume',
  'Số (Issue)': 'issue',
  'Trang': 'pages',
  'Nhà xuất bản': 'publisher',
  'ISI': 'isISI',
  'Scopus': 'isScopus',
  'Scopus Q': 'scopusQ',
  'Impact Factor': 'impactFactor',
  'Tên hội nghị': 'conferenceName',
  'Tên proceeding': 'proceedingName',
  'Số bằng sáng chế': 'patentNumber',
  'Số quyết định': 'decisionNumber',
  'Người hướng dẫn': 'advisorName',
  'Điểm bảo vệ': 'defenseScore',
  'Đề tài liên kết (mã)': 'projectId',
  'Mã đơn vị': 'unitId',
  'URL toàn văn': 'fullTextUrl',
  'Từ khóa': 'keywords',
}

/** Map string pubType header → enum value */
export const PUB_TYPE_LABEL_MAP: Record<string, NckhPublicationType> = {
  'Bài báo quốc tế': NckhPublicationType.BAI_BAO_QUOC_TE,
  'Bài báo trong nước': NckhPublicationType.BAI_BAO_TRONG_NUOC,
  'Sách chuyên khảo': NckhPublicationType.SACH_CHUYEN_KHAO,
  'Giáo trình': NckhPublicationType.GIAO_TRINH,
  'Sáng kiến': NckhPublicationType.SANG_KIEN,
  'Bằng sáng chế': NckhPublicationType.PATENT,
  'Báo cáo KH': NckhPublicationType.BAO_CAO_KH,
  'Luận văn': NckhPublicationType.LUAN_VAN,
  'Luận án': NckhPublicationType.LUAN_AN,
}

/**
 * Parse một row Excel (object key=header, value=cell) thành ParsedPublication.
 * Scaffold: caller tự parse XLSX/ExcelJS → rows → gọi hàm này.
 */
export function mapExcelRowToPublication(
  row: Record<string, unknown>,
  rowIndex: number
): { data?: ParsedPublication; error?: { index: number; reason: string } } {
  const get = (header: string): string =>
    String(row[header] ?? '').trim()

  const title = get('Tiêu đề')
  if (!title) return { error: { index: rowIndex, reason: 'Thiếu Tiêu đề' } }

  const pubTypeLabel = get('Loại công bố')
  const pubType = PUB_TYPE_LABEL_MAP[pubTypeLabel]
  if (!pubType) {
    return {
      error: {
        index: rowIndex,
        reason: `Loại công bố "${pubTypeLabel}" không hợp lệ. Giá trị hợp lệ: ${Object.keys(PUB_TYPE_LABEL_MAP).join(', ')}`,
      },
    }
  }

  const yearRaw = get('Năm công bố')
  const publishedYear = parseInt(yearRaw, 10)
  if (isNaN(publishedYear)) {
    return { error: { index: rowIndex, reason: `Năm công bố "${yearRaw}" không hợp lệ` } }
  }

  const keywordsRaw = get('Từ khóa')
  const keywords = keywordsRaw
    ? keywordsRaw.split(/[,;]/).map((k) => k.trim()).filter(Boolean)
    : []

  const impactFactorRaw = get('Impact Factor')
  const impactFactor = impactFactorRaw ? parseFloat(impactFactorRaw) : undefined

  const defenseScoreRaw = get('Điểm bảo vệ')
  const defenseScore = defenseScoreRaw ? parseFloat(defenseScoreRaw) : undefined

  return {
    data: {
      title,
      pubType,
      publishedYear,
      _citeKey: `row_${rowIndex}`,
      authorsText: get('Danh sách tác giả') || undefined,
      doi: get('DOI') || undefined,
      issn: get('ISSN') || undefined,
      isbn: get('ISBN') || undefined,
      journal: get('Tạp chí / Hội thảo / NXB') || undefined,
      volume: get('Tập (Volume)') || undefined,
      issue: get('Số (Issue)') || undefined,
      pages: get('Trang') || undefined,
      publisher: get('Nhà xuất bản') || undefined,
      conferenceName: get('Tên hội nghị') || undefined,
      proceedingName: get('Tên proceeding') || undefined,
      advisorName: get('Người hướng dẫn') || undefined,
      defenseScore,
      impactFactor,
      keywords,
      abstract: undefined,
    },
  }
}

/**
 * Parse toàn bộ Excel rows.
 * `rows`: mảng object, mỗi object là { [header]: cellValue } (từ xlsx/exceljs parser).
 */
export function importFromExcelRows(rows: Record<string, unknown>[]): ImportResult {
  const success: ParsedPublication[] = []
  const errors: Array<{ index: number; reason: string }> = []

  rows.forEach((row, i) => {
    const result = mapExcelRowToPublication(row, i + 2) // +2 vì row 1 là header
    if (result.data) success.push(result.data)
    else if (result.error) errors.push(result.error)
  })

  return { success, errors, totalRows: rows.length }
}
