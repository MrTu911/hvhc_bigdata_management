/**
 * SEED EDUCATION DATA - Dữ liệu mẫu giáo dục đào tạo
 */

import 'dotenv/config';
import { PrismaClient, ProgramType, RoomType, CourseType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding education data...');

  // Lấy danh sách units (khoa/phòng)
  const units = await prisma.unit.findMany({
    where: { type: { in: ['FACULTY', 'DEPARTMENT', 'KHOA', 'PHONG'] } },
  });
  console.log(`Found ${units.length} units`);

  if (units.length === 0) {
    console.log('⚠️ No units found. Please seed units first.');
    return;
  }

  // 1. Tạo năm học và học kỳ
  console.log('\n📅 Creating academic years and terms...');
  
  const academicYears = [
    { code: 'NH2024-2025', name: 'Năm học 2024-2025', startDate: new Date('2024-08-15'), endDate: new Date('2025-07-31'), isCurrent: false },
    { code: 'NH2025-2026', name: 'Năm học 2025-2026', startDate: new Date('2025-08-15'), endDate: new Date('2026-07-31'), isCurrent: true },
  ];

  for (const ay of academicYears) {
    const existing = await prisma.academicYear.findUnique({ where: { code: ay.code } });
    if (existing) {
      console.log(`  ⏩ Academic year ${ay.code} exists`);
      continue;
    }
    await prisma.academicYear.create({ data: ay });
    console.log(`  ✅ Created academic year: ${ay.name}`);
  }

  // Lấy năm học hiện tại
  const currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
  if (!currentYear) {
    console.log('⚠️ No current academic year found');
    return;
  }

  // Tạo học kỳ
  const termsData = [
    { code: 'HK1-2025', name: 'Học kỳ 1', termNumber: 1, startDate: new Date('2025-08-15'), endDate: new Date('2025-12-31'), isCurrent: true },
    { code: 'HK2-2025', name: 'Học kỳ 2', termNumber: 2, startDate: new Date('2026-01-15'), endDate: new Date('2026-06-30'), isCurrent: false },
  ];

  for (const term of termsData) {
    const existing = await prisma.term.findUnique({ where: { code: term.code } });
    if (existing) {
      console.log(`  ⏩ Term ${term.code} exists`);
      continue;
    }
    await prisma.term.create({
      data: { ...term, academicYearId: currentYear.id },
    });
    console.log(`  ✅ Created term: ${term.name}`);
  }

  // 2. Tạo chương trình đào tạo
  console.log('\n📚 Creating training programs...');

  const programs: Array<{ code: string; name: string; programType: ProgramType; totalCredits: number; durationYears: number; description: string }> = [
    { code: 'CNTT-DH', name: 'Công nghệ thông tin - Đại học', programType: ProgramType.UNDERGRADUATE, totalCredits: 135, durationYears: 4, description: 'Chương trình đào tạo kỹ sư CNTT' },
    { code: 'QTKD-DH', name: 'Quản trị kinh doanh - Đại học', programType: ProgramType.UNDERGRADUATE, totalCredits: 130, durationYears: 4, description: 'Chương trình cử nhân QTKD' },
    { code: 'LLCT-DH', name: 'Lý luận chính trị - Đại học', programType: ProgramType.UNDERGRADUATE, totalCredits: 125, durationYears: 4, description: 'Chương trình cử nhân LLCT' },
    { code: 'NN-DH', name: 'Ngôn ngữ Anh - Đại học', programType: ProgramType.UNDERGRADUATE, totalCredits: 130, durationYears: 4, description: 'Chương trình cử nhân Ngôn ngữ Anh' },
    { code: 'CNTT-ThS', name: 'Công nghệ thông tin - Thạc sĩ', programType: ProgramType.GRADUATE, totalCredits: 60, durationYears: 2, description: 'Chương trình Thạc sĩ CNTT' },
    { code: 'QTKD-ThS', name: 'Quản trị kinh doanh - Thạc sĩ', programType: ProgramType.GRADUATE, totalCredits: 60, durationYears: 2, description: 'Chương trình Thạc sĩ QTKD' },
    { code: 'BD-CHQ', name: 'Bồi dưỡng chỉ huy quân sự', programType: ProgramType.SHORT_COURSE, totalCredits: 30, durationYears: 1, description: 'Chương trình bồi dưỡng chỉ huy' },
    { code: 'BD-NVQS', name: 'Bồi dưỡng nghiệp vụ quân sự', programType: ProgramType.SHORT_COURSE, totalCredits: 20, durationYears: 1, description: 'Chương trình bồi dưỡng nghiệp vụ' },
  ];

  for (const prog of programs) {
    const existing = await prisma.program.findUnique({ where: { code: prog.code } });
    if (existing) {
      console.log(`  ⏩ Program ${prog.code} exists`);
      continue;
    }
    await prisma.program.create({
      data: { ...prog, status: 'ACTIVE', isActive: true },
    });
    console.log(`  ✅ Created program: ${prog.name}`);
  }

  // 3. Tạo khung chương trình đào tạo
  console.log('\n📋 Creating curriculum plans...');

  const programList = await prisma.program.findMany({ where: { isActive: true } });
  
  for (const program of programList) {
    const existing = await prisma.curriculumPlan.findFirst({
      where: { programId: program.id }
    });
    if (existing) {
      console.log(`  ⏩ Curriculum for ${program.code} exists`);
      continue;
    }

    await prisma.curriculumPlan.create({
      data: {
        code: `KC-${program.code}`,
        name: `Khung CTĐT ${program.name}`,
        programId: program.id,
        academicYearId: currentYear.id,
        version: '1.0',
        totalCredits: program.totalCredits,
        status: 'ACTIVE',
        isActive: true,
      },
    });
    console.log(`  ✅ Created curriculum plan: KC-${program.code}`);
  }

  // 4. Tạo môn học (CurriculumCourse) - gắn vào khung CTĐT của chương trình CNTT
  console.log('\n📖 Creating curriculum courses...');

  // Lấy curriculum plan của chương trình CNTT
  const cnttPlan = await prisma.curriculumPlan.findFirst({
    where: { code: 'KC-CNTT-DH' }
  });

  if (!cnttPlan) {
    console.log('  ⚠️ No curriculum plan found for CNTT-DH');
  } else {
    const courses = [
      { subjectCode: 'CNTT101', subjectName: 'Tin học đại cương', credits: 3, courseType: 'REQUIRED', semester: 1 },
      { subjectCode: 'CNTT201', subjectName: 'Lập trình cơ bản', credits: 4, courseType: 'REQUIRED', semester: 2 },
      { subjectCode: 'CNTT202', subjectName: 'Cấu trúc dữ liệu và giải thuật', credits: 4, courseType: 'REQUIRED', semester: 3 },
      { subjectCode: 'CNTT301', subjectName: 'Cơ sở dữ liệu', credits: 3, courseType: 'REQUIRED', semester: 4 },
      { subjectCode: 'CNTT302', subjectName: 'Mạng máy tính', credits: 3, courseType: 'REQUIRED', semester: 4 },
      { subjectCode: 'CNTT401', subjectName: 'Phát triển ứng dụng web', credits: 4, courseType: 'ELECTIVE', semester: 5 },
      { subjectCode: 'CNTT402', subjectName: 'Trí tuệ nhân tạo', credits: 3, courseType: 'ELECTIVE', semester: 6 },
      { subjectCode: 'CNTT403', subjectName: 'An toàn thông tin', credits: 3, courseType: 'REQUIRED', semester: 6 },
      { subjectCode: 'KHCB101', subjectName: 'Toán cao cấp', credits: 4, courseType: 'REQUIRED', semester: 1 },
      { subjectCode: 'KHCB102', subjectName: 'Vật lý đại cương', credits: 3, courseType: 'REQUIRED', semester: 2 },
      { subjectCode: 'KHCB201', subjectName: 'Xác suất thống kê', credits: 3, courseType: 'REQUIRED', semester: 3 },
      { subjectCode: 'NN101', subjectName: 'Tiếng Anh cơ bản 1', credits: 3, courseType: 'REQUIRED', semester: 1 },
      { subjectCode: 'NN102', subjectName: 'Tiếng Anh cơ bản 2', credits: 3, courseType: 'REQUIRED', semester: 2 },
      { subjectCode: 'LLCT101', subjectName: 'Triết học Mác-Lênin', credits: 3, courseType: 'REQUIRED', semester: 1 },
      { subjectCode: 'LLCT102', subjectName: 'Kinh tế chính trị Mác-Lênin', credits: 2, courseType: 'REQUIRED', semester: 2 },
    ];

    for (const course of courses) {
      const existing = await prisma.curriculumCourse.findFirst({
        where: { curriculumPlanId: cnttPlan.id, subjectCode: course.subjectCode }
      });
      if (existing) {
        console.log(`  ⏩ Course ${course.subjectCode} exists`);
        continue;
      }

      await prisma.curriculumCourse.create({
        data: {
          curriculumPlanId: cnttPlan.id,
          subjectCode: course.subjectCode,
          subjectName: course.subjectName,
          credits: course.credits,
          courseType: course.courseType as any,
          semester: course.semester,
          description: `Môn học ${course.subjectName}`,
          isActive: true,
        },
      });
      console.log(`  ✅ Created course: ${course.subjectCode} - ${course.subjectName}`);
    }
  }

  // 5. Tạo phòng học
  console.log('\n🏢 Creating rooms...');

  // RoomType enum: THEORY, LAB, COMPUTER, LANGUAGE, LIBRARY, SEMINAR, WORKSHOP
  const roomsData: Array<{ code: string; name: string; capacity: number; building: string; floor: number; roomType: RoomType }> = [
    { code: 'P101', name: 'Phòng học lý thuyết 101', capacity: 60, building: 'Nhà A1', floor: 1, roomType: RoomType.THEORY },
    { code: 'P102', name: 'Phòng học lý thuyết 102', capacity: 50, building: 'Nhà A1', floor: 1, roomType: RoomType.THEORY },
    { code: 'P103', name: 'Phòng học lý thuyết 103', capacity: 40, building: 'Nhà A1', floor: 1, roomType: RoomType.THEORY },
    { code: 'P201', name: 'Phòng hội thảo 201', capacity: 80, building: 'Nhà A1', floor: 2, roomType: RoomType.SEMINAR },
    { code: 'P202', name: 'Phòng học lý thuyết 202', capacity: 60, building: 'Nhà A1', floor: 2, roomType: RoomType.THEORY },
    { code: 'TH01', name: 'Phòng máy tính 01', capacity: 40, building: 'Nhà B1', floor: 1, roomType: RoomType.COMPUTER },
    { code: 'TH02', name: 'Phòng máy tính 02', capacity: 40, building: 'Nhà B1', floor: 1, roomType: RoomType.COMPUTER },
    { code: 'TH03', name: 'Phòng máy tính 03', capacity: 35, building: 'Nhà B1', floor: 2, roomType: RoomType.COMPUTER },
    { code: 'NN01', name: 'Phòng học ngoại ngữ 01', capacity: 30, building: 'Nhà A2', floor: 1, roomType: RoomType.LANGUAGE },
    { code: 'NN02', name: 'Phòng học ngoại ngữ 02', capacity: 30, building: 'Nhà A2', floor: 1, roomType: RoomType.LANGUAGE },
    { code: 'TN01', name: 'Phòng thí nghiệm Vật lý', capacity: 30, building: 'Nhà B2', floor: 1, roomType: RoomType.LAB },
    { code: 'TN02', name: 'Phòng thí nghiệm Điện tử', capacity: 25, building: 'Nhà B2', floor: 2, roomType: RoomType.LAB },
    { code: 'TV01', name: 'Thư viện số', capacity: 100, building: 'Nhà C', floor: 1, roomType: RoomType.LIBRARY },
    { code: 'WS01', name: 'Xưởng thực hành CNTT', capacity: 40, building: 'Nhà B2', floor: 3, roomType: RoomType.WORKSHOP },
  ];

  for (const room of roomsData) {
    const existing = await prisma.room.findUnique({ where: { code: room.code } });
    if (existing) {
      console.log(`  ⏩ Room ${room.code} exists`);
      continue;
    }

    await prisma.room.create({
      data: { ...room, isActive: true },
    });
    console.log(`  ✅ Created room: ${room.code} - ${room.name}`);
  }

  // 6. Tạo hệ số môn học
  console.log('\n📊 Creating course coefficients...');

  const courseList = await prisma.curriculumCourse.findMany({ where: { isActive: true } });
  
  for (const course of courseList) {
    const existing = await prisma.heSoMonHoc.findFirst({ where: { maMon: course.subjectCode } });
    if (existing) {
      console.log(`  ⏩ Coefficient for ${course.subjectCode} exists`);
      continue;
    }

    // Hệ số điểm khác nhau theo loại môn (tổng = 1.0)
    let heSo = { cc: 0.1, gk: 0.2, bt: 0.2, thi: 0.5 };
    if (course.subjectCode.includes('TH') || course.subjectCode.includes('CNTT4')) {
      heSo = { cc: 0.1, gk: 0.2, bt: 0.3, thi: 0.4 }; // Môn thực hành
    }

    await prisma.heSoMonHoc.create({
      data: {
        maMon: course.subjectCode,
        tenMon: course.subjectName,
        soTinChi: course.credits,
        heSoChuyenCan: heSo.cc,
        heSoGiuaKy: heSo.gk,
        heSoBaiTap: heSo.bt,
        heSoThi: heSo.thi,
        khoa: '',
        moTa: `Hệ số điểm môn ${course.subjectName}`,
      },
    });
    console.log(`  ✅ Created coefficient: ${course.subjectCode}`);
  }

  console.log('\n✅ Education seed completed!');

  // Tổng kết
  const counts = {
    academicYears: await prisma.academicYear.count(),
    terms: await prisma.term.count(),
    programs: await prisma.program.count(),
    curriculumPlans: await prisma.curriculumPlan.count(),
    courses: await prisma.curriculumCourse.count(),
    rooms: await prisma.room.count(),
    coefficients: await prisma.heSoMonHoc.count(),
  };
  console.log('\n📊 Summary:');
  console.log(`  - Academic Years: ${counts.academicYears}`);
  console.log(`  - Terms: ${counts.terms}`);
  console.log(`  - Programs: ${counts.programs}`);
  console.log(`  - Curriculum Plans: ${counts.curriculumPlans}`);
  console.log(`  - Courses: ${counts.courses}`);
  console.log(`  - Rooms: ${counts.rooms}`);
  console.log(`  - Coefficients: ${counts.coefficients}`);
}

main()
  .catch((e) => {
    console.error('\n❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
