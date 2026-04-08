import { RecruitmentStep } from '@prisma/client';
import { z } from 'zod';

export const STEP_ORDER: RecruitmentStep[] = [
  RecruitmentStep.THEO_DOI,
  RecruitmentStep.HOC_CAM_TINH,
  RecruitmentStep.DOI_TUONG,
  RecruitmentStep.CHI_BO_XET,
  RecruitmentStep.CAP_TREN_DUYET,
  RecruitmentStep.DA_KET_NAP,
];

export const partyRecruitmentListFiltersSchema = z.object({
  currentStep: z.nativeEnum(RecruitmentStep).optional(),
  targetPartyOrgId: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const partyRecruitmentUpsertSchema = z.object({
  userId: z.string().trim().min(1, 'userId là bắt buộc'),
  targetPartyOrgId: z.string().trim().min(1, 'targetPartyOrgId là bắt buộc'),
  currentStep: z.nativeEnum(RecruitmentStep).default(RecruitmentStep.THEO_DOI),
  dossierStatus: z.string().trim().optional().nullable(),
  assistantMember1: z.string().trim().optional().nullable(),
  assistantMember2: z.string().trim().optional().nullable(),
  note: z.string().trim().optional().nullable(),
});

export const partyRecruitmentAdvanceStepSchema = z.object({
  newStep: z.nativeEnum(RecruitmentStep),
  note: z.string().trim().optional().nullable(),
});

export type PartyRecruitmentListFiltersInput = z.infer<typeof partyRecruitmentListFiltersSchema>;
export type PartyRecruitmentUpsertInput = z.infer<typeof partyRecruitmentUpsertSchema>;
export type PartyRecruitmentAdvanceStepInput = z.infer<typeof partyRecruitmentAdvanceStepSchema>;
