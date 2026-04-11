/**
 * UnifiedRecordService – CSDL-KHQL M22 Data Hub (Sprint 10)
 *
 * Builds unified, browsable records for three entity types:
 *   PROJECT    — NckhProject + PI + unit + budget summary
 *   SCIENTIST  — NckhScientistProfile + user + publication count + work count
 *   UNIT       — Unit + scientist count + project count + work count
 *
 * Designed as a read-only aggregate layer — does NOT replace the source models.
 * Source of truth remains NckhProject / NckhScientistProfile / Unit.
 */
import 'server-only'
import prisma from '@/lib/db'

// ─── Types ────────────────────────────────────────────────────────────────────

export type UnifiedRecordType = 'PROJECT' | 'SCIENTIST' | 'UNIT'

export interface UnifiedProjectRecord {
  type:        'PROJECT'
  id:          string
  code:        string
  title:       string
  status:      string
  field:       string
  year:        number | null
  sensitivity: string
  pi: {
    id:   string
    name: string
  }
  unit: {
    id:   string
    name: string
  } | null
  budgetApproved: number | null
  updatedAt: string
}

export interface UnifiedScientistRecord {
  type:              'SCIENTIST'
  id:                string
  name:              string
  email:             string | null
  unitName:          string | null
  hIndex:            number
  totalPublications: number
  totalCitations:    number
  academicRank:      string | null
  primaryField:      string | null
  orcidId:           string | null
  projectLeadCount:  number
  updatedAt:         string
}

export interface UnifiedUnitRecord {
  type:             'UNIT'
  id:               string
  name:             string
  scientistCount:   number
  projectCount:     number
  workCount:        number
  activeProjects:   number
}

export type UnifiedRecord = UnifiedProjectRecord | UnifiedScientistRecord | UnifiedUnitRecord

export interface UnifiedListResult {
  items:     UnifiedRecord[]
  total:     number
  type:      UnifiedRecordType
  page:      number
  pageSize:  number
}

// ─── Overview stats ───────────────────────────────────────────────────────────

