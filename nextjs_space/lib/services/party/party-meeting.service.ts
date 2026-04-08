import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { randomUUID } from 'crypto';

const MEETING_TYPES = [
  'THUONG_KY',
  'BAT_THUONG',
  'MO_RONG',
  'CHUYEN_DE',
  'KIEM_DIEM_CUOI_NAM',
  'BAU_CU',
] as const;

function ensureMeetingType(value?: string | null) {
  if (!value) throw new Error('meetingType là bắt buộc');
  const normalized = value.trim().toUpperCase();
  if (!MEETING_TYPES.includes(normalized as (typeof MEETING_TYPES)[number])) {
    throw new Error('meetingType không hợp lệ');
  }
  return normalized;
}

function ensureMeetingDate(value?: string | Date) {
  if (!value) throw new Error('meetingDate là bắt buộc');
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) throw new Error('meetingDate không hợp lệ');
  return dt;
}

export async function listPartyMeetings(filters: {
  search?: string;
  partyOrgId?: string;
  meetingType?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, Number(filters.page || 1));
  const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)));
  const offset = (page - 1) * limit;

  const conditions: Prisma.Sql[] = [Prisma.sql`1=1`];
  if (filters.search) {
    const q = `%${filters.search.trim()}%`;
    conditions.push(Prisma.sql`(m.title ILIKE ${q} OR m.agenda ILIKE ${q})`);
  }
  if (filters.partyOrgId) conditions.push(Prisma.sql`m."partyOrgId" = ${filters.partyOrgId}`);
  if (filters.meetingType) conditions.push(Prisma.sql`m."meetingType" = ${filters.meetingType.trim().toUpperCase()}`);
  if (filters.status) conditions.push(Prisma.sql`m.status = ${filters.status}`);
  if (filters.fromDate) conditions.push(Prisma.sql`m."meetingDate" >= ${new Date(filters.fromDate)}`);
  if (filters.toDate) conditions.push(Prisma.sql`m."meetingDate" <= ${new Date(filters.toDate)}`);

  const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

  const [items, totalRows] = await Promise.all([
    prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        m.*,
        o.name AS "partyOrgName",
        COALESCE(att.total_count, 0) AS "attendanceCount",
        COALESCE(att.present_count, 0) AS "presentCount",
        CASE
          WHEN COALESCE(att.total_count, 0) = 0 THEN 0
          ELSE ROUND((att.present_count::numeric / att.total_count::numeric) * 100, 2)
        END AS "attendanceRate"
      FROM party_meetings m
      LEFT JOIN party_organizations o ON o.id = m."partyOrgId"
      LEFT JOIN (
        SELECT
          "meetingId",
          COUNT(*)::int AS total_count,
          COUNT(*) FILTER (WHERE "attendanceStatus" = 'present')::int AS present_count
        FROM party_meeting_attendances
        GROUP BY "meetingId"
      ) att ON att."meetingId" = m.id
      ${whereSql}
      ORDER BY m."meetingDate" DESC, m."createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `),
    prisma.$queryRaw<{ total: bigint }[]>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM party_meetings m
      ${whereSql}
    `),
  ]);

  const total = Number(totalRows[0]?.total || 0);
  return {
    items,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function getPartyMeetingById(id: string) {
  const [meeting] = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT m.*, o.name AS "partyOrgName"
    FROM party_meetings m
    LEFT JOIN party_organizations o ON o.id = m."partyOrgId"
    WHERE m.id = ${id}
    LIMIT 1
  `);
  if (!meeting) return null;

  const attendances = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT
      a.*,
      pm."partyCardNumber",
      u.name AS "partyMemberName"
    FROM party_meeting_attendances a
    JOIN party_members pm ON pm.id = a."partyMemberId"
    JOIN users u ON u.id = pm."userId"
    WHERE a."meetingId" = ${id}
    ORDER BY u.name ASC
  `);

  const presentCount = attendances.filter((x) => x.attendanceStatus === 'present').length;
  const totalCount = attendances.length;

  return {
    ...meeting,
    attendances,
    stats: {
      attendanceCount: totalCount,
      presentCount,
      attendanceRate: totalCount > 0 ? Number(((presentCount * 100) / totalCount).toFixed(2)) : 0,
    },
  };
}

export async function createPartyMeeting(payload: any, createdBy?: string) {
  if (!payload?.partyOrgId) throw new Error('partyOrgId là bắt buộc');
  if (!payload?.title?.trim()) throw new Error('title là bắt buộc');

  const meetingDate = ensureMeetingDate(payload.meetingDate);
  const meetingType = ensureMeetingType(payload.meetingType);

  const [org] = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT id FROM party_organizations WHERE id = ${payload.partyOrgId} LIMIT 1
  `);
  if (!org) throw new Error('partyOrgId không tồn tại');

  const [created] = await prisma.$queryRaw<any[]>(Prisma.sql`
    INSERT INTO party_meetings (
      id, "partyOrgId", "meetingType", title, "meetingDate", location, agenda,
      "minutesUrl", "resolutionUrl", status, "createdBy", "createdAt", "updatedAt"
    ) VALUES (
      ${randomUUID()},
      ${payload.partyOrgId},
      ${meetingType},
      ${payload.title.trim()},
      ${meetingDate},
      ${payload.location || null},
      ${payload.agenda || null},
      ${payload.minutesUrl || null},
      ${payload.resolutionUrl || null},
      ${payload.status || 'draft'},
      ${createdBy || payload.createdBy || null},
      NOW(), NOW()
    )
    RETURNING *
  `);

  return created;
}

