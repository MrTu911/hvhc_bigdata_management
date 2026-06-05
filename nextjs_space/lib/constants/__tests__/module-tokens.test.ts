/**
 * Tests – Hợp đồng token màu theo module (ModuleHero theming).
 *
 * Đợt nâng cấp UI/UX dùng MODULE_TOKENS để tô màu hero/sidebar cho từng module.
 * Test bảo vệ: mỗi ModuleId resolve ra token đầy đủ (không gradient rỗng do typo),
 * và không có key thừa/thiếu so với union ModuleId — tránh trang rơi về hero mặc định.
 */

import { describe, it, expect } from 'vitest';
import { MODULE_TOKENS, type ModuleId } from '@/lib/constants/module-tokens';

const ALL_IDS: ModuleId[] = [
  'personnel', 'party', 'education', 'research', 'policy',
  'insurance', 'student', 'science', 'admin', 'workflow', 'default',
];

// Các field phải luôn có giá trị (code='' hợp lệ cho 'default' nên không kiểm tra ở đây).
const REQUIRED_NON_EMPTY: (keyof typeof MODULE_TOKENS['default'])[] = [
  'label', 'heroGradient', 'sidebarGradient', 'accentText', 'iconBg',
];

describe('MODULE_TOKENS contract', () => {
  it('mọi ModuleId resolve ra token đầy đủ, đúng id', () => {
    for (const id of ALL_IDS) {
      const token = MODULE_TOKENS[id];
      expect(token, `token cho '${id}'`).toBeDefined();
      expect(token.id).toBe(id);
      for (const field of REQUIRED_NON_EMPTY) {
        expect(token[field], `${id}.${field}`).toBeTruthy();
      }
    }
  });

  it('không có key thừa/thiếu so với union ModuleId', () => {
    expect(Object.keys(MODULE_TOKENS).sort()).toEqual([...ALL_IDS].sort());
  });
});
