/**
 * Service: Faculty Teaching Analytics
 * Thống kê kết quả giảng dạy của giảng viên theo môn học và học kỳ.
 *
 * Nguồn dữ liệu:
 * - TeachingSubject: danh sách môn giảng viên đã/đang dạy
 * - KetQuaHocTap: điểm học viên, chỉ lấy workflowStatus = APPROVED
 *
 * Tách ra khỏi route để route chỉ làm auth + params + response.
 */

import prisma from '@/lib/db';
import {
  ACADEMIC_STANDING_THRESHOLDS,
  ACADEMIC_STANDING_COLORS,
} from '@/lib/constants/academic-standing';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubjectStat = {
  maMon: string;
  tenMon: string;
  namHoc: string;
  hocKy: string;
  totalStudents: number;
  avgScore: number;
  xuatSac: number;
  gioi: number;
  kha: number;
  trungBinh: number;
  yeu: number;
  passRate: number; // % >= 5.0
};

export type TrendData = {
  period: string;   // label hiển thị, vd: "HK1 2024-2025"
  namHoc: string;
  hocKy: string;
  avgScore: number;
};

export type TeachingAnalyticsSummary = {
  totalStudents: number;  // tổng lượt học viên qua các lớp
  totalSubjects: number;  // số môn học duy nhất đã dạy
  avgScoreAll: number;    // điểm TB toàn bộ
  totalClasses: number;   // số bản ghi TeachingSubject (số lớp/lượt dạy)
};

export type TeachingAnalyticsFilters = {
  subject?: string; // tìm theo tên hoặc mã môn
  year?: string;    // namHoc, vd: "2024-2025"
  semester?: string; // hocKy, vd: "HK1"
};

