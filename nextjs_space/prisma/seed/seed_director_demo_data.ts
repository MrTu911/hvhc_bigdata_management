/**
 * seed_director_demo_data.ts
 *
 * Seed dữ liệu mẫu phục vụ dashboard KPI cho Giám đốc Học viện.
 * Tạo:
 *   - FacultyProfile cho giangvien@demo.hvhc.edu.vn (nếu chưa có)
 *   - ResearchProject mẫu gán cho giảng viên demo
 *   - PolicyRecord mẫu (EMULATION, REWARD, DISCIPLINE) gán cho các user demo
 *
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_director_demo_data.ts
 *
 * Yêu cầu: seed_demo_rbac_accounts.ts và seed_units.ts đã chạy trước.
 */

import { PrismaClient, PolicyRecordType, PolicyLevel, AwardWorkflowStatus, ResearchWorkflowStatus } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

async function findUserByEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) console.warn(`  ⚠️  User '${email}' not found — skip`);
  return user;
}

async function findUnitByCode(code: string) {
  const unit = await prisma.unit.findFirst({ where: { code } });
  if (!unit) console.warn(`  ⚠️  Unit '${code}' not found — skip`);
  return unit;
}

// ─── FacultyProfile ─────────────────────────────────────────────────────────

async function ensureFacultyProfile() {
  console.log('\n📌 Ensuring FacultyProfile for giangvien demo...');

  const gv = await findUserByEmail('giangvien@demo.hvhc.edu.vn');
  if (!gv) return null;

  const existing = await prisma.facultyProfile.findUnique({ where: { userId: gv.id } });
  if (existing) {
    console.log('  ⏩ FacultyProfile already exists');
    return existing;
  }

  const unitK1 = await findUnitByCode('K1');

  const profile = await prisma.facultyProfile.create({
    data: {
      userId: gv.id,
      unitId: unitK1?.id ?? null,
      academicRank: 'Phó Giáo sư',
      academicDegree: 'Tiến sĩ',
      specialization: 'Khoa học Quản lý & Hậu cần Quân sự',
      researchInterests: 'Tối ưu hóa chuỗi cung ứng, Quản lý logistics quân sự',
      researchProjects: 4,
      publications: 12,
      citations: 87,
      teachingExperience: 15,
      industryExperience: 8,
      isActive: true,
      isPublic: true,
      weeklyHoursLimit: 16,
    },
  });

  console.log(`  ✅ FacultyProfile tạo thành công: ${profile.id}`);
  return profile;
}

// ─── ResearchProject ────────────────────────────────────────────────────────

async function seedResearchProjects(facultyProfileId: string) {
  console.log('\n📌 Seeding ResearchProject samples...');

  const projects = [
    {
      projectName: 'Nghiên cứu mô hình tối ưu hóa chuỗi cung ứng hậu cần quân sự trong điều kiện tác chiến hiện đại',
      projectCode: 'NCKH-2024-001',
      field: 'Khoa học Quản lý',
      level: 'Cấp Học viện',
      fundingAmount: 150_000_000,
      startYear: '2024',
      endYear: '2025',
      status: 'Đang thực hiện',
      workflowStatus: ResearchWorkflowStatus.IN_PROGRESS,
      publications: 2,
    },
    {
      projectName: 'Ứng dụng trí tuệ nhân tạo trong dự báo nhu cầu trang bị vũ khí kỹ thuật',
      projectCode: 'NCKH-2024-002',
      field: 'Công nghệ thông tin',
      level: 'Cấp Bộ Quốc phòng',
      fundingAmount: 300_000_000,
      startYear: '2023',
      endYear: '2025',
      status: 'Đang thực hiện',
      workflowStatus: ResearchWorkflowStatus.APPROVED,
      publications: 5,
      approvedAt: new Date('2023-06-15'),
    },
    {
      projectName: 'Phân tích hiệu quả công tác huấn luyện quân sự hướng kết quả tại Học viện Hậu cần',
      projectCode: 'NCKH-2025-003',
      field: 'Khoa học Giáo dục Quân sự',
      level: 'Cấp Học viện',
      fundingAmount: 80_000_000,
      startYear: '2025',
      endYear: '2026',
      status: 'Chờ phê duyệt',
      workflowStatus: ResearchWorkflowStatus.SUBMITTED,
      publications: 0,
      submittedAt: new Date('2025-03-01'),
    },
  ];

  let created = 0;
  for (const p of projects) {
    const existing = await prisma.researchProject.findFirst({
      where: { projectCode: p.projectCode, facultyId: facultyProfileId },
    });
    if (existing) {
      console.log(`  ⏩ ResearchProject '${p.projectCode}' already exists`);
      continue;
    }

    await prisma.researchProject.create({
      data: {
        facultyId: facultyProfileId,
        projectName: p.projectName,
        projectCode: p.projectCode,
        field: p.field,
        level: p.level,
        fundingAmount: p.fundingAmount,
        startYear: p.startYear,
        endYear: p.endYear,
        status: p.status,
        workflowStatus: p.workflowStatus,
        publications: p.publications,
        approvedAt: p.approvedAt ?? null,
        submittedAt: p.submittedAt ?? null,
      },
    });

    console.log(`  ✅ ResearchProject: ${p.projectCode}`);
    created++;
  }

  console.log(`  → Tạo mới: ${created} / ${projects.length}`);
}

