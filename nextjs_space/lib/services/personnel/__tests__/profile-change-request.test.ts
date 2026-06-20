/**
 * Test vòng đời + phân cấp duyệt cập nhật hồ sơ cán bộ (ProfileChangeRequest).
 * Tập trung: rule managingOrgan, auto-skip tier-1, lifecycle guard, scope, commit.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AuthUser } from '@/lib/rbac/types';

const mockPrisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn() },
  personnel: { findUnique: vi.fn() },
  youthUnionMembership: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() },
  profileChangeRequest: { update: vi.fn() },
  concurrentPosition: { findUnique: vi.fn() },
  careerHistory: { findUnique: vi.fn() },
  $transaction: vi.fn(),
}));
const mockScope = vi.hoisted(() => ({ getAccessibleUnitIds: vi.fn() }));
const mockRepo = vi.hoisted(() => ({
  createProfileChangeRequest: vi.fn(),
  findProfileChangeRequestById: vi.fn(),
  updateProfileChangeRequest: vi.fn(),
  replaceProfileChangeItems: vi.fn(),
  listProfileChangeRequests: vi.fn(),
  countProfileChangeByStatus: vi.fn(),
}));
const mockAudit = vi.hoisted(() => ({ logAudit: vi.fn() }));

vi.mock('@/lib/db', () => ({ default: mockPrisma, prisma: mockPrisma }));
vi.mock('@/lib/rbac/scope', () => mockScope);
vi.mock('@/lib/audit', () => mockAudit);
vi.mock('@/lib/repositories/personnel/profile-change-request.repo', () => mockRepo);
vi.mock('server-only', () => ({}));

import {
  submitRequest,
  actOnRequest,
  createRequest,
  ProfileChangeError,
} from '@/lib/services/personnel/profile-change-request.service';

const hr: AuthUser = { id: 'hr', email: 'hr@x', role: 'HR', unitId: 'unitHQ' };
const commander: AuthUser = { id: 'cmd', email: 'c@x', role: 'CMD', unitId: 'unitA' };

function baseRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: 'req1',
    userId: 'cadre',
    personnelId: 'p1',
    status: 'DRAFT',
    unitId: 'unitA',
    workflowInstanceId: null,
    items: [{ id: 'it1', itemType: 'EXTENDED_FIELD', fieldName: 'aliasName', requestedValue: 'Tên mới' }],
    user: { id: 'cadre', name: 'Nguyễn A', unitId: 'unitA', unitRelation: { id: 'unitA', name: 'Đơn vị A', commanderId: 'cmd' } },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRepo.updateProfileChangeRequest.mockImplementation(async (_id: string, data: Record<string, unknown>) => ({ ...baseRequest(), ...data }));
  mockPrisma.user.findUnique.mockResolvedValue({ id: 'cadre', unitId: 'unitA', personnelId: 'p1' });
});

describe('submitRequest', () => {
  it('chặn gửi duyệt khi cán bộ chưa có managingOrgan (409)', async () => {
    mockRepo.findProfileChangeRequestById.mockResolvedValue(baseRequest());
    mockPrisma.personnel.findUnique.mockResolvedValue({ managingOrgan: null });
    await expect(submitRequest('req1', 'cadre')).rejects.toMatchObject({ status: 409 });
  });

  it('auto-skip tier-1 khi người đề nghị chính là chỉ huy → UNIT_APPROVED', async () => {
    // commanderId === userId (cadre) → tự duyệt cấp 1
    mockRepo.findProfileChangeRequestById.mockResolvedValue(
      baseRequest({ userId: 'cmd', user: { id: 'cmd', name: 'CH', unitId: 'unitA', unitRelation: { commanderId: 'cmd' } } }),
    );
    mockPrisma.personnel.findUnique.mockResolvedValue({ managingOrgan: 'BAN_CAN_BO' });
    await submitRequest('req1', 'cmd');
    const arg = mockRepo.updateProfileChangeRequest.mock.calls[0][1];
    expect(arg.status).toBe('UNIT_APPROVED');
    expect(arg.tier1ReviewedAt).toBeInstanceOf(Date);
  });

  it('gửi duyệt bình thường → SUBMITTED, tier1ReviewerId = chỉ huy đơn vị', async () => {
    mockRepo.findProfileChangeRequestById.mockResolvedValue(baseRequest());
    mockPrisma.personnel.findUnique.mockResolvedValue({ managingOrgan: 'BAN_QUAN_LUC' });
    await submitRequest('req1', 'cadre');
    const arg = mockRepo.updateProfileChangeRequest.mock.calls[0][1];
    expect(arg.status).toBe('SUBMITTED');
    expect(arg.tier1ReviewerId).toBe('cmd');
    expect(arg.managingOrgan).toBe('BAN_QUAN_LUC');
  });
});

describe('actOnRequest lifecycle + scope', () => {
  it('tier-1 hành động khi không ở trạng thái SUBMITTED → 409', async () => {
    mockRepo.findProfileChangeRequestById.mockResolvedValue(baseRequest({ status: 'UNIT_APPROVED' }));
    await expect(
      actOnRequest({ requestId: 'req1', tier: 1, action: 'APPROVE', actor: commander, scope: 'ACADEMY' }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('tier-1 ngoài phạm vi đơn vị → 403', async () => {
    mockRepo.findProfileChangeRequestById.mockResolvedValue(baseRequest({ status: 'SUBMITTED' }));
    mockScope.getAccessibleUnitIds.mockResolvedValue(['unitB']); // không chứa unitA
    await expect(
      actOnRequest({ requestId: 'req1', tier: 1, action: 'APPROVE', actor: commander, scope: 'UNIT' }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('tier-1 APPROVE → UNIT_APPROVED', async () => {
    mockRepo.findProfileChangeRequestById.mockResolvedValue(baseRequest({ status: 'SUBMITTED' }));
    await actOnRequest({ requestId: 'req1', tier: 1, action: 'APPROVE', actor: commander, scope: 'ACADEMY' });
    const arg = mockRepo.updateProfileChangeRequest.mock.calls[0][1];
    expect(arg.status).toBe('UNIT_APPROVED');
    expect(arg.tier1ReviewerId).toBe('cmd');
  });
});

describe('actOnRequest tier-2 commit', () => {
  it('tier-2 APPROVE áp giá trị vào CSDL (user.update) + đặt APPROVED', async () => {
    const txMock = {
      user: { update: vi.fn() },
      youthUnionMembership: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() },
      profileChangeRequest: { update: vi.fn() },
    };
    mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof txMock) => Promise<void>) => cb(txMock));
    mockRepo.findProfileChangeRequestById.mockResolvedValue(baseRequest({ status: 'UNIT_APPROVED' }));

    await actOnRequest({ requestId: 'req1', tier: 2, action: 'APPROVE', actor: hr, scope: 'ACADEMY' });

    expect(txMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'cadre' }, data: expect.objectContaining({ aliasName: 'Tên mới' }) }),
    );
    expect(txMock.profileChangeRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'APPROVED', committedAt: expect.any(Date) }) }),
    );
  });

  it('tier-2 APPROVE: trường mô tả (birthPlace) được CHIẾU sang Personnel (liên thông M02)', async () => {
    const txMock = {
      user: { update: vi.fn() },
      personnel: { update: vi.fn() },
      youthUnionMembership: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() },
      profileChangeRequest: { update: vi.fn() },
    };
    mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof txMock) => Promise<void>) => cb(txMock));
    mockRepo.findProfileChangeRequestById.mockResolvedValue(baseRequest({
      status: 'UNIT_APPROVED',
      items: [{ id: 'it1', itemType: 'EXTENDED_FIELD', fieldName: 'birthPlace', requestedValue: 'Thái Bình' }],
    }));

    await actOnRequest({ requestId: 'req1', tier: 2, action: 'APPROVE', actor: hr, scope: 'ACADEMY' });

    // Ghi User (mirror) + chiếu sang Personnel master cùng giá trị.
    expect(txMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ birthPlace: 'Thái Bình' }) }),
    );
    expect(txMock.personnel.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p1' }, data: expect.objectContaining({ birthPlace: 'Thái Bình' }) }),
    );
  });

  it('tier-2 APPROVE: trường chỉ-User (aliasName) KHÔNG ghi Personnel', async () => {
    const txMock = {
      user: { update: vi.fn() },
      personnel: { update: vi.fn() },
      youthUnionMembership: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() },
      profileChangeRequest: { update: vi.fn() },
    };
    mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof txMock) => Promise<void>) => cb(txMock));
    mockRepo.findProfileChangeRequestById.mockResolvedValue(baseRequest({ status: 'UNIT_APPROVED' }));

    await actOnRequest({ requestId: 'req1', tier: 2, action: 'APPROVE', actor: hr, scope: 'ACADEMY' });

    expect(txMock.user.update).toHaveBeenCalled();
    expect(txMock.personnel.update).not.toHaveBeenCalled();
  });

  it('tier-2 APPROVE: SECTION_UPDATE → update bản ghi danh sách đúng id + payload', async () => {
    const txMock = {
      user: { update: vi.fn() },
      youthUnionMembership: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() },
      profileChangeRequest: { update: vi.fn() },
      concurrentPosition: { update: vi.fn(), create: vi.fn() },
    };
    mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof txMock) => Promise<void>) => cb(txMock));
    mockRepo.findProfileChangeRequestById.mockResolvedValue(baseRequest({
      status: 'UNIT_APPROVED',
      items: [{ id: 'it1', itemType: 'SECTION_UPDATE', sectionSlug: 'concurrent-positions', targetRecordId: 'rec1', requestedValue: { positionTitle: 'Phó Chủ nhiệm' } }],
    }));

    await actOnRequest({ requestId: 'req1', tier: 2, action: 'APPROVE', actor: hr, scope: 'ACADEMY' });

    expect(txMock.concurrentPosition.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'rec1' }, data: expect.objectContaining({ positionTitle: 'Phó Chủ nhiệm' }) }),
    );
  });

  it('tier-2 APPROVE: SECTION_UPDATE career-history → đính chính sự kiện công tác (careerHistory.update)', async () => {
    const txMock = {
      user: { update: vi.fn() },
      personnel: { update: vi.fn() },
      youthUnionMembership: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() },
      profileChangeRequest: { update: vi.fn() },
      careerHistory: { update: vi.fn(), create: vi.fn() },
    };
    mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof txMock) => Promise<void>) => cb(txMock));
    mockRepo.findProfileChangeRequestById.mockResolvedValue(baseRequest({
      status: 'UNIT_APPROVED',
      items: [{ id: 'it1', itemType: 'SECTION_UPDATE', sectionSlug: 'career-history', targetRecordId: 'evt1', requestedValue: { newRank: 'Thượng tá' } }],
    }));

    await actOnRequest({ requestId: 'req1', tier: 2, action: 'APPROVE', actor: hr, scope: 'ACADEMY' });

    expect(txMock.careerHistory.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'evt1' }, data: expect.objectContaining({ newRank: 'Thượng tá' }) }),
    );
  });

  it('tier-2 APPROVE: SECTION_DELETE → soft-delete bản ghi (deletedAt/deletedBy)', async () => {
    const txMock = {
      user: { update: vi.fn() },
      youthUnionMembership: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() },
      profileChangeRequest: { update: vi.fn() },
      concurrentPosition: { update: vi.fn() },
    };
    mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof txMock) => Promise<void>) => cb(txMock));
    mockRepo.findProfileChangeRequestById.mockResolvedValue(baseRequest({
      status: 'UNIT_APPROVED',
      items: [{ id: 'it1', itemType: 'SECTION_DELETE', sectionSlug: 'concurrent-positions', targetRecordId: 'rec9' }],
    }));

    await actOnRequest({ requestId: 'req1', tier: 2, action: 'APPROVE', actor: hr, scope: 'ACADEMY' });

    expect(txMock.concurrentPosition.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'rec9' }, data: expect.objectContaining({ deletedAt: expect.any(Date), deletedBy: hr.id }) }),
    );
  });
});

describe('createRequest IDOR guard (SECTION_UPDATE/DELETE)', () => {
  beforeEach(() => {
    mockRepo.createProfileChangeRequest.mockResolvedValue({ id: 'newreq' });
  });

  const sectionUpdateInput = {
    ownerUserId: 'cadre',
    items: [{ itemType: 'SECTION_UPDATE' as const, sectionSlug: 'concurrent-positions', targetRecordId: 'recX', requestedValue: { positionTitle: 'Y' } }],
  };

  it('chặn khi bản ghi đích thuộc người khác (403)', async () => {
    mockPrisma.concurrentPosition.findUnique.mockResolvedValue({ userId: 'someone-else', deletedAt: null });
    await expect(createRequest(sectionUpdateInput, 'cadre')).rejects.toMatchObject({ status: 403 });
    expect(mockRepo.createProfileChangeRequest).not.toHaveBeenCalled();
  });

  it('cho phép khi bản ghi đích thuộc chính chủ hồ sơ', async () => {
    mockPrisma.concurrentPosition.findUnique.mockResolvedValue({ userId: 'cadre', deletedAt: null });
    await createRequest(sectionUpdateInput, 'cadre');
    expect(mockRepo.createProfileChangeRequest).toHaveBeenCalledTimes(1);
  });

  it('đính chính sự kiện công tác (career-history) của chính chủ → cho phép', async () => {
    mockPrisma.careerHistory.findUnique.mockResolvedValue({ userId: 'cadre', deletedAt: null });
    await createRequest(
      {
        ownerUserId: 'cadre',
        items: [{ itemType: 'SECTION_UPDATE' as const, sectionSlug: 'career-history', targetRecordId: 'evt1', requestedValue: { newRank: 'Thượng tá' } }],
      },
      'cadre',
    );
    expect(mockRepo.createProfileChangeRequest).toHaveBeenCalledTimes(1);
  });

  it('đính chính sự kiện công tác của người khác → 403 (IDOR)', async () => {
    mockPrisma.careerHistory.findUnique.mockResolvedValue({ userId: 'someone-else', deletedAt: null });
    await expect(
      createRequest(
        {
          ownerUserId: 'cadre',
          items: [{ itemType: 'SECTION_UPDATE' as const, sectionSlug: 'career-history', targetRecordId: 'evtX', requestedValue: { newRank: 'X' } }],
        },
        'cadre',
      ),
    ).rejects.toMatchObject({ status: 403 });
    expect(mockRepo.createProfileChangeRequest).not.toHaveBeenCalled();
  });
});
