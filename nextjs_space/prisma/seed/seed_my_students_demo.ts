/**
 * Seed: My Students Demo Data
 *
 * Mục tiêu:
 *   Tạo dữ liệu đủ để test trang /dashboard/faculty/my-students
 *   với BẤT KỲ tài khoản demo nào có quyền FACULTY.VIEW:
 *     - giangvien@demo.hvhc.edu.vn   (GIANG_VIEN)
 *     - chunhiem@demo.hvhc.edu.vn    (CHU_NHIEM_BO_MON)
 *     - nghiencuu@demo.hvhc.edu.vn   (NGHIEN_CUU_VIEN)
 *     - truongkhoa@demo.hvhc.edu.vn  (TRUONG_KHOA)
 *
 * Mỗi account được cấp:
 *   - 1 FacultyProfile (upsert nếu đã có)
 *   - 12 HocVien (prefix DEMO_<ACCOUNT>_) phân bố Xuất sắc/Giỏi/Khá/Trung bình/Yếu
 *   - KetQuaHocTap với workflowStatus = APPROVED cho mỗi học viên
 *
 * Chạy:
 *   npx tsx --require dotenv/config prisma/seed/seed_my_students_demo.ts
 *
 * Idempotent: chạy lại nhiều lần không tạo trùng.
 */

import { PrismaClient, GradeWorkflowStatus } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// ─── Reference data ───────────────────────────────────────────────────────────

const MON_HOC_LIST = [
  { ten: 'Toán cao cấp',         ma: 'MATH101', tinChi: 3 },
  { ten: 'Vật lý đại cương',     ma: 'PHYS101', tinChi: 3 },
  { ten: 'Lý luận chính trị',    ma: 'CT101',   tinChi: 3 },
  { ten: 'Tin học đại cương',    ma: 'IT101',   tinChi: 2 },
  { ten: 'Tiếng Anh cơ bản',     ma: 'ENG101',  tinChi: 3 },
  { ten: 'Kỹ thuật hậu cần',     ma: 'HC201',   tinChi: 4 },
  { ten: 'Quản lý quân nhu',     ma: 'QN201',   tinChi: 3 },
  { ten: 'Tài chính quân sự',    ma: 'TC201',   tinChi: 3 },
  { ten: 'Vận tải quân sự',      ma: 'VT201',   tinChi: 4 },
  { ten: 'An toàn thông tin',    ma: 'AT501',   tinChi: 3 },
  { ten: 'Cơ sở dữ liệu',       ma: 'DB301',   tinChi: 3 },
  { ten: 'Hậu cần chiến đấu',   ma: 'HC401',   tinChi: 2 },
] as const;

const HOC_KY_NAM_HOC = [
  { hocKy: 'HK1', namHoc: '2023-2024' },
  { hocKy: 'HK2', namHoc: '2023-2024' },
  { hocKy: 'HK1', namHoc: '2024-2025' },
  { hocKy: 'HK2', namHoc: '2024-2025' },
] as const;

const LOP_LIST   = ['HC25A', 'HC25B', 'HC26A', 'QN25', 'VT25', 'TC25'];
const NGANH_LIST = ['Hậu cần chiến đấu', 'Quân nhu', 'Vận tải Quân sự', 'Tài chính Quân sự'];
const KHOA_LIST  = ['Khóa 2022', 'Khóa 2023', 'Khóa 2024'];
const HO_LIST    = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ'];
const TEN_LIST   = [
  'Văn Minh', 'Thị Lan', 'Văn Hùng', 'Thị Hoa', 'Văn Dũng',
  'Văn Nam',  'Thị Yến', 'Văn Tùng', 'Thị Thu', 'Văn Phúc',
  'Thị Linh', 'Văn Trọng',
];

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function makeScore(min: number, max: number, seed: number): number {
  const r = Math.abs(Math.sin(seed * 7919 + 1234) * 9999) % 1;
  return parseFloat((min + r * (max - min)).toFixed(2));
}

// ─── Per-account student definitions ─────────────────────────────────────────
// 12 students per account: 2 Xuất sắc, 3 Giỏi, 3 Khá, 2 Trung bình, 2 Yếu

