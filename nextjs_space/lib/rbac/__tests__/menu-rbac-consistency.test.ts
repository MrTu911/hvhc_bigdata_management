/**
 * Kiểm tra tất định: menu (lib/menu-config) ↔ RBAC grant (lib/rbac/position-grants).
 *
 * Mục tiêu (phần "Kiểm tra" của chức năng ẩn/hiện menu theo RBAC):
 *  1. Mọi mã quyền dùng trong menu phải tồn tại trong catalog function-codes
 *     (bắt chuỗi thô / typo / hằng số đổi giá trị).
 *  2. Không có mục menu nào "luôn hiện" (functions rỗng) ngoài allowlist công khai.
 *  3. Mọi mục menu phải reachable bởi ≥1 chức vụ non-admin, HOẶC nằm trong
 *     allowlist ADMIN_ONLY (mục quản trị hệ thống cố ý chỉ dành cho SYSTEM_ADMIN).
 *  4. Snapshot reachability cho các vai trò chủ chốt (học viên thấy mục cá nhân,
 *     Phòng Nhân sự thấy duyệt thăng quân hàm, Phòng Khoa học thấy cụm KH,
 *     Kỹ thuật viên thấy ML...).
 *
 * Test không cần DB: tính grant trực tiếp từ position-grants (cùng nguồn với seed).
 */

import { describe, it, expect } from 'vitest';

import {
  MENU_CONFIG,
  flattenMenuItems,
  previewSidebar,
  type MenuItem,
  type MenuGroup,
} from '@/lib/menu-config';
import {
  POSITIONS,
  flattenFunctions,
  grantsForPosition,
} from '@/lib/rbac/position-grants';

/**
 * Mục menu CỐ Ý chỉ dành cho SYSTEM_ADMIN (quản trị hệ thống).
 * Khóa theo `name` (i18n key) để ổn định khi href đổi.
 * Khi thêm/bớt mục admin-only, cập nhật danh sách này một cách có chủ đích.
 */
const ADMIN_ONLY_ITEMS = new Set<string>([
  'nav.accountManagement',
  'nav.rbacManagement',
  'nav.permissionGrants',
  'nav.rbacSoD',
  'nav.positionManagement',
  'nav.functionManagement',
  'nav.unitManagement',
  'nav.masterData',
  'nav.linkPersonnel',
  'nav.dashboardManagement',
  'nav.aiSettings',
]);

/** Mục menu được phép luôn hiện (không gắn quyền). Hiện tại: rỗng. */
const PUBLIC_ITEMS = new Set<string>([]);

const CATALOG = new Set<string>(flattenFunctions().map((fn) => fn.code));
const ALL_FUNCTIONS = flattenFunctions();
const NON_ADMIN_POSITIONS = POSITIONS.filter((p) => p.code !== 'SYSTEM_ADMIN');

const LEAVES: MenuItem[] = MENU_CONFIG.flatMap((group) => flattenMenuItems(group.items));

function codesForPosition(positionCode: string): Set<string> {
  return new Set(grantsForPosition(positionCode, ALL_FUNCTIONS).map((g) => g.functionCode));
}

function isVisible(item: MenuItem, codes: Set<string>): boolean {
  if (!item.functions || item.functions.length === 0) return true;
  return item.functions.some((code) => codes.has(code));
}

/** Tập tên (nav.*) các mục leaf mà 1 chức vụ nhìn thấy, qua filter thật của sidebar. */
function visibleNamesForPosition(positionCode: string): Set<string> {
  const codes = codesForPosition(positionCode);
  const groups: MenuGroup[] = previewSidebar([...codes]);
  const names = new Set<string>();
  for (const group of groups) {
    for (const leaf of flattenMenuItems(group.items)) names.add(leaf.name);
  }
  return names;
}

