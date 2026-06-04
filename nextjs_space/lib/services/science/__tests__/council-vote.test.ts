/**
 * Tests – Council Vote Summary (M23)
 *
 * Test: vote threshold (2/3 rule), quorum check, duplicate vote prevention,
 *       PENDING members không ảnh hưởng ngưỡng.
 *
 * Targets: lib/repositories/science/council.repo.ts — getVoteSummary()
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ===== MOCKS =====

const mockPrisma = vi.hoisted(() => ({
  scientificCouncilMember: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  scientificCouncilReview: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({ default: mockPrisma, prisma: mockPrisma }));
vi.mock('server-only', () => ({}));

import { councilRepo } from '@/lib/repositories/science/council.repo';

// ===== HELPERS =====

function makeMember(id: string, vote: string | null) {
  return {
    id,
    vote,
    role: 'MEMBER',
    user: { id: `user-${id}`, name: `User ${id}` },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ===== VOTE SUMMARY: 2/3 RULE =====

describe('councilRepo.getVoteSummary — 2/3 rule', () => {
  it('gợi ý PASS khi đủ 2/3 vote PASS (3/3)', async () => {
    mockPrisma.scientificCouncilMember.findMany.mockResolvedValue([
      makeMember('1', 'PASS'),
      makeMember('2', 'PASS'),
      makeMember('3', 'PASS'),
    ]);
    const result = await councilRepo.getVoteSummary('council-1');
    expect(result.suggestedResult).toBe('PASS');
    expect(result.voted).toBe(3);
    expect(result.voteCounts.PASS).toBe(3);
  });

  it('gợi ý PASS khi 2/3 vote PASS (2/3 với ceiling)', async () => {
    // 3 người: 2 PASS, 1 FAIL — ceil(3*2/3) = 2 → PASS >= 2 = true
    mockPrisma.scientificCouncilMember.findMany.mockResolvedValue([
      makeMember('1', 'PASS'),
      makeMember('2', 'PASS'),
      makeMember('3', 'FAIL'),
    ]);
    const result = await councilRepo.getVoteSummary('council-2');
    expect(result.suggestedResult).toBe('PASS');
  });

  it('gợi ý FAIL khi đủ 2/3 vote FAIL', async () => {
    // 3 người: 0 PASS, 2 FAIL, 1 REVISE
    mockPrisma.scientificCouncilMember.findMany.mockResolvedValue([
      makeMember('1', 'FAIL'),
      makeMember('2', 'FAIL'),
      makeMember('3', 'REVISE'),
    ]);
    const result = await councilRepo.getVoteSummary('council-3');
    expect(result.suggestedResult).toBe('FAIL');
  });

  it('suggestedResult = null khi không đủ ngưỡng 2/3', async () => {
    // 3 người: 1 PASS, 1 FAIL, 1 REVISE
    mockPrisma.scientificCouncilMember.findMany.mockResolvedValue([
      makeMember('1', 'PASS'),
      makeMember('2', 'FAIL'),
      makeMember('3', 'REVISE'),
    ]);
    const result = await councilRepo.getVoteSummary('council-4');
    expect(result.suggestedResult).toBeNull();
  });
});

// ===== QUORUM =====

describe('councilRepo.getVoteSummary — quorum', () => {
  it('suggestedResult = null khi không có ai vote (tất cả PENDING)', async () => {
    mockPrisma.scientificCouncilMember.findMany.mockResolvedValue([
      makeMember('1', null),
      makeMember('2', null),
      makeMember('3', null),
    ]);
    const result = await councilRepo.getVoteSummary('council-5');
    expect(result.voted).toBe(0);
    expect(result.suggestedResult).toBeNull();
  });

  it('tính đúng voted count khi có hỗn hợp vote và PENDING', async () => {
    // 5 thành viên: 2 vote, 3 PENDING
    mockPrisma.scientificCouncilMember.findMany.mockResolvedValue([
      makeMember('1', 'PASS'),
      makeMember('2', 'PASS'),
      makeMember('3', null),
      makeMember('4', null),
      makeMember('5', null),
    ]);
    const result = await councilRepo.getVoteSummary('council-6');
    expect(result.voted).toBe(2);
    expect(result.total).toBe(5);
    expect(result.voteCounts.PENDING).toBe(3);
  });

  it('hội đồng rỗng (0 thành viên) trả voted = 0 và null result', async () => {
    mockPrisma.scientificCouncilMember.findMany.mockResolvedValue([]);
    const result = await councilRepo.getVoteSummary('council-empty');
    expect(result.total).toBe(0);
    expect(result.voted).toBe(0);
    expect(result.suggestedResult).toBeNull();
  });
});

// ===== VOTE DETAIL STRUCTURE =====

describe('councilRepo.getVoteSummary — voteDetails', () => {
  it('voteDetails chứa đủ thông tin từng thành viên', async () => {
    mockPrisma.scientificCouncilMember.findMany.mockResolvedValue([
      makeMember('1', 'PASS'),
    ]);
    const result = await councilRepo.getVoteSummary('council-7');
    expect(result.voteDetails).toHaveLength(1);
    expect(result.voteDetails[0]).toMatchObject({
      memberId: '1',
      userId: 'user-1',
      userName: 'User 1',
      role: 'MEMBER',
      vote: 'PASS',
    });
  });

  it('vote = null (chưa bầu) được map thành null trong voteDetails', async () => {
    mockPrisma.scientificCouncilMember.findMany.mockResolvedValue([
      makeMember('1', null),
    ]);
    const result = await councilRepo.getVoteSummary('council-8');
    expect(result.voteDetails[0].vote).toBeNull();
    expect(result.voteCounts.PENDING).toBe(1);
  });
});

// ===== THRESHOLD EDGE CASES =====

describe('councilRepo.getVoteSummary — edge cases', () => {
  it('ceil(2/3) với 4 người cần 3 PASS để suggest PASS', async () => {
    // ceil(4 * 2/3) = ceil(2.67) = 3
    mockPrisma.scientificCouncilMember.findMany.mockResolvedValue([
      makeMember('1', 'PASS'),
      makeMember('2', 'PASS'),
      makeMember('3', 'FAIL'),
      makeMember('4', 'FAIL'),
    ]);
    const result = await councilRepo.getVoteSummary('council-9');
    // 2 PASS < 3 required → null
    expect(result.suggestedResult).toBeNull();
  });

  it('ceil(2/3) với 4 người: 3 PASS → suggest PASS', async () => {
    mockPrisma.scientificCouncilMember.findMany.mockResolvedValue([
      makeMember('1', 'PASS'),
      makeMember('2', 'PASS'),
      makeMember('3', 'PASS'),
      makeMember('4', 'FAIL'),
    ]);
    const result = await councilRepo.getVoteSummary('council-10');
    expect(result.suggestedResult).toBe('PASS');
  });
});