export type TeachingAnalyticsResult = {
  subjectStats: SubjectStat[];
  trendData: TrendData[];
  summary: TeachingAnalyticsSummary;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function classifyScore(score: number): 'xuatSac' | 'gioi' | 'kha' | 'trungBinh' | 'yeu' {
  if (score >= ACADEMIC_STANDING_THRESHOLDS.xuatSac)   return 'xuatSac';
  if (score >= ACADEMIC_STANDING_THRESHOLDS.gioi)      return 'gioi';
  if (score >= ACADEMIC_STANDING_THRESHOLDS.kha)       return 'kha';
  if (score >= ACADEMIC_STANDING_THRESHOLDS.trungBinh) return 'trungBinh';
  return 'yeu';
}

/** Sắp xếp học kỳ theo trình tự thời gian để vẽ trend chart đúng hướng */
function sortSemesterChronologically(a: TrendData, b: TrendData): number {
  if (a.namHoc !== b.namHoc) return a.namHoc.localeCompare(b.namHoc);
  return a.hocKy.localeCompare(b.hocKy);
}

// ─── Core service function ────────────────────────────────────────────────────

export async function getTeachingAnalytics(
  facultyId: string,
  filters: TeachingAnalyticsFilters = {}
): Promise<TeachingAnalyticsResult> {

  // 1. Lấy danh sách môn giảng viên đã dạy, áp dụng filter
  const teachingSubjectWhere: Record<string, unknown> = { facultyId };

  if (filters.subject) {
    const keyword = filters.subject.trim().toLowerCase();
    teachingSubjectWhere.OR = [
      { subjectName: { contains: keyword, mode: 'insensitive' } },
      { subjectCode: { contains: keyword, mode: 'insensitive' } },
    ];
  }
  if (filters.year && filters.year !== 'all') {
    teachingSubjectWhere.academicYear = filters.year;
  }
  if (filters.semester && filters.semester !== 'all') {
    teachingSubjectWhere.semester = filters.semester;
  }

  const teachingSubjects = await prisma.teachingSubject.findMany({
    where: teachingSubjectWhere,
    orderBy: [{ academicYear: 'desc' }, { semester: 'asc' }, { subjectName: 'asc' }],
  });

  if (teachingSubjects.length === 0) {
    return {
      subjectStats: [],
      trendData: [],
      summary: { totalStudents: 0, totalSubjects: 0, avgScoreAll: 0, totalClasses: 0 },
    };
  }

  // 2. Thu thập tất cả (maMon, namHoc, hocKy) để query KetQuaHocTap hiệu quả một lần
  //    Chỉ lấy điểm đã APPROVED – đây là nguồn sự thật chính thức của M10
  const subjectCodes = [...new Set(
    teachingSubjects.map(ts => ts.subjectCode).filter((c): c is string => !!c)
  )];
  const subjectNames = [...new Set(teachingSubjects.map(ts => ts.subjectName))];

  const allApprovedGrades = subjectCodes.length > 0
    ? await prisma.ketQuaHocTap.findMany({
        where: {
          workflowStatus: 'APPROVED',
          OR: [
            { maMon: { in: subjectCodes } },
            { monHoc: { in: subjectNames } },
          ],
        },
        select: {
          maMon: true,
          monHoc: true,
          diemTongKet: true,
          hocKy: true,
          namHoc: true,
        },
      })
    : [];

  // 3. Build per-subject stats
  const subjectStats: SubjectStat[] = [];
  let totalAllScores = 0;
  let countAllScores = 0;

  for (const ts of teachingSubjects) {
    // Match grades: ưu tiên maMon, fallback sang monHoc
    const matchedGrades = allApprovedGrades.filter(g => {
      const codeMatch = ts.subjectCode && g.maMon === ts.subjectCode;
      const nameMatch = g.monHoc === ts.subjectName;
      const yearMatch  = !ts.academicYear || !g.namHoc  || g.namHoc  === ts.academicYear;
      const semMatch   = !ts.semester     || !g.hocKy   || g.hocKy   === ts.semester;
      return (codeMatch || nameMatch) && yearMatch && semMatch;
    });

    const validScores = matchedGrades
      .map(g => g.diemTongKet)
      .filter((d): d is number => d !== null && d !== undefined && d >= 0);

    const avgScore = validScores.length > 0
      ? parseFloat((validScores.reduce((s, d) => s + d, 0) / validScores.length).toFixed(2))
      : 0;

    let xuatSac = 0, gioi = 0, kha = 0, trungBinh = 0, yeu = 0;
    for (const score of validScores) {
      const band = classifyScore(score);
      if (band === 'xuatSac')   xuatSac++;
      else if (band === 'gioi') gioi++;
      else if (band === 'kha')  kha++;
      else if (band === 'trungBinh') trungBinh++;
      else yeu++;
    }

    const passing = validScores.filter(s => s >= ACADEMIC_STANDING_THRESHOLDS.trungBinh).length;
    const passRate = validScores.length > 0
      ? parseFloat(((passing / validScores.length) * 100).toFixed(1))
      : 0;

    // totalStudents: dùng KetQuaHocTap count nếu có, fallback về TeachingSubject.studentCount
    const totalStudents = validScores.length > 0 ? validScores.length : (ts.studentCount ?? 0);

    totalAllScores += validScores.reduce((s, d) => s + d, 0);
    countAllScores += validScores.length;

    subjectStats.push({
      maMon: ts.subjectCode ?? ts.subjectName,
      tenMon: ts.subjectName,
      namHoc: ts.academicYear ?? 'N/A',
      hocKy: ts.semester ?? 'N/A',
      totalStudents,
      avgScore,
      xuatSac,
      gioi,
      kha,
      trungBinh,
      yeu,
      passRate,
    });
  }

  // 4. Build trend data: nhóm theo (namHoc, hocKy) toàn bộ grades khớp với môn đã dạy
  const semesterMap = new Map<string, { total: number; count: number; namHoc: string; hocKy: string }>();

  for (const grade of allApprovedGrades) {
    if (grade.diemTongKet === null || grade.diemTongKet === undefined) continue;
    const ny = grade.namHoc ?? 'N/A';
    const hk = grade.hocKy  ?? 'N/A';
    const key = `${ny}||${hk}`;

    const existing = semesterMap.get(key) ?? { total: 0, count: 0, namHoc: ny, hocKy: hk };
    existing.total += grade.diemTongKet;
    existing.count += 1;
    semesterMap.set(key, existing);
  }

  const trendData: TrendData[] = Array.from(semesterMap.values())
    .map(entry => ({
      period: `${entry.hocKy} ${entry.namHoc}`,
      namHoc: entry.namHoc,
      hocKy: entry.hocKy,
      avgScore: parseFloat((entry.total / entry.count).toFixed(2)),
    }))
    .sort(sortSemesterChronologically);

  // 5. Summary
  const uniqueSubjectCodes = new Set(subjectStats.map(s => s.maMon));
  const summary: TeachingAnalyticsSummary = {
    totalStudents: subjectStats.reduce((s, r) => s + r.totalStudents, 0),
    totalSubjects: uniqueSubjectCodes.size,
    avgScoreAll: countAllScores > 0
      ? parseFloat((totalAllScores / countAllScores).toFixed(2))
      : 0,
    totalClasses: teachingSubjects.length,
  };

  return { subjectStats, trendData, summary };
}
