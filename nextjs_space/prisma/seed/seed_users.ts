/**
 *  HVHC Bigdata Management – Full SEED Script
 *  Author: Master Tu ⚙️
 *  Date: December 2025
 *  Description: Sinh tài khoản cán bộ, giảng viên, nghiên cứu viên, QNCN, học viên
 *               và gán chỉ huy cho từng đơn vị.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

interface Personnel {
  name: string;
  rank: string;
  position: string;
  unit: string;
  unit_code: string;
  role: string;
  personnel_type: string;
}

const PASSWORD_DEFAULT = "Hv@2025";

/**
 * Chuyển đổi tên tiếng Việt thành slug email
 * Ví dụ: "Nguyễn Văn A" -> "nguyen.van.a"
 */
function vietnameseToSlug(str: string): string {
  // Remove extra spaces
  str = str.trim().toLowerCase();
  
  // Convert Vietnamese characters to ASCII
  const from = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ";
  const to   = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd";
  
  for (let i = 0; i < from.length; i++) {
    str = str.replace(new RegExp(from[i], 'g'), to[i]);
  }
  
  // Remove special characters and replace spaces with dots
  str = str
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '.')
    .replace(/\.+/g, '.');
  
  return str;
}

/**
 * Tạo employee ID duy nhất
 */
function generateEmployeeId(unitCode: string, index: number, prefix: string = "CB"): string {
  const cleanCode = unitCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const paddedIndex = String(index + 1).padStart(3, '0');
  return `${prefix}${cleanCode}${paddedIndex}`;
}

/**
 * Tạo email duy nhất (xử lý trùng lặp)
 */
function generateUniqueEmail(name: string, existingEmails: Set<string>): string {
  let baseEmail = vietnameseToSlug(name);
  let email = `${baseEmail}@hvhc.edu.vn`;
  let counter = 1;
  
  while (existingEmails.has(email)) {
    email = `${baseEmail}${counter}@hvhc.edu.vn`;
    counter++;
  }
  
  existingEmails.add(email);
  return email;
}

