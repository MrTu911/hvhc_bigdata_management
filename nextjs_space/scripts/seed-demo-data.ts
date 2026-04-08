/**
 * Script tạo dữ liệu demo đầy đủ cho HVHC BigData Management System
 * Bao gồm: Demo accounts, Courses, Students, Grades, Scientific Profiles
 */

import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

// Demo accounts cho tất cả các vai trò
const demoAccounts = [
  {
    email: 'admin@demo.hvhc.edu.vn',
    name: 'Demo Quản trị Hệ thống',
    password: 'Demo@2025',
    role: 'QUAN_TRI_HE_THONG' as UserRole,
    militaryId: 'DEMO-QT001',
    rank: 'Đại tá',
    position: 'Quản trị viên Hệ thống',
    department: 'HVHC'
  },
  {
    email: 'chihuy@demo.hvhc.edu.vn',
    name: 'Demo Chỉ huy Học viện',
    password: 'Demo@2025',
    role: 'CHI_HUY_HOC_VIEN' as UserRole,
    militaryId: 'DEMO-CH001',
    rank: 'Thiếu tướng',
    position: 'Giám đốc Học viện',
    department: 'HVHC'
  },
  {
    email: 'truongkhoa@demo.hvhc.edu.vn',
    name: 'Demo Chỉ huy Khoa/Phòng',
    password: 'Demo@2025',
    role: 'CHI_HUY_KHOA_PHONG' as UserRole,
    militaryId: 'DEMO-TK001',
    rank: 'Đại tá',
    position: 'Trưởng khoa CNTT',
    department: 'KCNTT'
  },
  {
    email: 'chunhiem@demo.hvhc.edu.vn',
    name: 'Demo Chủ nhiệm Bộ môn',
    password: 'Demo@2025',
    role: 'CHU_NHIEM_BO_MON' as UserRole,
    militaryId: 'DEMO-CN001',
    rank: 'Thượng tá',
    position: 'Chủ nhiệm Bộ môn',
    department: 'KCNTT'
  },
  {
    email: 'giangvien@demo.hvhc.edu.vn',
    name: 'Demo Giảng viên',
    password: 'Demo@2025',
    role: 'GIANG_VIEN' as UserRole,
    militaryId: 'DEMO-GV001',
    rank: 'Trung tá',
    position: 'Giảng viên chính',
    department: 'KCNTT'
  },
  {
    email: 'nghiencuu@demo.hvhc.edu.vn',
    name: 'Demo Nghiên cứu viên',
    password: 'Demo@2025',
    role: 'NGHIEN_CUU_VIEN' as UserRole,
    militaryId: 'DEMO-NC001',
    rank: 'Thiếu tá',
    position: 'Nghiên cứu viên chính',
    department: 'HVHC'
  },
  {
    email: 'hocvien@demo.hvhc.edu.vn',
    name: 'Demo Học viên/Sinh viên',
    password: 'Demo@2025',
    role: 'HOC_VIEN_SINH_VIEN' as UserRole,
    militaryId: 'DEMO-HV001',
    rank: 'Đại úy',
    position: 'Học viên cao học',
    department: 'KCNTT'
  },
  {
    email: 'kythuat@demo.hvhc.edu.vn',
    name: 'Demo Kỹ thuật viên',
    password: 'Demo@2025',
    role: 'KY_THUAT_VIEN' as UserRole,
    militaryId: 'DEMO-KT001',
    rank: 'Thiếu tá',
    position: 'Kỹ thuật viên CNTT',
    department: 'KCNTT'
  }
];

