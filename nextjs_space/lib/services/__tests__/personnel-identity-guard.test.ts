/**
 * Tests – Guard trường định danh nhạy cảm của hồ sơ cán bộ.
 *
 * Bảo vệ quy tắc: người KHÔNG đủ quyền (không phải chủ hồ sơ, không có
 * VIEW_PERSONNEL_SENSITIVE) không được thấy CCCD và số CMSQ; nhưng các trường
 * công khai (họ tên, mã quân nhân, nhóm máu...) vẫn hiển thị bình thường.
 */

import { describe, it, expect } from 'vitest';
import {
  maskSensitiveIdentity,
  SENSITIVE_IDENTITY_FIELDS,
} from '@/lib/services/personnel-identity-guard';

function makeRecord() {
  return {
    name: 'Bùi Xuân Trung',
    militaryId: '647609400001',
    bloodGroupRaw: 'A',
    ethnicity: 'Kinh (Việt)',
    citizenId: '001076016222',
    citizenIdIssueDate: new Date('2021-04-21'),
    citizenIdIssuePlace: 'Cục Cảnh sát QLHC về TTXH',
    citizenIdExpiryDate: new Date('2036-11-08'),
    officerIdCard: '99016145',
  };
}

describe('maskSensitiveIdentity', () => {
  it('giữ nguyên dữ liệu khi đủ quyền xem nhạy cảm', () => {
    const input = makeRecord();
    const result = maskSensitiveIdentity(input, true);

    expect(result.citizenId).toBe('001076016222');
    expect(result.officerIdCard).toBe('99016145');
    expect(result.citizenIdIssuePlace).toBe('Cục Cảnh sát QLHC về TTXH');
  });

  it('mask CCCD và CMSQ khi KHÔNG đủ quyền', () => {
    const result = maskSensitiveIdentity(makeRecord(), false);

    for (const field of SENSITIVE_IDENTITY_FIELDS) {
      expect(result[field as keyof typeof result]).toBeNull();
    }
  });

  it('không che các trường công khai (họ tên, mã quân nhân, nhóm máu)', () => {
    const result = maskSensitiveIdentity(makeRecord(), false);

    expect(result.name).toBe('Bùi Xuân Trung');
    expect(result.militaryId).toBe('647609400001'); // mã quân nhân KHÔNG bị che
    expect(result.bloodGroupRaw).toBe('A');
    expect(result.ethnicity).toBe('Kinh (Việt)');
  });

  it('không mutate object đầu vào', () => {
    const input = makeRecord();
    maskSensitiveIdentity(input, false);

    expect(input.citizenId).toBe('001076016222'); // bản gốc còn nguyên
  });
});
