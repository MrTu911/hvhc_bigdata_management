/**
 * Seed: HocVien + ClassEnrollment + KetQuaHocTap (v2)
 * Phù hợp với schema hiện tại – không có userId trong hoc_vien
 */
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const NGANH_LIST = [
  'Hậu cần chiến đấu', 'Quân nhu', 'Vận tải Quân sự',
  'Xăng dầu', 'Tài chính Quân sự', 'Khoa học cơ bản', 'Chỉ huy hậu cần',
];
const LOP_LIST = [
  'HC25A', 'HC25B', 'HC26A', 'HC26B', 'QN25', 'VT25', 'XD25',
  'TC25', 'HC24A', 'HC24B', 'QN24', 'VT24',
];
const TRANG_THAI_LIST = [
  'Đang học', 'Đang học', 'Đang học', 'Đang học',
  'Tốt nghiệp', 'Bảo lưu',
];

function pick<T>(arr: T[], seed: number): T { return arr[Math.abs(seed) % arr.length]; }
function randFloat(min: number, max: number, s: number): number {
  const r = Math.abs(Math.sin(s * 7919) * 9999) % 1;
  return parseFloat((min + r * (max - min)).toFixed(2));
}
function genKetQua(d: number) {
  if (d >= 9.0) return 'Xuất sắc';
  if (d >= 8.0) return 'Giỏi';
  if (d >= 7.0) return 'Khá';
  if (d >= 5.0) return 'Trung bình';
  return 'Yếu';
}
function genXepLoai(d: number) {
  if (d >= 9.0) return 'A+'; if (d >= 8.5) return 'A';
  if (d >= 8.0) return 'B+'; if (d >= 7.0) return 'B';
  if (d >= 6.5) return 'C+'; if (d >= 5.5) return 'C';
  if (d >= 5.0) return 'D'; return 'F';
}

const HO_LIST = ['Nguyễn','Trần','Lê','Phạm','Hoàng','Vũ','Đặng','Bùi','Đỗ','Hồ'];
const TEN_LIST = [
  'Văn Minh','Thị Lan','Văn Hùng','Thị Hoa','Văn Dũng','Thị Mai',
  'Văn Nam','Thị Yến','Văn Tùng','Thị Thu','Văn Phúc','Thị Linh',
  'Văn Trọng','Thị Nga','Văn Sơn','Thị Ngọc','Văn Đức','Thị Nhung',
  'Văn Khánh','Thị Thảo','Văn Bảo','Thị Hồng','Văn Tuấn','Thị Trang',
];

const MON_HOC_LIST = [
  { ten: 'Toán cao cấp', ma: 'MATH101', tinChi: 3 },
  { ten: 'Vật lý đại cương', ma: 'PHYS101', tinChi: 3 },
  { ten: 'Hóa học đại cương', ma: 'CHEM101', tinChi: 2 },
  { ten: 'Giáo dục quốc phòng', ma: 'QP101', tinChi: 4 },
  { ten: 'Tiếng Anh cơ bản', ma: 'ENG101', tinChi: 3 },
  { ten: 'Lý luận chính trị', ma: 'CT101', tinChi: 3 },
  { ten: 'Tin học đại cương', ma: 'IT101', tinChi: 2 },
  { ten: 'Kỹ thuật hậu cần', ma: 'HC201', tinChi: 4 },
  { ten: 'Quản lý quân nhu', ma: 'QN201', tinChi: 3 },
  { ten: 'Tài chính quân sự', ma: 'TC201', tinChi: 3 },
  { ten: 'Vận tải quân sự', ma: 'VT201', tinChi: 4 },
  { ten: 'Xăng dầu quân sự', ma: 'XD201', tinChi: 3 },
];

const HOC_KY_LIST = ['HK1/2024-2025', 'HK2/2024-2025', 'HK1/2025-2026'];
const NAM_HOC_LIST = ['2024-2025', '2024-2025', '2025-2026'];