// Dữ liệu mẫu cho Courses
const sampleCourses = [
  {
    code: 'CNTT101',
    name: 'Nhập môn Công nghệ Thông tin',
    description: 'Môn học cơ bản về CNTT cho học viên năm nhất',
    credits: 3,
    departmentCode: 'KCNTT',
    semester: 'HK1',
    year: 2024
  },
  {
    code: 'CNTT201',
    name: 'Cơ sở Dữ liệu',
    description: 'Thiết kế và quản trị cơ sở dữ liệu quan hệ',
    credits: 4,
    departmentCode: 'KCNTT',
    semester: 'HK2',
    year: 2024
  },
  {
    code: 'CNTT301',
    name: 'An toàn Thông tin',
    description: 'Bảo mật hệ thống và mạng máy tính',
    credits: 3,
    departmentCode: 'KCNTT',
    semester: 'HK1',
    year: 2025
  },
  {
    code: 'CNTT401',
    name: 'Trí tuệ Nhân tạo',
    description: 'Machine Learning và Deep Learning cơ bản',
    credits: 4,
    departmentCode: 'KCNTT',
    semester: 'HK2',
    year: 2025
  },
  {
    code: 'HC101',
    name: 'Hậu cần Quân sự Đại cương',
    description: 'Tổng quan về công tác hậu cần trong quân đội',
    credits: 3,
    departmentCode: 'KHCL',
    semester: 'HK1',
    year: 2024
  },
  {
    code: 'HC201',
    name: 'Quản lý Kho Quân sự',
    description: 'Quản lý và điều hành kho vật tư quân sự',
    credits: 3,
    departmentCode: 'KHCL',
    semester: 'HK2',
    year: 2024
  },
  {
    code: 'TC101',
    name: 'Tài chính Quân sự Cơ bản',
    description: 'Nguyên lý tài chính trong quân đội',
    credits: 3,
    departmentCode: 'KTC',
    semester: 'HK1',
    year: 2024
  },
  {
    code: 'KTXD101',
    name: 'Kỹ thuật Xây dựng Công trình Quốc phòng',
    description: 'Xây dựng công trình phục vụ quốc phòng',
    credits: 4,
    departmentCode: 'KTXD',
    semester: 'HK1',
    year: 2024
  }
];

// Dữ liệu mẫu cho Students (HocVien)
const sampleStudents = [
  { maHocVien: 'HV2024001', hoTen: 'Nguyễn Văn An', lop: 'K45-CNTT', khoaHoc: '2024', nganh: 'Công nghệ Thông tin', email: 'an.nv@sv.hvhc.edu.vn' },
  { maHocVien: 'HV2024002', hoTen: 'Trần Thị Bình', lop: 'K45-CNTT', khoaHoc: '2024', nganh: 'Công nghệ Thông tin', email: 'binh.tt@sv.hvhc.edu.vn' },
  { maHocVien: 'HV2024003', hoTen: 'Lê Văn Cường', lop: 'K45-HC', khoaHoc: '2024', nganh: 'Hậu cần Quân sự', email: 'cuong.lv@sv.hvhc.edu.vn' },
  { maHocVien: 'HV2024004', hoTen: 'Phạm Thị Dung', lop: 'K45-HC', khoaHoc: '2024', nganh: 'Hậu cần Quân sự', email: 'dung.pt@sv.hvhc.edu.vn' },
  { maHocVien: 'HV2024005', hoTen: 'Hoàng Văn Em', lop: 'K45-TC', khoaHoc: '2024', nganh: 'Tài chính Quân sự', email: 'em.hv@sv.hvhc.edu.vn' },
  { maHocVien: 'HV2024006', hoTen: 'Vũ Thị Phương', lop: 'K45-TC', khoaHoc: '2024', nganh: 'Tài chính Quân sự', email: 'phuong.vt@sv.hvhc.edu.vn' },
  { maHocVien: 'HV2024007', hoTen: 'Đỗ Văn Giang', lop: 'K45-XD', khoaHoc: '2024', nganh: 'Xây dựng Công trình', email: 'giang.dv@sv.hvhc.edu.vn' },
  { maHocVien: 'HV2024008', hoTen: 'Ngô Thị Hoa', lop: 'K45-XD', khoaHoc: '2024', nganh: 'Xây dựng Công trình', email: 'hoa.nt@sv.hvhc.edu.vn' },
  { maHocVien: 'HV2023001', hoTen: 'Bùi Văn Kiên', lop: 'K44-CNTT', khoaHoc: '2023', nganh: 'Công nghệ Thông tin', email: 'kien.bv@sv.hvhc.edu.vn' },
  { maHocVien: 'HV2023002', hoTen: 'Lý Thị Lan', lop: 'K44-CNTT', khoaHoc: '2023', nganh: 'Công nghệ Thông tin', email: 'lan.lt@sv.hvhc.edu.vn' },
  { maHocVien: 'HV2023003', hoTen: 'Mai Văn Minh', lop: 'K44-HC', khoaHoc: '2023', nganh: 'Hậu cần Quân sự', email: 'minh.mv@sv.hvhc.edu.vn' },
  { maHocVien: 'HV2023004', hoTen: 'Đinh Thị Ngọc', lop: 'K44-HC', khoaHoc: '2023', nganh: 'Hậu cần Quân sự', email: 'ngoc.dt@sv.hvhc.edu.vn' },
  { maHocVien: 'HV2022001', hoTen: 'Trịnh Văn Phú', lop: 'K43-CNTT', khoaHoc: '2022', nganh: 'Công nghệ Thông tin', email: 'phu.tv@sv.hvhc.edu.vn' },
  { maHocVien: 'HV2022002', hoTen: 'Cao Thị Quỳnh', lop: 'K43-CNTT', khoaHoc: '2022', nganh: 'Công nghệ Thông tin', email: 'quynh.ct@sv.hvhc.edu.vn' },
  { maHocVien: 'HV2022003', hoTen: 'Phan Văn Sơn', lop: 'K43-TC', khoaHoc: '2022', nganh: 'Tài chính Quân sự', email: 'son.pv@sv.hvhc.edu.vn' }
];

