/**
 * Tests – Grade Service (M10 UC-56)
 *
 * validateScorePayload là pure function — không cần mock.
 * updateGradeWithHistory (DB) được test riêng ở integration tests nếu có.
 */

import { describe, it, expect } from 'vitest';
import { validateScorePayload } from '../grade.service';

describe('validateScorePayload', () => {
  it('hợp lệ khi tất cả fields undefined (partial update)', () => {
    expect(validateScorePayload({})).toBeNull();
  });

  it('hợp lệ khi tất cả điểm = 0', () => {
    expect(validateScorePayload({
      attendanceScore: 0,
      midtermScore: 0,
      finalScore: 0,
      totalScore: 0,
    })).toBeNull();
  });

  it('hợp lệ khi các điểm là số dương bình thường', () => {
    expect(validateScorePayload({
      attendanceScore: 8.5,
      midtermScore: 7.0,
      finalScore: 9.0,
      totalScore: 8.2,
    })).toBeNull();
  });

  it('hợp lệ khi điểm = null (xóa điểm đã nhập)', () => {
    expect(validateScorePayload({
      midtermScore: null,
      finalScore: null,
    })).toBeNull();
  });

  it('lỗi khi attendanceScore âm', () => {
    const error = validateScorePayload({ attendanceScore: -1 });
    expect(error).not.toBeNull();
    expect(error).toContain('attendanceScore');
  });

  it('lỗi khi midtermScore âm', () => {
    const error = validateScorePayload({ midtermScore: -0.01 });
    expect(error).not.toBeNull();
    expect(error).toContain('midtermScore');
  });

  it('lỗi khi finalScore là string thay vì number', () => {
    const error = validateScorePayload({ finalScore: 'abc' as any });
    expect(error).not.toBeNull();
    expect(error).toContain('finalScore');
  });

  it('lỗi khi totalScore âm', () => {
    const error = validateScorePayload({ totalScore: -5 });
    expect(error).not.toBeNull();
    expect(error).toContain('totalScore');
  });

  it('chỉ báo lỗi field đầu tiên gặp (không báo tất cả cùng lúc)', () => {
    // Cả attendanceScore và midtermScore đều âm → chỉ báo field đầu tiên
    const error = validateScorePayload({
      attendanceScore: -1,
      midtermScore: -2,
    });
    expect(error).not.toBeNull();
    expect(error).toContain('attendanceScore'); // field đầu trong SCORE_FIELDS
  });

  it('các field không phải score (passFlag, letterGrade, notes, reason) không bị validate số', () => {
    expect(validateScorePayload({
      passFlag: true,
      letterGrade: 'A',
      notes: 'ghi chú',
      reason: 'lý do sửa',
    })).toBeNull();
  });
});
