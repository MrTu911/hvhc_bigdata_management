/**
 * Test generic CRUD nhóm hồ sơ cán bộ điện tử: required, ép kiểu, mask nhạy cảm, scope.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AuthUser } from '@/lib/rbac/types';

const mockPrisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  personnel: { findUnique: vi.fn() },
  assetDeclaration: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  youthUnionMembership: { findUnique: vi.fn(), create: vi.fn() },
}));
const mockScope = vi.hoisted(() => ({ getAccessibleUnitIds: vi.fn() }));

vi.mock('@/lib/db', () => ({ default: mockPrisma, prisma: mockPrisma }));
vi.mock('@/lib/rbac/scope', () => mockScope);
vi.mock('server-only', () => ({}));

import { CadreProfileSectionService } from '@/lib/services/personnel/cadre-profile-section.service';
import { getCadreSection } from '@/lib/constants/cadre-profile-sections';

const assets = getCadreSection('assets')!;
const me: AuthUser = { id: 'me', email: 'a@x', role: 'CAN_BO', unitId: 'unitA' };

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.user.findUnique.mockResolvedValue({ id: 'cadre', unitId: 'unitA', personnelId: 'p1' });
  mockPrisma.assetDeclaration.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'r1', ...data }));
});

describe('CadreProfileSectionService.create', () => {
  it('chặn khi thiếu trường bắt buộc (assetType/assetName)', async () => {
    const res = await CadreProfileSectionService.create(me, 'ACADEMY', 'cadre', assets, { area: '10m2' }, true);
    expect(res.success).toBe(false);
    if (!res.success) expect(res.status).toBe(400);
  });

  it('ép kiểu select sai → 400', async () => {
    const res = await CadreProfileSectionService.create(
      me, 'ACADEMY', 'cadre', assets, { assetType: 'XXX', assetName: 'Nhà' }, true,
    );
    expect(res.success).toBe(false);
  });

  it('lưu userId + personnelId; giữ field nhạy cảm khi canSensitive=true', async () => {
    const res = await CadreProfileSectionService.create(
      me, 'ACADEMY', 'cadre', assets,
      { assetType: 'DAT', assetName: 'Đất ở', value: 1000, documentRef: 'GCN123' }, true,
    );
    expect(res.success).toBe(true);
    if (res.success) {
      const d = res.data as Record<string, unknown>;
      expect(d.userId).toBe('cadre');
      expect(d.personnelId).toBe('p1');
      expect(d.value).toBe(1000);
      expect(d.documentRef).toBe('GCN123');
    }
  });

  it('LOẠI field nhạy cảm khi canSensitive=false', async () => {
    const res = await CadreProfileSectionService.create(
      me, 'ACADEMY', 'cadre', assets,
      { assetType: 'DAT', assetName: 'Đất ở', value: 1000, documentRef: 'GCN123' }, false,
    );
    expect(res.success).toBe(true);
    if (res.success) {
      const d = res.data as Record<string, unknown>;
      expect('value' in d).toBe(false);
      expect('documentRef' in d).toBe(false);
    }
  });

  it('scope SELF: từ chối khi không phải tài khoản của chính mình', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'cadre', unitId: 'unitA', personnelId: 'p1' });
    const res = await CadreProfileSectionService.create(me, 'SELF', 'cadre', assets, { assetType: 'DAT', assetName: 'X' }, true);
    expect(res.success).toBe(false);
    if (!res.success) expect(res.status).toBe(403);
  });

  it('scope UNIT: từ chối khi cán bộ ngoài đơn vị truy cập được', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'cadre', unitId: 'unitB', personnelId: 'p1' });
    mockScope.getAccessibleUnitIds.mockResolvedValue(['unitA']);
    const res = await CadreProfileSectionService.create(me, 'UNIT', 'cadre', assets, { assetType: 'DAT', assetName: 'X' }, true);
    expect(res.success).toBe(false);
    if (!res.success) expect(res.status).toBe(403);
  });
});