async function seedDemoAccounts() {
  console.log('📝 Đang tạo tài khoản demo...');

  for (const account of demoAccounts) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        role: account.role,
        rank: account.rank,
        position: account.position,
        department: account.department
      },
      create: {
        email: account.email,
        name: account.name,
        password: await hashPassword(account.password),
        role: account.role,
        militaryId: account.militaryId,
        rank: account.rank,
        position: account.position,
        department: account.department,
        status: 'ACTIVE' as UserStatus
      }
    });
    console.log(`  ✓ ${account.role}: ${account.email}`);
  }

  console.log('✅ Đã tạo xong tài khoản demo');
}

async function seedCourses() {
  console.log('\n📚 Đang tạo môn học...');

  for (const course of sampleCourses) {
    // Tìm department
    const dept = await prisma.department.findFirst({
      where: { code: course.departmentCode }
    });

    await prisma.course.upsert({
      where: { code: course.code },
      update: {
        name: course.name,
        description: course.description,
        credits: course.credits,
        semester: course.semester,
        year: course.year,
        departmentId: dept?.id
      },
      create: {
        code: course.code,
        name: course.name,
        description: course.description,
        credits: course.credits,
        semester: course.semester,
        year: course.year,
        isActive: true,
        departmentId: dept?.id
      }
    });
    console.log(`  ✓ ${course.code}: ${course.name}`);
  }

  console.log('✅ Đã tạo xong môn học');
}

async function seedStudents() {
  console.log('\n🎓 Đang tạo học viên...');

  for (const student of sampleStudents) {
    await prisma.hocVien.upsert({
      where: { maHocVien: student.maHocVien },
      update: {
        hoTen: student.hoTen,
        lop: student.lop,
        khoaHoc: student.khoaHoc,
        nganh: student.nganh,
        email: student.email
      },
      create: {
        maHocVien: student.maHocVien,
        hoTen: student.hoTen,
        lop: student.lop,
        khoaHoc: student.khoaHoc,
        nganh: student.nganh,
        email: student.email,
        trangThai: 'Đang học'
      }
    });
    console.log(`  ✓ ${student.maHocVien}: ${student.hoTen}`);
  }

  console.log('✅ Đã tạo xong học viên');
}

async function seedGrades() {
  console.log('\n📊 Đang tạo điểm học tập...');

  const students = await prisma.hocVien.findMany();
  const courses = await prisma.course.findMany();

  // Tạo điểm ngẫu nhiên cho mỗi học viên với một số môn
  for (const student of students) {
    // Chọn 3-5 môn ngẫu nhiên cho mỗi học viên
    const numCourses = Math.floor(Math.random() * 3) + 3;
    const selectedCourses = courses.sort(() => 0.5 - Math.random()).slice(0, numCourses);

    for (const course of selectedCourses) {
      const diemChuyenCan = 7 + Math.random() * 3;
      const diemGiuaKy = 5 + Math.random() * 5;
      const diemBaiTap = 6 + Math.random() * 4;
      const diemThi = 5 + Math.random() * 5;
      const diemTongKet = diemChuyenCan * 0.1 + diemGiuaKy * 0.2 + diemBaiTap * 0.2 + diemThi * 0.5;

      let xepLoai = 'Yếu';
      if (diemTongKet >= 8.5) xepLoai = 'Xuất sắc';
      else if (diemTongKet >= 7.0) xepLoai = 'Giỏi';
      else if (diemTongKet >= 5.5) xepLoai = 'Khá';
      else if (diemTongKet >= 4.0) xepLoai = 'Trung bình';

      // Kiểm tra xem đã có điểm chưa
      const existing = await prisma.ketQuaHocTap.findFirst({
        where: {
          hocVienId: student.id,
          maMon: course.code
        }
      });

      if (!existing) {
        await prisma.ketQuaHocTap.create({
          data: {
            hocVienId: student.id,
            maMon: course.code,
            monHoc: course.name,
            soTinChi: course.credits,
            hocKy: course.semester || 'HK1',
            namHoc: `${course.year || 2024}-${(course.year || 2024) + 1}`,
            diemChuyenCan: parseFloat(diemChuyenCan.toFixed(1)),
            diemGiuaKy: parseFloat(diemGiuaKy.toFixed(1)),
            diemBaiTap: parseFloat(diemBaiTap.toFixed(1)),
            diemThi: parseFloat(diemThi.toFixed(1)),
            diemTongKet: parseFloat(diemTongKet.toFixed(1)),
            xepLoai: xepLoai
          }
        });
      }
    }
    console.log(`  ✓ Điểm cho ${student.hoTen}`);
  }

  console.log('✅ Đã tạo xong điểm học tập');
}

