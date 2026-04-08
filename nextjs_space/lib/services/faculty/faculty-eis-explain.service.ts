/**
 * M07 – EIS Explainability Service
 *
 * Đọc FacultyEISScore (bao gồm sourceDataJson) và sinh giải thích
 * chi tiết từng chiều T/R/M/S/I/D theo ngôn ngữ nghiệp vụ rõ ràng.
 *
 * Nguyên tắc:
 *   - Không tính lại EIS – chỉ đọc bản ghi đã lưu và giải thích.
 *   - sourceDataJson là audit trail của tính toán, phải giải thích bám sát đó.
 *   - Không sinh khuyến nghị mơ hồ: mỗi kiến nghị phải dựa trên con số cụ thể.
 */

import 'server-only';
import prisma from '@/lib/db';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DimensionExplanation {
  code: 'T' | 'R' | 'M' | 'S' | 'I' | 'D';
  label: string;
  weight: number;            // trọng số (0–1)
  score: number;             // điểm thành phần (0–100)
  weightedContribution: number; // score × weight (đóng góp vào totalEIS)
  sourceItems: SourceItem[]; // các chỉ số nguồn đã dùng
  interpretation: string;    // nhận xét tự động
  suggestion: string | null; // kiến nghị cải thiện, null nếu đã tốt
}

export interface SourceItem {
  label: string;
  value: string | number;
  benchmark?: string;        // ngưỡng tham chiếu để người dùng đánh giá
}

export interface EISExplainResult {
  facultyProfileId: string;
  facultyName: string;
  academicYear: string;
  semesterCode: string;
  totalEIS: number;
  trend: string | null;
  calculatedAt: Date;
  dimensions: DimensionExplanation[];
  overallInterpretation: string;
}

// ─── Weights & labels (phải nhất quán với faculty-eis.service.ts) ─────────────
const DIMENSION_META = {
  T: { label: 'Chất lượng giảng dạy (T)', weight: 0.25 },
  R: { label: 'Nghiên cứu khoa học (R)',   weight: 0.25 },
  M: { label: 'Hướng dẫn học viên (M)',    weight: 0.20 },
  S: { label: 'Phục vụ – Giờ dạy (S)',     weight: 0.15 },
  I: { label: 'Sáng kiến & học liệu (I)',  weight: 0.10 },
  D: { label: 'Phát triển bản thân (D)',   weight: 0.05 },
} as const;

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Lấy bản giải thích EIS theo kỳ cụ thể (hoặc kỳ gần nhất nếu không chỉ định).
 *
 * @param facultyProfileId  FacultyProfile.id
 * @param academicYear      VD: "2025-2026"  (optional – nếu thiếu lấy kỳ gần nhất)
 * @param semesterCode      VD: "HK1"        (optional – nếu thiếu lấy kỳ gần nhất)
 */
export async function getEISExplanation(
  facultyProfileId: string,
  academicYear?: string,
  semesterCode?: string,
): Promise<EISExplainResult | null> {
  // ── 1. Load FacultyProfile ─────────────────────────────────────────────
  const profile = await prisma.facultyProfile.findUnique({
    where: { id: facultyProfileId },
    select: { user: { select: { name: true } } },
  });
  if (!profile) return null;

  // ── 2. Load EIS record ────────────────────────────────────────────────
  const eisRecord = await prisma.facultyEISScore.findFirst({
    where: {
      facultyProfileId,
      ...(academicYear ? { academicYear } : {}),
      ...(semesterCode ? { semesterCode } : {}),
    },
    orderBy: [{ academicYear: 'desc' }, { semesterCode: 'desc' }],
    select: {
      academicYear: true,
      semesterCode: true,
      totalEIS: true,
      trend: true,
      calculatedAt: true,
      teachingScore: true,
      researchScore: true,
      mentoringScore: true,
      serviceScore: true,
      innovationScore: true,
      developmentScore: true,
      sourceDataJson: true,
    },
  });

  if (!eisRecord) return null;

  // ── 3. Parse sourceDataJson ────────────────────────────────────────────
  // Cấu trúc: EISSourceData (xem faculty-eis.service.ts)
  const src = (eisRecord.sourceDataJson ?? {}) as Record<string, any>;
  const teaching   = src.teaching   ?? {};
  const research   = src.research   ?? {};
  const mentoring  = src.mentoring  ?? {};
  const service    = src.service    ?? {};
  const innovation = src.innovation ?? {};
  const development = src.development ?? {};

  // ── 4. Xây explanation từng chiều ─────────────────────────────────────
  const dimensions: DimensionExplanation[] = [
    buildT(eisRecord.teachingScore,   teaching),
    buildR(eisRecord.researchScore,   research),
    buildM(eisRecord.mentoringScore,  mentoring),
    buildS(eisRecord.serviceScore,    service),
    buildI(eisRecord.innovationScore, innovation),
    buildD(eisRecord.developmentScore, development),
  ];

  // ── 5. Overall interpretation ─────────────────────────────────────────
  const overallInterpretation = buildOverallInterpretation(eisRecord.totalEIS, dimensions);

  return {
    facultyProfileId,
    facultyName: profile.user.name ?? '',
    academicYear: eisRecord.academicYear,
    semesterCode: eisRecord.semesterCode,
    totalEIS: eisRecord.totalEIS,
    trend: eisRecord.trend,
    calculatedAt: eisRecord.calculatedAt,
    dimensions,
    overallInterpretation,
  };
}

