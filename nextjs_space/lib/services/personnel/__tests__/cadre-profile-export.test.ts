/**
 * Test hợp đồng resolver ↔ template "Hồ sơ cán bộ điện tử".
 *
 * Bảo vệ: mọi placeholder khai báo trong spec TPL_M02_HSCB_DIENTU đều được resolver
 * sinh ra; mọi cột của bảng lặp đều có field tương ứng trong item; mapping nhãn enum
 * và fallback khen thưởng (PolicyRecord) đúng.
 */
import { describe, it, expect, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => {
  const empty = { findMany: vi.fn(async () => []), findFirst: vi.fn(async () => null), findUnique: vi.fn(async () => null) };
  return {
    user: { findUnique: vi.fn() },
    partyMember: { findFirst: vi.fn() },
    youthUnionMembership: { findFirst: vi.fn() },
    youthUnionPositionHistory: { findMany: vi.fn() },
    educationHistory: { findMany: vi.fn() },
    foreignLanguageCert: { findMany: vi.fn() },
    ethnicLanguage: { findMany: vi.fn() },
    combatHistory: { findMany: vi.fn() },
    concurrentPosition: { findMany: vi.fn() },
    professionalTitleRecord: { findMany: vi.fn() },
    externalPosition: { findMany: vi.fn() },
    assetDeclaration: { findMany: vi.fn() },
    foreignTrip: { findMany: vi.fn() },
    honorTitleRecord: { findMany: vi.fn() },
    personnelEvaluation: { findMany: vi.fn() },
    allowanceRecord: { findMany: vi.fn() },
    scientificResearch: { findMany: vi.fn() },
    scientificPublication: { findMany: vi.fn() },
    awardsRecord: { findMany: vi.fn() },
    policyRecord: { findMany: vi.fn() },
    medicalRecord: { findMany: vi.fn() },
    familyRelation: { findMany: vi.fn() },
    _empty: empty,
  };
});

vi.mock('@/lib/db', () => ({ default: mockPrisma, prisma: mockPrisma }));
vi.mock('server-only', () => ({}));

import { buildCadreProfileExportData } from '@/lib/services/personnel/cadre-profile-export.service';
import { M02_HSCB_SPECS } from '../../../../prisma/seed/templates/admin-docs/specs/m02-hscb';

