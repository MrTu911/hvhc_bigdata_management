/**
 * BudgetService – CSDL-KHQL Phase 5
 * Business logic cho ResearchBudget:
 *   - CRUD với line items
 *   - Approve / Finalize workflow
 *   - Overspend alerts (90% + 100%)
 */
import 'server-only'
import { budgetRepo } from '@/lib/repositories/science/budget.repo'
import { logAudit } from '@/lib/audit'
import type {
  BudgetCreateInput,
  BudgetUpdateInput,
  LineItemSpendInput,
  BudgetStatusUpdateInput,
} from '@/lib/validations/science-budget'

export const budgetService = {
  async listBudgets(filter: { year?: number; status?: string; projectId?: string; page: number; pageSize: number }) {
    const result = await budgetRepo.findMany(filter)
    return { success: true as const, data: result }
  },

  async getBudgetByProject(projectId: string) {
    const budget = await budgetRepo.findByProjectId(projectId)
    if (!budget) return { success: false as const, error: 'Dự án chưa có ngân sách' }
    return { success: true as const, data: budget }
  },

  async createBudget(input: BudgetCreateInput, userId: string, ipAddress?: string) {
    // Mỗi project chỉ có 1 budget record
    const existing = await budgetRepo.findByProjectId(input.projectId)
    if (existing) {
      return {
        success: false as const,
        error: 'Đề tài đã có ngân sách. Dùng PATCH để cập nhật.',
      }
    }

    const budget = await budgetRepo.create(input)

    await logAudit({
      userId,
      functionCode: 'MANAGE_RESEARCH_BUDGET',
      action: 'CREATE',
      resourceType: 'RESEARCH_BUDGET',
      resourceId: budget.id,
      result: 'SUCCESS',
      ipAddress,
      metadata: { projectId: input.projectId, year: input.year },
    })

    return { success: true as const, data: budget }
  },

  async updateBudget(
    id: string,
    input: BudgetUpdateInput,
    userId: string,
    ipAddress?: string
  ) {
    const existing = await budgetRepo.findById(id)
    if (!existing) return { success: false as const, error: 'Không tìm thấy ngân sách' }

    if (existing.status === 'FINALIZED') {
      return { success: false as const, error: 'Ngân sách đã quyết toán, không thể sửa' }
    }

    const updated = await budgetRepo.update(id, input)

    await logAudit({
      userId,
      functionCode: 'MANAGE_RESEARCH_BUDGET',
      action: 'UPDATE',
      resourceType: 'RESEARCH_BUDGET',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress,
    })

    return { success: true as const, data: updated }
  },

  async recordSpend(input: LineItemSpendInput, userId: string, ipAddress?: string) {
    // Tìm budget qua lineItem
    const lineItem = await import('@/lib/db').then(({ default: prismaClient }) =>
      prismaClient.budgetLineItem.findUnique({
        where: { id: input.lineItemId },
        select: { id: true, budgetId: true, plannedAmount: true },
      })
    )
    if (!lineItem) return { success: false as const, error: 'Không tìm thấy dòng ngân sách' }

    await budgetRepo.updateLineItemSpent(input.lineItemId, BigInt(input.spentAmount))
    const budget = await budgetRepo.recalculateTotalSpent(lineItem.budgetId)

    await logAudit({
      userId,
      functionCode: 'MANAGE_RESEARCH_BUDGET',
      action: 'UPDATE',
      resourceType: 'BUDGET_LINE_ITEM',
      resourceId: input.lineItemId,
      result: 'SUCCESS',
      ipAddress,
      metadata: { spentAmount: input.spentAmount, budgetId: lineItem.budgetId },
    })

    return { success: true as const, data: budget }
  },

  async approveBudget(id: string, input: BudgetStatusUpdateInput, userId: string, ipAddress?: string) {
    const existing = await budgetRepo.findById(id)
    if (!existing) return { success: false as const, error: 'Không tìm thấy ngân sách' }

    if (existing.status === 'FINALIZED') {
      return { success: false as const, error: 'Ngân sách đã quyết toán' }
    }

    const updated = await budgetRepo.setStatus(
      id,
      input.status,
      input.status === 'APPROVED' ? userId : undefined
    )

    await logAudit({
      userId,
      functionCode: 'APPROVE_BUDGET',
      action: 'UPDATE',
      resourceType: 'RESEARCH_BUDGET',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress,
      metadata: { newStatus: input.status, note: input.note },
    })

    return { success: true as const, data: updated }
  },

  async getOverspendAlerts() {
    // 2 ngưỡng: 90% (cảnh báo) và 100% (vượt)
    const [at90, at100] = await Promise.all([
      budgetRepo.findOverspending(90),
      budgetRepo.findOverspending(100),
    ])

    const overspent = at100
    const nearLimit = at90.filter((r) => !at100.find((o) => o.id === r.id))

    return {
      success: true as const,
      data: {
        overspent,       // >= 100% totalApproved
        nearLimit,       // >= 90% nhưng < 100%
        totalAlerts: overspent.length + nearLimit.length,
        generatedAt: new Date().toISOString(),
      },
    }
  },
}
