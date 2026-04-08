/**
 *  HVHC Bigdata Management – SEED Units Script
 *  Author: Master Tu ⚙️
 *  Date: December 2025
 *  Description: Seed cấu trúc tổ chức các đơn vị HVHC
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface UnitData {
  name: string;
  code: string;
  type: string;
  level: number;
  parentCode?: string;
  description?: string;
}

const units: UnitData[] = [
  // Level 1: Root
  { name: "Học viện Hậu cần", code: "HVHC", type: "HVHC", level: 1, description: "Học viện Hậu cần - Bộ Quốc phòng" },
  
  // Level 2: BặN GIÁM ĐỐ́C (BGD)
  { name: "Ban Giám đốc", code: "BGD", type: "BAN", level: 2, parentCode: "HVHC", description: "Ban Giám đốc học viện" },
  
  // Level 2: PHÒNG BAN
  { name: "Phòng Đào tạo", code: "B1", type: "PHONG", level: 2, parentCode: "HVHC", description: "Phòng Đào tạo và quản lý đào tạo" },
  { name: "Phòng KHQS", code: "B2", type: "PHONG", level: 2, parentCode: "HVHC", description: "Phòng Khoa học quân sự" },
  { name: "Phòng Chính trị", code: "B3", type: "PHONG", level: 2, parentCode: "HVHC", description: "Phòng Chính trị" },
  { name: "Phòng Tổ chức", code: "B4", type: "PHONG", level: 2, parentCode: "HVHC", description: "Phòng Tổ chức cán bộ" },
  { name: "Phòng Kế hoạch - Tài chính", code: "B5", type: "PHONG", level: 2, parentCode: "HVHC", description: "Phòng Kế hoạch và Tài chính" },
  { name: "Văn phòng", code: "VP", type: "PHONG", level: 2, parentCode: "HVHC", description: "Văn phòng học viện" },
  
  // Level 2: KHOA
  { name: "Khoa Chỉ huy hậu cần", code: "K1", type: "KHOA", level: 2, parentCode: "HVHC", description: "Khoa Chỉ huy hậu cần" },
  { name: "Khoa Quân nhu", code: "K2", type: "KHOA", level: 2, parentCode: "HVHC", description: "Khoa Quân nhu" },
  { name: "Khoa Vận tải", code: "K3", type: "KHOA", level: 2, parentCode: "HVHC", description: "Khoa Vận tải quân sự" },
  { name: "Khoa Xăng dầu", code: "K4", type: "KHOA", level: 2, parentCode: "HVHC", description: "Khoa Xăng dầu quân sự" },
  { name: "Khoa Tài chính", code: "K5", type: "KHOA", level: 2, parentCode: "HVHC", description: "Khoa Tài chính quân sự" },
  { name: "Khoa Quân sự", code: "K6", type: "KHOA", level: 2, parentCode: "HVHC", description: "Khoa Quân sự chung" },
  { name: "Khoa Khoa học cơ bản", code: "K7", type: "KHOA", level: 2, parentCode: "HVHC", description: "Khoa Khoa học cơ bản" },
  { name: "Khoa Ngoại ngữ", code: "K8", type: "KHOA", level: 2, parentCode: "HVHC", description: "Khoa Ngoại ngữ" },
  
  // Level 2: BAN
  { name: "Ban Hành chính", code: "BAN1", type: "BAN", level: 2, parentCode: "VP", description: "Ban Hành chính - Văn phòng" },
  { name: "Ban CNTT", code: "BAN2", type: "BAN", level: 2, parentCode: "VP", description: "Ban Công nghệ thông tin" },
  
  // Level 2: VIỆN
  { name: "Viện Nghiên cứu KHHCQS", code: "VIEN1", type: "BAN", level: 2, parentCode: "HVHC", description: "Viện Nghiên cứu Khoa học Hậu cần Quân sự" },
  
  // Level 2: TIỂU ĐOÀN
  { name: "Tiểu đoàn 1", code: "TD1", type: "TIEUDOAN", level: 2, parentCode: "HVHC", description: "Tiểu đoàn học viên 1" },
  { name: "Tiểu đoàn 2", code: "TD2", type: "TIEUDOAN", level: 2, parentCode: "HVHC", description: "Tiểu đoàn học viên 2" },
  { name: "Tiểu đoàn 3", code: "TD3", type: "TIEUDOAN", level: 2, parentCode: "HVHC", description: "Tiểu đoàn học viên 3" },
  { name: "Tiểu đoàn 4", code: "TD4", type: "TIEUDOAN", level: 2, parentCode: "HVHC", description: "Tiểu đoàn học viên 4" },
  
  // Level 3: BỘ MÔN (under KHOA)
  { name: "Bộ môn Hậu cần chiến đấu", code: "BM_K1_1", type: "BOMON", level: 3, parentCode: "K1" },
  { name: "Bộ môn Chỉ huy tham mưu", code: "BM_K1_2", type: "BOMON", level: 3, parentCode: "K1" },
  { name: "Bộ môn Kỹ thuật", code: "BM_K2_1", type: "BOMON", level: 3, parentCode: "K2" },
  { name: "Bộ môn Bảo đảm", code: "BM_K2_2", type: "BOMON", level: 3, parentCode: "K2" },
  { name: "Bộ môn Thương phẩm", code: "BM_K2_3", type: "BOMON", level: 3, parentCode: "K2" },
  { name: "Bộ môn Chỉ huy vận tải", code: "BM_K3_1", type: "BOMON", level: 3, parentCode: "K3" },
  { name: "Bộ môn Bảo đảm", code: "BM_K4_1", type: "BOMON", level: 3, parentCode: "K4" },
  { name: "Bộ môn Kinh tế", code: "BM_K5_1", type: "BOMON", level: 3, parentCode: "K5" },
  { name: "Bộ môn Huấn luyện thể lực", code: "BM_K6_1", type: "BOMON", level: 3, parentCode: "K6" },
  { name: "Bộ môn Toán", code: "BM_K7_1", type: "BOMON", level: 3, parentCode: "K7" },
  { name: "Bộ môn Tin học", code: "BM_K7_2", type: "BOMON", level: 3, parentCode: "K7" },
  { name: "Bộ môn Anh văn", code: "BM_K8_1", type: "BOMON", level: 3, parentCode: "K8" },
  
  // Level 3: ĐẠI ĐỘI (under TIỂU ĐOÀN)
  { name: "Đại đội 1 - Tiểu đoàn 1", code: "DD_TD1_1", type: "DAIDOI", level: 3, parentCode: "TD1" },
  { name: "Đại đội 2 - Tiểu đoàn 1", code: "DD_TD1_2", type: "DAIDOI", level: 3, parentCode: "TD1" },
  { name: "Đại đội 1 - Tiểu đoàn 2", code: "DD_TD2_1", type: "DAIDOI", level: 3, parentCode: "TD2" },
  { name: "Đại đội 2 - Tiểu đoàn 2", code: "DD_TD2_2", type: "DAIDOI", level: 3, parentCode: "TD2" },
  { name: "Đại đội 13 - Tiểu đoàn 4", code: "DD_TD4_13", type: "DAIDOI", level: 3, parentCode: "TD4" },
];

async function main() {
  console.log("🚀 Bắt đầu SEED cấu trúc đơn vị HVHC...");
  
  const createdUnits = new Map<string, string>();
  let createdCount = 0;
  let skippedCount = 0;

  // Sort by level to ensure parents are created first
  const sortedUnits = [...units].sort((a, b) => a.level - b.level);

  for (const unit of sortedUnits) {
    try {
      // Find parent ID if parentCode exists
      let parentId: string | null = null;
      if (unit.parentCode) {
        parentId = createdUnits.get(unit.parentCode) || null;
        if (!parentId) {
          // Try to find parent in database
          const parent = await prisma.unit.findUnique({ where: { code: unit.parentCode } });
          if (parent) {
            parentId = parent.id;
            createdUnits.set(parent.code, parent.id);
          }
        }
      }

      // Check if unit already exists
      const existing = await prisma.unit.findUnique({ where: { code: unit.code } });
      if (existing) {
        createdUnits.set(unit.code, existing.id);
        skippedCount++;
        continue;
      }

      // Create unit
      const created = await prisma.unit.create({
        data: {
          name: unit.name,
          code: unit.code,
          type: unit.type,
          level: unit.level,
          parentId,
          description: unit.description,
          active: true,
        },
      });

      createdUnits.set(unit.code, created.id);
      createdCount++;
      console.log(`✅ Tạo đơn vị: ${unit.code} - ${unit.name}`);
    } catch (error: any) {
      console.error(`❌ Lỗi khi tạo unit ${unit.code}: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ SEED UNITS HOÀN TẤT");
  console.log("=".repeat(60));
  console.log(`📋 Tạo mới: ${createdCount}`);
  console.log(`⏭️  Bỏ qua (đã tồn tại): ${skippedCount}`);
  console.log(`📊 Tổng cộng: ${units.length}`);
  
  // Show hierarchy
  const allUnits = await prisma.unit.findMany({
    orderBy: [{ level: 'asc' }, { code: 'asc' }],
  });
  
  console.log("\n🏛️ CẤU TRÚC ĐƠN VỊ:");
  const levels = [1, 2, 3, 4];
  for (const level of levels) {
    const levelUnits = allUnits.filter(u => u.level === level);
    if (levelUnits.length > 0) {
      console.log(`\nLevel ${level}: ${levelUnits.length} đơn vị`);
      levelUnits.forEach(u => {
        const indent = '  '.repeat(level - 1);
        console.log(`${indent}• [${u.code}] ${u.name}`);
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("\n🎉 SEED UNITS COMPLETED!");
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("\n❌ SEED UNITS FAILED:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