interface StudentDef {
  suffix: string; // unique id suffix, e.g. '001'
  hoIdx: number;
  tenIdx: number;
  lopIdx: number;
  nganhIdx: number;
  khoaIdx: number;
  gioiTinh: 'Nam' | 'Nữ';
  trangThai: string;
  gpaMin: number;
  gpaMax: number;
  numMon: number;
}

const STUDENT_DEFS: StudentDef[] = [
  // Xuất sắc
  { suffix: '01', hoIdx: 0, tenIdx: 0,  lopIdx: 0, nganhIdx: 0, khoaIdx: 0, gioiTinh: 'Nam', trangThai: 'Đang học', gpaMin: 9.2, gpaMax: 9.8, numMon: 8 },
  { suffix: '02', hoIdx: 1, tenIdx: 1,  lopIdx: 1, nganhIdx: 1, khoaIdx: 1, gioiTinh: 'Nữ', trangThai: 'Đang học', gpaMin: 9.0, gpaMax: 9.5, numMon: 7 },
  // Giỏi
  { suffix: '03', hoIdx: 2, tenIdx: 2,  lopIdx: 2, nganhIdx: 2, khoaIdx: 0, gioiTinh: 'Nam', trangThai: 'Đang học', gpaMin: 8.5, gpaMax: 8.9, numMon: 8 },
  { suffix: '04', hoIdx: 3, tenIdx: 3,  lopIdx: 3, nganhIdx: 3, khoaIdx: 2, gioiTinh: 'Nữ', trangThai: 'Đang học', gpaMin: 8.1, gpaMax: 8.5, numMon: 7 },
  { suffix: '05', hoIdx: 4, tenIdx: 4,  lopIdx: 4, nganhIdx: 0, khoaIdx: 1, gioiTinh: 'Nam', trangThai: 'Đang học', gpaMin: 8.0, gpaMax: 8.4, numMon: 6 },
  // Khá
  { suffix: '06', hoIdx: 5, tenIdx: 5,  lopIdx: 5, nganhIdx: 1, khoaIdx: 0, gioiTinh: 'Nam', trangThai: 'Đang học', gpaMin: 7.5, gpaMax: 7.9, numMon: 7 },
  { suffix: '07', hoIdx: 6, tenIdx: 6,  lopIdx: 0, nganhIdx: 2, khoaIdx: 2, gioiTinh: 'Nữ', trangThai: 'Đang học', gpaMin: 7.0, gpaMax: 7.5, numMon: 8 },
  { suffix: '08', hoIdx: 7, tenIdx: 7,  lopIdx: 1, nganhIdx: 3, khoaIdx: 1, gioiTinh: 'Nam', trangThai: 'Bảo lưu',  gpaMin: 6.5, gpaMax: 7.2, numMon: 5 },
  // Trung bình
  { suffix: '09', hoIdx: 8, tenIdx: 8,  lopIdx: 2, nganhIdx: 0, khoaIdx: 0, gioiTinh: 'Nam', trangThai: 'Đang học', gpaMin: 5.5, gpaMax: 6.2, numMon: 8 },
  { suffix: '10', hoIdx: 9, tenIdx: 9,  lopIdx: 3, nganhIdx: 1, khoaIdx: 2, gioiTinh: 'Nữ', trangThai: 'Đang học', gpaMin: 5.0, gpaMax: 5.8, numMon: 7 },
  // Yếu
  { suffix: '11', hoIdx: 0, tenIdx: 10, lopIdx: 4, nganhIdx: 2, khoaIdx: 1, gioiTinh: 'Nam', trangThai: 'Đang học', gpaMin: 3.5, gpaMax: 4.8, numMon: 7 },
  { suffix: '12', hoIdx: 1, tenIdx: 11, lopIdx: 5, nganhIdx: 3, khoaIdx: 0, gioiTinh: 'Nữ', trangThai: 'Đang học', gpaMin: 2.5, gpaMax: 4.5, numMon: 6 },
];

// ─── Demo accounts to provision ───────────────────────────────────────────────

