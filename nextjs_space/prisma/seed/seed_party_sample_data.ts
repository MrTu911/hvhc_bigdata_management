/**
 * Seed Script: Party Sample Data (M03)
 *
 * Tạo dữ liệu mẫu đầy đủ cho Module M03 – CSDL Đảng viên.
 * Liên kết với cán bộ hiện có (User) và gán vào PartyOrganization đúng.
 *
 * Data được tạo:
 *   1. PartyMember          – từ cán bộ đang hoạt động
 *   2. PartyMemberHistory   – ADMITTED + OFFICIAL_CONFIRMED
 *   3. PartyAnnualReview    – xếp loại năm 2022–2025
 *   4. PartyFeePayment      – đảng phí 12 tháng gần nhất
 *   5. PartyMeeting +
 *      PartyMeetingAttendance – họp định kỳ theo quý (2024–2025)
 *
 * Idempotent – có thể chạy lại nhiều lần mà không sinh dữ liệu trùng.
 * Phụ thuộc: seed_party_organizations.ts phải đã chạy trước.
 *
 * Chạy:
 *   npx tsx --require dotenv/config prisma/seed/seed_party_sample_data.ts
 */

import {
  PrismaClient,
  PartyMemberStatus,
  PartyPosition,
  ReviewGrade,
  PartyHistoryType,
  UserRole,
  UserStatus,
  MeetingType,
} from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// ── Hằng số ──────────────────────────────────────────────────────────────────

const PARTY_FEE_MONTHLY = 30_000; // VND/tháng

const REVIEW_YEARS = [2022, 2023, 2024, 2025];

/** Phân bố xếp loại (HTTNV nhiều hơn) */
const GRADE_POOL: ReviewGrade[] = [
  ReviewGrade.HTXSNV,
  ReviewGrade.HTTNV, ReviewGrade.HTTNV, ReviewGrade.HTTNV,
  ReviewGrade.HTNV, ReviewGrade.HTNV,
  ReviewGrade.KHNV,
];

const GRADE_LABEL: Record<ReviewGrade, string> = {
  HTXSNV: 'Hoàn thành xuất sắc nhiệm vụ',
  HTTNV: 'Hoàn thành tốt nhiệm vụ',
  HTNV: 'Hoàn thành nhiệm vụ',
  KHNV: 'Không hoàn thành nhiệm vụ',
};

