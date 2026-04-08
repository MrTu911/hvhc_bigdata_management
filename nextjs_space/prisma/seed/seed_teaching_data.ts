/**
 * Seed Script: Teaching Data
 *
 * Luồng dữ liệu chuẩn theo schema hiện tại:
 * FacultyProfile
 *   -> TeachingSubject
 *   -> Course
 *   -> AcademicYear
 *   -> Term
 *   -> ClassSection
 *   -> TrainingSession
 */

import { PrismaClient, UserRole } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

type SubjectTemplate = {
  code: string;
  name: string;
  credits: number;
  type: 'LY_THUYET' | 'THUC_HANH';
  category: 'QUAN_SU' | 'KY_THUAT' | 'LY_LUAN' | 'HAU_CAN';
};

const SUBJECT_TEMPLATES: SubjectTemplate[] = [
  { code: 'CT101', name: 'Cơ sở chiến thuật', credits: 3, type: 'LY_THUYET', category: 'QUAN_SU' },
  { code: 'CT102', name: 'Chiến thuật bộ binh', credits: 4, type: 'THUC_HANH', category: 'QUAN_SU' },
  { code: 'TH201', name: 'Tin học quân sự', credits: 3, type: 'LY_THUYET', category: 'KY_THUAT' },
  { code: 'TH202', name: 'Lập trình ứng dụng', credits: 3, type: 'THUC_HANH', category: 'KY_THUAT' },
  { code: 'VK301', name: 'Vũ khí bộ binh', credits: 3, type: 'THUC_HANH', category: 'QUAN_SU' },
  { code: 'HC401', name: 'Hậu cần chiến đấu', credits: 2, type: 'LY_THUYET', category: 'HAU_CAN' },
  { code: 'AT501', name: 'An toàn thông tin', credits: 3, type: 'LY_THUYET', category: 'KY_THUAT' },
  { code: 'QL601', name: 'Quản lý đơn vị', credits: 2, type: 'LY_THUYET', category: 'QUAN_SU' },
  { code: 'CH701', name: 'Chỉ huy tham mưu', credits: 4, type: 'LY_THUYET', category: 'QUAN_SU' },
  { code: 'TC801', name: 'Thể chất quân sự', credits: 2, type: 'THUC_HANH', category: 'QUAN_SU' },
  { code: 'LL901', name: 'Lý luận Mác-Lênin', credits: 3, type: 'LY_THUYET', category: 'LY_LUAN' },
  { code: 'QP001', name: 'Giáo dục quốc phòng', credits: 2, type: 'LY_THUYET', category: 'QUAN_SU' },
  { code: 'KT101', name: 'Kỹ thuật quân sự', credits: 3, type: 'THUC_HANH', category: 'KY_THUAT' },
  { code: 'DT201', name: 'Điện tử viễn thông', credits: 3, type: 'LY_THUYET', category: 'KY_THUAT' },
  { code: 'YT301', name: 'Y học quân sự', credits: 2, type: 'LY_THUYET', category: 'HAU_CAN' },
];

const SESSION_TIME_SLOTS = [
  { start: '07:00', end: '09:30' },
  { start: '09:45', end: '11:15' },
  { start: '13:30', end: '15:00' },
  { start: '15:15', end: '16:45' },
] as const;

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

function getSubjectCountByRole(role?: UserRole | null): number {
  switch (role) {
    case 'GIANG_VIEN':
      return 4;
    case 'NGHIEN_CUU_VIEN':
      return 2;
    case 'CHI_HUY_KHOA_PHONG':
    case 'CHI_HUY_BO_MON':
    case 'CHU_NHIEM_BO_MON':
      return 3;
    default:
      return 2;
  }
}

function buildSubjectDescription(template: SubjectTemplate): string {
  return `Môn ${template.type === 'LY_THUYET' ? 'lý thuyết' : 'thực hành'} thuộc nhóm ${template.category.toLowerCase()}.`;
}

