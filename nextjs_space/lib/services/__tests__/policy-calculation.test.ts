/**
 * Tests – Policy Calculation Service (M05)
 *
 * Test: eligibility check (discipline block), benefit calculation, auto-expire.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PolicyRecordType, PolicyRecordStatus, PolicyRequestStatus } from '@prisma/client';

// ===== MOCKS =====

const mockPrisma = vi.hoisted(() => ({
  policyRecord: {
    findFirst: vi.fn(),
    updateMany: vi.fn(),
  },
  policyRequest: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({ prisma: mockPrisma }));
vi.mock('server-only', () => ({}));

import {
  validatePolicyEligibility,
  calculateBenefitAmount,
  expireOverduePolicyRecords,
} from '@/lib/services/policy-calculation.service';

beforeEach(() => {
  vi.clearAllMocks();
});

// ===== ELIGIBILITY =====

describe('validatePolicyEligibility', () => {
  it('cho phép EMULATION khi không có kỷ luật active', async () => {
    mockPrisma.policyRecord.findFirst.mockResolvedValue(null);
    const result = await validatePolicyEligibility('user-1', PolicyRecordType.EMULATION);
    expect(result.eligible).toBe(true);
    expect(result.blockReasons).toHaveLength(0);
  });

  it('block REWARD khi có DISCIPLINE record còn active (chưa hết hạn)', async () => {
    mockPrisma.policyRecord.findFirst.mockResolvedValue({
      id: 'disc-1',
      title: 'Kỷ luật cảnh cáo',
      decisionDate: new Date('2025-01-01'),
    });
    const result = await validatePolicyEligibility('user-1', PolicyRecordType.REWARD);
    expect(result.eligible).toBe(false);
    expect(result.blockReasons[0]).toContain('kỷ luật đang hiệu lực');
  });

  it('block EMULATION khi có DISCIPLINE record active', async () => {
    mockPrisma.policyRecord.findFirst.mockResolvedValue({
      id: 'disc-2',
      title: 'Kỷ luật khiển trách',
      decisionDate: new Date('2025-06-01'),
    });
    const result = await validatePolicyEligibility('user-2', PolicyRecordType.EMULATION);
    expect(result.eligible).toBe(false);
    expect(result.blockReasons).toHaveLength(1);
  });

  it('KHÔNG check discipline cho DISCIPLINE type', async () => {
    // Không gọi DB khi type = DISCIPLINE
    const result = await validatePolicyEligibility('user-3', PolicyRecordType.DISCIPLINE);
    expect(result.eligible).toBe(true);
    expect(mockPrisma.policyRecord.findFirst).not.toHaveBeenCalled();
  });
});

// ===== CALCULATION =====

describe('calculateBenefitAmount', () => {
  it('trả về null khi PolicyRequest không tồn tại', async () => {
    mockPrisma.policyRequest.findUnique.mockResolvedValue(null);
    const result = await calculateBenefitAmount('ghost-id');
    expect(result).toBeNull();
  });

  it('tính đúng estimatedAmount khi không cần phê duyệt', async () => {
    mockPrisma.policyRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      requestedAmount: '10000000',
      currency: 'VND',
      category: { code: 'ALLOWANCE_A', requiresApproval: false, approvalLevels: 1 },
    });
    const result = await calculateBenefitAmount('req-1');
    expect(result?.estimatedAmount).toBe(10000000);
    expect(result?.currency).toBe('VND');
  });

  it('giảm estimatedAmount theo buffer khi có nhiều cấp duyệt', async () => {
    mockPrisma.policyRequest.findUnique.mockResolvedValue({
      id: 'req-2',
      requestedAmount: '10000000',
      currency: 'VND',
      category: { code: 'ALLOWANCE_B', requiresApproval: true, approvalLevels: 3 },
    });
    const result = await calculateBenefitAmount('req-2');
    // 10_000_000 * 0.95^2 ≈ 9_025_000
    expect(result?.estimatedAmount).toBeLessThan(10000000);
    expect(result?.estimatedAmount).toBeGreaterThan(0);
  });

  it('xử lý requestedAmount = null (không có số tiền)', async () => {
    mockPrisma.policyRequest.findUnique.mockResolvedValue({
      id: 'req-3',
      requestedAmount: null,
      currency: 'VND',
      category: { code: 'ALLOWANCE_C', requiresApproval: true, approvalLevels: 1 },
    });
    const result = await calculateBenefitAmount('req-3');
    expect(result?.requestedAmount).toBe(0);
    expect(result?.estimatedAmount).toBe(0);
  });
});

// ===== AUTO-EXPIRE =====

describe('expireOverduePolicyRecords', () => {
  it('cập nhật status thành EXPIRED cho record quá hạn', async () => {
    mockPrisma.policyRecord.updateMany.mockResolvedValue({ count: 5 });
    const count = await expireOverduePolicyRecords();
    expect(count).toBe(5);
    expect(mockPrisma.policyRecord.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: PolicyRecordStatus.EXPIRED },
        where: expect.objectContaining({
          status: PolicyRecordStatus.ACTIVE,
        }),
      })
    );
  });

  it('idempotent: trả về 0 khi không có record hết hạn', async () => {
    mockPrisma.policyRecord.updateMany.mockResolvedValue({ count: 0 });
    const count = await expireOverduePolicyRecords();
    expect(count).toBe(0);
  });
});
