/**
 * Seed: HocVien + ClassEnrollment + KetQuaHocTap
 * Tạo học viên trong bảng hoc_vien từ StudentProfile/User,
 * ghi danh vào lớp học phần và tạo kết quả học tập.
 */
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const NGANH_LIST = [
  'Hậu cần chiến đấu',
  'Quân nhu',
  'Vận tải Quân sự',
  'Xăng dầu',
  'Tài chính Quân sự',
  'Khoa học cơ bản',
  'Chỉ huy hậu cần',
];

const TRANG_THAI_LIST = ['Đang học', 'Đang học', 'Đang học', 'Đang học', 'Tốt nghiệp', 'Bảo lưu'];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function randFloat(min: number, max: number, seed: number): number {
  const r = Math.abs(Math.sin(seed) * 9999) % 1;
  return parseFloat((min + r * (max - min)).toFixed(2));
}

function genKetQua(diem: number): string {
  if (diem >= 9.0) return 'Xuất sắc';
  if (diem >= 8.0) return 'Giỏi';
  if (diem >= 7.0) return 'Khá';
  if (diem >= 5.0) return 'Trung bình';
  return 'Yếu';
}

function genXepLoai(diem: number): string {
  if (diem >= 9.0) return 'A+';
  if (diem >= 8.5) return 'A';
  if (diem >= 8.0) return 'B+';
  if (diem >= 7.0) return 'B';
  if (diem >= 6.5) return 'C+';
  if (diem >= 5.5) return 'C';
  if (diem >= 5.0) return 'D';
  return 'F';
}

