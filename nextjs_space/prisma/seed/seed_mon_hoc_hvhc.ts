/**
 * SEED Danh mục môn học thật — Học viện Hậu cần (HVHC)
 *
 * - Nạp lại danh mục môn học thật vào HeSoMonHoc (độc lập với dữ liệu học tập)
 * - Gán mỗi môn về Khoa + Bộ môn (FK tới Unit) theo cây tổ chức HVHC
 *
 * ⚠️ Reset dữ liệu học tập (ClassSection/ClassEnrollment/KetQuaHocTap/ScoreHistory…)
 *    là OPT-IN: chỉ chạy khi đặt env RESET_M10_LEARNING=true. Mặc định KHÔNG reset
 *    để không phá dữ liệu seed ở step 51-53 khi file này chạy ở step 54 (orchestrator).
 *    Danh mục môn (HeSoMonHoc) không có FK bắt buộc tới các bảng học tập đó.
 *
 * Nguồn dữ liệu: prisma/seed/data/mon_hoc_hvhc.json
 *   (sinh từ file Excel gốc bằng scripts/build_mon_hoc_data.py)
 *
 * Yêu cầu chạy TRƯỚC: prisma/seed/seed_units.ts (để có Unit Khoa + Bộ môn).
 *
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_mon_hoc_hvhc.ts
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

const prisma = new PrismaClient();

interface MonHocRow {
  maMon: string;
  tenMon: string;
  khoa: string;
  boMon: string;
}

interface BoMonDef {
  code: string;
  name: string;
  parentKhoaCode: string;
}

// Map tên Khoa (đúng chính tả trong dữ liệu thật) -> code Unit trong seed_units.ts.
// Phải đồng bộ với scripts/build_mon_hoc_data.py (KHOA_NAME_TO_CODE).
const KHOA_NAME_TO_CODE: Record<string, string> = {
  'Khoa Chỉ huy hậu cần': 'K1',
  'Khoa Quân nhu': 'K2',
  'Khoa Vận tải': 'K3',
  'Khoa Xăng dầu': 'K4',
  'Khoa Doanh trại': 'K5',
  'Khoa Tài chính': 'K6',
  'Khoa Quân sự': 'K7',
  'Khoa Lý luận Mác-Lênin, Tư tưởng Hồ Chí Minh': 'K8',
  'Khoa Công tác Đảng, Công tác Chính trị': 'K9',
  'Khoa Khoa học cơ bản': 'K10',
  'Khoa Ngoại ngữ': 'K11',
  'Khoa Hậu cần chiến dịch': 'K14',
  'Viện Nghiên cứu Khoa học Hậu cần': 'B12',
  'Ban Khảo thí & kiểm định chất lượng Đào tạo': 'B14',
  'Học viện Hậu cần': 'HVHC',
  'Phòng Kỹ thuật': 'PKT',
};

// Bộ môn coi như "chưa gán" -> boMonId = null (giữ chuỗi để hiển thị)
const UNASSIGNED_BO_MON = new Set(['Không tên']);

function normalizeName(s: string): string {
  return s.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');
}

function loadSubjects(): MonHocRow[] {
  const file = join(__dirname, 'data', 'mon_hoc_hvhc.json');
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function loadBoMon(): BoMonDef[] {
  const file = join(__dirname, 'data', 'bo_mon_hvhc.json');
  return JSON.parse(readFileSync(file, 'utf-8'));
}

// ============================================================
// ĐẢM BẢO Unit Khoa + Bộ môn (KHÔNG xóa unit — chỉ upsert)
// ============================================================
// Tránh chạy seed_units.ts (xóa toàn bộ Unit + null FK personnel/faculty).
// Ở đây chỉ bổ sung những gì cần cho danh mục môn: Phòng Kỹ thuật + Bộ môn thật,
// và đồng bộ tên 3 Khoa cho khớp dữ liệu thật (cập nhật tên, không đụng FK).
async function ensureOrgUnits() {
  console.log('\n🏛️  Đảm bảo Unit Khoa/Bộ môn (upsert, không xóa)...');

  // 1. Phòng Kỹ thuật (PKT) trực thuộc Học viện
  const hvhc = await prisma.unit.findUnique({ where: { code: 'HVHC' } });
  await prisma.unit.upsert({
    where: { code: 'PKT' },
    update: {},
    create: {
      code: 'PKT',
      name: 'Phòng Kỹ thuật',
      type: 'PHONG',
      level: 2,
      parentId: hvhc?.id ?? null,
      active: true,
    },
  });

  // 2. Đồng bộ tên Khoa theo dữ liệu thật (chỉ cập nhật name)
  const khoaRenames: Array<[string, string]> = [
    ['K1', 'Khoa Chỉ huy hậu cần'],
    ['K8', 'Khoa Lý luận Mác-Lênin, Tư tưởng Hồ Chí Minh'],
    ['K9', 'Khoa Công tác Đảng, Công tác Chính trị'],
  ];
  for (const [code, name] of khoaRenames) {
    await prisma.unit.updateMany({ where: { code }, data: { name } });
  }

  // 3. Upsert Bộ môn thật (parent = Khoa theo code)
  const boMon = loadBoMon();
  const khoaCodes = [...new Set(boMon.map((b) => b.parentKhoaCode))];
  const khoaUnits = await prisma.unit.findMany({
    where: { code: { in: khoaCodes } },
    select: { id: true, code: true },
  });
  const codeToId = new Map(khoaUnits.map((u) => [u.code, u.id]));

  for (const b of boMon) {
    const parentId = codeToId.get(b.parentKhoaCode) ?? null;
    // type canonical là 'BO_MON' (khớp seed_units.ts). update cả type để chuẩn hóa
    // các bản ghi cũ lỡ tạo bằng 'BOMON' (mismatch làm buildUnitLookup không khớp).
    await prisma.unit.upsert({
      where: { code: b.code },
      update: { name: b.name, parentId, type: 'BO_MON' },
      create: { code: b.code, name: b.name, type: 'BO_MON', level: 3, parentId, active: true },
    });
  }

  console.log(`  ✓ Phòng Kỹ thuật + ${boMon.length} Bộ môn (upsert)`);
}

// ============================================================
// RESET dữ liệu học tập demo (đúng thứ tự FK)
// ============================================================
async function resetDemoLearningData() {
  console.log('\n🗑️  Reset dữ liệu học tập demo...');

  const steps: Array<{ label: string; fn: () => Promise<{ count: number }> }> = [
    { label: 'ScoreHistory', fn: () => prisma.scoreHistory.deleteMany({}) },
    { label: 'SessionAttendance', fn: () => prisma.sessionAttendance.deleteMany({}) },
    { label: 'ClassEnrollment', fn: () => prisma.classEnrollment.deleteMany({}) },
    { label: 'TrainingSession', fn: () => prisma.trainingSession.deleteMany({}) },
    { label: 'ClassSection', fn: () => prisma.classSection.deleteMany({}) },
    { label: 'KetQuaHocTap', fn: () => prisma.ketQuaHocTap.deleteMany({}) },
  ];

  for (const step of steps) {
    try {
      const { count } = await step.fn();
      console.log(`  ✓ Xóa ${step.label}: ${count}`);
    } catch (e) {
      console.warn(`  ⚠️  Bỏ qua ${step.label}: ${(e as Error).message}`);
    }
  }
}

// ============================================================
// XÓA danh mục môn cũ
// ============================================================
async function clearOldSubjects() {
  const { count } = await prisma.heSoMonHoc.deleteMany({});
  console.log(`\n🗑️  Xóa danh mục môn cũ (HeSoMonHoc): ${count}`);
}

// ============================================================
// BUILD lookup Unit (Khoa + Bộ môn)
// ============================================================
async function buildUnitLookup() {
  const units = await prisma.unit.findMany({
    select: { id: true, code: true, name: true, type: true, parentId: true },
  });

  const codeToId = new Map<string, string>();
  // Bộ môn: key = `${parentKhoaUnitId}||${normalizeName(boMon)}`
  const boMonByParentAndName = new Map<string, string>();

  for (const u of units) {
    codeToId.set(u.code, u.id);
  }
  for (const u of units) {
    if (u.type === 'BO_MON' && u.parentId) {
      boMonByParentAndName.set(`${u.parentId}||${normalizeName(u.name)}`, u.id);
    }
  }

  return { codeToId, boMonByParentAndName };
}

// ============================================================
// SEED danh mục môn học thật
// ============================================================
async function seedSubjects() {
  const subjects = loadSubjects();
  const { codeToId, boMonByParentAndName } = await buildUnitLookup();

  const unmatchedKhoa = new Set<string>();
  const unmatchedBoMon = new Set<string>();
  let withKhoa = 0;
  let withBoMon = 0;

  const data = subjects.map((s) => {
    const khoaCode = KHOA_NAME_TO_CODE[s.khoa];
    const khoaId = khoaCode ? codeToId.get(khoaCode) ?? null : null;
    if (khoaId) withKhoa++;
    else unmatchedKhoa.add(s.khoa);

    let boMonId: string | null = null;
    if (khoaId && s.boMon && !UNASSIGNED_BO_MON.has(s.boMon)) {
      boMonId = boMonByParentAndName.get(`${khoaId}||${normalizeName(s.boMon)}`) ?? null;
      if (boMonId) withBoMon++;
      else unmatchedBoMon.add(`${s.khoa} / ${s.boMon}`);
    }

    return {
      maMon: s.maMon,
      tenMon: s.tenMon,
      khoa: s.khoa,
      boMon: s.boMon,
      khoaId,
      boMonId,
    };
  });

  const { count } = await prisma.heSoMonHoc.createMany({ data, skipDuplicates: true });

  console.log(`\n✅ Tạo mới ${count}/${subjects.length} môn học (HeSoMonHoc)`);
  console.log(`   • Có khoaId: ${withKhoa}/${subjects.length}`);
  console.log(`   • Có boMonId: ${withBoMon}/${subjects.length}`);

  if (unmatchedKhoa.size) {
    console.log(`\n   ⚠️  Khoa KHÔNG map được Unit (khoaId=null) — giữ chuỗi:`);
    [...unmatchedKhoa].sort().forEach((k) => console.log(`        - ${k}`));
  }
  if (unmatchedBoMon.size) {
    console.log(`\n   ⚠️  Bộ môn KHÔNG khớp Unit (boMonId=null) — kiểm tra lại:`);
    [...unmatchedBoMon].sort().forEach((b) => console.log(`        - ${b}`));
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('  SEED DANH MỤC MÔN HỌC THẬT – Học viện Hậu cần (HVHC)');
  console.log('='.repeat(60));

  await ensureOrgUnits();
  // Reset dữ liệu học tập là OPT-IN — mặc định bỏ qua để không phá seed step 51-53.
  if (process.env.RESET_M10_LEARNING === 'true') {
    await resetDemoLearningData();
  } else {
    console.log('\n⏭️  Bỏ qua reset dữ liệu học tập (đặt RESET_M10_LEARNING=true nếu thực sự muốn xoá).');
  }
  await clearOldSubjects();
  await seedSubjects();

  console.log('\n' + '='.repeat(60));
  console.log('  ✅ SEED MÔN HỌC HOÀN THÀNH');
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('\n❌ FAILED:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