const DEMO_FACULTY_ACCOUNTS = [
  {
    email: 'giangvien@demo.hvhc.edu.vn',
    prefix: 'DEMO_MS',
    degree: 'Thạc sĩ',
    specialization: 'Hệ thống thông tin',
    title: 'Giảng viên',
  },
  {
    email: 'chunhiem@demo.hvhc.edu.vn',
    prefix: 'DEMO_CNM',
    degree: 'Tiến sĩ',
    specialization: 'Khoa học máy tính',
    title: 'Chủ nhiệm bộ môn',
  },
  {
    email: 'nghiencuu@demo.hvhc.edu.vn',
    prefix: 'DEMO_NCV',
    degree: 'Tiến sĩ',
    specialization: 'Khoa học dữ liệu',
    title: 'Nghiên cứu viên',
  },
  {
    email: 'truongkhoa@demo.hvhc.edu.vn',
    prefix: 'DEMO_TK',
    degree: 'Tiến sĩ',
    specialization: 'An ninh mạng',
    title: 'Trưởng khoa',
  },
];

// ─── Core provisioning function ───────────────────────────────────────────────

async function provisionFacultyAccount(account: typeof DEMO_FACULTY_ACCOUNTS[number]) {
  const user = await prisma.user.findUnique({
    where: { email: account.email },
    include: { facultyProfile: true },
  });

  if (!user) {
    console.log(`  ⚠️  Không tìm thấy user ${account.email} – bỏ qua`);
    return { created: 0, skipped: 0 };
  }

  // Upsert FacultyProfile
  let profile = user.facultyProfile;
  if (!profile) {
    profile = await prisma.facultyProfile.create({
      data: {
        userId: user.id,
        unitId: user.unitId ?? null,
        academicDegree: account.degree,
        specialization: account.specialization,
        researchInterests: `Nghiên cứu ứng dụng ${account.specialization} trong giáo dục quân sự`,
        teachingSubjects: ['Tin học đại cương', 'Cơ sở dữ liệu', 'An toàn thông tin'],
        teachingExperience: 6,
        industryExperience: 2,
        researchProjects: 3,
        publications: 5,
        citations: 15,
        biography: `${user.name} – ${account.title}, Học viện Hậu cần`,
        achievements: ['Chiến sĩ thi đua cấp cơ sở', 'Tham gia đề tài cấp cơ sở'],
        certifications: ['Chứng chỉ nghiệp vụ sư phạm'],
        isActive: true,
        isPublic: true,
      },
    });
    console.log(`  ✅ Created FacultyProfile for ${account.email}`);
  } else {
    console.log(`  ♻️  FacultyProfile already exists for ${account.email}`);
  }

  // Create students
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < STUDENT_DEFS.length; i++) {
    const def = STUDENT_DEFS[i];
    const maHocVien = `${account.prefix}_${def.suffix}`;
    const seed = i + 1;

    const exists = await prisma.hocVien.findUnique({ where: { maHocVien } });
    if (exists) { skipped++; continue; }

    const hoTen = `${HO_LIST[def.hoIdx]} ${TEN_LIST[def.tenIdx]}`;

    const hocVien = await prisma.hocVien.create({
      data: {
        maHocVien,
        hoTen,
        ngaySinh: new Date(2001 + (seed % 4), (seed * 3) % 12, 1 + (seed % 28)),
        gioiTinh: def.gioiTinh,
        lop: pick(LOP_LIST, def.lopIdx),
        khoaHoc: pick(KHOA_LIST, def.khoaIdx),
        nganh: pick(NGANH_LIST, def.nganhIdx),
        email: `${maHocVien.toLowerCase()}@student.hvhc.edu.vn`,
        dienThoai: `09${String(30000000 + i * 100 + DEMO_FACULTY_ACCOUNTS.indexOf(account) * 1000).padStart(8, '0')}`,
        trangThai: def.trangThai,
        diemTrungBinh: 0,
        giangVienHuongDanId: profile!.id,
        currentStatus: def.trangThai === 'Bảo lưu' ? 'STUDY_DELAY' : 'ACTIVE',
      },
    });

    // Create APPROVED grades
    let totalScore = 0;
    let gradeCount = 0;

    for (let j = 0; j < def.numMon; j++) {
      const mon = MON_HOC_LIST[j % MON_HOC_LIST.length];
      const hkEntry = HOC_KY_NAM_HOC[j % HOC_KY_NAM_HOC.length];
      const diemTK = makeScore(def.gpaMin, def.gpaMax, seed * 31 + j + DEMO_FACULTY_ACCOUNTS.indexOf(account) * 100);
      const diemQT = makeScore(Math.max(0, def.gpaMin - 0.5), Math.min(10, def.gpaMax + 0.5), seed * 17 + j);
      const diemThi = makeScore(Math.max(0, def.gpaMin - 1.0), Math.min(10, def.gpaMax + 0.5), seed * 23 + j);
      const now = new Date();
      const approvedAt = new Date(now.getTime() - (j + 1) * 7 * 24 * 60 * 60 * 1000);

      await prisma.ketQuaHocTap.create({
        data: {
          hocVienId: hocVien.id,
          monHoc: mon.ten,
          maMon: mon.ma,
          soTinChi: mon.tinChi,
          diem: diemTK,
          diemQuaTrinh: diemQT,
          diemThi,
          diemGiuaKy: makeScore(def.gpaMin - 0.5, def.gpaMax + 0.5, seed * 13 + j),
          diemTongKet: diemTK,
          hocKy: hkEntry.hocKy,
          namHoc: hkEntry.namHoc,
          ketQua:  diemTK >= 9.0 ? 'Xuất sắc' : diemTK >= 8.0 ? 'Giỏi' : diemTK >= 6.5 ? 'Khá' : diemTK >= 5.0 ? 'Trung bình' : 'Yếu',
          xepLoai: diemTK >= 9.0 ? 'A+' : diemTK >= 8.5 ? 'A' : diemTK >= 8.0 ? 'B+' : diemTK >= 7.0 ? 'B' : diemTK >= 6.5 ? 'C+' : diemTK >= 5.5 ? 'C' : diemTK >= 5.0 ? 'D' : 'F',
          workflowStatus: GradeWorkflowStatus.APPROVED,
          approvedAt,
          approvedBy: user.id,
          submittedAt: new Date(approvedAt.getTime() - 2 * 24 * 60 * 60 * 1000),
          submittedBy: user.id,
        },
      });
      totalScore += diemTK;
      gradeCount++;
    }

    const avgGpa = gradeCount > 0 ? parseFloat((totalScore / gradeCount).toFixed(2)) : 0;
    await prisma.hocVien.update({ where: { id: hocVien.id }, data: { diemTrungBinh: avgGpa } });

    const standing = avgGpa >= 9.0 ? 'Xuất sắc' : avgGpa >= 8.0 ? 'Giỏi' : avgGpa >= 6.5 ? 'Khá' : avgGpa >= 5.0 ? 'Trung bình' : 'Yếu';
    console.log(`    ${maHocVien.padEnd(16)} ${hoTen.padEnd(20)} GPA: ${avgGpa.toFixed(2)} (${standing})`);
    created++;
  }

  return { created, skipped };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎓 Seeding My Students demo data (all faculty demo accounts)...\n');

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const account of DEMO_FACULTY_ACCOUNTS) {
    console.log(`\n👤 ${account.email}`);
    const { created, skipped } = await provisionFacultyAccount(account);
    totalCreated += created;
    totalSkipped += skipped;
    console.log(`   → ${created} students created, ${skipped} skipped`);
  }

  console.log('\n════════════════════════════════════════════════════');
  console.log(`Total: ${totalCreated} students created, ${totalSkipped} already existed`);
  console.log('\nTest accounts (password: Demo@2025):');
  for (const acc of DEMO_FACULTY_ACCOUNTS) {
    const u = await prisma.user.findUnique({
      where: { email: acc.email },
      include: { facultyProfile: { include: { _count: { select: { hocVienHuongDan: true } } } } }
    });
    const count = u?.facultyProfile?._count?.hocVienHuongDan ?? 0;
    console.log(`  ${acc.email.padEnd(38)} → ${count} students`);
  }
  console.log('════════════════════════════════════════════════════');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
