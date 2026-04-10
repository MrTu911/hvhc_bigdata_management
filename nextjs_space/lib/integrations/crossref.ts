/**
 * CrossRef Integration – CSDL-KHQL Phase 3
 *
 * Gọi CrossRef Public API v1 để lấy metadata từ DOI.
 * Docs: https://api.crossref.org/swagger-ui/index.html
 *
 * Không cần API key cho public use (polite pool).
 * Thêm header "mailto" theo CrossRef etiquette.
 */
import 'server-only'

const CROSSREF_BASE = 'https://api.crossref.org/works'
const POLITE_EMAIL = process.env.CROSSREF_POLITE_EMAIL ?? 'admin@hvhc.edu.vn'
const FETCH_TIMEOUT_MS = 10_000

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CrossrefAuthor {
  given?: string
  family?: string
  name?: string          // institutional author
  affiliation?: { name: string }[]
  ORCID?: string
}

export interface CrossrefWorkMeta {
  doi: string
  title: string
  subtitle?: string
  type: string           // journal-article, book, monograph, ...
  year?: number
  isbn?: string[]
  issn?: string[]
  publisherName?: string
  journalName?: string
  authors: CrossrefAuthor[]
  abstract?: string
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

/**
 * Lấy metadata từ CrossRef theo DOI.
 * Trả null nếu không tìm thấy hoặc timeout.
 */
export async function fetchCrossrefByDoi(doi: string): Promise<CrossrefWorkMeta | null> {
  const encoded = encodeURIComponent(doi.trim())
  const url = `${CROSSREF_BASE}/${encoded}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent': `HVHC-CSDL-KHQL/1.0 (mailto:${POLITE_EMAIL})`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    })
  } catch (err: any) {
    console.error('[crossref] fetch error:', err.message)
    return null
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    if (res.status === 404) return null
    console.error('[crossref] non-ok response:', res.status, doi)
    return null
  }

  let json: any
  try {
    json = await res.json()
  } catch {
    return null
  }

  const msg = json?.message
  if (!msg) return null

  return mapCrossrefMessage(doi, msg)
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapCrossrefMessage(doi: string, msg: any): CrossrefWorkMeta {
  const titleArr: string[] = msg.title ?? []
  const subtitleArr: string[] = msg.subtitle ?? []

  const year =
    msg.published?.['date-parts']?.[0]?.[0] ??
    msg['published-print']?.['date-parts']?.[0]?.[0] ??
    msg['published-online']?.['date-parts']?.[0]?.[0] ??
    undefined

  const isbn: string[] = [
    ...(msg['ISBN'] ?? []),
    ...(msg['isbn-type']?.map((i: any) => i.value) ?? []),
  ].filter(Boolean)

  const issn: string[] = [
    ...(msg['ISSN'] ?? []),
    ...(msg['issn-type']?.map((i: any) => i.value) ?? []),
  ].filter(Boolean)

  const authors: CrossrefAuthor[] = (msg.author ?? []).map((a: any) => ({
    given: a.given,
    family: a.family,
    name: a.name,
    affiliation: a.affiliation,
    ORCID: a.ORCID?.replace('http://orcid.org/', '').replace('https://orcid.org/', ''),
  }))

  return {
    doi,
    title: titleArr[0] ?? '',
    subtitle: subtitleArr[0],
    type: msg.type ?? 'unknown',
    year,
    isbn: isbn.length ? isbn : undefined,
    issn: issn.length ? issn : undefined,
    publisherName: msg.publisher,
    journalName: msg['container-title']?.[0],
    authors,
    abstract: msg.abstract,
  }
}

/**
 * Map CrossRef type → ScientificWork type.
 * Fallback là REFERENCE nếu không xác định.
 */
export function mapCrossrefTypeToWorkType(crossrefType: string): string {
  const map: Record<string, string> = {
    'book':             'BOOK',
    'monograph':        'MONOGRAPH',
    'edited-book':      'BOOK',
    'book-chapter':     'BOOK',
    'reference-book':   'REFERENCE',
    'reference-entry':  'REFERENCE',
    'journal-article':  'REFERENCE',
    'proceedings-article': 'REFERENCE',
  }
  return map[crossrefType] ?? 'REFERENCE'
}
