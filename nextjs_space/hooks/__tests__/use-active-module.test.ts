/**
 * Tests – Ánh xạ pathname -> ModuleId (driver cho màu ModuleHero theo module).
 *
 * Mock usePathname để chạy logic thuần (không cần render React). Bảo vệ:
 * - các path đại diện map đúng module,
 * - mọi kết quả đều là key hợp lệ của MODULE_TOKENS (không rơi token undefined).
 */

import { describe, it, expect, vi } from 'vitest';

const { mockUsePathname } = vi.hoisted(() => ({ mockUsePathname: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: mockUsePathname }));

import { useActiveModule } from '@/hooks/use-active-module';
import { MODULE_TOKENS, type ModuleId } from '@/lib/constants/module-tokens';

const CASES: [string, ModuleId][] = [
  ['/dashboard/personnel/list', 'personnel'],
  ['/dashboard/party/members', 'party'],
  ['/dashboard/education/students', 'education'],
  ['/dashboard/student/123', 'student'],
  ['/dashboard/research/projects', 'research'],
  ['/dashboard/policy', 'policy'],
  ['/dashboard/insurance/list', 'insurance'],
  ['/dashboard/emulation/rewards', 'policy'], // emulation gộp vào policy theming
  ['/dashboard/science/activities', 'science'],
  ['/dashboard/workflow/my-work', 'workflow'],
  ['/dashboard/admin/rbac', 'admin'],
  ['/dashboard/settings/security', 'admin'],
  ['/dashboard/users', 'admin'],
  ['/dashboard', 'default'],
  ['/dashboard/unknown-module', 'default'],
];

describe('useActiveModule', () => {
  it.each(CASES)('map %s -> %s', (pathname, expected) => {
    mockUsePathname.mockReturnValue(pathname);
    expect(useActiveModule()).toBe(expected);
  });

  it('mọi kết quả đều là key hợp lệ của MODULE_TOKENS', () => {
    for (const [pathname] of CASES) {
      mockUsePathname.mockReturnValue(pathname);
      expect(MODULE_TOKENS[useActiveModule()]).toBeDefined();
    }
  });
});
