/**
 * Tests – Tính đầy đủ của từ điển i18n (vi/en).
 *
 * Bối cảnh: `t(key)` trong language-provider fallback IM LẶNG về raw key khi
 * thiếu, nên nhãn vỡ không gây lỗi runtime và rất khó phát hiện bằng mắt.
 * Sau đợt nâng cấp UI/UX, dictionary mở rộng mạnh — test này chốt 3 ràng buộc:
 *   1. Tập key vi PHẢI bằng tập key en (chuyển ngôn ngữ không lộ raw key).
 *   2. Mọi key menu (nav.*) trong menu-config PHẢI có ở cả vi và en (sidebar 301 trang).
 *   3. Mọi giá trị enum UserRole PHẢI có role.<value> ở cả vi và en
 *      (t(`role.${user.role}`) hiển thị đúng).
 *
 * Test đọc các file dạng text để giữ hermetic (không import UI deps vào node env).
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const PROVIDER = path.join(ROOT, 'components/providers/language-provider.tsx');
const MENU_CONFIG = path.join(ROOT, 'lib/menu-config.ts');
const SCHEMA = path.join(ROOT, 'prisma/schema.prisma');

/** Lấy tập key (dotted, single-quoted, đầu dòng) trong một đoạn dictionary. */
function extractKeys(block: string): Set<string> {
  const keys = new Set<string>();
  const re = /^\s*'([\w.]+)'\s*:/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) keys.add(m[1]);
  return keys;
}

function splitDictionaries(): { vi: Set<string>; en: Set<string> } {
  const text = fs.readFileSync(PROVIDER, 'utf8');
  const enIdx = text.indexOf('\n  en: {');
  if (enIdx === -1) throw new Error('Không tìm thấy block en trong language-provider');
  return {
    vi: extractKeys(text.slice(0, enIdx)),
    en: extractKeys(text.slice(enIdx)),
  };
}

/** Mọi literal 'nav.xxx' được tham chiếu trong menu-config (name/title items). */
function extractMenuNavKeys(): Set<string> {
  const text = fs.readFileSync(MENU_CONFIG, 'utf8');
  const keys = new Set<string>();
  const re = /'(nav\.[\w]+)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) keys.add(m[1]);
  return keys;
}

/** Giá trị enum UserRole đọc từ schema.prisma. */
function extractUserRoles(): string[] {
  const text = fs.readFileSync(SCHEMA, 'utf8');
  const block = text.match(/enum\s+UserRole\s*\{([^}]*)\}/);
  if (!block) throw new Error('Không tìm thấy enum UserRole trong schema.prisma');
  return block[1]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^[A-Z_]+$/.test(l));
}

describe('i18n dictionary completeness', () => {
  const { vi, en } = splitDictionaries();

  it('tập key vi và en phải trùng khớp (chuyển ngôn ngữ không lộ raw key)', () => {
    const viOnly = [...vi].filter((k) => !en.has(k)).sort();
    const enOnly = [...en].filter((k) => !vi.has(k)).sort();
    expect({ viOnly, enOnly }).toEqual({ viOnly: [], enOnly: [] });
  });

  it('mọi key menu (nav.*) phải có ở cả vi và en', () => {
    const menuKeys = extractMenuNavKeys();
    const missingVi = [...menuKeys].filter((k) => !vi.has(k)).sort();
    const missingEn = [...menuKeys].filter((k) => !en.has(k)).sort();
    expect({ missingVi, missingEn }).toEqual({ missingVi: [], missingEn: [] });
  });

  it('mọi giá trị enum UserRole phải có role.<value> ở cả vi và en', () => {
    const roles = extractUserRoles();
    expect(roles.length).toBeGreaterThan(0);
    const missingVi = roles.filter((r) => !vi.has(`role.${r}`)).sort();
    const missingEn = roles.filter((r) => !en.has(`role.${r}`)).sort();
    expect({ missingVi, missingEn }).toEqual({ missingVi: [], missingEn: [] });
  });
});
