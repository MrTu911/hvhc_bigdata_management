import 'server-only';

import { RecruitmentStep } from '@prisma/client';
import { PartyRecruitmentRepo } from '@/lib/repositories/party/party-recruitment.repo';

// Ordered steps defining the valid forward progression for a recruitment pipeline entry.
const STEP_ORDER: RecruitmentStep[] = [
  RecruitmentStep.THEO_DOI,
  RecruitmentStep.HOC_CAM_TINH,
  RecruitmentStep.DOI_TUONG,
  RecruitmentStep.CHI_BO_XET,
  RecruitmentStep.CAP_TREN_DUYET,
  RecruitmentStep.DA_KET_NAP,
];

export interface RecruitmentListFilters {
  currentStep?: RecruitmentStep;
  targetPartyOrgId?: string;
  search?: string;
  page: number;
  limit: number;
}

export interface RecruitmentUpsertPayload {
  userId: string;
  targetPartyOrgId: string;
  currentStep?: RecruitmentStep;
  dossierStatus?: string;
  assistantMember1?: string;
  assistantMember2?: string;
  note?: string;
}

export const PartyRecruitmentService = {
  /**
   * List all recruitment pipeline entries with optional filters and pagination.
   */
  async listPipeline(filters: RecruitmentListFilters) {
    const page = Math.max(1, filters.page);
    const limit = Math.min(100, Math.max(1, filters.limit));

    const { items, total } = await PartyRecruitmentRepo.findMany({
      currentStep: filters.currentStep,
      targetPartyOrgId: filters.targetPartyOrgId,
      search: filters.search,
      page,
      limit,
    });

    return {
      items,
      total,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Create or update a recruitment pipeline entry for a given user.
   *
   * Business rule: if currentStep is DA_KET_NAP, the actual party member record
   * must be created through the party-member module (see party-member.service.ts).
   * This service only manages the pipeline tracking entry.
   */
  async upsertEntry(payload: RecruitmentUpsertPayload) {
    if (payload.currentStep === RecruitmentStep.DA_KET_NAP) {
      // Note: DA_KET_NAP step means the candidate has been approved for admission.
      // The formal PartyMember record must be created via the party-member module.
      // This pipeline entry tracks the administrative workflow only.
      console.info(
        `[PartyRecruitmentService] upsertEntry: userId=${payload.userId} reached DA_KET_NAP. ` +
          `Create the PartyMember record via party-member module to complete admission.`,
      );
    }

    return PartyRecruitmentRepo.upsert({
      userId: payload.userId,
      targetPartyOrgId: payload.targetPartyOrgId,
      currentStep: payload.currentStep,
      dossierStatus: payload.dossierStatus,
      assistantMember1: payload.assistantMember1,
      assistantMember2: payload.assistantMember2,
      note: payload.note,
    });
  },

  /**
   * Advance a pipeline entry to a new step.
   *
   * Steps can only move forward in STEP_ORDER; backward transitions are not permitted.
   * Throws an error if the transition is invalid.
   */
  async advanceStep(id: string, newStep: RecruitmentStep, note?: string) {
    const entry = await PartyRecruitmentRepo.findById(id);
    if (!entry) {
      throw new Error('Không tìm thấy hồ sơ kết nạp đảng');
    }

    const currentIndex = STEP_ORDER.indexOf(entry.currentStep as RecruitmentStep);
    const nextIndex = STEP_ORDER.indexOf(newStep);

    if (currentIndex === -1) {
      throw new Error(`Bước hiện tại không hợp lệ: ${entry.currentStep}`);
    }
    if (nextIndex === -1) {
      throw new Error(`Bước chuyển đến không hợp lệ: ${newStep}`);
    }
    if (nextIndex <= currentIndex) {
      throw new Error(
        `Không thể chuyển ngược bước: ${entry.currentStep} → ${newStep}. ` +
          `Chỉ được phép chuyển tiến theo thứ tự.`,
      );
    }

    const updated = await PartyRecruitmentRepo.update(id, {
      currentStep: newStep,
      note: note ?? entry.note,
    });

    return updated;
  },
};