function seedMocks() {
  mockPrisma.user.findUnique.mockResolvedValue({
    name: 'Nguyễn Đức Tú',
    aliasName: null,
    gender: 'M',
    managementCategory: 'CAN_BO',
    dateOfBirth: new Date('1983-05-19'),
    militaryIdNumber: '07037614',
    citizenId: '001083040430',
    ethnicity: 'Kinh',
    religion: null,
    rank: 'Thượng tá',
    phone: '0986916459',
    position: 'Trưởng ban',
    salaryCoefficient: 7.3,
    salaryAmount: 17082000,
    positionAllowanceCoeff: 0.7,
    maritalStatus: 'KET_HON',
    commandMgmtLevel: 'TRUNG_CAP',
    politicalTheoryLevel: null,
    bloodGroupRaw: 'AB',
    unitRelation: { name: 'Viện Nghiên cứu KHHCQS' },
    positionRef: { name: 'Trưởng ban' },
    academicTitleRef: null,
    academicDegreeRef: null,
    familyBackgroundRef: { name: 'Trung nông' },
    personalBackgroundRef: { name: 'Phụ thuộc gia đình' },
    personnelProfile: null,
  });
  mockPrisma.partyMember.findFirst.mockResolvedValue({
    joinDate: new Date('2005-12-20'),
    officialDate: new Date('2006-12-20'),
    recommender1: 'Trịnh Văn Chung',
    recommender2: null,
    organization: { name: 'Chi bộ Đại đội 41D' },
    histories: [
      { effectiveDate: new Date('2025-03-01'), decisionDate: null, position: 'CAP_UY_VIEN', toOrganization: null, organization: { name: 'Chi bộ Viện' } },
    ],
  });
  mockPrisma.youthUnionMembership.findFirst.mockResolvedValue({
    joinDate: new Date('1998-03-26'),
    joinPlace: 'Trường THCS Ngọc Thụy',
    currentPosition: null,
  });
  mockPrisma.youthUnionPositionHistory.findMany.mockResolvedValue([
    { position: 'Bí thư chi đoàn', organization: 'Đại đội 41D', fromDate: new Date('2004-01-01'), toDate: null },
  ]);
  mockPrisma.educationHistory.findMany.mockResolvedValue([
    { level: 'TIEN_SI', major: 'Hậu cần quân sự', endDate: new Date('2024-12-27'), certificateDate: new Date('2024-12-27') },
  ]);
  mockPrisma.foreignLanguageCert.findMany.mockResolvedValue([
    { issueDate: new Date('2009-12-16'), language: 'Tiếng Anh', certLevel: 'C', framework: 'Giỏi', certType: 'Chứng nhận', certNumber: '12.457' },
  ]);
  mockPrisma.ethnicLanguage.findMany.mockResolvedValue([{ language: 'Tày', proficiency: 'Cơ bản' }]);
  mockPrisma.combatHistory.findMany.mockResolvedValue([
    { fromDate: new Date('2005-01-01'), toDate: null, battlefield: 'Biên giới', unit: 'e1', role: 'Trung đội trưởng' },
  ]);
  mockPrisma.concurrentPosition.findMany.mockResolvedValue([
    { positionTitle: 'Phó bí thư', fromDate: new Date('2025-01-01'), toDate: null, unit: 'Viện', detail: 'kiêm' },
  ]);
  mockPrisma.professionalTitleRecord.findMany.mockResolvedValue([
    { titleName: 'Giảng viên chính', effectiveDate: new Date('2025-02-08'), decisionNumber: '462/QĐ-BQP' },
  ]);
  mockPrisma.externalPosition.findMany.mockResolvedValue([
    { positionTitle: 'Ủy viên', organization: 'Hội CCB', fromDate: new Date('2020-01-01'), toDate: null },
  ]);
  mockPrisma.assetDeclaration.findMany.mockResolvedValue([
    { assetType: 'DAT', declaredDate: new Date('2021-07-08'), assetName: 'Đất ở Tổ 10', area: '91,2 m2', value: 0, documentRef: 'DB763186' },
  ]);
  mockPrisma.foreignTrip.findMany.mockResolvedValue([
    { fromDate: new Date('2018-07-01'), toDate: new Date('2018-12-01'), country: 'Úc', purpose: 'Học tiếng Anh', sponsor: 'BQP' },
  ]);
  mockPrisma.honorTitleRecord.findMany.mockResolvedValue([
    { awardYear: 2021, titleName: 'Chiến sĩ tiên tiến', level: 'Cơ sở', decisionNumber: '2992/QĐ-TM', meritTitle: null },
  ]);
  mockPrisma.personnelEvaluation.findMany.mockResolvedValue([
    { periodType: 'NAM', periodYear: 2025, periodQuarter: null, taskResultLabel: 'HTTNV', partyMemberRank: 'Hoàn thành tốt', taskResultRank: null },
  ]);
  mockPrisma.allowanceRecord.findMany.mockResolvedValue([
    { fromDate: new Date('2025-07-01'), toDate: null, coefficient: 0.7, reason: 'Trưởng ban', decisionNumber: 'x', allowanceLabel: 'Phụ cấp chức vụ', allowanceType: null },
  ]);
  mockPrisma.scientificResearch.findMany.mockResolvedValue([
    { year: 2016, title: 'Đề tài NCKH cấp Học viện', role: 'CHU_NHIEM', level: 'Học viện', type: 'Đề tài' },
  ]);
  mockPrisma.scientificPublication.findMany.mockResolvedValue([
    { year: 2013, month: null, type: 'GIAO_TRINH', title: 'Sổ tay điện tử', role: 'THAM_GIA', organization: 'HVHC', issueNumber: null, pageNumbers: null, publisher: null },
    { year: 2017, month: 3, type: 'BAI_BAO', title: 'CTHC Huế - Đà Nẵng', role: 'DONG_TAC_GIA', organization: 'Tạp chí KT&TB', issueNumber: '198', pageNumbers: '76-78', publisher: null },
  ]);
  mockPrisma.awardsRecord.findMany.mockResolvedValue([]);
  mockPrisma.policyRecord.findMany.mockResolvedValue([
    { recordType: 'REWARD', year: 2011, title: 'Giấy khen', level: 'ACADEMY', decisionNumber: '943/QĐ-HV', decisionDate: new Date('2011-06-10'), reason: '', violationSummary: null },
    { recordType: 'DISCIPLINE', year: 2019, title: 'Khiển trách', level: 'UNIT', decisionNumber: '12/QĐ', decisionDate: new Date('2019-01-01'), reason: 'Vi phạm quy định', violationSummary: null },
  ]);
  mockPrisma.medicalRecord.findMany.mockResolvedValue([
    { recordDate: new Date('2026-06-01'), hospital: 'Trạm xá HVHC', diagnosis: 'Khám định kỳ', treatment: null, result: 'Loại 2', healthGrade: 'Loại 2' },
  ]);
  mockPrisma.familyRelation.findMany.mockResolvedValue([
    { relation: 'FATHER', fullName: 'Nguyễn Đức Tuấn', dateOfBirth: new Date('1958-10-08'), hometownOld: 'Ngọc Thụy', residenceNew: 'Bồ Đề', address: null, occupation: 'Bộ đội nghỉ hưu', isPartyMember: true, partyPosition: null, isSeniorOfficial: true },
  ]);
}

