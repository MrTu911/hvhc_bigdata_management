import 'server-only';
import db from '@/lib/db';
import { RecruitmentStep, Prisma } from '@prisma/client';

export interface PartyRecruitmentUpsertInput {
  userId: string;
  targetPartyOrgId: string;
  currentStep: RecruitmentStep;
  dossierStatus?: string;
  assistantMember1?: string;
  assistantMember2?: string;
  note?: string;
}

export interface PartyRecruitmentUpdateInput {
  currentStep?: RecruitmentStep;
  targetPartyOrgId?: string;
  dossierStatus?: string;
  assistantMember1?: string;
  assistantMember2?: string;
  note?: string;
  camTinhDate?: Date;
  doiTuongDate?: Date;
  chiBoProposalDate?: Date;
  capTrenApprovalDate?: Date;
  joinedDate?: Date;
}

export interface PartyRecruitmentFindManyInput {
  currentStep?: RecruitmentStep;
  targetPartyOrgId?: string;
  search?: string;
  page: number;
  limit: number;
}

const LIST_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      militaryId: true,
      email: true,
      rank: true,
    },
  },
  targetPartyOrg: {
    select: { id: true, name: true, code: true },
  },
} as const;

export const PartyRecruitmentRepo = {
  async findMany(input: PartyRecruitmentFindManyInput) {
    const { currentStep, targetPartyOrgId, search, page, limit } = input;
    const skip = (page - 1) * limit;

    const where: Prisma.PartyRecruitmentPipelineWhereInput = {
      ...(currentStep && { currentStep }),
      ...(targetPartyOrgId && { targetPartyOrgId }),
      ...(search && {
        user: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { militaryId: { contains: search, mode: 'insensitive' } },
          ],
        },
      }),
    };

    const [items, total] = await Promise.all([
      db.partyRecruitmentPipeline.findMany({
        where,
        include: LIST_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.partyRecruitmentPipeline.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: string) {
    return db.partyRecruitmentPipeline.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    });
  },

  async findByUserId(userId: string) {
    return db.partyRecruitmentPipeline.findUnique({
      where: { userId },
      include: LIST_INCLUDE,
    });
  },

  async upsert(input: PartyRecruitmentUpsertInput) {
    const { userId, targetPartyOrgId, currentStep, ...rest } = input;
    return db.partyRecruitmentPipeline.upsert({
      where: { userId },
      create: {
        userId,
        targetPartyOrgId,
        currentStep,
        dossierStatus: rest.dossierStatus,
        assistantMember1: rest.assistantMember1,
        assistantMember2: rest.assistantMember2,
        note: rest.note,
      },
      update: {
        targetPartyOrgId,
        currentStep,
        dossierStatus: rest.dossierStatus,
        assistantMember1: rest.assistantMember1,
        assistantMember2: rest.assistantMember2,
        note: rest.note,
      },
      include: LIST_INCLUDE,
    });
  },

  async update(id: string, input: PartyRecruitmentUpdateInput) {
    return db.partyRecruitmentPipeline.update({
      where: { id },
      data: input,
      include: LIST_INCLUDE,
    });
  },
};
