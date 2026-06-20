/**
 * Test vòng đời "khai báo hồ sơ lần đầu" (ProfileDeclarationService).
 * Tập trung: guard ghi trực tiếp, completeness gate, khóa sau xác nhận, mở lại + scope.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AuthUser } from '@/lib/rbac/types';

const mockPrisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn() },
  careerHistory: { count: vi.fn() },
}));
const mockScope = vi.hoisted(() => ({ getAccessibleUnitIds: vi.fn() }));
const mockAudit = vi.hoisted(() => ({ logAudit: vi.fn() }));

vi.mock('@/lib/db', () => ({ default: mockPrisma, prisma: mockPrisma }));
vi.mock('@/lib/rbac/scope', () => mockScope);
vi.mock('@/lib/audit', () => mockAudit);
vi.mock('server-only', () => ({}));

import {
  assertDeclaring,
  confirmDeclaration,
  reopenDeclaration,
  DeclarationError,
} from '@/lib/services/personnel/profile-declaration.service';

const tier2: AuthUser = { id: 'hr', email: 'hr@x', role: 'HR', unitId: 'unitHQ' };

// Mock user store có trạng thái để mô phỏng declare → khóa → mở lại.
let userRow: Record<string, unknown> | null;

beforeEach(() => {
  vi.clearAllMocks();
  userRow = {
    id: 'cadre',
    name: 'Nguyễn Văn A',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'Nam',
    profileDeclaredAt: null,
    profileDeclaredBy: null,
    unitId: 'unitA',
  };
  mockPrisma.user.findUnique.mockImplementation(async () => (userRow ? { ...userRow } : null));
  mockPrisma.user.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
    userRow = { ...(userRow as Record<string, unknown>), ...data };
    return userRow;
  });
  mockPrisma.careerHistory.count.mockResolvedValue(1); // mặc định: đủ quá trình công tác
});

describe('assertDeclaring', () => {
  it('cho phép khi đang khai báo (profileDeclaredAt = null)', async () => {
    await expect(assertDeclaring('cadre')).resolves.toBeUndefined();
  });

  it('chặn 409 khi đã chốt khai báo', async () => {
    userRow!.profileDeclaredAt = new Date();
    await expect(assertDeclaring('cadre')).rejects.toMatchObject({ status: 409 });
  });
});

describe('confirmDeclaration', () => {
  it('chặn 422 khi thiếu mục bắt buộc (chưa có quá trình công tác)', async () => {
    mockPrisma.careerHistory.count.mockResolvedValue(0);
    await expect(confirmDeclaration('cadre', 'cadre')).rejects.toMatchObject({ status: 422 });
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('khóa hồ sơ khi đủ mục: set profileDeclaredAt + audit', async () => {
    const state = await confirmDeclaration('cadre', 'cadre');
    const data = mockPrisma.user.update.mock.calls[0][0].data;
    expect(data.profileDeclaredAt).toBeInstanceOf(Date);
    expect(data.profileDeclaredBy).toBe('cadre');
    expect(state.declared).toBe(true);
    expect(mockAudit.logAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DECLARATION_CONFIRM', resourceId: 'cadre' }),
    );
  });

  it('chặn 409 khi đã xác nhận trước đó', async () => {
    userRow!.profileDeclaredAt = new Date();
    await expect(confirmDeclaration('cadre', 'cadre')).rejects.toMatchObject({ status: 409 });
  });
});

describe('reopenDeclaration', () => {
  beforeEach(() => {
    userRow!.profileDeclaredAt = new Date(); // đã khóa
  });

  it('tier-2 phạm vi ACADEMY mở lại được: profileDeclaredAt = null + audit', async () => {
    const state = await reopenDeclaration('cadre', tier2, 'ACADEMY', 'Sai sót lớn cần khai lại');
    const data = mockPrisma.user.update.mock.calls[0][0].data;
    expect(data.profileDeclaredAt).toBeNull();
    expect(state.declared).toBe(false);
    expect(mockAudit.logAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DECLARATION_REOPEN' }),
    );
  });

  it('chặn 400 khi không nêu lý do', async () => {
    await expect(reopenDeclaration('cadre', tier2, 'ACADEMY', '   ')).rejects.toMatchObject({ status: 400 });
  });

  it('chặn 403 khi ngoài phạm vi đơn vị (scope UNIT)', async () => {
    mockScope.getAccessibleUnitIds.mockResolvedValue(['otherUnit']);
    await expect(reopenDeclaration('cadre', tier2, 'UNIT', 'Mở lại')).rejects.toMatchObject({ status: 403 });
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('chặn 409 khi hồ sơ đang khai báo (chưa khóa)', async () => {
    userRow!.profileDeclaredAt = null;
    await expect(reopenDeclaration('cadre', tier2, 'ACADEMY', 'Mở lại')).rejects.toMatchObject({ status: 409 });
  });
});

describe('DeclarationError', () => {
  it('mang status code đúng', () => {
    expect(new DeclarationError('x', 422).status).toBe(422);
  });
});
