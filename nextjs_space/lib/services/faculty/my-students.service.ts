/**
 * Service: Faculty My Students
 * Business logic cho màn hình giảng viên xem danh sách học viên hướng dẫn.
 *
 * Tách ra khỏi route để đảm bảo:
 * - Route chỉ parse request + trả response
 * - Logic tính GPA và xếp loại học lực nằm ở service layer
 */

import prisma from '@/lib/db';
import {
  ACADEMIC_STANDING_COLORS,
  ACADEMIC_STANDING_THRESHOLDS,
} from '@/lib/constants/academic-standing';

export type StudentAdviseeItem = {
  id: string;
  maHocVien: string;
  hoTen: string;
  lop: string | null;
  khoaHoc: string | null;
  nganh: string | null;
  email: string | null;
  dienThoai: string | null;
  trangThai: string;
  gpa: number;
  hocLuc: string;
  soMonHoc: number;
};

export type AdviseeStatistics = {
  total: number;
  avgGPA: number;
  xuatSac: number;
  gioi: number;
  kha: number;
  trungBinh: number;
  yeu: number;
  chuaXepLoai: number;
};

export type AdviseeDistributionItem = {
  name: string;
  value: number;
  color: string;
};

export type MyStudentsResult = {
  students: StudentAdviseeItem[];
  statistics: AdviseeStatistics;
  distribution: AdviseeDistributionItem[];
};

/**
 * Xếp loại học lực từ GPA.
 * Dùng thống nhất ở cả service và UI (không hardcode riêng 2 nơi).
 */
export function classifyAcademicStanding(gpa: number): string {
  if (gpa >= ACADEMIC_STANDING_THRESHOLDS.xuatSac)   return 'Xuất sắc';
  if (gpa >= ACADEMIC_STANDING_THRESHOLDS.gioi)      return 'Giỏi';
  if (gpa >= ACADEMIC_STANDING_THRESHOLDS.kha)       return 'Khá';
  if (gpa >= ACADEMIC_STANDING_THRESHOLDS.trungBinh) return 'Trung bình';
  if (gpa > 0)                                        return 'Yếu';
  return 'Chưa xếp loại';
}

/**
 * Lấy danh sách học viên do giảng viên hướng dẫn, kèm GPA và học lực.
 *
 * GPA được tính từ KetQuaHocTap với workflowStatus = APPROVED để đảm bảo
 * chỉ dùng điểm đã được phê duyệt chính thức. Fallback về diemTrungBinh
 * nếu học viên chưa có điểm nào được duyệt.
 */
export async function getAdviseesByFaculty(facultyId: string): Promise<MyStudentsResult> {
  const students = await prisma.hocVien.findMany({
    where: { giangVienHuongDanId: facultyId },
    include: {
      ketQuaHocTap: {
        where: { workflowStatus: 'APPROVED' }, // chỉ lấy điểm đã được duyệt chính thức
        select: { diemTongKet: true },
      },
    },
    orderBy: { hoTen: 'asc' },
  });

  let totalGPA = 0;
  let countGPA = 0;
  let xuatSac = 0;
  let gioi = 0;
  let kha = 0;
  let trungBinh = 0;
  let yeu = 0;

  const studentItems: StudentAdviseeItem[] = students.map(student => {
    const approvedScores = student.ketQuaHocTap
      .map(kt => kt.diemTongKet)
      .filter((d): d is number => d !== null && d !== undefined);

    // Ưu tiên điểm đã approved; fallback về diemTrungBinh (tổng hợp từ M10)
    const gpa = approvedScores.length > 0
      ? parseFloat((approvedScores.reduce((s, d) => s + d, 0) / approvedScores.length).toFixed(2))
      : parseFloat((student.diemTrungBinh ?? 0).toFixed(2));

    const hocLuc = classifyAcademicStanding(gpa);

    if (gpa > 0) {
      totalGPA += gpa;
      countGPA++;
    }
    if (hocLuc === 'Xuất sắc') xuatSac++;
    else if (hocLuc === 'Giỏi') gioi++;
    else if (hocLuc === 'Khá') kha++;
    else if (hocLuc === 'Trung bình') trungBinh++;
    else if (hocLuc === 'Yếu') yeu++;

    return {
      id: student.id,
      maHocVien: student.maHocVien,
      hoTen: student.hoTen,
      lop: student.lop,
      khoaHoc: student.khoaHoc,
      nganh: student.nganh,
      email: student.email,
      dienThoai: student.dienThoai,
      trangThai: student.trangThai,
      gpa,
      hocLuc,
      soMonHoc: student.ketQuaHocTap.length,
    };
  });

  const statistics: AdviseeStatistics = {
    total: students.length,
    avgGPA: countGPA > 0 ? parseFloat((totalGPA / countGPA).toFixed(2)) : 0,
    xuatSac,
    gioi,
    kha,
    trungBinh,
    yeu,
    chuaXepLoai: students.length - (xuatSac + gioi + kha + trungBinh + yeu),
  };

  const distribution: AdviseeDistributionItem[] = Object.entries(ACADEMIC_STANDING_COLORS)
    .filter(([name]) => name !== 'Chưa xếp loại')
    .map(([name, color]) => ({
      name,
      value: statistics[
        name === 'Xuất sắc' ? 'xuatSac' :
        name === 'Giỏi'     ? 'gioi'    :
        name === 'Khá'      ? 'kha'     :
        name === 'Trung bình' ? 'trungBinh' : 'yeu'
      ] as number,
      color,
    }))
    .filter(item => item.value > 0);

  return { students: studentItems, statistics, distribution };
}
