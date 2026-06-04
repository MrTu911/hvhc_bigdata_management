/**
 * Tests – Lý lịch 2A-LLDV (personnel-2a-document.ts)
 *
 * Kiểm hàm dựng HTML thuần: ánh xạ enum sang tiếng Việt, dùng đúng field schema
 * Personnel, tách khen thưởng/kỷ luật đúng mục.
 */

import { describe, it, expect } from 'vitest';
import {
  buildPersonnel2aHtml,
  type Personnel2aData,
} from '@/lib/export/server/personnel-2a-document';

function makeData(overrides: Partial<Personnel2aData> = {}): Personnel2aData {
  return {
    fullName: 'Nguyễn Văn A',
    dateOfBirth: new Date('1985-03-12'),
    militaryRank: 'DAI_TA',
    militaryIdNumber: 'QN12345',
    position: 'Trưởng phòng',
    unitName: 'Phòng Đào tạo',
    gender: 'FEMALE',
    ethnicity: 'Kinh',
    religion: 'Không',
    placeOfOrigin: 'Nam Định',
    birthPlace: 'Hà Nội',
    educationLevel: 'Tiến sĩ',
    enlistmentDate: new Date('2005-09-01'),
    email: 'a@hvhc.edu.vn',
    phone: '0900000000',
    educationHistories: [
      {
        level: 'TIEN_SI',
        institution: 'Học viện Hậu cần',
        major: 'Quản lý kinh tế',
        startDate: new Date('2015-09-01'),
        endDate: new Date('2019-06-01'),
      },
    ],
    careerHistories: [
      {
        eventDate: new Date('2010-01-01'),
        endDate: null,
        title: 'Bổ nhiệm',
        newPosition: 'Trợ lý',
        newUnit: 'Phòng Đào tạo',
        notes: '',
      },
    ],
    policyRecords: [
      {
        recordType: 'REWARD',
        title: 'Bằng khen',
        level: 'MINISTRY',
        decisionNumber: 'QĐ-01',
        decisionDate: new Date('2020-05-01'),
        reason: 'Hoàn thành xuất sắc',
      },
      {
        recordType: 'DISCIPLINE',
        title: 'Khiển trách',
        level: 'UNIT',
        decisionNumber: 'QĐ-99',
        decisionDate: new Date('2018-02-01'),
        reason: 'Vi phạm quy định',
      },
    ],
    familyRelations: [
      {
        relation: 'SPOUSE',
        fullName: 'Trần Thị B',
        dateOfBirth: new Date('1987-01-01'),
        address: 'Hà Nội',
        occupation: 'Giáo viên',
      },
    ],
    partyMember: {
      joinDate: new Date('2008-03-01'),
      officialDate: new Date('2009-03-01'),
      partyCardNumber: 'TD-123',
      status: 'CHINH_THUC',
    },
    ...overrides,
  };
}

describe('buildPersonnel2aHtml', () => {
  const html = buildPersonnel2aHtml(makeData());

  it('hiển thị quốc hiệu và cơ quan chủ quản chính quy', () => {
    expect(html).toContain('BỘ QUỐC PHÒNG');
    expect(html).toContain('HỌC VIỆN HẬU CẦN');
    expect(html).toContain('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM');
  });

  it('ánh xạ quân hàm enum sang tiếng Việt', () => {
    expect(html).toContain('Đại tá');
    expect(html).not.toContain('DAI_TA');
  });

  it('ánh xạ trình độ đào tạo, quan hệ gia đình, giới tính', () => {
    expect(html).toContain('Tiến sĩ');
    expect(html).toContain('Vợ/Chồng');
    expect(html).toContain('Nữ');
    expect(html).not.toContain('SPOUSE');
    expect(html).not.toContain('TIEN_SI');
  });

  it('dùng họ tên in hoa từ field fullName (không phải field legacy name)', () => {
    expect(html).toContain('NGUYỄN VĂN A');
  });

  it('tách khen thưởng và kỷ luật đúng mục', () => {
    expect(html).toContain('V. KHEN THƯỞNG');
    expect(html).toContain('Bằng khen');
    expect(html).toContain('VI. KỶ LUẬT');
    expect(html).toContain('Khiển trách');
  });

  it('hiển thị empty state khi không có dữ liệu liên quan', () => {
    const empty = buildPersonnel2aHtml(
      makeData({ educationHistories: [], familyRelations: [], policyRecords: [] })
    );
    expect(empty).toContain('Chưa có thông tin đào tạo');
    expect(empty).toContain('Không có khen thưởng');
    expect(empty).toContain('Chưa có thông tin gia đình');
  });

  it('không rò chuỗi "undefined"/"null" ra tài liệu', () => {
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('>null<');
  });
});
