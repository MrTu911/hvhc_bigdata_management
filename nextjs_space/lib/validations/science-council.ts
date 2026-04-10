/**
 * Zod schemas – Phase 5: Hội đồng KH
 * Dùng cho /api/science/councils/*
 */
import { z } from 'zod'

export const COUNCIL_TYPE_VALUES = ['REVIEW', 'ACCEPTANCE', 'FINAL'] as const
export type CouncilType = (typeof COUNCIL_TYPE_VALUES)[number]

export const COUNCIL_RESULT_VALUES = ['PASS', 'FAIL', 'REVISE'] as const
export type CouncilResult = (typeof COUNCIL_RESULT_VALUES)[number]

export const COUNCIL_MEMBER_ROLE_VALUES = ['CHAIRMAN', 'SECRETARY', 'REVIEWER', 'EXPERT'] as const
export type CouncilMemberRole = (typeof COUNCIL_MEMBER_ROLE_VALUES)[number]

export const COUNCIL_REVIEW_CRITERIA_VALUES = [
  'SCIENTIFIC_VALUE', 'FEASIBILITY', 'BUDGET', 'TEAM', 'OUTCOME',
] as const

// ─── Members ──────────────────────────────────────────────────────────────────

export const councilMemberSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(COUNCIL_MEMBER_ROLE_VALUES),
})

// ─── Create council ───────────────────────────────────────────────────────────

export const councilCreateSchema = z.object({
  projectId: z.string().cuid(),
  type: z.enum(COUNCIL_TYPE_VALUES),
  chairmanId: z.string().cuid(),
  secretaryId: z.string().cuid(),
  meetingDate: z.coerce.date().optional(),
  members: z.array(councilMemberSchema).min(1),
})

// ─── Submit individual review (per-member scoring) ────────────────────────────

export const councilReviewSubmitSchema = z.object({
  scores: z.array(
    z.object({
      criteria: z.enum(COUNCIL_REVIEW_CRITERIA_VALUES),
      score: z.number().min(0).max(10),
      comment: z.string().max(1000).optional(),
    })
  ).min(1),
  vote: z.enum(COUNCIL_RESULT_VALUES),
})

// ─── Acceptance (chairman finalizes) ─────────────────────────────────────────

export const councilAcceptanceSchema = z.object({
  result: z.enum(COUNCIL_RESULT_VALUES),
  overallScore: z.number().min(0).max(10).optional(),
  conclusionText: z.string().min(10).max(5000),
  minutesFilePath: z.string().max(500).optional(), // MinIO path nếu đã upload
})

export type CouncilCreateInput = z.infer<typeof councilCreateSchema>
export type CouncilMemberInput = z.infer<typeof councilMemberSchema>
export type CouncilReviewSubmitInput = z.infer<typeof councilReviewSubmitSchema>
export type CouncilAcceptanceInput = z.infer<typeof councilAcceptanceSchema>
