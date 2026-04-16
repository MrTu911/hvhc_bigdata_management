/**
 * DashboardStatsService – M11 Phase 1
 *
 * Orchestrate parallel queries đến các module nguồn để lấy KPI tổng hợp
 * theo role. Scope filter bắt buộc – không được bỏ qua.
 *
 * Không phải source of truth. Chỉ aggregate read-model cho dashboard.
 */
import 'server-only'
import db from '@/lib/db'
import { getCache, setCache, CACHE_TTL } from '@/lib/cache'
import { buildDashboardScopeKey } from './dashboard-cache.service'

export interface DashboardScope {
  roleKey: string
  scope: string        // SELF | UNIT | DEPARTMENT | ACADEMY
  unitId?: string | null
  userId: string
}

// ─── Executive stats (Ban Giám đốc) ──────────────────────────────────────────

export interface ExecutiveStats {
  personnel: { total: number; active: number; officers: number }
  students: { total: number; avgGpa: number; warningCount: number }
  research: { activeProjects: number; publications: number }
  party: { total: number; feeDebtCount: number }
  workflow: { pendingCount: number; overdueCount: number }
  policy: { rewardPipeline: number }
}

export async function getExecutiveStats(scope: DashboardScope): Promise<ExecutiveStats> {
  const cacheKey = buildDashboardScopeKey(scope.roleKey, scope.scope, scope.unitId)
  const cached = await getCache<ExecutiveStats>(cacheKey)
  if (cached) return cached

  const unitFilter = scope.unitId ? { unitId: scope.unitId } : {}

  const [
    totalPersonnel,
    activePersonnel,
    officerCount,
    totalStudents,
    avgGpaResult,
    warningCount,
    activeResearch,
    publications,
    partyTotal,
    partyFeeDebt,
    workflowPending,
    rewardPipeline,
  ] = await Promise.all([
    db.user.count({ where: { ...unitFilter } }),
    db.user.count({ where: { ...unitFilter, workStatus: 'ACTIVE' } }),
    db.user.count({ where: { ...unitFilter, personnelType: 'OFFICER' } }),
    db.hocVien.count(),
    db.ketQuaHocTap.aggregate({ _avg: { diemTongKet: true } }),
    db.hocVien.count({ where: { academicStatus: { not: 'NORMAL' } } }).catch(() => 0),
    db.nckhProject.count({ where: { status: { in: ['APPROVED', 'IN_PROGRESS'] } } }).catch(() => 0),
    db.nckhPublication.count().catch(() => 0),
    db.partyMember.count().catch(() => 0),
    db.partyMember.count({ where: { currentDebtAmount: { gt: 0 } } }).catch(() => 0),
    db.workflowInstance
      .count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } })
      .catch(() => 0),
    db.policyRecord
      .count({ where: { recordType: { in: ['EMULATION', 'REWARD'] }, workflowStatus: 'PROPOSED' } })
      .catch(() => 0),
  ])

  const stats: ExecutiveStats = {
    personnel: { total: totalPersonnel, active: activePersonnel, officers: officerCount },
    students: {
      total: totalStudents,
      avgGpa: avgGpaResult._avg.diemTongKet
        ? parseFloat(avgGpaResult._avg.diemTongKet.toFixed(1))
        : 0,
      warningCount: warningCount as number,
    },
    research: { activeProjects: activeResearch as number, publications: publications as number },
    party: { total: partyTotal as number, feeDebtCount: partyFeeDebt as number },
    workflow: { pendingCount: workflowPending as number, overdueCount: 0 },
    policy: { rewardPipeline: rewardPipeline as number },
  }

  await setCache(cacheKey, stats, CACHE_TTL.DASHBOARD_DATA)
  return stats
}

// ─── Department stats (Trưởng phòng/khoa) ────────────────────────────────────

export interface DepartmentStats {
  unitPersonnel: { total: number; active: number }
  instructors: { total: number }
  workflowPending: number
  rewardPipeline: number
  activeResearch: number
}

export async function getDepartmentStats(scope: DashboardScope): Promise<DepartmentStats> {
  const cacheKey = buildDashboardScopeKey(scope.roleKey, scope.scope, scope.unitId) + ':dept'
  const cached = await getCache<DepartmentStats>(cacheKey)
  if (cached) return cached

  const unitFilter = scope.unitId ? { unitId: scope.unitId } : {}

  const [unitPersonnel, activePersonnel, instructors, workflowPending, rewardPipeline, activeResearch] =
    await Promise.all([
      db.user.count({ where: { ...unitFilter } }),
      db.user.count({ where: { ...unitFilter, workStatus: 'ACTIVE' } }),
      db.facultyProfile.count({ where: { ...(scope.unitId ? { unitId: scope.unitId } : {}), isActive: true } }),
      db.workflowInstance.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }).catch(() => 0),
      db.policyRecord
        .count({ where: { ...unitFilter, recordType: { in: ['EMULATION', 'REWARD'] }, workflowStatus: 'PROPOSED' } })
        .catch(() => 0),
      db.nckhProject
        .count({ where: { ...(scope.unitId ? { unitId: scope.unitId } : {}), status: { in: ['APPROVED', 'IN_PROGRESS'] } } })
        .catch(() => 0),
    ])

  const stats: DepartmentStats = {
    unitPersonnel: { total: unitPersonnel, active: activePersonnel },
    instructors: { total: instructors },
    workflowPending: workflowPending as number,
    rewardPipeline: rewardPipeline as number,
    activeResearch: activeResearch as number,
  }

  await setCache(cacheKey, stats, CACHE_TTL.DASHBOARD_DATA)
  return stats
}

// ─── Education stats (Phòng Đào tạo) ─────────────────────────────────────────

export interface EducationStats {
  students: { total: number; warningCount: number }
  gpaDistribution: Array<{ ketQua: string; count: number }>
  activeClassSections: number
  pendingGraduation: number
  avgGpa: number
}

export async function getEducationStats(scope: DashboardScope): Promise<EducationStats> {
  const cacheKey = buildDashboardScopeKey(scope.roleKey, scope.scope, scope.unitId) + ':edu'
  const cached = await getCache<EducationStats>(cacheKey)
  if (cached) return cached

  const [
    totalStudents,
    warningStudents,
    gpaRaw,
    avgGpaResult,
    activeSections,
    pendingGrad,
  ] = await Promise.all([
    db.hocVien.count(),
    db.hocVien.count({ where: { academicStatus: { not: 'NORMAL' } } }).catch(() => 0),
    db.ketQuaHocTap.groupBy({ by: ['ketQua'], _count: { id: true }, where: { ketQua: { not: null } } }),
    db.ketQuaHocTap.aggregate({ _avg: { diemTongKet: true } }),
    db.classSection.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
    db.hocVien.count({ where: { currentStatus: 'ACTIVE' } }).catch(() => 0),
  ])

  const stats: EducationStats = {
    students: { total: totalStudents, warningCount: warningStudents as number },
    gpaDistribution: gpaRaw.map(r => ({ ketQua: r.ketQua ?? 'Khác', count: r._count.id })),
    activeClassSections: activeSections as number,
    pendingGraduation: pendingGrad as number,
    avgGpa: avgGpaResult._avg.diemTongKet
      ? parseFloat(avgGpaResult._avg.diemTongKet.toFixed(1))
      : 0,
  }

  await setCache(cacheKey, stats, CACHE_TTL.DASHBOARD_DATA)
  return stats
}
