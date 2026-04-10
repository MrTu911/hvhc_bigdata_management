/**
 * SearchRepo – CSDL-KHQL Phase 7
 *
 * 3-stage hybrid search per entity type (project | work | scientist):
 *   Stage 1: PostgreSQL tsvector full-text (unaccent, 'simple' dictionary for Vietnamese)
 *   Stage 2: pg_trgm trigram similarity
 *   Stage 3: pgvector cosine similarity (semantic) — graceful fallback if unavailable
 *
 * All stages return { id, type, title, score } rows.
 * The service layer merges them into BM25-like ensemble scores.
 */
import 'server-only'
import prisma from '@/lib/db'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SearchEntityType = 'project' | 'work' | 'scientist'

export interface RawSearchHit {
  id: string
  type: SearchEntityType
  title: string
  subtitle?: string | null
  tsScore: number       // tsvector rank (0–1 normalized)
  trgmScore: number     // pg_trgm similarity (0–1)
  semanticScore: number // 1 - cosine distance (0–1), 0 if unavailable
}

// ─── Stage 1: tsvector full-text ──────────────────────────────────────────────
// Uses 'simple' dictionary + unaccent() so Vietnamese without diacritics
// still matches (e.g. "nckh" matches "NCKH", "nghien cuu" ~ "nghiên cứu").

export async function tsvectorSearch(
  q: string,
  type: SearchEntityType,
  allowedSensitivities: string[],
  limit = 30,
): Promise<Array<{ id: string; title: string; ts_score: number }>> {
  if (!q.trim()) return []

  try {
    if (type === 'project') {
      const rows = await prisma.$queryRawUnsafe<Array<{ id: string; title: string; ts_score: number }>>(
        `SELECT id, title,
                ts_rank(
                  to_tsvector('simple', unaccent(title || ' ' || coalesce(description, ''))),
                  plainto_tsquery('simple', unaccent($1))
                ) AS ts_score
           FROM "nckh_projects"
          WHERE to_tsvector('simple', unaccent(title || ' ' || coalesce(description, '')))
                @@ plainto_tsquery('simple', unaccent($1))
            AND sensitivity = ANY($2::text[])
          ORDER BY ts_score DESC
          LIMIT $3`,
        q, allowedSensitivities, limit,
      )
      return rows
    }

    if (type === 'work') {
      const rows = await prisma.$queryRawUnsafe<Array<{ id: string; title: string; ts_score: number }>>(
        `SELECT id, title,
                ts_rank(
                  to_tsvector('simple', unaccent(title || ' ' || coalesce(subtitle, ''))),
                  plainto_tsquery('simple', unaccent($1))
                ) AS ts_score
           FROM "scientific_works"
          WHERE is_deleted = false
            AND to_tsvector('simple', unaccent(title || ' ' || coalesce(subtitle, '')))
                @@ plainto_tsquery('simple', unaccent($1))
            AND sensitivity = ANY($2::text[])
          ORDER BY ts_score DESC
          LIMIT $3`,
        q, allowedSensitivities, limit,
      )
      return rows
    }

    if (type === 'scientist') {
      // Join NckhScientistProfile → User for fullName
      const rows = await prisma.$queryRawUnsafe<Array<{ id: string; title: string; ts_score: number }>>(
        `SELECT sp.id,
                u.full_name AS title,
                ts_rank(
                  to_tsvector('simple', unaccent(
                    u.full_name || ' ' || coalesce(sp.bio, '') || ' ' ||
                    coalesce(sp.primary_field, '') || ' ' ||
                    array_to_string(sp.research_keywords, ' ')
                  )),
                  plainto_tsquery('simple', unaccent($1))
                ) AS ts_score
           FROM "nckh_scientist_profiles" sp
           JOIN "users" u ON u.id = sp.user_id
          WHERE to_tsvector('simple', unaccent(
                  u.full_name || ' ' || coalesce(sp.bio, '') || ' ' ||
                  coalesce(sp.primary_field, '') || ' ' ||
                  array_to_string(sp.research_keywords, ' ')
                )) @@ plainto_tsquery('simple', unaccent($1))
          ORDER BY ts_score DESC
          LIMIT $2`,
        q, limit,
      )
      return rows
    }
  } catch (err) {
    // unaccent extension may not be installed — fallback to ILIKE
    console.warn('[search.repo] tsvector failed, falling back to ILIKE:', (err as Error).message)
    return ilikeFallback(q, type, allowedSensitivities, limit)
  }
  return []
}

