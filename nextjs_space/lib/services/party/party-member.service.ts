import { PartyMemberStatus } from '@prisma/client';
import {
  partyMemberCreateSchema,
  partyMemberListFiltersSchema,
  partyMemberUpdateSchema,
  type PartyMemberCreateInput,
  type PartyMemberListFiltersInput,
  type PartyMemberUpdateInput,
} from '@/lib/validators/party/party-member.schema';
import { PartyMemberRepo } from '@/lib/repositories/party/party-member.repo';
import {
  assertPartyLifecycleTransition,
  createLifecycleTransitionTrail,
} from '@/lib/services/party/party-lifecycle.service';
import db from '@/lib/db';

export interface PartyMemberListFilters {
  search?: string;
  status?: string;
  organizationId?: string;
  unitIds?: string[];
  page?: number;
  limit?: number;
}

function formatZodError(prefix: string, issues: string[]) {
  return `${prefix}: ${issues.join('; ')}`;
}

function normalizeCreatePayload(payload: PartyMemberCreateInput) {
  const status = payload.status as PartyMemberStatus | undefined;

  return {
    userId: payload.userId,
    organizationId: payload.organizationId ?? payload.partyOrgId ?? null,
    partyCardNumber: payload.partyCardNumber ?? payload.partyCardNo ?? null,
    partyRole: payload.partyRole ?? null,
    joinDate: payload.joinDate ?? null,
    officialDate: payload.officialDate ?? null,
    recommender1: payload.recommender1 ?? payload.introducer1 ?? null,
    recommender2: payload.recommender2 ?? payload.introducer2 ?? null,
    currentReviewGrade: payload.currentReviewGrade ?? null,
    currentDebtAmount:
      payload.currentDebtAmount === undefined || payload.currentDebtAmount === null
        ? 0
        : Number(payload.currentDebtAmount),
    confidentialNote: payload.confidentialNote ?? null,
    status: status || PartyMemberStatus.QUAN_CHUNG,
    statusChangeDate: status ? new Date() : null,
  };
}

export async function listPartyMembers(filters: PartyMemberListFilters) {
  const parsed = partyMemberListFiltersSchema.safeParse(filters);
  if (!parsed.success) {
    throw new Error(
      formatZodError(
        'Bộ lọc không hợp lệ',
        parsed.error.issues.map((i) => i.message),
      ),
    );
  }

  const { search, status, organizationId, page, limit } = parsed.data;

  const { items, total } = await PartyMemberRepo.findMany({
    search,
    status,
    organizationId,
    unitIds: filters.unitIds,
    page,
    limit,
  });

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPartyMemberById(id: string) {
  return PartyMemberRepo.findDetailById(id);
}

export async function createPartyMember(payload: any) {
  const parsed = partyMemberCreateSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(
      formatZodError(
        'Dữ liệu tạo đảng viên không hợp lệ',
        parsed.error.issues.map((i) => i.message),
      ),
    );
  }

  const normalized = normalizeCreatePayload(parsed.data);

  const user = await PartyMemberRepo.findUserById(normalized.userId);
  if (!user) {
    throw new Error('Không tìm thấy user');
  }

  const existed = await PartyMemberRepo.findByUserId(normalized.userId);
  if (existed) {
    throw new Error('User đã có PartyMember');
  }

  return PartyMemberRepo.create(normalized);
}

export async function updatePartyMember(id: string, payload: any) {
  const parsed = partyMemberUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(
      formatZodError(
        'Dữ liệu cập nhật đảng viên không hợp lệ',
        parsed.error.issues.map((i) => i.message),
      ),
    );
  }

  const current = await PartyMemberRepo.findById(id);
  if (!current) {
    return null;
  }

  const data: PartyMemberUpdateInput = parsed.data;

  const nextStatus = data.status as PartyMemberStatus | undefined;
  const statusChanged = !!nextStatus && nextStatus !== current.status;

  if (statusChanged && nextStatus) {
    assertPartyLifecycleTransition(current.status, nextStatus);
  }

  const updatePayload = {
    organizationId: data.organizationId ?? data.partyOrgId ?? current.organizationId,
    partyCardNumber: data.partyCardNumber ?? data.partyCardNo ?? current.partyCardNumber,
    partyRole: data.partyRole ?? current.partyRole,
    joinDate: data.joinDate === undefined ? current.joinDate : data.joinDate,
    officialDate: data.officialDate === undefined ? current.officialDate : data.officialDate,
    recommender1: data.recommender1 ?? data.introducer1 ?? current.recommender1,
    recommender2: data.recommender2 ?? data.introducer2 ?? current.recommender2,
    currentReviewGrade: data.currentReviewGrade ?? current.currentReviewGrade,
    currentDebtAmount:
      data.currentDebtAmount === undefined ? current.currentDebtAmount ?? 0 : Number(data.currentDebtAmount),
    confidentialNote: data.confidentialNote ?? current.confidentialNote,
    status: nextStatus ?? current.status,
    statusChangeDate: statusChanged ? new Date() : current.statusChangeDate,
    statusChangeReason: data.statusChangeReason ?? current.statusChangeReason,
  };

  if (!statusChanged) {
    return PartyMemberRepo.update(id, updatePayload);
  }

  return db.$transaction(async (tx) => {
    const updated = await PartyMemberRepo.updateInTx(tx, id, updatePayload);
    await createLifecycleTransitionTrail(tx, {
      partyMemberId: id,
      fromStatus: current.status,
      toStatus: nextStatus!,
      actorId: data.updatedBy ?? null,
      reason: data.statusChangeReason ?? null,
      joinDate: updatePayload.joinDate ?? null,
      officialDate: updatePayload.officialDate ?? null,
    });
    return updated;
  });
}

export async function softDeletePartyMember(id: string, deletedBy: string) {
  const current = await PartyMemberRepo.findById(id);
  if (!current) {
    return null;
  }

  return PartyMemberRepo.softDelete(id, deletedBy);
}
