import 'server-only';
import db from '@/lib/db';
import { MeetingType, Prisma } from '@prisma/client';

export interface PartyMeetingCreateInput {
  partyOrgId: string;
  meetingType: MeetingType;
  title: string;
  meetingDate: Date;
  location?: string;
  agenda?: string;
  createdBy?: string;
}

export interface PartyMeetingUpdateInput {
  meetingType?: MeetingType;
  title?: string;
  meetingDate?: Date;
  location?: string;
  agenda?: string;
  minutesUrl?: string;
  resolutionUrl?: string;
  status?: string;
}

export interface PartyMeetingFindManyInput {
  search?: string;
  partyOrgId?: string;
  meetingType?: MeetingType;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  limit: number;
}

export interface AttendanceEntry {
  partyMemberId: string;
  attendanceStatus: string;
  absenceReason?: string;
  note?: string;
}

const LIST_INCLUDE = {
  partyOrg: {
    select: { id: true, code: true, name: true },
  },
  _count: {
    select: { attendances: true },
  },
} as const;

const DETAIL_INCLUDE = {
  partyOrg: {
    select: { id: true, code: true, name: true },
  },
  attendances: {
    include: {
      partyMember: {
        select: {
          id: true,
          partyRole: true,
          currentPosition: true,
          user: {
            select: { id: true, name: true, militaryId: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

export const PartyMeetingRepo = {
  async findMany(input: PartyMeetingFindManyInput) {
    const { search, partyOrgId, meetingType, status, dateFrom, dateTo, page, limit } = input;
    const skip = (page - 1) * limit;

    const where: Prisma.PartyMeetingWhereInput = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(partyOrgId && { partyOrgId }),
      ...(meetingType && { meetingType }),
      ...(status && { status }),
      ...((dateFrom || dateTo) && {
        meetingDate: {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo }),
        },
      }),
    };

    const [items, total] = await Promise.all([
      db.partyMeeting.findMany({
        where,
        include: LIST_INCLUDE,
        orderBy: { meetingDate: 'desc' },
        skip,
        take: limit,
      }),
      db.partyMeeting.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: string) {
    return db.partyMeeting.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
  },

  async create(input: PartyMeetingCreateInput) {
    return db.partyMeeting.create({
      data: {
        partyOrgId: input.partyOrgId,
        meetingType: input.meetingType,
        title: input.title,
        meetingDate: input.meetingDate,
        location: input.location,
        agenda: input.agenda,
        createdBy: input.createdBy,
        status: 'draft',
      },
      include: LIST_INCLUDE,
    });
  },

  async update(id: string, input: PartyMeetingUpdateInput) {
    return db.partyMeeting.update({
      where: { id },
      data: input,
      include: LIST_INCLUDE,
    });
  },

  async upsertAttendances(meetingId: string, entries: AttendanceEntry[]) {
    if (entries.length === 0) return;

    // First pass: createMany with skipDuplicates for new entries
    await db.partyMeetingAttendance.createMany({
      data: entries.map((e) => ({
        meetingId,
        partyMemberId: e.partyMemberId,
        attendanceStatus: e.attendanceStatus,
        absenceReason: e.absenceReason,
        note: e.note,
      })),
      skipDuplicates: true,
    });

    // Second pass: update each existing entry via upsert
    await Promise.all(
      entries.map((e) =>
        db.partyMeetingAttendance.upsert({
          where: {
            meetingId_partyMemberId: {
              meetingId,
              partyMemberId: e.partyMemberId,
            },
          },
          create: {
            meetingId,
            partyMemberId: e.partyMemberId,
            attendanceStatus: e.attendanceStatus,
            absenceReason: e.absenceReason,
            note: e.note,
          },
          update: {
            attendanceStatus: e.attendanceStatus,
            absenceReason: e.absenceReason,
            note: e.note,
          },
        }),
      ),
    );
  },

  async updateMinutes(
    meetingId: string,
    data: { minutesUrl?: string; resolutionUrl?: string; status?: string },
  ) {
    return db.partyMeeting.update({
      where: { id: meetingId },
      data,
      include: LIST_INCLUDE,
    });
  },
};