describe('buildCadreProfileExportData', () => {
  it('sinh ĐỦ mọi placeholder mà template khai báo', async () => {
    seedMocks();
    const data = await buildCadreProfileExportData('u1');
    const placeholders = M02_HSCB_SPECS[0].placeholders;
    const missing = placeholders
      .map((ph) => ph.replace(/[{}#]/g, ''))
      .filter((key) => !(key in data));
    expect(missing).toEqual([]);
  });

  it('mọi cột của bảng lặp đều có field trong item', async () => {
    seedMocks();
    const data = (await buildCadreProfileExportData('u1')) as Record<string, unknown>;
    const loops = M02_HSCB_SPECS[0].body.filter((b) => b.loop).map((b) => b.loop!);
    for (const loop of loops) {
      const arr = data[loop.key] as Record<string, unknown>[];
      expect(Array.isArray(arr), `${loop.key} phải là mảng`).toBe(true);
      expect(arr.length, `${loop.key} cần ít nhất 1 dòng trong fixture`).toBeGreaterThan(0);
      for (const col of loop.columns) {
        expect(col.field in arr[0], `${loop.key}.${col.field} thiếu trong item`).toBe(true);
      }
    }
  });

  it('map nhãn enum + uppercase tên + fallback khen thưởng PolicyRecord', async () => {
    seedMocks();
    const data = await buildCadreProfileExportData('u1');
    expect(data.hoTen).toBe('NGUYỄN ĐỨC TÚ');
    expect(data.gioiTinh).toBe('Nam');
    expect(data.honNhan).toBe('Kết hôn');
    expect(data.trinhDoCHQL).toBe('Trung cấp');
    expect(data.doiTuongQL).toBe('Cán bộ');
    expect((data.khenThuong_list as unknown[]).length).toBe(1);
    expect((data.kyLuat_list as unknown[]).length).toBe(1);
    expect((data.khenThuong_list as Record<string, unknown>[])[0].capKhen).toBe('Học viện');
    expect((data.giaDinh_list as Record<string, unknown>[])[0].dangVien).toBe('X');
  });
});
