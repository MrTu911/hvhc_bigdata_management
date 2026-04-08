/**
 * Seed Script: Party Business Flow Data (M03)
 *
 * Mục tiêu:
 * - Bổ sung dữ liệu mẫu cho toàn bộ chức năng sidebar M03 theo luồng nghiệp vụ
 * - Dựa trên dữ liệu hiện có (party members/organizations/users)
 * - Upsert/idempotent: chạy lại không tạo trùng mất kiểm soát
 */

import {
  DisciplineSeverity,
  InspectionType,
  MeetingType,
  PartyMemberStatus,
  PrismaClient,
  RecruitmentStep,
  ReviewGrade,
  TransferType,
} from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

function monthKey(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${y}-${m}`;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function pick<T>(arr: readonly T[], index: number): T {
  return arr[index % arr.length];
}

function safeId(input: string) {
  return input.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
}

async function seedAdmissionsHistory(memberIds: string[], orgIds: string[]) {
  let admissionCount = 0;
  let officialCount = 0;

  for (let i = 0; i < Math.min(memberIds.length, 30); i++) {
    const partyMemberId = memberIds[i];
    const organizationId = orgIds[i % orgIds.length] ?? null;
    const admittedDate = addDays(new Date(2024, 0, 10), i * 11);

    await prisma.partyMemberHistory.upsert({
      where: { id: `seed-admission-${safeId(partyMemberId)}` },
      update: {
        partyMemberId,
        organizationId,
        historyType: 'ADMITTED',
        decisionNumber: `KN-${2024}${String(i + 1).padStart(3, '0')}`,
        decisionDate: admittedDate,
        effectiveDate: admittedDate,
        reason: 'Kết nạp đảng viên theo quy trình chuẩn',
        notes: 'Seed quy trình kết nạp',
      },
      create: {
        id: `seed-admission-${safeId(partyMemberId)}`,
        partyMemberId,
        organizationId,
        historyType: 'ADMITTED',
        decisionNumber: `KN-${2024}${String(i + 1).padStart(3, '0')}`,
        decisionDate: admittedDate,
        effectiveDate: admittedDate,
        reason: 'Kết nạp đảng viên theo quy trình chuẩn',
        notes: 'Seed quy trình kết nạp',
      },
    });
    admissionCount++;

    if (i % 2 === 0) {
      const officialDate = addDays(admittedDate, 365);
      await prisma.partyMemberHistory.upsert({
        where: { id: `seed-official-${safeId(partyMemberId)}` },
        update: {
          partyMemberId,
          organizationId,
          historyType: 'OFFICIAL_CONFIRMED',
          decisionNumber: `CT-${2025}${String(i + 1).padStart(3, '0')}`,
          decisionDate: officialDate,
          effectiveDate: officialDate,
          reason: 'Công nhận đảng viên chính thức',
          notes: 'Seed lịch sử công nhận chính thức',
        },
        create: {
          id: `seed-official-${safeId(partyMemberId)}`,
          partyMemberId,
          organizationId,
          historyType: 'OFFICIAL_CONFIRMED',
          decisionNumber: `CT-${2025}${String(i + 1).padStart(3, '0')}`,
          decisionDate: officialDate,
          effectiveDate: officialDate,
          reason: 'Công nhận đảng viên chính thức',
          notes: 'Seed lịch sử công nhận chính thức',
        },
      });
      officialCount++;
    }
  }

  return { admissionCount, officialCount };
}

async function seedActivities(memberIds: string[]) {
  let activityCount = 0;
  const activityTypes = ['MEETING', 'STUDY', 'CRITICISM', 'VOLUNTEER', 'OTHER'] as const;

  for (let i = 0; i < Math.min(memberIds.length, 28); i++) {
    const partyMemberId = memberIds[i];

    for (let j = 0; j < 5; j++) {
      const activityType = pick(activityTypes, i + j);
      const activityDate = addDays(new Date(2025, 0, 1), i * 5 + j * 17);

      await prisma.partyActivity.upsert({
        where: { id: `seed-activity-${safeId(partyMemberId)}-${j}` },
        update: {
          partyMemberId,
          activityType,
          activityDate,
          description: `Hoạt động ${activityType} tháng ${activityDate.getMonth() + 1}`,
          location: 'Hội trường Chi bộ',
          result: 'Hoàn thành tốt',
        },
        create: {
          id: `seed-activity-${safeId(partyMemberId)}-${j}`,
          partyMemberId,
          activityType,
          activityDate,
          description: `Hoạt động ${activityType} tháng ${activityDate.getMonth() + 1}`,
          location: 'Hội trường Chi bộ',
          result: 'Hoàn thành tốt',
        },
      });

      activityCount++;
    }
  }

  return { activityCount };
}

async function seedEvaluationActivities(memberIds: string[]) {
  let evaluationCount = 0;
  const grades = ['HOAN_THANH_XUAT_SAC', 'HOAN_THANH_TOT', 'HOAN_THANH', 'KHONG_HOAN_THANH'] as const;

  for (let i = 0; i < Math.min(memberIds.length, 35); i++) {
    const partyMemberId = memberIds[i];
    for (const year of [2023, 2024, 2025]) {
      await prisma.partyActivity.upsert({
        where: { id: `seed-evaluation-${safeId(partyMemberId)}-${year}` },
        update: {
          partyMemberId,
          activityType: 'EVALUATION',
          activityDate: new Date(year, 11, 25),
          description: `Đánh giá phân loại đảng viên năm ${year}`,
          location: 'Chi bộ đơn vị',
          evaluationYear: year,
          evaluationGrade: pick(grades, i + year),
          evaluationNotes: 'Đánh giá seed theo dữ liệu mẫu nghiệp vụ M03',
        },
        create: {
          id: `seed-evaluation-${safeId(partyMemberId)}-${year}`,
          partyMemberId,
          activityType: 'EVALUATION',
          activityDate: new Date(year, 11, 25),
          description: `Đánh giá phân loại đảng viên năm ${year}`,
          location: 'Chi bộ đơn vị',
          evaluationYear: year,
          evaluationGrade: pick(grades, i + year),
          evaluationNotes: 'Đánh giá seed theo dữ liệu mẫu nghiệp vụ M03',
        },
      });
      evaluationCount++;
    }
  }

  return { evaluationCount };
}

async function seedMeetingsAndAttendances(memberIds: string[], orgIds: string[], actorId: string) {
  const meetingTypes: MeetingType[] = ['THUONG_KY', 'CHUYEN_DE', 'KIEM_DIEM_CUOI_NAM'];
  let meetingCount = 0;
  let attendanceCount = 0;

  for (let i = 0; i < orgIds.length; i++) {
    const orgId = orgIds[i];

    for (let quarter = 1; quarter <= 3; quarter++) {
      const meetingDate = new Date(2025, quarter * 3 - 1, 15);
      const title = `Sinh hoạt quý ${quarter}/2025 - Tổ chức ${i + 1}`;

      const meeting = await prisma.partyMeeting.upsert({
        where: {
          id: `seed-meeting-${orgId}-${quarter}`,
        },
        update: {
          meetingType: pick(meetingTypes, i + quarter),
          title,
          meetingDate,
          location: 'Phòng họp Chi bộ',
          agenda: 'Đánh giá công tác quý, triển khai nhiệm vụ quý tiếp theo',
          status: 'published',
          createdBy: actorId,
        },
        create: {
          id: `seed-meeting-${orgId}-${quarter}`,
          partyOrgId: orgId,
          meetingType: pick(meetingTypes, i + quarter),
          title,
          meetingDate,
          location: 'Phòng họp Chi bộ',
          agenda: 'Đánh giá công tác quý, triển khai nhiệm vụ quý tiếp theo',
          status: 'published',
          createdBy: actorId,
        },
      });

      meetingCount++;

      const sampleMembers = memberIds.slice((i * 5) % Math.max(memberIds.length, 1), ((i * 5) % Math.max(memberIds.length, 1)) + 5);
      for (let m = 0; m < sampleMembers.length; m++) {
        const partyMemberId = sampleMembers[m];
        await prisma.partyMeetingAttendance.upsert({
          where: {
            meetingId_partyMemberId: {
              meetingId: meeting.id,
              partyMemberId,
            },
          },
          update: {
            attendanceStatus: m % 6 === 0 ? 'ABSENT' : 'PRESENT',
            absenceReason: m % 6 === 0 ? 'Công tác đột xuất' : null,
            note: 'Seed dữ liệu sinh hoạt',
          },
          create: {
            meetingId: meeting.id,
            partyMemberId,
            attendanceStatus: m % 6 === 0 ? 'ABSENT' : 'PRESENT',
            absenceReason: m % 6 === 0 ? 'Công tác đột xuất' : null,
            note: 'Seed dữ liệu sinh hoạt',
          },
        });
        attendanceCount++;
      }
    }
  }

  return { meetingCount, attendanceCount };
}

async function seedFees(memberIds: string[]) {
  let feeCount = 0;
  for (let i = 0; i < memberIds.length; i++) {
    const partyMemberId = memberIds[i];
    for (let offset = 0; offset < 6; offset++) {
      const base = addMonths(new Date(2025, 0, 1), offset);
      const paymentMonth = monthKey(base);
      const expectedAmount = 50000 + ((i % 4) * 10000);
      const paid = (i + offset) % 5 !== 0;
      const actualAmount = paid ? expectedAmount : 0;
      const debtAmount = expectedAmount - actualAmount;

      await prisma.partyFeePayment.upsert({
        where: {
          partyMemberId_paymentMonth: {
            partyMemberId,
            paymentMonth,
          },
        },
        update: {
          expectedAmount,
          actualAmount,
          paymentDate: paid ? addDays(base, 10) : null,
          debtAmount,
          status: paid ? 'PAID' : 'UNPAID',
          note: 'Seed đảng phí theo tháng',
        },
        create: {
          partyMemberId,
          paymentMonth,
          expectedAmount,
          actualAmount,
          paymentDate: paid ? addDays(base, 10) : null,
          debtAmount,
          status: paid ? 'PAID' : 'UNPAID',
          note: 'Seed đảng phí theo tháng',
        },
      });
      feeCount++;
    }
  }
  return { feeCount };
}

async function seedReviews(memberIds: string[]) {
  const grades: ReviewGrade[] = ['HTXSNV', 'HTTNV', 'HTNV'];
  let reviewCount = 0;
  for (let i = 0; i < memberIds.length; i++) {
    const partyMemberId = memberIds[i];
    for (const year of [2023, 2024, 2025]) {
      await prisma.partyAnnualReview.upsert({
        where: {
          partyMemberId_reviewYear: {
            partyMemberId,
            reviewYear: year,
          },
        },
        update: {
          grade: pick(grades, i + year),
          comments: `Đánh giá năm ${year}: chấp hành tốt quy định và tham gia đầy đủ sinh hoạt`,
          approvedAt: new Date(year, 11, 20),
        },
        create: {
          partyMemberId,
          reviewYear: year,
          grade: pick(grades, i + year),
          comments: `Đánh giá năm ${year}: chấp hành tốt quy định và tham gia đầy đủ sinh hoạt`,
          approvedAt: new Date(year, 11, 20),
        },
      });
      reviewCount++;
    }
  }
  return { reviewCount };
}

async function seedAwardsAndDisciplines(memberIds: string[]) {
  const severities: DisciplineSeverity[] = ['KHIEN_TRACH', 'CANH_CAO'];
  let awardCount = 0;
  let disciplineCount = 0;

  for (let i = 0; i < memberIds.length; i++) {
    const partyMemberId = memberIds[i];

    if (i % 3 === 0) {
      await prisma.partyAward.upsert({
        where: { id: `seed-award-${partyMemberId}` },
        update: {
          title: 'Hoàn thành xuất sắc nhiệm vụ công tác Đảng',
          decisionNo: `KT-${2025}${String(i + 1).padStart(3, '0')}`,
          decisionDate: new Date(2025, 10, 20),
          issuer: 'Đảng ủy Học viện',
          note: 'Seed khen thưởng mẫu',
        },
        create: {
          id: `seed-award-${partyMemberId}`,
          partyMemberId,
          title: 'Hoàn thành xuất sắc nhiệm vụ công tác Đảng',
          decisionNo: `KT-${2025}${String(i + 1).padStart(3, '0')}`,
          decisionDate: new Date(2025, 10, 20),
          issuer: 'Đảng ủy Học viện',
          note: 'Seed khen thưởng mẫu',
        },
      });
      awardCount++;
    }

    if (i % 7 === 0) {
      await prisma.partyDiscipline.upsert({
        where: { id: `seed-discipline-${partyMemberId}` },
        update: {
          severity: pick(severities, i),
          decisionNo: `KL-${2025}${String(i + 1).padStart(3, '0')}`,
          decisionDate: new Date(2025, 8, 15),
          expiryDate: new Date(2026, 2, 15),
          issuer: 'Ủy ban Kiểm tra Đảng ủy',
          reason: 'Nhắc nhở do vi phạm quy chế sinh hoạt',
        },
        create: {
          id: `seed-discipline-${partyMemberId}`,
          partyMemberId,
          severity: pick(severities, i),
          decisionNo: `KL-${2025}${String(i + 1).padStart(3, '0')}`,
          decisionDate: new Date(2025, 8, 15),
          expiryDate: new Date(2026, 2, 15),
          issuer: 'Ủy ban Kiểm tra Đảng ủy',
          reason: 'Nhắc nhở do vi phạm quy chế sinh hoạt',
        },
      });
      disciplineCount++;
    }
  }

  return { awardCount, disciplineCount };
}

async function seedTransfers(memberIds: string[], orgIds: string[]) {
  let transferCount = 0;
  if (orgIds.length < 2) return { transferCount };

  for (let i = 0; i < Math.min(memberIds.length, 12); i++) {
    const partyMemberId = memberIds[i];
    const fromPartyOrgId = orgIds[i % orgIds.length];
    const toPartyOrgId = orgIds[(i + 1) % orgIds.length];
    if (fromPartyOrgId === toPartyOrgId) continue;

    await prisma.partyTransfer.upsert({
      where: { id: `seed-transfer-${partyMemberId}` },
      update: {
        transferType: i % 2 === 0 ? TransferType.CHUYEN_DANG_CHINH_THUC : TransferType.CHUYEN_SINH_HOAT_TAM_THOI,
        fromPartyOrgId,
        toPartyOrgId,
        transferDate: addDays(new Date(2025, 5, 1), i * 10),
        introductionLetterNo: `GTH-${2025}${String(i + 1).padStart(3, '0')}`,
        confirmStatus: i % 4 === 0 ? 'PENDING' : 'CONFIRMED',
        confirmDate: i % 4 === 0 ? null : addDays(new Date(2025, 5, 1), i * 10 + 5),
        note: 'Seed hồ sơ chuyển sinh hoạt',
      },
      create: {
        id: `seed-transfer-${partyMemberId}`,
        partyMemberId,
        transferType: i % 2 === 0 ? TransferType.CHUYEN_DANG_CHINH_THUC : TransferType.CHUYEN_SINH_HOAT_TAM_THOI,
        fromPartyOrgId,
        toPartyOrgId,
        transferDate: addDays(new Date(2025, 5, 1), i * 10),
        introductionLetterNo: `GTH-${2025}${String(i + 1).padStart(3, '0')}`,
        confirmStatus: i % 4 === 0 ? 'PENDING' : 'CONFIRMED',
        confirmDate: i % 4 === 0 ? null : addDays(new Date(2025, 5, 1), i * 10 + 5),
        note: 'Seed hồ sơ chuyển sinh hoạt',
      },
    });
    transferCount++;
  }
  return { transferCount };
}

async function seedInspections(memberIds: string[], orgIds: string[], actorId: string) {
  const inspectionTypes: InspectionType[] = [
    'KIEM_TRA_DINH_KY',
    'GIAM_SAT_CHUYEN_DE',
    'KIEM_TRA_KHI_CO_DAU_HIEU',
  ];
  let inspectionCount = 0;

  for (let i = 0; i < Math.min(10, memberIds.length); i++) {
    const partyMemberId = memberIds[i];
    const partyOrgId = orgIds[i % orgIds.length] ?? null;
    const openedAt = addDays(new Date(2025, 2, 1), i * 12);
    const closedAt = i % 3 === 0 ? addDays(openedAt, 10) : null;

    await prisma.partyInspectionTarget.upsert({
      where: { id: `seed-inspection-${partyMemberId}` },
      update: {
        partyMemberId,
        partyOrgId,
        inspectionType: pick(inspectionTypes, i),
        title: `Kiểm tra công tác Đảng đợt ${i + 1}`,
        openedAt,
        closedAt,
        findings: 'Cơ bản chấp hành tốt, cần tăng cường lưu trữ biên bản đúng hạn',
        recommendation: 'Tiếp tục duy trì nền nếp sinh hoạt, hoàn thiện hồ sơ điện tử',
        decisionRef: `KLKT-${2025}${String(i + 1).padStart(3, '0')}`,
        createdBy: actorId,
      },
      create: {
        id: `seed-inspection-${partyMemberId}`,
        partyMemberId,
        partyOrgId,
        inspectionType: pick(inspectionTypes, i),
        title: `Kiểm tra công tác Đảng đợt ${i + 1}`,
        openedAt,
        closedAt,
        findings: 'Cơ bản chấp hành tốt, cần tăng cường lưu trữ biên bản đúng hạn',
        recommendation: 'Tiếp tục duy trì nền nếp sinh hoạt, hoàn thiện hồ sơ điện tử',
        decisionRef: `KLKT-${2025}${String(i + 1).padStart(3, '0')}`,
        createdBy: actorId,
      },
    });
    inspectionCount++;
  }
  return { inspectionCount };
}

async function seedRecruitmentPipelines(userIds: string[], orgIds: string[]) {
  let recruitmentCount = 0;
  if (orgIds.length === 0) return { recruitmentCount };

  const steps: RecruitmentStep[] = ['THEO_DOI', 'HOC_CAM_TINH', 'DOI_TUONG', 'CHI_BO_XET', 'CAP_TREN_DUYET'];

  for (let i = 0; i < Math.min(15, userIds.length); i++) {
    const userId = userIds[i];
    const currentStep = pick(steps, i);
    const baseDate = addDays(new Date(2025, 0, 5), i * 7);

    await prisma.partyRecruitmentPipeline.upsert({
      where: { userId },
      update: {
        currentStep,
        targetPartyOrgId: orgIds[i % orgIds.length],
        camTinhDate: currentStep === 'THEO_DOI' ? null : baseDate,
        doiTuongDate: ['DOI_TUONG', 'CHI_BO_XET', 'CAP_TREN_DUYET'].includes(currentStep) ? addDays(baseDate, 30) : null,
        chiBoProposalDate: ['CHI_BO_XET', 'CAP_TREN_DUYET'].includes(currentStep) ? addDays(baseDate, 60) : null,
        capTrenApprovalDate: currentStep === 'CAP_TREN_DUYET' ? addDays(baseDate, 90) : null,
        assistantMember1: 'Đ/c Nguyễn Văn A',
        assistantMember2: 'Đ/c Trần Văn B',
        dossierStatus: 'IN_PROGRESS',
        note: 'Seed pipeline kết nạp theo luồng nghiệp vụ',
      },
      create: {
        userId,
        currentStep,
        targetPartyOrgId: orgIds[i % orgIds.length],
        camTinhDate: currentStep === 'THEO_DOI' ? null : baseDate,
        doiTuongDate: ['DOI_TUONG', 'CHI_BO_XET', 'CAP_TREN_DUYET'].includes(currentStep) ? addDays(baseDate, 30) : null,
        chiBoProposalDate: ['CHI_BO_XET', 'CAP_TREN_DUYET'].includes(currentStep) ? addDays(baseDate, 60) : null,
        capTrenApprovalDate: currentStep === 'CAP_TREN_DUYET' ? addDays(baseDate, 90) : null,
        assistantMember1: 'Đ/c Nguyễn Văn A',
        assistantMember2: 'Đ/c Trần Văn B',
        dossierStatus: 'IN_PROGRESS',
        note: 'Seed pipeline kết nạp theo luồng nghiệp vụ',
      },
    });
    recruitmentCount++;
  }

  return { recruitmentCount };
}

async function main() {
  console.log('🌱 Seed M03 Party Business Flow...');

  const organizations = await prisma.partyOrganization.findMany({
    where: { isActive: true },
    orderBy: [{ level: 'asc' }, { code: 'asc' }],
    select: { id: true },
  });

  const members = await prisma.partyMember.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true, userId: true },
  });

  if (organizations.length === 0 || members.length === 0) {
    throw new Error('Thiếu party organizations hoặc party members. Hãy chạy seed_party_members + seed_party_full trước.');
  }

  const actor = await prisma.user.findFirst({ where: { role: 'QUAN_TRI_HE_THONG', status: 'ACTIVE' }, select: { id: true } });
  const actorId = actor?.id ?? members[0].userId;

  const orgIds = organizations.map((o) => o.id);
  const memberIds = members.map((m) => m.id);
  const userIds = members.map((m) => m.userId);

  const meetingResult = await seedMeetingsAndAttendances(memberIds, orgIds.slice(0, 6), actorId);
  const feeResult = await seedFees(memberIds.slice(0, 40));
  const reviewResult = await seedReviews(memberIds.slice(0, 40));
  const awardDisciplineResult = await seedAwardsAndDisciplines(memberIds.slice(0, 40));
  const transferResult = await seedTransfers(memberIds, orgIds);
  const inspectionResult = await seedInspections(memberIds, orgIds, actorId);
  const recruitmentResult = await seedRecruitmentPipelines(userIds, orgIds);
  const admissionResult = await seedAdmissionsHistory(memberIds, orgIds);
  const activityResult = await seedActivities(memberIds);
  const evaluationActivityResult = await seedEvaluationActivities(memberIds);

  // Đồng bộ lại debt + currentReviewGrade theo dữ liệu mới
  for (const partyMemberId of memberIds.slice(0, 40)) {
    const feeAgg = await prisma.partyFeePayment.aggregate({
      where: { partyMemberId },
      _sum: { debtAmount: true },
    });

    const latestReview = await prisma.partyAnnualReview.findFirst({
      where: { partyMemberId },
      orderBy: { reviewYear: 'desc' },
      select: { grade: true },
    });

    await prisma.partyMember.update({
      where: { id: partyMemberId },
      data: {
        currentDebtAmount: feeAgg._sum.debtAmount ?? 0,
        currentReviewGrade: latestReview?.grade ?? null,
      },
    });
  }

  // Rải trạng thái lifecycle cho dashboard/menu nghiệp vụ
  const statuses: PartyMemberStatus[] = [
    'QUAN_CHUNG',
    'CAM_TINH',
    'DOI_TUONG',
    'DU_BI',
    'CHINH_THUC',
    'CHUYEN_DI',
  ];

  for (let i = 0; i < Math.min(memberIds.length, 36); i++) {
    await prisma.partyMember.update({
      where: { id: memberIds[i] },
      data: {
        status: pick(statuses, i),
        statusChangeDate: addDays(new Date(2025, 0, 1), i * 3),
      },
    });
  }

  console.log('✅ Seed M03 completed');
  console.table({
    meetings: meetingResult.meetingCount,
    meetingAttendances: meetingResult.attendanceCount,
    fees: feeResult.feeCount,
    reviews: reviewResult.reviewCount,
    awards: awardDisciplineResult.awardCount,
    disciplines: awardDisciplineResult.disciplineCount,
    transfers: transferResult.transferCount,
    inspections: inspectionResult.inspectionCount,
    recruitments: recruitmentResult.recruitmentCount,
    admissions: admissionResult.admissionCount,
    officialConfirmations: admissionResult.officialCount,
    activities: activityResult.activityCount,
    evaluationActivities: evaluationActivityResult.evaluationCount,
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed M03 failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