function selectTemplatesForFaculty(seed: number, role?: UserRole | null): SubjectTemplate[] {
  const count = getSubjectCountByRole(role);
  const selected: SubjectTemplate[] = [];
  const usedCodes = new Set<string>();

  let offset = 0;
  while (selected.length < count && offset < SUBJECT_TEMPLATES.length * 2) {
    const template = SUBJECT_TEMPLATES[(seed + offset) % SUBJECT_TEMPLATES.length];
    if (!usedCodes.has(template.code)) {
      selected.push(template);
      usedCodes.add(template.code);
    }
    offset++;
  }

  return selected;
}

function inferDepartmentIdFromFaculty(faculty: {
  user: { unit?: string | null; department?: string | null };
  unit?: { id: string; code: string; name: string } | null;
}): string | null {
  return faculty.unit?.id ?? null;
}

function makeCourseCode(subjectCode: string, facultyIndex: number): string {
  return `${subjectCode}-${String(facultyIndex + 1).padStart(2, '0')}`;
}

function makeClassSectionCode(courseCode: string, sectionNo: number, year: string): string {
  return `${courseCode}-L${sectionNo}-${year}`;
}

async function ensureAcademicYear() {
  const existingCurrent = await prisma.academicYear.findFirst({
    where: { isCurrent: true },
  });

  if (existingCurrent) {
    console.log(`✅ Current academic year exists: ${existingCurrent.code}`);
    return existingCurrent;
  }

  const code = '2025-2026';
  const existing = await prisma.academicYear.findUnique({
    where: { code },
  });

  if (existing) {
    const updated = await prisma.academicYear.update({
      where: { code },
      data: {
        isCurrent: true,
        isActive: true,
      },
    });
    console.log(`♻️ Updated academic year: ${updated.code}`);
    return updated;
  }

  const created = await prisma.academicYear.create({
    data: {
      code: '2025-2026',
      name: 'Năm học 2025-2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
      isCurrent: true,
      isActive: true,
    },
  });

  console.log(`✅ Created academic year: ${created.code}`);
  return created;
}

async function ensureTerms(academicYearId: string) {
  const termSeeds = [
    {
      code: 'HK1-2025-2026',
      name: 'Học kỳ 1',
      termNumber: 1,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-01-15'),
      registrationStart: new Date('2025-08-15'),
      registrationEnd: new Date('2025-08-31'),
      isCurrent: true,
    },
    {
      code: 'HK2-2025-2026',
      name: 'Học kỳ 2',
      termNumber: 2,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-06-30'),
      registrationStart: new Date('2026-01-15'),
      registrationEnd: new Date('2026-01-31'),
      isCurrent: false,
    },
  ];

  const results = [];

  for (const seed of termSeeds) {
    const existing = await prisma.term.findUnique({
      where: { code: seed.code },
    });

    if (!existing) {
      const created = await prisma.term.create({
        data: {
          ...seed,
          academicYearId,
          isActive: true,
        },
      });
      console.log(`✅ Created term: ${created.code}`);
      results.push(created);
    } else {
      const updated = await prisma.term.update({
        where: { code: seed.code },
        data: {
          ...seed,
          academicYearId,
          isActive: true,
        },
      });
      console.log(`♻️ Updated term: ${updated.code}`);
      results.push(updated);
    }
  }

  return results;
}

async function ensureTeachingSubjects() {
  const facultyProfiles = await prisma.facultyProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          unit: true,
          department: true,
        },
      },
      unit: true,
    },
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  if (facultyProfiles.length === 0) {
    throw new Error('Không có facultyProfile nào. Hãy chạy seed_faculty_profiles.ts trước.');
  }

  let created = 0;
  let updated = 0;

  for (let i = 0; i < facultyProfiles.length; i++) {
    const faculty = facultyProfiles[i];
    const templates = selectTemplatesForFaculty(i + 1, faculty.user.role);

    for (let j = 0; j < templates.length; j++) {
      const template = templates[j];
      const existing = await prisma.teachingSubject.findFirst({
        where: {
          facultyId: faculty.id,
          subjectCode: template.code,
        },
      });

      const payload = {
        facultyId: faculty.id,
        subjectName: template.name,
        subjectCode: template.code,
        credits: template.credits,
        semester: `HK${1 + ((i + j) % 2)} 2025-2026`,
        academicYear: '2025-2026',
        department: faculty.user.unit || faculty.user.department || faculty.unit?.name || null,
        description: buildSubjectDescription(template),
        syllabus: `Đề cương chi tiết môn ${template.name}`,
        studentCount: 20 + ((i + j) % 35),
      };

      if (!existing) {
        await prisma.teachingSubject.create({ data: payload });
        created++;
      } else {
        await prisma.teachingSubject.update({
          where: { id: existing.id },
          data: payload,
        });
        updated++;
      }
    }

    console.log(`✅ TeachingSubject seeded for: ${faculty.user.name}`);
  }

  return { created, updated, totalFaculty: facultyProfiles.length };
}

