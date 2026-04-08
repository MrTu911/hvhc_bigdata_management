/**
 * seed_m03_complete.ts  –  M03 Party Work / Political Work Database
 *
 * Single comprehensive seed for ALL M03 models in lifecycle order:
 *
 *   1.  PartyMember              – correct statuses (CHINH_THUC / DU_BI / …)
 *   2.  PartyMemberHistory       – ADMITTED, OFFICIAL_CONFIRMED, STATUS_CHANGED
 *   3.  PartyLifecycleEvent      – STATUS_TRANSITION events per member
 *   4.  PartyLifecycleAlert      – DU_BI deadline alerts
 *   5.  PartyRecruitmentPipeline – candidates not yet admitted
 *   6.  PartyMeeting             – quarterly + special meetings 2024–2025
 *   7.  PartyMeetingAttendance   – per-member attendance records
 *   8.  PartyFeePayment          – 12-month fees, mixed paid/partial/unpaid
 *   9.  PartyAnnualReview        – annual grades 2022–2025
 *   10. PartyAward               – Party-level recognition
 *   11. PartyDiscipline          – rare disciplinary cases
 *   12. PartyTransfer            – org-to-org transfer records
 *   13. PartyInspectionTarget    – UBKT inspection cases (org + individual)
 *   14. PartyActivity            – MEETING, STUDY, CRITICISM, VOLUNTEER, EVALUATION
 *
 * Idempotent – safe to re-run without duplicating data.
 *
 * Depends on:
 *   prisma/seed/seed_party_organizations.ts   (must run first)
 *   Users and Units already seeded
 *
 * Run:
 *   npx tsx --require dotenv/config prisma/seed/seed_m03_complete.ts
 */

import {
  DisciplineSeverity,
  InspectionType,
  MeetingType,
  PartyActivityType,
  PartyHistoryType,
  PartyMemberStatus,
  PartyPosition,
  PrismaClient,
  RecruitmentStep,
  ReviewGrade,
  TransferType,
  UserRole,
  UserStatus,
} from '@prisma/client';
import 'dotenv/config';