describe('Menu ↔ RBAC consistency', () => {
  it('(1) mọi mã quyền trong menu đều tồn tại trong catalog function-codes', () => {
    const offenders: string[] = [];
    for (const leaf of LEAVES) {
      for (const code of leaf.functions ?? []) {
        if (!CATALOG.has(code)) offenders.push(`${leaf.name} → ${code}`);
      }
    }
    expect(offenders, `Mã menu không có trong catalog:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('(2) không có mục menu luôn hiện ngoài allowlist công khai', () => {
    const openLeaves = LEAVES.filter((l) => !l.functions || l.functions.length === 0)
      .map((l) => l.name)
      .filter((name) => !PUBLIC_ITEMS.has(name));
    expect(openLeaves, `Mục menu không gắn quyền:\n${openLeaves.join('\n')}`).toEqual([]);
  });

  it('(3) mọi mục menu reachable bởi ≥1 chức vụ non-admin hoặc nằm trong ADMIN_ONLY', () => {
    const codesByPosition = NON_ADMIN_POSITIONS.map((p) => codesForPosition(p.code));

    const unreachable = LEAVES.filter((leaf) => {
      const reachable = codesByPosition.some((codes) => isVisible(leaf, codes));
      return !reachable && !ADMIN_ONLY_ITEMS.has(leaf.name);
    }).map((l) => `${l.name} (${l.href ?? 'no-href'}) ← [${(l.functions ?? []).join(', ')}]`);

    expect(
      unreachable,
      `Mục menu chỉ SYSTEM_ADMIN thấy nhưng CHƯA khai báo ADMIN_ONLY:\n${unreachable.join('\n')}`,
    ).toEqual([]);
  });

  it('(3b) allowlist ADMIN_ONLY không thừa (mỗi mục thật sự chỉ admin thấy)', () => {
    const codesByPosition = NON_ADMIN_POSITIONS.map((p) => codesForPosition(p.code));
    const leavesByName = new Map(LEAVES.map((l) => [l.name, l] as const));

    const stale: string[] = [];
    for (const name of ADMIN_ONLY_ITEMS) {
      const leaf = leavesByName.get(name);
      if (!leaf) {
        stale.push(`${name} (không còn trong menu)`);
        continue;
      }
      const reachableByNonAdmin = codesByPosition.some((codes) => isVisible(leaf, codes));
      if (reachableByNonAdmin) stale.push(`${name} (đã reachable bởi non-admin → bỏ khỏi allowlist)`);
    }
    expect(stale, `ADMIN_ONLY thừa:\n${stale.join('\n')}`).toEqual([]);
  });

  describe('(4) snapshot reachability theo vai trò', () => {
    it('Học viên / Sinh viên thấy đủ 4 mục "Không gian Cá nhân"', () => {
      const personalItems = ['nav.myProfile', 'nav.notifications', 'nav.accountSettings', 'nav.personalHub'];
      for (const positionCode of ['HOC_VIEN_QUAN_SU', 'HOC_VIEN_CAO_HOC', 'SINH_VIEN']) {
        const visible = visibleNamesForPosition(positionCode);
        for (const name of personalItems) {
          expect(visible.has(name), `${positionCode} phải thấy ${name}`).toBe(true);
        }
      }
    });

    it('Phòng Nhân sự/Quân lực thấy menu duyệt & đề nghị thăng quân hàm', () => {
      const visible = visibleNamesForPosition('TRUONG_PHONG_NHAN_SU');
      expect(visible.has('nav.rankDeclarationApproval')).toBe(true);
      expect(visible.has('nav.promotionProposals')).toBe(true);
    });

    it('Cán bộ thường thấy menu tự khai báo thăng quân hàm', () => {
      for (const positionCode of ['GIANG_VIEN', 'NGHIEN_CUU_VIEN', 'TRO_LY']) {
        const visible = visibleNamesForPosition(positionCode);
        expect(visible.has('nav.rankDeclarations'), `${positionCode} phải thấy nav.rankDeclarations`).toBe(true);
      }
    });

    it('Mọi cán bộ thấy "Đề nghị cập nhật hồ sơ"; chỉ huy/Ban CB thấy "Duyệt cập nhật hồ sơ"', () => {
      for (const positionCode of ['GIANG_VIEN', 'NHAN_VIEN', 'NGHIEN_CUU_VIEN']) {
        const visible = visibleNamesForPosition(positionCode);
        expect(visible.has('nav.myProfileChanges'), `${positionCode} phải thấy nav.myProfileChanges`).toBe(true);
        expect(visible.has('nav.profileChangeApproval'), `${positionCode} KHÔNG được thấy nav.profileChangeApproval`).toBe(false);
      }
      // Tier-1 (chỉ huy đơn vị) + tier-2 (Ban cán bộ/Quân lực) đều thấy mục duyệt.
      for (const positionCode of ['CHI_HUY_HE', 'TRUONG_PHONG_NHAN_SU', 'GIAM_DOC']) {
        const visible = visibleNamesForPosition(positionCode);
        expect(visible.has('nav.profileChangeApproval'), `${positionCode} phải thấy nav.profileChangeApproval`).toBe(true);
      }
    });

    it('Phòng Khoa học thấy cụm Khoa học', () => {
      const visible = visibleNamesForPosition('TRUONG_PHONG_KHOA_HOC');
      expect(visible.has('nav.scienceDashboard')).toBe(true);
    });

    it('Kỹ thuật viên thấy ML models; nav.mlWorkflows giữ admin-only', () => {
      const ktv = visibleNamesForPosition('KY_THUAT_VIEN');
      expect(ktv.has('nav.mlModels')).toBe(true);
      expect(ktv.has('nav.mlWorkflows')).toBe(false);
    });

    it('GUEST chỉ thấy menu tối thiểu (không thấy mục cá nhân/nghiệp vụ)', () => {
      const visible = visibleNamesForPosition('GUEST');
      expect(visible.has('nav.myProfile')).toBe(false);
      expect(visible.has('nav.rankDeclarations')).toBe(false);
    });
  });
});
