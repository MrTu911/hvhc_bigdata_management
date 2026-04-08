import 'server-only';

import { DisciplineSeverity } from '@prisma/client';
import { PartyAwardRepo } from '@/lib/repositories/party/party-award.repo';
import { PartyDisciplineRepo } from '@/lib/repositories/party/party-discipline.repo';

// ---------------------------------------------------------------------------
// Award types
// ---------------------------------------------------------------------------

export interface AwardListFilters {
  partyMemberId?: string;
  search?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  page: number;
  limit: number;
}

export interface AwardCreatePayload {
  partyMemberId: string;
  title: string;
  decisionNo?: string;
  decisionDate?: Date | string;
  issuer?: string;
  note?: string;
  attachmentUrl?: string;
}

export type AwardUpdatePayload = Partial<Omit<AwardCreatePayload, 'partyMemberId'>>;

// ---------------------------------------------------------------------------
// Discipline types
// ---------------------------------------------------------------------------

export interface DisciplineListFilters {
  partyMemberId?: string;
  severity?: DisciplineSeverity;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  page: number;
  limit: number;
}

export interface DisciplineCreatePayload {
  partyMemberId: string;
  severity: DisciplineSeverity;
  decisionNo?: string;
  decisionDate?: Date | string;
  expiryDate?: Date | string;
  issuer?: string;
  reason?: string;
  attachmentUrl?: string;
}

export type DisciplineUpdatePayload = Partial<Omit<DisciplineCreatePayload, 'partyMemberId'>>;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const PartyAwardDisciplineService = {
  // -------------------------------------------------------------------------
  // Awards
  // -------------------------------------------------------------------------

  /**
   * List party awards with optional filters and pagination.
   */
  async listAwards(filters: AwardListFilters) {
    const page = Math.max(1, filters.page);
    const limit = Math.min(100, Math.max(1, filters.limit));

    const { items, total } = await PartyAwardRepo.findMany({
      partyMemberId: filters.partyMemberId,
      search: filters.search,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
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
   * Create a new party award record.
   */
  async createAward(payload: AwardCreatePayload) {
    if (!payload.partyMemberId) {
      throw new Error('partyMemberId là bắt buộc');
    }
    if (!payload.title?.trim()) {
      throw new Error('Tiêu đề khen thưởng không được để trống');
    }

    return PartyAwardRepo.create({
      partyMemberId: payload.partyMemberId,
      title: payload.title.trim(),
      decisionNo: payload.decisionNo ?? null,
      decisionDate: payload.decisionDate ? new Date(payload.decisionDate) : null,
      issuer: payload.issuer ?? null,
      note: payload.note ?? null,
      attachmentUrl: payload.attachmentUrl ?? null,
    });
  },

  /**
   * Update an existing party award record.
   */
  async updateAward(id: string, payload: AwardUpdatePayload) {
    if (!id) throw new Error('id là bắt buộc');

    return PartyAwardRepo.update(id, {
      title: payload.title?.trim(),
      decisionNo: payload.decisionNo,
      decisionDate: payload.decisionDate ? new Date(payload.decisionDate) : undefined,
      issuer: payload.issuer,
      note: payload.note,
      attachmentUrl: payload.attachmentUrl,
    });
  },

  /**
   * Delete a party award record by id.
   */
  async deleteAward(id: string) {
    if (!id) throw new Error('id là bắt buộc');
    return PartyAwardRepo.delete(id);
  },

  // -------------------------------------------------------------------------
  // Disciplines
  // -------------------------------------------------------------------------

  /**
   * List party discipline records with optional filters and pagination.
   */
  async listDisciplines(filters: DisciplineListFilters) {
    const page = Math.max(1, filters.page);
    const limit = Math.min(100, Math.max(1, filters.limit));

    const { items, total } = await PartyDisciplineRepo.findMany({
      partyMemberId: filters.partyMemberId,
      severity: filters.severity,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
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
   * Create a new party discipline record.
   *
   * Business rule: severity KHAI_TRU_KHOI_DANG (expulsion from the Party) has
   * direct implications on the member's lifecycle status. The caller (or a
   * downstream event handler) should transition the PartyMember status to
   * KHAI_TRU via party-member.service / party-lifecycle.service after this
   * discipline record is created.
   *
   * TODO: Implement automatic lifecycle transition when severity is
   *       KHAI_TRU_KHOI_DANG — trigger PartyMemberStatus → KHAI_TRU and
   *       record a lifecycle event via createLifecycleTransitionTrail.
   */
  async createDiscipline(payload: DisciplineCreatePayload) {
    if (!payload.partyMemberId) {
      throw new Error('partyMemberId là bắt buộc');
    }
    if (!payload.severity) {
      throw new Error('Mức độ kỷ luật (severity) là bắt buộc');
    }

    const created = await PartyDisciplineRepo.create({
      partyMemberId: payload.partyMemberId,
      severity: payload.severity,
      decisionNo: payload.decisionNo ?? null,
      decisionDate: payload.decisionDate ? new Date(payload.decisionDate) : null,
      expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : null,
      issuer: payload.issuer ?? null,
      reason: payload.reason ?? null,
      attachmentUrl: payload.attachmentUrl ?? null,
    });

    // Note: KHAI_TRU_KHOI_DANG connection is intentionally left as a TODO above.
    // Once the lifecycle transition is implemented, add the call here.

    return created;
  },

  /**
   * Update an existing party discipline record.
   */
  async updateDiscipline(id: string, payload: DisciplineUpdatePayload) {
    if (!id) throw new Error('id là bắt buộc');

    return PartyDisciplineRepo.update(id, {
      severity: payload.severity,
      decisionNo: payload.decisionNo,
      decisionDate: payload.decisionDate ? new Date(payload.decisionDate) : undefined,
      expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : undefined,
      issuer: payload.issuer,
      reason: payload.reason,
      attachmentUrl: payload.attachmentUrl,
    });
  },
};
