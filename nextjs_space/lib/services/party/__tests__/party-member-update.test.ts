/**
 * Tests – Cập nhật hồ sơ Đảng viên (updatePartyMember) + vòng đời trạng thái.
 *
 * Bảo vệ nghiệp vụ cốt lõi M03:
 * - Chuyển trạng thái sai bị chặn (assertPartyLifecycleTransition).
 * - Chuyển trạng thái hợp lệ sinh PartyLifecycleEvent (audit vòng đời).
 * - Cập nhật không đổi trạng thái thì không mở transaction / không sinh event.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => {
  const m: any = {
    partyMember: { findFirst: vi.fn(), update: vi.fn() },
    partyLifecycleEvent: { create: vi.fn() },
    partyLifecycleAlert: { upsert: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
  };
  m.$transaction.mockImplementation(async (cb: any) => cb(m));
  return m;
});

vi.mock('@/lib/db', () => ({ default: mockPrisma, prisma: mockPrisma }));
vi.mock('server-only', () => ({}));

import { updatePartyMember } from '@/lib/services/party/party-member.service';
import { assertPartyLifecycleTransition } from '@/lib/services/party/party-lifecycle.service';

function currentMember(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pm-1',
    userId: 'owner-1',
    organizationId: null,
    partyCardNumber: '123',
    partyRole: 'Đảng viên',
    joinDate: null,
    officialDate: null,
    recommender1: null,
    recommender2: null,
    currentReviewGrade: null,
    currentDebtAmount: 0,
    confidentialNote: null,
    status: 'QUAN_CHUNG',
    statusChangeDate: null,
    statusChangeReason: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
});

describe('updatePartyMember – vòng đời trạng thái', () => {
  it('chuyển trạng thái hợp lệ (QUAN_CHUNG→CAM_TINH) sinh PartyLifecycleEvent STATUS_TRANSITION', async () => {
    mockPrisma.partyMember.findFirst.mockResolvedValue(currentMember({ status: 'QUAN_CHUNG' }));
    mockPrisma.partyMember.update.mockResolvedValue({ id: 'pm-1', status: 'CAM_TINH' });

    const result = await updatePartyMember('pm-1', {
      status: 'CAM_TINH',
      statusChangeReason: 'Đủ điều kiện',
      updatedBy: 'actor-1',
    });

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockPrisma.partyLifecycleEvent.create).toHaveBeenCalledTimes(1);

    const eventData = mockPrisma.partyLifecycleEvent.create.mock.calls[0][0].data;
    expect(eventData.eventType).toBe('STATUS_TRANSITION');
    expect(eventData.fromStatus).toBe('QUAN_CHUNG');
    expect(eventData.toStatus).toBe('CAM_TINH');
    expect(eventData.triggeredBy).toBe('actor-1');
    expect(result).toEqual({ id: 'pm-1', status: 'CAM_TINH' });
  });

  it('chuyển trạng thái sai (QUAN_CHUNG→CHINH_THUC) bị chặn, không ghi gì', async () => {
    mockPrisma.partyMember.findFirst.mockResolvedValue(currentMember({ status: 'QUAN_CHUNG' }));

    await expect(
      updatePartyMember('pm-1', { status: 'CHINH_THUC', statusChangeReason: 'x', updatedBy: 'actor-1' }),
    ).rejects.toThrow(/Transition không hợp lệ/);

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(mockPrisma.partyLifecycleEvent.create).not.toHaveBeenCalled();
    expect(mockPrisma.partyMember.update).not.toHaveBeenCalled();
  });

  it('cập nhật không đổi trạng thái: không mở transaction, không sinh lifecycle event', async () => {
    mockPrisma.partyMember.findFirst.mockResolvedValue(
      currentMember({ status: 'CHINH_THUC', partyRole: 'Đảng viên' }),
    );
    mockPrisma.partyMember.update.mockResolvedValue({ id: 'pm-1', partyRole: 'Bí thư chi bộ' });

    await updatePartyMember('pm-1', { partyRole: 'Bí thư chi bộ' });

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(mockPrisma.partyLifecycleEvent.create).not.toHaveBeenCalled();
    expect(mockPrisma.partyMember.update).toHaveBeenCalledTimes(1);
  });
});

describe('assertPartyLifecycleTransition', () => {
  it('cho phép transition hợp lệ (DU_BI→CHINH_THUC)', () => {
    expect(() => assertPartyLifecycleTransition('DU_BI', 'CHINH_THUC')).not.toThrow();
  });

  it('chặn transition không hợp lệ (QUAN_CHUNG→KHAI_TRU)', () => {
    expect(() => assertPartyLifecycleTransition('QUAN_CHUNG', 'KHAI_TRU')).toThrow(
      /Transition không hợp lệ/,
    );
  });

  it('giữ nguyên trạng thái là no-op', () => {
    expect(() => assertPartyLifecycleTransition('CHINH_THUC', 'CHINH_THUC')).not.toThrow();
  });
});