// ─── Dimension builders ───────────────────────────────────────────────────────

function buildT(score: number, src: Record<string, any>): DimensionExplanation {
  const { weight, label } = DIMENSION_META.T;
  const avg   = src.avgStudentScore != null ? formatNum(src.avgStudentScore) : 'Chưa có dữ liệu';
  const pass  = src.passRate      != null ? `${(src.passRate * 100).toFixed(1)}%` : 'N/A';
  const count = src.gradedEnrollmentsCount ?? 0;

  const sourceItems: SourceItem[] = [
    { label: 'Điểm TB học viên', value: avg, benchmark: '≥ 7.0 → tốt' },
    { label: 'Tỷ lệ đạt (≥ 5.0)', value: pass, benchmark: '≥ 80% → tốt' },
    { label: 'Số lượt điểm được chấm', value: count },
  ];

  const interpretation =
    count === 0
      ? 'Chưa có kết quả học tập được phê duyệt trong kỳ này.'
      : `Đã chấm ${count} lượt điểm, trung bình ${avg}, tỷ lệ đạt ${pass}.`;

  const suggestion =
    count === 0
      ? 'Cần phê duyệt kết quả học tập để tính điểm chiều T.'
      : src.passRate != null && src.passRate < 0.8
      ? 'Tỷ lệ học viên đạt dưới 80% – cân nhắc tăng cường hỗ trợ học tập và điều chỉnh phương pháp giảng dạy.'
      : null;

  return dim('T', label, weight, score, sourceItems, interpretation, suggestion);
}

function buildR(score: number, src: Record<string, any>): DimensionExplanation {
  const { weight, label } = DIMENSION_META.R;
  const sourceItems: SourceItem[] = [
    { label: 'Đề tài nghiên cứu (legacy)', value: src.legacyProjects ?? 0, benchmark: 'Tối đa tính 5' },
    { label: 'Đề tài NCKH (M09)', value: src.nckhProjects ?? 0, benchmark: 'Tối đa tính 3' },
    { label: 'Bài báo / công bố', value: src.publications ?? 0, benchmark: 'Tối đa tính 10' },
    { label: 'Trích dẫn (citations)', value: src.citations ?? 0, benchmark: 'Tối đa tính 100' },
  ];

  const total = (src.legacyProjects ?? 0) + (src.nckhProjects ?? 0) + (src.publications ?? 0);
  const interpretation =
    total === 0
      ? 'Chưa có hoạt động nghiên cứu được ghi nhận.'
      : `${src.legacyProjects ?? 0} đề tài legacy, ${src.nckhProjects ?? 0} NCKH, ${src.publications ?? 0} bài báo, ${src.citations ?? 0} trích dẫn.`;

  const suggestion =
    (src.publications ?? 0) < 3
      ? 'Tăng cường công bố khoa học để nâng điểm chiều R (mục tiêu ≥ 3 bài báo/năm).'
      : (src.citations ?? 0) < 20
      ? 'Số trích dẫn còn thấp – cân nhắc chia sẻ nghiên cứu trên các nền tảng học thuật.'
      : null;

  return dim('R', label, weight, score, sourceItems, interpretation, suggestion);
}

function buildM(score: number, src: Record<string, any>): DimensionExplanation {
  const { weight, label } = DIMENSION_META.M;
  const sourceItems: SourceItem[] = [
    { label: 'Học viên đang cố vấn', value: src.activeAdvisees ?? 0, benchmark: 'Tối đa tính 30' },
    { label: 'Khóa luận/luận văn đang hướng dẫn', value: src.thesisAdvised ?? 0, benchmark: 'Tối đa tính 5' },
  ];

  const interpretation =
    (src.activeAdvisees ?? 0) === 0 && (src.thesisAdvised ?? 0) === 0
      ? 'Chưa có học viên cố vấn hoặc khóa luận đang hướng dẫn.'
      : `Đang cố vấn ${src.activeAdvisees ?? 0} học viên, hướng dẫn ${src.thesisAdvised ?? 0} khóa luận/luận văn.`;

  const suggestion =
    (src.activeAdvisees ?? 0) === 0
      ? 'Chưa có học viên cố vấn học tập – liên hệ bộ môn để được phân công.'
      : null;

  return dim('M', label, weight, score, sourceItems, interpretation, suggestion);
}