async function ensureCourses() {
  const facultyProfiles = await prisma.facultyProfile.findMany({
    include: {
      user: true,
      unit: true,
      teachingSubjectsList: true,
    },
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  let created = 0;
  let updated = 0;

  for (let i = 0; i < facultyProfiles.length; i++) {
    const faculty = facultyProfiles[i];

    for (let j = 0; j < faculty.teachingSubjectsList.length; j++) {
      const subject = faculty.teachingSubjectsList[j];
      const courseCode = makeCourseCode(subject.subjectCode || `SUB${j + 1}`, i);

      const existing = await prisma.course.findUnique({
        where: { code: courseCode },
      });

      const payload = {
        code: courseCode,
        name: subject.subjectName,
        credits: subject.credits,
        departmentId: inferDepartmentIdFromFaculty(faculty),
        facultyId: faculty.id,
        semester: subject.semester?.includes('HK2') ? 'HK2' : 'HK1',
        year: 2025,
        maxStudents: 50,
        currentStudents: Math.min(subject.studentCount || 0, 45),
        description: subject.description || `Học phần ${subject.subjectName}`,
        syllabus: subject.syllabus || `Đề cương học phần ${subject.subjectName}`,
        isActive: true,
      };

      if (!existing) {
        await prisma.course.create({ data: payload });
        created++;
      } else {
        await prisma.course.update({
          where: { code: courseCode },
          data: payload,
        });
        updated++;
      }
    }
  }

  return { created, updated };
}

async function ensureRooms() {
  const roomSeeds = [
    { code: 'P101', name: 'Phòng học P101', building: 'Nhà A', floor: 1, capacity: 60 },
    { code: 'P102', name: 'Phòng học P102', building: 'Nhà A', floor: 1, capacity: 60 },
    { code: 'P201', name: 'Phòng học P201', building: 'Nhà A', floor: 2, capacity: 50 },
    { code: 'P202', name: 'Phòng học P202', building: 'Nhà A', floor: 2, capacity: 50 },
    { code: 'LAB01', name: 'Phòng máy LAB01', building: 'Nhà B', floor: 1, capacity: 40 },
  ];

  const results = [];

  for (const seed of roomSeeds) {
    const existing = await prisma.room.findUnique({
      where: { code: seed.code },
    });

    if (!existing) {
      const created = await prisma.room.create({
        data: {
          ...seed,
          roomType: seed.code.startsWith('LAB') ? 'COMPUTER' as any : 'THEORY' as any,
          isActive: true,
        },
      });
      results.push(created);
    } else {
      const updated = await prisma.room.update({
        where: { code: seed.code },
        data: {
          ...seed,
          roomType: seed.code.startsWith('LAB') ? 'COMPUTER' as any : 'THEORY' as any,
          isActive: true,
        },
      });
      results.push(updated);
    }
  }

  return results;
}

async function ensureClassSections(termId: string) {
  const courses = await prisma.course.findMany({
    include: {
      faculty: true,
    },
    where: { isActive: true },
    orderBy: { code: 'asc' },
  });

  const rooms = await ensureRooms();

  let created = 0;
  let updated = 0;

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    const sectionsPerCourse = i % 3 === 0 ? 2 : 1;

    for (let s = 1; s <= sectionsPerCourse; s++) {
      const code = makeClassSectionCode(course.code, s, '2025');
      const room = pick(rooms, i + s);

      const existing = await prisma.classSection.findUnique({
        where: { code },
      });

      const payload = {
        code,
        name: `${course.name} - Lớp ${s}`,
        curriculumCourseId: null as string | null,
        termId,
        facultyId: course.facultyId ?? null,
        roomId: room.id,
        maxStudents: course.maxStudents,
        currentStudents: Math.min(course.currentStudents, course.maxStudents),
        schedule: `Thứ ${2 + ((i + s) % 5)} | Ca ${1 + ((i + s) % 4)}`,
        dayOfWeek: 2 + ((i + s) % 5),
        startPeriod: 1 + ((i + s) % 4) * 2,
        endPeriod: 1 + ((i + s) % 4) * 2 + 1,
        startDate: new Date('2025-09-08'),
        endDate: new Date('2025-12-20'),
        status: 'OPEN' as any,
        isActive: true,
      };

      if (!existing) {
        await prisma.classSection.create({ data: payload });
        created++;
      } else {
        await prisma.classSection.update({
          where: { code },
          data: payload,
        });
        updated++;
      }
    }
  }

  return { created, updated };
}

async function ensureTrainingSessions(termId: string) {
  const classSections = await prisma.classSection.findMany({
    include: {
      faculty: true,
      room: true,
    },
    where: { isActive: true },
    orderBy: { code: 'asc' },
  });

  let created = 0;
  let updated = 0;

  for (let i = 0; i < classSections.length; i++) {
    const classSection = classSections[i];
    const sessionCount = 6 + (i % 5);

    for (let s = 1; s <= sessionCount; s++) {
      const sessionDate = new Date('2025-09-08');
      sessionDate.setDate(sessionDate.getDate() + (s - 1) * 7 + (i % 3));

      const slot = pick(SESSION_TIME_SLOTS, i + s);

      const existing = await prisma.trainingSession.findFirst({
        where: {
          classSectionId: classSection.id,
          sessionNumber: s,
        },
      });

      const payload = {
        classSectionId: classSection.id,
        termId,
        sessionNumber: s,
        sessionDate,
        startTime: slot.start,
        endTime: slot.end,
        sessionType: (s % 3 === 0 ? 'PRACTICE' : 'THEORY') as any,
        topic: `${classSection.name} - Buổi ${s}`,
        roomId: classSection.roomId ?? null,
        facultyId: classSection.facultyId ?? null,
        status: 'SCHEDULED' as any,
        isMakeup: false,
        originalSessionId: null as string | null,
        notes: `Buổi học số ${s} của ${classSection.code}`,
      };

      if (!existing) {
        await prisma.trainingSession.create({ data: payload });
        created++;
      } else {
        await prisma.trainingSession.update({
          where: { id: existing.id },
          data: payload,
        });
        updated++;
      }
    }
  }

  return { created, updated };
}

async function printSummary() {
  const totalTeachingSubjects = await prisma.teachingSubject.count();
  const totalCourses = await prisma.course.count();
  const totalClassSections = await prisma.classSection.count();
  const totalTrainingSessions = await prisma.trainingSession.count();

  console.log('\n================ RESULT ================');
  console.log(`TeachingSubjects : ${totalTeachingSubjects}`);
  console.log(`Courses          : ${totalCourses}`);
  console.log(`ClassSections    : ${totalClassSections}`);
  console.log(`TrainingSessions : ${totalTrainingSessions}`);
  console.log('========================================');

  const sampleFaculty = await prisma.facultyProfile.findMany({
    take: 5,
    include: {
      user: { select: { name: true, role: true } },
      teachingSubjectsList: true,
      classSections: true,
      trainingSessions: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log('\n👥 Sample Faculty Teaching Load:');
  for (const f of sampleFaculty) {
    console.log(
      `- ${f.user.name} (${f.user.role}): ${f.teachingSubjectsList.length} subjects, ${f.classSections.length} classes, ${f.trainingSessions.length} sessions`
    );
  }
}

async function main() {
  console.log('📚 Seeding Teaching Data...\n');

  const academicYear = await ensureAcademicYear();
  const terms = await ensureTerms(academicYear.id);
  const currentTerm = terms.find((t) => t.isCurrent) || terms[0];

  await ensureTeachingSubjects();
  await ensureCourses();
  await ensureClassSections(currentTerm.id);
  await ensureTrainingSessions(currentTerm.id);

  await printSummary();

  console.log('\n✅ Seed teaching data completed.');
}

main()
  .catch((error) => {
    console.error('❌ Seed teaching data failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });