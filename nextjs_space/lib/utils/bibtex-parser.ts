/**
 * BibTeX Parser – UC-46 Import
 * Parse BibTeX text thành mảng ParsedEntry.
 * Hỗ trợ: @article, @book, @booklet, @inproceedings, @proceedings,
 *          @phdthesis, @mastersthesis, @misc
 * Production-ready cho các field chuẩn.
 */

import { NckhPublicationType } from '@prisma/client'

export interface BibTexEntry {
  entryType: string
  citeKey: string
  fields: Record<string, string>
}

export interface ParsedPublication {
  title: string
  pubType: NckhPublicationType
  publishedYear: number
  authorsText?: string
  doi?: string
  issn?: string
  isbn?: string
  journal?: string
  volume?: string
  issue?: string
  pages?: string
  publisher?: string
  conferenceName?: string
  proceedingName?: string
  advisorName?: string
  defenseScore?: number
  impactFactor?: number
  abstract?: string
  keywords?: string[]
  /** cite key để debug / map lỗi */
  _citeKey: string
}

export interface BibTexParseResult {
  parsed: ParsedPublication[]
  errors: Array<{ citeKey: string; reason: string }>
}

// ─── Type mapping ─────────────────────────────────────────────────────────────

const ENTRY_TYPE_MAP: Record<string, NckhPublicationType> = {
  article: NckhPublicationType.BAI_BAO_QUOC_TE,
  journal: NckhPublicationType.BAI_BAO_QUOC_TE,
  book: NckhPublicationType.SACH_CHUYEN_KHAO,
  booklet: NckhPublicationType.SACH_CHUYEN_KHAO,
  inbook: NckhPublicationType.SACH_CHUYEN_KHAO,
  incollection: NckhPublicationType.SACH_CHUYEN_KHAO,
  inproceedings: NckhPublicationType.BAO_CAO_KH,
  conference: NckhPublicationType.BAO_CAO_KH,
  proceedings: NckhPublicationType.BAO_CAO_KH,
  phdthesis: NckhPublicationType.LUAN_AN,
  mastersthesis: NckhPublicationType.LUAN_VAN,
  misc: NckhPublicationType.BAI_BAO_TRONG_NUOC,
  techreport: NckhPublicationType.BAO_CAO_KH,
}

// ─── Tokenizer / lexer ────────────────────────────────────────────────────────

