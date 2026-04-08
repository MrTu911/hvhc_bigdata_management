/**
 * NckhProjectRepo – Module M09 UC-45
 * Data access layer cho NckhProject, NckhMember.
 * Chỉ làm query/filter/pagination – không chứa business logic hay workflow.
 */
import 'server-only'
import db from '@/lib/db'
import type {
  NckhProjectStatus,
  NckhProjectPhase,
  NckhCategory,
  NckhField,
  NckhType,
  NckhMemberRole,
} from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NckhProjectListFilter {
  search?: string
  status?: NckhProjectStatus
  phase?: NckhProjectPhase
  category?: NckhCategory
  field?: NckhField
  budgetYear?: number
  unitId?: string
  principalInvestigatorId?: string
  /** RBAC scope – nếu có thì chỉ trả project thuộc userId này (SELF scope) */
  scopeUserId?: string
  page?: number
  limit?: number
}

export interface NckhProjectCreateData {
  projectCode: string
  title: string
  titleEn?: string | null
  abstract?: string | null
  keywords?: string[]
  category: NckhCategory
  field: NckhField
  researchType: NckhType
  principalInvestigatorId: string
  unitId?: string | null
  budgetRequested?: number | null
  budgetYear?: number | null
  startDate?: Date | null
  endDate?: Date | null
}

export interface NckhProjectUpdateData {
  title?: string
  titleEn?: string | null
  abstract?: string | null
  keywords?: string[]
  field?: NckhField
  researchType?: NckhType
  unitId?: string | null
  budgetRequested?: number | null
  budgetApproved?: number | null
  budgetUsed?: number | null
  budgetYear?: number | null
  startDate?: Date | null
  endDate?: Date | null
  actualEndDate?: Date | null
}

// ─── Project selects ──────────────────────────────────────────────────────────

const projectListSelect = {
  id: true,
  projectCode: true,
  title: true,
  titleEn: true,
  category: true,
  field: true,
  researchType: true,
  status: true,
  phase: true,
  budgetRequested: true,
  budgetApproved: true,
  budgetYear: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
  principalInvestigatorId: true,
  unitId: true,
  principalInvestigator: {
    select: { id: true, name: true, rank: true, militaryId: true },
  },
  unit: {
    select: { id: true, name: true, code: true },
  },
  _count: {
    select: { members: true, milestones: true, publications: true },
  },
} as const

const projectDetailSelect = {
  ...projectListSelect,
  abstract: true,
  keywords: true,
  budgetUsed: true,
  actualEndDate: true,
  bqpProjectCode: true,
  submittedAt: true,
  submittedBy: true,
  approvedAt: true,
  approvedBy: true,
  approverNote: true,
  rejectedAt: true,
  rejectedBy: true,
  rejectReason: true,
  completionScore: true,
  completionGrade: true,
  members: {
    include: {
      user: {
        select: { id: true, name: true, rank: true, militaryId: true, department: true },
      },
    },
    orderBy: { joinDate: 'asc' as const },
  },
  milestones: {
    orderBy: { dueDate: 'asc' as const },
  },
  reviews: {
    orderBy: { reviewDate: 'desc' as const },
  },
  publications: {
    include: {
      author: { select: { id: true, name: true, rank: true } },
    },
    orderBy: { publishedYear: 'desc' as const },
  },
} as const

// ─── Repository ───────────────────────────────────────────────────────────────

