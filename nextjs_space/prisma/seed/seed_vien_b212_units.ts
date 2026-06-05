/**
 * Seed 4 đơn vị con (Ban) thật của Viện Nghiên cứu Khoa học Hậu cần Quân sự (mã B12).
 *
 * NON-DESTRUCTIVE: chỉ upsert theo Unit.code, KHÔNG xóa/đụng tới đơn vị khác.
 * (Khác hẳn seed_units.ts vốn wipe toàn bộ Unit — tuyệt đối không chạy lại file đó.)
 *
 * Tiền đề: đơn vị Viện 'B12' đã tồn tại (do seed_units.ts tạo). 4 Ban con là level 3,
 * parent = B12. Các mã này khớp với mapping trong scripts/build_vien_b212_data.py.
 *
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_vien_b212_units.ts
 */
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const VIEN_CODE = 'B12';

type SubUnitDef = {
  code: string;
  name: string;
  type: string;
};

// 4 Ban con thật xuất hiện trong CSDL.B212
const SUB_UNITS: SubUnitDef[] = [
  { code: 'B12-CH', name: 'Chỉ huy Viện Nghiên cứu Khoa học Hậu cần Quân sự', type: 'CHIHUY' },
  { code: 'B12-KHTH', name: 'Ban Kế hoạch tổng hợp', type: 'BAN' },
  { code: 'B12-KHHC', name: 'Ban Khoa học hậu cần quân sự', type: 'BAN' },
  { code: 'B12-KHKT', name: 'Ban Khoa học kỹ thuật hậu cần', type: 'BAN' },
];

async function seedSubUnits() {
  const vien = await prisma.unit.findFirst({ where: { code: VIEN_CODE } });
  if (!vien) {
    throw new Error(
      `Không tìm thấy đơn vị Viện '${VIEN_CODE}'. Hãy chạy seed_units.ts trước (tạo cây tổ chức gốc).`,
    );
  }

  console.log(`🏛️  Viện: [${vien.code}] ${vien.name} (id=${vien.id})`);

  for (const def of SUB_UNITS) {
    const unit = await prisma.unit.upsert({
      where: { code: def.code },
      update: {
        name: def.name,
        type: def.type,
        level: vien.level + 1,
        parentId: vien.id,
        active: true,
      },
      create: {
        code: def.code,
        name: def.name,
        type: def.type,
        level: vien.level + 1,
        parentId: vien.id,
        active: true,
      },
    });
    console.log(`  ✅ [${unit.code}] ${unit.name}`);
  }

  console.log(`\n  Tổng: ${SUB_UNITS.length} Ban con dưới Viện ${VIEN_CODE}`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('  SEED ĐƠN VỊ CON – Viện NCKH Hậu cần Quân sự (B12)');
  console.log('='.repeat(60));

  await seedSubUnits();

  console.log('\n  ✅ HOÀN THÀNH (non-destructive upsert)');
}

main()
  .catch((e) => {
    console.error('\n❌ FAILED:', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
