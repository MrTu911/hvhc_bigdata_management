/**
 * Seed — Danh mục nguồn dữ liệu (DataSource catalog) cho section Khai thác dữ liệu.
 *
 * - M19: tạo MasterCategory DATA_SOURCE_KIND + DATA_DOMAIN và các item.
 * - DataSource: upsert theo code (idempotent). classification reuse DataClassification,
 *   ownerUnit map theo tên đơn vị nếu có, ngược lại dùng ownerLabel.
 *
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_bigdata_sources.ts
 */

import { PrismaClient, type DataSourceStatus } from '@prisma/client';

const prisma = new PrismaClient();

const TB = 1024 ** 4;

const KIND_ITEMS = [
  { code: 'warehouse', nameVi: 'Kho dữ liệu' },
  { code: 'datalake', nameVi: 'Data Lake' },
  { code: 'oltp', nameVi: 'CSDL vận hành (OLTP)' },
  { code: 'stream', nameVi: 'Luồng dữ liệu' },
  { code: 'cold', nameVi: 'Lưu trữ lạnh' },
];

const DOMAIN_ITEMS = [
  { code: 'QUAN_NHAN', nameVi: 'Quản lý quân nhân' },
  { code: 'CAN_BO', nameVi: 'Quản lý cán bộ' },
  { code: 'DAO_TAO', nameVi: 'Giáo dục đào tạo' },
  { code: 'KHOA_HOC', nameVi: 'Nghiên cứu khoa học' },
  { code: 'KHAC', nameVi: 'Khác' },
];

interface SourceSeed {
  code: string;
  title: string;
  description: string;
  kindCode: string;
  domainCode: string;
  classificationId: string;
  engineLabel: string;
  ownerLabel: string;
  ownerUnitHint?: string;
  recordCount: number;
  sizeBytes: number;
  tableCount: number;
  healthScore: number;
  status: DataSourceStatus;
}

const SOURCES: SourceSeed[] = [
  { code: 'wh_quannhan', title: 'Kho dữ liệu Quân nhân', description: 'Dữ liệu hồ sơ, biên chế, điều động quân nhân toàn học viện.', kindCode: 'warehouse', domainCode: 'QUAN_NHAN', classificationId: 'SECRET', engineLabel: 'Hive', ownerLabel: 'P. Quân lực', recordCount: 218_400_000, sizeBytes: Math.round(38.4 * TB), tableCount: 142, healthScore: 96, status: 'ACTIVE' },
  { code: 'wh_canbo', title: 'Kho dữ liệu Cán bộ', description: 'Hồ sơ cán bộ, chính sách, khen thưởng, kỷ luật.', kindCode: 'warehouse', domainCode: 'CAN_BO', classificationId: 'CONFIDENTIAL', engineLabel: 'Hive', ownerLabel: 'P. Cán bộ', recordCount: 24_100_000, sizeBytes: Math.round(12.1 * TB), tableCount: 88, healthScore: 94, status: 'ACTIVE' },
  { code: 'dl_daotao', title: 'Data Lake Đào tạo', description: 'Kết quả học tập, chương trình đào tạo, lịch giảng dạy.', kindCode: 'datalake', domainCode: 'DAO_TAO', classificationId: 'INTERNAL', engineLabel: 'Iceberg', ownerLabel: 'P. Đào tạo', ownerUnitHint: 'Đào tạo', recordCount: 86_200_000, sizeBytes: Math.round(19.2 * TB), tableCount: 64, healthScore: 82, status: 'WARNING' },
  { code: 'wh_khoahoc', title: 'Kho dữ liệu Khoa học', description: 'Đề tài, công trình, hội đồng, kinh phí nghiên cứu khoa học.', kindCode: 'warehouse', domainCode: 'KHOA_HOC', classificationId: 'INTERNAL', engineLabel: 'Hive', ownerLabel: 'P. KHCN', ownerUnitHint: 'Khoa học', recordCount: 12_800_000, sizeBytes: Math.round(8.4 * TB), tableCount: 52, healthScore: 91, status: 'ACTIVE' },
  { code: 'oltp_hethong', title: 'CSDL Vận hành hệ thống', description: 'Cơ sở dữ liệu giao dịch trực tuyến của các phân hệ nghiệp vụ.', kindCode: 'oltp', domainCode: 'KHAC', classificationId: 'CONFIDENTIAL', engineLabel: 'PostgreSQL', ownerLabel: 'TT. CNTT', recordCount: 4_200_000, sizeBytes: Math.round(2.1 * TB), tableCount: 210, healthScore: 99, status: 'ACTIVE' },
  { code: 'stream_events', title: 'Luồng sự kiện hệ thống', description: 'Sự kiện đăng nhập, audit, thao tác người dùng theo thời gian thực.', kindCode: 'stream', domainCode: 'KHAC', classificationId: 'INTERNAL', engineLabel: 'Kafka', ownerLabel: 'TT. CNTT', recordCount: 0, sizeBytes: 0, tableCount: 18, healthScore: 88, status: 'SYNCING' },
];

async function seedCategory(code: string, nameVi: string, items: { code: string; nameVi: string }[]) {
  await prisma.masterCategory.upsert({
    where: { code },
    update: { nameVi, isActive: true },
    create: { code, nameVi, groupTag: 'BIGDATA', description: `Danh mục ${nameVi}`, isActive: true },
  });
  for (const [index, item] of items.entries()) {
    await prisma.masterDataItem.upsert({
      where: { categoryCode_code: { categoryCode: code, code: item.code } },
      update: { nameVi: item.nameVi, isActive: true, sortOrder: index },
      create: { categoryCode: code, code: item.code, nameVi: item.nameVi, sortOrder: index, isActive: true },
    });
  }
}

async function main() {
  console.log('▶ Seed M19 categories…');
  await seedCategory('DATA_SOURCE_KIND', 'Loại nguồn dữ liệu', KIND_ITEMS);
  await seedCategory('DATA_DOMAIN', 'Lĩnh vực dữ liệu', DOMAIN_ITEMS);

  console.log('▶ Seed DataSource catalog…');
  for (const s of SOURCES) {
    let ownerUnitId: string | null = null;
    if (s.ownerUnitHint) {
      const unit = await prisma.unit.findFirst({
        where: { name: { contains: s.ownerUnitHint } },
        select: { id: true },
      });
      ownerUnitId = unit?.id ?? null;
    }

    await prisma.dataSource.upsert({
      where: { code: s.code },
      update: {
        title: s.title, description: s.description, kindCode: s.kindCode, domainCode: s.domainCode,
        classificationId: s.classificationId, engineLabel: s.engineLabel, ownerLabel: s.ownerLabel,
        ownerUnitId, recordCount: BigInt(s.recordCount), sizeBytes: BigInt(s.sizeBytes),
        tableCount: s.tableCount, healthScore: s.healthScore, status: s.status, lastSyncedAt: new Date(),
        isActive: true,
      },
      create: {
        code: s.code, title: s.title, description: s.description, kindCode: s.kindCode, domainCode: s.domainCode,
        classificationId: s.classificationId, engineLabel: s.engineLabel, ownerLabel: s.ownerLabel,
        ownerUnitId, recordCount: BigInt(s.recordCount), sizeBytes: BigInt(s.sizeBytes),
        tableCount: s.tableCount, healthScore: s.healthScore, status: s.status, lastSyncedAt: new Date(),
      },
    });
  }

  const count = await prisma.dataSource.count();
  console.log(`✅ Done. data_sources rows = ${count}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