/** Trả về value đã bỏ braces / quotes ngoài cùng và trim */
function stripDelimiters(value: string): string {
  value = value.trim()
  if (
    (value.startsWith('{') && value.endsWith('}')) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    value = value.slice(1, -1)
  }
  // Unescape LaTeX diacritics phổ biến
  return value
    .replace(/\{\\['"^`~.=u](.)\}/g, '$1')
    .replace(/\\&/g, '&')
    .replace(/---/g, '–')
    .replace(/--/g, '–')
    .trim()
}

/**
 * Tách một entry BibTeX thành { entryType, citeKey, fields }.
 * Xử lý nested braces đúng cách.
 */
function parseEntry(raw: string): BibTexEntry | null {
  // Match @type{key, ...}
  const typeMatch = raw.match(/^@(\w+)\s*\{/)
  if (!typeMatch) return null

  const entryType = typeMatch[1].toLowerCase()
  const rest = raw.slice(typeMatch[0].length)

  // Tìm cite key (đến dấu phẩy đầu tiên)
  const commaIdx = rest.indexOf(',')
  if (commaIdx === -1) return null
  const citeKey = rest.slice(0, commaIdx).trim()
  let body = rest.slice(commaIdx + 1)

  // Bỏ closing brace cuối
  body = body.trimEnd()
  if (body.endsWith('}')) body = body.slice(0, -1)

  // Parse fields: fieldname = {value} hoặc fieldname = "value"
  const fields: Record<string, string> = {}
  const fieldRegex = /(\w+)\s*=\s*/g
  let match: RegExpExecArray | null

  while ((match = fieldRegex.exec(body)) !== null) {
    const fieldName = match[1].toLowerCase()
    const startIdx = match.index + match[0].length

    // Tìm value – có thể là {…} (nested) hoặc "…"
    let value = ''
    if (body[startIdx] === '{') {
      let depth = 0
      let i = startIdx
      for (; i < body.length; i++) {
        if (body[i] === '{') depth++
        else if (body[i] === '}') {
          depth--
          if (depth === 0) { i++; break }
        }
      }
      value = body.slice(startIdx, i)
    } else if (body[startIdx] === '"') {
      const end = body.indexOf('"', startIdx + 1)
      value = end === -1 ? '' : body.slice(startIdx, end + 1)
    } else {
      // Bare value (số năm, etc.)
      const end = body.indexOf(',', startIdx)
      value = end === -1 ? body.slice(startIdx) : body.slice(startIdx, end)
    }

    fields[fieldName] = stripDelimiters(value)
  }

  return { entryType, citeKey, fields }
}

/** Tách raw BibTeX text thành các entry strings riêng biệt */
function splitEntries(text: string): string[] {
  const entries: string[] = []
  let i = 0
  while (i < text.length) {
    const atIdx = text.indexOf('@', i)
    if (atIdx === -1) break

    // Tìm opening brace
    const braceIdx = text.indexOf('{', atIdx)
    if (braceIdx === -1) break

    // Theo dõi depth braces đến khi đóng
    let depth = 0
    let j = braceIdx
    for (; j < text.length; j++) {
      if (text[j] === '{') depth++
      else if (text[j] === '}') {
        depth--
        if (depth === 0) { j++; break }
      }
    }
    entries.push(text.slice(atIdx, j))
    i = j
  }
  return entries
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseBibTex(text: string): BibTexParseResult {
  const parsed: ParsedPublication[] = []
  const errors: Array<{ citeKey: string; reason: string }> = []

  const rawEntries = splitEntries(text)

  for (const raw of rawEntries) {
    const entry = parseEntry(raw)
    if (!entry) {
      errors.push({ citeKey: '?', reason: 'Không parse được entry' })
      continue
    }

    const { entryType, citeKey, fields } = entry

    // Skip @comment, @preamble, @string
    if (['comment', 'preamble', 'string'].includes(entryType)) continue

    const pubType = ENTRY_TYPE_MAP[entryType] ?? NckhPublicationType.BAI_BAO_TRONG_NUOC

    const title = fields.title
    if (!title) {
      errors.push({ citeKey, reason: 'Thiếu field title' })
      continue
    }

    const yearRaw = fields.year
    const publishedYear = yearRaw ? parseInt(yearRaw, 10) : NaN
    if (isNaN(publishedYear)) {
      errors.push({ citeKey, reason: `Year không hợp lệ: "${yearRaw}"` })
      continue
    }

    const keywordsRaw = fields.keywords
    const keywords = keywordsRaw
      ? keywordsRaw.split(/[,;]/).map((k) => k.trim()).filter(Boolean)
      : []

    const pub: ParsedPublication = {
      title,
      pubType,
      publishedYear,
      _citeKey: citeKey,
      authorsText: fields.author ?? undefined,
      doi: fields.doi ?? undefined,
      issn: fields.issn ?? undefined,
      isbn: fields.isbn ?? undefined,
      journal: fields.journal ?? fields.journaltitle ?? undefined,
      volume: fields.volume ?? undefined,
      issue: fields.number ?? fields.issue ?? undefined,
      pages: fields.pages ?? undefined,
      publisher: fields.publisher ?? undefined,
      conferenceName: fields.booktitle ?? undefined,
      proceedingName: fields.series ?? undefined,
      advisorName: fields.school ?? undefined,
      abstract: fields.abstract ?? undefined,
      keywords,
    }

    parsed.push(pub)
  }

  return { parsed, errors }
}
