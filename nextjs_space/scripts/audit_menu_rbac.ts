/**
 * Audit menu ↔ RBAC (không cần DB).
 *
 * In ma trận: mỗi mục menu (leaf) hiển thị với những chức vụ non-admin nào,
 * và liệt kê các vấn đề:
 *  - mã menu không tồn tại trong catalog function-codes (chuỗi thô / typo)
 *  - mục menu KHÔNG yêu cầu quyền (functions rỗng → luôn hiện)
 *  - mục menu chỉ SYSTEM_ADMIN thấy (admin-only) → cần xác nhận chủ đích
 *
 * Chạy: npx tsx --require dotenv/config scripts/audit_menu_rbac.ts
 */

import { MENU_CONFIG, flattenMenuItems, type MenuItem } from '../lib/menu-config';
import {
  POSITIONS,
  flattenFunctions,
  grantsForPosition,
} from '../lib/rbac/position-grants';

function getLeafItems(): MenuItem[] {
  return MENU_CONFIG.flatMap((group) => flattenMenuItems(group.items));
}

function isLeafVisible(item: MenuItem, codes: Set<string>): boolean {
  if (!item.functions || item.functions.length === 0) return true;
  return item.functions.some((code) => codes.has(code));
}

function main() {
  // Catalog chuẩn = tập mã được seed vào bảng Function (flatten theo từng module).
  // KHÔNG dùng ALL_FUNCTION_CODES: nó spread nhiều module trùng key ngắn (VIEW, CREATE...)
  // nên Object.values() bị thu gọn sai.
  const functions = flattenFunctions();
  const catalog = new Set<string>(functions.map((fn) => fn.code));

  // Mã quyền của từng chức vụ (loại SYSTEM_ADMIN — admin thấy tất cả)
  const nonAdminPositions = POSITIONS.filter((p) => p.code !== 'SYSTEM_ADMIN');
  const codesByPosition = new Map<string, Set<string>>();
  for (const pos of nonAdminPositions) {
    const granted = grantsForPosition(pos.code, functions).map((g) => g.functionCode);
    codesByPosition.set(pos.code, new Set(granted));
  }

  const leaves = getLeafItems();

  // 1) Mã menu không có trong catalog
  const menuCodes = new Set<string>();
  for (const leaf of leaves) {
    for (const code of leaf.functions ?? []) menuCodes.add(code);
  }
  const missingCodes = [...menuCodes].filter((code) => !catalog.has(code)).sort();

  // 2) Leaf không yêu cầu quyền
  const openLeaves = leaves.filter((l) => !l.functions || l.functions.length === 0);

  // 3) Leaf chỉ admin thấy
  const adminOnlyLeaves = leaves.filter((leaf) => {
    if (!leaf.functions || leaf.functions.length === 0) return false;
    for (const pos of nonAdminPositions) {
      if (isLeafVisible(leaf, codesByPosition.get(pos.code)!)) return false;
    }
    return true;
  });

  console.log('================ AUDIT MENU ↔ RBAC ================');
  console.log(`Tổng mục menu (leaf): ${leaves.length}`);
  console.log(`Mã quyền dùng trong menu: ${menuCodes.size}`);
  console.log(`Chức vụ non-admin: ${nonAdminPositions.length}`);

  console.log('\n--- (1) Mã menu KHÔNG có trong catalog (cần sửa) ---');
  if (missingCodes.length === 0) console.log('  ✅ Không có');
  else missingCodes.forEach((c) => console.log(`  ❌ ${c}`));

  console.log('\n--- (2) Mục menu luôn hiện (functions rỗng) ---');
  if (openLeaves.length === 0) console.log('  ✅ Không có');
  else openLeaves.forEach((l) => console.log(`  ⚠️  ${l.name} (${l.href ?? 'no-href'})`));

  console.log('\n--- (3) Mục menu CHỈ SYSTEM_ADMIN thấy (admin-only) ---');
  if (adminOnlyLeaves.length === 0) console.log('  ✅ Không có');
  else
    adminOnlyLeaves.forEach((l) =>
      console.log(`  🔒 ${l.name} (${l.href ?? 'no-href'}) ← [${(l.functions ?? []).join(', ')}]`),
    );

  console.log('\n--- (4) Số mục menu mỗi chức vụ nhìn thấy ---');
  const summary = nonAdminPositions
    .map((pos) => {
      const codes = codesByPosition.get(pos.code)!;
      const visible = leaves.filter((l) => isLeafVisible(l, codes)).length;
      return { code: pos.code, visible, grants: codes.size };
    })
    .sort((a, b) => b.visible - a.visible);
  summary.forEach((s) =>
    console.log(`  ${s.code.padEnd(24)} menu=${String(s.visible).padStart(3)}  grants=${s.grants}`),
  );

  console.log('\n==================================================');
}

main();
