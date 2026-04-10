/**
 * Zod schemas – Phase 5: Kinh phí Nghiên cứu
 * Dùng cho /api/science/budgets/*
 */
import { z } from 'zod'

export const BUDGET_STATUS_VALUES = ['DRAFT', 'APPROVED', 'FINALIZED'] as const
export type BudgetStatus = (typeof BUDGET_STATUS_VALUES)[number]

export const BUDGET_LINE_CATEGORY_VALUES = [
  'PERSONNEL', 'EQUIPMENT', 'TRAVEL', 'OVERHEAD', 'OTHER',
] as const
export type BudgetLineCategory = (typeof BUDGET_LINE_CATEGORY_VALUES)[number]

// ─── Line item ────────────────────────────────────────────────────────────────

export const budgetLineItemSchema = z.object({
  category: z.enum(BUDGET_LINE_CATEGORY_VALUES),
  description: z.string().min(3).max(500),
  plannedAmount: z.number().int().min(0),
  spentAmount: z.number().int().min(0).default(0),
  period: z.string().max(20).optional(), // Q1-2026
})

export const budgetLineUpdateSchema = budgetLineItemSchema.partial().extend({
  id: z.string().cuid().optional(), // có id = update, không có = create
})

// ─── Budget ───────────────────────────────────────────────────────────────────

export const budgetCreateSchema = z.object({
  projectId: z.string().cuid(),
  fundSourceId: z.string().cuid(),
  totalApproved: z.number().int().min(0),
  year: z.number().int().min(2000).max(2100),
  lineItems: z.array(budgetLineItemSchema).min(1),
})

export const budgetUpdateSchema = z.object({
  fundSourceId: z.string().cuid().optional(),
  totalApproved: z.number().int().min(0).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  lineItems: z.array(budgetLineUpdateSchema).optional(),
})

export const lineItemSpendSchema = z.object({
  lineItemId: z.string().cuid(),
  spentAmount: z.number().int().min(0),
})

// ─── Approve / Finalize ───────────────────────────────────────────────────────

export const budgetStatusUpdateSchema = z.object({
  status: z.enum(['APPROVED', 'FINALIZED']),
  note: z.string().max(1000).optional(),
})

export type BudgetCreateInput = z.infer<typeof budgetCreateSchema>
export type BudgetUpdateInput = z.infer<typeof budgetUpdateSchema>
export type BudgetLineItemInput = z.infer<typeof budgetLineItemSchema>
export type LineItemSpendInput = z.infer<typeof lineItemSpendSchema>
export type BudgetStatusUpdateInput = z.infer<typeof budgetStatusUpdateSchema>