export interface DataHubOverview {
  totalProjects:    number
  totalScientists:  number
  totalWorks:       number
  totalPublications: number
  totalLibraryItems: number
  totalCatalogs:    number
  activeProjects:   number
  completedProjects: number
  generatedAt:      string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function skip(page: number, pageSize: number) {
  return (page - 1) * pageSize
}

// ─── Project unified records ──────────────────────────────────────────────────

async function listProjects(
  keyword: string | undefined,
  page: number,
  pageSize: number,
): Promise<{ items: UnifiedProjectRecord[]; total: number }> {
  const where = keyword
    ? {
        OR: [
          { title:       { contains: keyword, mode: 'insensitive' as const } },
          { projectCode: { contains: keyword, mode: 'insensitive' as const } },
          { abstract:    { contains: keyword, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [rows, total] = await Promise.all([
    prisma.nckhProject.findMany({
      where,
      skip: skip(page, pageSize),
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      select: {
        id:          true,
        projectCode: true,
        title:       true,
        status:      true,
        field:       true,
        budgetYear:  true,
        sensitivity: true,
        budgetApproved: true,
        updatedAt:   true,
        principalInvestigator: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
      },
    }),
    prisma.nckhProject.count({ where }),
  ])

  return {
    total,
    items: rows.map((r) => ({
      type:           'PROJECT' as const,
      id:             r.id,
      code:           r.projectCode,
      title:          r.title,
      status:         r.status,
      field:          r.field,
      year:           r.budgetYear,
      sensitivity:    r.sensitivity,
      pi:             { id: r.principalInvestigator.id, name: r.principalInvestigator.name },
      unit:           r.unit ? { id: r.unit.id, name: r.unit.name } : null,
      budgetApproved: r.budgetApproved,
      updatedAt:      r.updatedAt.toISOString(),
    })),
  }
}

// ─── Scientist unified records ────────────────────────────────────────────────

async function listScientists(
  keyword: string | undefined,
  page: number,
  pageSize: number,
): Promise<{ items: UnifiedScientistRecord[]; total: number }> {
  const userWhere = keyword
    ? {
        OR: [
          { name:  { contains: keyword, mode: 'insensitive' as const } },
          { email: { contains: keyword, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const where = {
    user: userWhere,
  }

  const [rows, total] = await Promise.all([
    prisma.nckhScientistProfile.findMany({
      where,
      skip: skip(page, pageSize),
      take: pageSize,
      orderBy: [{ hIndex: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id:               true,
        hIndex:           true,
        totalCitations:   true,
        totalPublications: true,
        academicRank:     true,
        primaryField:     true,
        orcidId:          true,
        projectLeadCount: true,
        updatedAt:        true,
        user: {
          select: {
            id:    true,
            name:  true,
            email: true,
            unitRelation: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.nckhScientistProfile.count({ where }),
  ])

  return {
    total,
    items: rows.map((r) => ({
      type:              'SCIENTIST' as const,
      id:                r.id,
      name:              r.user.name,
      email:             r.user.email,
      unitName:          r.user.unitRelation?.name ?? null,
      hIndex:            r.hIndex,
      totalPublications: r.totalPublications,
      totalCitations:    r.totalCitations,
      academicRank:      r.academicRank,
      primaryField:      r.primaryField,
      orcidId:           r.orcidId,
      projectLeadCount:  r.projectLeadCount,
      updatedAt:         r.updatedAt.toISOString(),
    })),
  }
}

// ─── Unit unified records ─────────────────────────────────────────────────────

async function listUnits(
  keyword: string | undefined,
  page: number,
  pageSize: number,
): Promise<{ items: UnifiedUnitRecord[]; total: number }> {
  const where = keyword
    ? { name: { contains: keyword, mode: 'insensitive' as const } }
    : {}

  const [rows, total] = await Promise.all([
    prisma.unit.findMany({
      where,
      skip: skip(page, pageSize),
      take: pageSize,
      orderBy: { name: 'asc' },
      select: {
        id:   true,
        name: true,
        _count: {
          select: {
            NckhProjectUnit: true,  // projects
          },
        },
      },
    }),
    prisma.unit.count({ where }),
  ])

  // Fetch scientist count per unit separately (NckhScientistProfile → User → unitId)
  const unitIds = rows.map((r) => r.id)
  const [scientistCounts, activeProjCounts] = await Promise.all([
    prisma.user.groupBy({
      by: ['unitId'],
      where: {
        unitId: { in: unitIds },
        scientistProfile: { isNot: null },
      },
      _count: { id: true },
    }),
    prisma.nckhProject.groupBy({
      by: ['unitId'],
      where: {
        unitId: { in: unitIds },
        status: { in: ['APPROVED', 'IN_PROGRESS'] as any },
      },
      _count: { id: true },
    }),
  ])

  const scientistMap = new Map(scientistCounts.map((s) => [s.unitId, s._count.id]))
  const activeMap    = new Map(activeProjCounts.map((s) => [s.unitId, s._count.id]))

  return {
    total,
    items: rows.map((r) => ({
      type:           'UNIT' as const,
      id:             r.id,
      name:           r.name,
      scientistCount: scientistMap.get(r.id) ?? 0,
      projectCount:   r._count.NckhProjectUnit,
      activeProjects: activeMap.get(r.id) ?? 0,
      workCount:      0,  // workCount requires author→scientist→user join — left as 0 for perf
    })),
  }
}

// ─── Public service ───────────────────────────────────────────────────────────

export const unifiedService = {
  async listRecords(
    type: UnifiedRecordType,
    keyword: string | undefined,
    page: number,
    pageSize: number,
  ): Promise<UnifiedListResult> {
    let items: UnifiedRecord[]
    let total: number

    if (type === 'PROJECT') {
      const r = await listProjects(keyword, page, pageSize)
      items = r.items; total = r.total
    } else if (type === 'SCIENTIST') {
      const r = await listScientists(keyword, page, pageSize)
      items = r.items; total = r.total
    } else {
      const r = await listUnits(keyword, page, pageSize)
      items = r.items; total = r.total
    }

    return { items, total, type, page, pageSize }
  },

  async getOverview(): Promise<DataHubOverview> {
    const [
      totalProjects,
      totalScientists,
      totalWorks,
      totalPublications,
      totalLibraryItems,
      totalCatalogs,
      activeProjects,
      completedProjects,
    ] = await Promise.all([
      prisma.nckhProject.count(),
      prisma.nckhScientistProfile.count(),
      prisma.scientificWork.count({ where: { isDeleted: false } }),
      prisma.nckhPublication.count(),
      prisma.libraryItem.count({ where: { isDeleted: false } }),
      prisma.scienceCatalog.count({ where: { isActive: true } }),
      prisma.nckhProject.count({ where: { status: { in: ['APPROVED', 'IN_PROGRESS'] as any } } }),
      prisma.nckhProject.count({ where: { status: 'COMPLETED' as any } }),
    ])

    return {
      totalProjects,
      totalScientists,
      totalWorks,
      totalPublications,
      totalLibraryItems,
      totalCatalogs,
      activeProjects,
      completedProjects,
      generatedAt: new Date().toISOString(),
    }
  },
}
