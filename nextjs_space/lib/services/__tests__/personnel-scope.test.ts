/**
 * Tests – Scope filtering khi xuất nhân sự (PersonnelService.exportData)
 *
 * Test bảo mật: scope UNIT chỉ thấy nhân sự trong đơn vị được phép,
 * SELF chỉ thấy bản thân, ACADEMY thấy tất cả.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FunctionScope } from '@prisma/client';

const mockPrisma = vi.hoisted(() => ({
  personnel: {
    findMany: vi.fn(),
  },
}));

const mockScope = vi.hoisted(() => ({
  getAccessibleUnitIds: vi.fn(),
  checkScope: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ default: mockPrisma, prisma: mockPrisma }));
vi.mock('@/lib/rbac/scope', () => mockScope);
vi.mock('server-only', () => ({}));

import { PersonnelService } from '@/lib/services/personnel-service';
import type { ScopedQueryOptions } from '@/lib/services/base-service';
import type { AuthUser } from '@/lib/rbac/types';

function makeOptions(scope: FunctionScope, unitId = 'unit-A'): ScopedQueryOptions {
  return {
    user: {
      id: 'user-1',
      email: 'a@hvhc.edu.vn',
      name: 'A',
      role: 'CAN_BO',
      unitId,
    } as AuthUser,
    scope,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.personnel.findMany.mockResolvedValue([]);
});

describe('PersonnelService.exportData – scope filtering', () => {
  it('scope UNIT chỉ truy vấn nhân sự trong các đơn vị được phép', async () => {
    mockScope.getAccessibleUnitIds.mockResolvedValue(['unit-A', 'unit-A1']);

    await PersonnelService.exportData(makeOptions('UNIT' as FunctionScope));

    const where = mockPrisma.personnel.findMany.mock.calls[0][0].where;
    expect(where.unitId).toEqual({ in: ['unit-A', 'unit-A1'] });
    expect(where.id).toBeUndefined();
  });

  it('scope UNIT không có đơn vị nào → trả mảng đơn vị rỗng (không lộ dữ liệu)', async () => {
    mockScope.getAccessibleUnitIds.mockResolvedValue([]);

    await PersonnelService.exportData(makeOptions('UNIT' as FunctionScope));

    const where = mockPrisma.personnel.findMany.mock.calls[0][0].where;
    expect(where.unitId).toEqual({ in: [] });
  });

  it('scope SELF chỉ truy vấn bản thân (theo id)', async () => {
    await PersonnelService.exportData(makeOptions('SELF' as FunctionScope));

    const where = mockPrisma.personnel.findMany.mock.calls[0][0].where;
    expect(where.id).toBe('user-1');
    expect(where.unitId).toBeUndefined();
    // SELF không cần tra cứu đơn vị
    expect(mockScope.getAccessibleUnitIds).not.toHaveBeenCalled();
  });

  it('scope ACADEMY không áp filter đơn vị (thấy tất cả)', async () => {
    await PersonnelService.exportData(makeOptions('ACADEMY' as FunctionScope));

    const where = mockPrisma.personnel.findMany.mock.calls[0][0].where;
    expect(where.unitId).toBeUndefined();
    expect(where.id).toBeUndefined();
  });

  it('filter unitId bổ sung được áp cùng scope', async () => {
    mockScope.getAccessibleUnitIds.mockResolvedValue(['unit-A']);

    await PersonnelService.exportData(makeOptions('UNIT' as FunctionScope), {
      unitId: 'unit-A',
    });

    const where = mockPrisma.personnel.findMany.mock.calls[0][0].where;
    expect(where.unitId).toBe('unit-A'); // filter cụ thể ghi đè trong where
  });
});
