/**
 * Tests – Graduation Rule Engine (M10 UC-60)
 *
 * Đây là regression test bắt buộc trước UAT.
 * Mọi thay đổi graduation-engine.service.ts phải chạy lại bộ test này.
 *
 * Strategy: mock prisma tại module level để test service logic độc lập với DB.
 * Không mock business constants (MIN_GPA, MIN_CONDUCT_SCORE, DEFAULT_REQUIRED_CREDITS)
 * để đảm bảo test phản ánh đúng rule thật.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock prisma trước khi import service ────────────────────────────────────
vi.mock('@/lib/db', () => ({
  prisma: {
    hocVien: {
      findFirst: vi.fn(),
    },
    studentConductRecord: {
      findFirst: vi.fn(),
    },
    thesisProject: {
      findFirst: vi.fn(),
    },
    foreignLanguageCert: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';
import { runGraduationEngine } from '../graduation-engine.service';
import {
  MIN_GPA_FOR_GRADUATION,
  MIN_CONDUCT_SCORE_FOR_GRADUATION,
  DEFAULT_REQUIRED_CREDITS,
} from '@/lib/constants/graduation-rules';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Tạo student record mock đủ điều kiện baseline.
 * Mỗi test case override field cần kiểm tra.
 */
function makeStudent(overrides: Partial<{
  id: string;
  diemTrungBinh: number;
  tinChiTichLuy: number;
  tongTinChi: number | null;
  userId: string | null;
  currentProgramVersion: { totalCredits: number } | null;
}> = {}) {
  return {
    id: 'hv-001',
    diemTrungBinh: MIN_GPA_FOR_GRADUATION,          // đúng ngưỡng
    tinChiTichLuy: DEFAULT_REQUIRED_CREDITS,         // đủ tín chỉ
    tongTinChi: null,
    userId: 'user-001',
    currentProgramVersion: null,
    ...overrides,
  };
}

/** Setup mặc định: tất cả điều kiện đạt */
function setupAllEligible() {
  vi.mocked(prisma.hocVien.findFirst).mockResolvedValue(makeStudent() as any);
  vi.mocked(prisma.studentConductRecord.findFirst).mockResolvedValue({
    conductScore: MIN_CONDUCT_SCORE_FOR_GRADUATION,
  } as any);
  vi.mocked(prisma.thesisProject.findFirst).mockResolvedValue(null); // không có thesis → eligible
  vi.mocked(prisma.foreignLanguageCert.findFirst).mockResolvedValue({ id: 'cert-001' } as any);
}

// ── Test suites ───────────────────────────────────────────────────────────────