/** Lịch họp định kỳ theo quý */
const MEETING_SCHEDULE = [
  { month: 1,  day: 15, type: MeetingType.THUONG_KY,          label: 'Họp thường kỳ quý I' },
  { month: 4,  day: 10, type: MeetingType.THUONG_KY,          label: 'Họp thường kỳ quý II' },
  { month: 7,  day: 12, type: MeetingType.THUONG_KY,          label: 'Họp thường kỳ quý III' },
  { month: 10, day: 15, type: MeetingType.THUONG_KY,          label: 'Họp thường kỳ quý IV' },
  { month: 12, day: 20, type: MeetingType.KIEM_DIEM_CUOI_NAM, label: 'Kiểm điểm cuối năm' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function buildPartyCardNumber(index: number): string {
  return `DV-${String(200000 + index).padStart(7, '0')}`;
}

function buildJoinDate(seed: number): Date {
  const year = 2000 + (seed % 22); // 2000–2021
  const month = seed % 12;
  const day = 1 + (seed % 27);
  return new Date(year, month, day);
}

function buildOfficialDate(joinDate: Date): Date {
  return new Date(joinDate.getFullYear() + 1, joinDate.getMonth(), joinDate.getDate());
}

/** CHINH_THUC nếu officialDate đã qua, DU_BI nếu chưa đủ 1 năm dự bị */
function inferStatus(joinDate: Date): PartyMemberStatus {
  const officialDate = buildOfficialDate(joinDate);
  return officialDate <= new Date() ? PartyMemberStatus.CHINH_THUC : PartyMemberStatus.DU_BI;
}

function inferPosition(role: UserRole, seed: number): PartyPosition {
  switch (role) {
    case UserRole.CHI_HUY_HOC_VIEN:
      return seed % 2 === 0 ? PartyPosition.BI_THU : PartyPosition.PHO_BI_THU;
    case UserRole.CHI_HUY_KHOA_PHONG:
      return seed % 2 === 0 ? PartyPosition.BI_THU_CHI_BO : PartyPosition.PHO_BI_THU_CHI_BO;
    case UserRole.CHI_HUY_BO_MON:
    case UserRole.CHU_NHIEM_BO_MON:
      return pick(
        [PartyPosition.PHO_BI_THU_CHI_BO, PartyPosition.CAP_UY_VIEN, PartyPosition.TO_TRUONG_TO_DANG],
        seed,
      );
    default:
      return pick(
        [
          PartyPosition.DANG_VIEN, PartyPosition.DANG_VIEN, PartyPosition.DANG_VIEN,
          PartyPosition.TO_TRUONG_TO_DANG, PartyPosition.TO_PHO_TO_DANG,
        ],
        seed,
      );
  }
}

const POSITION_LABEL: Record<PartyPosition, string> = {
  BI_THU:             'Bí thư',
  PHO_BI_THU:         'Phó Bí thư',
  CAP_UY_VIEN:        'Cấp ủy viên',
  DANG_VIEN:          'Đảng viên',
  BI_THU_CHI_BO:      'Bí thư Chi bộ',
  PHO_BI_THU_CHI_BO:  'Phó Bí thư Chi bộ',
  TO_TRUONG_TO_DANG:  'Tổ trưởng Tổ đảng',
  TO_PHO_TO_DANG:     'Tổ phó Tổ đảng',
};

function shouldBecomePartyMember(role: UserRole, seed: number): boolean {
  switch (role) {
    case UserRole.CHI_HUY_HOC_VIEN:
    case UserRole.CHI_HUY_KHOA_PHONG:
    case UserRole.CHI_HUY_BO_MON:
    case UserRole.CHU_NHIEM_BO_MON:
    case UserRole.ADMIN:
    case UserRole.QUAN_TRI_HE_THONG:
      return true;
    case UserRole.GIANG_VIEN:
    case UserRole.NGHIEN_CUU_VIEN:
      return seed % 4 !== 0; // ~75%
    case UserRole.TRO_LY:
    case UserRole.NHAN_VIEN:
    case UserRole.KY_THUAT_VIEN:
      return seed % 3 === 0; // ~33%
    default:
      return seed % 5 === 0; // ~20%
  }
}

/** Chọn PartyOrganization phù hợp nhất cho user dựa trên unitId */
function resolveBestOrg(
  unitId: string | null,
  allOrgs: Array<{ id: string; code: string; unitId: string | null; name: string; shortName: string | null }>,
) {
  if (unitId) {
    const direct = allOrgs.find((o) => o.unitId === unitId);
    if (direct) return direct;
  }
  return allOrgs.find((o) => o.code === 'DANG_UY_HVHC') ?? allOrgs[0];
}

/** Trả về mảng paymentMonth "YYYY-MM" của n tháng gần nhất */
function recentMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    months.push(`${d.getFullYear()}-${mm}`);
  }
  return months;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎯  Seeding M03 Party sample data...\n');

  // ─── Tiền điều kiện ────────────────────────────────────────────────────────

  const orgCount = await prisma.partyOrganization.count({ where: { isActive: true } });
  if (orgCount === 0) {
    throw new Error(
      'Chưa có PartyOrganization nào. Hãy chạy seed_party_organizations.ts trước.',
    );
  }

  const allOrgs = await prisma.partyOrganization.findMany({
    where: { isActive: true },
    select: { id: true, code: true, unitId: true, name: true, shortName: true },
  });

  // ─── Step 1: PartyMember ──────────────────────────────────────────────────

  console.log('Step 1/5  PartyMember...');

  const users = await prisma.user.findMany({
    where: { status: UserStatus.ACTIVE },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      unitId: true,
      partyJoinDate: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (users.length === 0) {
    throw new Error('Không có User nào. Hãy chạy seed_users.ts trước.');
  }

  let pmCreated = 0;
  let pmUpdated = 0;
  let pmSkipped = 0;

  // Accumulate for subsequent steps
  const seededMembers: Array<{
    memberId: string;
    userId: string;
    joinDate: Date;
    officialDate: Date;
    status: PartyMemberStatus;
    position: PartyPosition;
    orgId: string;
    orgName: string;
    idx: number; // seed index
  }> = [];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const seed = i + 1;

    if (!shouldBecomePartyMember(user.role, seed)) {
      pmSkipped++;
      continue;
    }

    const org = resolveBestOrg(user.unitId, allOrgs);
    const joinDate  = user.partyJoinDate ?? buildJoinDate(seed);
    const officialDate = buildOfficialDate(joinDate);
    const status   = inferStatus(joinDate);
    const position = inferPosition(user.role, seed);

    const commonData = {
      organizationId:  org.id,
      partyCardNumber: buildPartyCardNumber(seed),
      partyRole:       POSITION_LABEL[position],
      currentPosition: position,
      joinDate,
      officialDate: status === PartyMemberStatus.CHINH_THUC ? officialDate : null,
      partyCell:       org.shortName ?? org.name,
      partyCommittee:  'Đảng ủy Học viện Hậu cần',
      recommender1:    'Đồng chí Nguyễn Văn A',
      recommender2:    'Đồng chí Trần Văn B',
      status,
      currentDebtAmount: 0,
    };

    const existing = await prisma.partyMember.findUnique({ where: { userId: user.id } });

    let memberId: string;
    if (!existing) {
      const created = await prisma.partyMember.create({
        data: { userId: user.id, ...commonData },
        select: { id: true },
      });
      memberId = created.id;
      pmCreated++;
    } else {
      await prisma.partyMember.update({
        where: { userId: user.id },
        data: commonData,
      });
      memberId = existing.id;
      pmUpdated++;
    }

    // Sync User cache
    await prisma.user.update({
      where: { id: user.id },
      data: {
        partyJoinDate: joinDate,
        partyPosition: POSITION_LABEL[position],
      },
    });

    seededMembers.push({
      memberId,
      userId: user.id,
      joinDate,
      officialDate,
      status,
      position,
      orgId:   org.id,
      orgName: org.name,
      idx: seed,
    });
  }

  console.log(`   Tạo mới: ${pmCreated}  |  Cập nhật: ${pmUpdated}  |  Bỏ qua: ${pmSkipped}`);

  // ─── Step 2: PartyMemberHistory ────────────────────────────────────────────

  console.log('Step 2/5  PartyMemberHistory (ADMITTED / OFFICIAL_CONFIRMED)...');

  let histCount = 0;

  for (const m of seededMembers) {
    const num = String(m.idx).padStart(3, '0');

    // ADMITTED
    const admittedExists = await prisma.partyMemberHistory.findFirst({
      where: { partyMemberId: m.memberId, historyType: PartyHistoryType.ADMITTED },
    });
    if (!admittedExists) {
      // decisionDate 1 month before joinDate
      const decDate = new Date(m.joinDate.getFullYear(), m.joinDate.getMonth() - 1, 20);
      await prisma.partyMemberHistory.create({
        data: {
          partyMemberId:   m.memberId,
          organizationId:  m.orgId,
          historyType:     PartyHistoryType.ADMITTED,
          position:        m.position,
          decisionNumber:  `QĐ-KN/${m.joinDate.getFullYear()}-${num}`,
          decisionDate:    decDate,
          effectiveDate:   m.joinDate,
          toOrganization:  m.orgName,
          notes:           'Kết nạp vào Đảng Cộng sản Việt Nam',
        },
      });
      histCount++;
    }

    // OFFICIAL_CONFIRMED (chỉ cho CHINH_THUC)
    if (m.status === PartyMemberStatus.CHINH_THUC) {
      const confirmedExists = await prisma.partyMemberHistory.findFirst({
        where: { partyMemberId: m.memberId, historyType: PartyHistoryType.OFFICIAL_CONFIRMED },
      });
      if (!confirmedExists) {
        const decDate = new Date(m.officialDate.getFullYear(), m.officialDate.getMonth() - 1, 20);
        await prisma.partyMemberHistory.create({
          data: {
            partyMemberId:   m.memberId,
            organizationId:  m.orgId,
            historyType:     PartyHistoryType.OFFICIAL_CONFIRMED,
            position:        m.position,
            decisionNumber:  `QĐ-CT/${m.officialDate.getFullYear()}-${num}`,
            decisionDate:    decDate,
            effectiveDate:   m.officialDate,
            notes:           'Chuyển thành đảng viên chính thức sau thời gian dự bị',
          },
        });
        histCount++;
      }
    }
  }

  console.log(`   Lịch sử đã tạo: ${histCount}`);

  // ─── Step 3: PartyAnnualReview ─────────────────────────────────────────────

  console.log('Step 3/5  PartyAnnualReview (2022–2025)...');

  const reviewRows: {
    partyMemberId: string;
    reviewYear:    number;
    grade:         ReviewGrade;
    comments:      string;
    approvedAt:    Date;
  }[] = [];

  for (const m of seededMembers) {
    for (const year of REVIEW_YEARS) {
      // Chỉ đánh giá khi thành viên đã gia nhập trước năm đó
      if (m.joinDate.getFullYear() > year) continue;

      const grade = pick(GRADE_POOL, m.idx + year);

      reviewRows.push({
        partyMemberId: m.memberId,
        reviewYear:    year,
        grade,
        comments:      `Năm ${year}: ${GRADE_LABEL[grade]}`,
        approvedAt:    new Date(year, 11, 28), // 28 tháng 12
      });
    }
  }

  const reviewResult = await prisma.partyAnnualReview.createMany({
    data:           reviewRows,
    skipDuplicates: true,
  });
  console.log(`   Xếp loại đã tạo: ${reviewResult.count}`);

  // ─── Step 4: PartyFeePayment ───────────────────────────────────────────────

  console.log('Step 4/5  PartyFeePayment (12 tháng gần nhất)...');

  const months = recentMonths(12);

  const feeRows: {
    partyMemberId: string;
    paymentMonth:  string;
    expectedAmount: number;
    actualAmount:   number;
    paymentDate:    Date | null;
    debtAmount:     number;
    status:         string;
    note:           string | null;
  }[] = [];

  for (const m of seededMembers) {
    const joinYear = m.joinDate.getFullYear();

    for (let mi = 0; mi < months.length; mi++) {
      const month = months[mi];
      const [payYear] = month.split('-').map(Number);

      // Chưa là đảng viên trong tháng đó
      if (payYear < joinYear) continue;

      // Phân bố tình trạng đóng phí: 5% chưa nộp, 5% nộp thiếu, 90% đã nộp
      const scenario = (m.idx + mi) % 20;
      const unpaid  = scenario === 0;
      const partial = scenario === 1;
      const paid    = !unpaid && !partial;

      const actual = paid ? PARTY_FEE_MONTHLY : partial ? PARTY_FEE_MONTHLY / 2 : 0;
      const debt   = PARTY_FEE_MONTHLY - actual;

      feeRows.push({
        partyMemberId:  m.memberId,
        paymentMonth:   month,
        expectedAmount: PARTY_FEE_MONTHLY,
        actualAmount:   actual,
        paymentDate:    actual > 0 ? new Date(`${month}-15`) : null,
        debtAmount:     debt,
        status:         paid ? 'PAID' : partial ? 'PARTIAL' : 'UNPAID',
        note:           debt > 0 ? `Còn nợ ${debt.toLocaleString('vi-VN')} đồng` : null,
      });
    }
  }

  const feeResult = await prisma.partyFeePayment.createMany({
    data:           feeRows,
    skipDuplicates: true,
  });
  console.log(`   Phiếu đảng phí đã tạo: ${feeResult.count}`);

  // Cập nhật currentDebtAmount trên từng PartyMember
  const debtUpdates = seededMembers.map(async (m) => {
    const agg = await prisma.partyFeePayment.aggregate({
      _sum:  { debtAmount: true },
      where: { partyMemberId: m.memberId },
    });
    return prisma.partyMember.update({
      where: { id: m.memberId },
      data:  { currentDebtAmount: agg._sum.debtAmount ?? 0 },
    });
  });
  await Promise.all(debtUpdates);

  // ─── Step 5: PartyMeeting + Attendance ─────────────────────────────────────

  console.log('Step 5/5  PartyMeeting + PartyMeetingAttendance...');

  const now = new Date();
  let meetingCreated    = 0;
  let attendanceCreated = 0;

  // Chỉ tạo họp cho tổ chức đang có đảng viên
  const activeOrgIds = new Set(seededMembers.map((m) => m.orgId));
  const activeOrgs   = allOrgs.filter((o) => activeOrgIds.has(o.id));

  for (const org of activeOrgs) {
    const orgMembers = seededMembers.filter((m) => m.orgId === org.id);
    if (orgMembers.length === 0) continue;

    for (const year of [2024, 2025]) {
      for (const slot of MEETING_SCHEDULE) {
        const meetingDate = new Date(year, slot.month - 1, slot.day);
        if (meetingDate > now) continue; // chưa đến

        // Idempotent: kiểm tra đã có họp cùng loại trong tháng đó chưa
        const exists = await prisma.partyMeeting.findFirst({
          where: {
            partyOrgId:  org.id,
            meetingType: slot.type,
            meetingDate: {
              gte: new Date(year, slot.month - 1, 1),
              lt:  new Date(year, slot.month,     1),
            },
          },
          select: { id: true },
        });

        let meetingId: string;
        if (!exists) {
          const orgShort = org.shortName ?? org.name;
          const created  = await prisma.partyMeeting.create({
            data: {
              partyOrgId:  org.id,
              meetingType: slot.type,
              title:       `${slot.label} năm ${year} – ${orgShort}`,
              meetingDate,
              location:    'Phòng họp đơn vị',
              agenda:
                `1. Đánh giá công tác Đảng tháng ${slot.month}/${year}\n` +
                `2. Triển khai nhiệm vụ tiếp theo\n` +
                `3. Ý kiến đảng viên`,
              status: 'done',
            },
            select: { id: true },
          });
          meetingId = created.id;
          meetingCreated++;
        } else {
          meetingId = exists.id;
        }

        // Điểm danh cho các đảng viên của tổ chức
        const attendanceRows = orgMembers.map((m, ai) => ({
          meetingId,
          partyMemberId:    m.memberId,
          // ~10% vắng mặt (đi công tác)
          attendanceStatus: (m.idx + ai + slot.month) % 10 === 0 ? 'ABSENT' : 'PRESENT',
          absenceReason:    (m.idx + ai + slot.month) % 10 === 0 ? 'Đi công tác' : null,
        }));

        const attResult = await prisma.partyMeetingAttendance.createMany({
          data:           attendanceRows,
          skipDuplicates: true,
        });
        attendanceCreated += attResult.count;
      }
    }
  }

  console.log(`   Cuộc họp đã tạo: ${meetingCreated}  |  Điểm danh đã tạo: ${attendanceCreated}`);

  // ─── Tổng kết ──────────────────────────────────────────────────────────────

  const [totalPM, totalHist, totalRev, totalFee, totalMtg, totalAtt] = await Promise.all([
    prisma.partyMember.count({ where: { deletedAt: null } }),
    prisma.partyMemberHistory.count(),
    prisma.partyAnnualReview.count(),
    prisma.partyFeePayment.count(),
    prisma.partyMeeting.count(),
    prisma.partyMeetingAttendance.count(),
  ]);

  console.log('\n══════════════════════════ KẾT QUẢ ══════════════════════════════');
  console.log(`PartyMember              : ${totalPM}`);
  console.log(`PartyMemberHistory       : ${totalHist}`);
  console.log(`PartyAnnualReview        : ${totalRev}`);
  console.log(`PartyFeePayment          : ${totalFee}`);
  console.log(`PartyMeeting             : ${totalMtg}`);
  console.log(`PartyMeetingAttendance   : ${totalAtt}`);
  console.log('═══════════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌  Seed thất bại:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