export const nckhProjectRepo = {
  // ─ Queries ──────────────────────────────────────────────────────────────────

  async findMany(filter: NckhProjectListFilter = {}) {
    const {
      search,
      status,
      phase,
      category,
      field,
      budgetYear,
      unitId,
      principalInvestigatorId,
      scopeUserId,
      page = 1,
      limit = 20,
    } = filter

    const skip = (page - 1) * limit
    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { projectCode: { contains: search, mode: 'insensitive' } },
        { titleEn: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) where.status = status
    if (phase) where.phase = phase
    if (category) where.category = category
    if (field) where.field = field
    if (budgetYear) where.budgetYear = budgetYear
    if (unitId) where.unitId = unitId
    if (principalInvestigatorId) where.principalInvestigatorId = principalInvestigatorId

    // RBAC SELF scope: chỉ xem project mình là PI hoặc thành viên
    if (scopeUserId) {
      where.OR = [
        { principalInvestigatorId: scopeUserId },
        { members: { some: { userId: scopeUserId } } },
      ]
    }

    const [total, projects] = await Promise.all([
      db.nckhProject.count({ where }),
      db.nckhProject.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: projectListSelect,
      }),
    ])

    return { total, projects, page, limit, totalPages: Math.ceil(total / limit) }
  },

  async findById(id: string) {
    return db.nckhProject.findUnique({
      where: { id },
      select: projectDetailSelect,
    })
  },

  async findByProjectCode(projectCode: string) {
    return db.nckhProject.findUnique({ where: { projectCode } })
  },

  async projectCodeExists(projectCode: string): Promise<boolean> {
    const count = await db.nckhProject.count({ where: { projectCode } })
    return count > 0
  },

  async countByStatus(unitId?: string, scopeUserId?: string) {
    const where: Record<string, unknown> = {}
    if (unitId) where.unitId = unitId
    if (scopeUserId) {
      where.OR = [
        { principalInvestigatorId: scopeUserId },
        { members: { some: { userId: scopeUserId } } },
      ]
    }
    return db.nckhProject.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    })
  },

  async findOverdueProjects(unitId?: string, scopeUserId?: string) {
    const where: Record<string, unknown> = {
      status: 'IN_PROGRESS',
      endDate: { lt: new Date() },
      phase: { notIn: ['ACCEPTED', 'ARCHIVED'] },
    }
    if (unitId) where.unitId = unitId
    if (scopeUserId) {
      where.OR = [
        { principalInvestigatorId: scopeUserId },
        { members: { some: { userId: scopeUserId } } },
      ]
    }
    return db.nckhProject.findMany({ where, select: projectListSelect })
  },

  // ─ Mutations ────────────────────────────────────────────────────────────────

  async create(data: NckhProjectCreateData) {
    return db.nckhProject.create({
      data: {
        ...data,
        keywords: data.keywords ?? [],
        status: 'DRAFT',
        phase: 'PROPOSAL',
      },
      select: projectDetailSelect,
    })
  },

  async update(id: string, data: NckhProjectUpdateData) {
    return db.nckhProject.update({
      where: { id },
      data,
      select: projectDetailSelect,
    })
  },

  /** Chỉ service được phép gọi – cập nhật workflow state (status + phase + audit fields) */
  async updateWorkflowState(
    id: string,
    data: {
      status?: NckhProjectStatus
      phase?: NckhProjectPhase
      submittedAt?: Date | null
      submittedBy?: string | null
      approvedAt?: Date | null
      approvedBy?: string | null
      approverNote?: string | null
      rejectedAt?: Date | null
      rejectedBy?: string | null
      rejectReason?: string | null
      completionScore?: number | null
      completionGrade?: string | null
      bqpProjectCode?: string | null
    }
  ) {
    return db.nckhProject.update({ where: { id }, data })
  },

  async delete(id: string) {
    return db.nckhProject.delete({ where: { id } })
  },

  // ─ Member sub-queries ────────────────────────────────────────────────────────

  async memberExists(projectId: string, userId: string): Promise<boolean> {
    const count = await db.nckhMember.count({ where: { projectId, userId } })
    return count > 0
  },

  async addMember(data: {
    projectId: string
    userId: string
    role: NckhMemberRole
    contribution?: number | null
    joinDate?: Date
  }) {
    return db.nckhMember.create({ data })
  },

  async updateMember(
    id: string,
    data: { role?: NckhMemberRole; contribution?: number | null; leaveDate?: Date | null }
  ) {
    return db.nckhMember.update({ where: { id }, data })
  },

  async removeMember(id: string) {
    return db.nckhMember.delete({ where: { id } })
  },

  async findMembersByProject(projectId: string) {
    return db.nckhMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, rank: true, militaryId: true, department: true } },
      },
      orderBy: { joinDate: 'asc' },
    })
  },
}