async function main() {
  console.log('🎓 Bắt đầu seed HocVien + Enrollment + KetQua...');

  // 1. Lấy StudentProfiles để tạo HocVien
  const studentProfiles = await prisma.studentProfile.findMany({
    where: { maHocVien: { not: null }, deletedAt: null },
    include: {
      user: {
        select: { id: true, name: true, email: true, dateOfBirth: true, gender: true, phone: true, address: true },
      },
    },
  });

  console.log(`  ✔ Tìm thấy ${studentProfiles.length} StudentProfile`);

  // 2. Lấy ClassSections hiện tại để ghi danh
  const classSections = await prisma.classSection.findMany({
    where: { isActive: true, status: 'OPEN' },
    select: { id: true, code: true, name: true, maxStudents: true, currentStudents: true, termId: true },
  });
  console.log(`  ✔ Tìm thấy ${classSections.length} ClassSection đang mở`);

  // 3. Lấy danh sách FacultyProfile để gán giảng viên hướng dẫn
  const facultyProfiles = await prisma.facultyProfile.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  // 4. Tạo HocVien records
  let hvCreated = 0;
  let hvSkipped = 0;
  const hocVienIdMap = new Map<string, string>(); // userId -> hocVienId

  for (let i = 0; i < studentProfiles.length; i++) {
    const sp = studentProfiles[i];
    const user = sp.user;
    const seed = i + 1;

    // Kiểm tra đã tồn tại chưa (theo maHocVien)
    const existing = await prisma.hocVien.findUnique({
      where: { maHocVien: sp.maHocVien! },
    });

    if (existing) {
      hocVienIdMap.set(user.id, existing.id);
      hvSkipped++;
      continue;
    }

    const nganh = sp.nganh || pick(NGANH_LIST, seed);
    const trangThai = i < studentProfiles.length * 0.8 ? 'Đang học' : pick(TRANG_THAI_LIST, seed);
    const giangVienHuongDanId = facultyProfiles.length > 0
      ? pick(facultyProfiles, seed).id
      : null;

    const created = await prisma.hocVien.create({
      data: {
        maHocVien: sp.maHocVien!,
        hoTen: user.name,
        ngaySinh: user.dateOfBirth || new Date(`199${seed % 9}-0${(seed % 9) + 1}-${10 + (seed % 20)}`),
        gioiTinh: user.gender || (seed % 3 === 0 ? 'Nữ' : 'Nam'),
        lop: sp.lop || `K${44 + (seed % 4)}A`,
        khoaHoc: sp.khoaHoc || `K${44 + (seed % 4)}`,
        nganh,
        email: user.email,
        dienThoai: user.phone || `09${String(seed).padStart(8, '0').slice(0, 8)}`,
        diaChi: user.address || 'Học viện Hậu cần, Hà Nội',
        diemTrungBinh: randFloat(5.5, 9.2, seed * 7),
        trangThai,
        giangVienHuongDanId,
      },
    });

    hocVienIdMap.set(user.id, created.id);
    hvCreated++;
  }

  console.log(`  ✔ HocVien: tạo=${hvCreated}, bỏ qua=${hvSkipped}`);

  // 5. Tạo ClassEnrollment cho học viên đang học
  let enrollCreated = 0;
  let gradeCreated = 0;

  const danhSachHocVienDangHoc = await prisma.hocVien.findMany({
    where: { trangThai: 'Đang học' },
    select: { id: true, maHocVien: true },
  });

  console.log(`  ✔ Học viên đang học: ${danhSachHocVienDangHoc.length}`);

  if (danhSachHocVienDangHoc.length > 0 && classSections.length > 0) {
    // Mỗi học viên ghi danh 3-5 lớp học phần
    for (let i = 0; i < danhSachHocVienDangHoc.length; i++) {
      const hv = danhSachHocVienDangHoc[i];
      const numSections = 3 + (i % 3); // 3-5 lớp
      const sectionOffset = (i * 3) % classSections.length;

      for (let j = 0; j < numSections; j++) {
        const section = classSections[(sectionOffset + j) % classSections.length];
        const seed = i * 100 + j + 1;

        // Check if already enrolled
        const existingEnrollment = await prisma.classEnrollment.findUnique({
          where: { classSectionId_hocVienId: { classSectionId: section.id, hocVienId: hv.id } },
        });

        if (existingEnrollment) continue;

        // Only enroll if section has capacity
        if (section.currentStudents >= section.maxStudents) continue;

        const diemGiuaKy = randFloat(5.0, 9.5, seed);
        const diemCuoiKy = randFloat(5.0, 9.5, seed + 17);
        const diemTong = parseFloat((diemGiuaKy * 0.4 + diemCuoiKy * 0.6).toFixed(2));

        const enrollment = await prisma.classEnrollment.create({
          data: {
            classSectionId: section.id,
            hocVienId: hv.id,
            status: 'ENROLLED',
            midtermScore: diemGiuaKy,
            finalScore: diemCuoiKy,
            totalScore: diemTong,
            letterGrade: genXepLoai(diemTong),
            gradeStatus: 'GRADED',
            gradedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          },
        });
        enrollCreated++;

        // Cập nhật currentStudents
        await prisma.classSection.update({
          where: { id: section.id },
          data: { currentStudents: { increment: 1 } },
        });

        // Tạo KetQuaHocTap từ enrollment data
        const sectionName = section.name.split('-')[0].trim();
        const diemBaiTap = randFloat(5.5, 9.5, seed + 31);
        const diemChuyenCan = randFloat(6.0, 10.0, seed + 43);
        const diemGiuaKy2 = diemGiuaKy;
        const diemThi = diemCuoiKy;
        const diemTongKet = parseFloat(
          (diemChuyenCan * 0.1 + diemBaiTap * 0.15 + diemGiuaKy2 * 0.25 + diemThi * 0.5).toFixed(2)
        );

        await prisma.ketQuaHocTap.create({
          data: {
            hocVienId: hv.id,
            monHoc: sectionName,
            maMon: section.code.split('-')[0],
            diem: diemTongKet,
            diemBaiTap,
            diemChuyenCan,
            diemGiuaKy: diemGiuaKy2,
            diemThi,
            diemTongKet,
            hocKy: `HK1`,
            namHoc: '2025-2026',
            ketQua: genKetQua(diemTongKet),
            xepLoai: genXepLoai(diemTongKet),
            soTinChi: 3,
            workflowStatus: 'APPROVED',
          },
        });
        gradeCreated++;
      }
    }
  }

  console.log(`  ✔ ClassEnrollment tạo: ${enrollCreated}`);
  console.log(`  ✔ KetQuaHocTap tạo: ${gradeCreated}`);

  console.log('\n📊 TỔNG KẾT:');
  console.log(`  HocVien: ${await prisma.hocVien.count()}`);
  console.log(`  ClassEnrollment: ${await prisma.classEnrollment.count()}`);
  console.log(`  KetQuaHocTap: ${await prisma.ketQuaHocTap.count()}`);
  console.log('\n✅ Seed HocVien + Enrollment hoàn tất!');
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
