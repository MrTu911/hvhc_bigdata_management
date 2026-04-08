/**
 * ScientistProfileService – Module M09 UC-47
 * Tổng hợp hồ sơ nhà khoa học 360° từ nhiều nguồn dữ liệu.
 *
 * Nguồn dữ liệu:
 *   - User                  → tên, quân hàm, đơn vị
 *   - FacultyProfile        → học hàm, học vị, chuyên ngành
 *   - NckhScientistProfile  → chỉ số, lĩnh vực, từ khóa (owned by UC-47)
 *   - NckhPublication       → công bố (computed: totalPublications)
 *   - NckhMember            → đề tài (computed: projectLeadCount/memberCount)
 *   - AwardsRecord          → giải thưởng (display only)
 */
import 'server-only'
import { BaseService, ScopedQueryOptions, ServiceResult } from './base-service'
import {
  scientistProfileRepo,
  type ScientistFilter,
  type CapacityMapFilter,
} from '@/lib/repositories/nckh/scientist-profile.repo'
import {
  scientistProfileUpdateSchema,
  type ScientistProfileUpdateInput,
} from '@/lib/validators/scientist-profile.schema'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CapacityMapEntry {
  unitId: string | null
  unitName: string | null
  researchField: string
  scientistCount: number
  avgHIndex: number
  totalPublications: number
}

export interface CapacityMapData {
  byUnit: Array<{
    unitId: string | null
    unitName: string | null
    count: number
    avgHIndex: number
  }>
  byField: Array<{
    field: string
    count: number
    totalPublications: number
  }>
  byRank: Array<{
    rank: string
    count: number
  }>
  byDegree: Array<{
    degree: string
    count: number
    avgHIndex: number
  }>
  entries: CapacityMapEntry[]
}

// ─── Service ──────────────────────────────────────────────────────────────────

class ScientistProfileServiceClass extends BaseService {
  protected readonly resourceType = 'NCKH_SCIENTIST_PROFILE'

  // ── 1. List ────────────────────────────────────────────────────────────────

