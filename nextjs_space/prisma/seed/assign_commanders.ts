/**
 *  HVHC Bigdata Management – Assign Commanders Script
 *  Author: Master Tu ⚙️
 *  Date: December 2025
 *  Description: Gán chỉ huy cho các đơn vị dựa trên chức vụ và quân hàm
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mapping unit codes to position keywords for commander selection
const unitCommanderRules: Record<string, string[]> = {
  // Ban Giám đốc
  "BGD": ["Giám đốc", "Chính ủy"],
  
  // Phòng ban
  "B1": ["Trưởng phòng", "Phòng Đào tạo"],
  "B2": ["Trưởng phòng", "Phòng KHQS"],
  "B3": ["Trưởng phòng", "Phòng Chính trị", "Phó Chủ nhiệm Chính trị"],
  "B4": ["Trưởng phòng", "Phòng Tổ chức"],
  "B5": ["Trưởng phòng", "Kế hoạch", "Tài chính"],
  "VP": ["Trưởng phòng", "Văn phòng", "Chủ nhiệm Văn phòng"],
  
  // Khoa
  "K1": ["Trưởng khoa", "Khoa Chỉ huy hậu cần"],
  "K2": ["Trưởng khoa", "Khoa Quân nhu"],
  "K3": ["Trưởng khoa", "Khoa Vận tải"],
  "K4": ["Trưởng khoa", "Khoa Xăng dầu"],
  "K5": ["Trưởng khoa", "Khoa Tài chính"],
  "K6": ["Trưởng khoa", "Khoa Quân sự"],
  "K7": ["Trưởng khoa", "Khoa Khoa học cơ bản"],
  "K8": ["Trưởng khoa", "Khoa Ngoại ngữ"],
  
  // Ban
  "BAN1": ["Trưởng ban", "Ban Hành chính"],
  "BAN2": ["Trưởng ban", "Ban CNTT"],
  
  // Viện
  "VIEN1": ["Viện trưởng", "Giám đốc viện", "Viện Nghiên cứu"],
  
  // Tiểu đoàn
  "TD1": ["Tiểu đoàn trưởng", "Tiểu đoàn 1"],
  "TD2": ["Tiểu đoàn trưởng", "Tiểu đoàn 2"],
  "TD3": ["Tiểu đoàn trưởng", "Tiểu đoàn 3"],
  "TD4": ["Tiểu đoàn trưởng", "Tiểu đoàn 4"],
  
  // Bộ môn
  "BM_K1_1": ["Chủ nhiệm bộ môn", "Hậu cần chiến đấu"],
  "BM_K1_2": ["Chủ nhiệm bộ môn", "Chỉ huy tham mưu"],
  "BM_K2_1": ["Chủ nhiệm bộ môn", "Kỹ thuật"],
  "BM_K2_2": ["Chủ nhiệm bộ môn", "Bảo đảm"],
  "BM_K2_3": ["Chủ nhiệm bộ môn", "Thương phẩm"],
  "BM_K3_1": ["Chủ nhiệm bộ môn", "Chỉ huy vận tải"],
  "BM_K4_1": ["Chủ nhiệm bộ môn", "Bảo đảm"],
  "BM_K5_1": ["Chủ nhiệm bộ môn", "Kinh tế"],
  "BM_K6_1": ["Chủ nhiệm bộ môn", "Huấn luyện"],
  "BM_K7_1": ["Chủ nhiệm bộ môn", "Toán"],
  "BM_K7_2": ["Chủ nhiệm bộ môn", "Tin học"],
  "BM_K8_1": ["Chủ nhiệm bộ môn", "Anh văn"],
  
  // Đại đội
  "DD_TD1_1": ["Đại đội trưởng", "Đại đội 1"],
  "DD_TD1_2": ["Đại đội trưởng", "Đại đội 2"],
  "DD_TD2_1": ["Đại đội trưởng", "Đại đội 1"],
  "DD_TD2_2": ["Đại đội trưởng", "Đại đội 2"],
  "DD_TD4_13": ["Đại đội trưởng", "Đại đội 13"],
};

const rankPriority = [
  "Trung tướng",
  "Thiếu tướng",
  "Đại tá",
  "Thượng tá",
  "Trung tá",
  "Thiếu tá",
  "Đại úy",
  "Trung úy",
  "Thiếu úy",
];

function getRankPriority(rank: string): number {
  const index = rankPriority.indexOf(rank);
  return index === -1 ? 999 : index;
}

async function findBestCommander(unitCode: string, unitId: string) {
  const keywords = unitCommanderRules[unitCode] || [];
  
  if (keywords.length === 0) {
    // Generic search for units without specific rules
    keywords.push("Trưởng", "Chủ nhiệm", "Chỉ huy");
  }

  // Build OR conditions for position matching
  const positionConditions = keywords.map(keyword => ({
    position: { contains: keyword, mode: 'insensitive' as const }
  }));

  // Find all potential commanders for this unit
  const candidates = await prisma.user.findMany({
    where: {
      unitId,
      OR: positionConditions,
    },
  });

  if (candidates.length === 0) {
    return null;
  }

  // Sort by rank priority (higher rank first)
  const sortedCandidates = candidates.sort((a, b) => {
    const aPriority = getRankPriority(a.rank || "");
    const bPriority = getRankPriority(b.rank || "");
    return aPriority - bPriority;
  });

  return sortedCandidates[0];
}

async function main() {
  console.log("🚀 Bắt đầu gán chỉ huy cho các đơn vị...");

  const units = await prisma.unit.findMany({
    orderBy: { level: 'asc' },
  });

  let assignedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;

  for (const unit of units) {
    // Skip if already has commander
    if (unit.commanderId) {
      console.log(`⏭️  ${unit.code} - ${unit.name}: Đã có chỉ huy`);
      skippedCount++;
      continue;
    }

    // Find best commander
    const commander = await findBestCommander(unit.code, unit.id);

    if (commander) {
      await prisma.unit.update({
        where: { id: unit.id },
        data: { commanderId: commander.id },
      });

      console.log(
        `✅ ${unit.code} - ${unit.name}: Gán ${commander.name} (${commander.rank}) - ${commander.position}`
      );
      assignedCount++;
    } else {
      console.log(`⚠️  ${unit.code} - ${unit.name}: Không tìm thấy chỉ huy phù hợp`);
      notFoundCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ GÁN CHỈ HUY HOÀN TẤT");
  console.log("=".repeat(60));
  console.log(`👮 Đã gán: ${assignedCount}`);
  console.log(`⏭️  Bỏ qua (đã có): ${skippedCount}`);
  console.log(`⚠️  Không tìm thấy: ${notFoundCount}`);
  console.log(`📊 Tổng cộng: ${units.length}`);

  // Final stats
  const unitsWithCommanders = await prisma.unit.count({
    where: { commanderId: { not: null } },
  });
  console.log(`\n🎯 Đơn vị có chỉ huy: ${unitsWithCommanders}/${units.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("\n🎉 ASSIGN COMMANDERS COMPLETED!");
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("\n❌ ASSIGN COMMANDERS FAILED:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
