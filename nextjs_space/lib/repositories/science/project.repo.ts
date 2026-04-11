/**
 * ProjectRepo – Phase 3
 * Data access cho NckhProject (wrapper) + NckhProjectWorkflowLog.
 * Không sửa /lib/repositories/research/* – backward compatible.
 */
import 'server-only'
import prisma from '@/lib/db'
import type {
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectListFilter,
  MilestoneCreateInput,
  MilestoneUpdateInput,
  AcceptanceSubmitInput,
} from '@/lib/validations/science-project'

// ─── Shared select ────────────────────────────────────────────────────────────

const PROJECT_SELECT = {
  id: true,
  projectCode: true,
  title: true,
  titleEn: true,
  abstract: true,
  keywords: true,
  category: true,
  field: true,
  researchType: true,
  status: true,
  phase: true,
  startDate: true,
  endDate: true,
  actualEndDate: true,
  budgetRequested: true,
  budgetApproved: true,
  budgetUsed: true,
  budgetYear: true,
  bqpProjectCode: true,
  sensitivity: true,
  fundSourceId: true,
  approvedAt: true,
  completionScore: true,
  completionGrade: true,
  createdAt: true,
  updatedAt: true,
  principalInvestigator: {
    select: { id: true, name: true, rank: true, militaryId: true },
  },
  unit: { select: { id: true, name: true, code: true } },
  fundSource: { select: { id: true, name: true, code: true } },
  members: {
    select: {
      id: true,
      role: true,
      user: { select: { id: true, name: true, rank: true, militaryId: true } },
    },
  },
  workflowLogs: {
    orderBy: { actedAt: 'desc' as const },
    take: 10,
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      fromPhase: true,
      toPhase: true,
      comment: true,
      actedAt: true,
      actionBy: { select: { id: true, name: true } },
    },
  },
} as const

// ─── Repository ───────────────────────────────────────────────────────────────

export const projectRepo = {
  async findMany(filter: ProjectListFilter, canViewSecret: boolean) {
    const { keyword, status, phase, category, sensitivity, unitId, budgetYear, page, pageSize } = filter
    const skip = (page - 1) * pageSize

    // Nếu không có quyền xem SECRET, filter ra
    const sensitivityFilter = canViewSecret
      ? sensitivity ? { sensitivity } : undefined
      : { sensitivity: { in: sensitivity ? [sensitivity].filter((s) => s !== 'SECRET') : ['NORMAL', 'CONFIDENTIAL'] } }

    const where = {
      ...sensitivityFilter,
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword, mode: 'insensitive' as const } },
              { projectCode: { contains: keyword, mode: 'insensitive' as const } },
              { abstract: { contains: keyword, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
      ...(phase ? { phase } : {}),
      ...(category ? { category } : {}),
      ...(unitId ? { unitId } : {}),
      ...(budgetYear ? { budgetYear } : {}),
    }

    const [items, total] = await Promise.all([
      prisma.nckhProject.findMany({
        where,
        select: PROJECT_SELECT,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.nckhProject.count({ where }),
    ])

    return { items, total }
  },

  async findById(id: string) {
    return prisma.nckhProject.findUnique({
      where: { id },
      select: {
        ...PROJECT_SELECT,
        workflowLogs: {
          orderBy: { actedAt: 'desc' as const },
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            fromPhase: true,
            toPhase: true,
            comment: true,
            actedAt: true,
            actionBy: { select: { id: true, name: true } },
          },
        },
      },
    })
  },

  async create(data: ProjectCreateInput & { projectCode: string; principalInvestigatorId: string }) {
    const { authors: _a, ...rest } = data as any
    return prisma.nckhProject.create({
      data: rest,
      select: PROJECT_SELECT,
    })
  },

  async update(id: string, data: ProjectUpdateInput) {
    return prisma.nckhProject.update({
      where: { id },
      data,
      select: PROJECT_SELECT,
    })
  },

  async addWorkflowLog(
    projectId: string,
    fromStatus: string,
    toStatus: string,
    actionById: string,
    options?: { fromPhase?: string; toPhase?: string; comment?: string }
  ) {
    return prisma.nckhProjectWorkflowLog.create({
      data: {
        projectId,
        fromStatus,
        toStatus,
        fromPhase: options?.fromPhase,
        toPhase: options?.toPhase,
        actionById,
        comment: options?.comment,
      },
    })
  },

  async transition(
    id: string,
    toStatus: string,
    toPhase: string | undefined,
    actionById: string,
    comment?: string
  ) {
    const current = await prisma.nckhProject.findUnique({
      where: { id },
      select: { status: true, phase: true },
    })
    if (!current) return null

    const [updated] = await prisma.$transaction([
      prisma.nckhProject.update({
        where: { id },
        data: {
          status: toStatus as any,
          ...(toPhase ? { phase: toPhase as any } : {}),
        },
        select: PROJECT_SELECT,
      }),
      prisma.nckhProjectWorkflowLog.create({
        data: {
          projectId: id,
          fromStatus: current.status,
          toStatus,
          fromPhase: current.phase,
          toPhase,
          actionById,
          comment,
        },
      }),
    ])

    return updated
  },

  async findDeadlineSoon(daysAhead: number) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + daysAhead)

    return prisma.nckhProject.findMany({
      where: {
        status: { in: ['IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW'] },
        endDate: { lte: cutoff, gte: new Date() },
      },
      select: {
        id: true,
        projectCode: true,
        title: true,
        status: true,
        endDate: true,
        principalInvestigator: { select: { id: true, name: true, email: true } },
        unit: { select: { id: true, name: true } },
      },
      orderBy: { endDate: 'asc' },
    })
  },
}

export type ProjectFull = NonNullable<Awaited<ReturnType<typeof projectRepo.findById>>>

// ─── Milestone repo ───────────────────────────────────────────────────────────

export const milestoneRepo = {
  async findByProject(projectId: string) {
    return prisma.nckhMilestone.findMany({
      where: { projectId },
      orderBy: { dueDate: 'asc' },
    })
  },

  async findById(id: string) {
    return prisma.nckhMilestone.findUnique({ where: { id } })
  },

  async create(projectId: string, data: MilestoneCreateInput) {
    return prisma.nckhMilestone.create({
      data: { projectId, ...data, status: 'PENDING' },
    })
  },

  async update(id: string, data: MilestoneUpdateInput) {
    return prisma.nckhMilestone.update({
      where: { id },
      data: {
        ...data,
        // Auto-set completedAt khi status → COMPLETED
        ...(data.status === 'COMPLETED' && !data.completedAt
          ? { completedAt: new Date() }
          : {}),
      },
    })
  },
}

// ─── Acceptance (NckhReview) repo ─────────────────────────────────────────────

export const acceptanceRepo = {
  async findByProject(projectId: string) {
    return prisma.nckhReview.findMany({
      where: { projectId },
      orderBy: { reviewDate: 'desc' },
    })
  },

  async create(projectId: string, data: AcceptanceSubmitInput) {
    return prisma.nckhReview.create({
      data: { projectId, ...data },
    })
  },

  async getLatestAcceptance(projectId: string) {
    return prisma.nckhReview.findFirst({
      where: {
        projectId,
        reviewType: { in: ['NGHIEM_THU_CO_SO', 'NGHIEM_THU_CAP_HV', 'NGHIEM_THU_CAP_TREN'] },
      },
      orderBy: { reviewDate: 'desc' },
    })
  },
}
