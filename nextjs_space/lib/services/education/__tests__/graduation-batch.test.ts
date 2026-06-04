/**
 * Tests – Graduation Batch Service (M10 UC-60)
 *
 * Test: batch run, state transitions, diploma issuance, duplicate prevention.
 * Mock prisma và graduation-engine để kiểm tra business logic thuần.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GraduationAuditStatus } from '@prisma/client';

// ===== MOCKS =====

const mockRunEngine = vi.hoisted(() => vi.fn());

vi.mock('@/lib/services/education/graduation-engine.service', () => ({
  runGraduationEngine: mockRunEngine,
}));

const mockPrisma = vi.hoisted(() => ({
  hocVien: {
    findMany: vi.fn(),
  },
  graduationAudit: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  diplomaRecord: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({ prisma: mockPrisma }));
vi.mock('server-only', () => ({}));

// Import sau khi mock
import {
  batchRunGraduation,
  approveAudit,
  rejectAudit,
  issueDiploma,
} from '@/lib/services/education/graduation-batch.service';

// ===== ENGINE RESULT FACTORY =====

function makeEngineResult(eligible: boolean) {
  return {
    hocVienId: 'hv-1',
    gpa: eligible ? 3.5 : 1.5,
    totalCreditsEarned: eligible ? 150 : 80,
    requiredCredits: 130,
    conductEligible: eligible,
    thesisEligible: eligible,
    languageEligible: eligible,
    graduationEligible: eligible,
    failureReasonsJson: eligible ? null : [{ code: 'LOW_GPA', message: 'GPA chưa đạt' }],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ===== BATCH RUN =====

describe('batchRunGraduation', () => {
  it('chạy engine cho học viên chưa có audit hôm nay', async () => {
    mockPrisma.hocVien.findMany.mockResolvedValue([{ id: 'hv-1' }, { id: 'hv-2' }]);
    mockPrisma.graduationAudit.findMany.mockResolvedValue([]); // không có audit hôm nay
    mockPrisma.graduationAudit.create.mockResolvedValue({ id: 'audit-1' });
    mockRunEngine
      .mockResolvedValueOnce(makeEngineResult(true))  // hv-1 eligible
      .mockResolvedValueOnce(makeEngineResult(false)); // hv-2 ineligible

    const result = await batchRunGraduation({});
    expect(result.total).toBe(2);
    expect(result.eligible).toBe(1);
    expect(result.ineligible).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(mockPrisma.graduationAudit.create).toHaveBeenCalledTimes(2);
  });

  it('bỏ qua học viên đã có audit hôm nay (idempotent)', async () => {
    mockPrisma.hocVien.findMany.mockResolvedValue([{ id: 'hv-1' }]);
    // Đã có audit hôm nay cho hv-1
    mockPrisma.graduationAudit.findMany.mockResolvedValue([{ hocVienId: 'hv-1' }]);

    const result = await batchRunGraduation({});
    expect(result.skipped).toBe(1);
    expect(result.eligible).toBe(0);
    expect(mockRunEngine).not.toHaveBeenCalled();
    expect(mockPrisma.graduationAudit.create).not.toHaveBeenCalled();
  });

  it('ghi nhận error khi engine trả về null (học viên không tồn tại)', async () => {
    mockPrisma.hocVien.findMany.mockResolvedValue([{ id: 'hv-ghost' }]);
    mockPrisma.graduationAudit.findMany.mockResolvedValue([]);
    mockRunEngine.mockResolvedValue(null); // học viên không tìm thấy

    const result = await batchRunGraduation({});
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].hocVienId).toBe('hv-ghost');
    expect(result.eligible).toBe(0);
  });

  it('giới hạn batch theo limit filter', async () => {
    mockPrisma.hocVien.findMany.mockResolvedValue([]);
    mockPrisma.graduationAudit.findMany.mockResolvedValue([]);
    await batchRunGraduation({ limit: 30 });
    // Verify prisma.hocVien.findMany được gọi với take tương ứng
    const call = mockPrisma.hocVien.findMany.mock.calls[0][0];
    expect(call.take).toBe(30);
  });

  it('không vượt quá limit tối đa 200', async () => {
    mockPrisma.hocVien.findMany.mockResolvedValue([]);
    mockPrisma.graduationAudit.findMany.mockResolvedValue([]);
    await batchRunGraduation({ limit: 9999 });
    const call = mockPrisma.hocVien.findMany.mock.calls[0][0];
    expect(call.take).toBe(200);
  });
});

// ===== APPROVE AUDIT =====

describe('approveAudit', () => {
  it('phê duyệt thành công từ ELIGIBLE', async () => {
    mockPrisma.graduationAudit.findUnique.mockResolvedValue({
      id: 'audit-1',
      status: GraduationAuditStatus.ELIGIBLE,
      notes: null,
    });
    mockPrisma.graduationAudit.update.mockResolvedValue({
      id: 'audit-1',
      status: GraduationAuditStatus.APPROVED,
    });

    const result = await approveAudit('audit-1', 'actor-id', { decisionNo: 'QĐ-001' });
    expect(result.status).toBe(GraduationAuditStatus.APPROVED);
    expect(mockPrisma.graduationAudit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: GraduationAuditStatus.APPROVED,
          decisionNo: 'QĐ-001',
          approvedBy: 'actor-id',
        }),
      })
    );
  });

  it('ném lỗi khi phê duyệt từ trạng thái INELIGIBLE', async () => {
    mockPrisma.graduationAudit.findUnique.mockResolvedValue({
      id: 'audit-1',
      status: GraduationAuditStatus.INELIGIBLE,
    });

    await expect(approveAudit('audit-1', 'actor-id', { decisionNo: 'QĐ-001' }))
      .rejects.toThrow('Chỉ ELIGIBLE mới được phê duyệt');
  });

  it('ném lỗi khi audit không tồn tại', async () => {
    mockPrisma.graduationAudit.findUnique.mockResolvedValue(null);
    await expect(approveAudit('ghost-id', 'actor-id', { decisionNo: 'QĐ-001' }))
      .rejects.toThrow('không tồn tại');
  });
});

// ===== REJECT AUDIT =====

describe('rejectAudit', () => {
  it('từ chối thành công từ ELIGIBLE', async () => {
    mockPrisma.graduationAudit.findUnique.mockResolvedValue({
      id: 'audit-2',
      status: GraduationAuditStatus.ELIGIBLE,
    });
    mockPrisma.graduationAudit.update.mockResolvedValue({
      id: 'audit-2',
      status: GraduationAuditStatus.REJECTED,
    });

    const result = await rejectAudit('audit-2', 'actor-id', 'Chưa đủ hồ sơ');
    expect(result.status).toBe(GraduationAuditStatus.REJECTED);
  });

  it('ném lỗi khi từ chối từ APPROVED', async () => {
    mockPrisma.graduationAudit.findUnique.mockResolvedValue({
      id: 'audit-2',
      status: GraduationAuditStatus.APPROVED,
    });
    await expect(rejectAudit('audit-2', 'actor-id', 'Lý do')).rejects.toThrow();
  });
});

// ===== ISSUE DIPLOMA =====

describe('issueDiploma', () => {
  const validInput = {
    diplomaType: 'dai_hoc',
    classification: 'Giỏi',
    graduationDate: new Date('2026-06-15'),
    issuedBy: 'admin-id',
  };

  it('cấp bằng thành công khi audit APPROVED và chưa có diploma', async () => {
    mockPrisma.graduationAudit.findUnique.mockResolvedValue({
      id: 'audit-3',
      hocVienId: 'hv-1',
      status: GraduationAuditStatus.APPROVED,
      diplomaRecord: null,
    });
    mockPrisma.diplomaRecord.findFirst.mockResolvedValue(null);
    mockPrisma.diplomaRecord.create.mockResolvedValue({
      id: 'diploma-1',
      diplomaNo: 'BV-2026-00001',
    });

    const result = await issueDiploma('audit-3', validInput);
    expect(result.diplomaNo).toBe('BV-2026-00001');
    expect(mockPrisma.diplomaRecord.create).toHaveBeenCalledOnce();
  });

  it('ném lỗi khi cấp bằng cho audit chưa APPROVED', async () => {
    mockPrisma.graduationAudit.findUnique.mockResolvedValue({
      id: 'audit-4',
      hocVienId: 'hv-2',
      status: GraduationAuditStatus.ELIGIBLE,
      diplomaRecord: null,
    });

    await expect(issueDiploma('audit-4', validInput))
      .rejects.toThrow('Chỉ được cấp bằng khi trạng thái APPROVED');
  });

  it('ném lỗi khi bằng đã tồn tại (duplicate prevention)', async () => {
    mockPrisma.graduationAudit.findUnique.mockResolvedValue({
      id: 'audit-5',
      hocVienId: 'hv-3',
      status: GraduationAuditStatus.APPROVED,
      diplomaRecord: { id: 'existing', diplomaNo: 'BV-2026-00001' },
    });

    await expect(issueDiploma('audit-5', validInput))
      .rejects.toThrow('Bằng đã được cấp');
  });

  it('không tạo được 2 DiplomaRecord cho cùng 1 auditId', async () => {
    // Simulate: findUnique trả về diplomaRecord đã tồn tại sau lần đầu
    mockPrisma.graduationAudit.findUnique.mockResolvedValue({
      id: 'audit-6',
      hocVienId: 'hv-4',
      status: GraduationAuditStatus.APPROVED,
      diplomaRecord: { id: 'dup', diplomaNo: 'BV-2026-00002' },
    });

    await expect(issueDiploma('audit-6', validInput)).rejects.toThrow();
    expect(mockPrisma.diplomaRecord.create).not.toHaveBeenCalled();
  });
});
