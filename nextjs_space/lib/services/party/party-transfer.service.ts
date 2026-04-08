import 'server-only';

import { TransferType } from '@prisma/client';
import { PartyTransferRepo } from '@/lib/repositories/party/party-transfer.repo';
import db from '@/lib/db';

export interface TransferListFilters {
  partyMemberId?: string;
  fromPartyOrgId?: string;
  toPartyOrgId?: string;
  transferType?: TransferType;
  confirmStatus?: string;
  page: number;
  limit: number;
}

export interface TransferCreatePayload {
  partyMemberId: string;
  transferType: TransferType;
  fromPartyOrgId: string;
  toPartyOrgId: string;
  transferDate: Date | string;
  introductionLetterNo?: string;
  note?: string;
}

export const PartyTransferService = {
  /**
   * List party transfer records with optional filters and pagination.
   */
  async listTransfers(filters: TransferListFilters) {
    const page = Math.max(1, filters.page);
    const limit = Math.min(100, Math.max(1, filters.limit));

    const { items, total } = await PartyTransferRepo.findMany({
      partyMemberId: filters.partyMemberId,
      fromPartyOrgId: filters.fromPartyOrgId,
      toPartyOrgId: filters.toPartyOrgId,
      transferType: filters.transferType,
      confirmStatus: filters.confirmStatus,
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
   * Create a new party transfer record.
   *
   * - Validates that origin and destination party organisations are different.
   * - For CHUYEN_DANG_CHINH_THUC (official transfer): immediately updates the
   *   PartyMember's organizationId to the destination org and sets status to
   *   CHUYEN_DI to reflect the member has moved out of their current org.
   * - For CHUYEN_SINH_HOAT_TAM_THOI (temporary transfer): creates the record
   *   only; the member's home organisationId is not changed.
   */
  async createTransfer(payload: TransferCreatePayload) {
    if (!payload.partyMemberId) throw new Error('partyMemberId là bắt buộc');
    if (!payload.transferType) throw new Error('Loại chuyển sinh hoạt (transferType) là bắt buộc');
    if (!payload.fromPartyOrgId) throw new Error('Đảng bộ gốc (fromPartyOrgId) là bắt buộc');
    if (!payload.toPartyOrgId) throw new Error('Đảng bộ nhận (toPartyOrgId) là bắt buộc');
    if (!payload.transferDate) throw new Error('Ngày chuyển (transferDate) là bắt buộc');

    if (payload.fromPartyOrgId === payload.toPartyOrgId) {
      throw new Error('Đảng bộ gốc và đảng bộ nhận không được trùng nhau');
    }

    const transfer = await PartyTransferRepo.create({
      partyMemberId: payload.partyMemberId,
      transferType: payload.transferType,
      fromPartyOrgId: payload.fromPartyOrgId,
      toPartyOrgId: payload.toPartyOrgId,
      transferDate: new Date(payload.transferDate),
      introductionLetterNo: payload.introductionLetterNo ?? null,
      note: payload.note ?? null,
    });

    // For an official transfer, update the member's home organisation and status.
    if (payload.transferType === TransferType.CHUYEN_DANG_CHINH_THUC) {
      await db.partyMember.update({
        where: { id: payload.partyMemberId },
        data: {
          organizationId: payload.toPartyOrgId,
          status: 'CHUYEN_DI',
          statusChangeDate: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return transfer;
  },

  /**
   * Confirm a pending party transfer.
   *
   * The transfer must currently be in PENDING status; otherwise an error is thrown.
   * Sets the confirmation date to now.
   */
  async confirmTransfer(id: string) {
    if (!id) throw new Error('id là bắt buộc');

    const transfer = await PartyTransferRepo.findById(id);
    if (!transfer) {
      throw new Error('Không tìm thấy hồ sơ chuyển sinh hoạt đảng');
    }

    if (transfer.confirmStatus !== 'PENDING') {
      throw new Error(
        `Không thể xác nhận: hồ sơ đang ở trạng thái "${transfer.confirmStatus}", chỉ cho phép xác nhận khi PENDING`,
      );
    }

    return PartyTransferRepo.confirm(id, new Date());
  },
};
