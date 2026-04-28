/**
 * SEED Units — Cấu trúc tổ chức Học viện Hậu cần (HVHC)
 *
 * Script này XÓA toàn bộ dữ liệu unit cũ và tạo lại từ đầu
 * theo đúng cơ cấu tổ chức thực tế của HVHC.
 *
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_units.ts
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

interface UnitDef {
  code: string;
  name: string;
  type: string;
  level: number;
  parentCode?: string;
  description?: string;
}

// ============================================================
// CẤU TRÚC ĐƠN VỊ HVHC
// ============================================================
const UNITS: UnitDef[] = [
  // ── Level 1: Root ──────────────────────────────────────────
  {
    code: 'HVHC', name: 'Học viện Hậu cần', type: 'HVHC', level: 1,
    description: 'Học viện Hậu cần – Bộ Quốc phòng',
  },

  // ── Level 2: Ban Giám đốc ──────────────────────────────────
  {
    code: 'BGD', name: 'Ban Giám đốc', type: 'BAN', level: 2, parentCode: 'HVHC',
    description: 'Ban Giám đốc Học viện – Giám đốc, Chính ủy, các Phó GĐ',
  },

  // ── Level 2: Phòng / Ban chức năng ────────────────────────
  { code: 'B1',  name: 'Phòng Đào tạo',                                    type: 'PHONG', level: 2, parentCode: 'HVHC', description: 'Quản lý chương trình, kế hoạch đào tạo đại học' },
  { code: 'B2',  name: 'Phòng Khoa học',                                   type: 'PHONG', level: 2, parentCode: 'HVHC', description: 'Quản lý nghiên cứu khoa học và công nghệ' },
  { code: 'B3',  name: 'Phòng Chính trị',                                  type: 'PHONG', level: 2, parentCode: 'HVHC', description: 'Công tác Đảng, công tác chính trị, thi đua khen thưởng' },
  { code: 'B4',  name: 'Phòng Hậu cần',                                    type: 'PHONG', level: 2, parentCode: 'HVHC', description: 'Quản lý hậu cần, nhân sự nội bộ, bảo hiểm, chính sách' },
  { code: 'B5',  name: 'Văn phòng',                                        type: 'PHONG', level: 2, parentCode: 'HVHC', description: 'Hành chính tổng hợp, văn thư lưu trữ' },
  { code: 'B7',  name: 'Phòng Sau đại học',                                type: 'PHONG', level: 2, parentCode: 'HVHC', description: 'Quản lý đào tạo thạc sĩ, tiến sĩ' },
  { code: 'B9',  name: 'Ban Tài chính',                                    type: 'BAN',   level: 2, parentCode: 'HVHC', description: 'Quản lý tài chính, kế toán học viện' },
  { code: 'B12', name: 'Viện Nghiên cứu Khoa học Hậu cần quân sự',        type: 'VIEN',  level: 2, parentCode: 'HVHC', description: 'Nghiên cứu khoa học hậu cần quân sự' },
  { code: 'B13', name: 'Tạp chí Nghiên cứu Khoa học Hậu cần quân sự',    type: 'BAN',   level: 2, parentCode: 'HVHC', description: 'Xuất bản tạp chí khoa học' },
  { code: 'B14', name: 'Ban Khảo thí & Đảm bảo chất lượng GD-ĐT',       type: 'BAN',   level: 2, parentCode: 'HVHC', description: 'Quản lý khảo thí, kiểm định chất lượng đào tạo' },

  // ── Level 2: Khoa ──────────────────────────────────────────
  { code: 'K1',  name: 'Khoa Chỉ huy Hậu cần',                            type: 'KHOA', level: 2, parentCode: 'HVHC' },
  { code: 'K2',  name: 'Khoa Quân nhu',                                    type: 'KHOA', level: 2, parentCode: 'HVHC' },
  { code: 'K3',  name: 'Khoa Vận tải',                                     type: 'KHOA', level: 2, parentCode: 'HVHC' },
  { code: 'K4',  name: 'Khoa Xăng dầu',                                    type: 'KHOA', level: 2, parentCode: 'HVHC' },
  { code: 'K5',  name: 'Khoa Doanh trại',                                  type: 'KHOA', level: 2, parentCode: 'HVHC' },
  { code: 'K6',  name: 'Khoa Tài chính',                                   type: 'KHOA', level: 2, parentCode: 'HVHC' },
  { code: 'K7',  name: 'Khoa Quân sự',                                     type: 'KHOA', level: 2, parentCode: 'HVHC' },
  { code: 'K8',  name: 'Khoa Lý luận Mác-Lênin',                          type: 'KHOA', level: 2, parentCode: 'HVHC' },
  { code: 'K9',  name: 'Khoa Công tác Đảng - Công tác Chính trị',         type: 'KHOA', level: 2, parentCode: 'HVHC', description: 'Giảng dạy lý luận CTCT cho học viên' },
  { code: 'K10', name: 'Khoa Khoa học cơ bản',                             type: 'KHOA', level: 2, parentCode: 'HVHC' },
  { code: 'K11', name: 'Khoa Ngoại ngữ',                                   type: 'KHOA', level: 2, parentCode: 'HVHC' },
  { code: 'K14', name: 'Khoa Hậu cần chiến dịch',                         type: 'KHOA', level: 2, parentCode: 'HVHC' },

  // ── Level 2: Hệ đào tạo ───────────────────────────────────
  { code: 'HE1', name: 'Hệ đào tạo Sau đại học',   type: 'HE', level: 2, parentCode: 'HVHC', description: 'Đào tạo thạc sĩ, nghiên cứu sinh' },
  { code: 'HE2', name: 'Hệ Chỉ huy tham mưu',      type: 'HE', level: 2, parentCode: 'HVHC', description: 'Đào tạo sĩ quan chỉ huy tham mưu HC-KT' },
  { code: 'HE3', name: 'Hệ đào tạo Chuyên ngành',  type: 'HE', level: 2, parentCode: 'HVHC', description: 'Đào tạo sĩ quan chuyên ngành hậu cần' },
  { code: 'HE4', name: 'Hệ Quốc tế',               type: 'HE', level: 2, parentCode: 'HVHC', description: 'Đào tạo học viên quốc tế' },

  // ── Level 2: Tiểu đoàn ────────────────────────────────────
  { code: 'TD1', name: 'Tiểu đoàn 1', type: 'TIEUDOAN', level: 2, parentCode: 'HVHC', description: 'Tiểu đoàn học viên cử nhân 1' },
  { code: 'TD2', name: 'Tiểu đoàn 2', type: 'TIEUDOAN', level: 2, parentCode: 'HVHC', description: 'Tiểu đoàn học viên cử nhân 2' },
  { code: 'TD3', name: 'Tiểu đoàn 3', type: 'TIEUDOAN', level: 2, parentCode: 'HVHC', description: 'Tiểu đoàn học viên cử nhân 3' },
  { code: 'TD4', name: 'Tiểu đoàn 4', type: 'TIEUDOAN', level: 2, parentCode: 'HVHC', description: 'Tiểu đoàn học viên cử nhân 4' },

  // ── Level 3: Bộ môn (dưới Khoa) ───────────────────────────
  { code: 'BM_K1_1',  name: 'Bộ môn Chỉ huy Hậu cần chiến đấu',  type: 'BOMON', level: 3, parentCode: 'K1' },
  { code: 'BM_K1_2',  name: 'Bộ môn Tham mưu Hậu cần',            type: 'BOMON', level: 3, parentCode: 'K1' },
  { code: 'BM_K2_1',  name: 'Bộ môn Kỹ thuật Quân nhu',           type: 'BOMON', level: 3, parentCode: 'K2' },
  { code: 'BM_K2_2',  name: 'Bộ môn Bảo đảm Quân nhu',            type: 'BOMON', level: 3, parentCode: 'K2' },
  { code: 'BM_K3_1',  name: 'Bộ môn Chỉ huy Vận tải',             type: 'BOMON', level: 3, parentCode: 'K3' },
  { code: 'BM_K3_2',  name: 'Bộ môn Kỹ thuật Vận tải',            type: 'BOMON', level: 3, parentCode: 'K3' },
  { code: 'BM_K4_1',  name: 'Bộ môn Kỹ thuật Xăng dầu',           type: 'BOMON', level: 3, parentCode: 'K4' },
  { code: 'BM_K5_1',  name: 'Bộ môn Doanh trại quân đội',          type: 'BOMON', level: 3, parentCode: 'K5' },
  { code: 'BM_K6_1',  name: 'Bộ môn Kế toán Tài chính',            type: 'BOMON', level: 3, parentCode: 'K6' },
  { code: 'BM_K6_2',  name: 'Bộ môn Kinh tế Tài chính',            type: 'BOMON', level: 3, parentCode: 'K6' },
  { code: 'BM_K7_1',  name: 'Bộ môn Huấn luyện thể lực',           type: 'BOMON', level: 3, parentCode: 'K7' },
  { code: 'BM_K7_2',  name: 'Bộ môn Chiến thuật quân sự',          type: 'BOMON', level: 3, parentCode: 'K7' },
  { code: 'BM_K8_1',  name: 'Bộ môn Triết học Mác-Lênin',          type: 'BOMON', level: 3, parentCode: 'K8' },
  { code: 'BM_K9_1',  name: 'Bộ môn Công tác Đảng',                type: 'BOMON', level: 3, parentCode: 'K9' },
  { code: 'BM_K10_1', name: 'Bộ môn Toán – Tin học',               type: 'BOMON', level: 3, parentCode: 'K10' },
  { code: 'BM_K10_2', name: 'Bộ môn Vật lý – Hóa học',             type: 'BOMON', level: 3, parentCode: 'K10' },
  { code: 'BM_K11_1', name: 'Bộ môn Tiếng Anh',                    type: 'BOMON', level: 3, parentCode: 'K11' },
  { code: 'BM_K14_1', name: 'Bộ môn Hậu cần chiến dịch',           type: 'BOMON', level: 3, parentCode: 'K14' },

  // ── Level 3: Lớp dưới Hệ ──────────────────────────────────
  { code: 'LOP_HE1_1', name: 'Lớp Cao học 1',           type: 'LOP', level: 3, parentCode: 'HE1', description: 'Lớp cao học chuyên ngành HC-KT' },
  { code: 'LOP_HE1_2', name: 'Lớp Cao học 2',           type: 'LOP', level: 3, parentCode: 'HE1', description: 'Lớp cao học chuyên ngành khác' },
  { code: 'LOP_HE2_1', name: 'Lớp Chỉ huy tham mưu K1', type: 'LOP', level: 3, parentCode: 'HE2', description: 'Lớp đào tạo sĩ quan chỉ huy tham mưu' },
  { code: 'LOP_HE2_2', name: 'Lớp Chỉ huy tham mưu K2', type: 'LOP', level: 3, parentCode: 'HE2' },
  { code: 'LOP_HE3_1', name: 'Lớp Chuyên ngành K1',     type: 'LOP', level: 3, parentCode: 'HE3' },
  { code: 'LOP_HE3_2', name: 'Lớp Chuyên ngành K2',     type: 'LOP', level: 3, parentCode: 'HE3' },
  { code: 'LOP_HE4_1', name: 'Lớp Quốc tế K1',          type: 'LOP', level: 3, parentCode: 'HE4' },

  // ── Level 3: Đại đội dưới Tiểu đoàn ──────────────────────
  { code: 'DD_TD1_1', name: 'Đại đội 1 – Tiểu đoàn 1', type: 'DAIDOI', level: 3, parentCode: 'TD1' },
  { code: 'DD_TD1_2', name: 'Đại đội 2 – Tiểu đoàn 1', type: 'DAIDOI', level: 3, parentCode: 'TD1' },
  { code: 'DD_TD1_3', name: 'Đại đội 3 – Tiểu đoàn 1', type: 'DAIDOI', level: 3, parentCode: 'TD1' },
  { code: 'DD_TD2_1', name: 'Đại đội 1 – Tiểu đoàn 2', type: 'DAIDOI', level: 3, parentCode: 'TD2' },
  { code: 'DD_TD2_2', name: 'Đại đội 2 – Tiểu đoàn 2', type: 'DAIDOI', level: 3, parentCode: 'TD2' },
  { code: 'DD_TD2_3', name: 'Đại đội 3 – Tiểu đoàn 2', type: 'DAIDOI', level: 3, parentCode: 'TD2' },
  { code: 'DD_TD3_1', name: 'Đại đội 1 – Tiểu đoàn 3', type: 'DAIDOI', level: 3, parentCode: 'TD3' },
  { code: 'DD_TD3_2', name: 'Đại đội 2 – Tiểu đoàn 3', type: 'DAIDOI', level: 3, parentCode: 'TD3' },
  { code: 'DD_TD4_1', name: 'Đại đội 1 – Tiểu đoàn 4', type: 'DAIDOI', level: 3, parentCode: 'TD4' },
  { code: 'DD_TD4_2', name: 'Đại đội 2 – Tiểu đoàn 4', type: 'DAIDOI', level: 3, parentCode: 'TD4' },

  // ── Level 4: Lớp dưới Đại đội (cử nhân đại học) ──────────
  { code: 'LOP_TD1_DD1_1', name: 'Lớp CN 1 – Đại đội 1/TD1', type: 'LOP', level: 4, parentCode: 'DD_TD1_1' },
  { code: 'LOP_TD1_DD1_2', name: 'Lớp CN 2 – Đại đội 1/TD1', type: 'LOP', level: 4, parentCode: 'DD_TD1_1' },
  { code: 'LOP_TD1_DD2_1', name: 'Lớp CN 1 – Đại đội 2/TD1', type: 'LOP', level: 4, parentCode: 'DD_TD1_2' },
  { code: 'LOP_TD2_DD1_1', name: 'Lớp CN 1 – Đại đội 1/TD2', type: 'LOP', level: 4, parentCode: 'DD_TD2_1' },
  { code: 'LOP_TD2_DD1_2', name: 'Lớp CN 2 – Đại đội 1/TD2', type: 'LOP', level: 4, parentCode: 'DD_TD2_1' },
];

// ============================================================
// XÓA DATA CŨ
// ============================================================
async function clearOldUnits() {
  console.log('\n🗑️  Xóa dữ liệu unit cũ...');

  // 1. Null out self-referential fields trên Unit trước
  await prisma.unit.updateMany({ data: { commanderId: null } });
  await prisma.unit.updateMany({ data: { parentId: null } });
  console.log('  ✓ Cleared Unit.commanderId, Unit.parentId');

  // 2. Null out FK trên các bảng liên quan
  const nullifySteps: Array<{ label: string; fn: () => Promise<any> }> = [
    { label: 'User.unitId',           fn: () => prisma.user.updateMany({ data: { unitId: null } }) },
    { label: 'UserPosition.unitId',   fn: () => prisma.userPosition.updateMany({ data: { unitId: null } }) },
    { label: 'FacultyProfile.unitId', fn: () => prisma.facultyProfile.updateMany({ data: { unitId: null } }) },
    { label: 'Personnel.unitId',      fn: () => prisma.personnel.updateMany({ data: { unitId: null } }) },
    { label: 'NckhProject.unitId',    fn: () => prisma.nckhProject.updateMany({ data: { unitId: null } }) },
    { label: 'NckhProposal.unitId',   fn: () => prisma.nckhProposal.updateMany({ data: { unitId: null } }) },
    { label: 'PolicyRecord.unitId',   fn: () => prisma.policyRecord.updateMany({ data: { unitId: null } }) },
    { label: 'Program.unitId',        fn: () => prisma.program.updateMany({ data: { unitId: null } }) },
    { label: 'QuestionBank.unitId',   fn: () => prisma.questionBank.updateMany({ data: { unitId: null } }) },
    { label: 'PartyOrganization.unitId', fn: () => (prisma.partyOrganization as any).updateMany({ data: { unitId: null } }) },
    { label: 'Lab.unitId',            fn: () => (prisma.lab as any).updateMany({ data: { unitId: null } }) },
    { label: 'LearningMaterial.unitId', fn: () => (prisma.learningMaterial as any).updateMany({ data: { unitId: null } }) },
  ];

  for (const step of nullifySteps) {
    try {
      await step.fn();
      console.log(`  ✓ Nullified ${step.label}`);
    } catch {
      // Field may not exist or may not be nullable — skip silently
    }
  }

  // 3. Null HocVien training/battalion references
  try {
    await prisma.$executeRaw`UPDATE "HocVien" SET "heId" = NULL WHERE "heId" IS NOT NULL`;
    await prisma.$executeRaw`UPDATE "HocVien" SET "tieuDoanId" = NULL WHERE "tieuDoanId" IS NOT NULL`;
    await prisma.$executeRaw`UPDATE "HocVien" SET "lopId" = NULL WHERE "lopId" IS NOT NULL`;
  } catch {
    // Field names may vary — try common aliases
    try {
      await prisma.$executeRaw`UPDATE "hoc_vien" SET "he_id" = NULL WHERE "he_id" IS NOT NULL`;
    } catch { /* ignore */ }
  }

  // 4. Xóa UnitPositionAlias (FK to Unit)
  try {
    await prisma.unitPositionAlias.deleteMany({});
    console.log('  ✓ Deleted UnitPositionAlias records');
  } catch { /* may not exist */ }

  // 5. Xóa tất cả Unit
  const deleted = await prisma.unit.deleteMany({});
  console.log(`  ✓ Deleted ${deleted.count} old units`);
}

