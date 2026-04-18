/**
 * Seed: Bổ sung KetQuaHocTap cho học viên chưa có điểm
 *
 * SEED ONLY — chỉ dùng cho dev/demo data, KHÔNG dùng cho production import.
 * Production grade write path: ClassEnrollment + ScoreHistory (UC-56).
 * KetQuaHocTap là legacy LAN model — không dùng làm template import production.
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_missing_grades.ts
 */
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

function pick<T>(arr: T[], seed: number): T { return arr[Math.abs(seed) % arr.length]; }
function randFloat(min: number, max: number, seed: number): number {
  const r = Math.abs(Math.sin(seed * 7919.1 + 293.7) * 43758.5) % 1;
  return parseFloat((min + r * (max - min)).toFixed(2));
}
function genKetQua(d: number) {
  if (d >= 9) return 'Xuất sắc';
  if (d >= 8) return 'Giỏi';
  if (d >= 7) return 'Khá';
  if (d >= 5) return 'Trung bình';
  return 'Yếu';
}
function genXepLoai(d: number) {
  if (d >= 9)   return 'A+';
  if (d >= 8.5) return 'A';
  if (d >= 8)   return 'B+';
  if (d >= 7)   return 'B';
  if (d >= 6.5) return 'C+';
  if (d >= 5.5) return 'C';
  if (d >= 5)   return 'D';
  return 'F';
}

const MON_LIST = [
  { ten: 'Chiến thuật hậu cần', ma: 'HC301', tinChi: 4 },
  { ten: 'Quản lý hậu cần', ma: 'HC302', tinChi: 3 },
  { ten: 'Kỹ thuật vũ khí', ma: 'QS201', tinChi: 3 },
  { ten: 'Chính trị quân sự', ma: 'CT201', tinChi: 3 },
  { ten: 'Tiếng Anh quân sự', ma: 'ENG301', tinChi: 3 },
  { ten: 'Toán ứng dụng', ma: 'MATH201', tinChi: 3 },
  { ten: 'Công nghệ thông tin', ma: 'IT201', tinChi: 2 },
  { ten: 'Quân nhu chiến đấu', ma: 'QN301', tinChi: 4 },
];
const HOC_KY  = ['HK1/2024-2025', 'HK2/2024-2025', 'HK1/2025-2026'];
const NAM_HOC = ['2024-2025',      '2024-2025',      '2025-2026'];

async function main() {
  const missing = await prisma.$queryRaw<{ id: string; maHocVien: string }[]>`
    SELECT hv.id, hv."maHocVien"
    FROM hoc_vien hv
    LEFT JOIN ket_qua_hoc_tap kq ON kq."hocVienId" = hv.id
    WHERE hv."deletedAt" IS NULL AND kq.id IS NULL
    ORDER BY hv."maHocVien"
  `;

  console.log(`Học viên thiếu KetQuaHocTap: ${missing.length}`);
  let created = 0;

  for (let i = 0; i < missing.length; i++) {
    const hv    = missing[i];
    const s     = i + 1;
    const numMon = 4 + (s % 4);
    const diemList: number[] = [];

    for (let j = 0; j < numMon; j++) {
      const mon     = pick(MON_LIST, s * 7 + j);
      const hkIdx   = j % 3;
      const diemQT  = randFloat(5.5, 10.0, s * 11 + j);
      const diemThi = randFloat(5.5, 10.0, s * 13 + j);
      const diemTK  = parseFloat((diemQT * 0.4 + diemThi * 0.6).toFixed(2));
      const diemGK  = randFloat(5.5, 10.0, s * 17 + j);

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
          hocKy:        HOC_KY[hkIdx],
          namHoc:       NAM_HOC[hkIdx],
          ketQua:       genKetQua(diemTK),
          xepLoai:      genXepLoai(diemTK),
          workflowStatus: 'APPROVED',
        },
      });
      diemList.push(diemTK);
      created++;
    }

    if (diemList.length > 0) {
      const avg = diemList.reduce((a, b) => a + b, 0) / diemList.length;
      await prisma.hocVien.update({
        where: { id: hv.id },
        data: { diemTrungBinh: parseFloat(avg.toFixed(2)) },
      });
    }
  }

  const totalKQ = await prisma.ketQuaHocTap.count();
  console.log(`KetQuaHocTap mới tạo: ${created}`);
  console.log(`Tổng KetQuaHocTap:    ${totalKQ}`);
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