export async function upsertMeetingAttendance(meetingId: string, payload: any) {
  const items = Array.isArray(payload) ? payload : payload?.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Danh sách attendance rỗng');
  }

  const [meeting] = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT id FROM party_meetings WHERE id = ${meetingId} LIMIT 1
  `);
  if (!meeting) throw new Error('Không tìm thấy meeting');

  const invalid = items.find((x) => !x.partyMemberId || !x.attendanceStatus);
  if (invalid) throw new Error('partyMemberId và attendanceStatus là bắt buộc');

  await prisma.$transaction(
    items.map((item) => {
      const status = String(item.attendanceStatus).trim().toLowerCase();
      if (!['present', 'absent'].includes(status)) {
        throw new Error('attendanceStatus chỉ nhận present/absent');
      }
      return prisma.$executeRaw(Prisma.sql`
        INSERT INTO party_meeting_attendances (
          id, "meetingId", "partyMemberId", "attendanceStatus", "absenceReason", note, "createdAt", "updatedAt"
        ) VALUES (
          ${randomUUID()},
          ${meetingId},
          ${item.partyMemberId},
          ${status},
          ${item.absenceReason || null},
          ${item.note || null},
          NOW(), NOW()
        )
        ON CONFLICT ("meetingId", "partyMemberId")
        DO UPDATE SET
          "attendanceStatus" = EXCLUDED."attendanceStatus",
          "absenceReason" = EXCLUDED."absenceReason",
          note = EXCLUDED.note,
          "updatedAt" = NOW()
      `);
    }),
  );

  return getPartyMeetingById(meetingId);
}

export async function updateMeetingMinutes(meetingId: string, payload: any) {
  const [meeting] = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT id FROM party_meetings WHERE id = ${meetingId} LIMIT 1
  `);
  if (!meeting) return null;

  const [updated] = await prisma.$queryRaw<any[]>(Prisma.sql`
    UPDATE party_meetings
    SET
      "minutesUrl" = ${payload.minutesUrl ?? null},
      "resolutionUrl" = ${payload.resolutionUrl ?? null},
      status = ${payload.status || 'held'},
      "updatedAt" = NOW()
    WHERE id = ${meetingId}
    RETURNING *
  `);

  return updated;
}
