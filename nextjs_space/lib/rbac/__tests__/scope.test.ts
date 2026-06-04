/**
 * Tests – RBAC Scope (lib/rbac/scope.ts)
 *
 * Đây là test bảo mật quan trọng nhất.
 * Test tất cả 4 scope levels, cả allowed và denied paths.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FunctionScope } from '@prisma/client';

// ===== MOCKS =====

const mockPrisma = vi.hoisted(() => ({
  unit: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({ default: mockPrisma, prisma: mockPrisma }));
vi.mock('server-only', () => ({}));

import { checkScope } from '@/lib/rbac/scope';
import type { AuthUser, AuthContext } from '@/lib/rbac/types';

// ===== HELPERS =====

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    email: 'test@hvhc.edu.vn',
    name: 'Test User',
    role: 'CAN_BO',
    unitId: 'unit-A',
    ...overrides,
  } as AuthUser;
}

function makeContext(overrides: Partial<AuthContext> = {}): AuthContext {
  return {
    resourceUnitId: undefined,
    resourceOwnerId: undefined,
    targetUnitId: undefined,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ===== ACADEMY SCOPE =====

describe('checkScope — ACADEMY', () => {
  const user = makeUser();

  it('luôn cho phép khi không có context', () => {
    const result = checkScope('ACADEMY' as FunctionScope, user, makeContext());
    expect(result.allowed).toBe(true);
  });

  it('luôn cho phép dù resourceUnitId khác unitId', () => {
    const result = checkScope('ACADEMY' as FunctionScope, user, makeContext({ resourceUnitId: 'unit-Z' }));
    expect(result.allowed).toBe(true);
  });

  it('luôn cho phép dù resourceOwnerId khác user.id', () => {
    const result = checkScope('ACADEMY' as FunctionScope, user, makeContext({ resourceOwnerId: 'other-user' }));
    expect(result.allowed).toBe(true);
  });
});

// ===== UNIT SCOPE =====

describe('checkScope — UNIT', () => {
  const user = makeUser({ unitId: 'unit-A' });

  it('cho phép khi không cần kiểm tra unitId (resourceUnitId undefined)', () => {
    const result = checkScope('UNIT' as FunctionScope, user, makeContext());
    expect(result.allowed).toBe(true);
  });

  it('cho phép khi resourceUnitId === user.unitId', () => {
    const result = checkScope('UNIT' as FunctionScope, user, makeContext({ resourceUnitId: 'unit-A' }));
    expect(result.allowed).toBe(true);
  });

  it('từ chối khi resourceUnitId khác user.unitId', () => {
    const result = checkScope('UNIT' as FunctionScope, user, makeContext({ resourceUnitId: 'unit-B' }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Khác đơn vị');
  });

  it('từ chối khi user không có unitId và resource có unitId', () => {
    const userNoUnit = makeUser({ unitId: undefined });
    const result = checkScope('UNIT' as FunctionScope, userNoUnit, makeContext({ resourceUnitId: 'unit-A' }));
    expect(result.allowed).toBe(false);
  });
});

// ===== SELF SCOPE =====

describe('checkScope — SELF', () => {
  const user = makeUser({ id: 'user-1' });

  it('cho phép khi resourceOwnerId undefined (không cần check owner)', () => {
    const result = checkScope('SELF' as FunctionScope, user, makeContext());
    expect(result.allowed).toBe(true);
  });

  it('cho phép khi resourceOwnerId === user.id', () => {
    const result = checkScope('SELF' as FunctionScope, user, makeContext({ resourceOwnerId: 'user-1' }));
    expect(result.allowed).toBe(true);
  });

  it('từ chối khi resourceOwnerId !== user.id', () => {
    const result = checkScope('SELF' as FunctionScope, user, makeContext({ resourceOwnerId: 'user-2' }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Không phải dữ liệu của bản thân');
  });

  it('từ chối khi user.id khác và resourceOwnerId được set', () => {
    const result = checkScope('SELF' as FunctionScope, makeUser({ id: 'user-3' }), makeContext({ resourceOwnerId: 'user-4' }));
    expect(result.allowed).toBe(false);
  });
});

// ===== DEPARTMENT SCOPE (sync path) =====

describe('checkScope — DEPARTMENT (sync path)', () => {
  const user = makeUser({ id: 'user-1', unitId: 'unit-A' });

  it('cho phép khi resourceUnitId undefined (không cần check đơn vị)', () => {
    const result = checkScope('DEPARTMENT' as FunctionScope, user, makeContext());
    expect(result.allowed).toBe(true);
  });

  it('cho phép khi resourceUnitId === user.unitId (cùng đơn vị, sync fast path)', () => {
    const result = checkScope('DEPARTMENT' as FunctionScope, user, makeContext({ resourceUnitId: 'unit-A' }));
    expect(result.allowed).toBe(true);
  });

  it('từ chối khi resourceUnitId khác (hierarchy cần async check)', () => {
    // Sync path: FAIL-CLOSED nếu khác unit và không thể check hierarchy
    const result = checkScope('DEPARTMENT' as FunctionScope, user, makeContext({ resourceUnitId: 'unit-sub-1' }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('hierarchy');
  });
});

// ===== SECURITY: CRITICAL DENIED PATHS =====

describe('Security: scope isolation critical cases', () => {
  it('UNIT user không được xem dữ liệu đơn vị khác', () => {
    const user = makeUser({ unitId: 'unit-ALPHA' });
    const result = checkScope('UNIT' as FunctionScope, user, makeContext({ resourceUnitId: 'unit-BETA' }));
    expect(result.allowed).toBe(false);
  });

  it('SELF user không được xem dữ liệu người khác', () => {
    const user = makeUser({ id: 'alice' });
    const result = checkScope('SELF' as FunctionScope, user, makeContext({ resourceOwnerId: 'bob' }));
    expect(result.allowed).toBe(false);
  });

  it('UNIT user với unitId = undefined bị từ chối khi resource có unitId', () => {
    const user = makeUser({ unitId: undefined });
    const result = checkScope('UNIT' as FunctionScope, user, makeContext({ resourceUnitId: 'unit-X' }));
    expect(result.allowed).toBe(false);
  });
});
