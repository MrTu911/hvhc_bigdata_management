/**
 * Tests – CSV escaping & chống formula injection (lib/export/server/official-document.ts)
 *
 * Bảo vệ chống lỗi xuất CSV cũ: không nhân đôi dấu nháy, không chống injection.
 */

import { describe, it, expect } from 'vitest';
import { escapeCsvCell, buildCsvRow } from '@/lib/export/server/official-document';

describe('escapeCsvCell', () => {
  it('bọc mọi ô trong dấu nháy kép', () => {
    expect(escapeCsvCell('Nguyễn Văn A')).toBe('"Nguyễn Văn A"');
  });

  it('nhân đôi dấu nháy kép bên trong (RFC 4180)', () => {
    expect(escapeCsvCell('Tên "biệt danh"')).toBe('"Tên ""biệt danh"""');
  });

  it('giữ nguyên dấu phẩy nhờ đã bọc nháy kép', () => {
    expect(escapeCsvCell('Hà Nội, Việt Nam')).toBe('"Hà Nội, Việt Nam"');
  });

  it('chống formula injection: prefix dấu nháy đơn cho ô bắt đầu bằng =', () => {
    expect(escapeCsvCell('=SUM(A1:A2)')).toBe('"\'=SUM(A1:A2)"');
  });

  it('chống injection cho các ký tự + - @', () => {
    expect(escapeCsvCell('+1')).toBe('"\'+1"');
    expect(escapeCsvCell('-1')).toBe('"\'-1"');
    expect(escapeCsvCell('@cmd')).toBe('"\'@cmd"');
  });

  it('ô rỗng / null / undefined → chuỗi nháy rỗng', () => {
    expect(escapeCsvCell(null)).toBe('""');
    expect(escapeCsvCell(undefined)).toBe('""');
    expect(escapeCsvCell('')).toBe('""');
  });

  it('số được chuyển thành chuỗi an toàn', () => {
    expect(escapeCsvCell(42)).toBe('"42"');
  });
});

describe('buildCsvRow', () => {
  it('ghép nhiều ô bằng dấu phẩy, mỗi ô được escape', () => {
    expect(buildCsvRow([1, 'A, B', '=x'])).toBe('"1","A, B","\'=x"');
  });
});
