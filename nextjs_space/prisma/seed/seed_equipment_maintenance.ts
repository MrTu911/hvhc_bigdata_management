/**
 * Seed: EquipmentMaintenance (lịch sử vận hành & bảo trì thiết bị lab — M12)
 *
 * Phục vụ route GET /api/equipment/[id]/history (AI Predictive Maintenance).
 * Mỗi LabEquipment hiện có được tạo 2–4 bản ghi bảo trì lịch sử + 1 lịch sắp tới.
 *
 * Phụ thuộc: LabEquipment (seed_m10_lab_data.ts / seed lab).
 * Idempotent: bỏ qua thiết bị đã có bản ghi bảo trì.
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_equipment_maintenance.ts
 */
import { PrismaClient, MaintenanceType, MaintenanceStatus } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const MAINTENANCE_TEMPLATES: Array<{
  type: MaintenanceType;
  description: string;
  findings: string;
  actions: string;
  partsReplaced: string | null;
  cost: number;
}> = [
  {
    type: MaintenanceType.ROUTINE,
    description: 'Bảo dưỡng định kỳ theo lịch quý',
    findings: 'Thiết bị hoạt động ổn định, bụi bám nhẹ ở khe tản nhiệt',
    actions: 'Vệ sinh tổng thể, tra dầu mỡ, kiểm tra kết nối điện',
    partsReplaced: null,
    cost: 500000,
  },
  {
    type: MaintenanceType.INSPECTION,
    description: 'Kiểm tra an toàn kỹ thuật trước kỳ thực hành',
    findings: 'Các thông số trong ngưỡng cho phép',
    actions: 'Đo kiểm thông số, dán tem kiểm định',
    partsReplaced: null,
    cost: 300000,
  },
  {
    type: MaintenanceType.CALIBRATION,
    description: 'Hiệu chuẩn thiết bị đo lường',
    findings: 'Sai số vượt 1.5% so với chuẩn',
    actions: 'Hiệu chuẩn lại theo chuẩn nhà sản xuất',
    partsReplaced: null,
    cost: 1200000,
  },
  {
    type: MaintenanceType.REPAIR,
    description: 'Sửa chữa sự cố phát sinh trong vận hành',
    findings: 'Quạt làm mát kêu to, nguồn chập chờn',
    actions: 'Thay quạt làm mát, kiểm tra bo nguồn',
    partsReplaced: 'Quạt làm mát 12V, cầu chì nguồn',
    cost: 2500000,
  },
  {
    type: MaintenanceType.UPGRADE,
    description: 'Nâng cấp linh kiện tăng hiệu năng',
    findings: 'Cấu hình cũ không đáp ứng bài thực hành mới',
    actions: 'Nâng cấp RAM/ổ cứng/firmware',
    partsReplaced: 'RAM 8GB, SSD 256GB',
    cost: 3800000,
  },
];

function pseudoRand(seed: number, min: number, max: number): number {
  const r = Math.abs(Math.sin(seed * 91.7 + 43.2) * 12543.31) % 1;
  return min + r * (max - min);
}

/** Trừ `days` ngày từ mốc neo cố định (2026-06-01) để dữ liệu tái lập. */
function dateBefore(days: number): Date {
  const anchor = new Date('2026-06-01T00:00:00Z').getTime();
  return new Date(anchor - days * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log('🔧 Seeding EquipmentMaintenance (bảo trì thiết bị lab)...\n');

  const equipments = await prisma.labEquipment.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  });
  if (equipments.length === 0) throw new Error('Không có LabEquipment. Chạy seed lab trước.');

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < equipments.length; i++) {
    const eq = equipments[i];

    const existing = await prisma.equipmentMaintenance.count({ where: { equipmentId: eq.id } });
    if (existing > 0) { skipped++; continue; }

    const numLogs = 2 + Math.floor(pseudoRand(i + 1, 0, 3)); // 2–4 bản ghi lịch sử
    let lastDate: Date | null = null;

    for (let j = 0; j < numLogs; j++) {
      const tpl = MAINTENANCE_TEMPLATES[Math.floor(pseudoRand(i * 13 + j * 7, 0, MAINTENANCE_TEMPLATES.length))];
      // Lùi dần về quá khứ: bản ghi mới nhất gần hiện tại nhất
      const daysAgo = 30 + j * 120 + Math.floor(pseudoRand(i * 5 + j, 0, 60));
      const performedDate = dateBefore(daysAgo);
      if (!lastDate || performedDate > lastDate) lastDate = performedDate;

      await prisma.equipmentMaintenance.create({
        data: {
          equipmentId: eq.id,
          maintenanceType: tpl.type,
          performedDate,
          performedBy: 'Tổ kỹ thuật phòng thí nghiệm',
          description: tpl.description,
          cost: tpl.cost,
          findings: tpl.findings,
          actions: tpl.actions,
          partsReplaced: tpl.partsReplaced,
          status: MaintenanceStatus.COMPLETED,
        },
      });
      created++;
    }

    // 1 lịch bảo trì sắp tới (SCHEDULED) cho ~40% thiết bị
    let nextScheduled: Date | null = null;
    if (i % 5 < 2) {
      nextScheduled = dateBefore(-(30 + Math.floor(pseudoRand(i + 3, 0, 90)))); // tương lai
      await prisma.equipmentMaintenance.create({
        data: {
          equipmentId: eq.id,
          maintenanceType: MaintenanceType.ROUTINE,
          performedDate: nextScheduled,
          performedBy: null,
          description: 'Bảo dưỡng định kỳ theo kế hoạch',
          findings: null,
          actions: null,
          partsReplaced: null,
          nextScheduled,
          status: MaintenanceStatus.SCHEDULED,
        },
      });
      created++;
    }

    // Đồng bộ mốc bảo trì trên LabEquipment để dashboard hiển thị đúng.
    await prisma.labEquipment.update({
      where: { id: eq.id },
      data: {
        lastMaintenanceDate: lastDate ?? undefined,
        nextMaintenanceDate: nextScheduled ?? undefined,
      },
    });
  }

  const total = await prisma.equipmentMaintenance.count();
  console.log('===== MAINTENANCE SUMMARY =====');
  console.log(`Thiết bị xét:            ${equipments.length}`);
  console.log(`Bản ghi bảo trì tạo mới: ${created}`);
  console.log(`Bỏ qua (đã có lịch sử):  ${skipped}`);
  console.log(`--- DB TOTAL EquipmentMaintenance: ${total} ---`);
  console.log('===============================\n');
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