async function main() {
  console.log("🚀 Bắt đầu SEED dữ liệu HVHC...");
  
  // 1. Kiểm tra đơn vị gốc HVHC
  const hvhc = await prisma.unit.findFirst({ where: { code: "HVHC" } });
  if (!hvhc) {
    throw new Error("❌ Không tìm thấy đơn vị gốc HVHC trong bảng Unit. Vui lòng chạy seed units trước!");
  }

  // 2. Đọc danh sách sĩ quan từ JSON
  const jsonPath = path.join(__dirname, "..", "hvhc_personnel.json");
  const raw: Personnel[] = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  
  console.log(`📄 Đọc thành công ${raw.length} bản ghi từ hvhc_personnel.json`);

  // 3. Lấy danh sách units hiện có
  const units = await prisma.unit.findMany();
  const unitMap = new Map<string, string>();
  units.forEach(u => unitMap.set(u.code, u.id));
  
  console.log(`🏢 Tìm thấy ${units.length} đơn vị trong database`);

  // 4. Seed users
  const existingEmails = new Set<string>();
  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const [i, p] of raw.entries()) {
    try {
      // Hash password
      const passHash = await bcrypt.hash(PASSWORD_DEFAULT, 10);
      
      // Generate unique email
      const email = generateUniqueEmail(p.name, existingEmails);
      
      // Generate employee ID
      const employeeId = generateEmployeeId(p.unit_code, i);
      
      // Find unit ID
      let unitId = unitMap.get(p.unit_code);
      if (!unitId) {
        // Fallback to HVHC if unit not found
        unitId = hvhc.id;
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        skippedCount++;
        continue;
      }

      // Create user
      await prisma.user.create({
        data: {
          name: p.name.trim(),
          email,
          password: passHash,
          rank: p.rank.trim(),
          position: p.position.trim(),
          role: p.role as any,
          personnelType: p.personnel_type as any,
          employeeId,
          unitId,
          startDate: new Date("2020-01-01"),
          status: "ACTIVE",
        },
      });

      createdCount++;

      // Progress indicator
      if ((i + 1) % 20 === 0) {
        console.log(`✅ Đã xử lý ${i + 1}/${raw.length} bản ghi (Created: ${createdCount}, Skipped: ${skippedCount})`);
      }
    } catch (error: any) {
      errorCount++;
      console.error(`❌ Lỗi khi tạo user ${p.name}: ${error.message}`);
    }
  }

  console.log("\n📊 KẾT QUẢ SEED USERS:");
  console.log(`   ✅ Tạo mới: ${createdCount}`);
  console.log(`   ⏭️  Bỏ qua (đã tồn tại): ${skippedCount}`);
  console.log(`   ❌ Lỗi: ${errorCount}`);
  console.log(`   📋 Tổng cộng: ${raw.length}`);

  // 5. Gán chỉ huy cho các đơn vị
  console.log("\n🏁 Tiến hành gán chỉ huy cho các đơn vị...");
  
  let assignedCount = 0;
  const refreshedUnits = await prisma.unit.findMany();
  
  for (const u of refreshedUnits) {
    // Skip if already has commander
    if (u.commanderId) {
      continue;
    }

    // Find suitable commander for this unit
    const commander = await prisma.user.findFirst({
      where: {
        unitId: u.id,
        OR: [
          { position: { contains: "Trưởng" } },
          { position: { contains: "Chủ nhiệm" } },
          { position: { contains: "Giám đốc" } },
          { position: { contains: "Chính ủy" } },
          { position: { contains: "Tiểu đoàn trưởng" } },
        ],
      },
      orderBy: [
        { rank: 'desc' },
        { createdAt: 'asc' },
      ],
    });
    
    if (commander) {
      await prisma.unit.update({
        where: { id: u.id },
        data: { commanderId: commander.id },
      });
      
      assignedCount++;
      console.log(`👮 Đã gán chỉ huy ${commander.name} (${commander.rank}) → ${u.name} (${u.code})`);
    }
  }

  console.log(`\n📊 KẾT QUẢ GÁN CHỈ HUY: ${assignedCount}/${refreshedUnits.length} đơn vị`);

  // 6. Thống kê cuối cùng
  console.log("\n" + "=".repeat(60));
  console.log("✅ SEED HOÀN TẤT - THỐNG KÊ TỔNG THỂ");
  console.log("=".repeat(60));
  
  const totalUsers = await prisma.user.count();
  const totalUnits = await prisma.unit.count();
  const unitsWithCommanders = await prisma.unit.count({ where: { commanderId: { not: null } } });
  
  console.log(`👥 Tổng số users: ${totalUsers}`);
  console.log(`🏢 Tổng số đơn vị: ${totalUnits}`);
  console.log(`👮 Đơn vị có chỉ huy: ${unitsWithCommanders}`);
  
  // Role distribution
  console.log("\n📊 PHÂN BỐ VAI TRÒ:");
  const roleStats = await prisma.user.groupBy({
    by: ['role'],
    _count: { role: true },
    orderBy: { _count: { role: 'desc' } },
  });
  
  for (const stat of roleStats) {
    console.log(`   ${stat.role}: ${stat._count.role}`);
  }
  
  // Personnel type distribution
  console.log("\n📊 PHÂN BỐ LOẠI NHÂN SỰ:");
  const typeStats = await prisma.user.groupBy({
    by: ['personnelType'],
    _count: { personnelType: true },
    orderBy: { _count: { personnelType: 'desc' } },
  });
  
  for (const stat of typeStats) {
    console.log(`   ${stat.personnelType}: ${stat._count.personnelType}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 SEED SCRIPT COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("\n📝 Thông tin đăng nhập:");
  console.log(`   Email: <tên.sĩ.quan>@hvhc.edu.vn`);
  console.log(`   Password: ${PASSWORD_DEFAULT}`);
  console.log("\n💡 Ví dụ:");
  console.log(`   Email: phan.tung.son@hvhc.edu.vn`);
  console.log(`   Password: ${PASSWORD_DEFAULT}`);
  console.log("\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("\n❌ SEED FAILED:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
