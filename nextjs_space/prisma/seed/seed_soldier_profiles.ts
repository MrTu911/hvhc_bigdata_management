/**
 * Seed SoldierProfile & SoldierServiceRecord
 * Creates new Personnel records for soldiers (QNCN, CNVQP, HSQ, CHIEN_SI)
 * Run: npx tsx --require dotenv/config prisma/seed/seed_soldier_profiles.ts
 */

import { PrismaClient, SoldierCategory, SoldierServiceType, SoldierRank } from '@prisma/client';

const prisma = new PrismaClient();

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const VIET_LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const VIET_MID_NAMES = ['Văn', 'Thị', 'Đức', 'Minh', 'Quang', 'Thanh', 'Hữu', 'Ngọc', 'Xuân', 'Anh', 'Bảo', 'Công'];
const VIET_FIRST_NAMES_M = ['Hùng', 'Tuấn', 'Dũng', 'Sơn', 'Tùng', 'Hải', 'Long', 'Nam', 'Khoa', 'Bình', 'Thắng', 'Cường', 'Hiếu', 'Phúc', 'Tâm', 'Đạt', 'Lâm', 'Tiến', 'Kiên', 'Toàn'];
const VIET_FIRST_NAMES_F = ['Hương', 'Lan', 'Linh', 'Mai', 'Hoa', 'Thảo', 'Ngân', 'Trang', 'Phương', 'Hạnh', 'Nhung', 'Yến', 'Châu', 'Diễm', 'Oanh'];

function randomName(gender: 'Nam' | 'Nữ'): string {
  const last = pick(VIET_LAST_NAMES);
  const mid = pick(VIET_MID_NAMES);
  const first = gender === 'Nam' ? pick(VIET_FIRST_NAMES_M) : pick(VIET_FIRST_NAMES_F);
  return `${last} ${mid} ${first}`;
}

const SOLDIER_DATA: Array<{
  category: SoldierCategory;
  serviceType: SoldierServiceType;
  ranks: SoldierRank[];
  militaryRankStr: string;
  position: string;
  count: number;
}> = [
  {
    category: SoldierCategory.QNCN,
    serviceType: SoldierServiceType.CHUYEN_NGHIEP,
    ranks: [SoldierRank.THUONG_SI, SoldierRank.TRUNG_SI],
    militaryRankStr: 'Thượng sĩ',
    position: 'Quân nhân chuyên nghiệp',
    count: 20,
  },
  {
    category: SoldierCategory.CNVQP,
    serviceType: SoldierServiceType.HOP_DONG,
    ranks: [SoldierRank.HA_SI, SoldierRank.BINH_NHAT],
    militaryRankStr: 'Công nhân viên quốc phòng',
    position: 'Công nhân viên',
    count: 15,
  },
  {
    category: SoldierCategory.HSQ,
    serviceType: SoldierServiceType.NGHIA_VU,
    ranks: [SoldierRank.TRUNG_SI, SoldierRank.HA_SI, SoldierRank.BINH_NHAT],
    militaryRankStr: 'Hạ sĩ quan',
    position: 'Hạ sĩ quan',
    count: 20,
  },
  {
    category: SoldierCategory.CHIEN_SI,
    serviceType: SoldierServiceType.NGHIA_VU,
    ranks: [SoldierRank.BINH_NHAT, SoldierRank.BINH_NHI],
    militaryRankStr: 'Chiến sĩ',
    position: 'Chiến sĩ',
    count: 15,
  },
];

const HEALTH_CATEGORIES = ['Loại 1', 'Loại 1', 'Loại 2', 'Loại 2', 'Loại 3', 'Loại 4'];
const SERVICE_EVENT_TYPES = ['NHAP_NGU', 'PHONG_QUAN_HAM', 'DIEU_DONG', 'XUAT_NGU'];

async function main() {
  console.log('🪖 Seeding SoldierProfile data...');

  // Get units
  const units = await prisma.unit.findMany({ select: { id: true } });
  if (units.length === 0) throw new Error('No units found');

  let totalPersonnel = 0;
  let totalProfiles = 0;
  let totalRecords = 0;
  let idx = 0;

  for (const def of SOLDIER_DATA) {
    console.log(`  Creating ${def.count} ${def.category}...`);

    for (let i = 0; i < def.count; i++) {
      idx++;
      const gender = Math.random() > 0.2 ? 'Nam' : 'Nữ';
      const fullName = randomName(gender as 'Nam' | 'Nữ');
      const personnelCode = `QN${String(10000 + idx).substring(1)}`;
      const unitId = pick(units).id;
      const rank = pick(def.ranks);

      // Check duplicate personnelCode
      const existing = await prisma.personnel.findFirst({ where: { personnelCode } });
      if (existing) continue;

      const dob = randomDate(new Date('1980-01-01'), new Date('2003-12-31'));
      const enlistDate = randomDate(new Date('2010-01-01'), new Date('2024-01-01'));

      // Create personnel
      const person = await prisma.personnel.create({
        data: {
          personnelCode,
          fullName,
          gender,
          dateOfBirth: dob,
          birthPlace: pick(['Hà Nội', 'Hải Phòng', 'Nam Định', 'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Thái Bình']),
          ethnicity: 'Kinh',
          religion: 'Không',
          educationLevel: pick(['Trung học phổ thông', 'Trung cấp', 'Cao đẳng']),
          militaryRank: def.militaryRankStr,
          position: def.position,
          category: 'CONG_NHAN_VIEN',
          status: 'DANG_CONG_TAC',
          unitId,
        },
      });

      totalPersonnel++;

      // Unique soldier id
      const soldierIdNumber = `QN-${String(200000 + idx).substring(1)}`;

      const expectedDischarge = new Date(enlistDate);
      expectedDischarge.setFullYear(expectedDischarge.getFullYear() + (def.serviceType === SoldierServiceType.NGHIA_VU ? 2 : 5));

      const profile = await prisma.soldierProfile.create({
        data: {
          personnelId: person.id,
          soldierIdNumber,
          soldierCategory: def.category,
          currentRank: rank,
          serviceType: def.serviceType,
          enlistmentDate: enlistDate,
          expectedDischargeDate: expectedDischarge,
          healthCategory: pick(HEALTH_CATEGORIES),
          lastHealthCheckDate: randomDate(new Date('2024-01-01'), new Date('2025-12-31')),
        },
      });

      totalProfiles++;

      // Create 1-2 service records
      const numRecords = Math.floor(Math.random() * 2) + 1;
      for (let r = 0; r < numRecords; r++) {
        const eventType = r === 0 ? 'NHAP_NGU' : pick(['PHONG_QUAN_HAM', 'DIEU_DONG']);
        const eventDate = r === 0 ? enlistDate : randomDate(enlistDate, new Date());

        await prisma.soldierServiceRecord.create({
          data: {
            soldierProfileId: profile.id,
            eventType,
            eventDate,
            decisionNumber: `QĐ-${Math.floor(1000 + Math.random() * 9000)}/${eventDate.getFullYear()}`,
            newRank: rank,
            description: eventType === 'NHAP_NGU' ? 'Nhập ngũ thực hiện nghĩa vụ quân sự' : 'Theo yêu cầu công tác',
          },
        });
        totalRecords++;
      }
    }
  }

  console.log(`✅ Personnel created: ${totalPersonnel}`);
  console.log(`✅ SoldierProfile created: ${totalProfiles}`);
  console.log(`✅ SoldierServiceRecord created: ${totalRecords}`);
  console.log('🎉 Done!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
