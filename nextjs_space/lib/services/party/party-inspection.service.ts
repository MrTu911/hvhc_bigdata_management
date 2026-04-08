import 'server-only';

import { InspectionType } from '@prisma/client';
import { PartyInspectionRepo } from '@/lib/repositories/party/party-inspection.repo';

export interface InspectionListFilters {
  partyMemberId?: string;
  partyOrgId?: string;
  inspectionType?: InspectionType;
  isClosed?: boolean;
  page: number;
  limit: number;
}

export interface InspectionCreatePayload {
  partyMemberId?: string;
  partyOrgId?: string;
  inspectionType: InspectionType;
  title: string;
  openedAt: Date | string;
  closedAt?: Date | string;
  findings?: string;
  recommendation?: string;
  decisionRef?: string;
  attachmentUrl?: string;
}

export type InspectionUpdatePayload = Partial<Omit<InspectionCreatePayload, 'partyMemberId' | 'partyOrgId'>>;

export const PartyInspectionService = {
  /**
   * List party inspection targets with optional filters and pagination.
   */
  async listInspections(filters: InspectionListFilters) {
    const page = Math.max(1, filters.page);
    const limit = Math.min(100, Math.max(1, filters.limit));

    const { items, total } = await PartyInspectionRepo.findMany({
      partyMemberId: filters.partyMemberId,
      partyOrgId: filters.partyOrgId,
      inspectionType: filters.inspectionType,
      isClosed: filters.isClosed,
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
   * Get a single inspection record by id.
   * Throws a 404-equivalent error if not found.
   */
  async getInspectionById(id: string) {
    if (!id) throw new Error('id là bắt buộc');

    const inspection = await PartyInspectionRepo.findById(id);
    if (!inspection) {
      throw new Error('Không tìm thấy đợt kiểm tra');
    }

    return inspection;
  },

  /**
   * Create a new party inspection target record.
   *
   * At least one of partyMemberId or partyOrgId must be supplied so the
   * inspection is scoped to a specific member or party organisation.
   */
  async createInspection(payload: InspectionCreatePayload, createdBy?: string) {
    if (!payload.partyMemberId && !payload.partyOrgId) {
      throw new Error(
        'Phải cung cấp ít nhất một trong hai: partyMemberId (đảng viên) hoặc partyOrgId (tổ chức đảng)',
      );
    }
    if (!payload.inspectionType) {
      throw new Error('Loại kiểm tra (inspectionType) là bắt buộc');
    }
    if (!payload.title?.trim()) {
      throw new Error('Tiêu đề đợt kiểm tra không được để trống');
    }
    if (!payload.openedAt) {
      throw new Error('Ngày mở đợt kiểm tra (openedAt) là bắt buộc');
    }

    return PartyInspectionRepo.create(
      {
        partyMemberId: payload.partyMemberId ?? null,
        partyOrgId: payload.partyOrgId ?? null,
        inspectionType: payload.inspectionType,
        title: payload.title.trim(),
        openedAt: new Date(payload.openedAt),
        closedAt: payload.closedAt ? new Date(payload.closedAt) : null,
        findings: payload.findings ?? null,
        recommendation: payload.recommendation ?? null,
        decisionRef: payload.decisionRef ?? null,
        attachmentUrl: payload.attachmentUrl ?? null,
      },
      createdBy,
    );
  },

  /**
   * Update an existing party inspection record.
   *
   * Business rule: if closedAt is being set but findings is empty/absent,
   * this is allowed (not a hard block) because the findings section may be
   * attached as a document reference. The caller should display a UI warning
   * in this scenario.
   *
   * Note: intentionally not blocking — the handler layer should warn the user
   * when closedAt is provided but findings is empty.
   */
  async updateInspection(id: string, payload: InspectionUpdatePayload) {
    if (!id) throw new Error('id là bắt buộc');

    // Non-blocking warning: closing an inspection without written findings.
    // The route/UI layer should surface this to the user as a soft warning.
    if (payload.closedAt && !payload.findings?.trim()) {
      // WARNING: Đóng đợt kiểm tra mà không có nội dung kết quả kiểm tra (findings).
      // Khuyến nghị bổ sung kết quả kiểm tra trước khi đóng đợt.
      console.warn(
        `[PartyInspectionService] updateInspection id=${id}: closedAt set but findings is empty. ` +
          `Consider prompting the user to add findings before closing the inspection.`,
      );
    }

    return PartyInspectionRepo.update(id, {
      inspectionType: payload.inspectionType,
      title: payload.title?.trim(),
      openedAt: payload.openedAt ? new Date(payload.openedAt) : undefined,
      closedAt: payload.closedAt ? new Date(payload.closedAt) : undefined,
      findings: payload.findings,
      recommendation: payload.recommendation,
      decisionRef: payload.decisionRef,
      attachmentUrl: payload.attachmentUrl,
    });
  },
};