// ─── PolicyRecord ────────────────────────────────────────────────────────────

async function seedPolicyRecords() {
  console.log('\n📌 Seeding PolicyRecord samples...');

  // Dùng user giảng viên và trưởng phòng để làm đối tượng hồ sơ chính sách
  const targetEmails = [
    'giangvien@demo.hvhc.edu.vn',
    'tpns@demo.hvhc.edu.vn',
    'truongkhoa@demo.hvhc.edu.vn',
  ];

  const users = await Promise.all(targetEmails.map(e => findUserByEmail(e)));
  const validUsers = users.filter(Boolean) as NonNullable<typeof users[0]>[];

  if (validUsers.length === 0) {
    console.log('  ⚠️  Không tìm thấy user target, skip PolicyRecord seed');
    return;
  }

  const records = [
    {
      userEmail: 'giangvien@demo.hvhc.edu.vn',
      recordType: PolicyRecordType.EMULATION,
      level: PolicyLevel.ACADEMY,
      title: 'Chiến sĩ thi đua cơ sở năm 2024',
      reason: 'Hoàn thành xuất sắc nhiệm vụ giảng dạy và nghiên cứu khoa học năm 2024',
      decisionNumber: 'QĐ-HV/TĐKT-2024-001',
      decisionDate: new Date('2024-12-20'),
      effectiveDate: new Date('2025-01-01'),
      signerName: 'Thiếu tướng Nguyễn Văn Hòa',
      signerPosition: 'Giám đốc Học viện Hậu cần',
      issuingUnit: 'Học viện Hậu cần',
      workflowStatus: AwardWorkflowStatus.APPROVED,
      approvedAt: new Date('2024-12-20'),
      year: 2024,
    },
    {
      userEmail: 'giangvien@demo.hvhc.edu.vn',
      recordType: PolicyRecordType.REWARD,
      level: PolicyLevel.ACADEMY,
      title: 'Bằng khen Giám đốc Học viện năm học 2023-2024',
      reason: 'Có thành tích xuất sắc trong giảng dạy và nghiên cứu khoa học năm học 2023-2024',
      decisionNumber: 'QĐ-HV/KT-2024-015',
      decisionDate: new Date('2024-08-30'),
      effectiveDate: new Date('2024-09-01'),
      signerName: 'Thiếu tướng Nguyễn Văn Hòa',
      signerPosition: 'Giám đốc Học viện Hậu cần',
      issuingUnit: 'Học viện Hậu cần',
      workflowStatus: AwardWorkflowStatus.APPROVED,
      approvedAt: new Date('2024-08-30'),
      year: 2024,
    },
    {
      userEmail: 'truongkhoa@demo.hvhc.edu.vn',
      recordType: PolicyRecordType.EMULATION,
      level: PolicyLevel.MINISTRY,
      title: 'Chiến sĩ thi đua cấp Bộ năm 2023',
      reason: 'Hoàn thành xuất sắc nhiệm vụ lãnh đạo khoa và nghiên cứu khoa học',
      decisionNumber: 'QĐ-BQP/TĐKT-2023-088',
      decisionDate: new Date('2023-12-15'),
      effectiveDate: new Date('2024-01-01'),
      signerName: 'Đại tướng Phan Văn Giang',
      signerPosition: 'Bộ trưởng Bộ Quốc phòng',
      issuingUnit: 'Bộ Quốc phòng',
      workflowStatus: AwardWorkflowStatus.APPROVED,
      approvedAt: new Date('2023-12-15'),
      year: 2023,
    },
    {
      userEmail: 'tpns@demo.hvhc.edu.vn',
      recordType: PolicyRecordType.REWARD,
      level: PolicyLevel.ACADEMY,
      title: 'Bằng khen Giám đốc Học viện năm học 2024-2025',
      reason: 'Hoàn thành tốt công tác quản lý nhân sự và hậu cần năm học 2024-2025',
      decisionNumber: 'QĐ-HV/KT-2025-007',
      decisionDate: new Date('2025-04-01'),
      effectiveDate: new Date('2025-04-15'),
      signerName: 'Thiếu tướng Nguyễn Văn Hòa',
      signerPosition: 'Giám đốc Học viện Hậu cần',
      issuingUnit: 'Học viện Hậu cần',
      workflowStatus: AwardWorkflowStatus.PROPOSED,
      year: 2025,
    },
    {
      userEmail: 'giangvien@demo.hvhc.edu.vn',
      recordType: PolicyRecordType.DISCIPLINE,
      level: PolicyLevel.UNIT,
      title: 'Nhắc nhở vắng mặt sinh hoạt không phép',
      reason: 'Vắng mặt sinh hoạt chi đoàn 02 lần trong tháng 3/2024 không có lý do',
      decisionNumber: 'BB-BM-HC/KL-2024-001',
      decisionDate: new Date('2024-04-05'),
      effectiveDate: new Date('2024-04-05'),
      signerName: 'Đại tá Phạm Đức Lực',
      signerPosition: 'Trưởng Khoa Chỉ huy HC',
      issuingUnit: 'Khoa Chỉ huy HC',
      workflowStatus: AwardWorkflowStatus.APPROVED,
      approvedAt: new Date('2024-04-05'),
      year: 2024,
    },
  ];

  const userMap = new Map(validUsers.map(u => [u.email, u]));
  let created = 0;

  for (const r of records) {
    const user = userMap.get(r.userEmail);
    if (!user) continue;

    const existing = await prisma.policyRecord.findFirst({
      where: { userId: user.id, decisionNumber: r.decisionNumber },
    });
    if (existing) {
      console.log(`  ⏩ PolicyRecord '${r.decisionNumber}' already exists`);
      continue;
    }

    await prisma.policyRecord.create({
      data: {
        userId: user.id,
        recordType: r.recordType,
        level: r.level,
        title: r.title,
        reason: r.reason,
        decisionNumber: r.decisionNumber,
        decisionDate: r.decisionDate,
        effectiveDate: r.effectiveDate,
        signerName: r.signerName,
        signerPosition: r.signerPosition,
        issuingUnit: r.issuingUnit,
        workflowStatus: r.workflowStatus,
        approvedAt: r.approvedAt ?? null,
        year: r.year,
      },
    });

    console.log(`  ✅ PolicyRecord: ${r.decisionNumber} [${r.recordType}]`);
    created++;
  }

  console.log(`  → Tạo mới: ${created} / ${records.length}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(65));
  console.log('  SEED DIRECTOR DEMO DATA – HVHC');
  console.log('='.repeat(65));

  const profile = await ensureFacultyProfile();
  if (profile) {
    await seedResearchProjects(profile.id);
  }

  await seedPolicyRecords();

  console.log('\n' + '='.repeat(65));
  console.log('  ✅ SEED HOÀN TẤT');
  console.log('='.repeat(65));
}

main()
  .catch(e => {
    console.error('\n❌ FAILED:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
