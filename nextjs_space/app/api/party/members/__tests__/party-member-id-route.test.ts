/**
 * Tests – Route bảo vệ hồ sơ Đảng viên: PUT /api/party/members/[id]
 *
 * Bảo mật M03 (security/testing rules):
 * - Scope: UNIT không được sửa hồ sơ ngoài đơn vị (IDOR/scope-bypass).
 * - Trường nhạy cảm confidentialNote bị chặn khi thiếu UPDATE_PARTY_MEMBER_SENSITIVE.
 *
 * enforceScopeAccess (lib/rbac/scope-access) chạy THẬT để kiểm tra đúng hành vi
 * chặn theo scope; chỉ mock middleware/service/audit/db ở biên.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockMiddleware = vi.hoisted(() => ({ requireAnyFunction: vi.fn() }));
const mockService = vi.hoisted(() => ({
  getPartyMemberById: vi.fn(),
  updatePartyMember: vi.fn(),
  softDeletePartyMember: vi.fn(),
}));
const mockAudit = vi.hoisted(() => ({ logAudit: vi.fn(), logSensitiveAccess: vi.fn() }));

vi.mock('@/lib/rbac/middleware', () => mockMiddleware);
vi.mock('@/lib/services/party/party-member.service', () => mockService);
vi.mock('@/lib/audit', () => mockAudit);
vi.mock('@/lib/db', () => ({ default: {}, prisma: {} }));
vi.mock('server-only', () => ({}));
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

import { PUT } from '@/app/api/party/members/[id]/route';
import { PARTY } from '@/lib/rbac/function-codes';

function makeReq(body: unknown) {
  return { json: async () => body } as any;
}

const PARAMS = { params: { id: 'pm-1' } };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PUT /api/party/members/[id] – RBAC & scope', () => {
  it('thiếu function code → 403, không truy vấn hồ sơ', async () => {
    mockMiddleware.requireAnyFunction.mockResolvedValue({
      allowed: false,
      authResult: { deniedReason: 'Forbidden' },
    });

    const res: any = await PUT(makeReq({ partyRole: 'X' }), PARAMS);

    expect(res.status).toBe(403);
    expect(mockService.getPartyMemberById).not.toHaveBeenCalled();
  });

  it('scope UNIT: chặn sửa hồ sơ thuộc đơn vị khác (403), không gọi update', async () => {
    mockMiddleware.requireAnyFunction.mockResolvedValue({
      allowed: true,
      user: { id: 'mgr-1', unitId: 'unit-A' },
      authResult: { scope: 'UNIT' },
    });
    mockService.getPartyMemberById.mockResolvedValue({
      id: 'pm-1',
      userId: 'owner-9',
      user: { unitId: 'unit-B' },
    });

    const res: any = await PUT(makeReq({ partyRole: 'X' }), PARAMS);

    expect(res.status).toBe(403);
    expect(mockService.updatePartyMember).not.toHaveBeenCalled();
  });

  it('scope UNIT: cho phép sửa hồ sơ cùng đơn vị (200)', async () => {
    mockMiddleware.requireAnyFunction.mockResolvedValue({
      allowed: true,
      user: { id: 'mgr-1', unitId: 'unit-A' },
      authResult: { scope: 'UNIT' },
    });
    mockService.getPartyMemberById.mockResolvedValue({
      id: 'pm-1',
      userId: 'owner-9',
      user: { unitId: 'unit-A' },
    });
    mockService.updatePartyMember.mockResolvedValue({ id: 'pm-1', partyRole: 'X' });

    const res: any = await PUT(makeReq({ partyRole: 'X' }), PARAMS);

    expect(res.status).toBe(200);
    expect(mockService.updatePartyMember).toHaveBeenCalledTimes(1);
  });
});

describe('PUT /api/party/members/[id] – guard trường nhạy cảm confidentialNote', () => {
  it('có confidentialNote nhưng thiếu UPDATE_SENSITIVE → 403, không gọi update', async () => {
    mockMiddleware.requireAnyFunction.mockImplementation(async (_req: unknown, codes: string[]) => {
      if (codes.includes(PARTY.UPDATE_SENSITIVE)) {
        return { allowed: false, authResult: { deniedReason: 'no sensitive' } };
      }
      return { allowed: true, user: { id: 'mgr-1', unitId: 'unit-A' }, authResult: { scope: 'ACADEMY' } };
    });
    mockService.getPartyMemberById.mockResolvedValue({
      id: 'pm-1',
      userId: 'o',
      user: { unitId: 'unit-Z' },
    });

    const res: any = await PUT(makeReq({ confidentialNote: 'bí mật' }), PARAMS);

    expect(res.status).toBe(403);
    expect(mockService.updatePartyMember).not.toHaveBeenCalled();
  });

  it('có confidentialNote và có UPDATE_SENSITIVE → 200, gọi update', async () => {
    mockMiddleware.requireAnyFunction.mockResolvedValue({
      allowed: true,
      user: { id: 'mgr-1', unitId: 'unit-A' },
      authResult: { scope: 'ACADEMY' },
    });
    mockService.getPartyMemberById.mockResolvedValue({
      id: 'pm-1',
      userId: 'o',
      user: { unitId: 'unit-Z' },
    });
    mockService.updatePartyMember.mockResolvedValue({ id: 'pm-1', confidentialNote: 'bí mật' });

    const res: any = await PUT(makeReq({ confidentialNote: 'bí mật' }), PARAMS);

    expect(res.status).toBe(200);
    expect(mockService.updatePartyMember).toHaveBeenCalledTimes(1);
  });
});