// PartyLifecycleEvent / Alert not yet in generated client – use string constants
const LifecycleEventType = {
  STATUS_TRANSITION:  'STATUS_TRANSITION',
  DEADLINE_COMPUTED:  'DEADLINE_COMPUTED',
} as const;
const LifecycleAlertType = {
  DU_BI_DUE_SOON: 'DU_BI_DUE_SOON',
  DU_BI_OVERDUE:  'DU_BI_OVERDUE',
} as const;

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function pick<T>(arr: readonly T[], index: number): T {
  return arr[Math.abs(index) % arr.length];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Normalise a string to safe DB id fragment */
function safeId(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1.  PartyMember
// ─────────────────────────────────────────────────────────────────────────────

const COMMANDER_ROLES: string[] = [
  'ADMIN', 'QUAN_TRI_HE_THONG',
  'CHI_HUY_HOC_VIEN', 'CHI_HUY_HE',
  'CHI_HUY_KHOA_PHONG', 'CHI_HUY_BO_MON', 'CHU_NHIEM_BO_MON',
];

/** Business rule: roles that must be party members */
function mustBePartyMember(role: UserRole): boolean {
  return COMMANDER_ROLES.includes(role as string);
}

/** Probability: return true if this user should be a party member */
function shouldBePartyMember(role: UserRole, idx: number): boolean {
  if (mustBePartyMember(role)) return true;
  if (role === UserRole.GIANG_VIEN || role === UserRole.NGHIEN_CUU_VIEN) return idx % 4 !== 0; // 75 %
  if (role === UserRole.TRO_LY || role === UserRole.NHAN_VIEN) return idx % 3 === 0;           // 33 %
  return idx % 6 === 0;                                                                         // 16 %
}

/** Lifecycle status distribution:
 *  commanders/heads  → CHINH_THUC
 *  lecturers         → mostly CHINH_THUC, 15 % DU_BI
 *  others            → CHINH_THUC / DU_BI / small CHUYEN_DI spread
 */
function inferStatus(role: UserRole, idx: number): PartyMemberStatus {
  if (mustBePartyMember(role)) return PartyMemberStatus.CHINH_THUC;
  if (role === UserRole.GIANG_VIEN || role === UserRole.NGHIEN_CUU_VIEN) {
    if (idx % 7 === 0) return PartyMemberStatus.DU_BI;
    if (idx % 13 === 0) return PartyMemberStatus.CHUYEN_DI;
    return PartyMemberStatus.CHINH_THUC;
  }
  const roll = idx % 10;
  if (roll === 0) return PartyMemberStatus.DU_BI;
  if (roll === 9) return PartyMemberStatus.CHUYEN_DI;
  return PartyMemberStatus.CHINH_THUC;
}

function inferPosition(role: UserRole, idx: number): PartyPosition {
  switch (role) {
    case UserRole.CHI_HUY_HOC_VIEN:
      return idx % 2 === 0 ? PartyPosition.BI_THU : PartyPosition.PHO_BI_THU;
    case UserRole.CHI_HUY_KHOA_PHONG:
      return idx % 2 === 0 ? PartyPosition.BI_THU_CHI_BO : PartyPosition.PHO_BI_THU_CHI_BO;
    case UserRole.CHI_HUY_BO_MON:
    case UserRole.CHU_NHIEM_BO_MON:
      return idx % 3 === 0 ? PartyPosition.CAP_UY_VIEN : PartyPosition.PHO_BI_THU_CHI_BO;
    default:
      if (idx % 8 === 0) return PartyPosition.TO_TRUONG_TO_DANG;
      if (idx % 8 === 4) return PartyPosition.TO_PHO_TO_DANG;
      return PartyPosition.DANG_VIEN;
  }
}

function buildJoinDate(seed: number): Date {
  const year = 2000 + (seed % 22);   // 2000–2021
  const month = seed % 12;
  const day = 1 + (seed % 27);
  return new Date(year, month, day);
}

async function seedMembers(
  users: Array<{
    id: string; email: string; role: UserRole; status: UserStatus;
    unit: string | null; department: string | null; unitId: string | null;
    partyJoinDate: Date | null; partyPosition: string | null;
  }>,
  orgs: Array<{ id: string; code: string; unit?: { code: string } | null }>,
  hasNewStatusEnums: boolean,
) {
  const root = orgs.find((o) => o.code === 'DANG_UY_HVHC') ?? orgs[0];
  const byUnitCode = new Map(orgs.filter((o) => o.unit?.code).map((o) => [o.unit!.code, o]));

  let created = 0, updated = 0, skipped = 0;
  const memberIds: string[] = [];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (!shouldBePartyMember(user.role, i)) { skipped++; continue; }

    const org = byUnitCode.get(user.unit ?? '') ?? byUnitCode.get(user.department ?? '') ?? root;
    const joinDate = user.partyJoinDate ?? buildJoinDate(i + 1);
    const officialDate = addDays(joinDate, 365);
    // Use legacy ACTIVE if new enum values not yet in DB
    const fullStatus = inferStatus(user.role, i);
    const status: PartyMemberStatus = hasNewStatusEnums
      ? fullStatus
      : (fullStatus === PartyMemberStatus.CHUYEN_DI ? 'TRANSFERRED' as PartyMemberStatus : 'ACTIVE' as PartyMemberStatus);
    const position = inferPosition(user.role, i);

    // DU_BI members use joinDate as dự bị start, officialDate in the future
    const statusChangeDate =
      status === PartyMemberStatus.DU_BI ? joinDate
      : status === PartyMemberStatus.CHUYEN_DI ? addDays(officialDate, (i % 500) + 30)
      : officialDate;

    // Only include fields that exist in the current DB migration
    const payload = {
      userId: user.id,
      organizationId: org.id,
      partyCardNumber: `DV-${String(300000 + i).padStart(7, '0')}`,
      joinDate,
      officialDate: status === PartyMemberStatus.DU_BI ? null : officialDate,
      partyCell: org.code,
      partyCommittee: 'Đảng ủy Học viện Hậu cần',
      recommender1: 'Đ/c Nguyễn Văn Minh',
      recommender2: 'Đ/c Trần Thị Lan',
      currentPosition: position,
      status,
      statusChangeDate,
      statusChangeReason:
        status === PartyMemberStatus.CHINH_THUC ? 'Công nhận đảng viên chính thức'
        : status === PartyMemberStatus.DU_BI ? 'Kết nạp đảng viên dự bị'
        : 'Chuyển sinh hoạt đảng',
      deletedAt: null as Date | null,
      deletedBy: null as string | null,
    };

    const existing = await prisma.partyMember.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    const selectId = { select: { id: true } } as const;
    if (!existing) {
      await prisma.partyMember.create({ data: payload, ...selectId });
      created++;
    } else {
      await prisma.partyMember.update({ where: { userId: user.id }, data: payload, ...selectId });
      updated++;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { partyJoinDate: joinDate, partyPosition: position },
    });

    const m = await prisma.partyMember.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (m) memberIds.push(m.id);
  }

  console.log(`  PartyMember: created=${created} updated=${updated} skipped=${skipped}`);
  return memberIds;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2.  PartyMemberHistory
// ─────────────────────────────────────────────────────────────────────────────

async function seedHistories(
  members: Array<{ id: string; joinDate: Date | null; officialDate: Date | null; status: PartyMemberStatus; organizationId: string | null }>,
  hasNewStatusEnums: boolean,
) {
  let count = 0;
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const joinDate = m.joinDate ?? buildJoinDate(i + 1);
    const orgId = m.organizationId ?? null;

    // ADMITTED history
    await prisma.partyMemberHistory.upsert({
      where: { id: `m03-admitted-${safeId(m.id)}` },
      update: {
        partyMemberId: m.id,
        organizationId: orgId,
        historyType: PartyHistoryType.ADMITTED,
        decisionNumber: `KN-${joinDate.getFullYear()}${String(i + 1).padStart(4, '0')}`,
        decisionDate: joinDate,
        effectiveDate: joinDate,
        reason: 'Kết nạp đảng viên theo quy trình chuẩn',
        notes: 'Biên bản hội nghị Chi bộ thông qua',
      },
      create: {
        id: `m03-admitted-${safeId(m.id)}`,
        partyMemberId: m.id,
        organizationId: orgId,
        historyType: PartyHistoryType.ADMITTED,
        decisionNumber: `KN-${joinDate.getFullYear()}${String(i + 1).padStart(4, '0')}`,
        decisionDate: joinDate,
        effectiveDate: joinDate,
        reason: 'Kết nạp đảng viên theo quy trình chuẩn',
        notes: 'Biên bản hội nghị Chi bộ thông qua',
      },
    });
    count++;

    // OFFICIAL_CONFIRMED (for CHINH_THUC/CHUYEN_DI or ACTIVE/TRANSFERRED when legacy enums)
    const isOfficial = hasNewStatusEnums
      ? (m.status === PartyMemberStatus.CHINH_THUC || m.status === PartyMemberStatus.CHUYEN_DI)
      : ((m.status as string) === 'ACTIVE' || (m.status as string) === 'TRANSFERRED');
    if (isOfficial) {
      const officialDate = m.officialDate ?? addDays(joinDate, 365);
      await prisma.partyMemberHistory.upsert({
        where: { id: `m03-official-${safeId(m.id)}` },
        update: {
          partyMemberId: m.id,
          organizationId: orgId,
          historyType: PartyHistoryType.OFFICIAL_CONFIRMED,
          decisionNumber: `CT-${officialDate.getFullYear()}${String(i + 1).padStart(4, '0')}`,
          decisionDate: officialDate,
          effectiveDate: officialDate,
          reason: 'Công nhận đảng viên chính thức sau 12 tháng dự bị',
          notes: 'Đủ điều kiện theo Điều lệ Đảng',
        },
        create: {
          id: `m03-official-${safeId(m.id)}`,
          partyMemberId: m.id,
          organizationId: orgId,
          historyType: PartyHistoryType.OFFICIAL_CONFIRMED,
          decisionNumber: `CT-${officialDate.getFullYear()}${String(i + 1).padStart(4, '0')}`,
          decisionDate: officialDate,
          effectiveDate: officialDate,
          reason: 'Công nhận đảng viên chính thức sau 12 tháng dự bị',
          notes: 'Đủ điều kiện theo Điều lệ Đảng',
        },
      });
      count++;
    }

    // TRANSFER_OUT for members who have CHUYEN_DI (or TRANSFERRED when legacy)
    const isTransferred = hasNewStatusEnums
      ? m.status === PartyMemberStatus.CHUYEN_DI
      : (m.status as string) === 'TRANSFERRED';
    if (isTransferred) {
      const transferDate = addDays(m.officialDate ?? joinDate, (i % 500) + 60);
      await prisma.partyMemberHistory.upsert({
        where: { id: `m03-transfer-out-${safeId(m.id)}` },
        update: {
          partyMemberId: m.id,
          organizationId: orgId,
          historyType: PartyHistoryType.TRANSFER_OUT,
          decisionNumber: `CDI-${transferDate.getFullYear()}${String(i + 1).padStart(4, '0')}`,
          decisionDate: transferDate,
          effectiveDate: transferDate,
          reason: 'Điều động công tác sang đơn vị mới',
          notes: 'Hoàn tất thủ tục chuyển sinh hoạt Đảng',
        },
        create: {
          id: `m03-transfer-out-${safeId(m.id)}`,
          partyMemberId: m.id,
          organizationId: orgId,
          historyType: PartyHistoryType.TRANSFER_OUT,
          decisionNumber: `CDI-${transferDate.getFullYear()}${String(i + 1).padStart(4, '0')}`,
          decisionDate: transferDate,
          effectiveDate: transferDate,
          reason: 'Điều động công tác sang đơn vị mới',
          notes: 'Hoàn tất thủ tục chuyển sinh hoạt Đảng',
        },
      });
      count++;
    }
  }
  console.log(`  PartyMemberHistory: ${count} records`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3.  PartyLifecycleEvent
// ─────────────────────────────────────────────────────────────────────────────

async function seedLifecycleEvents(
  members: Array<{ id: string; status: PartyMemberStatus; joinDate: Date | null }>,
  actorId: string,
) {
  // Use (prisma as any) because PartyLifecycleEvent may not be in generated client yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;
  if (!db.partyLifecycleEvent) {
    console.log('  PartyLifecycleEvent: skipped (run prisma generate first)');
    return;
  }

  let count = 0;
  const transitionMap: Record<string, [string, string]> = {
    CHINH_THUC: ['DU_BI', 'CHINH_THUC'],
    DU_BI:      ['DOI_TUONG', 'DU_BI'],
    CHUYEN_DI:  ['CHINH_THUC', 'CHUYEN_DI'],
  };

  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const pair = transitionMap[m.status as string];
    if (!pair) continue;

    const [fromStatus, toStatus] = pair;
    const eventDate = m.joinDate
      ? addDays(m.joinDate, toStatus === 'CHINH_THUC' ? 365 : 0)
      : new Date(2022, i % 12, 10);

    await db.partyLifecycleEvent.upsert({
      where: { id: `m03-lce-${safeId(m.id)}` },
      update: {
        partyMemberId: m.id,
        eventType: LifecycleEventType.STATUS_TRANSITION,
        fromStatus,
        toStatus,
        eventDate,
        note: `Chuyển trạng thái từ ${fromStatus} sang ${toStatus}`,
        triggeredBy: actorId,
      },
      create: {
        id: `m03-lce-${safeId(m.id)}`,
        partyMemberId: m.id,
        eventType: LifecycleEventType.STATUS_TRANSITION,
        fromStatus,
        toStatus,
        eventDate,
        note: `Chuyển trạng thái từ ${fromStatus} sang ${toStatus}`,
        triggeredBy: actorId,
      },
    });
    count++;

    // DU_BI → also create a DEADLINE_COMPUTED event
    if ((m.status as string) === 'DU_BI') {
      const dueDate = addDays(m.joinDate ?? new Date(), 365);
      await db.partyLifecycleEvent.upsert({
        where: { id: `m03-lce-deadline-${safeId(m.id)}` },
        update: {
          partyMemberId: m.id,
          eventType: LifecycleEventType.DEADLINE_COMPUTED,
          fromStatus: 'DU_BI',
          toStatus: 'CHINH_THUC',
          eventDate: m.joinDate ?? new Date(),
          dueDate,
          note: 'Thời hạn 12 tháng dự bị – đến hạn xét công nhận chính thức',
          triggeredBy: actorId,
        },
        create: {
          id: `m03-lce-deadline-${safeId(m.id)}`,
          partyMemberId: m.id,
          eventType: LifecycleEventType.DEADLINE_COMPUTED,
          fromStatus: 'DU_BI',
          toStatus: 'CHINH_THUC',
          eventDate: m.joinDate ?? new Date(),
          dueDate,
          note: 'Thời hạn 12 tháng dự bị – đến hạn xét công nhận chính thức',
          triggeredBy: actorId,
        },
      });
      count++;
    }
  }
  console.log(`  PartyLifecycleEvent: ${count} records`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.  PartyLifecycleAlert
// ─────────────────────────────────────────────────────────────────────────────

async function seedLifecycleAlerts(
  members: Array<{ id: string; status: PartyMemberStatus; joinDate: Date | null }>,
  hasNewStatusEnums: boolean,
) {
  // Use (prisma as any) because PartyLifecycleAlert may not be in generated client yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;
  if (!db.partyLifecycleAlert) {
    console.log('  PartyLifecycleAlert: skipped (run prisma generate first)');
    return;
  }

  let count = 0;
  const now = new Date();

  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    // DU_BI alerts only relevant when new status enum is in DB
    if (!hasNewStatusEnums) continue;
    if (m.status !== PartyMemberStatus.DU_BI) continue;

    const dueDate = addDays(m.joinDate ?? now, 365);
    const daysLeft = Math.round((dueDate.getTime() - now.getTime()) / 86_400_000);
    const alertType = daysLeft < 0 ? LifecycleAlertType.DU_BI_OVERDUE : LifecycleAlertType.DU_BI_DUE_SOON;
    const status = daysLeft < 0 ? 'OVERDUE' : 'ACTIVE';

    await db.partyLifecycleAlert.upsert({
      where: {
        partyMemberId_alertType_dueDate: { partyMemberId: m.id, alertType, dueDate },
      },
      update: { daysToDue: daysLeft, status, message: `Đảng viên dự bị đến hạn xét trong ${daysLeft} ngày` },
      create: {
        partyMemberId: m.id,
        alertType,
        dueDate,
        daysToDue: daysLeft,
        status,
        message: `Đảng viên dự bị đến hạn xét trong ${daysLeft} ngày`,
      },
    });
    count++;
  }
  console.log(`  PartyLifecycleAlert: ${count} records`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5.  PartyRecruitmentPipeline  (non-member users in pipeline)
// ─────────────────────────────────────────────────────────────────────────────

async function seedRecruitmentPipelines(
  nonMemberUserIds: string[],
  orgIds: string[],
) {
  const steps: RecruitmentStep[] = [
    RecruitmentStep.THEO_DOI,
    RecruitmentStep.HOC_CAM_TINH,
    RecruitmentStep.DOI_TUONG,
    RecruitmentStep.CHI_BO_XET,
    RecruitmentStep.CAP_TREN_DUYET,
  ];

  let count = 0;
  const candidates = nonMemberUserIds.slice(0, 20);

  for (let i = 0; i < candidates.length; i++) {
    const userId = candidates[i];
    const step = pick(steps, i);
    const base = addDays(new Date(2025, 0, 5), i * 9);

    const stepStr = step as string;
    const hasDoiTuong = ['DOI_TUONG', 'CHI_BO_XET', 'CAP_TREN_DUYET'].includes(stepStr);
    const hasChiBo   = ['CHI_BO_XET', 'CAP_TREN_DUYET'].includes(stepStr);

    await prisma.partyRecruitmentPipeline.upsert({
      where: { userId },
      update: {
        currentStep: step,
        targetPartyOrgId: pick(orgIds, i),
        camTinhDate: stepStr === 'THEO_DOI' ? null : base,
        doiTuongDate: hasDoiTuong ? addDays(base, 30) : null,
        chiBoProposalDate: hasChiBo ? addDays(base, 60) : null,
        capTrenApprovalDate: stepStr === 'CAP_TREN_DUYET' ? addDays(base, 90) : null,
        assistantMember1: 'Đ/c Nguyễn Văn Thắng',
        assistantMember2: 'Đ/c Lê Thị Hương',
        dossierStatus: stepStr === 'CAP_TREN_DUYET' ? 'COMPLETE' : 'IN_PROGRESS',
        note: `Theo dõi phát triển đảng viên – bước ${step}`,
      },
      create: {
        userId,
        currentStep: step,
        targetPartyOrgId: pick(orgIds, i),
        camTinhDate: stepStr === 'THEO_DOI' ? null : base,
        doiTuongDate: hasDoiTuong ? addDays(base, 30) : null,
        chiBoProposalDate: hasChiBo ? addDays(base, 60) : null,
        capTrenApprovalDate: stepStr === 'CAP_TREN_DUYET' ? addDays(base, 90) : null,
        assistantMember1: 'Đ/c Nguyễn Văn Thắng',
        assistantMember2: 'Đ/c Lê Thị Hương',
        dossierStatus: stepStr === 'CAP_TREN_DUYET' ? 'COMPLETE' : 'IN_PROGRESS',
        note: `Theo dõi phát triển đảng viên – bước ${step}`,
      },
    });
    count++;
  }
  console.log(`  PartyRecruitmentPipeline: ${count} records`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.  PartyMeeting + PartyMeetingAttendance
// ─────────────────────────────────────────────────────────────────────────────

const MEETING_SCHEDULE = [
  { year: 2024, month: 1,  day: 15, type: MeetingType.THUONG_KY,          label: 'Họp thường kỳ tháng 1/2024' },
  { year: 2024, month: 4,  day: 10, type: MeetingType.THUONG_KY,          label: 'Họp thường kỳ quý II/2024' },
  { year: 2024, month: 7,  day: 12, type: MeetingType.THUONG_KY,          label: 'Họp thường kỳ quý III/2024' },
  { year: 2024, month: 10, day: 15, type: MeetingType.THUONG_KY,          label: 'Họp thường kỳ quý IV/2024' },
  { year: 2024, month: 12, day: 20, type: MeetingType.KIEM_DIEM_CUOI_NAM, label: 'Kiểm điểm cuối năm 2024' },
  { year: 2025, month: 1,  day: 15, type: MeetingType.THUONG_KY,          label: 'Họp thường kỳ tháng 1/2025' },
  { year: 2025, month: 4,  day: 10, type: MeetingType.THUONG_KY,          label: 'Họp thường kỳ quý II/2025' },
  { year: 2025, month: 6,  day: 20, type: MeetingType.CHUYEN_DE,          label: 'Sinh hoạt chuyên đề học tập NQ TW' },
  { year: 2025, month: 9,  day: 5,  type: MeetingType.MO_RONG,            label: 'Hội nghị mở rộng sơ kết 9 tháng' },
];

async function seedMeetings(
  orgs: Array<{ id: string; code: string }>,
  memberIds: string[],
  actorId: string,
) {
  let meetingCount = 0;
  let attendanceCount = 0;

  for (let oi = 0; oi < Math.min(orgs.length, 8); oi++) {
    const org = orgs[oi];

    for (let si = 0; si < MEETING_SCHEDULE.length; si++) {
      const s = MEETING_SCHEDULE[si];
      const meetingDate = new Date(s.year, s.month - 1, s.day);
      const meetingId = `m03-meeting-${safeId(org.id)}-${s.year}-${String(s.month).padStart(2, '0')}`;

      await prisma.partyMeeting.upsert({
        where: { id: meetingId },
        update: {
          partyOrgId: org.id,
          meetingType: s.type,
          title: `${s.label} – ${org.code}`,
          meetingDate,
          location: 'Hội trường Chi bộ',
          agenda: 'Đánh giá kết quả công tác; triển khai nhiệm vụ tới; thông qua nghị quyết',
          status: 'published',
          createdBy: actorId,
        },
        create: {
          id: meetingId,
          partyOrgId: org.id,
          meetingType: s.type,
          title: `${s.label} – ${org.code}`,
          meetingDate,
          location: 'Hội trường Chi bộ',
          agenda: 'Đánh giá kết quả công tác; triển khai nhiệm vụ tới; thông qua nghị quyết',
          status: 'published',
          createdBy: actorId,
        },
      });
      meetingCount++;

      // Attendance: distribute members across orgs by slice
      const slice = memberIds.slice((oi * 6) % Math.max(memberIds.length, 1), ((oi * 6) % Math.max(memberIds.length, 1)) + 8);
      for (let mi = 0; mi < slice.length; mi++) {
        const partyMemberId = slice[mi];
        const absent = (oi + si + mi) % 9 === 0;
        const late = (oi + si + mi) % 11 === 0;
        await prisma.partyMeetingAttendance.upsert({
          where: { meetingId_partyMemberId: { meetingId, partyMemberId } },
          update: {
            attendanceStatus: absent ? 'ABSENT' : late ? 'LATE' : 'PRESENT',
            absenceReason: absent ? 'Công tác đột xuất theo lệnh chỉ huy' : null,
          },
          create: {
            meetingId,
            partyMemberId,
            attendanceStatus: absent ? 'ABSENT' : late ? 'LATE' : 'PRESENT',
            absenceReason: absent ? 'Công tác đột xuất theo lệnh chỉ huy' : null,
          },
        });
        attendanceCount++;
      }
    }
  }
  console.log(`  PartyMeeting: ${meetingCount}  PartyMeetingAttendance: ${attendanceCount}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7.  PartyFeePayment  (12 months of 2025, mixed statuses)
// ─────────────────────────────────────────────────────────────────────────────

async function seedFees(memberIds: string[]) {
  let count = 0;
  const base = new Date(2025, 0, 1);

  for (let i = 0; i < Math.min(memberIds.length, 60); i++) {
    const partyMemberId = memberIds[i];
    // Fee scale: 30 000 – 90 000 based on position band
    const expectedAmount = 30_000 + (i % 7) * 10_000;

    for (let m = 0; m < 12; m++) {
      const monthDate = addMonths(base, m);
      const paymentMonth = monthKey(monthDate);
      const roll = (i + m) % 10;
      const paid    = roll < 7;          // 70 % fully paid
      const partial = roll === 7;        // 10 % partial
      const unpaid  = roll >= 8;         // 20 % unpaid

      const actualAmount = paid ? expectedAmount : partial ? expectedAmount * 0.5 : 0;
      const debtAmount   = expectedAmount - actualAmount;

      await prisma.partyFeePayment.upsert({
        where: { partyMemberId_paymentMonth: { partyMemberId, paymentMonth } },
        update: {
          expectedAmount,
          actualAmount,
          paymentDate: paid || partial ? addDays(monthDate, 8) : null,
          debtAmount,
          status: paid ? 'PAID' : partial ? 'PARTIAL' : 'UNPAID',
          note: paid ? null : partial ? 'Nộp một phần' : 'Chưa nộp đảng phí tháng này',
        },
        create: {
          partyMemberId,
          paymentMonth,
          expectedAmount,
          actualAmount,
          paymentDate: paid || partial ? addDays(monthDate, 8) : null,
          debtAmount,
          status: paid ? 'PAID' : partial ? 'PARTIAL' : 'UNPAID',
          note: paid ? null : partial ? 'Nộp một phần' : 'Chưa nộp đảng phí tháng này',
        },
      });
      count++;
    }

    // Note: currentDebtAmount sync skipped – field not yet migrated in DB
  }
  console.log(`  PartyFeePayment: ${count} records`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 8.  PartyAnnualReview  (2022–2025)
// ─────────────────────────────────────────────────────────────────────────────

const GRADE_POOL: ReviewGrade[] = [
  ReviewGrade.HTXSNV,
  ReviewGrade.HTTNV, ReviewGrade.HTTNV, ReviewGrade.HTTNV,
  ReviewGrade.HTNV, ReviewGrade.HTNV,
  ReviewGrade.KHNV,
];

const GRADE_LABEL: Record<ReviewGrade, string> = {
  HTXSNV: 'Hoàn thành xuất sắc nhiệm vụ',
  HTTNV:  'Hoàn thành tốt nhiệm vụ',
  HTNV:   'Hoàn thành nhiệm vụ',
  KHNV:   'Không hoàn thành nhiệm vụ',
};

async function seedAnnualReviews(memberIds: string[], actorId: string) {
  let count = 0;
  for (let i = 0; i < Math.min(memberIds.length, 60); i++) {
    const partyMemberId = memberIds[i];
    let latestGrade: ReviewGrade = ReviewGrade.HTTNV;

    for (const year of [2022, 2023, 2024, 2025]) {
      const grade = pick(GRADE_POOL, i * 4 + year);
      latestGrade = grade;

      await prisma.partyAnnualReview.upsert({
        where: { partyMemberId_reviewYear: { partyMemberId, reviewYear: year } },
        update: {
          grade,
          comments: `${year}: ${GRADE_LABEL[grade]}. Chấp hành nghiêm kỷ luật, tích cực tham gia sinh hoạt Đảng.`,
          approvedBy: actorId,
          approvedAt: new Date(year, 11, 20),
        },
        create: {
          partyMemberId,
          reviewYear: year,
          grade,
          comments: `${year}: ${GRADE_LABEL[grade]}. Chấp hành nghiêm kỷ luật, tích cực tham gia sinh hoạt Đảng.`,
          approvedBy: actorId,
          approvedAt: new Date(year, 11, 20),
        },
      });
      count++;
    }

    // Note: currentReviewGrade sync skipped – field not yet migrated in DB
    void latestGrade;
  }
  console.log(`  PartyAnnualReview: ${count} records`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 9.  PartyAward
// ─────────────────────────────────────────────────────────────────────────────

const AWARD_TITLES = [
  'Đảng viên hoàn thành xuất sắc nhiệm vụ',
  'Bằng khen đảng viên gương mẫu',
  'Chiến sĩ thi đua cơ sở',
  'Bằng khen của Đảng ủy Quân sự',
  'Hoàn thành xuất sắc nhiệm vụ huấn luyện sẵn sàng chiến đấu',
];

async function seedAwards(memberIds: string[]) {
  let count = 0;
  for (let i = 0; i < memberIds.length; i++) {
    if (i % 3 !== 0) continue;   // ~33 % get awards
    const partyMemberId = memberIds[i];
    const year = 2023 + (i % 3);
    const decisionDate = new Date(year, 11, 15);

    await prisma.partyAward.upsert({
      where: { id: `m03-award-${safeId(partyMemberId)}` },
      update: {
        title: pick(AWARD_TITLES, i),
        decisionNo: `KT-${year}${String(i + 1).padStart(4, '0')}`,
        decisionDate,
        issuer: 'Đảng ủy Học viện Hậu cần',
        note: 'Khen thưởng cuối năm theo Nghị quyết hội nghị Đảng ủy',
      },
      create: {
        id: `m03-award-${safeId(partyMemberId)}`,
        partyMemberId,
        title: pick(AWARD_TITLES, i),
        decisionNo: `KT-${year}${String(i + 1).padStart(4, '0')}`,
        decisionDate,
        issuer: 'Đảng ủy Học viện Hậu cần',
        note: 'Khen thưởng cuối năm theo Nghị quyết hội nghị Đảng ủy',
      },
    });
    count++;
  }
  console.log(`  PartyAward: ${count} records`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. PartyDiscipline  (rare – ~10 %)
// ─────────────────────────────────────────────────────────────────────────────

const DISCIPLINE_REASONS = [
  'Vi phạm quy chế sinh hoạt chi bộ, vắng họp không có lý do',
  'Chậm nộp đảng phí quá 6 tháng, thiếu tinh thần tự phê bình',
  'Vi phạm quy định về bảo mật thông tin trong công tác Đảng',
];

async function seedDisciplines(memberIds: string[]) {
  let count = 0;
  const severities: DisciplineSeverity[] = [
    DisciplineSeverity.KHIEN_TRACH,
    DisciplineSeverity.KHIEN_TRACH,
    DisciplineSeverity.CANH_CAO,
  ];

  for (let i = 0; i < memberIds.length; i++) {
    if (i % 10 !== 0) continue;   // ~10 %
    const partyMemberId = memberIds[i];
    const decisionDate = new Date(2025, 5 + (i % 6), 15);

    await prisma.partyDiscipline.upsert({
      where: { id: `m03-discipline-${safeId(partyMemberId)}` },
      update: {
        severity: pick(severities, i),
        decisionNo: `KL-2025${String(i + 1).padStart(4, '0')}`,
        decisionDate,
        expiryDate: addDays(decisionDate, 180),
        issuer: 'Ủy ban Kiểm tra Đảng ủy Học viện',
        reason: pick(DISCIPLINE_REASONS, i),
      },
      create: {
        id: `m03-discipline-${safeId(partyMemberId)}`,
        partyMemberId,
        severity: pick(severities, i),
        decisionNo: `KL-2025${String(i + 1).padStart(4, '0')}`,
        decisionDate,
        expiryDate: addDays(decisionDate, 180),
        issuer: 'Ủy ban Kiểm tra Đảng ủy Học viện',
        reason: pick(DISCIPLINE_REASONS, i),
      },
    });
    count++;
  }
  console.log(`  PartyDiscipline: ${count} records`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. PartyTransfer  (CHINH_THUC members only, ~12)
// ─────────────────────────────────────────────────────────────────────────────

async function seedTransfers(
  members: Array<{ id: string; organizationId: string | null; status: PartyMemberStatus }>,
  orgIds: string[],
) {
  if (orgIds.length < 2) { console.log('  PartyTransfer: skipped (< 2 orgs)'); return; }

  const eligible = members.filter((m) =>
    m.organizationId &&
    ((m.status as string) === 'CHINH_THUC' || (m.status as string) === 'ACTIVE'),
  );
  let count = 0;

  for (let i = 0; i < Math.min(eligible.length, 12); i++) {
    const m = eligible[i];
    const fromId = m.organizationId!;
    const toId   = orgIds.find((id) => id !== fromId) ?? orgIds[(i + 1) % orgIds.length];
    if (fromId === toId) continue;

    const transferDate = addDays(new Date(2025, 3, 1), i * 12);
    const isTemporary  = i % 3 === 0;

    await prisma.partyTransfer.upsert({
      where: { id: `m03-transfer-${safeId(m.id)}` },
      update: {
        partyMemberId: m.id,
        transferType: isTemporary ? TransferType.CHUYEN_SINH_HOAT_TAM_THOI : TransferType.CHUYEN_DANG_CHINH_THUC,
        fromPartyOrgId: fromId,
        toPartyOrgId: toId,
        transferDate,
        introductionLetterNo: `GTH-2025${String(i + 1).padStart(4, '0')}`,
        confirmStatus: i % 4 === 0 ? 'PENDING' : 'CONFIRMED',
        confirmDate:   i % 4 === 0 ? null : addDays(transferDate, 7),
        note: isTemporary ? 'Chuyển sinh hoạt tạm thời theo điều động công tác' : 'Chuyển đảng chính thức do thuyên chuyển công tác',
      },
      create: {
        id: `m03-transfer-${safeId(m.id)}`,
        partyMemberId: m.id,
        transferType: isTemporary ? TransferType.CHUYEN_SINH_HOAT_TAM_THOI : TransferType.CHUYEN_DANG_CHINH_THUC,
        fromPartyOrgId: fromId,
        toPartyOrgId: toId,
        transferDate,
        introductionLetterNo: `GTH-2025${String(i + 1).padStart(4, '0')}`,
        confirmStatus: i % 4 === 0 ? 'PENDING' : 'CONFIRMED',
        confirmDate:   i % 4 === 0 ? null : addDays(transferDate, 7),
        note: isTemporary ? 'Chuyển sinh hoạt tạm thời theo điều động công tác' : 'Chuyển đảng chính thức do thuyên chuyển công tác',
      },
    });
    count++;
  }
  console.log(`  PartyTransfer: ${count} records`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. PartyInspectionTarget  (UBKT – org-level + individual)
// ─────────────────────────────────────────────────────────────────────────────

const INSPECTION_FINDINGS = [
  'Cơ bản chấp hành tốt. Một số biên bản họp chưa được lưu trữ đúng quy định.',
  'Thực hiện đúng các quy định về sinh hoạt chi bộ và thu nộp đảng phí.',
  'Phát hiện 02 trường hợp vắng họp không có lý do chính đáng; đề xuất nhắc nhở.',
  'Kết quả tốt. Hệ thống hồ sơ đảng viên được duy trì đầy đủ và cập nhật kịp thời.',
];

async function seedInspections(
  members: Array<{ id: string }>,
  orgIds: string[],
  actorId: string,
) {
  const types: InspectionType[] = [
    InspectionType.KIEM_TRA_DINH_KY,
    InspectionType.GIAM_SAT_CHUYEN_DE,
    InspectionType.KIEM_TRA_KHI_CO_DAU_HIEU,
    InspectionType.PHUC_KET_KY_LUAT,
  ];
  let count = 0;

  // Org-level inspections (one per active org, up to 8)
  for (let i = 0; i < Math.min(orgIds.length, 8); i++) {
    const partyOrgId = orgIds[i];
    const openedAt = addDays(new Date(2025, 1, 1), i * 15);
    const closed = i % 3 !== 0;

    await prisma.partyInspectionTarget.upsert({
      where: { id: `m03-insp-org-${safeId(partyOrgId)}` },
      update: {
        partyMemberId: null,
        partyOrgId,
        inspectionType: pick(types, i),
        title: `Kiểm tra định kỳ tổ chức đảng – đợt ${i + 1}/2025`,
        openedAt,
        closedAt: closed ? addDays(openedAt, 14) : null,
        findings: pick(INSPECTION_FINDINGS, i),
        recommendation: 'Tiếp tục duy trì và nâng cao nền nếp sinh hoạt chi bộ',
        decisionRef: `UBKT-2025${String(i + 1).padStart(3, '0')}`,
        createdBy: actorId,
      },
      create: {
        id: `m03-insp-org-${safeId(partyOrgId)}`,
        partyMemberId: null,
        partyOrgId,
        inspectionType: pick(types, i),
        title: `Kiểm tra định kỳ tổ chức đảng – đợt ${i + 1}/2025`,
        openedAt,
        closedAt: closed ? addDays(openedAt, 14) : null,
        findings: pick(INSPECTION_FINDINGS, i),
        recommendation: 'Tiếp tục duy trì và nâng cao nền nếp sinh hoạt chi bộ',
        decisionRef: `UBKT-2025${String(i + 1).padStart(3, '0')}`,
        createdBy: actorId,
      },
    });
    count++;
  }

  // Individual-level inspections (~10 members)
  for (let i = 0; i < Math.min(members.length, 10); i++) {
    const partyMemberId = members[i].id;
    const partyOrgId = orgIds[i % orgIds.length] ?? null;
    const openedAt = addDays(new Date(2025, 3, 1), i * 10);

    await prisma.partyInspectionTarget.upsert({
      where: { id: `m03-insp-mbr-${safeId(partyMemberId)}` },
      update: {
        partyMemberId,
        partyOrgId,
        inspectionType: pick([InspectionType.GIAM_SAT_CHUYEN_DE, InspectionType.KIEM_TRA_KHI_CO_DAU_HIEU], i),
        title: `Giám sát chuyên đề đảng viên – đợt ${i + 1}`,
        openedAt,
        closedAt: i % 2 === 0 ? addDays(openedAt, 10) : null,
        findings: pick(INSPECTION_FINDINGS, i + 2),
        recommendation: 'Nhắc nhở; yêu cầu báo cáo giải trình và khắc phục',
        decisionRef: `GSCD-2025${String(i + 1).padStart(3, '0')}`,
        createdBy: actorId,
      },
      create: {
        id: `m03-insp-mbr-${safeId(partyMemberId)}`,
        partyMemberId,
        partyOrgId,
        inspectionType: pick([InspectionType.GIAM_SAT_CHUYEN_DE, InspectionType.KIEM_TRA_KHI_CO_DAU_HIEU], i),
        title: `Giám sát chuyên đề đảng viên – đợt ${i + 1}`,
        openedAt,
        closedAt: i % 2 === 0 ? addDays(openedAt, 10) : null,
        findings: pick(INSPECTION_FINDINGS, i + 2),
        recommendation: 'Nhắc nhở; yêu cầu báo cáo giải trình và khắc phục',
        decisionRef: `GSCD-2025${String(i + 1).padStart(3, '0')}`,
        createdBy: actorId,
      },
    });
    count++;
  }
  console.log(`  PartyInspectionTarget: ${count} records`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. PartyActivity  (6 types, 4 per member, evaluation covers all years)
// ─────────────────────────────────────────────────────────────────────────────

const ACTIVITY_DESCRIPTIONS: Record<PartyActivityType, string[]> = {
  MEETING:     ['Sinh hoạt chi bộ định kỳ tháng', 'Họp chi bộ triển khai nghị quyết quý'],
  STUDY:       ['Học tập và quán triệt Nghị quyết Hội nghị TW', 'Học chuyên đề xây dựng Đảng'],
  CRITICISM:   ['Kiểm điểm tự phê bình và phê bình cuối kỳ', 'Đánh giá nội bộ chi bộ theo Điều lệ Đảng'],
  VOLUNTEER:   ['Tham gia ngày chủ nhật xanh – dân vận', 'Hoạt động tình nguyện hỗ trợ địa phương'],
  EVALUATION:  ['Đánh giá xếp loại đảng viên năm', 'Bình xét thi đua khen thưởng chi bộ'],
  OTHER:       ['Tham gia hoạt động Đảng khác', 'Công tác phát triển đảng viên'],
};

async function seedActivities(
  members: Array<{ id: string; organizationId: string | null }>,
  orgNameMap: Map<string, string>,
) {
  const types: PartyActivityType[] = [
    PartyActivityType.MEETING,
    PartyActivityType.STUDY,
    PartyActivityType.CRITICISM,
    PartyActivityType.VOLUNTEER,
    PartyActivityType.OTHER,
  ];
  let count = 0;

  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const orgName = (m.organizationId ? orgNameMap.get(m.organizationId) : null) ?? 'Học viện Hậu cần';

    // 4 regular activities
    for (let j = 0; j < 4; j++) {
      const type = pick(types, i + j);
      const activityDate = addDays(new Date(2025, 0, 10), i * 3 + j * 20);
      const desc = pick(ACTIVITY_DESCRIPTIONS[type], i + j);

      await prisma.partyActivity.upsert({
        where: { id: `m03-act-${safeId(m.id)}-${j}` },
        update: {
          partyMemberId: m.id,
          activityType: type,
          activityDate,
          description: desc,
          location: orgName,
          result: 'Hoàn thành đúng yêu cầu',
        },
        create: {
          id: `m03-act-${safeId(m.id)}-${j}`,
          partyMemberId: m.id,
          activityType: type,
          activityDate,
          description: desc,
          location: orgName,
          result: 'Hoàn thành đúng yêu cầu',
        },
      });
      count++;
    }

    // EVALUATION activity for each year
    for (const year of [2022, 2023, 2024, 2025]) {
      const evalGrades = ['HOAN_THANH_XUAT_SAC', 'HOAN_THANH_TOT', 'HOAN_THANH', 'KHONG_HOAN_THANH'] as const;
      await prisma.partyActivity.upsert({
        where: { id: `m03-eval-${safeId(m.id)}-${year}` },
        update: {
          partyMemberId: m.id,
          activityType: PartyActivityType.EVALUATION,
          activityDate: new Date(year, 11, 25),
          description: `Đánh giá phân loại đảng viên năm ${year}`,
          location: 'Chi bộ đơn vị',
          result: 'Đã hoàn thành đánh giá',
          evaluationYear: year,
          evaluationGrade: pick(evalGrades, i + year),
          evaluationNotes: 'Chấp hành tốt kỷ luật, tham gia đầy đủ sinh hoạt',
        },
        create: {
          id: `m03-eval-${safeId(m.id)}-${year}`,
          partyMemberId: m.id,
          activityType: PartyActivityType.EVALUATION,
          activityDate: new Date(year, 11, 25),
          description: `Đánh giá phân loại đảng viên năm ${year}`,
          location: 'Chi bộ đơn vị',
          result: 'Đã hoàn thành đánh giá',
          evaluationYear: year,
          evaluationGrade: pick(evalGrades, i + year),
          evaluationNotes: 'Chấp hành tốt kỷ luật, tham gia đầy đủ sinh hoạt',
        },
      });
      count++;
    }
  }
  console.log(`  PartyActivity: ${count} records`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

/** Check which M03 tables have been migrated to the DB */
async function checkMigrationState(): Promise<{
  hasNewStatusEnums: boolean;
  hasMeetings: boolean;
  hasFees: boolean;
  hasReviews: boolean;
  hasAwards: boolean;
  hasDisciplines: boolean;
  hasTransfers: boolean;
  hasInspections: boolean;
  hasRecruitment: boolean;
}> {
  const tables: string[] = await prisma.$queryRawUnsafe(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'party%'"
  ).then((r: unknown[]) => (r as { tablename: string }[]).map((t) => t.tablename));

  const enums: string[] = await prisma.$queryRawUnsafe(
    "SELECT typname FROM pg_type WHERE typcategory='E' AND typname IN ('ReviewGrade','DisciplineSeverity','TransferType','InspectionType','RecruitmentStep','MeetingType')"
  ).then((r: unknown[]) => (r as { typname: string }[]).map((t) => t.typname));

  // Check if PartyMemberStatus has new values
  let hasNewStatusEnums = false;
  try {
    const statusEnums: string[] = await prisma.$queryRawUnsafe(
      "SELECT enum_range(NULL::\"PartyMemberStatus\")"
    ).then((r: unknown[]) => {
      const row = (r as Record<string, unknown>[])[0];
      const val = Object.values(row)[0];
      return Array.isArray(val) ? val as string[] : [];
    });
    hasNewStatusEnums = statusEnums.includes('CHINH_THUC');
  } catch { hasNewStatusEnums = false; }

  return {
    hasNewStatusEnums,
    hasMeetings:    tables.includes('party_meetings'),
    hasFees:        tables.includes('party_fee_payments'),
    hasReviews:     tables.includes('party_annual_reviews'),
    hasAwards:      tables.includes('party_awards'),
    hasDisciplines: tables.includes('party_disciplines'),
    hasTransfers:   tables.includes('party_transfers'),
    hasInspections: tables.includes('party_inspection_targets'),
    hasRecruitment: tables.includes('party_recruitment_pipelines'),
  };
}

async function main() {
  console.log('\n🌱  seed_m03_complete  –  M03 Party Work / Political Work Database\n');

  // ── Migration state check ──────────────────────────────────────────────────
  const migration = await checkMigrationState();
  const missingTables = Object.entries(migration)
    .filter(([k, v]) => k !== 'hasNewStatusEnums' && !v)
    .map(([k]) => k.replace('has', ''));

  if (missingTables.length > 0 || !migration.hasNewStatusEnums) {
    console.log('\n⚠️  MIGRATION REQUIRED');
    console.log('   The following M03 tables/enums are not yet in the DB:');
    if (!migration.hasNewStatusEnums) console.log('   - PartyMemberStatus new values (CHINH_THUC, DU_BI, etc.)');
    missingTables.forEach((t) => console.log(`   - ${t}`));
    console.log('\n   Run the migration first:');
    console.log('     npx prisma db push        (dev/demo)');
    console.log('     npx prisma migrate deploy  (production)');
    console.log('\n   Then re-run this seed.');
    console.log('\n   Continuing with available tables only...\n');
  }

  // ── Pre-flight checks ──────────────────────────────────────────────────────
  const orgsRaw = await prisma.partyOrganization.findMany({
    where: { isActive: true },
    select: {
      id: true, code: true, name: true, level: true, isActive: true,
      unit: { select: { code: true } },
    },
    orderBy: [{ level: 'asc' }, { code: 'asc' }],
  });
  if (orgsRaw.length === 0) throw new Error('No PartyOrganizations found. Run seed_party_organizations.ts first.');

  const orgIds    = orgsRaw.map((o) => o.id);
  const orgNameMap = new Map(orgsRaw.map((o) => [o.id, o.name]));

  const actor = await prisma.user.findFirst({
    where: { role: { in: [UserRole.QUAN_TRI_HE_THONG, UserRole.ADMIN] }, status: UserStatus.ACTIVE },
    select: { id: true },
  });
  if (!actor) throw new Error('No QUAN_TRI_HE_THONG/ADMIN user found.');
  const actorId = actor.id;

  // ── 1. PartyMember ─────────────────────────────────────────────────────────
  console.log('➤  1. PartyMember');
  const candidateUsers = await prisma.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      role: {
        in: [
          UserRole.ADMIN, UserRole.QUAN_TRI_HE_THONG,
          UserRole.CHI_HUY_HOC_VIEN, UserRole.CHI_HUY_KHOA_PHONG,
          UserRole.CHI_HUY_BO_MON, UserRole.CHU_NHIEM_BO_MON,
          UserRole.GIANG_VIEN, UserRole.NGHIEN_CUU_VIEN,
          UserRole.TRO_LY, UserRole.NHAN_VIEN, UserRole.KY_THUAT_VIEN,
        ],
      },
    },
    select: {
      id: true, email: true, role: true, status: true,
      unit: true, department: true, unitId: true,
      partyJoinDate: true, partyPosition: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const memberIds = await seedMembers(candidateUsers, orgsRaw, migration.hasNewStatusEnums);
  if (memberIds.length === 0) throw new Error('No PartyMember records created. Check user roles/status.');

  // Re-load with fields needed downstream (only fields that exist in current DB migration)
  const members = await prisma.partyMember.findMany({
    where: { id: { in: memberIds }, deletedAt: null },
    select: { id: true, status: true, joinDate: true, officialDate: true, organizationId: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!members.length) throw new Error('No PartyMember records loaded after seeding.');

  // ── 2. PartyMemberHistory ──────────────────────────────────────────────────
  console.log('➤  2. PartyMemberHistory');
  await seedHistories(members, migration.hasNewStatusEnums);

  // ── 3. PartyLifecycleEvent ─────────────────────────────────────────────────
  console.log('➤  3. PartyLifecycleEvent');
  await seedLifecycleEvents(members, actorId);

  // ── 4. PartyLifecycleAlert ─────────────────────────────────────────────────
  console.log('➤  4. PartyLifecycleAlert');
  await seedLifecycleAlerts(members, migration.hasNewStatusEnums);

  // ── 5. PartyRecruitmentPipeline ────────────────────────────────────────────
  if (migration.hasRecruitment) {
    console.log('➤  5. PartyRecruitmentPipeline');
    const memberUserIds = new Set(
      await prisma.partyMember.findMany({ select: { userId: true } }).then((r) => r.map((m) => m.userId)),
    );
    const nonMemberUserIds = candidateUsers
      .filter((u) => !memberUserIds.has(u.id))
      .map((u) => u.id);
    await seedRecruitmentPipelines(nonMemberUserIds, orgIds);
  } else { console.log('  ⏩ 5. PartyRecruitmentPipeline skipped – table not migrated'); }

  // ── 6. PartyMeeting + Attendance ───────────────────────────────────────────
  if (migration.hasMeetings) {
    console.log('➤  6. PartyMeeting + PartyMeetingAttendance');
    await seedMeetings(orgsRaw, memberIds, actorId);
  } else { console.log('  ⏩ 6. PartyMeeting skipped – table not migrated'); }

  // ── 7. PartyFeePayment ─────────────────────────────────────────────────────
  if (migration.hasFees) {
    console.log('➤  7. PartyFeePayment');
    await seedFees(memberIds);
  } else { console.log('  ⏩ 7. PartyFeePayment skipped – table not migrated'); }

  // ── 8. PartyAnnualReview ───────────────────────────────────────────────────
  if (migration.hasReviews) {
    console.log('➤  8. PartyAnnualReview');
    await seedAnnualReviews(memberIds, actorId);
  } else { console.log('  ⏩ 8. PartyAnnualReview skipped – table not migrated'); }

  // ── 9. PartyAward ──────────────────────────────────────────────────────────
  if (migration.hasAwards) {
    console.log('➤  9. PartyAward');
    await seedAwards(memberIds);
  } else { console.log('  ⏩ 9. PartyAward skipped – table not migrated'); }

  // ── 10. PartyDiscipline ────────────────────────────────────────────────────
  if (migration.hasDisciplines) {
    console.log('➤  10. PartyDiscipline');
    await seedDisciplines(memberIds);
  } else { console.log('  ⏩ 10. PartyDiscipline skipped – table not migrated'); }

  // ── 11. PartyTransfer ──────────────────────────────────────────────────────
  if (migration.hasTransfers) {
    console.log('➤  11. PartyTransfer');
    await seedTransfers(members, orgIds);
  } else { console.log('  ⏩ 11. PartyTransfer skipped – table not migrated'); }

  // ── 12. PartyInspectionTarget ──────────────────────────────────────────────
  if (migration.hasInspections) {
    console.log('➤  12. PartyInspectionTarget');
    await seedInspections(members, orgIds, actorId);
  } else { console.log('  ⏩ 12. PartyInspectionTarget skipped – table not migrated'); }

  // ── 13. PartyActivity ──────────────────────────────────────────────────────
  console.log('➤  13. PartyActivity');
  await seedActivities(members, orgNameMap);

  // ── Summary ────────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  async function safeCount(model: string): Promise<number | string> {
    try {
      return db[model] ? await db[model].count() : 'n/a';
    } catch { return 'n/a'; }
  }

  const [
    totalMembers, totalHistory, totalActivities,
  ] = await Promise.all([
    prisma.partyMember.count({ where: { deletedAt: null } }),
    prisma.partyMemberHistory.count(),
    prisma.partyActivity.count(),
  ]);
  const [
    totalPipeline, totalMeetings, totalAttendance, totalFees, totalReviews,
    totalAwards, totalDisciplines, totalTransfers, totalInspections,
    totalLCE, totalLCA,
  ] = await Promise.all([
    safeCount('partyRecruitmentPipeline'),
    safeCount('partyMeeting'),
    safeCount('partyMeetingAttendance'),
    safeCount('partyFeePayment'),
    safeCount('partyAnnualReview'),
    safeCount('partyAward'),
    safeCount('partyDiscipline'),
    safeCount('partyTransfer'),
    safeCount('partyInspectionTarget'),
    safeCount('partyLifecycleEvent'),
    safeCount('partyLifecycleAlert'),
  ]);

  console.log('\n════════════════════ M03 SEED SUMMARY ════════════════════');
  console.table({
    PartyMember:             totalMembers,
    PartyMemberHistory:      totalHistory,
    PartyLifecycleEvent:     totalLCE,
    PartyLifecycleAlert:     totalLCA,
    PartyRecruitmentPipeline: totalPipeline,
    PartyMeeting:            totalMeetings,
    PartyMeetingAttendance:  totalAttendance,
    PartyFeePayment:         totalFees,
    PartyAnnualReview:       totalReviews,
    PartyAward:              totalAwards,
    PartyDiscipline:         totalDisciplines,
    PartyTransfer:           totalTransfers,
    PartyInspectionTarget:   totalInspections,
    PartyActivity:           totalActivities,
  });
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('✅  seed_m03_complete finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌  seed_m03_complete failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
