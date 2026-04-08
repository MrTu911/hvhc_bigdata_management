/**
 * Seed Script: Party Database - Full Sample Data
 *
 * Mục tiêu:
 * 1. Thêm tổ chức Đảng còn thiếu (Đảng bộ bộ phận, Tổ Đảng)
 * 2. Gán organizationId + currentPosition cho 28 đảng viên thiếu
 * 3. Sửa evaluationGrade từ text tiếng Việt sang mã code chuẩn
 * 4. Thêm EVALUATION cho tất cả đảng viên theo từng năm (2022–2025)
 * 5. Thêm lịch sử: TRANSFER_OUT, REMOVED_POSITION, STATUS_CHANGED
 * 6. Thêm các hoạt động Đảng bổ sung cho tính phong phú
 */

import { PrismaClient, PartyActivityType, PartyMemberStatus, PartyPosition, PartyHistoryType } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// Grade codes (enum keys) - map to GRADE_LABELS in frontend
const EVAL_GRADES = [
  'XUAT_SAC',
  'HOAN_THANH_XUAT_SAC',
  'HOAN_THANH_TOT',
  'HOAN_THANH_TOT',
  'HOAN_THANH_TOT',
  'HOAN_THANH',
  'KHONG_HOAN_THANH',
];

function pickGrade(seed: number, year: number): string {
  // Weight toward HOAN_THANH_TOT and HOAN_THANH_XUAT_SAC
  const idx = (seed * 3 + year) % EVAL_GRADES.length;
  return EVAL_GRADES[idx];
}

function pickPosition(seed: number): PartyPosition {
  const positions: PartyPosition[] = [
    'DANG_VIEN', 'DANG_VIEN', 'DANG_VIEN', 'DANG_VIEN',
    'TO_TRUONG_TO_DANG', 'TO_PHO_TO_DANG',
    'CAP_UY_VIEN',
    'PHO_BI_THU_CHI_BO', 'BI_THU_CHI_BO',
  ];
  return positions[seed % positions.length];
}

function randomDate(startYear: number, endYear: number, seed: number): Date {
  const start = new Date(`${startYear}-01-01`);
  const end = new Date(`${endYear}-12-31`);
  const range = end.getTime() - start.getTime();
  return new Date(start.getTime() + (seed * 7919) % range);
}

