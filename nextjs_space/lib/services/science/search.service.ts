/**
 * SearchService – CSDL-KHQL Phase 7
 *
 * Orchestrates 3-stage hybrid search and computes BM25-like ensemble scores.
 *
 * Ensemble weight: 0.40 tsvector + 0.30 pg_trgm + 0.30 semantic
 * All individual scores are already in [0,1]; normalise ts_score by
 * clamping to max observed (ts_rank is unbounded but typically < 1 for short queries).
 */
import 'server-only'
import { embedText } from '@/lib/integrations/embeddings'
import {
  tsvectorSearch,
  trgmSearch,
  semanticSearch,
  type SearchEntityType,
  type RawSearchHit,
} from '@/lib/repositories/science/search.repo'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchResult {
  id: string
  type: SearchEntityType
  title: string
  ensembleScore: number     // final BM25-like score [0,1]
  tsScore: number
  trgmScore: number
  semanticScore: number
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  type: SearchEntityType | 'all'
  processingMs: number
}

// ─── Ensemble scoring ─────────────────────────────────────────────────────────

const TS_WEIGHT       = 0.40
const TRGM_WEIGHT     = 0.30
const SEMANTIC_WEIGHT = 0.30

function normalizeScores(hits: Map<string, Partial<RawSearchHit>>): SearchResult[] {
  // Find max ts_score for normalization (ts_rank can exceed 1.0)
  let maxTs = 0
  for (const h of hits.values()) {
    if ((h.tsScore ?? 0) > maxTs) maxTs = h.tsScore!
  }
  const tsNorm = maxTs > 0 ? maxTs : 1

  const results: SearchResult[] = []
  for (const [id, h] of hits.entries()) {
    const ts  = Math.min((h.tsScore  ?? 0) / tsNorm, 1)
    const trgm = Math.min(h.trgmScore    ?? 0,      1)
    const sem  = Math.min(h.semanticScore ?? 0,      1)
    const ensemble = TS_WEIGHT * ts + TRGM_WEIGHT * trgm + SEMANTIC_WEIGHT * sem

    results.push({
      id,
      type:          h.type!,
      title:         h.title ?? '',
      ensembleScore: Math.round(ensemble * 10000) / 10000,
      tsScore:       Math.round(ts    * 10000) / 10000,
      trgmScore:     Math.round(trgm  * 10000) / 10000,
      semanticScore: Math.round(sem   * 10000) / 10000,
    })
  }

  return results.sort((a, b) => b.ensembleScore - a.ensembleScore)
}

function mergeHits(
  entityType: SearchEntityType,
  stage1: Array<{ id: string; title: string; ts_score: number }>,
  stage2: Array<{ id: string; title: string; trgm_score: number }>,
  stage3: Array<{ id: string; title: string; semantic_score: number }>,
): Map<string, Partial<RawSearchHit>> {
  const hits = new Map<string, Partial<RawSearchHit>>()

  const ensure = (id: string, title: string) => {
    if (!hits.has(id)) hits.set(id, { id, type: entityType, title, tsScore: 0, trgmScore: 0, semanticScore: 0 })
    return hits.get(id)!
  }

  for (const r of stage1) {
    const h = ensure(r.id, r.title)
    h.tsScore = Number(r.ts_score)
  }
  for (const r of stage2) {
    const h = ensure(r.id, r.title)
    h.trgmScore = Number(r.trgm_score)
  }
  for (const r of stage3) {
    const h = ensure(r.id, r.title)
    h.semanticScore = Number(r.semantic_score)
  }

  return hits
}

// ─── Core search for one entity type ─────────────────────────────────────────

async function searchOneType(
  q: string,
  entityType: SearchEntityType,
  allowedSensitivities: string[],
  embedding: number[] | null,
): Promise<SearchResult[]> {
  // Run stages 1 and 2 in parallel; stage 3 depends on having an embedding
  const [s1, s2, s3] = await Promise.all([
    tsvectorSearch(q, entityType, allowedSensitivities),
    trgmSearch(q, entityType, allowedSensitivities),
    embedding
      ? semanticSearch(embedding, entityType, allowedSensitivities)
      : Promise.resolve([] as Array<{ id: string; title: string; semantic_score: number }>),
  ])

  const merged = mergeHits(entityType, s1, s2, s3)
  return normalizeScores(merged)
}

// ─── Public service ───────────────────────────────────────────────────────────

export const searchService = {
  async search(opts: {
    q: string
    type: SearchEntityType | 'all'
    allowedSensitivities: string[]
    limit?: number
  }): Promise<SearchResponse> {
    const { q, type, allowedSensitivities, limit = 20 } = opts
    const t0 = Date.now()

    // Generate embedding once (shared across all entity types in 'all' mode)
    let embedding: number[] | null = null
    try {
      embedding = await embedText(q)
    } catch (err) {
      console.warn('[search.service] embedding failed — semantic stage skipped:', (err as Error).message)
    }

    const types: SearchEntityType[] = type === 'all' ? ['project', 'work', 'scientist'] : [type]

    const perTypeResults = await Promise.all(
      types.map((t) => searchOneType(q, t, allowedSensitivities, embedding)),
    )

    // Merge across types, re-sort by ensembleScore, apply limit
    const allResults = perTypeResults
      .flat()
      .sort((a, b) => b.ensembleScore - a.ensembleScore)
      .slice(0, limit)

    return {
      results:      allResults,
      total:        allResults.length,
      query:        q,
      type,
      processingMs: Date.now() - t0,
    }
  },
}
