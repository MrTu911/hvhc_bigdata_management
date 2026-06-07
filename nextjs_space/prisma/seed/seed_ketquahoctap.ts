/**
 * Seed: KetQuaHocTap (điểm học tập chính thức M10 — nguồn cho GPA/transcript/AI)
 *
 * Lý do tồn tại riêng (không gộp vào seed_hocvien_v2.ts):
 *   seed_hocvien_v2.ts chỉ tạo KetQuaHocTap BÊN TRONG nhánh "tạo HocVien mới",
 *   nên DB đã có học viên thì không bao giờ tạo điểm được (idempotency gap) →
 *   ket_qua_hoc_tap = 0 dù có 278 học viên.
 *
 *   KetQuaHocTap vẫn là nguồn ĐỌC active của rất nhiều tính năng:
 *     - lib/services/student/student-gpa.service.ts (rebuild GPA, lọc workflowStatus=APPROVED)
 *     - app/api/education/{gpa,transcript,students/[id]/profile360}
 *     - app/api/ai/{predict-risk,student-trends,anomaly,reports,recommendations}
 *     - app/api/dashboard/{student/*,training,kpis/realtime,instructor/courses}
 *     - faculty EIS / teaching-analytics
 *   => Để trống làm hỏng demo các tính năng trên.
 *
 * Idempotent: bỏ qua học viên đã có ít nhất 1 bản ghi điểm.
 * Điểm sinh quanh diemTrungBinh hiện có để GPA rebuild khớp với hồ sơ học viên.
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_ketquahoctap.ts
 */
import { PrismaClient, GradeWorkflowStatus } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

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

function pick<T>(arr: T[], seed: number): T { return arr[Math.abs(seed) % arr.length]; }

/** Điểm dao động quanh `center`, kẹp trong [3.0, 10.0], 1 chữ số thập phân. */
function gradeAround(center: number, seed: number): number {
  const jitter = (Math.abs(Math.sin(seed * 7919) * 9999) % 1) * 2 - 1; // [-1, 1]
  return parseFloat(Math.min(10, Math.max(3.0, center + jitter * 1.2)).toFixed(1));
}

function genKetQua(d: number): string {
  if (d >= 9.0) return 'Xuất sắc';
  if (d >= 8.0) return 'Giỏi';
  if (d >= 7.0) return 'Khá';
  if (d >= 5.0) return 'Trung bình';
  return 'Yếu';
}
function genXepLoai(d: number): string {
  if (d >= 9.0) return 'A+'; if (d >= 8.5) return 'A';
  if (d >= 8.0) return 'B+'; if (d >= 7.0) return 'B';
  if (d >= 6.5) return 'C+'; if (d >= 5.5) return 'C';
  if (d >= 5.0) return 'D'; return 'F';
}

async function main() {
  console.log('📚 Seeding KetQuaHocTap (điểm học tập chính thức M10)...\n');

  const students = await prisma.hocVien.findMany({
    where: { deletedAt: null },
    select: { id: true, maHocVien: true, diemTrungBinh: true },
    orderBy: { maHocVien: 'asc' },
  });
  if (students.length === 0) throw new Error('Không có HocVien. Chạy seed_hocvien_v2.ts trước.');

  // Idempotency: học viên đã có điểm thì bỏ qua.
  const withGrades = new Set(
    (await prisma.ketQuaHocTap.groupBy({ by: ['hocVienId'] })).map(r => r.hocVienId)
  );

  let createdRecords = 0;
  let studentsSeeded = 0;
  let skipped = 0;

  for (let i = 0; i < students.length; i++) {
    const hv = students[i];
    if (withGrades.has(hv.id)) { skipped++; continue; }

    const center = hv.diemTrungBinh && hv.diemTrungBinh >= 3 ? hv.diemTrungBinh : 7.0;
    const numMon = 5 + (i % 5); // 5–9 môn

    const data = [];
    for (let j = 0; j < numMon; j++) {
      const mon = pick(MON_HOC_LIST, i * 7 + j);
      const hkIdx = j % HOC_KY_LIST.length;
      const diemChuyenCan = gradeAround(center, i * 101 + j * 3);
      const diemBaiTap = gradeAround(center, i * 103 + j * 5);
      const diemGiuaKy = gradeAround(center, i * 107 + j * 7);
      const diemThi = gradeAround(center, i * 109 + j * 11);
      const diemQuaTrinh = parseFloat(((diemChuyenCan + diemBaiTap + diemGiuaKy) / 3).toFixed(2));
      // Tổng kết: quá trình 40% + thi 60%
      const diemTongKet = parseFloat((diemQuaTrinh * 0.4 + diemThi * 0.6).toFixed(2));

      data.push({
        hocVienId: hv.id,
        monHoc: mon.ten,
        maMon: mon.ma,
        soTinChi: mon.tinChi,
        diem: diemTongKet,
        diemQuaTrinh,
        diemThi,
        diemGiuaKy,
        diemBaiTap,
        diemChuyenCan,
        diemTongKet,
        hocKy: HOC_KY_LIST[hkIdx],
        namHoc: NAM_HOC_LIST[hkIdx],
        ketQua: genKetQua(diemTongKet),
        xepLoai: genXepLoai(diemTongKet),
        workflowStatus: GradeWorkflowStatus.APPROVED, // GPA service chỉ tính bản ghi APPROVED
        approvedAt: new Date('2025-06-20'),
      });
    }

    await prisma.ketQuaHocTap.createMany({ data });
    createdRecords += data.length;
    studentsSeeded++;
  }

  const total = await prisma.ketQuaHocTap.count();
  console.log('===== KETQUAHOCTAP SUMMARY =====');
  console.log(`Học viên xét:            ${students.length}`);
  console.log(`Học viên seed điểm mới:  ${studentsSeeded}`);
  console.log(`Bỏ qua (đã có điểm):     ${skipped}`);
  console.log(`Bản ghi điểm tạo mới:    ${createdRecords}`);
  console.log(`--- DB TOTAL KetQuaHocTap: ${total} ---`);
  console.log('================================\n');
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