  async listScientists(
    options: ScopedQueryOptions,
    params: {
      keyword?: string
      unitId?: string
      specialization?: string
      researchField?: string
      degree?: string
      academicRank?: string
      page?: number
      limit?: number
    }
  ): Promise<ServiceResult<unknown[]>> {
    try {
      const filter: ScientistFilter = { ...params }

      // Scope: SELF → chỉ profile của chính mình
      if (options.scope === 'SELF') {
        filter.scopeUserId = options.user.id
      } else if (options.scope !== 'ACADEMY') {
        // UNIT / DEPARTMENT → lấy unit ids
        const unitFilter = await this.getScopedUnitFilter(options)
        if ('unitId' in unitFilter && unitFilter.unitId) {
          filter.unitIds = unitFilter.unitId.in
        }
      }

      const { items, total } = await scientistProfileRepo.findMany(filter)
      return this.createPaginatedResponse(items, total, {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      })
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  // ── 2. Detail – hồ sơ 360° ────────────────────────────────────────────────
  // Tổng hợp từ nhiều bảng vào một response duy nhất

  async getScientistProfile(
    options: ScopedQueryOptions,
    userId: string
  ): Promise<ServiceResult<unknown>> {
    try {
      const profile = await scientistProfileRepo.findByUserId(userId)
      if (!profile) {
        return { success: false, error: 'Không tìm thấy hồ sơ nhà khoa học' }
      }

      // RBAC: SELF chỉ xem của mình
      const access = await this.canAccessResource(
        options,
        userId,
        profile.user?.unitId ?? undefined
      )
      if (!access.allowed) {
        return { success: false, error: 'Không có quyền xem hồ sơ này' }
      }

      // Tổng hợp dữ liệu bổ sung song song
      const [recentPubs, recentProjects, awardsRecord] = await Promise.all([
        scientistProfileRepo.findRecentPublications(userId, 5),
        scientistProfileRepo.findRecentProjects(userId, 5),
        scientistProfileRepo.findAwardsRecord(userId),
      ])

      return {
        success: true,
        data: {
          ...profile,
          recentPublications: recentPubs,
          recentProjects: recentProjects,
          awardsRecord: awardsRecord,
        },
      }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  // ── 3. Update profile ──────────────────────────────────────────────────────

  async updateProfile(
    options: ScopedQueryOptions,
    userId: string,
    rawInput: unknown
  ): Promise<ServiceResult<unknown>> {
    try {
      // RBAC: SELF chỉ sửa của mình; SCIENTIST_UPDATE có thể sửa theo scope
      if (options.scope === 'SELF' && options.user.id !== userId) {
        return { success: false, error: 'Không có quyền cập nhật hồ sơ này' }
      }

      const parsed = scientistProfileUpdateSchema.safeParse(rawInput)
      if (!parsed.success) {
        return {
          success: false,
          error: parsed.error.issues.map((i) => i.message).join('; '),
        }
      }

      // Không cho phép update computed stats qua endpoint này
      // (totalPublications, projectLeadCount, projectMemberCount → dùng computeStats)
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ...updateData
      } = parsed.data satisfies ScientistProfileUpdateInput

      const updated = await scientistProfileRepo.upsert(userId, updateData as Record<string, unknown>)
      return { success: true, data: updated }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  // ── 4. Compute stats – computed fields từ NckhPublication + NckhMember ─────
  //
  // COMPUTED FIELDS:
  //   totalPublications  ← COUNT(NckhPublication where authorId = userId)
  //   projectLeadCount   ← COUNT(NckhMember where userId AND role = CHU_NHIEM)
  //   projectMemberCount ← COUNT(NckhMember where userId)
  //
  // KHÔNG computed (manual / hook UC-48):
  //   hIndex, i10Index, totalCitations ← tự nhập hoặc Scopus/ORCID sync

  async computeStats(userId: string): Promise<ServiceResult<{
    totalPublications: number
    projectLeadCount: number
    projectMemberCount: number
  }>> {
    try {
      const [totalPublications, { leadCount, memberCount }] = await Promise.all([
        scientistProfileRepo.countUserPublications(userId),
        scientistProfileRepo.countUserProjectMemberships(userId),
      ])

      await scientistProfileRepo.updateStats(userId, {
        totalPublications,
        projectLeadCount: leadCount,
        projectMemberCount: memberCount,
      })

      return {
        success: true,
        data: {
          totalPublications,
          projectLeadCount: leadCount,
          projectMemberCount: memberCount,
        },
      }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  // ── 5. Batch refresh stats – ADMIN only ────────────────────────────────────
  //
  // BATCH REFRESH: cần chạy định kỳ (cron / admin trigger) vì:
  //   - mỗi khi có NckhPublication mới (UC-46) → totalPublications lỗi thời
  //   - mỗi khi có NckhMember thay đổi (UC-45) → projectLeadCount lỗi thời
  // Gọi computeStats(userId) cho từng nhà khoa học.

  async batchRefreshStats(options: ScopedQueryOptions): Promise<ServiceResult<{
    refreshed: number
    failed: number
    errors: string[]
  }>> {
    try {
      if (options.scope !== 'ACADEMY') {
        return { success: false, error: 'Chỉ Admin có quyền chạy batch refresh' }
      }

      const userIds = await scientistProfileRepo.findAllUserIds()

      // Parallel với allSettled để không block lẫn nhau
      // Giới hạn concurrency 20 để tránh quá tải DB
      const CHUNK = 20
      let refreshed = 0
      let failed = 0
      const errors: string[] = []

      for (let i = 0; i < userIds.length; i += CHUNK) {
        const chunk = userIds.slice(i, i + CHUNK)
        const results = await Promise.allSettled(chunk.map((uid) => this.computeStats(uid)))
        for (let j = 0; j < results.length; j++) {
          const r = results[j]
          if (r.status === 'fulfilled' && r.value.success) {
            refreshed++
          } else {
            failed++
            const reason = r.status === 'rejected'
              ? String(r.reason)
              : r.value.error ?? 'unknown'
            errors.push(`userId=${chunk[j]}: ${reason}`)
          }
        }
      }

      return { success: true, data: { refreshed, failed, errors } }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  // ── 6. Capacity map ────────────────────────────────────────────────────────
  //
  // Tổng hợp bản đồ năng lực nghiên cứu theo 3 chiều:
  //   byUnit      → phân bố nhà khoa học theo đơn vị
  //   byField     → phân bố theo lĩnh vực nghiên cứu
  //   byRank      → phân bố theo học hàm
  //   entries     → raw entries cho scatter / heatmap

  async getCapacityMap(
    options: ScopedQueryOptions,
    filter: CapacityMapFilter = {}
  ): Promise<ServiceResult<CapacityMapData>> {
    try {
      // Capacity map: SELF không có ý nghĩa ở đây → trả về chỉ bản thân
      // UNIT/DEPT → filter theo unit; ACADEMY → toàn bộ
      const effectiveFilter: CapacityMapFilter = { ...filter }
      if (options.scope === 'SELF') {
        // chỉ trả profile của bản thân, không phải map toàn đơn vị
        effectiveFilter.unitId = options.user.unitId ?? undefined
      } else if (options.scope !== 'ACADEMY' && !effectiveFilter.unitId) {
        const unitFilter = await this.getScopedUnitFilter(options)
        // Với UNIT scope, lấy đơn vị đầu tiên trong danh sách
        if ('unitId' in unitFilter && unitFilter.unitId) {
          effectiveFilter.unitId = unitFilter.unitId.in[0]
        }
      }

      const rows = await scientistProfileRepo.findAllForCapacityMap(effectiveFilter)

      // Aggregate byUnit
      const unitMap = new Map<string | null, { name: string | null; count: number; hSum: number }>()
      // Aggregate byField
      const fieldMap = new Map<string, { count: number; pubSum: number }>()
      // Aggregate byRank
      const rankMap = new Map<string, number>()
      // Aggregate byDegree
      const degreeMap = new Map<string, { count: number; hSum: number }>()
      // Raw entries
      const entries: CapacityMapEntry[] = []

      for (const row of rows) {
        const unitId = row.user.unitId ?? null
        const unitName = row.user.unitRelation?.name ?? null

        // byUnit
        const uEntry = unitMap.get(unitId) ?? { name: unitName, count: 0, hSum: 0 }
        uEntry.count++
        uEntry.hSum += row.hIndex
        unitMap.set(unitId, uEntry)

        // byField
        for (const field of row.researchFields) {
          const fEntry = fieldMap.get(field) ?? { count: 0, pubSum: 0 }
          fEntry.count++
          fEntry.pubSum += row.totalPublications
          fieldMap.set(field, fEntry)

          entries.push({
            unitId,
            unitName,
            researchField: field,
            scientistCount: 1,       // raw – caller có thể rollup
            avgHIndex: row.hIndex,   // raw
            totalPublications: row.totalPublications,
          })
        }

        // byRank (học hàm: GS, PGS, ...)
        if (row.academicRank) {
          rankMap.set(row.academicRank, (rankMap.get(row.academicRank) ?? 0) + 1)
        }

        // byDegree (học vị: TS, ThS, ...)
        if (row.degree) {
          const dEntry = degreeMap.get(row.degree) ?? { count: 0, hSum: 0 }
          dEntry.count++
          dEntry.hSum += row.hIndex
          degreeMap.set(row.degree, dEntry)
        }
      }

      const data: CapacityMapData = {
        byUnit: Array.from(unitMap.entries()).map(([unitId, v]) => ({
          unitId,
          unitName: v.name,
          count: v.count,
          avgHIndex: v.count > 0 ? Math.round((v.hSum / v.count) * 10) / 10 : 0,
        })),
        byField: Array.from(fieldMap.entries()).map(([field, v]) => ({
          field,
          count: v.count,
          totalPublications: v.pubSum,
        })).sort((a, b) => b.count - a.count),
        byRank: Array.from(rankMap.entries()).map(([rank, count]) => ({ rank, count })),
        byDegree: Array.from(degreeMap.entries()).map(([degree, v]) => ({
          degree,
          count: v.count,
          avgHIndex: v.count > 0 ? Math.round((v.hSum / v.count) * 10) / 10 : 0,
        })),
        entries,
      }

      return { success: true, data }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  // ── 7. Mirror từ FacultyProfile (sync helper) ──────────────────────────────
  //
  // Khi FacultyProfile cập nhật academicRank/academicDegree/specialization,
  // có thể gọi hàm này để giữ NckhScientistProfile đồng bộ.
  // Đây là abstraction point – chưa có trigger tự động.

  async syncFromFacultyProfile(userId: string): Promise<ServiceResult<unknown>> {
    try {
      const facultyProfile = await scientistProfileRepo.findFacultyProfileForSync(userId)

      if (!facultyProfile) {
        return { success: false, error: 'Không tìm thấy FacultyProfile' }
      }

      const syncData: Record<string, unknown> = {}
      if (facultyProfile.academicRank) syncData.academicRank = facultyProfile.academicRank
      if (facultyProfile.academicDegree) syncData.degree = facultyProfile.academicDegree
      if (facultyProfile.specialization) syncData.specialization = facultyProfile.specialization
      if (facultyProfile.orcidId) syncData.orcidId = facultyProfile.orcidId

      const updated = await scientistProfileRepo.upsert(userId, syncData)
      return { success: true, data: updated }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }
}

export const scientistProfileService = new ScientistProfileServiceClass()
