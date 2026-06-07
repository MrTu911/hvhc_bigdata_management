/**
 * Aggregate Export Service — xuất BẢNG DANH SÁCH tổng hợp (1 file) theo CSDL,
 * lọc theo phạm vi (scope) + bộ lọc nâng cao (đơn vị cụ thể, trạng thái, từ khóa).
 * Phục vụ "xuất tổ chức/đơn vị".
 *
 * Khác M18 export (1 thực thể / batch ZIP nhiều file): đây là 1 file Excel/PDF
 * dạng bảng nhiều dòng. Scope: lọc theo unitFilter (null = toàn bộ trong quyền).
 *
 * Bảo mật: chỉ trả NckhScientistProfile sensitivityLevel='NORMAL' trong danh sách
 * hàng loạt (hồ sơ mật phải xuất lẻ qua route có guard riêng).
 */

import ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import type {
  FunctionScope, PolicyRecordStatus, AwardType, NckhPublicationType, NckhProjectStatus, PartyMemberStatus,
} from '@prisma/client';
import prisma from '@/lib/db';
import { uploadObject, getPresignedDownloadUrl } from '@/lib/services/infrastructure/storage.service';
import { renderHtmlToPdf } from '@/lib/services/export-engine-service';

export type AggregateEntityType =
  | 'personnel' | 'student' | 'party_member' | 'scientist_profile' | 'scientific_council'
  | 'policy' | 'award' | 'research_project' | 'publication' | 'legacy_project'
  | 'insurance' | 'faculty' | 'party_org' | 'subject';
export type AggregateFormat = 'XLSX' | 'PDF';

const PREVIEW_TTL = 86400; // 24h
const MAX_ROWS = 5000;

const TITLES: Record<AggregateEntityType, string> = {
  personnel: 'DANH SÁCH CÁN BỘ',
  student: 'DANH SÁCH HỌC VIÊN',
  party_member: 'DANH SÁCH ĐẢNG VIÊN',
  scientist_profile: 'DANH SÁCH NHÀ KHOA HỌC',
  scientific_council: 'DANH SÁCH HỘI ĐỒNG KHOA HỌC',
  policy: 'DANH SÁCH HỒ SƠ CHÍNH SÁCH',
  award: 'DANH SÁCH KHEN THƯỞNG - KỶ LUẬT',
  research_project: 'DANH SÁCH ĐỀ TÀI KHOA HỌC',
  publication: 'DANH SÁCH CÔNG BỐ KHOA HỌC',
  legacy_project: 'DANH SÁCH ĐỀ TÀI NCKH (CẤP CƠ SỞ)',
  insurance: 'DANH SÁCH BẢO HIỂM XÃ HỘI',
  faculty: 'DANH SÁCH GIẢNG VIÊN',
  party_org: 'DANH SÁCH TỔ CHỨC ĐẢNG',
  subject: 'DANH SÁCH MÔN HỌC',
};

