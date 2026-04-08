/**
 * Seed CSDL Giáo dục - Đào tạo
 * Tạo dữ liệu cho: ClassSection, TrainingSession, ClassEnrollment, 
 * QuestionBank, Question, LearningMaterial, ExamPlan, ExamSession
 */
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log("=== SEED CSDL GIÁO DỤC - ĐÀO TẠO ===\n");
  
  // Get existing data for references
  const curriculumCourses = await prisma.curriculumCourse.findMany({ take: 15 });
  const rooms = await prisma.room.findMany({ take: 20 });
  const terms = await prisma.term.findMany();
  const faculty = await prisma.facultyProfile.findMany({ take: 20, include: { user: true } });
  const hocViens = await prisma.hocVien.findMany({ take: 50 });
  const units = await prisma.unit.findMany({ where: { type: 'KHOA' }, take: 6 });
  
  console.log(`Found: ${curriculumCourses.length} curriculum courses, ${rooms.length} rooms, ${terms.length} terms`);
  console.log(`Found: ${faculty.length} faculty, ${hocViens.length} students, ${units.length} units`);
  
  if (curriculumCourses.length === 0 || faculty.length === 0 || terms.length === 0) {
    console.log("ERROR: Missing prerequisite data");
    return;
  }
  
  const currentTerm = terms[0];
  
  // 1. Seed ClassSection (Lớp học phần)
  console.log("\n1. Creating ClassSection...");
  const classSections = [];
  
  for (let i = 0; i < curriculumCourses.length; i++) {
    const cc = curriculumCourses[i];
    const fac = faculty[i % faculty.length];
    const room = rooms[i % rooms.length];
    
    const section = await prisma.classSection.create({
      data: {
        code: `LHP-${cc.subjectCode}-${String(i + 1).padStart(2, '0')}`,
        name: `Lớp ${cc.subjectName} - Nhóm ${(i % 3) + 1}`,
        curriculumCourseId: cc.id,
        termId: currentTerm.id,
        facultyId: fac.id,
        roomId: room?.id,
        maxStudents: 40 + (i % 3) * 10,
        currentStudents: 25 + (i % 15),
        schedule: `Thứ ${(i % 5) + 2}, Tiết ${(i % 4) * 2 + 1}-${(i % 4) * 2 + 3}`,
        dayOfWeek: (i % 5) + 2,
        startPeriod: (i % 4) * 2 + 1,
        endPeriod: (i % 4) * 2 + 3,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-01-15'),
        status: 'OPEN',
        isActive: true,
      },
    });
    classSections.push(section);
  }
  console.log(`  Created ${classSections.length} class sections`);
  
  // 2. Seed TrainingSession (Buổi học)
  console.log("\n2. Creating TrainingSession...");
  let sessionCount = 0;
  const sessionTypes = ['THEORY', 'PRACTICE', 'SEMINAR', 'LAB'];
  
  for (const section of classSections.slice(0, 10)) {
    const room = rooms[sessionCount % rooms.length];
    const fac = faculty[sessionCount % faculty.length];
    
    for (let week = 1; week <= 8; week++) {
      const sessionDate = new Date('2025-09-01');
      sessionDate.setDate(sessionDate.getDate() + (week - 1) * 7);
      
      await prisma.trainingSession.create({
        data: {
          classSectionId: section.id,
          termId: currentTerm.id,
          sessionNumber: week,
          sessionDate: sessionDate,
          startTime: '07:00',
          endTime: '09:30',
          sessionType: sessionTypes[(week - 1) % 4] as any,
          topic: `Buổi ${week}: Nội dung chương ${Math.ceil(week / 2)}`,
          roomId: room?.id,
          facultyId: fac.id,
          status: week <= 4 ? 'COMPLETED' : 'SCHEDULED',
          notes: `Ghi chú buổi học ${week}`,
        },
      });
      sessionCount++;
    }
  }
  console.log(`  Created ${sessionCount} training sessions`);
  
  // 3. Seed ClassEnrollment (Đăng ký lớp học phần)
  console.log("\n3. Creating ClassEnrollment...");
  let enrollmentCount = 0;
  const usedPairs = new Set<string>();
  
  for (const section of classSections) {
    const numStudents = Math.min(section.currentStudents, hocViens.length, 10);
    for (let j = 0; j < numStudents; j++) {
      const studentIdx = (enrollmentCount + j) % hocViens.length;
      const student = hocViens[studentIdx];
      const pairKey = `${section.id}-${student.id}`;
      
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);
      
      try {
        await prisma.classEnrollment.create({
          data: {
            classSectionId: section.id,
            hocVienId: student.id,
            status: 'ENROLLED',
            enrolledAt: new Date('2025-08-20'),
            midtermScore: 5 + Math.random() * 4,
            finalScore: 5 + Math.random() * 4,
            totalScore: 6 + Math.random() * 3,
            gradeStatus: j % 3 === 0 ? 'GRADED' : 'PENDING',
          },
        });
        enrollmentCount++;
      } catch (e) {
        // Skip duplicates
        console.log(`  Skip duplicate: ${section.id} - ${student.id}`);
      }
    }
  }
  console.log(`  Created ${enrollmentCount} class enrollments`);
  
  // 4. Seed QuestionBank (Ngân hàng câu hỏi)
  console.log("\n4. Creating QuestionBank...");
  const questionBanks = [];
  const subjects = [
    { code: 'TH101', name: 'Triết học Mác-Lênin' },
    { code: 'KT101', name: 'Kinh tế chính trị' },
    { code: 'LS101', name: 'Lịch sử Đảng' },
    { code: 'QS101', name: 'Khoa học quân sự' },
    { code: 'CNTT101', name: 'Công nghệ thông tin' },
    { code: 'NN101', name: 'Ngoại ngữ' },
  ];
  
  for (let i = 0; i < subjects.length; i++) {
    const subj = subjects[i];
    const unit = units[i % units.length];
    
    const bank = await prisma.questionBank.create({
      data: {
        code: `NHC-${subj.code}`,
        name: `Ngân hàng câu hỏi ${subj.name}`,
        subjectCode: subj.code,
        subjectName: subj.name,
        unitId: unit?.id,
        description: `Bộ câu hỏi trắc nghiệm và tự luận môn ${subj.name}`,
        totalQuestions: 50 + i * 10,
        isActive: true,
        isPublic: false,
        createdBy: faculty[i % faculty.length].userId,
      },
    });
    questionBanks.push(bank);
  }
  console.log(`  Created ${questionBanks.length} question banks`);
  
  // 5. Seed Questions
  console.log("\n5. Creating Questions...");
  const questionTypes = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'ESSAY', 'FILL_BLANK'];
  const difficulties = ['EASY', 'MEDIUM', 'HARD'];
  let questionCount = 0;
  
  for (const bank of questionBanks) {
    for (let q = 0; q < 15; q++) {
      const qType = questionTypes[q % 4];
      await prisma.question.create({
        data: {
          questionBankId: bank.id,
          code: `${bank.code}-${String(q + 1).padStart(3, '0')}`,
          content: `Câu ${q + 1}: Nội dung câu hỏi về ${bank.subjectName}. Đây là câu hỏi ${qType === 'ESSAY' ? 'tự luận' : 'trắc nghiệm'}.`,
          contentType: 'TEXT',
          questionType: qType as any,
          options: qType === 'MULTIPLE_CHOICE' ? ['A. Đáp án A', 'B. Đáp án B', 'C. Đáp án C', 'D. Đáp án D'] : undefined,
          correctAnswer: qType === 'MULTIPLE_CHOICE' ? 'A' : qType === 'TRUE_FALSE' ? 'Đúng' : 'Đáp án mẫu',
          explanation: `Giải thích: Đây là đáp án đúng theo lý thuyết chương ${Math.ceil((q + 1) / 3)}.`,
          difficulty: difficulties[q % 3] as any,
          points: qType === 'ESSAY' ? 10 : qType === 'SHORT_ANSWER' ? 5 : 2,
          chapter: `Chương ${Math.ceil((q + 1) / 5)}`,
          topic: `Chủ đề ${(q % 3) + 1}`,
          usageCount: Math.floor(Math.random() * 50),
          status: 'ACTIVE',
          isActive: true,
          createdBy: faculty[q % faculty.length].userId,
        },
      });
      questionCount++;
    }
  }
  console.log(`  Created ${questionCount} questions`);
  
  // 6. Seed LearningMaterial (Tài liệu học tập)
  console.log("\n6. Creating LearningMaterial...");
  const materialTypes = ['DOCUMENT', 'PRESENTATION', 'VIDEO', 'AUDIO', 'SPREADSHEET'];
  let materialCount = 0;
  
  for (let i = 0; i < subjects.length; i++) {
    const subj = subjects[i];
    const unit = units[i % units.length];
    
    for (let m = 0; m < 4; m++) {
      await prisma.learningMaterial.create({
        data: {
          code: `TL-${subj.code}-${String(m + 1).padStart(2, '0')}`,
          title: `Tài liệu ${m + 1}: ${subj.name}`,
          description: `${materialTypes[m % 5]} cho môn học ${subj.name}`,
          subjectCode: subj.code,
          subjectName: subj.name,
          materialType: materialTypes[m % 5] as any,
          format: ['pdf', 'docx', 'mp4', 'mp3', 'pdf'][m % 5],
          fileUrl: `/materials/${subj.code}/doc_${m + 1}.pdf`,
          fileName: `doc_${m + 1}.pdf`,
          fileSize: (500 + m * 200) * 1024,
          unitId: unit?.id,
          authorId: faculty[i % faculty.length].userId,
          chapter: `Chương ${m + 1}`,
          viewCount: Math.floor(Math.random() * 100),
          downloadCount: Math.floor(Math.random() * 50),
          accessLevel: 'INTERNAL',
          isActive: true,
        },
      });
      materialCount++;
    }
  }
  console.log(`  Created ${materialCount} learning materials`);
  
  // 7. Seed ExamPlan (Kế hoạch thi)
  console.log("\n7. Creating ExamPlan...");
  const examPlans = [];
  
  for (let i = 0; i < 4; i++) {
    const isHK1 = i % 2 === 0;
    const plan = await prisma.examPlan.create({
      data: {
        code: `KHT-${isHK1 ? 'HK1' : 'HK2'}-202${5 + Math.floor(i / 2)}`,
        name: `Kế hoạch thi ${isHK1 ? 'cuối kỳ I' : 'cuối kỳ II'} năm học 202${5 + Math.floor(i / 2)}-202${6 + Math.floor(i / 2)}`,
        termId: currentTerm.id,
        examType: 'FINAL',
        startDate: new Date(isHK1 ? '2026-01-05' : '2026-06-01'),
        endDate: new Date(isHK1 ? '2026-01-25' : '2026-06-20'),
        registrationDeadline: new Date(isHK1 ? '2025-12-20' : '2026-05-15'),
        description: `Kế hoạch tổ chức thi ${isHK1 ? 'học kỳ 1' : 'học kỳ 2'}`,
        rules: 'Tuân thủ quy chế thi của Học viện',
        status: i === 0 ? 'APPROVED' : 'DRAFT',
        isPublished: i === 0,
        publishedAt: i === 0 ? new Date() : null,
        createdBy: faculty[0].userId,
      },
    });
    examPlans.push(plan);
  }
  console.log(`  Created ${examPlans.length} exam plans`);
  
  // 8. Seed ExamSession (Buổi thi)
  console.log("\n8. Creating ExamSession...");
  let examSessionCount = 0;
  
  for (const plan of examPlans.slice(0, 2)) {
    for (let s = 0; s < 8; s++) {
      const sessionDate = new Date(plan.startDate);
      sessionDate.setDate(sessionDate.getDate() + s * 2);
      const room = rooms[s % rooms.length];
      const subj = subjects[s % subjects.length];
      const section = classSections[s % classSections.length];
      
      await prisma.examSession.create({
        data: {
          code: `CA-${plan.code}-${String(s + 1).padStart(3, '0')}`,
          examPlanId: plan.id,
          classSectionId: section?.id,
          subjectCode: subj.code,
          subjectName: subj.name,
          examDate: sessionDate,
          startTime: s % 2 === 0 ? '07:30' : '13:30',
          endTime: s % 2 === 0 ? '09:30' : '15:30',
          duration: 120,
          roomId: room?.id,
          maxStudents: 40,
          registeredCount: 25 + Math.floor(Math.random() * 15),
          supervisorId: faculty[s % faculty.length].userId,
          examFormat: 'WRITTEN',
          status: s < 4 ? 'COMPLETED' : 'SCHEDULED',
          instructions: 'Mang theo CMND/CCCD và thẻ sinh viên',
        },
      });
      examSessionCount++;
    }
  }
  console.log(`  Created ${examSessionCount} exam sessions`);
  
  console.log("\n=== HOÀN TẤT SEED CSDL GIÁO DỤC - ĐÀO TẠO ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