/** ILIKE fallback when unaccent/tsvector is unavailable */
async function ilikeFallback(
  q: string,
  type: SearchEntityType,
  allowedSensitivities: string[],
  limit: number,
): Promise<Array<{ id: string; title: string; ts_score: number }>> {
  const pattern = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`

  if (type === 'project') {
    const rows = await prisma.nckhProject.findMany({
      where: {
        OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }],
        sensitivity: { in: allowedSensitivities },
      },
      take: limit,
      select: { id: true, title: true },
    })
    return rows.map((r) => ({ ...r, ts_score: 0.5 }))
  }

  if (type === 'work') {
    const rows = await prisma.scientificWork.findMany({
      where: {
        isDeleted: false,
        OR: [{ title: { contains: q, mode: 'insensitive' } }, { subtitle: { contains: q, mode: 'insensitive' } }],
        sensitivity: { in: allowedSensitivities },
      },
      take: limit,
      select: { id: true, title: true },
    })
    return rows.map((r) => ({ ...r, ts_score: 0.5 }))
  }

  const rows = await prisma.nckhScientistProfile.findMany({
    where: {
      OR: [
        { user: { fullName: { contains: q, mode: 'insensitive' } } },
        { primaryField: { contains: q, mode: 'insensitive' } },
      ],
    },
    take: limit,
    select: { id: true, user: { select: { fullName: true } } },
  })
  return rows.map((r) => ({ id: r.id, title: r.user.fullName ?? '', ts_score: 0.5 }))

  // suppress unused variable warning
  void pattern
}

// ─── Stage 2: pg_trgm similarity ─────────────────────────────────────────────

export async function trgmSearch(
  q: string,
  type: SearchEntityType,
  allowedSensitivities: string[],
  limit = 30,
): Promise<Array<{ id: string; title: string; trgm_score: number }>> {
  if (!q.trim()) return []

  try {
    if (type === 'project') {
      return prisma.$queryRawUnsafe<Array<{ id: string; title: string; trgm_score: number }>>(
        `SELECT id, title,
                greatest(similarity(title, $1), similarity(coalesce(description,''), $1)) AS trgm_score
           FROM "nckh_projects"
          WHERE sensitivity = ANY($2::text[])
            AND greatest(similarity(title, $1), similarity(coalesce(description,''), $1)) > 0.08
          ORDER BY trgm_score DESC
          LIMIT $3`,
        q, allowedSensitivities, limit,
      )
    }

    if (type === 'work') {
      return prisma.$queryRawUnsafe<Array<{ id: string; title: string; trgm_score: number }>>(
        `SELECT id, title,
                greatest(similarity(title, $1), similarity(coalesce(subtitle,''), $1)) AS trgm_score
           FROM "scientific_works"
          WHERE is_deleted = false
            AND sensitivity = ANY($2::text[])
            AND greatest(similarity(title, $1), similarity(coalesce(subtitle,''), $1)) > 0.08
          ORDER BY trgm_score DESC
          LIMIT $3`,
        q, allowedSensitivities, limit,
      )
    }

    if (type === 'scientist') {
      return prisma.$queryRawUnsafe<Array<{ id: string; title: string; trgm_score: number }>>(
        `SELECT sp.id,
                u.full_name AS title,
                greatest(
                  similarity(u.full_name, $1),
                  similarity(coalesce(sp.primary_field,''), $1)
                ) AS trgm_score
           FROM "nckh_scientist_profiles" sp
           JOIN "users" u ON u.id = sp.user_id
          WHERE greatest(
                  similarity(u.full_name, $1),
                  similarity(coalesce(sp.primary_field,''), $1)
                ) > 0.08
          ORDER BY trgm_score DESC
          LIMIT $2`,
        q, limit,
      )
    }
  } catch (err) {
    // pg_trgm not installed — skip stage
    console.warn('[search.repo] pg_trgm unavailable:', (err as Error).message)
  }
  return []
}

// ─── Stage 3: pgvector semantic search ───────────────────────────────────────

export async function semanticSearch(
  embedding: number[],
  type: SearchEntityType,
  allowedSensitivities: string[],
  limit = 20,
): Promise<Array<{ id: string; title: string; semantic_score: number }>> {
  const vecLiteral = `[${embedding.join(',')}]`

  try {
    if (type === 'project') {
      return prisma.$queryRawUnsafe<Array<{ id: string; title: string; semantic_score: number }>>(
        `SELECT id, title,
                1 - (embedding <=> $1::vector) AS semantic_score
           FROM "nckh_projects"
          WHERE embedding IS NOT NULL
            AND sensitivity = ANY($2::text[])
          ORDER BY embedding <=> $1::vector
          LIMIT $3`,
        vecLiteral, allowedSensitivities, limit,
      )
    }

    if (type === 'work') {
      // ScientificWork may have no embedding column yet — graceful fallback
      return prisma.$queryRawUnsafe<Array<{ id: string; title: string; semantic_score: number }>>(
        `SELECT id, title, 0 AS semantic_score
           FROM "scientific_works"
          WHERE is_deleted = false AND sensitivity = ANY($1::text[])
          LIMIT $2`,
        allowedSensitivities, limit,
      )
    }

    if (type === 'scientist') {
      return prisma.$queryRawUnsafe<Array<{ id: string; title: string; semantic_score: number }>>(
        `SELECT sp.id, u.full_name AS title, 0 AS semantic_score
           FROM "nckh_scientist_profiles" sp
           JOIN "users" u ON u.id = sp.user_id
          LIMIT $1`,
        limit,
      )
    }
  } catch (err) {
    const msg = (err as Error).message
    if (msg.includes('column') || msg.includes('operator') || msg.includes('does not exist')) {
      console.warn('[search.repo] pgvector unavailable for', type, '— skipping semantic stage')
    } else {
      console.error('[search.repo] semantic search error:', msg)
    }
  }
  return []
}
