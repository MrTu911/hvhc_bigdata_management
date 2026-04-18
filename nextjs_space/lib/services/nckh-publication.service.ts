/**
 * NckhPublicationService – Module M09 UC-46
 * Business logic cho công bố khoa học và sáng kiến.
 */
import 'server-only'
import { BaseService, ScopedQueryOptions, ServiceResult } from './base-service'
import {
  nckhPublicationRepo,
  type NckhPublicationFilter,
  type PublicationAuthorCreateData,
} from '@/lib/repositories/nckh/nckh-publication.repo'
import {
  nckhPublicationCreateSchema,
  nckhPublicationUpdateSchema,
  type NckhPublicationCreateInput,
  type NckhPublicationUpdateInput,
} from '@/lib/validations/nckh-publication'
import { importFromBibTex, importFromExcelRows } from '@/lib/utils/publication-importer'
import {
  buildCsvExport,
  buildBqpExcelExport,
  buildHdcgsnnExcelExport,
  type PublicationExportRow,
} from '@/lib/utils/publication-exporter'
import { scientistProfileService } from './scientist-profile.service'
import { onPublicationPublished } from './science/eis-publication-hook.service'

class NckhPublicationServiceClass extends BaseService {
  protected readonly resourceType = 'NCKH_PUBLICATION'

  // ─── List ──────────────────────────────────────────────────────────────────

  async listPublications(
    options: ScopedQueryOptions,
    params: {
      keyword?: string
      pubType?: string
      year?: number
      unitId?: string
      projectId?: string
      ranking?: string
      isISI?: boolean
      isScopus?: boolean
      page?: number
      limit?: number
    }
  ): Promise<ServiceResult<unknown[]>> {
    try {
      const scopeFilter = await this._buildPublicationScopeFilter(options)

      const result = await nckhPublicationRepo.findMany({
        ...params,
        pubType: params.pubType as NckhPublicationFilter['pubType'],
        ...scopeFilter,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      })

      return {
        success: true,
        data: result.publications,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      }
    } catch (error) {
      console.error('[NckhPublicationService.listPublications]', error)
      return { success: false, error: 'Lỗi khi tải danh sách công bố' }
    }
  }

  // ─── Detail ────────────────────────────────────────────────────────────────

  async getPublicationById(
    options: ScopedQueryOptions,
    id: string
  ): Promise<ServiceResult<unknown>> {
    try {
      const pub = await nckhPublicationRepo.findById(id)
      if (!pub) return { success: false, error: 'Không tìm thấy công bố' }

      const access = await this.canAccessResource(options, pub.authorId, pub.unitId ?? undefined)
      if (!access.allowed) return { success: false, error: 'Không có quyền xem công bố này' }

      return { success: true, data: pub }
    } catch (error) {
      console.error('[NckhPublicationService.getPublicationById]', error)
      return { success: false, error: 'Lỗi khi tải chi tiết công bố' }
    }
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  async createPublication(
    options: ScopedQueryOptions,
    rawInput: NckhPublicationCreateInput
  ): Promise<ServiceResult<unknown>> {
    try {
      const parsed = nckhPublicationCreateSchema.safeParse(rawInput)
      if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0].message }
      }
      const input = parsed.data
      const { publicationAuthors, ...fields } = input

      const pub = await nckhPublicationRepo.create(
        {
          ...fields,
          authorId: options.user.id,
          publishedAt: fields.publishedAt ? new Date(fields.publishedAt) : null,
          patentGrantDate: fields.patentGrantDate ? new Date(fields.patentGrantDate) : null,
        },
        publicationAuthors?.map((a) => ({
          userId: a.userId ?? null,
          authorName: a.authorName,
          authorOrder: a.authorOrder,
          affiliation: a.affiliation ?? null,
          isInternal: a.isInternal ?? false,
        }))
      )

      // Fire-and-forget: cập nhật chỉ số NckhScientistProfile sau khi tạo công bố
      void scientistProfileService.computeStats(options.user.id).catch((err) =>
        console.error('[NckhPublicationService] computeStats after create failed:', err)
      )

