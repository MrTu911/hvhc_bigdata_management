/**
 * AI Duplicate Check – UC-49
 * POST /api/research/ai/duplicate-check
 *
 * Input:  { title: string, abstract?: string, keywords?: string[], excludeId?: string }
 * Output: { duplicates: [{ id, projectCode, title, similarity, reasons }] }
 *
 * Algorithm (no external ML required):
 *   1. Normalize + tokenize both titles
 *   2. Jaccard similarity on word sets (captures thematic overlap)
 *   3. Bigram overlap (captures phrase-level similarity)
 *   4. Combined score = 0.55 * jaccard + 0.45 * bigram
 *   Threshold: combined >= 0.45 → reported as potential duplicate
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import db from '@/lib/db'

// ─── Text utilities ────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'và', 'của', 'trong', 'về', 'cho', 'các', 'với', 'đến', 'từ', 'là',
  'có', 'được', 'theo', 'một', 'để', 'tại', 'trên', 'bằng', 'qua',
  'nghiên', 'cứu', 'ứng', 'dụng', 'phát', 'triển', 'xây', 'dựng',
  'the', 'of', 'in', 'for', 'and', 'a', 'an', 'to', 'on', 'with',
])

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')     // strip diacritics
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
}

function bigrams(tokens: string[]): string[] {
  const bg: string[] = []
  for (let i = 0; i < tokens.length - 1; i++) {
    bg.push(`${tokens[i]}_${tokens[i + 1]}`)
  }
  return bg
}

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1
  if (a.length === 0 || b.length === 0) return 0
  const setA = new Set(a)
  const setB = new Set(b)
  let intersection = 0
  for (const t of setA) {
    if (setB.has(t)) intersection++
  }
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

function combinedSimilarity(titleA: string, titleB: string): number {
  const tokA = tokenize(titleA)
  const tokB = tokenize(titleB)
  const bgA  = bigrams(tokA)
  const bgB  = bigrams(tokB)

  const jWord   = jaccardSimilarity(tokA, tokB)
  const jBigram = bigrams.length > 0 ? jaccardSimilarity(bgA, bgB) : 0

  return 0.55 * jWord + 0.45 * jBigram
}

function detectReasons(
  inputTitle: string,
  candidate: string,
  similarity: number
): string[] {
  const reasons: string[] = []
  const normInput = normalize(inputTitle)
  const normCand  = normalize(candidate)

  if (similarity >= 0.8) {
    reasons.push('Tiêu đề gần như giống nhau')
  } else if (similarity >= 0.6) {
    reasons.push('Chủ đề và từ khóa chính tương đồng cao')
  } else {
    reasons.push('Có từ khóa và chủ đề trùng lặp')
  }

  // Check for near-identical start (first 30 chars)
  if (normInput.slice(0, 30) === normCand.slice(0, 30)) {
    reasons.push('Phần đầu tiêu đề giống nhau')
  }

  return reasons
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.CREATE)
  if (!auth.allowed) return auth.response!

  let body: { title?: string; abstract?: string; keywords?: string[]; excludeId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Body không hợp lệ' }, { status: 400 })
  }

  const { title, keywords = [], excludeId } = body

  if (!title?.trim()) {
    return NextResponse.json({ success: false, error: 'Thiếu tiêu đề cần kiểm tra' }, { status: 400 })
  }

  try {
    // Load all existing project titles (max 2000 – enough for this institution)
    const projects = await db.nckhProject.findMany({
      where: excludeId ? { id: { not: excludeId } } : {},
      select: {
        id: true,
        projectCode: true,
        title: true,
        status: true,
        category: true,
        field: true,
        budgetYear: true,
        principalInvestigator: { select: { name: true } },
      },
      take: 2000,
    })

    const inputTokens = tokenize(title)

    // Score every candidate
    type Match = {
      id: string
      projectCode: string
      title: string
      status: string
      category: string
      field: string
      budgetYear: number | null
      principalInvestigatorName: string | null
      similarity: number
      reasons: string[]
    }

    const matches: Match[] = []

    for (const p of projects) {
      const titleSim = combinedSimilarity(title, p.title)

      // Keyword boost: if any keyword appears in candidate title
      let keywordBoost = 0
      if (keywords.length > 0) {
        const normCand = normalize(p.title)
        const kwHits = keywords.filter((kw) => normalize(kw).length > 2 && normCand.includes(normalize(kw))).length
        keywordBoost = Math.min(kwHits * 0.08, 0.2)
      }

      const finalScore = Math.min(1, titleSim + keywordBoost)

      if (finalScore >= 0.42) {
        matches.push({
          id:                      p.id,
          projectCode:             p.projectCode,
          title:                   p.title,
          status:                  p.status,
          category:                p.category,
          field:                   p.field,
          budgetYear:              p.budgetYear,
          principalInvestigatorName: p.principalInvestigator?.name ?? null,
          similarity:              Math.round(finalScore * 100) / 100,
          reasons:                 detectReasons(title, p.title, finalScore),
        })
      }
    }

    // Sort by similarity desc, take top 10
    matches.sort((a, b) => b.similarity - a.similarity)
    const topMatches = matches.slice(0, 10)

    // Risk level
    const risk =
      topMatches.some((m) => m.similarity >= 0.75) ? 'HIGH' :
      topMatches.some((m) => m.similarity >= 0.55) ? 'MEDIUM' :
      topMatches.length > 0                         ? 'LOW' :
      'NONE'

    // Persist audit log (fire-and-forget – do not block response)
    db.nckhDuplicateCheckLog.create({
      data: {
        userId:      auth.user!.id,
        title,
        keywords,
        excludeId:   excludeId ?? null,
        risk,
        matchCount:  topMatches.length,
        checkedCount: projects.length,
        matches:     topMatches.map((m) => ({
          id:         m.id,
          projectCode: m.projectCode,
          title:      m.title,
          similarity: m.similarity,
          reasons:    m.reasons,
        })),
      },
    }).catch((e) => console.error('[dup-check] log save error', e))

    return NextResponse.json({
      success: true,
      data: {
        duplicates: topMatches,
        risk,
        checkedCount: projects.length,
        inputTokens: inputTokens.slice(0, 20), // for debug/transparency
      },
    })
  } catch (err) {
    console.error('[research/ai/duplicate-check]', err)
    return NextResponse.json({ success: false, error: 'Lỗi kiểm tra trùng lặp' }, { status: 500 })
  }
}