async function main() {
  console.log('=== SEED PARTY DATABASE ===\n');

  // ─────────────────────────────────────────────
  // 1. Thêm tổ chức Đảng còn thiếu
  // ─────────────────────────────────────────────
  console.log('1. Tạo thêm tổ chức Đảng...');

  const dangUy = await prisma.partyOrganization.findUnique({ where: { code: 'DANG_UY_HVHC' } });
  if (!dangUy) throw new Error('Không tìm thấy Đảng ủy HVHC');

  const newOrgs = [
    { code: 'DANG_BO_KOT', name: 'Đảng bộ Khoa Ô tô - Xe máy công trình', shortName: 'ĐB Khoa OT', organizationType: 'DANG_BO_BO_PHAN' as const, level: 2 },
    { code: 'DANG_BO_KHH', name: 'Đảng bộ Khoa Hậu hỏa', shortName: 'ĐB Khoa HH', organizationType: 'DANG_BO_BO_PHAN' as const, level: 2 },
    { code: 'DANG_BO_KQS', name: 'Đảng bộ Khoa Quân sự cơ sở', shortName: 'ĐB Khoa QS', organizationType: 'DANG_BO_BO_PHAN' as const, level: 2 },
    { code: 'TO_DANG_KHCB', name: 'Tổ Đảng Khoa Khoa học cơ bản', shortName: 'TĐ Khoa KHCB', organizationType: 'TO_DANG' as const, level: 3 },
    { code: 'TO_DANG_P1', name: 'Tổ Đảng Phòng Hậu cần - Trang bị', shortName: 'TĐ P1', organizationType: 'TO_DANG' as const, level: 3 },
    { code: 'TO_DANG_P2', name: 'Tổ Đảng Phòng Tài vụ', shortName: 'TĐ Tài vụ', organizationType: 'TO_DANG' as const, level: 3 },
  ];

  const orgMap: Record<string, string> = {};
  // Load existing orgs
  const existingOrgs = await prisma.partyOrganization.findMany();
  for (const o of existingOrgs) orgMap[o.code] = o.id;

  for (const org of newOrgs) {
    const existing = await prisma.partyOrganization.findUnique({ where: { code: org.code } });
    if (!existing) {
      const created = await prisma.partyOrganization.create({
        data: {
          ...org,
          parentId: dangUy.id,
          isActive: true,
          establishedDate: new Date('2010-01-01'),
        },
      });
      orgMap[org.code] = created.id;
      console.log(`  + Tạo: ${org.name}`);
    } else {
      orgMap[org.code] = existing.id;
      console.log(`  ✓ Tồn tại: ${org.name}`);
    }
  }

  // Full org list for assignment
  const allOrgs = await prisma.partyOrganization.findMany({ where: { isActive: true } });
  const orgIds = allOrgs.map(o => o.id);

  // ─────────────────────────────────────────────
  // 2. Gán org + position cho đảng viên thiếu
  // ─────────────────────────────────────────────
  console.log('\n2. Gán tổ chức + chức vụ cho đảng viên thiếu...');

  const missingOrg = await prisma.partyMember.findMany({
    where: { organizationId: null, deletedAt: null },
  });

  let assigned = 0;
  for (let i = 0; i < missingOrg.length; i++) {
    const member = missingOrg[i];
    const orgId = orgIds[(i * 3 + 7) % orgIds.length];
    const pos = pickPosition(i + 10);
    await prisma.partyMember.update({
      where: { id: member.id },
      data: { organizationId: orgId, currentPosition: pos },
    });
    assigned++;
  }
  console.log(`  + Đã gán org/position cho ${assigned} đảng viên`);

  // ─────────────────────────────────────────────
  // 3. Sửa evaluationGrade sai format
  // ─────────────────────────────────────────────
  console.log('\n3. Sửa evaluationGrade sang mã code chuẩn...');

  const wrongGradeMap: Record<string, string> = {
    'Xuất sắc': 'XUAT_SAC',
    'Hoàn thành xuất sắc': 'HOAN_THANH_XUAT_SAC',
    'Hoàn thành xuất sắc nhiệm vụ': 'HOAN_THANH_XUAT_SAC',
    'Hoàn thành tốt': 'HOAN_THANH_TOT',
    'Hoàn thành tốt nhiệm vụ': 'HOAN_THANH_TOT',
    'Hoàn thành': 'HOAN_THANH',
    'Hoàn thành nhiệm vụ': 'HOAN_THANH',
    'Không hoàn thành': 'KHONG_HOAN_THANH',
    'Không hoàn thành nhiệm vụ': 'KHONG_HOAN_THANH',
  };

  let fixedGrades = 0;
  for (const [wrong, correct] of Object.entries(wrongGradeMap)) {
    const result = await prisma.partyActivity.updateMany({
      where: { activityType: 'EVALUATION', evaluationGrade: wrong },
      data: { evaluationGrade: correct },
    });
    fixedGrades += result.count;
  }
  console.log(`  + Đã sửa ${fixedGrades} bản ghi evaluationGrade`);

  // ─────────────────────────────────────────────
  // 4. Thêm EVALUATION cho tất cả đảng viên (2022–2025)
  // ─────────────────────────────────────────────
  console.log('\n4. Thêm đánh giá phân loại đảng viên 2022–2025...');

  const allMembers = await prisma.partyMember.findMany({
    where: { deletedAt: null },
    include: { organization: true },
  });

  const evalYears = [2022, 2023, 2024, 2025];
  let evalCreated = 0;

  for (let mi = 0; mi < allMembers.length; mi++) {
    const member = allMembers[mi];
    for (const year of evalYears) {
      // Check if evaluation for this year already exists
      const existing = await prisma.partyActivity.findFirst({
        where: {
          partyMemberId: member.id,
          activityType: 'EVALUATION',
          evaluationYear: year,
        },
      });
      if (existing) continue;

      const grade = pickGrade(mi, year);
      const evalDate = new Date(`${year}-12-15`);

      const gradeLabels: Record<string, string> = {
        XUAT_SAC: 'Xuất sắc',
        HOAN_THANH_XUAT_SAC: 'Hoàn thành xuất sắc nhiệm vụ',
        HOAN_THANH_TOT: 'Hoàn thành tốt nhiệm vụ',
        HOAN_THANH: 'Hoàn thành nhiệm vụ',
        KHONG_HOAN_THANH: 'Không hoàn thành nhiệm vụ',
      };

      await prisma.partyActivity.create({
        data: {
          partyMemberId: member.id,
          activityType: 'EVALUATION',
          activityDate: evalDate,
          description: `Đánh giá phân loại đảng viên năm ${year}`,
          location: member.organization?.name ?? 'Chi bộ đơn vị',
          evaluationYear: year,
          evaluationGrade: grade,
          evaluationNotes: `Phân loại: ${gradeLabels[grade]}. Chấp hành tốt đường lối, chủ trương của Đảng, chính sách pháp luật Nhà nước.`,
        },
      });
      evalCreated++;
    }
  }
  console.log(`  + Tạo ${evalCreated} bản ghi đánh giá mới`);

  // ─────────────────────────────────────────────
  // 5. Thêm hoạt động Đảng bổ sung (MEETING theo quý, STUDY hàng tháng)
  // ─────────────────────────────────────────────
  console.log('\n5. Thêm hoạt động Đảng bổ sung...');

  const additionalActivities: {
    type: PartyActivityType;
    description: string;
    monthDay: string;
    result: string;
  }[] = [
    { type: 'MEETING', description: 'Sinh hoạt chi bộ thường kỳ quý I/2025', monthDay: '03-15', result: 'Đạt yêu cầu' },
    { type: 'MEETING', description: 'Sinh hoạt chi bộ thường kỳ quý II/2025', monthDay: '06-15', result: 'Đạt yêu cầu' },
    { type: 'MEETING', description: 'Sinh hoạt chi bộ thường kỳ quý III/2025', monthDay: '09-15', result: 'Đạt yêu cầu' },
    { type: 'STUDY', description: 'Học tập, quán triệt Nghị quyết Hội nghị TW lần thứ 10', monthDay: '02-20', result: 'Hoàn thành' },
    { type: 'STUDY', description: 'Học tập chuyên đề 2025 về đạo đức, lối sống', monthDay: '04-10', result: 'Hoàn thành' },
    { type: 'CRITICISM', description: 'Kiểm điểm đảng viên giữa năm 2025', monthDay: '06-30', result: 'Đạt yêu cầu' },
    { type: 'VOLUNTEER', description: 'Tham gia ngày làm việc tình nguyện vì cộng đồng', monthDay: '05-01', result: 'Tốt' },
    { type: 'OTHER', description: 'Tham dự lễ kết nạp đảng viên mới của chi bộ', monthDay: '07-27', result: 'Hoàn thành' },
  ];

  let actCreated = 0;
  // Only add for a subset (first 80 members) to avoid excessive data
  const targetMembers = allMembers.slice(0, 80);

  for (let mi = 0; mi < targetMembers.length; mi++) {
    const member = targetMembers[mi];
    // Pick 2-3 additional activities per member
    const picks = additionalActivities.filter((_, i) => (i + mi) % 3 !== 0).slice(0, 3);
    for (const act of picks) {
      const actDate = new Date(`2025-${act.monthDay}`);
      const existing = await prisma.partyActivity.findFirst({
        where: {
          partyMemberId: member.id,
          activityType: act.type,
          description: act.description,
        },
      });
      if (existing) continue;

      await prisma.partyActivity.create({
        data: {
          partyMemberId: member.id,
          activityType: act.type,
          activityDate: actDate,
          description: act.description,
          location: member.organization?.name ?? 'Học viện Hậu cần',
          result: act.result,
        },
      });
      actCreated++;
    }
  }
  console.log(`  + Tạo ${actCreated} hoạt động Đảng bổ sung`);

  // ─────────────────────────────────────────────
  // 6. Thêm lịch sử: TRANSFER_OUT, REMOVED_POSITION, STATUS_CHANGED
  // ─────────────────────────────────────────────
  console.log('\n6. Thêm lịch sử chuyển sinh hoạt và thay đổi chức vụ...');

  // Pick 15 members for TRANSFER_OUT history
  const transferOutMembers = allMembers.slice(0, 15);
  const allOrgNames = allOrgs.map(o => o.name);

  let histCreated = 0;
  for (let i = 0; i < transferOutMembers.length; i++) {
    const member = transferOutMembers[i];
    const existing = await prisma.partyMemberHistory.findFirst({
      where: { partyMemberId: member.id, historyType: 'TRANSFER_OUT' },
    });
    if (existing) continue;

    const fromOrg = allOrgNames[i % allOrgNames.length];
    const toOrg = allOrgNames[(i + 3) % allOrgNames.length];
    const decisionDate = randomDate(2020, 2023, i * 17);

    await prisma.partyMemberHistory.create({
      data: {
        partyMemberId: member.id,
        organizationId: member.organizationId,
        historyType: 'TRANSFER_OUT',
        decisionNumber: `QĐ-${2000 + i * 3}/ĐU-HVHC`,
        decisionDate,
        effectiveDate: new Date(decisionDate.getTime() + 7 * 24 * 3600 * 1000),
        fromOrganization: fromOrg,
        toOrganization: toOrg,
        reason: 'Điều động công tác theo yêu cầu tổ chức',
        notes: 'Sinh hoạt Đảng chính thức được chuyển sang tổ chức Đảng mới',
      },
    });
    histCreated++;
  }

  // Pick 10 members for REMOVED_POSITION history
  const removedMembers = allMembers.slice(15, 25);
  for (let i = 0; i < removedMembers.length; i++) {
    const member = removedMembers[i];
    const existing = await prisma.partyMemberHistory.findFirst({
      where: { partyMemberId: member.id, historyType: 'REMOVED_POSITION' },
    });
    if (existing) continue;

    const positions: PartyPosition[] = ['BI_THU_CHI_BO', 'PHO_BI_THU_CHI_BO', 'CAP_UY_VIEN', 'TO_TRUONG_TO_DANG'];
    const pos = positions[i % positions.length];
    const decisionDate = randomDate(2021, 2024, i * 23);

    await prisma.partyMemberHistory.create({
      data: {
        partyMemberId: member.id,
        organizationId: member.organizationId,
        historyType: 'REMOVED_POSITION',
        position: pos,
        decisionNumber: `QĐ-${3000 + i * 5}/ĐU-HVHC`,
        decisionDate,
        effectiveDate: new Date(decisionDate.getTime() + 3 * 24 * 3600 * 1000),
        reason: 'Hết nhiệm kỳ, miễn nhiệm chức vụ theo Điều lệ Đảng',
        notes: 'Miễn nhiệm theo quy định, tiếp tục sinh hoạt với tư cách đảng viên',
      },
    });
    histCreated++;
  }

  // Pick 5 members for STATUS_CHANGED (SUSPENDED → RESTORED)
  const statusMembers = allMembers.slice(25, 30);
  for (let i = 0; i < statusMembers.length; i++) {
    const member = statusMembers[i];
    const existing = await prisma.partyMemberHistory.findFirst({
      where: { partyMemberId: member.id, historyType: 'STATUS_CHANGED' },
    });
    if (existing) continue;

    const suspendDate = randomDate(2019, 2021, i * 31);
    const restoreDate = new Date(suspendDate.getTime() + 365 * 24 * 3600 * 1000);

    // STATUS_CHANGED: SUSPENDED
    await prisma.partyMemberHistory.create({
      data: {
        partyMemberId: member.id,
        organizationId: member.organizationId,
        historyType: 'STATUS_CHANGED',
        decisionNumber: `QĐ-${4000 + i * 7}/ĐU-HVHC`,
        decisionDate: suspendDate,
        effectiveDate: suspendDate,
        reason: 'Đình chỉ sinh hoạt Đảng do vi phạm quy định',
        notes: 'Đình chỉ sinh hoạt Đảng trong thời gian chờ xem xét, xử lý kỷ luật',
      },
    });

    // STATUS_CHANGED: RESTORED
    await prisma.partyMemberHistory.create({
      data: {
        partyMemberId: member.id,
        organizationId: member.organizationId,
        historyType: 'RESTORED',
        decisionNumber: `QĐ-${4100 + i * 7}/ĐU-HVHC`,
        decisionDate: restoreDate,
        effectiveDate: restoreDate,
        reason: 'Phục hồi sinh hoạt Đảng sau khi hoàn thành chấp hành kỷ luật',
        notes: 'Được phục hồi đầy đủ quyền sinh hoạt Đảng',
      },
    });
    histCreated += 2;
  }

  console.log(`  + Tạo ${histCreated} bản ghi lịch sử`);

  // ─────────────────────────────────────────────
  // 7. Cập nhật partyCell và partyCommittee cho members còn thiếu
  // ─────────────────────────────────────────────
  console.log('\n7. Cập nhật partyCell / partyCommittee...');

  const partyCommittees = [
    'Đảng ủy Học viện Hậu cần',
    'Đảng ủy Quân khu 1',
    'Đảng ủy Tổng cục Hậu cần',
  ];

  const membersNeedCell = await prisma.partyMember.findMany({
    where: { deletedAt: null, partyCell: null },
    include: { organization: true },
  });

  let cellUpdated = 0;
  for (let i = 0; i < membersNeedCell.length; i++) {
    const m = membersNeedCell[i];
    const orgName = m.organization?.name ?? 'Chi bộ đơn vị';
    await prisma.partyMember.update({
      where: { id: m.id },
      data: {
        partyCell: orgName,
        partyCommittee: partyCommittees[i % partyCommittees.length],
      },
    });
    cellUpdated++;
  }
  console.log(`  + Cập nhật ${cellUpdated} đảng viên`);

  // ─────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────
  const finalCounts = await Promise.all([
    prisma.partyOrganization.count(),
    prisma.partyMember.count({ where: { deletedAt: null } }),
    prisma.partyActivity.count({ where: { deletedAt: null } }),
    prisma.partyMemberHistory.count(),
    prisma.partyActivity.count({ where: { activityType: 'EVALUATION', deletedAt: null } }),
  ]);

  console.log('\n=== KẾT QUẢ ===');
  console.log(`  Tổ chức Đảng    : ${finalCounts[0]}`);
  console.log(`  Đảng viên       : ${finalCounts[1]}`);
  console.log(`  Hoạt động Đảng  : ${finalCounts[2]}`);
  console.log(`  Lịch sử         : ${finalCounts[3]}`);
  console.log(`  Đánh giá        : ${finalCounts[4]}`);
  console.log('\n✅ Seed hoàn thành!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
