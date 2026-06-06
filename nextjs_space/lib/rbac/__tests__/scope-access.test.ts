/**
 * Tests – Record-level scope enforcement (lib/rbac/scope-access.ts)
 *
 * Regression guard for the by-id IDOR / scope-bypass fix: a UNIT-scoped user
 * must NOT reach a record outside their unit, and a SELF-scoped user must NOT
 * reach another user's record — even when they hold the function code.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FunctionScope } from '@prisma/client';

const mockPrisma = vi.hoisted(() => ({
  unit: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({ default: mockPrisma, prisma: mockPrisma }));
vi.mock('server-only', () => ({}));
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

import { canAccessResource, enforceScopeAccess } from '@/lib/rbac/scope-access';
import type { AuthUser, AuthResult } from '@/lib/rbac/types';

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

const scopeResult = (scope: FunctionScope): AuthResult => ({ scope }) as AuthResult;

describe('canAccessResource', () => {
  beforeEach(() => {
    mockPrisma.unit.findMany.mockReset();
  });

  it('ACADEMY: allowed for any unit', async () => {
    const r = await canAccessResource(makeUser(), 'ACADEMY', { resourceUnitId: 'unit-Z' });
    expect(r.allowed).toBe(true);
  });

  it('UNIT: allowed when record is in the same unit', async () => {
    const r = await canAccessResource(makeUser({ unitId: 'unit-A' }), 'UNIT', { resourceUnitId: 'unit-A' });
    expect(r.allowed).toBe(true);
  });

  it('UNIT: DENIED when record is in a different unit (the scope-bypass fix)', async () => {
    const r = await canAccessResource(makeUser({ unitId: 'unit-A' }), 'UNIT', { resourceUnitId: 'unit-B' });
    expect(r.allowed).toBe(false);
  });

  it('SELF: allowed for the owner', async () => {
    const r = await canAccessResource(makeUser({ id: 'user-1' }), 'SELF', { resourceOwnerId: 'user-1' });
    expect(r.allowed).toBe(true);
  });

  it("SELF: DENIED for another user's record", async () => {
    const r = await canAccessResource(makeUser({ id: 'user-1' }), 'SELF', { resourceOwnerId: 'user-2' });
    expect(r.allowed).toBe(false);
  });

  it('DEPARTMENT: DENIED when record unit is outside the department subtree', async () => {
    // user unit-A has no children → accessible = [unit-A]; record in unit-B is out.
    mockPrisma.unit.findMany.mockResolvedValue([]);
    const r = await canAccessResource(makeUser({ unitId: 'unit-A' }), 'DEPARTMENT', { resourceUnitId: 'unit-B' });
    expect(r.allowed).toBe(false);
  });
});

describe('enforceScopeAccess', () => {
  it('returns null (continue) when allowed', async () => {
    const denied = await enforceScopeAccess(makeUser(), scopeResult('ACADEMY'), { resourceUnitId: 'unit-Z' });
    expect(denied).toBeNull();
  });

  it('returns a 403 response when out of scope', async () => {
    const denied = await enforceScopeAccess(
      makeUser({ unitId: 'unit-A' }),
      scopeResult('UNIT'),
      { resourceUnitId: 'unit-B' },
    );
    expect(denied).not.toBeNull();
    expect((denied as any).status).toBe(403);
  });

  it('defaults to SELF scope when authResult has no scope (fail-closed)', async () => {
    const denied = await enforceScopeAccess(makeUser({ id: 'user-1' }), undefined, { resourceOwnerId: 'user-2' });
    expect(denied).not.toBeNull();
    expect((denied as any).status).toBe(403);
  });
});