async function main() {
  console.log('🎓 Seeding HocVien + KetQuaHocTap v2...');

  // Lấy danh sách faculty để làm giảng viên hướng dẫn
  const faculties = await prisma.facultyProfile.findMany({
    take: 30,
    select: { id: true },
  });
  const classSections = await prisma.classSection.findMany({
    take: 50,
    select: { id: true, code: true },
  });

  const HOC_VIEN_COUNT = 120;
  let createdHV = 0, createdKQ = 0, createdEnroll = 0;

  for (let i = 0; i < HOC_VIEN_COUNT; i++) {
    const s = i + 1;
    const maHV = `HV2024${String(s).padStart(4, '0')}`;

    const existing = await prisma.hocVien.findUnique({ where: { maHocVien: maHV } });
    if (existing) continue;

    const ho = pick(HO_LIST, s);
    const ten = pick(TEN_LIST, s * 3);
    const hoTen = `${ho} ${ten}`;
    const lop = pick(LOP_LIST, s);
    const nganh = pick(NGANH_LIST, s * 2);
    const trangThai = pick(TRANG_THAI_LIST, s);
    const diem = randFloat(5.5, 9.8, s);
    const faculty = faculties.length > 0 ? faculties[s % faculties.length] : null;

    const namSinh = 2000 + (s % 6); // 2000-2005
    const ngaySinh = new Date(namSinh, (s * 3) % 12, 1 + (s % 28));

    const hv = await prisma.hocVien.create({
      data: {
        maHocVien: maHV,
        hoTen,
        ngaySinh,
        gioiTinh: s % 3 === 0 ? 'Nữ' : 'Nam',
        lop,
        khoaHoc: `Khóa ${2022 + (s % 4)}`,
        nganh,
        email: `${maHV.toLowerCase()}@student.hvhc.edu.vn`,
        dienThoai: `09${String(10000000 + s).padStart(8, '0')}`,
        diaChi: `Phòng ${100 + (s % 50)}, Ký túc xá HVHC`,
        diemTrungBinh: diem,
        trangThai,
        giangVienHuongDanId: faculty?.id ?? null,
      },
    });

    createdHV++;

    // Tạo kết quả học tập cho nhiều môn
    const numMon = 4 + (s % 6); // 4–9 môn
    for (let j = 0; j < numMon; j++) {
      const mon = pick(MON_HOC_LIST, s * 7 + j);
      const hkIdx = j % HOC_KY_LIST.length;
      const diemQT = randFloat(5.0, 10.0, s * 11 + j);
      const diemThi = randFloat(5.0, 10.0, s * 13 + j);
      const diemTK = parseFloat((diemQT * 0.4 + diemThi * 0.6).toFixed(2));
      const diemGiuaKy = randFloat(5.0, 10.0, s * 17 + j);

      await prisma.ketQuaHocTap.create({
        data: {
          hocVienId: hv.id,
          monHoc: mon.ten,
          maMon: mon.ma,
          diem: diemTK,
          diemQuaTrinh: diemQT,
          diemThi,
          diemGiuaKy,
          diemTongKet: diemTK,
          soTinChi: mon.tinChi,
          hocKy: HOC_KY_LIST[hkIdx],
          namHoc: NAM_HOC_LIST[hkIdx],
          ketQua: genKetQua(diemTK),
          xepLoai: genXepLoai(diemTK),
          workflowStatus: diemTK >= 5 ? 'APPROVED' : 'APPROVED',
        },
      });
      createdKQ++;
    }

    // Ghi danh vào class section
    if (classSections.length > 0) {
      const section = classSections[s % classSections.length];
      const existing = await prisma.classEnrollment.findUnique({
        where: { classSectionId_hocVienId: { classSectionId: section.id, hocVienId: hv.id } },
      });
      if (!existing) {
        const diemGK = randFloat(5.0, 10.0, s * 19);
        const diemCK = randFloat(5.0, 10.0, s * 23);
        const total = parseFloat((diemGK * 0.4 + diemCK * 0.6).toFixed(2));
        await prisma.classEnrollment.create({
          data: {
            classSectionId: section.id,
            hocVienId: hv.id,
            status: 'ENROLLED',
            midtermScore: diemGK,
            finalScore: diemCK,
            totalScore: total,
            letterGrade: genXepLoai(total),
            gradeStatus: 'GRADED',
          },
        });
        createdEnroll++;
      }
    }
  }

  // Update diemTrungBinh based on actual grades
  const allHV = await prisma.hocVien.findMany({ select: { id: true } });
  for (const hv of allHV) {
    const grades = await prisma.ketQuaHocTap.findMany({
      where: { hocVienId: hv.id },
      select: { diem: true },
    });
    if (grades.length > 0) {
      const avg = grades.reduce((sum, g) => sum + (g.diem || 0), 0) / grades.length;
      await prisma.hocVien.update({
        where: { id: hv.id },
        data: { diemTrungBinh: parseFloat(avg.toFixed(2)) },
      });
    }
  }

  const totalHV = await prisma.hocVien.count();
  const totalKQ = await prisma.ketQuaHocTap.count();
  const totalEnroll = await prisma.classEnrollment.count();

  console.log('\n===== SEED SUMMARY =====');
  console.log(`HocVien created:      ${createdHV}`);
  console.log(`KetQuaHocTap created: ${createdKQ}`);
  console.log(`ClassEnrollment:      ${createdEnroll}`);
  console.log('--- DB TOTALS ---');
  console.log(`HocVien:              ${totalHV}`);
  console.log(`KetQuaHocTap:         ${totalKQ}`);
  console.log(`ClassEnrollment:      ${totalEnroll}`);
  console.log('========================\n');
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
