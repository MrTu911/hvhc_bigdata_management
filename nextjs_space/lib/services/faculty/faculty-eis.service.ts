/**
 * M07 – Faculty EIS (Education Impact Score) Service
 *
 * Công thức: EIS = T×0.25 + R×0.25 + M×0.20 + S×0.15 + I×0.10 + D×0.05
 *
 * Nguồn dữ liệu từng chiều:
 *   T – Teaching quality  : KetQuaHocTap (điểm SV) từ M10
 *   R – Research output   : ResearchProject + NckhProject + NckhPublication từ M09
 *   M – Mentoring         : HocVien (cố vấn) + ThesisProject từ M10
 *   S – Service           : ClassSection (giờ dạy thực tế) từ M10
 *   I – Innovation        : NckhProject loại SANG_KIEN + TeachingSubject count
 *   D – Development       : FacultyProfile.teachingExperience + certifications count
 *
 * Nguyên tắc:
 *   - Chỉ dùng KetQuaHocTap có workflowStatus = APPROVED
 *   - Dữ liệu thiếu → điểm thành phần = 0, không gán mặc định giả
 *   - Không sinh AI recommendations nếu chưa có explainability engine
 *   - Snapshot nguồn (sourceDataJson) lưu cùng record để audit
 */

import 'server-only';
import db from '@/lib/db';
import {
  EisTrend,
  GradeWorkflowStatus,
  ClassSectionStatus,
  NckhProjectStatus,
  NckhType,
  ResearchWorkflowStatus,
} from '@prisma/client';

// ─── Weights ─────────────────────────────────────────────────────────────────
const WEIGHTS = {
  teaching: 0.25,
  research: 0.25,
  mentoring: 0.20,
  service: 0.15,
  innovation: 0.10,
  development: 0.05,
} as const;