      return { success: true, data: pub }
    } catch (error) {
      console.error('[NckhPublicationService.createPublication]', error)
      return { success: false, error: 'Lỗi khi tạo công bố' }
    }
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async updatePublication(
    options: ScopedQueryOptions,
    id: string,
    rawInput: NckhPublicationUpdateInput
  ): Promise<ServiceResult<unknown>> {
    try {
      const pub = await nckhPublicationRepo.findById(id)
      if (!pub) return { success: false, error: 'Không tìm thấy công bố' }

      const access = await this.canAccessResource(options, pub.authorId, pub.unitId ?? undefined)
      if (!access.allowed) return { success: false, error: 'Không có quyền cập nhật công bố này' }

      const parsed = nckhPublicationUpdateSchema.safeParse(rawInput)
      if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0].message }
      }
      const { publicationAuthors, ...fields } = parsed.data

      const updated = await nckhPublicationRepo.update(id, {
        ...fields,
        publishedAt: fields.publishedAt ? new Date(fields.publishedAt) : undefined,
        patentGrantDate: fields.patentGrantDate ? new Date(fields.patentGrantDate) : undefined,
      })

      // Fire-and-forget EIS update when status transitions to PUBLISHED
      if (fields.status === 'PUBLISHED' && pub.status !== 'PUBLISHED') {
        void onPublicationPublished(id, pub.authorId).catch((err) =>
          console.error('[NckhPublicationService] EIS hook failed:', err)
        )
      }

      // Nếu có danh sách tác giả mới → thay thế toàn bộ
      if (publicationAuthors !== undefined) {
        await nckhPublicationRepo.replaceAuthors(
          id,
          publicationAuthors.map((a) => ({
            userId: a.userId ?? null,
            authorName: a.authorName,
            authorOrder: a.authorOrder,
            affiliation: a.affiliation ?? null,
            isInternal: a.isInternal ?? false,
          }))
        )
      }

      // Trả lại bản ghi mới nhất (sau khi replaceAuthors)
      const fresh = await nckhPublicationRepo.findById(id)
      return { success: true, data: fresh }
    } catch (error) {
      console.error('[NckhPublicationService.updatePublication]', error)
      return { success: false, error: 'Lỗi khi cập nhật công bố' }
    }
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  async deletePublication(
    options: ScopedQueryOptions,
    id: string
  ): Promise<ServiceResult<null>> {
    try {
      const pub = await nckhPublicationRepo.findById(id)
      if (!pub) return { success: false, error: 'Không tìm thấy công bố' }

      const access = await this.canAccessResource(options, pub.authorId, pub.unitId ?? undefined)
      if (!access.allowed) return { success: false, error: 'Không có quyền xóa công bố này' }

      const authorId = pub.authorId
      await nckhPublicationRepo.delete(id)

      // Fire-and-forget: cập nhật chỉ số NckhScientistProfile sau khi xóa công bố
      void scientistProfileService.computeStats(authorId).catch((err) =>
        console.error('[NckhPublicationService] computeStats after delete failed:', err)
      )

      return { success: true, data: null }
    } catch (error) {
      console.error('[NckhPublicationService.deletePublication]', error)
      return { success: false, error: 'Lỗi khi xóa công bố' }
    }
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  async getStats(options: ScopedQueryOptions): Promise<ServiceResult<unknown>> {
    try {
      const scopeFilter = await this._buildPublicationScopeFilter(options)
      const counts = await nckhPublicationRepo.countByType({
        unitId: scopeFilter.unitId,
        scopeAuthorId: scopeFilter.scopeAuthorId,
      })
      const byType = counts.reduce(
        (acc, c) => ({ ...acc, [c.pubType]: c._count.id }),
        {} as Record<string, number>
      )
      const total = Object.values(byType).reduce((a, b) => a + b, 0)
      return { success: true, data: { total, byType } }
    } catch (error) {
      console.error('[NckhPublicationService.getStats]', error)
      return { success: false, error: 'Lỗi khi tải thống kê công bố' }
    }
  }

  // ─── Import ────────────────────────────────────────────────────────────────

  /**
   * Import từ BibTeX text.
   * Trả về số lượng thành công / thất bại; không import lại nếu DOI đã tồn tại.
   */
  async importFromBibTex(
    options: ScopedQueryOptions,
    bibtexText: string
  ): Promise<ServiceResult<{ imported: number; failed: number; errors: unknown[] }>> {
    try {
      const { success: parsed, errors, totalRows } = importFromBibTex(bibtexText)

      let imported = 0
      const failedDetails: unknown[] = errors.map((e) => e)

      for (const pub of parsed) {
        const input: NckhPublicationCreateInput = {
          title: pub.title,
          pubType: pub.pubType,
          publishedYear: pub.publishedYear,
          authorsText: pub.authorsText,
          doi: pub.doi,
          issn: pub.issn,
          isbn: pub.isbn,
          journal: pub.journal,
          volume: pub.volume,
          issue: pub.issue,
          pages: pub.pages,
          publisher: pub.publisher,
          conferenceName: pub.conferenceName,
          proceedingName: pub.proceedingName,
          advisorName: pub.advisorName,
          abstract: pub.abstract,
          keywords: pub.keywords ?? [],
          isISI: false,
          isScopus: false,
          citationCount: 0,
        }
        const result = await this.createPublication(options, input)
        if (result.success) {
          imported++
        } else {
          failedDetails.push({ citeKey: pub._citeKey, reason: result.error })
        }
      }

      return {
        success: true,
        data: { imported, failed: totalRows - imported, errors: failedDetails },
      }
    } catch (error) {
      console.error('[NckhPublicationService.importFromBibTex]', error)
      return { success: false, error: 'Lỗi khi import BibTeX' }
    }
  }

  /**
   * Import từ mảng Excel rows (caller tự parse file → rows trước khi gọi).
   * rows: mỗi phần tử là { [headerVietnamese]: cellValue }
   */
  async importFromExcel(
    options: ScopedQueryOptions,
    rows: Record<string, unknown>[]
  ): Promise<ServiceResult<{ imported: number; failed: number; errors: unknown[] }>> {
    try {
      const { success: parsed, errors, totalRows } = importFromExcelRows(rows)

      let imported = 0
      const failedDetails: unknown[] = errors.map((e) => e)

      for (const pub of parsed) {
        const input: NckhPublicationCreateInput = {
          title: pub.title,
          pubType: pub.pubType,
          publishedYear: pub.publishedYear,
          authorsText: pub.authorsText,
          doi: pub.doi,
          issn: pub.issn,
          isbn: pub.isbn,
          journal: pub.journal,
          volume: pub.volume,
          issue: pub.issue,
          pages: pub.pages,
          publisher: pub.publisher,
          conferenceName: pub.conferenceName,
          proceedingName: pub.proceedingName,
          advisorName: pub.advisorName,
          defenseScore: pub.defenseScore,
          impactFactor: pub.impactFactor,
          keywords: pub.keywords ?? [],
          isISI: false,
          isScopus: false,
          citationCount: 0,
        }
        const result = await this.createPublication(options, input)
        if (result.success) {
          imported++
        } else {
          failedDetails.push({ row: pub._citeKey, reason: result.error })
        }
      }

      return {
        success: true,
        data: { imported, failed: totalRows - imported, errors: failedDetails },
      }
    } catch (error) {
      console.error('[NckhPublicationService.importFromExcel]', error)
      return { success: false, error: 'Lỗi khi import Excel' }
    }
  }

  // ─── Export ────────────────────────────────────────────────────────────────

  async exportPublications(
    options: ScopedQueryOptions,
    params: {
      pubType?: string
      year?: number
      unitId?: string
      projectId?: string
      format: 'csv' | 'bqp' | 'hdcgsnn'
    }
  ): Promise<ServiceResult<Buffer>> {
    try {
      const scopeFilter = await this._buildPublicationScopeFilter(options)

      // Lấy tất cả (không pagination) cho export
      const result = await nckhPublicationRepo.findMany({
        pubType: params.pubType as NckhPublicationFilter['pubType'],
        year: params.year,
        unitId: params.unitId ?? scopeFilter.unitId,
        projectId: params.projectId,
        scopeAuthorId: scopeFilter.scopeAuthorId,
        page: 1,
        limit: 10000,
      })

      const rows: PublicationExportRow[] = result.publications.map((p, i) => ({
        stt: i + 1,
        title: p.title,
        pubType: p.pubType,
        publishedYear: p.publishedYear ?? 0,
        authorsText: p.authorsText,
        journal: p.journal,
        doi: p.doi,
        isISI: p.isISI,
        isScopus: p.isScopus,
        scopusQ: p.scopusQ,
        impactFactor: p.impactFactor,
        ranking: p.ranking,
        citationCount: p.citationCount,
        unitId: p.unitId,
        projectCode: p.project?.projectCode ?? null,
      }))

      let buffer: Buffer
      if (params.format === 'bqp') {
        buffer = await buildBqpExcelExport(rows)
      } else if (params.format === 'hdcgsnn') {
        buffer = await buildHdcgsnnExcelExport(rows)
      } else {
        buffer = buildCsvExport(rows)
      }

      return { success: true, data: buffer }
    } catch (error) {
      console.error('[NckhPublicationService.exportPublications]', error)
      return { success: false, error: 'Lỗi khi xuất danh sách công bố' }
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async _buildPublicationScopeFilter(
    options: ScopedQueryOptions
  ): Promise<{ unitId?: string; scopeAuthorId?: string }> {
    const { user, scope } = options
    if (scope === 'SELF') return { scopeAuthorId: user.id }
    if (scope === 'ACADEMY') return {}
    // UNIT / DEPARTMENT – dùng unitId của user
    const unitFilter = await this.getScopedUnitFilter(options)
    const unitId =
      'unitId' in unitFilter && unitFilter.unitId?.in?.length
        ? unitFilter.unitId.in[0]
        : undefined
    return { unitId }
  }
}

export const nckhPublicationService = new NckhPublicationServiceClass()