// ============================================================
// TẠO UNITS MỚI
// ============================================================
async function seedUnits() {
  console.log('\n🏛️  Tạo cấu trúc đơn vị mới...');

  const codeToId = new Map<string, string>();
  let created = 0;

  // Sort by level (parents first)
  const sorted = [...UNITS].sort((a, b) => a.level - b.level);

  for (const def of sorted) {
    let parentId: string | null = null;
    if (def.parentCode) {
      parentId = codeToId.get(def.parentCode) ?? null;
      if (!parentId) {
        console.warn(`  ⚠️  Parent '${def.parentCode}' not found for '${def.code}' — skipping`);
        continue;
      }
    }

    const unit = await prisma.unit.create({
      data: {
        code: def.code,
        name: def.name,
        type: def.type,
        level: def.level,
        parentId,
        description: def.description ?? null,
        active: true,
      },
    });

    codeToId.set(def.code, unit.id);
    created++;

    const indent = '  '.repeat(def.level - 1);
    console.log(`${indent}  ✅ [${def.code}] ${def.name}`);
  }

  console.log(`\n  Tổng tạo mới: ${created}/${UNITS.length} units`);
  return codeToId;
}

// ============================================================
// IN SƠ ĐỒ TỔ CHỨC
// ============================================================
async function printOrgChart() {
  const all = await prisma.unit.findMany({
    orderBy: [{ level: 'asc' }, { code: 'asc' }],
    select: { code: true, name: true, type: true, level: true },
  });

  console.log('\n📊 CƠ CẤU TỔ CHỨC HVHC:');
  const byType: Record<string, typeof all> = {};
  for (const u of all) {
    (byType[u.type] = byType[u.type] ?? []).push(u);
  }

  const order = ['HVHC', 'BAN', 'PHONG', 'VIEN', 'KHOA', 'HE', 'TIEUDOAN', 'BOMON', 'LOP', 'DAIDOI'];
  for (const type of order) {
    const items = byType[type];
    if (!items?.length) continue;
    console.log(`\n  ${type} (${items.length}):`);
    items.forEach(u => console.log(`    [${u.code}] ${u.name}`));
  }
  console.log(`\n  Tổng: ${all.length} units`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('  SEED UNITS – Học viện Hậu cần (HVHC)');
  console.log('='.repeat(60));

  await clearOldUnits();
  await seedUnits();
  await printOrgChart();

  console.log('\n' + '='.repeat(60));
  console.log('  ✅ SEED UNITS HOÀN THÀNH');
  console.log('='.repeat(60));
}

main()
  .catch(e => { console.error('\n❌ FAILED:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