// ─── Enum → nhãn tiếng Việt ─────────────────────────────────────────────────────
const PARTY_STATUS: Record<string, string> = {
  CHINH_THUC: 'Chính thức', DU_BI: 'Dự bị', QUAN_CHUNG: 'Quần chúng', CAM_TINH: 'Cảm tình',
  DOI_TUONG: 'Đối tượng', MIEN_SINH_HOAT: 'Miễn sinh hoạt', CHUYEN_DI: 'Chuyển đi',
  XOA_TEN_TU_NGUYEN: 'Xóa tên', KHAI_TRU: 'Khai trừ', ACTIVE: 'Chính thức',
  TRANSFERRED: 'Chuyển đi', SUSPENDED: 'Tạm đình chỉ', EXPELLED: 'Khai trừ',
};
const COUNCIL_TYPE: Record<string, string> = { REVIEW: 'Thẩm định', ACCEPTANCE: 'Nghiệm thu', FINAL: 'Kết luận' };
const COUNCIL_RESULT: Record<string, string> = { PASS: 'Đạt', FAIL: 'Không đạt', REVISE: 'Bổ sung' };
const POLICY_TYPE: Record<string, string> = { EMULATION: 'Thi đua', REWARD: 'Khen thưởng', DISCIPLINE: 'Kỷ luật' };
const POLICY_STATUS: Record<string, string> = { ACTIVE: 'Hiệu lực', EXPIRED: 'Hết hiệu lực', VOIDED: 'Đã hủy' };
const AWARD_TYPE: Record<string, string> = { KHEN_THUONG: 'Khen thưởng', KY_LUAT: 'Kỷ luật' };
const PUB_TYPE: Record<string, string> = {
  BAI_BAO_QUOC_TE: 'Bài báo quốc tế', BAI_BAO_TRONG_NUOC: 'Bài báo trong nước', SACH_CHUYEN_KHAO: 'Sách chuyên khảo',
  GIAO_TRINH: 'Giáo trình', SANG_KIEN: 'Sáng kiến', PATENT: 'Sáng chế', BAO_CAO_KH: 'Báo cáo KH',
  LUAN_VAN: 'Luận văn', LUAN_AN: 'Luận án',
};
const NCKH_STATUS: Record<string, string> = {
  DRAFT: 'Nháp', SUBMITTED: 'Đã nộp', UNDER_REVIEW: 'Đang xét', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối',
  IN_PROGRESS: 'Đang thực hiện', PAUSED: 'Tạm dừng', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy',
};

export interface AggregateScopeCtx {
  scope: FunctionScope;
  /** Danh sách đơn vị để lọc; null = không lọc (toàn bộ trong quyền). */
  unitFilter: string[] | null;
}

export interface AggregateResult {
  downloadUrl: string;
  count: number;
  expiresIn: number;
  title: string;
}