async function seedScientificProfiles() {
  console.log('\n🔬 Đang tạo hồ sơ khoa học...');

  // Lấy các giảng viên và chỉ huy để tạo hồ sơ khoa học
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ['GIANG_VIEN', 'CHU_NHIEM_BO_MON', 'CHI_HUY_KHOA_PHONG', 'NGHIEN_CUU_VIEN']
      }
    },
    take: 15
  });

  for (const user of users) {
    // Tạo Scientific Profile nếu chưa có
    let profile = await prisma.scientificProfile.findUnique({
      where: { userId: user.id }
    });

    if (!profile) {
      profile = await prisma.scientificProfile.create({
        data: {
          userId: user.id,
          summary: `Cán bộ nghiên cứu khoa học với chuyên ngành ${user.department || 'CNTT'}. Lĩnh vực nghiên cứu: Công nghệ thông tin, An ninh mạng, Trí tuệ nhân tạo.`,
          isPublic: true
        }
      });
    }

    // Tạo lịch sử học vấn
    const eduLevels = ['DAI_HOC', 'THAC_SI', 'TIEN_SI'];
    for (let i = 0; i < Math.min(3, eduLevels.length); i++) {
      const existing = await prisma.educationHistory.findFirst({
        where: { userId: user.id, level: eduLevels[i] as any }
      });
      if (!existing) {
        await prisma.educationHistory.create({
          data: {
            userId: user.id,
            level: eduLevels[i] as any,
            institution: i === 0 ? 'Học viện Kỹ thuật Quân sự' : i === 1 ? 'Học viện Hậu cần' : 'Đại học Bách khoa Hà Nội',
            major: 'Công nghệ Thông tin',
            trainingSystem: i === 0 ? 'Chính quy' : 'Tập trung',
            startDate: new Date(2005 + i * 4, 8, 1),
            endDate: new Date(2009 + i * 4, 6, 15),
            thesisTitle: i > 0 ? `Nghiên cứu ứng dụng ${i === 1 ? 'Machine Learning' : 'Big Data'} trong quân đội` : null
          }
        });
      }
    }

    // Tạo công bố khoa học
    const pubTypes = ['BAI_BAO', 'GIAO_TRINH', 'TAI_LIEU'];
    for (let i = 0; i < 2; i++) {
      await prisma.scientificPublication.upsert({
        where: {
          id: `pub-${user.id}-${i}`
        },
        update: {},
        create: {
          id: `pub-${user.id}-${i}`,
          userId: user.id,
          type: pubTypes[i % 3] as any,
          title: `Ứng dụng ${i === 0 ? 'AI' : 'Big Data'} trong quản lý hậu cần quân sự`,
          year: 2023 + i,
          role: i === 0 ? 'CHU_BIEN' : 'DONG_TAC_GIA',
          publisher: i === 0 ? 'Tạp chí Khoa học Quân sự' : null,
          pageNumbers: i === 0 ? '45-52' : null
        }
      });
    }

    // Tạo đề tài nghiên cứu
    await prisma.scientificResearch.upsert({
      where: {
        id: `research-${user.id}`
      },
      update: {},
      create: {
        id: `research-${user.id}`,
        userId: user.id,
        title: `Xây dựng hệ thống quản lý dữ liệu lớn cho Học viện Hậu cần`,
        year: 2024,
        level: 'Cấp Bộ',
        type: 'Đề tài nghiên cứu khoa học',
        role: 'CHU_NHIEM',
        institution: 'Học viện Hậu cần',
        result: 'Đang thực hiện'
      }
    });

    console.log(`  ✓ Hồ sơ KH: ${user.name}`);
  }

  console.log('✅ Đã tạo xong hồ sơ khoa học');
}

