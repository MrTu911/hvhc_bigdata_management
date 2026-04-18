/**
 * M10 – Shared types cho Education module
 * Dùng chung cho civil-students, military-students pages, hooks và student-table.
 */

export interface HocVienListItem {
  id: string;
  maHocVien: string;
  hoTen: string;
  ngaySinh: string | null;
  gioiTinh: string | null;
  lop: string | null;
  khoaHoc: string | null;
  nganh: string | null;
  currentStatus: string;
  studyMode: string | null;
  heDaoTao: string | null;
  diemTrungBinh: number | null;
  tinChiTichLuy: number | null;
  ngayNhapHoc: string | null;
  createdAt: string;
  currentProgramVersion: {
    id: string;
    versionCode: string;
    effectiveFromCohort: string | null;
  } | null;
  giangVienHuongDan: { id: string; user: { name: string | null } } | null;
  // Military-specific — null for civil students
  khoaQuanLy: string | null;
  daiDoi: string | null;
  trungDoi: string | null;
  trainingSystemUnit: { id: string; code: string; name: string } | null;
  battalionUnit: { id: string; code: string; name: string } | null;
  academicWarnings: { warningLevel: string }[];
}

export interface AggregateStats {
  byStatus: Record<string, number>;
  lowGpaCount: number;
  warningCount: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StudentListParams {
  page?: number;
  limit?: number;
  search?: string;
  studentType?: 'civil' | 'military';
  currentStatus?: string;
  studyMode?: string;
  nganh?: string;
  khoaHoc?: string;
  lop?: string;
  trainingSystemUnitId?: string;
  battalionUnitId?: string;
  heDaoTao?: string;
}
