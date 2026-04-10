/**
 * ProjectRepo – Phase 3
 * Data access cho NckhProject (wrapper) + NckhProjectWorkflowLog.
 * Không sửa /lib/repositories/research/* – backward compatible.
 */
import 'server-only'
import { db } from '@/lib/db'
import type {
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectListFilter,
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
      db.nckhProject.findMany({
        where,
        select: PROJECT_SELECT,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      db.nckhProject.count({ where }),
    ])

    return { items, total }
  },

  async findById(id: string) {
    return db.nckhProject.findUnique({
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
    return db.nckhProject.create({
      data: rest,
      select: PROJECT_SELECT,
    })
  },

  async update(id: string, data: ProjectUpdateInput) {
    return db.nckhProject.update({
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
    return db.nckhProjectWorkflowLog.create({
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
    const current = await db.nckhProject.findUnique({
      where: { id },
      select: { status: true, phase: true },
    })
    if (!current) return null

    const [updated] = await db.$transaction([
      db.nckhProject.update({
        where: { id },
        data: {
          status: toStatus as any,
          ...(toPhase ? { phase: toPhase as any } : {}),
        },
        select: PROJECT_SELECT,
      }),
      db.nckhProjectWorkflowLog.create({
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

    return db.nckhProject.findMany({
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