async function seedRegistrations() {
  console.log('\n📋 Đang tạo đăng ký học...');

  const students = await prisma.hocVien.findMany({ take: 10 });
  const courses = await prisma.course.findMany();

  for (const student of students) {
    // Đăng ký 2-3 môn cho mỗi học viên
    const numCourses = Math.floor(Math.random() * 2) + 2;
    const selectedCourses = courses.sort(() => 0.5 - Math.random()).slice(0, numCourses);

    for (const course of selectedCourses) {
      const existing = await prisma.registration.findFirst({
        where: {
          hocVienId: student.id,
          courseId: course.id
        }
      });

      if (!existing) {
        await prisma.registration.create({
          data: {
            hocVienId: student.id,
            courseId: course.id,
            status: 'COMPLETED',
            registeredAt: new Date()
          }
        });
      }
    }
    console.log(`  ✓ Đăng ký cho ${student.hoTen}`);
  }

  console.log('✅ Đã tạo xong đăng ký học');
}

async function seedExamsAndGradeRecords() {
  console.log('\n📝 Đang tạo bài thi và điểm...');

  const courses = await prisma.course.findMany();
  const registrations = await prisma.registration.findMany({
    include: { hocVien: true, course: true }
  });

  for (const course of courses) {
    // Tạo kỳ thi cho mỗi môn
    const exam = await prisma.exam.upsert({
      where: { id: `exam-${course.id}` },
      update: {},
      create: {
        id: `exam-${course.id}`,
        courseId: course.id,
        examType: 'FINAL',
        examDate: new Date(2025, 0, 15 + Math.floor(Math.random() * 15)),
        duration: 90,
        instructions: `Thi cuối kỳ - ${course.name}`,
        isPublished: true
      }
    });

    // Tạo điểm cho những học viên đã đăng ký
    const courseRegs = registrations.filter(r => r.courseId === course.id);
    for (const reg of courseRegs) {
      const existing = await prisma.gradeRecord.findFirst({
        where: {
          registrationId: reg.id
        }
      });

      if (!existing) {
        // Tính điểm thành phần
        const midtermScore = 5 + Math.random() * 5;
        const finalScore = 5 + Math.random() * 5;
        const assignmentScore = 6 + Math.random() * 4;
        const attendanceScore = 7 + Math.random() * 3;
        const calculatedTotal = (midtermScore * 0.2 + finalScore * 0.5 + assignmentScore * 0.2 + attendanceScore * 0.1);
        
        let letterGrade = 'D';
        if (calculatedTotal >= 8.5) letterGrade = 'A';
        else if (calculatedTotal >= 7.0) letterGrade = 'B';
        else if (calculatedTotal >= 5.5) letterGrade = 'C';
        
        await prisma.gradeRecord.create({
          data: {
            registrationId: reg.id,
            midtermScore: parseFloat(midtermScore.toFixed(1)),
            finalScore: parseFloat(finalScore.toFixed(1)),
            assignmentScore: parseFloat(assignmentScore.toFixed(1)),
            attendanceScore: parseFloat(attendanceScore.toFixed(1)),
            totalScore: parseFloat(calculatedTotal.toFixed(1)),
            letterGrade: letterGrade,
            status: 'FINALIZED',
            notes: calculatedTotal >= 7.0 ? 'Hoàn thành tốt' : 'Cần cố gắng hơn'
          }
        });
      }
    }
    console.log(`  ✓ Thi & điểm: ${course.name}`);
  }

  console.log('✅ Đã tạo xong bài thi và điểm');
}

async function main() {
  console.log('🚀 BẮT ĐẦU TẠO DỮ LIỆU DEMO CHO HVHC BigData\n');
  console.log('=' .repeat(60));

  try {
    await seedDemoAccounts();
    await seedCourses();
    await seedStudents();
    await seedGrades();
    await seedScientificProfiles();
    await seedRegistrations();
    await seedExamsAndGradeRecords();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 HOÀN THÀNH TẠO DỮ LIỆU DEMO!');
    console.log('\n📋 DANH SÁCH TÀI KHOẢN DEMO:');
    console.log('-'.repeat(60));
    for (const acc of demoAccounts) {
      console.log(`  ${acc.role.padEnd(25)} | ${acc.email.padEnd(30)} | Demo@2025`);
    }
    console.log('-'.repeat(60));
  } catch (error) {
    console.error('❌ Lỗi:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
