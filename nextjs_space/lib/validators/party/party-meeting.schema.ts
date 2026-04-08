import { MeetingType } from '@prisma/client';
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
  z.date({ required_error: 'Ngày họp là bắt buộc' }),
);

export const partyMeetingListFiltersSchema = z.object({
  partyOrgId: z.string().trim().optional(),
  meetingType: z.nativeEnum(MeetingType).optional(),
  dateFrom: optionalNullableDate,
  dateTo: optionalNullableDate,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const partyMeetingCreateSchema = z.object({
  partyOrgId: z.string().trim().min(1, 'partyOrgId là bắt buộc'),
  meetingType: z.nativeEnum(MeetingType),
  title: z.string().trim().min(1, 'Tiêu đề cuộc họp là bắt buộc'),
  meetingDate: requiredDate,
  location: z.string().trim().optional().nullable(),
  agenda: z.string().trim().optional().nullable(),
});

export const partyMeetingUpdateSchema = partyMeetingCreateSchema
  .omit({ partyOrgId: true })
  .partial();

export const partyAttendanceEntrySchema = z.object({
  partyMemberId: z.string().trim().min(1, 'partyMemberId là bắt buộc'),
  attendanceStatus: z.string().trim().min(1, 'Trạng thái tham dự là bắt buộc'),
  absenceReason: z.string().trim().optional().nullable(),
  note: z.string().trim().optional().nullable(),
});

export const partyAttendanceUpsertSchema = z.object({
  entries: z
    .array(partyAttendanceEntrySchema)
    .min(1, 'Phải có ít nhất một bản ghi điểm danh'),
});

export const partyMinutesUpdateSchema = z.object({
  minutesUrl: z.string().trim().url('URL biên bản không hợp lệ').optional().nullable(),
  resolutionUrl: z.string().trim().url('URL nghị quyết không hợp lệ').optional().nullable(),
  status: z.string().trim().optional().nullable(),
});

export type PartyMeetingListFiltersInput = z.infer<typeof partyMeetingListFiltersSchema>;
export type PartyMeetingCreateInput = z.infer<typeof partyMeetingCreateSchema>;
export type PartyMeetingUpdateInput = z.infer<typeof partyMeetingUpdateSchema>;
export type PartyAttendanceEntryInput = z.infer<typeof partyAttendanceEntrySchema>;
export type PartyAttendanceUpsertInput = z.infer<typeof partyAttendanceUpsertSchema>;
export type PartyMinutesUpdateInput = z.infer<typeof partyMinutesUpdateSchema>;
