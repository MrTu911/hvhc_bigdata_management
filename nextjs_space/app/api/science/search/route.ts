/**
 * GET /api/science/search
 *
 * Hybrid 3-stage search across science entities.
 * Stages: tsvector full-text → pg_trgm trigram → pgvector cosine semantic
 * Ranking: BM25-like ensemble (0.40 ts + 0.30 trgm + 0.30 semantic)
 *
 * Query params:
 *   q      — search query (required, min 2 chars)
 *   type   — project | work | scientist | all (default: all)
 *   limit  — max results per type (default: 20, max: 50)
 *
 * Sensitivity gating:
 *   - NORMAL:       all authenticated users with SEARCH_USE
 *   - CONFIDENTIAL: additionally requires PROJECT_APPROVE_DEPT
 *   - SECRET:       additionally requires PROJECT_APPROVE_ACADEMY
 *
 * RBAC: SCIENCE.SEARCH_USE ('USE_SCIENCE_SEARCH')
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireFunction } from '@/lib/rbac/middleware'
import { authorize } from '@/lib/rbac/authorize'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { searchService } from '@/lib/services/science/search.service'
import { extractClientIp, filterSensitivitiesByIp } from '@/lib/security/ip-guard'
import type { SearchEntityType } from '@/lib/repositories/science/search.repo'

// ─── Validation ───────────────────────────────────────────────────────────────

const searchQuerySchema = z.object({
  q:     z.string().min(2, 'Từ khóa phải có ít nhất 2 ký tự').max(200),
  type:  z.enum(['project', 'work', 'scientist', 'all']).default('all'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

// ─── Sensitivity gating ───────────────────────────────────────────────────────

type AuthUser = NonNullable<ReturnType<typeof requireFunction> extends Promise<infer R> ? R : never>['user']

async function getAllowedSensitivities(user: AuthUser, clientIp: string): Promise<string[]> {
  const [canConfidential, canSecret] = await Promise.all([
    authorize(user as never, SCIENCE.PROJECT_APPROVE_DEPT),
    authorize(user as never, SCIENCE.PROJECT_APPROVE_ACADEMY),
  ])

  const byClearance = ['NORMAL']
  if (canConfidential.allowed) byClearance.push('CONFIDENTIAL')
  if (canSecret.allowed)       byClearance.push('SECRET')

  // SECRET results chỉ trả về từ IP nội bộ; external IP nhận CONFIDENTIAL trở xuống
  return filterSensitivitiesByIp(byClearance, clientIp)
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.SEARCH_USE)
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const parsed = searchQuerySchema.safeParse({
    q:     searchParams.get('q'),
    type:  searchParams.get('type') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { q, type, limit } = parsed.data
  const clientIp = extractClientIp(req)
  const allowedSensitivities = await getAllowedSensitivities(auth.user!, clientIp)

  const result = await searchService.search({
    q,
    type: type as SearchEntityType | 'all',
    allowedSensitivities,
    limit,
  })

  return NextResponse.json({
    success: true,
    data: result,
    meta: {
      allowedSensitivities,
      processingMs: result.processingMs,
    },
    error: null,
  })
}
