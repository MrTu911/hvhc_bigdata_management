/**
 * Tests – Biểu mẫu Excel danh sách trích ngang (personnel-roster-excel.ts)
 *
 * Dựng workbook rồi nạp lại bằng ExcelJS để kiểm header chính quy,
 * ánh xạ nhãn enum sang tiếng Việt, và đánh số TT.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import ExcelJS from 'exceljs';
import {
  buildPersonnelRosterWorkbook,
  type RosterPersonnel,
} from '@/lib/export/server/personnel-roster-excel';

const SAMPLE: RosterPersonnel[] = [
  {
    fullName: 'Nguyễn Văn A',
    dateOfBirth: new Date('1985-03-12'),
    militaryRank: 'THIEU_UY',
    position: 'Trợ lý',
    unit: { name: 'Phòng Đào tạo' },
    personnelCode: 'NS001',
    militaryIdNumber: 'QN12345',
    gender: 'MALE',
    ethnicity: 'Kinh',
    status: 'DANG_CONG_TAC',
  },
  {
    fullName: 'Trần Thị B',
    dateOfBirth: new Date('1990-07-01'),
    militaryRank: 'DAI_UY',
    position: 'Giảng viên',
    unit: { name: 'Khoa Hậu cần' },
    personnelCode: 'NS002',
    militaryIdNumber: 'QN67890',
    gender: 'FEMALE',
    ethnicity: 'Tày',
    status: 'NGHI_HUU',
  },
];

// Layout cố định khi KHÔNG truyền unitName: 2 dòng letterhead → header ở dòng 7, data từ dòng 8.
const HEADER_ROW = 7;

describe('buildPersonnelRosterWorkbook', () => {
  let worksheet: ExcelJS.Worksheet;

  beforeAll(async () => {
    const buffer = await buildPersonnelRosterWorkbook(SAMPLE);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);
    worksheet = wb.worksheets[0];
  });

  it('có quốc hiệu và cơ quan chủ quản ở đầu trang', () => {
    expect(worksheet.getCell('A1').value).toBe('BỘ QUỐC PHÒNG');
    expect(worksheet.getCell('A2').value).toBe('HỌC VIỆN HẬU CẦN');
  });

  it('có hàng tiêu đề bảng đúng cột', () => {
    expect(worksheet.getCell(HEADER_ROW, 1).value).toBe('TT');
    expect(worksheet.getCell(HEADER_ROW, 2).value).toBe('Họ và tên');
    expect(worksheet.getCell(HEADER_ROW, 4).value).toBe('Quân hàm');
    expect(worksheet.getCell(HEADER_ROW, 11).value).toBe('Trạng thái');
  });

  it('đánh số thứ tự tự động bắt đầu từ 1', () => {
    expect(worksheet.getCell(HEADER_ROW + 1, 1).value).toBe('1');
    expect(worksheet.getCell(HEADER_ROW + 2, 1).value).toBe('2');
  });

  it('ánh xạ quân hàm enum sang nhãn tiếng Việt', () => {
    expect(worksheet.getCell(HEADER_ROW + 1, 4).value).toBe('Thiếu úy');
    expect(worksheet.getCell(HEADER_ROW + 2, 4).value).toBe('Đại úy');
  });

  it('ánh xạ giới tính và trạng thái sang tiếng Việt', () => {
    expect(worksheet.getCell(HEADER_ROW + 1, 9).value).toBe('Nam');
    expect(worksheet.getCell(HEADER_ROW + 2, 9).value).toBe('Nữ');
    expect(worksheet.getCell(HEADER_ROW + 1, 11).value).toBe('Đang công tác');
    expect(worksheet.getCell(HEADER_ROW + 2, 11).value).toBe('Nghỉ hưu');
  });

  it('giữ nguyên họ tên và đơn vị', () => {
    expect(worksheet.getCell(HEADER_ROW + 1, 2).value).toBe('Nguyễn Văn A');
    expect(worksheet.getCell(HEADER_ROW + 1, 6).value).toBe('Phòng Đào tạo');
  });

  it('ô dữ liệu có viền (định dạng bảng)', () => {
    const cell = worksheet.getCell(HEADER_ROW + 1, 2);
    expect(cell.border?.top?.style).toBe('thin');
  });
});
