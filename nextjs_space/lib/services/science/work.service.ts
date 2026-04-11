/**
 * WorkService – CSDL-KHQL Phase 3
 * Business logic cho ScientificWork:
 *   - CRUD với code auto-generation
 *   - CrossRef DOI import
 *   - Duplicate check (BM25 candidate + Levenshtein similarity)
 *
 * Cosine embedding similarity (Phase 5) sẽ thay thế Levenshtein khi
 * pgvector + embedding pipeline hoàn chỉnh.
 */
import 'server-only'
import { workRepo } from '@/lib/repositories/science/work.repo'
import { fetchCrossrefByDoi, mapCrossrefTypeToWorkType } from '@/lib/integrations/crossref'
import { logAudit } from '@/lib/audit'
import prisma from '@/lib/db'
import type {
  WorkCreateInput,
  WorkUpdateInput,
  WorkListFilter,
  CrossrefImportInput,
  DuplicateCheckInput,
} from '@/lib/validations/science-work'

// ─── Code generation ──────────────────────────────────────────────────────────

async function generateWorkCode(): Promise<string> {
  const year = new Date().getFullYear()

  const seq = await prisma.scienceIdSequence.upsert({
    where: { entityType_year: { entityType: 'WORK', year } },
    create: { entityType: 'WORK', year, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  })

  return `HVHC-${year}-WORK-${String(seq.lastSeq).padStart(3, '0')}`
}

// ─── Levenshtein similarity (fallback trước khi có vector search) ─────────────

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function titleSimilarity(a: string, b: string): number {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
  const na = norm(a)
  const nb = norm(b)
  const maxLen = Math.max(na.length, nb.length)
  if (maxLen === 0) return 1
  const dist = levenshtein(na, nb)
  return 1 - dist / maxLen
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const workService = {
  async listWorks(filter: WorkListFilter) {
    const result = await workRepo.findMany(filter)
    return {
      success: true as const,
      data: { items: result.items, total: result.total },
    }
  },

  async getWorkById(id: string) {
    const work = await workRepo.findById(id)
    if (!work) return { success: false as const, error: 'Không tìm thấy công trình' }
    return { success: true as const, data: work }
  },

  async createWork(input: WorkCreateInput, userId: string, ipAddress?: string) {
    if (input.doi) {
      const existing = await workRepo.findByDoi(input.doi)
      if (existing) {
        return {
          success: false as const,
          error: `DOI đã tồn tại trong hệ thống: ${existing.code}`,
        }
      }
    }

    const code = await generateWorkCode()
    const created = await workRepo.create({ ...input, code })

    await logAudit({
      userId,
      functionCode: 'CREATE_SCIENTIFIC_WORK',
      action: 'CREATE',
      resourceType: 'SCIENTIFIC_WORK',
      resourceId: created!.id,
      result: 'SUCCESS',
      ipAddress,
      metadata: { code },
    })

    return { success: true as const, data: created }
  },

  async updateWork(id: string, input: WorkUpdateInput, userId: string, ipAddress?: string) {
    const existing = await workRepo.findById(id)
    if (!existing) return { success: false as const, error: 'Không tìm thấy công trình' }

    if (input.doi && input.doi !== existing.doi) {
      const conflict = await workRepo.findByDoi(input.doi)
      if (conflict) {
        return {
          success: false as const,
          error: `DOI đã tồn tại trong hệ thống: ${conflict.code}`,
        }
      }
    }

    const updated = await workRepo.update(id, input)

    await logAudit({
      userId,
      functionCode: 'CREATE_SCIENTIFIC_WORK',
      action: 'UPDATE',
      resourceType: 'SCIENTIFIC_WORK',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress,
    })

    return { success: true as const, data: updated }
  },

  async deleteWork(id: string, userId: string, ipAddress?: string) {
    const existing = await workRepo.findById(id)
    if (!existing) return { success: false as const, error: 'Không tìm thấy công trình' }

    await workRepo.softDelete(id)

    await logAudit({
      userId,
      functionCode: 'CREATE_SCIENTIFIC_WORK',
      action: 'DELETE',
      resourceType: 'SCIENTIFIC_WORK',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress,
    })

    return { success: true as const }
  },

  async importFromCrossref(input: CrossrefImportInput, userId: string, ipAddress?: string) {
    // Kiểm tra DOI đã tồn tại chưa
    const existing = await workRepo.findByDoi(input.doi)
    if (existing) {
      return {
        success: false as const,
        error: `DOI đã tồn tại trong hệ thống: ${existing.code}`,
        data: existing,
      }
    }

    const meta = await fetchCrossrefByDoi(input.doi)
    if (!meta) {
      return {
        success: false as const,
        error: 'Không tìm thấy metadata từ CrossRef. Kiểm tra lại DOI.',
      }
    }

    if (!meta.title) {
      return {
        success: false as const,
        error: 'CrossRef không trả về tiêu đề cho DOI này.',
      }
    }

    const code = await generateWorkCode()
    const workType = mapCrossrefTypeToWorkType(meta.type)

    const created = await workRepo.create({
      code,
      type: workType,
      title: meta.title,
      subtitle: meta.subtitle,
      doi: meta.doi,
      isbn: meta.isbn?.[0],
      issn: meta.issn?.[0],
      journalName: meta.journalName,
      year: meta.year ?? new Date().getFullYear(),
      edition: 1,
      sensitivity: 'NORMAL',
      authors: meta.authors.map((a, idx) => ({
        authorName: [a.given, a.family].filter(Boolean).join(' ') || a.name || 'Unknown',
        role: idx === 0 ? 'LEAD' : ('CO_AUTHOR' as any),
        orderNum: idx + 1,
        affiliation: a.affiliation?.[0]?.name,
      })),
    })

    await logAudit({
      userId,
      functionCode: 'IMPORT_FROM_CROSSREF',
      action: 'CREATE',
      resourceType: 'SCIENTIFIC_WORK',
      resourceId: created!.id,
      result: 'SUCCESS',
      ipAddress,
      metadata: { doi: input.doi, code },
    })

    return { success: true as const, data: created, meta }
  },

  async checkDuplicate(input: DuplicateCheckInput) {
    const candidates = await workRepo.findByTitleLike(input.title)

    const scored = candidates
      .map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        doi: c.doi,
        year: c.year,
        similarity: titleSimilarity(input.title, c.title),
      }))
      .filter((c) => c.similarity >= input.threshold)
      .sort((a, b) => b.similarity - a.similarity)

    return {
      success: true as const,
      data: {
        isDuplicate: scored.length > 0,
        threshold: input.threshold,
        matches: scored,
        note: scored.length > 0
          ? `Phát hiện ${scored.length} công trình tương tự (ngưỡng ${input.threshold}). Phase 5 sẽ bổ sung vector embedding để tăng độ chính xác.`
          : 'Không phát hiện trùng lặp với ngưỡng hiện tại.',
      },
    }
  },
}
