/**
 * Tests – Academic Warning Engine (M10 UC-57)
 *
 * computeWarningLevel là pure function — không cần mock.
 * Test bao phủ tất cả 4 mức cảnh báo + boundary conditions.
 */

import { describe, it, expect } from 'vitest';
import { computeWarningLevel } from '../academic-warning.service';

describe('computeWarningLevel', () => {
  // ── Không cảnh báo ────────────────────────────────────────────────────────

  it('trả về null khi GPA tốt và không nợ tín chỉ', () => {
    expect(computeWarningLevel(3.5, 0)).toBeNull();
  });

  it('trả về null đúng ngưỡng an toàn (GPA=2.5, failedCredits=0)', () => {
    expect(computeWarningLevel(2.5, 0)).toBeNull();
  });

  // ── LOW ───────────────────────────────────────────────────────────────────

  it('LOW – GPA vừa dưới 2.5', () => {
    expect(computeWarningLevel(2.49, 0)).toBe('LOW');
  });

  it('LOW – failedCredits = 3 (ngưỡng bắt đầu LOW)', () => {
    expect(computeWarningLevel(3.0, 3)).toBe('LOW');
  });

  it('LOW – failedCredits = 5 (dưới ngưỡng MEDIUM)', () => {
    expect(computeWarningLevel(3.0, 5)).toBe('LOW');
  });

  // ── MEDIUM ────────────────────────────────────────────────────────────────

  it('MEDIUM – GPA dưới 2.0', () => {
    expect(computeWarningLevel(1.9, 0)).toBe('MEDIUM');
  });

  it('MEDIUM – failedCredits = 6 (ngưỡng bắt đầu MEDIUM)', () => {
    expect(computeWarningLevel(3.0, 6)).toBe('MEDIUM');
  });

  it('MEDIUM – failedCredits = 11 (dưới ngưỡng HIGH)', () => {
    expect(computeWarningLevel(3.0, 11)).toBe('MEDIUM');
  });

  // ── HIGH ──────────────────────────────────────────────────────────────────

  it('HIGH – GPA dưới 1.5', () => {
    expect(computeWarningLevel(1.4, 0)).toBe('HIGH');
  });

  it('HIGH – failedCredits = 12 (ngưỡng bắt đầu HIGH)', () => {
    expect(computeWarningLevel(3.0, 12)).toBe('HIGH');
  });

  it('HIGH – failedCredits = 19 (dưới ngưỡng CRITICAL)', () => {
    expect(computeWarningLevel(3.0, 19)).toBe('HIGH');
  });

  // ── CRITICAL ──────────────────────────────────────────────────────────────

  it('CRITICAL – GPA dưới 1.0', () => {
    expect(computeWarningLevel(0.9, 0)).toBe('CRITICAL');
  });

  it('CRITICAL – GPA = 0', () => {
    expect(computeWarningLevel(0, 0)).toBe('CRITICAL');
  });

  it('CRITICAL – failedCredits = 20 (ngưỡng CRITICAL)', () => {
    expect(computeWarningLevel(3.0, 20)).toBe('CRITICAL');
  });

  it('CRITICAL – failedCredits rất cao (50)', () => {
    expect(computeWarningLevel(3.0, 50)).toBe('CRITICAL');
  });

  // ── GPA và failedCredits cùng tệ: ưu tiên mức cao nhất ──────────────────

  it('GPA LOW nhưng failedCredits CRITICAL → trả CRITICAL', () => {
    // gpa = 2.4 → LOW theo GPA, nhưng failedCredits = 25 → CRITICAL
    expect(computeWarningLevel(2.4, 25)).toBe('CRITICAL');
  });

  it('GPA MEDIUM nhưng failedCredits HIGH → trả HIGH', () => {
    // gpa = 1.9 → MEDIUM, failedCredits = 15 → HIGH
    expect(computeWarningLevel(1.9, 15)).toBe('HIGH');
  });
});
