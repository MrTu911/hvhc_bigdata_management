/**
 * BudgetRepo – Phase 5
 * Data access cho ResearchBudget + BudgetLineItem.
 */
import 'server-only'
import prisma from '@/lib/db'
import type { BudgetCreateInput, BudgetUpdateInput, BudgetLineItemInput } from '@/lib/validations/science-budget'

const BUDGET_SELECT = {
  id: true,
  projectId: true,
  fundSourceId: true,
  totalApproved: true,
  totalSpent: true,
  year: true,
  status: true,
  approvedById: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, projectCode: true, title: true } },
  fundSource: { select: { id: true, name: true, code: true } },
  approvedBy: { select: { id: true, name: true } },
  lineItems: {
    orderBy: { category: 'asc' as const },
    select: {
      id: true,
      category: true,
      description: true,
      plannedAmount: true,
      spentAmount: true,
      period: true,
    },
  },
} as const

export const budgetRepo = {
  async findByProjectId(projectId: string) {
    return prisma.researchBudget.findUnique({
      where: { projectId },
      select: BUDGET_SELECT,
    })
  },

  async findById(id: string) {
    return prisma.researchBudget.findUnique({
      where: { id },
      select: BUDGET_SELECT,
    })
  },

  async findMany(filter: { year?: number; status?: string; projectId?: string; page: number; pageSize: number }) {
    const { year, status, projectId, page, pageSize } = filter
    const skip = (page - 1) * pageSize
    const where = {
      ...(year      ? { year }      : {}),
      ...(status    ? { status }    : {}),
      ...(projectId ? { projectId } : {}),
    }

    const [items, total] = await Promise.all([
      prisma.researchBudget.findMany({
        where,
        select: BUDGET_SELECT,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.researchBudget.count({ where }),
    ])

    return { items, total }
  },

  async create(input: BudgetCreateInput) {
    const { lineItems, ...budgetData } = input
    return prisma.researchBudget.create({
      data: {
        ...budgetData,
        lineItems: { create: lineItems },
      },
      select: BUDGET_SELECT,
    })
  },

  async update(id: string, input: BudgetUpdateInput) {
    const { lineItems, ...budgetData } = input

    if (lineItems && lineItems.length > 0) {
      // Upsert strategy: có id → update, không có → create
      const toCreate = lineItems.filter((l) => !l.id)
      const toUpdate = lineItems.filter((l) => l.id)

      await prisma.$transaction([
        prisma.researchBudget.update({
          where: { id },
          data: budgetData,
        }),
        ...toCreate.map((l) =>
          prisma.budgetLineItem.create({
            data: { budgetId: id, ...(l as BudgetLineItemInput) },
          })
        ),
        ...toUpdate.map((l) =>
          prisma.budgetLineItem.update({
            where: { id: l.id! },
            data: { ...l, id: undefined },
          })
        ),
      ])

      return prisma.researchBudget.findUnique({ where: { id }, select: BUDGET_SELECT })
    }

    return prisma.researchBudget.update({
      where: { id },
      data: budgetData,
      select: BUDGET_SELECT,
    })
  },

  async updateLineItemSpent(lineItemId: string, spentAmount: bigint) {
    return prisma.budgetLineItem.update({
      where: { id: lineItemId },
      data: { spentAmount },
    })
  },

  async recalculateTotalSpent(budgetId: string) {
    const agg = await prisma.budgetLineItem.aggregate({
      where: { budgetId },
      _sum: { spentAmount: true },
    })
    const totalSpent = agg._sum.spentAmount ?? BigInt(0)
    return prisma.researchBudget.update({
      where: { id: budgetId },
      data: { totalSpent },
    })
  },

  async setStatus(
    id: string,
    status: string,
    approvedById?: string,
  ) {
    return prisma.researchBudget.update({
      where: { id },
      data: {
        status,
        ...(approvedById ? { approvedById, approvedAt: new Date() } : {}),
      },
      select: BUDGET_SELECT,
    })
  },

  /** Tất cả budget có chi tiêu vượt ngưỡng phần trăm của totalApproved */
  async findOverspending(thresholdPct: number) {
    // Raw SQL vì Prisma không hỗ trợ so sánh giữa 2 BigInt field trực tiếp
    const rows = await prisma.$queryRaw<
      { id: string; projectId: string; totalApproved: bigint; totalSpent: bigint; pct: number }[]
    >`
      SELECT id, project_id AS "projectId",
             total_approved AS "totalApproved",
             total_spent AS "totalSpent",
             ROUND((total_spent::numeric / NULLIF(total_approved, 0)) * 100, 1) AS pct
      FROM research_budgets
      WHERE status != 'FINALIZED'
        AND total_approved > 0
        AND (total_spent::numeric / total_approved) >= ${thresholdPct / 100}
      ORDER BY pct DESC
    `
    return rows
  },
}

export type BudgetFull = NonNullable<Awaited<ReturnType<typeof budgetRepo.findById>>>