describe('runGraduationEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Học viên không tồn tại ─────────────────────────────────────────────────

  it('trả về null khi không tìm thấy học viên', async () => {
    vi.mocked(prisma.hocVien.findFirst).mockResolvedValue(null);

    const result = await runGraduationEngine('hv-not-exist');

    expect(result).toBeNull();
  });

  // ── Happy path: đủ tất cả điều kiện ──────────────────────────────────────

  it('PASS – đủ tín chỉ, GPA đạt, rèn luyện đạt, không thesis, có chứng chỉ ngoại ngữ', async () => {
    setupAllEligible();

    const result = await runGraduationEngine('hv-001');

    expect(result).not.toBeNull();
    expect(result!.graduationEligible).toBe(true);
    expect(result!.failureReasonsJson).toBeNull();
    expect(result!.gpa).toBe(MIN_GPA_FOR_GRADUATION);
    expect(result!.totalCreditsEarned).toBe(DEFAULT_REQUIRED_CREDITS);
  });

  it('PASS – dùng totalCredits từ ProgramVersion thay vì DEFAULT', async () => {
    const programCredits = 150;
    vi.mocked(prisma.hocVien.findFirst).mockResolvedValue(
      makeStudent({ tinChiTichLuy: programCredits, currentProgramVersion: { totalCredits: programCredits } }) as any
    );
    vi.mocked(prisma.studentConductRecord.findFirst).mockResolvedValue({ conductScore: 80 } as any);
    vi.mocked(prisma.thesisProject.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.foreignLanguageCert.findFirst).mockResolvedValue({ id: 'cert-001' } as any);

    const result = await runGraduationEngine('hv-001');

    expect(result!.graduationEligible).toBe(true);
    expect(result!.requiredCredits).toBe(programCredits);
  });

  // ── Rule 1: Tín chỉ tích lũy ──────────────────────────────────────────────

  it('FAIL – thiếu tín chỉ tích lũy', async () => {
    vi.mocked(prisma.hocVien.findFirst).mockResolvedValue(
      makeStudent({ tinChiTichLuy: DEFAULT_REQUIRED_CREDITS - 1 }) as any
    );
    vi.mocked(prisma.studentConductRecord.findFirst).mockResolvedValue({ conductScore: 80 } as any);
    vi.mocked(prisma.thesisProject.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.foreignLanguageCert.findFirst).mockResolvedValue({ id: 'cert-001' } as any);

    const result = await runGraduationEngine('hv-001');

    expect(result!.graduationEligible).toBe(false);
    expect(result!.failureReasonsJson).toHaveLength(1);
    expect(result!.failureReasonsJson![0].code).toBe('INSUFFICIENT_CREDITS');
  });

  it('FAIL – tinChiTichLuy null (học viên mới chưa có dữ liệu)', async () => {
    vi.mocked(prisma.hocVien.findFirst).mockResolvedValue(
      makeStudent({ tinChiTichLuy: null as any }) as any
    );
    vi.mocked(prisma.studentConductRecord.findFirst).mockResolvedValue({ conductScore: 80 } as any);
    vi.mocked(prisma.thesisProject.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.foreignLanguageCert.findFirst).mockResolvedValue({ id: 'cert-001' } as any);

    const result = await runGraduationEngine('hv-001');

    expect(result!.graduationEligible).toBe(false);
    expect(result!.totalCreditsEarned).toBe(0);
    const codes = result!.failureReasonsJson!.map(r => r.code);
    expect(codes).toContain('INSUFFICIENT_CREDITS');
  });

  // ── Rule 2: GPA ───────────────────────────────────────────────────────────

  it('FAIL – GPA thấp hơn ngưỡng tối thiểu', async () => {
    vi.mocked(prisma.hocVien.findFirst).mockResolvedValue(
      makeStudent({ diemTrungBinh: MIN_GPA_FOR_GRADUATION - 0.01 }) as any
    );
    vi.mocked(prisma.studentConductRecord.findFirst).mockResolvedValue({ conductScore: 80 } as any);
    vi.mocked(prisma.thesisProject.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.foreignLanguageCert.findFirst).mockResolvedValue({ id: 'cert-001' } as any);

    const result = await runGraduationEngine('hv-001');

    expect(result!.graduationEligible).toBe(false);
    const codes = result!.failureReasonsJson!.map(r => r.code);
    expect(codes).toContain('LOW_GPA');
  });

  it('PASS – GPA đúng bằng ngưỡng (boundary)', async () => {
    setupAllEligible(); // diemTrungBinh = MIN_GPA_FOR_GRADUATION chính xác

    const result = await runGraduationEngine('hv-001');

    expect(result!.graduationEligible).toBe(true);
    expect(result!.gpa).toBe(MIN_GPA_FOR_GRADUATION);
  });

  it('FAIL – GPA = 0 (học viên chưa có điểm)', async () => {
    vi.mocked(prisma.hocVien.findFirst).mockResolvedValue(
      makeStudent({ diemTrungBinh: 0 }) as any
    );
    vi.mocked(prisma.studentConductRecord.findFirst).mockResolvedValue({ conductScore: 80 } as any);
    vi.mocked(prisma.thesisProject.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.foreignLanguageCert.findFirst).mockResolvedValue({ id: 'cert-001' } as any);

    const result = await runGraduationEngine('hv-001');

    expect(result!.graduationEligible).toBe(false);
    expect(result!.failureReasonsJson!.map(r => r.code)).toContain('LOW_GPA');
  });

  // ── Rule 3: Điểm rèn luyện ───────────────────────────────────────────────

  it('FAIL – điểm rèn luyện thấp hơn ngưỡng', async () => {
    vi.mocked(prisma.hocVien.findFirst).mockResolvedValue(makeStudent() as any);
    vi.mocked(prisma.studentConductRecord.findFirst).mockResolvedValue({
      conductScore: MIN_CONDUCT_SCORE_FOR_GRADUATION - 1,
    } as any);
    vi.mocked(prisma.thesisProject.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.foreignLanguageCert.findFirst).mockResolvedValue({ id: 'cert-001' } as any);

    const result = await runGraduationEngine('hv-001');

    expect(result!.graduationEligible).toBe(false);
    expect(result!.conductEligible).toBe(false);
    expect(result!.failureReasonsJson!.map(r => r.code)).toContain('CONDUCT_INELIGIBLE');
  });

  it('FAIL – chưa có record rèn luyện nào (học viên mới)', async () => {
    vi.mocked(prisma.hocVien.findFirst).mockResolvedValue(makeStudent() as any);
    vi.mocked(prisma.studentConductRecord.findFirst).mockResolvedValue(null); // không có record
    vi.mocked(prisma.thesisProject.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.foreignLanguageCert.findFirst).mockResolvedValue({ id: 'cert-001' } as any);

    const result = await runGraduationEngine('hv-001');

    // Không có conduct record → conductEligible = false (fail-safe)
    expect(result!.conductEligible).toBe(false);
    expect(result!.graduationEligible).toBe(false);
  });

  // ── Rule 4: Khóa luận / Luận văn ─────────────────────────────────────────

  it('FAIL – thesis tồn tại nhưng chưa bảo vệ (status IN_PROGRESS)', async () => {
    vi.mocked(prisma.hocVien.findFirst).mockResolvedValue(makeStudent() as any);
    vi.mocked(prisma.studentConductRecord.findFirst).mockResolvedValue({ conductScore: 80 } as any);
    vi.mocked(prisma.thesisProject.findFirst).mockResolvedValue({ status: 'IN_PROGRESS' } as any);
    vi.mocked(prisma.foreignLanguageCert.findFirst).mockResolvedValue({ id: 'cert-001' } as any);

    const result = await runGraduationEngine('hv-001');

    expect(result!.graduationEligible).toBe(false);
    expect(result!.thesisEligible).toBe(false);
    expect(result!.failureReasonsJson!.map(r => r.code)).toContain('THESIS_NOT_DEFENDED');
  });

  it('FAIL – thesis ở trạng thái DRAFT', async () => {
    vi.mocked(prisma.hocVien.findFirst).mockResolvedValue(makeStudent() as any);
    vi.mocked(prisma.studentConductRecord.findFirst).mockResolvedValue({ conductScore: 80 } as any);
    vi.mocked(prisma.thesisProject.findFirst).mockResolvedValue({ status: 'DRAFT' } as any);
    vi.mocked(prisma.foreignLanguageCert.findFirst).mockResolvedValue({ id: 'cert-001' } as any);

    const result = await runGraduationEngine('hv-001');

    expect(result!.thesisEligible).toBe(false);
    expect(result!.graduationEligible).toBe(false);
  });

  it('PASS – thesis đã bảo vệ (status DEFENDED)', async () => {
    vi.mocked(prisma.hocVien.findFirst).mockResolvedValue(makeStudent() as any);
    vi.mocked(prisma.studentConductRecord.findFirst).mockResolvedValue({ conductScore: 80 } as any);
    vi.mocked(prisma.thesisProject.findFirst).mockResolvedValue({ status: 'DEFENDED' } as any);
    vi.mocked(prisma.foreignLanguageCert.findFirst).mockResolvedValue({ id: 'cert-001' } as any);

    const result = await runGraduationEngine('hv-001');

    expect(result!.thesisEligible).toBe(true);
    expect(result!.graduationEligible).toBe(true);
  });

  it('PASS – không có thesis (hệ không yêu cầu khóa luận)', async () => {
    setupAllEligible(); // thesisProject.findFirst → null

    const result = await runGraduationEngine('hv-001');

    expect(result!.thesisEligible).toBe(true);
  });

  // ── Rule 5: Chứng chỉ ngoại ngữ ─────────────────────────────────────────

  it('FAIL – không có chứng chỉ ngoại ngữ', async () => {
    vi.mocked(prisma.hocVien.findFirst).mockResolvedValue(makeStudent() as any);
    vi.mocked(prisma.studentConductRecord.findFirst).mockResolvedValue({ conductScore: 80 } as any);
    vi.mocked(prisma.thesisProject.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.foreignLanguageCert.findFirst).mockResolvedValue(null); // không có cert

    const result = await runGraduationEngine('hv-001');

    expect(result!.languageEligible).toBe(false);
    expect(result!.graduationEligible).toBe(false);
    expect(result!.failureReasonsJson!.map(r => r.code)).toContain('NO_LANGUAGE_CERT');
  });

  it('FAIL – học viên không có userId (không tra được cert ngoại ngữ)', async () => {
    vi.mocked(prisma.hocVien.findFirst).mockResolvedValue(
      makeStudent({ userId: null }) as any
    );
    vi.mocked(prisma.studentConductRecord.findFirst).mockResolvedValue({ conductScore: 80 } as any);
    vi.mocked(prisma.thesisProject.findFirst).mockResolvedValue(null);
    // foreignLanguageCert sẽ không được gọi khi userId = null

    const result = await runGraduationEngine('hv-001');

    expect(result!.languageEligible).toBe(false);
    expect(result!.graduationEligible).toBe(false);
    // Xác nhận không gọi DB cert nếu userId null
    expect(vi.mocked(prisma.foreignLanguageCert.findFirst)).not.toHaveBeenCalled();
  });

  // ── Multi-failure: nhiều điều kiện không đạt cùng lúc ────────────────────

  it('FAIL – cả GPA thấp lẫn thiếu tín chỉ: failureReasonsJson chứa đủ 2 lý do', async () => {
    vi.mocked(prisma.hocVien.findFirst).mockResolvedValue(
      makeStudent({
        diemTrungBinh: 2.0,
        tinChiTichLuy: 50,
      }) as any
    );
    vi.mocked(prisma.studentConductRecord.findFirst).mockResolvedValue({ conductScore: 80 } as any);
    vi.mocked(prisma.thesisProject.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.foreignLanguageCert.findFirst).mockResolvedValue({ id: 'cert-001' } as any);

    const result = await runGraduationEngine('hv-001');

    expect(result!.graduationEligible).toBe(false);
    const codes = result!.failureReasonsJson!.map(r => r.code);
    expect(codes).toContain('INSUFFICIENT_CREDITS');
    expect(codes).toContain('LOW_GPA');
  });

  it('FAIL – tất cả 5 điều kiện đều không đạt: failureReasonsJson chứa đủ 5 lý do', async () => {
    vi.mocked(prisma.hocVien.findFirst).mockResolvedValue(
      makeStudent({ diemTrungBinh: 0, tinChiTichLuy: 0 }) as any
    );
    vi.mocked(prisma.studentConductRecord.findFirst).mockResolvedValue({ conductScore: 0 } as any);
    vi.mocked(prisma.thesisProject.findFirst).mockResolvedValue({ status: 'DRAFT' } as any);
    vi.mocked(prisma.foreignLanguageCert.findFirst).mockResolvedValue(null);

    const result = await runGraduationEngine('hv-001');

    expect(result!.graduationEligible).toBe(false);
    expect(result!.failureReasonsJson).toHaveLength(5);
    const codes = result!.failureReasonsJson!.map(r => r.code);
    expect(codes).toContain('INSUFFICIENT_CREDITS');
    expect(codes).toContain('LOW_GPA');
    expect(codes).toContain('CONDUCT_INELIGIBLE');
    expect(codes).toContain('THESIS_NOT_DEFENDED');
    expect(codes).toContain('NO_LANGUAGE_CERT');
  });

  // ── Output structure ──────────────────────────────────────────────────────

  it('kết quả PASS phải có failureReasonsJson = null (không phải mảng rỗng)', async () => {
    setupAllEligible();

    const result = await runGraduationEngine('hv-001');

    expect(result!.failureReasonsJson).toBeNull();
  });

  it('kết quả PASS phải trả đủ tất cả fields bắt buộc', async () => {
    setupAllEligible();

    const result = await runGraduationEngine('hv-001');

    expect(result).toMatchObject({
      hocVienId: 'hv-001',
      graduationEligible: true,
      conductEligible: true,
      thesisEligible: true,
      languageEligible: true,
    });
    expect(typeof result!.gpa).toBe('number');
    expect(typeof result!.totalCreditsEarned).toBe('number');
    expect(typeof result!.requiredCredits).toBe('number');
  });
});
