/**
 * Seed CSDL Giảng viên - Học viên và CSDL Nghiên cứu Khoa học
 * TeachingStatistics, Lab, LabEquipment, LabSession
 */
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log("=== SEED CSDL GIẢNG VIÊN - NGHIÊN CỨU ===\n");
  
  // Get existing data
  const faculty = await prisma.facultyProfile.findMany({ include: { user: true, unit: true } });
  const terms = await prisma.term.findMany();
  const academicYears = await prisma.academicYear.findMany();
  const units = await prisma.unit.findMany({ where: { type: 'KHOA' } });
  const classSections = await prisma.classSection.findMany({ take: 10 });
  
  console.log(`Found: ${faculty.length} faculty, ${terms.length} terms, ${academicYears.length} academic years`);
  console.log(`Found: ${units.length} khoa units, ${classSections.length} class sections`);
  
  if (faculty.length === 0 || terms.length === 0) {
    console.log("ERROR: Missing prerequisite data (faculty, terms)");
    return;
  }
  
  // 1. Seed TeachingStatistics
  console.log("\n1. Creating TeachingStatistics...");
  let statsCount = 0;
  
  for (const f of faculty) {
    for (const term of terms) {
      const totalCourses = 2 + Math.floor(Math.random() * 4);
      const totalSessions = totalCourses * 15;
      const totalStudents = 25 * totalCourses + Math.floor(Math.random() * 50);
      
      try {
        await prisma.teachingStatistics.create({
          data: {
            facultyId: f.id,
            termId: term.id,
            academicYearId: academicYears[0]?.id,
            totalCourses: totalCourses,
            totalSessions: totalSessions,
            totalStudents: totalStudents,
            avgAttendanceRate: 85 + Math.random() * 15,
            avgPassRate: 80 + Math.random() * 18,
            avgGrade: 6.5 + Math.random() * 2,
            totalHours: totalSessions * 3,
            evaluationScore: 3.5 + Math.random() * 1.5,
            evaluationCount: Math.floor(Math.random() * totalStudents * 0.7),
            notes: `Thống kê giảng dạy ${term.name}`,
          },
        });
        statsCount++;
      } catch (e) {
        // Skip if already exists (unique constraint)
      }
    }
  }
  console.log(`  Created ${statsCount} teaching statistics records`);
  
  // 2. Seed Lab (Phòng thí nghiệm)
  console.log("\n2. Creating Labs...");
  const labTypes = [
    { name: 'PTN Mạng máy tính', type: 'COMPUTER', capacity: 40, building: 'A', floor: 2 },
    { name: 'PTN Lập trình', type: 'COMPUTER', capacity: 35, building: 'A', floor: 3 },
    { name: 'PTN Điện tử số', type: 'ELECTRONICS', capacity: 25, building: 'B', floor: 1 },
    { name: 'PTN Vật lý đại cương', type: 'PHYSICS', capacity: 30, building: 'B', floor: 2 },
    { name: 'PTN Hóa học', type: 'CHEMISTRY', capacity: 25, building: 'C', floor: 1 },
    { name: 'PTN Ngoại ngữ', type: 'LANGUAGE', capacity: 35, building: 'D', floor: 1 },
    { name: 'PTN Mô phỏng chiến thuật', type: 'SIMULATION', capacity: 20, building: 'E', floor: 2 },
    { name: 'PTN Cơ khí chính xác', type: 'MECHANICAL', capacity: 20, building: 'C', floor: 2 },
  ];
  
  const labs = [];
  for (let i = 0; i < labTypes.length; i++) {
    const labInfo = labTypes[i];
    const unit = units[i % units.length];
    const manager = faculty[i % faculty.length];
    
    const lab = await prisma.lab.create({
      data: {
        code: `PTN-${labInfo.type.substring(0, 3)}-${String(i + 1).padStart(2, '0')}`,
        name: labInfo.name,
        labType: labInfo.type as any,
        building: `Tòa nhà ${labInfo.building}`,
        floor: labInfo.floor,
        roomNumber: `${labInfo.floor}0${i + 1}`,
        capacity: labInfo.capacity,
        area: labInfo.capacity * 2.5,
        unitId: unit?.id,
        managerId: manager.userId,
        description: `Phòng thí nghiệm chuyên dụng cho ${labInfo.type.toLowerCase()}`,
        regulations: 'Tuân thủ quy định an toàn phòng thí nghiệm. Mặc áo bảo hộ khi vào phòng.',
        equipment: 'Máy tính, máy chiếu, thiết bị chuyên dụng',
        status: 'AVAILABLE',
        isActive: true,
      },
    });
    labs.push(lab);
  }
  console.log(`  Created ${labs.length} labs`);
  
  // 3. Seed LabEquipment
  console.log("\n3. Creating LabEquipment...");
  const equipmentStatuses = ['OPERATIONAL', 'OPERATIONAL', 'OPERATIONAL', 'UNDER_REPAIR', 'OUT_OF_SERVICE'];
  const conditions = ['EXCELLENT', 'GOOD', 'GOOD', 'FAIR', 'POOR'];
  const equipmentTypes = ['COMPUTER', 'PROJECTOR', 'PRINTER', 'MEASURING', 'LAB_INSTRUMENT', 'NETWORK'];
  let equipmentCount = 0;
  
  for (const lab of labs) {
    for (let e = 0; e < 6; e++) {
      await prisma.labEquipment.create({
        data: {
          code: `TB-${lab.code}-${String(e + 1).padStart(2, '0')}`,
          name: `Thiết bị ${['Máy tính', 'Máy chiếu', 'Máy in', 'Máy đo', 'Dụng cụ TN', 'Thiết bị mạng'][e % 6]}`,
          labId: lab.id,
          equipmentType: equipmentTypes[e % 6] as any,
          brand: ['Dell', 'HP', 'Samsung', 'Sony', 'Lenovo', 'Canon'][e % 6],
          model: `Model-202${e}`,
          serialNumber: `SN${Date.now()}${e}${lab.id.substring(0, 4)}`,
          purchaseDate: new Date(2020 + (e % 5), e % 12, 1),
          warrantyExpiry: new Date(2025 + (e % 3), e % 12, 1),
          purchasePrice: 5000000 + e * 2000000,
          currentValue: 4000000 + e * 1500000,
          specifications: { cpu: 'Intel i7', ram: '16GB', storage: '512GB SSD' },
          location: `Vị trí ${e + 1}`,
          status: equipmentStatuses[e % 5] as any,
          condition: conditions[e % 5] as any,
          lastMaintenanceDate: new Date(2025, 6, 15),
          nextMaintenanceDate: new Date(2026, 6, 15),
          maintenanceNotes: 'Bảo trì định kỳ theo lịch',
          isActive: true,
        },
      });
      equipmentCount++;
    }
  }
  console.log(`  Created ${equipmentCount} lab equipment items`);
  
  // 4. Seed LabSession (Buổi thực hành)
  console.log("\n4. Creating LabSessions...");
  let sessionCount = 0;
  
  for (const lab of labs) {
    const instructor = faculty[sessionCount % faculty.length];
    const section = classSections[sessionCount % classSections.length];
    
    for (let w = 1; w <= 10; w++) {
      const sessionDate = new Date('2025-09-01');
      sessionDate.setDate(sessionDate.getDate() + (w - 1) * 7);
      
      await prisma.labSession.create({
        data: {
          code: `TH-${lab.code}-${String(w).padStart(2, '0')}`,
          labId: lab.id,
          classSectionId: section?.id,
          sessionDate: sessionDate,
          startTime: w % 2 === 1 ? '07:00' : '13:30',
          endTime: w % 2 === 1 ? '09:30' : '16:00',
          topic: `Buổi thực hành ${w}: Nội dung chương ${Math.ceil(w / 2)}`,
          description: `Thực hành các bài tập và thí nghiệm tuần ${w}`,
          supervisorId: instructor.userId,
          maxStudents: lab.capacity,
          registeredCount: Math.floor(lab.capacity * (0.6 + Math.random() * 0.3)),
          status: w <= 5 ? 'COMPLETED' : w <= 8 ? 'SCHEDULED' : 'CANCELLED',
          notes: `Ghi chú buổi thực hành ${w}`,
        },
      });
      sessionCount++;
    }
  }
  console.log(`  Created ${sessionCount} lab sessions`);
  
  console.log("\n=== HOÀN TẤT SEED CSDL GIẢNG VIÊN - NGHIÊN CỨU ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
