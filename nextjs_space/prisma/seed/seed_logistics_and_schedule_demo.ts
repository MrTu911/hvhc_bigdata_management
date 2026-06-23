/**
 * SEED demo — Kiểm thử M10 Phase 2 (generator xếp lịch) + Phase 3 (vật chất + bản đồ).
 *
 * Idempotent (upsert theo `code`). Giải id theo code/unique lúc chạy → portable.
 *
 * - Phase 2: ~6 lớp học phần trong học kỳ 2 (CHƯA có buổi học) để chạy generator.
 *   Cố ý tạo 2 cặp XUNG ĐỘT (trùng phòng & trùng giảng viên) để minh họa conflict-check.
 * - Phase 3: vật chất huấn luyện (Ban Vật chất B1_T59A) + bản đồ (Ban Bản đồ B1_TKIA).
 *
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_logistics_and_schedule_demo.ts
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function seedScheduleSections() {
  // Học kỳ trống (chưa có buổi học) để generator sinh buổi
  const term = await prisma.term.findUnique({ where: { code: 'HK2-2025-2026' }, select: { id: true, name: true } });
  if (!term) { console.log('  ⚠️  Không thấy học kỳ HK2-2025-2026 — bỏ qua phần lớp học phần.'); return; }

  const rooms = await prisma.room.findMany({ where: { isActive: true }, select: { id: true }, orderBy: { code: 'asc' }, take: 3 });
  const faculty = await prisma.facultyProfile.findMany({ select: { id: true }, take: 3 });
  const courses = await prisma.curriculumCourse.findMany({ select: { id: true }, take: 3 });

  if (rooms.length < 3 || faculty.length < 3 || courses.length < 3) {
    console.log('  ⚠️  Thiếu room/faculty/curriculumCourse demo — vẫn tạo lớp với field null tương ứng.');
  }
  const room = (i: number) => rooms[i]?.id ?? null;
  const fac = (i: number) => faculty[i]?.id ?? null;
  const cc = (i: number) => courses[i]?.id ?? null;

  // dayOfWeek: 2=Thứ3, 3=Thứ4... (quy ước conflict-check). Cặp xung đột:
  //  01 vs 02: trùng PHÒNG (room0, Thứ3, tiết 1-3 ∩ 2-4)
  //  03 vs 04: trùng GIẢNG VIÊN (fac0, Thứ4, tiết 1-3 ∩ 2-4)
  const sections = [
    { code: 'DEMO-HL2-01', name: 'Tin học ĐC - N01', dayOfWeek: 2, startPeriod: 1, endPeriod: 3, roomId: room(0), facultyId: fac(0), curriculumCourseId: cc(0) },
    { code: 'DEMO-HL2-02', name: 'Lập trình CB - N01', dayOfWeek: 2, startPeriod: 2, endPeriod: 4, roomId: room(0), facultyId: fac(1), curriculumCourseId: cc(1) },
    { code: 'DEMO-HL2-03', name: 'CTDL&GT - N01', dayOfWeek: 3, startPeriod: 1, endPeriod: 3, roomId: room(1), facultyId: fac(0), curriculumCourseId: cc(2) },
    { code: 'DEMO-HL2-04', name: 'Tin học ĐC - N02', dayOfWeek: 3, startPeriod: 2, endPeriod: 4, roomId: room(2), facultyId: fac(0), curriculumCourseId: cc(0) },
    { code: 'DEMO-HL2-05', name: 'Lập trình CB - N02', dayOfWeek: 4, startPeriod: 6, endPeriod: 8, roomId: room(1), facultyId: fac(1), curriculumCourseId: cc(1) },
    { code: 'DEMO-HL2-06', name: 'CTDL&GT - N02', dayOfWeek: 5, startPeriod: 1, endPeriod: 2, roomId: room(2), facultyId: fac(2), curriculumCourseId: cc(2) },
  ];

  for (const s of sections) {
    await prisma.classSection.upsert({
      where: { code: s.code },
      update: { termId: term.id, dayOfWeek: s.dayOfWeek, startPeriod: s.startPeriod, endPeriod: s.endPeriod, roomId: s.roomId, facultyId: s.facultyId, curriculumCourseId: s.curriculumCourseId, isActive: true, status: 'OPEN' },
      create: { ...s, termId: term.id, maxStudents: 40, status: 'OPEN', isActive: true },
    });
  }
  console.log(`  ✓ ${sections.length} lớp học phần demo trong "${term.name}" (chưa có buổi — chạy generator để sinh; 2 cặp xung đột phòng/GV).`);
}

async function seedMateriel() {
  const ban = await prisma.unit.findUnique({ where: { code: 'B1_T59A' }, select: { id: true } });
  const managingUnitId = ban?.id ?? null;
  const items = [
    { code: 'VCHL-AK', name: 'Súng tiểu liên AK (mô hình huấn luyện)', category: 'WEAPON_MODEL', measureUnit: 'khẩu', quantityTotal: 30, condition: 'GOOD', storageLocation: 'Kho VC số 1' },
    { code: 'VCHL-B40', name: 'Súng chống tăng B40 (mô hình)', category: 'WEAPON_MODEL', measureUnit: 'khẩu', quantityTotal: 10, condition: 'GOOD', storageLocation: 'Kho VC số 1' },
    { code: 'VCHL-LUUDAN', name: 'Mô hình lựu đạn F1', category: 'AMMUNITION_MODEL', measureUnit: 'quả', quantityTotal: 100, condition: 'USABLE', storageLocation: 'Kho VC số 2' },
    { code: 'VCHL-SABAN', name: 'Sa bàn địa hình huấn luyện', category: 'SIMULATOR', measureUnit: 'bộ', quantityTotal: 5, condition: 'GOOD', storageLocation: 'Phòng học chuyên dùng' },
    { code: 'VCHL-DIABAN', name: 'Bộ học cụ địa bàn', category: 'FIELD_GEAR', measureUnit: 'bộ', quantityTotal: 50, condition: 'GOOD', storageLocation: 'Kho VC số 2' },
    { code: 'VCHL-TTLL', name: 'Máy thông tin liên lạc mô phỏng', category: 'SIMULATOR', measureUnit: 'bộ', quantityTotal: 8, condition: 'GOOD', storageLocation: 'Kho VC số 1' },
    { code: 'VCHL-CONGBINH', name: 'Bộ dụng cụ công binh', category: 'EQUIPMENT', measureUnit: 'bộ', quantityTotal: 12, condition: 'USABLE', storageLocation: 'Kho VC số 3' },
    { code: 'VCHL-NGUYTRANG', name: 'Bộ ngụy trang dã ngoại', category: 'FIELD_GEAR', measureUnit: 'bộ', quantityTotal: 40, condition: 'GOOD', storageLocation: 'Kho VC số 2' },
  ];
  for (const it of items) {
    await prisma.trainingMateriel.upsert({
      where: { code: it.code },
      update: { name: it.name, category: it.category as never, measureUnit: it.measureUnit, condition: it.condition as never, storageLocation: it.storageLocation, managingUnitId, isActive: true },
      create: { ...it, category: it.category as never, condition: it.condition as never, quantityAvailable: it.quantityTotal, managingUnitId },
    });
  }
  console.log(`  ✓ ${items.length} vật chất huấn luyện (Ban Vật chất B1_T59A).`);
}

async function seedMaps() {
  const ban = await prisma.unit.findUnique({ where: { code: 'B1_TKIA' }, select: { id: true } });
  const managingUnitId = ban?.id ?? null;
  const maps = [
    { code: 'BD-DH50K-001', name: 'Bản đồ địa hình khu vực Hà Nội', mapType: 'TOPOGRAPHIC', format: 'PAPER', scale: '1:50.000', sheetNumber: 'F-48-105', securityLevel: 'NORMAL', quantityTotal: 20, storageLocation: 'Kho bản đồ A' },
    { code: 'BD-DH25K-002', name: 'Bản đồ địa hình Sơn Tây', mapType: 'TOPOGRAPHIC', format: 'PAPER', scale: '1:25.000', sheetNumber: 'F-48-105-C', securityLevel: 'NORMAL', quantityTotal: 15, storageLocation: 'Kho bản đồ A' },
    { code: 'BD-TC-003', name: 'Bản đồ tác chiến khu vực phòng thủ', mapType: 'TACTICAL', format: 'PAPER', scale: '1:100.000', securityLevel: 'SECRET', quantityTotal: 5, storageLocation: 'Kho mật' },
    { code: 'BD-HC-004', name: 'Bản đồ hành chính Việt Nam', mapType: 'ADMINISTRATIVE', format: 'PAPER', scale: '1:1.000.000', securityLevel: 'NORMAL', quantityTotal: 30, storageLocation: 'Kho bản đồ A' },
    { code: 'BD-SO-005', name: 'Bản đồ số địa hình (GeoTIFF)', mapType: 'DIGITAL_LAYER', format: 'DIGITAL', scale: '1:50.000', securityLevel: 'CONFIDENTIAL', quantityTotal: 1, storageLocation: 'Máy chủ bản đồ số' },
    { code: 'BD-TN-006', name: 'Bản đồ tác nghiệp diễn tập', mapType: 'OPERATIONAL', format: 'PAPER', scale: '1:50.000', securityLevel: 'CONFIDENTIAL', quantityTotal: 8, storageLocation: 'Kho mật' },
    { code: 'BD-DH100K-007', name: 'Bản đồ địa hình vùng núi', mapType: 'TOPOGRAPHIC', format: 'PAPER', scale: '1:100.000', sheetNumber: 'E-48-070', securityLevel: 'NORMAL', quantityTotal: 12, storageLocation: 'Kho bản đồ A' },
    { code: 'BD-SO-008', name: 'Lớp bản đồ số tác chiến', mapType: 'DIGITAL_LAYER', format: 'DIGITAL', scale: '1:25.000', securityLevel: 'SECRET', quantityTotal: 1, storageLocation: 'Máy chủ bản đồ số' },
  ];
  for (const m of maps) {
    await prisma.mapAsset.upsert({
      where: { code: m.code },
      update: { name: m.name, mapType: m.mapType as never, format: m.format as never, scale: m.scale, sheetNumber: m.sheetNumber ?? null, securityLevel: m.securityLevel as never, storageLocation: m.storageLocation, managingUnitId, isActive: true },
      create: { ...m, sheetNumber: m.sheetNumber ?? null, mapType: m.mapType as never, format: m.format as never, securityLevel: m.securityLevel as never, quantityAvailable: m.quantityTotal, managingUnitId },
    });
  }
  console.log(`  ✓ ${maps.length} bản đồ (Ban Bản đồ B1_TKIA; có bản đồ mật/tối mật để test guard).`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('  SEED DEMO — M10 Phase 2 (xếp lịch) + Phase 3 (vật chất + bản đồ)');
  console.log('='.repeat(60));
  await seedScheduleSections();
  await seedMateriel();
  await seedMaps();
  console.log('\n✅ HOÀN THÀNH. Test: trang Lịch huấn luyện chọn HK2 → "Sinh lịch học kỳ";');
  console.log('   trang Vật chất huấn luyện & Vật chất bản đồ (menu Vật chất & Bản đồ).');
}

main().catch((e) => { console.error('❌ FAILED:', e); process.exit(1); }).finally(() => prisma.$disconnect());
