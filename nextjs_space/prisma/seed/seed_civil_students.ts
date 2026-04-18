/**
 * Seed: Sinh viên Dân sự (Civil Students)
 *
 * SEED ONLY — chỉ dùng cho dev/demo data, KHÔNG dùng cho production import.
 * Production grade write path: ClassEnrollment + ScoreHistory (UC-56).
 * KetQuaHocTap là legacy LAN model — không dùng làm template import production.
 *
 * Tạo 60 sinh viên dân sự:
 *   - trainingSystemUnitId = null  → không thuộc cơ cấu Hệ quân sự
 *   - khoaQuanLy = null            → không có đơn vị quân sự
 *   - studyMode: CHINH_QUY, TAI_CHUC, LIEN_THONG, TU_XA, VAN_BANG_2
 *   - KetQuaHocTap cho mỗi sinh viên
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_civil_students.ts
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function randFloat(min: number, max: number, seed: number): number {
  const r = Math.abs(Math.sin(seed * 7919.1 + 293.7) * 43758.5) % 1;
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

// ─── Master data ──────────────────────────────────────────────────────────────

const HO_LIST  = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ'];
const TEN_LIST = [
  'Văn Minh', 'Thị Lan', 'Văn Hùng', 'Thị Hoa', 'Văn Dũng', 'Thị Mai',
  'Văn Nam', 'Thị Yến', 'Văn Tùng', 'Thị Thu', 'Văn Phúc', 'Thị Linh',
  'Văn Trọng', 'Thị Nga', 'Văn Sơn', 'Thị Ngọc', 'Văn Đức', 'Thị Nhung',
  'Văn Khánh', 'Thị Thảo', 'Văn Bảo', 'Thị Hồng', 'Văn Tuấn', 'Thị Trang',
  'Văn Khoa', 'Thị Huyền', 'Văn Long', 'Thị Loan', 'Văn Quân', 'Thị Phương',
];

// Ngành dân sự (không phải ngành quân sự)
const NGANH_DAN_SU = [
  'Kinh tế',
  'Quản trị kinh doanh',
  'Kế toán – Kiểm toán',
  'Tài chính – Ngân hàng',
  'Công nghệ thông tin',
  'Luật kinh tế',
  'Thống kê kinh tế',
  'Quản lý nhà nước',
];

// Lớp dân sự
const LOP_DAN_SU = [
  'KT24A', 'KT24B', 'KT24C',
  'QTDN24A', 'QTDN24B',
  'KT-KT24', 'TC-NH24',
  'CNTT24A', 'CNTT24B',
  'LKT24', 'TK24', 'QLN24',
];

const STUDY_MODES_DAN_SU = [
  'CHINH_QUY', 'CHINH_QUY', 'CHINH_QUY', 'CHINH_QUY',
  'TAI_CHUC', 'TAI_CHUC',
  'LIEN_THONG', 'LIEN_THONG',
  'TU_XA',
  'VAN_BANG_2',
];

const MON_HOC_DAN_SU = [
  { ten: 'Toán cao cấp', ma: 'MATH101', tinChi: 3 },
  { ten: 'Kinh tế vi mô', ma: 'ECON101', tinChi: 3 },
  { ten: 'Kinh tế vĩ mô', ma: 'ECON102', tinChi: 3 },
  { ten: 'Kế toán đại cương', ma: 'ACCT101', tinChi: 3 },
  { ten: 'Tài chính doanh nghiệp', ma: 'FIN201', tinChi: 3 },
  { ten: 'Luật kinh tế', ma: 'LAW201', tinChi: 2 },
  { ten: 'Thống kê kinh doanh', ma: 'STAT201', tinChi: 3 },
  { ten: 'Tin học văn phòng', ma: 'IT101', tinChi: 2 },
  { ten: 'Tiếng Anh giao tiếp', ma: 'ENG201', tinChi: 3 },
  { ten: 'Quản trị học', ma: 'MGT201', tinChi: 3 },
  { ten: 'Marketing căn bản', ma: 'MKT201', tinChi: 3 },
  { ten: 'Phân tích dữ liệu', ma: 'DA301', tinChi: 3 },
];

const HOC_KY_LIST  = ['HK1/2024-2025', 'HK2/2024-2025', 'HK1/2025-2026'];
const NAM_HOC_LIST = ['2024-2025',      '2024-2025',      '2025-2026'];

const CIVIL_STUDENT_COUNT = 60;

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎓 Seeding sinh viên dân sự...\n');

  // Lấy giảng viên để gán hướng dẫn
  const faculties = await prisma.facultyProfile.findMany({
    take: 20,
    select: { id: true },
  });

  let created = 0;
  let createdKQ = 0;
  let skipped = 0;

  for (let i = 0; i < CIVIL_STUDENT_COUNT; i++) {
    const s  = i + 1;
    const ma = `SV2024${String(s).padStart(4, '0')}`;

    const existing = await prisma.hocVien.findUnique({ where: { maHocVien: ma } });
    if (existing) {
      skipped++;
      continue;
    }

    const ho    = pick(HO_LIST,  s);
    const ten   = pick(TEN_LIST, s * 3);
    const hoTen = `${ho} ${ten}`;
    const lop   = pick(LOP_DAN_SU, s);
    const nganh = pick(NGANH_DAN_SU, s * 2);
    const mode  = pick(STUDY_MODES_DAN_SU, s);
    const gpa   = randFloat(5.0, 9.5, s);
    const faculty = faculties.length > 0 ? faculties[s % faculties.length] : null;

    const namSinh = 1998 + (s % 6);
    const ngaySinh = new Date(namSinh, (s * 3) % 12, 1 + (s % 28));

    // Xác định trạng thái học tập
    let currentStatus: string;
    const roll = s % 10;
    if (roll <= 6) currentStatus = 'ACTIVE';
    else if (roll === 7) currentStatus = 'GRADUATED';
    else if (roll === 8) currentStatus = 'STUDY_DELAY';
    else currentStatus = 'DROPPED_OUT';

    const hv = await prisma.hocVien.create({
      data: {
        maHocVien: ma,
        hoTen,
        ngaySinh,
        gioiTinh: s % 4 === 0 ? 'Nữ' : 'Nam',
        lop,
        khoaHoc: `Khóa ${2021 + (s % 4)}`,
        nganh,
        email:    `${ma.toLowerCase()}@student.hvhc.edu.vn`,
        dienThoai: `09${String(20000000 + s).padStart(8, '0')}`,
        diaChi:   `${100 + (s % 50)} Đường Lê Duẩn, Hà Nội`,
        diemTrungBinh: gpa,
        trangThai: currentStatus === 'ACTIVE' ? 'Đang học' : 'Tốt nghiệp',
        currentStatus: currentStatus as any,
        studyMode: mode,
        ngayNhapHoc: new Date(`${2021 + (s % 3)}-09-01`),
        // Không có cơ cấu quân sự
        trainingSystemUnitId: null,
        battalionUnitId: null,
        khoaQuanLy: null,
        giangVienHuongDanId: faculty?.id ?? null,
      },
    });

    created++;

    // Tạo KetQuaHocTap
    const numMon = 4 + (s % 6);
    let diemList: number[] = [];

    for (let j = 0; j < numMon; j++) {
      const mon      = pick(MON_HOC_DAN_SU, s * 7 + j);
      const hkIdx    = j % HOC_KY_LIST.length;
      const diemQT   = randFloat(5.0, 10.0, s * 11 + j);
      const diemThi  = randFloat(5.0, 10.0, s * 13 + j);
      const diemTK   = parseFloat((diemQT * 0.4 + diemThi * 0.6).toFixed(2));
      const diemGK   = randFloat(5.0, 10.0, s * 17 + j);

      await prisma.ketQuaHocTap.create({
        data: {
          hocVienId:    hv.id,
          monHoc:       mon.ten,
          maMon:        mon.ma,
          diem:         diemTK,
          diemQuaTrinh: diemQT,
          diemThi,
          diemGiuaKy:   diemGK,
          diemTongKet:  diemTK,
          soTinChi:     mon.tinChi,
          hocKy:        HOC_KY_LIST[hkIdx],
          namHoc:       NAM_HOC_LIST[hkIdx],
          ketQua:       genKetQua(diemTK),
          xepLoai:      genXepLoai(diemTK),
          workflowStatus: 'APPROVED',
        },
      });
      diemList.push(diemTK);
      createdKQ++;
    }

    // Cập nhật GPA trung bình thực tế
    if (diemList.length > 0) {
      const avg = diemList.reduce((a, b) => a + b, 0) / diemList.length;
      await prisma.hocVien.update({
        where: { id: hv.id },
        data: { diemTrungBinh: parseFloat(avg.toFixed(2)) },
      });
    }
  }

  // Thống kê
  const totalCivil = await prisma.hocVien.count({
    where: { deletedAt: null, trainingSystemUnitId: null, khoaQuanLy: null },
  });
  const totalMilitary = await prisma.hocVien.count({
    where: {
      deletedAt: null,
      OR: [
        { trainingSystemUnitId: { not: null } },
        { khoaQuanLy: { not: null } },
      ],
    },
  });

  console.log('\n===== SEED CIVIL STUDENTS SUMMARY =====');
  console.log(`Sinh viên dân sự tạo mới: ${created}`);
  console.log(`Sinh viên dân sự bỏ qua:  ${skipped}`);
  console.log(`KetQuaHocTap tạo:         ${createdKQ}`);
  console.log('---');
  console.log(`Tổng dân sự trong DB:     ${totalCivil}`);
  console.log(`Tổng quân sự trong DB:    ${totalMilitary}`);
  console.log('========================================\n');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
