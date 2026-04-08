import { TransferType } from '@prisma/client';
import { z } from 'zod';

const optionalNullableDate = z.preprocess(
  (v) => {
    if (v === undefined || v === null || v === '') return undefined;
    if (v instanceof Date) return v;
    return new Date(v as string);
  },
  z.date().optional().nullable(),
);

const requiredDate = z.preprocess(
  (v) => {
    if (v instanceof Date) return v;
    if (typeof v === 'string' && v.trim() !== '') return new Date(v);
    return undefined;
  },
  z.date({ required_error: 'Ngày chuyển sinh hoạt là bắt buộc' }),
);

const ConfirmStatus = z.enum(['PENDING', 'CONFIRMED', 'REJECTED']);

export const partyTransferListFiltersSchema = z.object({
  partyMemberId: z.string().trim().optional(),
  transferType: z.nativeEnum(TransferType).optional(),
  confirmStatus: ConfirmStatus.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const partyTransferCreateSchema = z
  .object({
    partyMemberId: z.string().trim().min(1, 'partyMemberId là bắt buộc'),
    transferType: z.nativeEnum(TransferType),
    fromPartyOrgId: z.string().trim().min(1, 'Tổ chức Đảng nguồn là bắt buộc'),
    toPartyOrgId: z.string().trim().min(1, 'Tổ chức Đảng đích là bắt buộc'),
    transferDate: requiredDate,
    introductionLetterNo: z.string().trim().optional().nullable(),
    note: z.string().trim().optional().nullable(),
  })
  .refine((data) => data.fromPartyOrgId !== data.toPartyOrgId, {
    message: 'Tổ chức Đảng nguồn và đích không được trùng nhau',
    path: ['toPartyOrgId'],
  });

export const partyTransferConfirmSchema = z.object({
  confirmDate: z.preprocess(
    (v) => {
      if (v instanceof Date) return v;
      if (typeof v === 'string' && v.trim() !== '') return new Date(v);
      return new Date();
    },
    z.date(),
  ),
  note: z.string().trim().optional().nullable(),
});

export type PartyTransferListFiltersInput = z.infer<typeof partyTransferListFiltersSchema>;
export type PartyTransferCreateInput = z.infer<typeof partyTransferCreateSchema>;
export type PartyTransferConfirmInput = z.infer<typeof partyTransferConfirmSchema>;