// ─── Benchmarks dùng để normalize về 0–100 ───────────────────────────────────
// Điều chỉnh theo đặc thù học viện (~50 giảng viên)
const BENCH = {
  // T: avg student score 10 (thang Việt Nam)
  teachingMaxAvgScore: 10,
  teachingPassRateMax: 1,  // tỷ lệ SV đạt >= 5.0

  // R: tổng hợp nghiên cứu
  researchProjectsMax: 5,
  nckhProjectsMax: 3,
  publicationsMax: 10,
  citationsMax: 100,

  // M: số học viên cố vấn
  adviseesMax: 30,
  thesisMax: 5,

  // S: số lớp hoạt động trong kỳ
  activeSectionsMax: 8,

  // I: sáng kiến + môn học mới
  innovationProjectsMax: 3,
  teachingSubjectsMax: 5,

  // D: năm kinh nghiệm
  teachingExperienceMax: 20,
  certificationsMax: 5,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface EISDimensions {
  teachingScore: number;
  researchScore: number;
  mentoringScore: number;
  serviceScore: number;
  innovationScore: number;
  developmentScore: number;
}

export interface EISSourceData {
  teaching: {
    avgStudentScore: number | null;
    passRate: number | null;
    gradedEnrollmentsCount: number;
  };
  research: {
    legacyProjects: number;
    nckhProjects: number;
    publications: number;
    citations: number;
  };
  mentoring: {
    activeAdvisees: number;
    thesisAdvised: number;
  };
  service: {
    activeSections: number;
  };
  innovation: {
    sangKienProjects: number;
    teachingSubjectsCount: number;
  };
  development: {
    teachingExperienceYears: number;
    certificationsCount: number;
  };
}

export interface EISCalculationResult {
  dimensions: EISDimensions;
  totalEIS: number;
  trend: EisTrend | null;
  sourceData: EISSourceData;
}

// ─── Normalizer helpers ───────────────────────────────────────────────────────
function clamp100(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizeRatio(value: number, max: number): number {
  if (max === 0) return 0;
  return clamp100((value / max) * 100);
}

// ─── Dimension calculators ────────────────────────────────────────────────────

/**
 * T – Teaching quality
 * Dữ liệu từ KetQuaHocTap có workflowStatus=APPROVED, giangVienId = profile.userId
 * Kỳ xác định bằng (namHoc = academicYear, hocKy = semesterCode)
 */
async function calcTeaching(
  userId: string,
  academicYear: string,
  semesterCode: string,
): Promise<{ score: number; source: EISSourceData['teaching'] }> {
  const grades = await db.ketQuaHocTap.findMany({
    where: {
      giangVienId: userId,
      namHoc: academicYear,
      hocKy: semesterCode,
      workflowStatus: GradeWorkflowStatus.APPROVED,
    },
    select: { diem: true },
  });

  if (grades.length === 0) {
    return {
      score: 0,
      source: { avgStudentScore: null, passRate: null, gradedEnrollmentsCount: 0 },
    };
  }

  const scores = grades.map((g) => g.diem ?? 0);
  const avgStudentScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const passRate = scores.filter((s) => s >= 5.0).length / scores.length;

  // Normalize: avg/10 → 0-100 (60%) + passRate → 0-100 (40%)
  const normalized = clamp100(
    (avgStudentScore / BENCH.teachingMaxAvgScore) * 60 +
    passRate * 40,
  );

  return {
    score: normalized,
    source: {
      avgStudentScore: parseFloat(avgStudentScore.toFixed(2)),
      passRate: parseFloat(passRate.toFixed(3)),
      gradedEnrollmentsCount: grades.length,
    },
  };
}

/**
 * R – Research output
 * Dữ liệu từ ResearchProject (legacy), NckhProject (M09), FacultyProfile.publications/citations
 */
async function calcResearch(
  facultyProfileId: string,
  userId: string,
): Promise<{ score: number; source: EISSourceData['research'] }> {
  const [legacyProjects, nckhProjects, profile] = await Promise.all([
    db.researchProject.count({
      where: { facultyId: facultyProfileId, workflowStatus: ResearchWorkflowStatus.COMPLETED },
    }),
    db.nckhProject.count({
      where: {
        principalInvestigatorId: userId,
        status: NckhProjectStatus.COMPLETED,
      },
    }),
    db.facultyProfile.findUnique({
      where: { id: facultyProfileId },
      select: { publications: true, citations: true },
    }),
  ]);

  const publications = profile?.publications ?? 0;
  const citations = profile?.citations ?? 0;

  const score = clamp100(
    normalizeRatio(legacyProjects, BENCH.researchProjectsMax) * 0.20 +
    normalizeRatio(nckhProjects, BENCH.nckhProjectsMax) * 0.30 +
    normalizeRatio(publications, BENCH.publicationsMax) * 0.35 +
    normalizeRatio(citations, BENCH.citationsMax) * 0.15,
  );

  return {
    score,
    source: { legacyProjects, nckhProjects, publications, citations },
  };
}

/**
 * M – Mentoring
 * HocVien cố vấn + ThesisProject hướng dẫn từ M10
 */
async function calcMentoring(
  facultyProfileId: string,
): Promise<{ score: number; source: EISSourceData['mentoring'] }> {
  const [activeAdvisees, thesisAdvised] = await Promise.all([
    db.hocVien.count({ where: { giangVienHuongDanId: facultyProfileId } }),
    db.thesisProject.count({
      where: { advisorId: facultyProfileId },
    }),
  ]);

  const score = clamp100(
    normalizeRatio(activeAdvisees, BENCH.adviseesMax) * 0.60 +
    normalizeRatio(thesisAdvised, BENCH.thesisMax) * 0.40,
  );

  return { score, source: { activeAdvisees, thesisAdvised } };
}

/**
 * S – Service
 * Số lớp học phần đang dạy trong kỳ từ M10 (ClassSection.status = ACTIVE)
 * Chưa có dữ liệu hoạt động Đảng/đoàn từ M03 trong Phase 1 → bỏ qua chiều đó
 */
async function calcService(
  facultyProfileId: string,
): Promise<{ score: number; source: EISSourceData['service'] }> {
  const activeSections = await db.classSection.count({
    where: {
      facultyId: facultyProfileId,
      status: ClassSectionStatus.ACTIVE,
    },
  });

  const score = normalizeRatio(activeSections, BENCH.activeSectionsMax);

  return { score, source: { activeSections } };
}

/**
 * I – Innovation
 * Sáng kiến từ M09 (NckhProject loại SANG_KIEN_KINH_NGHIEM) + số môn học mới
 */
async function calcInnovation(
  facultyProfileId: string,
  userId: string,
): Promise<{ score: number; source: EISSourceData['innovation'] }> {
  const [sangKienProjects, teachingSubjectsCount] = await Promise.all([
    db.nckhProject.count({
      where: {
        principalInvestigatorId: userId,
        researchType: NckhType.SANG_KIEN_KINH_NGHIEM,
        status: { in: [NckhProjectStatus.COMPLETED, NckhProjectStatus.IN_PROGRESS] },
      },
    }),
    db.facultyProfile
      .findUnique({
        where: { id: facultyProfileId },
        select: { _count: { select: { teachingSubjectsList: true } } },
      })
      .then((p) => p?._count.teachingSubjectsList ?? 0),
  ]);

  const score = clamp100(
    normalizeRatio(sangKienProjects, BENCH.innovationProjectsMax) * 0.60 +
    normalizeRatio(teachingSubjectsCount, BENCH.teachingSubjectsMax) * 0.40,
  );

  return { score, source: { sangKienProjects, teachingSubjectsCount } };
}

/**
 * D – Development
 * teachingExperience (năm) + số certifications từ FacultyProfile
 */
async function calcDevelopment(
  facultyProfileId: string,
): Promise<{ score: number; source: EISSourceData['development'] }> {
  const profile = await db.facultyProfile.findUnique({
    where: { id: facultyProfileId },
    select: { teachingExperience: true, certifications: true },
  });

  const teachingExperienceYears = profile?.teachingExperience ?? 0;
  const certs = profile?.certifications;
  const certificationsCount = Array.isArray(certs) ? certs.length : 0;

  const score = clamp100(
    normalizeRatio(teachingExperienceYears, BENCH.teachingExperienceMax) * 0.70 +
    normalizeRatio(certificationsCount, BENCH.certificationsMax) * 0.30,
  );

  return { score, source: { teachingExperienceYears, certificationsCount } };
}

// ─── Trend detector ───────────────────────────────────────────────────────────
async function detectTrend(
  facultyProfileId: string,
  currentTotal: number,
  academicYear: string,
  semesterCode: string,
): Promise<EisTrend | null> {
  // Tìm kỳ liền trước (cùng năm, kỳ khác hoặc năm trước)
  const previous = await db.facultyEISScore.findFirst({
    where: {
      facultyProfileId,
      NOT: { academicYear, semesterCode },
    },
    orderBy: [{ academicYear: 'desc' }, { semesterCode: 'desc' }],
    select: { totalEIS: true },
  });

  if (!previous) return null;

  const delta = currentTotal - previous.totalEIS;
  if (delta > 2) return EisTrend.IMPROVING;
  if (delta < -2) return EisTrend.DECLINING;
  return EisTrend.STABLE;
}

// ─── Main calculation ─────────────────────────────────────────────────────────

/**
 * Tính EIS cho một giảng viên trong một học kỳ và lưu vào FacultyEISScore.
 * Nếu đã có snapshot cùng (facultyProfileId, academicYear, semesterCode), thực hiện upsert.
 *
 * @param facultyProfileId FacultyProfile.id
 * @param academicYear     VD: "2025-2026"
 * @param semesterCode     VD: "HK1"
 * @param calculatedBy     userId người trigger hoặc 'system'
 */
export async function calculateAndSaveEIS(
  facultyProfileId: string,
  academicYear: string,
  semesterCode: string,
  calculatedBy: string,
): Promise<{ record: any; result: EISCalculationResult }> {
  const profile = await db.facultyProfile.findUnique({
    where: { id: facultyProfileId },
    select: { userId: true },
  });

  if (!profile) {
    throw new Error(`FacultyProfile không tồn tại: ${facultyProfileId}`);
  }

  const userId = profile.userId;

  // Tính song song 6 chiều
  const [t, r, m, s, i, d] = await Promise.all([
    calcTeaching(userId, academicYear, semesterCode),
    calcResearch(facultyProfileId, userId),
    calcMentoring(facultyProfileId),
    calcService(facultyProfileId),
    calcInnovation(facultyProfileId, userId),
    calcDevelopment(facultyProfileId),
  ]);

  const dimensions: EISDimensions = {
    teachingScore: t.score,
    researchScore: r.score,
    mentoringScore: m.score,
    serviceScore: s.score,
    innovationScore: i.score,
    developmentScore: d.score,
  };

  const totalEIS = parseFloat(
    (
      t.score * WEIGHTS.teaching +
      r.score * WEIGHTS.research +
      m.score * WEIGHTS.mentoring +
      s.score * WEIGHTS.service +
      i.score * WEIGHTS.innovation +
      d.score * WEIGHTS.development
    ).toFixed(2),
  );

  const trend = await detectTrend(facultyProfileId, totalEIS, academicYear, semesterCode);

  const sourceData: EISSourceData = {
    teaching: t.source,
    research: r.source,
    mentoring: m.source,
    service: s.source,
    innovation: i.source,
    development: d.source,
  };

  // Upsert vào FacultyEISScore
  const record = await db.facultyEISScore.upsert({
    where: {
      facultyProfileId_academicYear_semesterCode: {
        facultyProfileId,
        academicYear,
        semesterCode,
      },
    },
    update: {
      ...dimensions,
      totalEIS,
      trend,
      sourceDataJson: sourceData as any,
      calculatedAt: new Date(),
      calculatedBy,
      // recommendations: null – không tạo khi chưa có explainability engine
    },
    create: {
      facultyProfileId,
      academicYear,
      semesterCode,
      ...dimensions,
      totalEIS,
      trend,
      sourceDataJson: sourceData as any,
      calculatedAt: new Date(),
      calculatedBy,
    },
  });

  return {
    record,
    result: {
      dimensions,
      totalEIS,
      trend,
      sourceData,
    },
  };
}

/**
 * Batch: tính EIS cho toàn bộ giảng viên active trong một học kỳ.
 * Trả về summary kết quả.
 */
export async function calculateEISBatch(
  academicYear: string,
  semesterCode: string,
  calculatedBy: string,
): Promise<{ total: number; succeeded: number; failed: { id: string; error: string }[] }> {
  const profiles = await db.facultyProfile.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  let succeeded = 0;
  const failed: { id: string; error: string }[] = [];

  // Sequential để tránh DB contention khi batch lớn
  for (const profile of profiles) {
    try {
      await calculateAndSaveEIS(profile.id, academicYear, semesterCode, calculatedBy);
      succeeded++;
    } catch (err: any) {
      failed.push({ id: profile.id, error: err.message ?? 'unknown' });
    }
  }

  return { total: profiles.length, succeeded, failed };
}

/**
 * Lấy lịch sử EIS của một giảng viên – phục vụ API history + radar chart.
 */
export async function getEISHistory(
  facultyProfileId: string,
  limit = 6,
): Promise<
  {
    academicYear: string;
    semesterCode: string;
    totalEIS: number;
    dimensions: EISDimensions;
    trend: EisTrend | null;
    calculatedAt: Date;
  }[]
> {
  const records = await db.facultyEISScore.findMany({
    where: { facultyProfileId },
    orderBy: [{ academicYear: 'desc' }, { semesterCode: 'desc' }],
    take: limit,
    select: {
      academicYear: true,
      semesterCode: true,
      totalEIS: true,
      teachingScore: true,
      researchScore: true,
      mentoringScore: true,
      serviceScore: true,
      innovationScore: true,
      developmentScore: true,
      trend: true,
      calculatedAt: true,
    },
  });

  return records.map((r) => ({
    academicYear: r.academicYear,
    semesterCode: r.semesterCode,
    totalEIS: r.totalEIS,
    dimensions: {
      teachingScore: r.teachingScore,
      researchScore: r.researchScore,
      mentoringScore: r.mentoringScore,
      serviceScore: r.serviceScore,
      innovationScore: r.innovationScore,
      developmentScore: r.developmentScore,
    },
    trend: r.trend,
    calculatedAt: r.calculatedAt,
  }));
}

/**
 * Định dạng radar chart data từ một record EIS.
 * Labels và axes phải nhất quán với frontend chart config.
 */
export function buildRadarChartData(dimensions: EISDimensions) {
  return {
    labels: ['Giảng dạy (T)', 'Nghiên cứu (R)', 'Hướng dẫn (M)', 'Phục vụ (S)', 'Sáng kiến (I)', 'Phát triển (D)'],
    datasets: [
      {
        label: 'EIS 6 chiều',
        data: [
          dimensions.teachingScore,
          dimensions.researchScore,
          dimensions.mentoringScore,
          dimensions.serviceScore,
          dimensions.innovationScore,
          dimensions.developmentScore,
        ],
      },
    ],
  };
}