interface TableData {
  columns: string[];
  rows: string[][];
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
function fmtDate(d: Date | null | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}
function gender(g: string | null | undefined): string {
  if (g === 'M' || g === 'MALE') return 'Nam';
  if (g === 'F' || g === 'FEMALE') return 'Nữ';
  return g ?? '';
}

/** Điều kiện lọc đơn vị: null → không lọc; ngược lại → trong danh sách. */
function unitInScope(ctx: AggregateScopeCtx): { in: string[] } | undefined {
  return ctx.unitFilter ? { in: ctx.unitFilter } : undefined;
}

// ─── Build table per entity type (scope + status + keyword) ─────────────────────

async function buildPersonnelTable(ctx: AggregateScopeCtx, keyword?: string): Promise<TableData> {
  const unitFilter = unitInScope(ctx);
  const rows = await prisma.personnel.findMany({
    where: {
      ...(unitFilter ? { unitId: unitFilter } : {}),
      ...(keyword ? { fullName: { contains: keyword, mode: 'insensitive' } } : {}),
    },
    select: {
      fullName: true, militaryIdNumber: true, militaryRank: true, position: true,
      dateOfBirth: true, gender: true, unit: { select: { name: true } },
    },
    orderBy: { fullName: 'asc' },
    take: MAX_ROWS,
  });
  return {
    columns: ['STT', 'Họ và tên', 'Số hiệu QN', 'Cấp bậc', 'Chức vụ', 'Đơn vị', 'Ngày sinh', 'Giới tính'],
    rows: rows.map((r, i) => [
      String(i + 1), r.fullName ?? '', r.militaryIdNumber ?? '', r.militaryRank ?? '', r.position ?? '',
      r.unit?.name ?? '', fmtDate(r.dateOfBirth), gender(r.gender),
    ]),
  };
}

async function buildStudentTable(_ctx: AggregateScopeCtx, keyword?: string): Promise<TableData> {
  const rows = await prisma.hocVien.findMany({
    where: keyword
      ? { OR: [{ hoTen: { contains: keyword, mode: 'insensitive' } }, { maHocVien: { contains: keyword, mode: 'insensitive' } }] }
      : {},
    select: { maHocVien: true, hoTen: true, lop: true, khoaHoc: true, ngaySinh: true, gioiTinh: true, trangThai: true },
    orderBy: { hoTen: 'asc' },
    take: MAX_ROWS,
  });
  return {
    columns: ['STT', 'Mã học viên', 'Họ và tên', 'Lớp', 'Khóa', 'Ngày sinh', 'Trạng thái'],
    rows: rows.map((r, i) => [
      String(i + 1), r.maHocVien ?? '', r.hoTen ?? '', r.lop ?? '', r.khoaHoc ?? '',
      fmtDate(r.ngaySinh), r.trangThai ?? '',
    ]),
  };
}

async function buildPartyMemberTable(ctx: AggregateScopeCtx, keyword?: string, status?: string): Promise<TableData> {
  const unitFilter = unitInScope(ctx);
  const userWhere = {
    ...(unitFilter ? { unitId: unitFilter } : {}),
    ...(keyword ? { name: { contains: keyword, mode: 'insensitive' as const } } : {}),
  };
  const rows = await prisma.partyMember.findMany({
    where: {
      ...(Object.keys(userWhere).length ? { user: userWhere } : {}),
      ...(status ? { status: status as PartyMemberStatus } : {}),
    },
    select: {
      partyCell: true, joinDate: true, officialDate: true, status: true,
      user: { select: { name: true, rank: true } },
    },
    orderBy: { joinDate: 'asc' },
    take: MAX_ROWS,
  });
  return {
    columns: ['STT', 'Họ và tên', 'Cấp bậc', 'Chi bộ', 'Ngày vào Đảng', 'Ngày chính thức', 'Trạng thái'],
    rows: rows.map((r, i) => [
      String(i + 1), r.user?.name ?? '', r.user?.rank ?? '', r.partyCell ?? '',
      fmtDate(r.joinDate), fmtDate(r.officialDate), PARTY_STATUS[r.status] ?? r.status,
    ]),
  };
}

async function buildScientistTable(ctx: AggregateScopeCtx, keyword?: string): Promise<TableData> {
  const unitFilter = unitInScope(ctx);
  const userWhere = {
    ...(unitFilter ? { unitId: unitFilter } : {}),
    ...(keyword ? { name: { contains: keyword, mode: 'insensitive' as const } } : {}),
  };
  const rows = await prisma.nckhScientistProfile.findMany({
    where: {
      sensitivityLevel: 'NORMAL',
      ...(Object.keys(userWhere).length ? { user: userWhere } : {}),
    },
    select: {
      degree: true, academicRank: true, primaryField: true, hIndex: true, totalPublications: true,
      user: { select: { name: true, unitRelation: { select: { name: true } } } },
    },
    orderBy: { hIndex: 'desc' },
    take: MAX_ROWS,
  });
  return {
    columns: ['STT', 'Họ và tên', 'Đơn vị', 'Học vị', 'Học hàm', 'Chuyên ngành', 'h-index', 'Số công trình'],
    rows: rows.map((r, i) => [
      String(i + 1), r.user?.name ?? '', r.user?.unitRelation?.name ?? '', r.degree ?? '', r.academicRank ?? '',
      r.primaryField ?? '', String(r.hIndex ?? 0), String(r.totalPublications ?? 0),
    ]),
  };
}

async function buildCouncilTable(_ctx: AggregateScopeCtx, keyword?: string, status?: string): Promise<TableData> {
  const rows = await prisma.scientificCouncil.findMany({
    where: {
      ...(keyword ? { project: { title: { contains: keyword, mode: 'insensitive' } } } : {}),
      ...(status ? { result: status } : {}),
    },
    select: {
      type: true, meetingDate: true, result: true,
      project: { select: { projectCode: true, title: true } },
      chairman: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: MAX_ROWS,
  });
  return {
    columns: ['STT', 'Loại HĐ', 'Mã đề tài', 'Tên đề tài', 'Chủ tịch', 'Ngày họp', 'Kết quả'],
    rows: rows.map((r, i) => [
      String(i + 1), COUNCIL_TYPE[r.type] ?? r.type, r.project?.projectCode ?? '', r.project?.title ?? '',
      r.chairman?.name ?? '', fmtDate(r.meetingDate), r.result ? (COUNCIL_RESULT[r.result] ?? r.result) : 'Chưa có',
    ]),
  };
}

async function buildPolicyTable(ctx: AggregateScopeCtx, keyword?: string, status?: string): Promise<TableData> {
  const unitFilter = unitInScope(ctx);
  const rows = await prisma.policyRecord.findMany({
    where: {
      ...(unitFilter ? { unitId: unitFilter } : {}),
      ...(status ? { status: status as PolicyRecordStatus } : {}),
      ...(keyword ? { OR: [{ title: { contains: keyword, mode: 'insensitive' } }, { decisionNumber: { contains: keyword, mode: 'insensitive' } }] } : {}),
    },
    select: {
      decisionNumber: true, recordType: true, title: true, decisionDate: true, status: true,
      user: { select: { name: true } }, unit: { select: { name: true } },
    },
    orderBy: { decisionDate: 'desc' },
    take: MAX_ROWS,
  });
  return {
    columns: ['STT', 'Số quyết định', 'Loại', 'Trích yếu', 'Đối tượng', 'Đơn vị', 'Ngày QĐ', 'Trạng thái'],
    rows: rows.map((r, i) => [
      String(i + 1), r.decisionNumber ?? '', POLICY_TYPE[r.recordType] ?? r.recordType, r.title ?? '',
      r.user?.name ?? '', r.unit?.name ?? '', fmtDate(r.decisionDate), POLICY_STATUS[r.status] ?? r.status,
    ]),
  };
}

async function buildAwardTable(ctx: AggregateScopeCtx, keyword?: string, status?: string): Promise<TableData> {
  const unitFilter = unitInScope(ctx);
  const userWhere = unitFilter ? { unitId: unitFilter } : undefined;
  const rows = await prisma.awardsRecord.findMany({
    where: {
      ...(userWhere ? { user: userWhere } : {}),
      ...(status ? { type: status as AwardType } : {}),
      ...(keyword ? { description: { contains: keyword, mode: 'insensitive' } } : {}),
    },
    select: {
      type: true, category: true, description: true, year: true,
      user: { select: { name: true, rank: true, unitRelation: { select: { name: true } } } },
    },
    orderBy: { year: 'desc' },
    take: MAX_ROWS,
  });
  return {
    columns: ['STT', 'Họ và tên', 'Đơn vị', 'Loại', 'Nội dung', 'Năm'],
    rows: rows.map((r, i) => [
      String(i + 1), r.user?.name ?? '', r.user?.unitRelation?.name ?? '', AWARD_TYPE[r.type] ?? r.type,
      r.description ?? '', String(r.year ?? ''),
    ]),
  };
}

async function buildResearchProjectTable(ctx: AggregateScopeCtx, keyword?: string, status?: string): Promise<TableData> {
  const unitFilter = unitInScope(ctx);
  const rows = await prisma.nckhProject.findMany({
    where: {
      ...(unitFilter ? { unitId: unitFilter } : {}),
      ...(status ? { status: status as NckhProjectStatus } : {}),
      ...(keyword ? { OR: [{ title: { contains: keyword, mode: 'insensitive' } }, { projectCode: { contains: keyword, mode: 'insensitive' } }] } : {}),
    },
    select: {
      projectCode: true, title: true, field: true, status: true, startDate: true,
      principalInvestigator: { select: { name: true } }, unit: { select: { name: true } },
    },
    orderBy: { startDate: 'desc' },
    take: MAX_ROWS,
  });
  return {
    columns: ['STT', 'Mã đề tài', 'Tên đề tài', 'Chủ nhiệm', 'Đơn vị', 'Lĩnh vực', 'Trạng thái', 'Bắt đầu'],
    rows: rows.map((r, i) => [
      String(i + 1), r.projectCode ?? '', r.title ?? '', r.principalInvestigator?.name ?? '',
      r.unit?.name ?? '', String(r.field ?? ''), NCKH_STATUS[r.status] ?? r.status, fmtDate(r.startDate),
    ]),
  };
}

async function buildPublicationTable(ctx: AggregateScopeCtx, keyword?: string, status?: string): Promise<TableData> {
  const unitFilter = unitInScope(ctx);
  const authorWhere = unitFilter ? { unitId: unitFilter } : undefined;
  const rows = await prisma.nckhPublication.findMany({
    where: {
      ...(authorWhere ? { author: authorWhere } : {}),
      ...(status ? { pubType: status as NckhPublicationType } : {}),
      ...(keyword ? { title: { contains: keyword, mode: 'insensitive' } } : {}),
    },
    select: {
      pubType: true, title: true, journal: true, publishedYear: true,
      author: { select: { name: true, unitRelation: { select: { name: true } } } },
    },
    orderBy: { publishedYear: 'desc' },
    take: MAX_ROWS,
  });
  return {
    columns: ['STT', 'Tác giả', 'Đơn vị', 'Loại', 'Tên công bố', 'Tạp chí/NXB', 'Năm'],
    rows: rows.map((r, i) => [
      String(i + 1), r.author?.name ?? '', r.author?.unitRelation?.name ?? '', PUB_TYPE[r.pubType] ?? r.pubType,
      r.title ?? '', r.journal ?? '', String(r.publishedYear ?? ''),
    ]),
  };
}

async function buildLegacyProjectTable(ctx: AggregateScopeCtx, keyword?: string, status?: string): Promise<TableData> {
  // ResearchProject (M09 legacy) gắn FacultyProfile → scope qua faculty.unitId; status là chuỗi tự do.
  const unitFilter = unitInScope(ctx);
  const facultyWhere = unitFilter ? { unitId: unitFilter } : undefined;
  const rows = await prisma.researchProject.findMany({
    where: {
      ...(facultyWhere ? { faculty: facultyWhere } : {}),
      ...(status ? { status } : {}),
      ...(keyword ? { OR: [{ projectName: { contains: keyword, mode: 'insensitive' } }, { projectCode: { contains: keyword, mode: 'insensitive' } }] } : {}),
    },
    select: {
      projectCode: true, projectName: true, field: true, level: true, status: true, startYear: true,
      faculty: { select: { user: { select: { name: true } }, unit: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: MAX_ROWS,
  });
  return {
    columns: ['STT', 'Mã đề tài', 'Tên đề tài', 'Chủ nhiệm', 'Đơn vị', 'Lĩnh vực', 'Cấp', 'Trạng thái', 'Năm BĐ'],
    rows: rows.map((r, i) => [
      String(i + 1), r.projectCode ?? '', r.projectName ?? '', r.faculty?.user?.name ?? '',
      r.faculty?.unit?.name ?? '', r.field ?? '', r.level ?? '', r.status ?? '', r.startYear ?? '',
    ]),
  };
}

async function buildInsuranceTable(ctx: AggregateScopeCtx, keyword?: string): Promise<TableData> {
  const unitFilter = unitInScope(ctx);
  const userWhere = {
    ...(unitFilter ? { unitId: unitFilter } : {}),
    ...(keyword ? { name: { contains: keyword, mode: 'insensitive' as const } } : {}),
  };
  const rows = await prisma.insuranceInfo.findMany({
    where: Object.keys(userWhere).length ? { user: userWhere } : {},
    select: {
      insuranceNumber: true, healthInsuranceNumber: true, healthInsuranceHospital: true, insuranceStartDate: true,
      user: { select: { name: true, rank: true, unitRelation: { select: { name: true } } } },
    },
    orderBy: { user: { name: 'asc' } },
    take: MAX_ROWS,
  });
  return {
    columns: ['STT', 'Họ và tên', 'Cấp bậc', 'Đơn vị', 'Số sổ BHXH', 'Số thẻ BHYT', 'Nơi KCB', 'Ngày tham gia'],
    rows: rows.map((r, i) => [
      String(i + 1), r.user?.name ?? '', r.user?.rank ?? '', r.user?.unitRelation?.name ?? '',
      r.insuranceNumber ?? '', r.healthInsuranceNumber ?? '', r.healthInsuranceHospital ?? '', fmtDate(r.insuranceStartDate),
    ]),
  };
}

async function buildFacultyTable(ctx: AggregateScopeCtx, keyword?: string): Promise<TableData> {
  const unitFilter = unitInScope(ctx);
  const rows = await prisma.facultyProfile.findMany({
    where: {
      ...(unitFilter ? { unitId: unitFilter } : {}),
      ...(keyword ? { user: { name: { contains: keyword, mode: 'insensitive' } } } : {}),
    },
    select: {
      academicRank: true, academicDegree: true,
      user: { select: { name: true, rank: true } }, unit: { select: { name: true } },
    },
    orderBy: { user: { name: 'asc' } },
    take: MAX_ROWS,
  });
  return {
    columns: ['STT', 'Họ và tên', 'Cấp bậc', 'Đơn vị', 'Học hàm', 'Học vị'],
    rows: rows.map((r, i) => [
      String(i + 1), r.user?.name ?? '', r.user?.rank ?? '', r.unit?.name ?? '',
      r.academicRank ?? '', r.academicDegree ?? '',
    ]),
  };
}

async function buildPartyOrgTable(ctx: AggregateScopeCtx, keyword?: string): Promise<TableData> {
  const unitFilter = unitInScope(ctx);
  const rows = await prisma.partyOrganization.findMany({
    where: {
      ...(unitFilter ? { unitId: unitFilter } : {}),
      ...(keyword ? { OR: [{ name: { contains: keyword, mode: 'insensitive' } }, { code: { contains: keyword, mode: 'insensitive' } }] } : {}),
    },
    select: { code: true, name: true, level: true, description: true, unit: { select: { name: true } } },
    orderBy: { level: 'asc' },
    take: MAX_ROWS,
  });
  return {
    columns: ['STT', 'Mã', 'Tên tổ chức Đảng', 'Cấp', 'Đơn vị', 'Mô tả'],
    rows: rows.map((r, i) => [
      String(i + 1), r.code ?? '', r.name ?? '', String(r.level ?? ''), r.unit?.name ?? '', r.description ?? '',
    ]),
  };
}

async function buildSubjectTable(ctx: AggregateScopeCtx, keyword?: string): Promise<TableData> {
  // HeSoMonHoc — danh mục môn học HVHC; khoaId là FK Unit → scope theo khoa.
  const unitFilter = unitInScope(ctx);
  const rows = await prisma.heSoMonHoc.findMany({
    where: {
      ...(unitFilter ? { khoaId: unitFilter } : {}),
      ...(keyword ? { OR: [{ tenMon: { contains: keyword, mode: 'insensitive' } }, { maMon: { contains: keyword, mode: 'insensitive' } }] } : {}),
    },
    select: { maMon: true, tenMon: true, soTinChi: true, khoa: true, boMon: true, loaiMon: true },
    orderBy: { tenMon: 'asc' },
    take: MAX_ROWS,
  });
  return {
    columns: ['STT', 'Mã môn', 'Tên môn học', 'Số TC', 'Khoa', 'Bộ môn', 'Loại'],
    rows: rows.map((r, i) => [
      String(i + 1), r.maMon ?? '', r.tenMon ?? '', String(r.soTinChi ?? ''), r.khoa ?? '', r.boMon ?? '', r.loaiMon ?? '',
    ]),
  };
}

async function buildTable(
  entityType: AggregateEntityType, ctx: AggregateScopeCtx, keyword?: string, status?: string,
): Promise<TableData> {
  switch (entityType) {
    case 'personnel': return buildPersonnelTable(ctx, keyword);
    case 'student': return buildStudentTable(ctx, keyword);
    case 'party_member': return buildPartyMemberTable(ctx, keyword, status);
    case 'scientist_profile': return buildScientistTable(ctx, keyword);
    case 'scientific_council': return buildCouncilTable(ctx, keyword, status);
    case 'policy': return buildPolicyTable(ctx, keyword, status);
    case 'award': return buildAwardTable(ctx, keyword, status);
    case 'research_project': return buildResearchProjectTable(ctx, keyword, status);
    case 'publication': return buildPublicationTable(ctx, keyword, status);
    case 'legacy_project': return buildLegacyProjectTable(ctx, keyword, status);
    case 'insurance': return buildInsuranceTable(ctx, keyword);
    case 'faculty': return buildFacultyTable(ctx, keyword);
    case 'party_org': return buildPartyOrgTable(ctx, keyword);
    case 'subject': return buildSubjectTable(ctx, keyword);
  }
}

// ─── Renderers ──────────────────────────────────────────────────────────────────

async function renderXlsx(title: string, table: TableData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'HỌC VIỆN HẬU CẦN';
  wb.created = new Date();
  const sheet = wb.addWorksheet('DanhSach');

  const colCount = table.columns.length;
  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center' };

  const headerRow = sheet.addRow(table.columns);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E4D8C' } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  for (const row of table.rows) {
    const r = sheet.addRow(row);
    r.eachCell((c) => {
      c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
  }

  sheet.columns.forEach((col, idx) => {
    col.width = idx === 0 ? 6 : idx === 1 ? 28 : 18;
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildAggregateHtml(title: string, scopeLabel: string, table: TableData): string {
  const now = new Date();
  const headerCells = table.columns.map((c) => `<th>${esc(c)}</th>`).join('');
  const bodyRows = table.rows
    .map((row) => `<tr>${row.map((cell, i) => `<td class="${i === 0 ? 'c' : ''}">${esc(cell)}</td>`).join('')}</tr>`)
    .join('');

  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><style>
    @page { size: A4 landscape; margin: 15mm; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; }
    .hdr { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .hdr td { width: 50%; text-align: center; vertical-align: top; }
    .bold { font-weight: bold; }
    .uline { display: inline-block; border-bottom: 1px solid #000; padding-bottom: 2px; }
    .title { text-align: center; font-weight: bold; font-size: 14pt; margin: 10px 0 2px; text-transform: uppercase; }
    .sub { text-align: center; font-style: italic; margin-bottom: 10px; }
    table.data { width: 100%; border-collapse: collapse; }
    table.data th, table.data td { border: 1px solid #000; padding: 4px 6px; font-size: 11pt; }
    table.data th { text-align: center; font-weight: bold; }
    table.data td.c { text-align: center; }
    .foot { text-align: right; margin-top: 14px; font-style: italic; }
  </style></head><body>
    <table class="hdr"><tr>
      <td><div>BỘ QUỐC PHÒNG</div><div class="bold"><span class="uline">HỌC VIỆN HẬU CẦN</span></div></td>
      <td><div class="bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div><div class="bold"><span class="uline">Độc lập - Tự do - Hạnh phúc</span></div></td>
    </tr></table>
    <div class="title">${esc(title)}</div>
    <div class="sub">Phạm vi: ${esc(scopeLabel)} — Tổng số: ${table.rows.length}</div>
    <table class="data"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
    <div class="foot">Hà Nội, ngày ${pad(now.getDate())} tháng ${pad(now.getMonth() + 1)} năm ${now.getFullYear()}</div>
  </body></html>`;
}

// ─── Public entrypoint ──────────────────────────────────────────────────────────

export async function exportAggregate(opts: {
  entityType: AggregateEntityType;
  format: AggregateFormat;
  keyword?: string;
  status?: string;
  scopeLabel: string;
  requestedBy: string;
  scopeCtx: AggregateScopeCtx;
}): Promise<AggregateResult> {
  const { entityType, format, keyword, status, scopeLabel, requestedBy, scopeCtx } = opts;
  const title = TITLES[entityType];

  const table = await buildTable(entityType, scopeCtx, keyword?.trim() || undefined, status?.trim() || undefined);

  let buffer: Buffer;
  let ext: string;
  let contentType: string;
  if (format === 'XLSX') {
    buffer = await renderXlsx(title, table);
    ext = 'xlsx';
    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else {
    const html = buildAggregateHtml(title, scopeLabel, table);
    buffer = await renderHtmlToPdf(html);
    ext = 'pdf';
    contentType = 'application/pdf';
  }

  const objectKey = `aggregate/${entityType}/${uuidv4()}.${ext}`;
  await uploadObject('M18_EXPORT', objectKey, buffer, {
    module: 'M18',
    'entity-type': 'aggregate-export',
    'entity-id': entityType,
    'uploaded-by': requestedBy,
    classification: 'INTERNAL',
    'content-type': contentType,
  });
  const downloadUrl = await getPresignedDownloadUrl('M18_EXPORT', objectKey, { expirySeconds: PREVIEW_TTL });

  return { downloadUrl, count: table.rows.length, expiresIn: PREVIEW_TTL, title };
}
