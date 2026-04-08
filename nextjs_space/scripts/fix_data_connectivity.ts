import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function fixDataConnectivity() {
  console.log("=".repeat(80));
  console.log("SỬA LỖI LIÊN THÔNG DỮ LIỆU");
  console.log("=".repeat(80));
  console.log("");

  // 1. Link HocVien to Advisors
  console.log("1️⃣ GÁN GIẢNG VIÊN HƯỚNG DẪN CHO HỌC VIÊN...");
  const hocvienWithoutAdvisor = await prisma.hocVien.findMany({
    where: { giangVienHuongDanId: null }
  });

  const facultyProfiles = await prisma.facultyProfile.findMany({
    select: { id: true }
  });

  let advisorsAssigned = 0;
  for (let i = 0; i < hocvienWithoutAdvisor.length; i++) {
    if (facultyProfiles.length > 0) {
      const advisorIdx = i % facultyProfiles.length;
      await prisma.hocVien.update({
        where: { id: hocvienWithoutAdvisor[i].id },
        data: { giangVienHuongDanId: facultyProfiles[advisorIdx].id }
      });
      advisorsAssigned++;
    }
  }
  console.log("   ✅ Assigned " + advisorsAssigned + " advisors to students");
  console.log("");

  // 2. Link Users to Personnel (check unique constraint)
  console.log("2️⃣ LIÊN KẾT USER → PERSONNEL...");
  const usersWithoutPersonnel = await prisma.user.findMany({
    where: { personnelId: null },
    select: { id: true, name: true, unitId: true }
  });
  
  // Get already linked personnel IDs
  const linkedPersonnelIds = new Set(
    (await prisma.user.findMany({
      where: { personnelId: { not: null } },
      select: { personnelId: true }
    })).map(u => u.personnelId)
  );
  
  let linkedCount = 0;
  for (const user of usersWithoutPersonnel) {
    if (!user.name || !user.unitId) continue;
    
    const nameParts = user.name.trim().split(' ');
    const lastName = nameParts[nameParts.length - 1];
    
    if (lastName.length < 2) continue;
    
    // Find unlinked personnel in same unit
    const personnel = await prisma.personnel.findFirst({
      where: {
        unitId: user.unitId,
        fullName: { endsWith: lastName },
        id: { notIn: Array.from(linkedPersonnelIds) as string[] }
      },
      select: { id: true }
    });
    
    if (personnel) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { personnelId: personnel.id }
        });
        linkedPersonnelIds.add(personnel.id);
        linkedCount++;
      } catch (e) {
        // Skip if constraint error
      }
    }
  }
  console.log("   ✅ Linked " + linkedCount + " users to personnel records");
  console.log("");

  // Final verification
  console.log("=".repeat(80));
  console.log("📊 KIỂM TRA KẾT QUẢ:");
  
  const stats = {
    usersWithPersonnel: await prisma.user.count({ where: { personnelId: { not: null } } }),
    totalUsers: await prisma.user.count(),
    facultyWithDept: await prisma.facultyProfile.count({ where: { departmentId: { not: null } } }),
    totalFaculty: await prisma.facultyProfile.count(),
    unitsWithCommander: await prisma.unit.count({ where: { commanderId: { not: null } } }),
    totalUnits: await prisma.unit.count(),
    hocvienWithAdvisor: await prisma.hocVien.count({ where: { giangVienHuongDanId: { not: null } } }),
    totalHocVien: await prisma.hocVien.count()
  };

  console.log("   User → Personnel: " + stats.usersWithPersonnel + "/" + stats.totalUsers + " (" + (stats.usersWithPersonnel/stats.totalUsers*100).toFixed(1) + "%)");
  console.log("   Faculty → Department: " + stats.facultyWithDept + "/" + stats.totalFaculty + " (" + (stats.facultyWithDept/stats.totalFaculty*100).toFixed(1) + "%)");
  console.log("   Unit → Commander: " + stats.unitsWithCommander + "/" + stats.totalUnits + " (" + (stats.unitsWithCommander/stats.totalUnits*100).toFixed(1) + "%)");
  console.log("   HocVien → Advisor: " + stats.hocvienWithAdvisor + "/" + stats.totalHocVien + " (" + (stats.totalHocVien > 0 ? (stats.hocvienWithAdvisor/stats.totalHocVien*100).toFixed(1) : "0") + "%)");
  console.log("=".repeat(80));

  await prisma.$disconnect();
}

fixDataConnectivity().catch(console.error);