function buildS(score: number, src: Record<string, any>): DimensionExplanation {
  const { weight, label } = DIMENSION_META.S;
  const sourceItems: SourceItem[] = [
    {
      label: 'Lớp học phần đang dạy (ACTIVE)',
      value: src.activeSections ?? 0,
      benchmark: 'Tối đa tính 8 lớp',
    },
  ];

  const interpretation =
    (src.activeSections ?? 0) === 0
      ? 'Không có lớp học phần ACTIVE trong kỳ này.'
      : `Đang trực tiếp giảng dạy ${src.activeSections} lớp học phần. (Hoạt động Đảng/đoàn sẽ được tích hợp ở Phase 3.)`;

  const suggestion =
    (src.activeSections ?? 0) === 0
      ? 'Không có lớp ACTIVE – kiểm tra lại phân công giảng dạy trong M10.'
      : (src.activeSections ?? 0) < 3
      ? 'Số lớp đang dạy còn ít – điểm chiều S sẽ cải thiện khi được phân công thêm.'
      : null;

  return dim('S', label, weight, score, sourceItems, interpretation, suggestion);
}

function buildI(score: number, src: Record<string, any>): DimensionExplanation {
  const { weight, label } = DIMENSION_META.I;
  const sourceItems: SourceItem[] = [
    { label: 'Sáng kiến kinh nghiệm (M09)', value: src.sangKienProjects ?? 0, benchmark: 'Tối đa tính 3' },
    { label: 'Học phần/môn học mới phụ trách', value: src.teachingSubjectsCount ?? 0, benchmark: 'Tối đa tính 5' },
  ];

  const interpretation =
    (src.sangKienProjects ?? 0) + (src.teachingSubjectsCount ?? 0) === 0
      ? 'Chưa có hoạt động sáng kiến hoặc phát triển học liệu mới.'
      : `${src.sangKienProjects ?? 0} sáng kiến kinh nghiệm, ${src.teachingSubjectsCount ?? 0} môn học/học phần phụ trách.`;

  const suggestion =
    (src.sangKienProjects ?? 0) === 0
      ? 'Đề xuất ít nhất 1 sáng kiến kinh nghiệm/kỳ để nâng điểm chiều I.'
      : null;

  return dim('I', label, weight, score, sourceItems, interpretation, suggestion);
}

function buildD(score: number, src: Record<string, any>): DimensionExplanation {
  const { weight, label } = DIMENSION_META.D;
  const sourceItems: SourceItem[] = [
    { label: 'Kinh nghiệm giảng dạy (năm)', value: src.teachingExperienceYears ?? 0, benchmark: 'Tối đa tính 20 năm' },
    { label: 'Chứng chỉ/bằng cấp bổ sung', value: src.certificationsCount ?? 0, benchmark: 'Tối đa tính 5' },
  ];

  const interpretation =
    `${src.teachingExperienceYears ?? 0} năm kinh nghiệm giảng dạy, ${src.certificationsCount ?? 0} chứng chỉ/bằng cấp bổ sung.`;

  const suggestion =
    (src.certificationsCount ?? 0) === 0
      ? 'Cập nhật chứng chỉ đào tạo vào hồ sơ giảng viên để tăng điểm chiều D.'
      : null;

  return dim('D', label, weight, score, sourceItems, interpretation, suggestion);
}

// ─── Overall interpretation ───────────────────────────────────────────────────

function buildOverallInterpretation(totalEIS: number, dimensions: DimensionExplanation[]): string {
  const level =
    totalEIS >= 80 ? 'Xuất sắc' :
    totalEIS >= 65 ? 'Tốt' :
    totalEIS >= 50 ? 'Đạt yêu cầu' :
    totalEIS >= 35 ? 'Cần cải thiện' : 'Yếu';

  const weakDims = dimensions
    .filter((d) => d.score < 40)
    .map((d) => d.label)
    .join(', ');

  const strongDims = dimensions
    .filter((d) => d.score >= 75)
    .map((d) => d.label)
    .join(', ');

  let parts = [`EIS tổng hợp ${totalEIS.toFixed(1)}/100 – mức ${level}.`];
  if (strongDims) parts.push(`Điểm mạnh: ${strongDims}.`);
  if (weakDims)   parts.push(`Cần cải thiện: ${weakDims}.`);

  return parts.join(' ');
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function dim(
  code: DimensionExplanation['code'],
  label: string,
  weight: number,
  score: number,
  sourceItems: SourceItem[],
  interpretation: string,
  suggestion: string | null,
): DimensionExplanation {
  return {
    code,
    label,
    weight,
    score: parseFloat(score.toFixed(1)),
    weightedContribution: parseFloat((score * weight).toFixed(2)),
    sourceItems,
    interpretation,
    suggestion,
  };
}

function formatNum(n: number): string {
  return Number.isFinite(n) ? n.toFixed(2) : 'N/A';
}
