/**
 * SEED FUNCTION-BASED RBAC
 * Theo nguyên tắc: authorize(user, functionCode, context)
 * 
 * Bảng seed:
 * 1. Position - Chức vụ chuẩn (không hard-code trong code)
 * 2. Function - 65+ function codes
 * 3. PositionFunction - Gán quyền mặc định
 */

import { PrismaClient, PositionScope, FunctionScope, ActionType } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ===========================================
// DANH SÁCH CHỨC DANH CHUẨN
// ===========================================
const POSITIONS = [
  // Cấp Học viện (level 1)
  { code: 'GIAM_DOC', name: 'Giám đốc Học viện', description: 'Người đứng đầu Học viện', positionScope: 'ACADEMY' as PositionScope, level: 1 },
  { code: 'PHO_GIAM_DOC', name: 'Phó Giám đốc Học viện', description: 'Phó giám đốc phụ trách mảng', positionScope: 'ACADEMY' as PositionScope, level: 2 },
  { code: 'CHINH_UY', name: 'Chính ủy Học viện', description: 'Chính ủy Học viện', positionScope: 'ACADEMY' as PositionScope, level: 2 },
  
  // Cấp Khoa/Phòng (level 3-4)
  { code: 'TRUONG_KHOA', name: 'Trưởng Khoa', description: 'Trưởng khoa chuyên môn', positionScope: 'DEPARTMENT' as PositionScope, level: 3 },
  { code: 'PHO_TRUONG_KHOA', name: 'Phó Trưởng Khoa', description: 'Phó trưởng khoa', positionScope: 'DEPARTMENT' as PositionScope, level: 4 },
  { code: 'TRUONG_PHONG', name: 'Trưởng Phòng', description: 'Trưởng phòng ban', positionScope: 'DEPARTMENT' as PositionScope, level: 3 },
  { code: 'PHO_TRUONG_PHONG', name: 'Phó Trưởng Phòng', description: 'Phó trưởng phòng ban', positionScope: 'DEPARTMENT' as PositionScope, level: 4 },
  
  // Cấp Bộ môn (level 5)
  { code: 'CHU_NHIEM_BO_MON', name: 'Chủ nhiệm Bộ môn', description: 'Chủ nhiệm bộ môn', positionScope: 'UNIT' as PositionScope, level: 5 },
  { code: 'PHO_CHU_NHIEM_BM', name: 'Phó Chủ nhiệm Bộ môn', description: 'Phó chủ nhiệm bộ môn', positionScope: 'UNIT' as PositionScope, level: 6 },
  
  // Giảng viên & Nghiên cứu (level 7)
  { code: 'GIANG_VIEN_CHINH', name: 'Giảng viên chính', description: 'Giảng viên chính', positionScope: 'SELF' as PositionScope, level: 7 },
  { code: 'GIANG_VIEN', name: 'Giảng viên', description: 'Giảng viên', positionScope: 'SELF' as PositionScope, level: 8 },
  { code: 'TRO_GIANG', name: 'Trợ giảng', description: 'Trợ giảng', positionScope: 'SELF' as PositionScope, level: 9 },
  { code: 'NGHIEN_CUU_VIEN', name: 'Nghiên cứu viên', description: 'Nghiên cứu viên', positionScope: 'SELF' as PositionScope, level: 8 },
  
  // Chức vụ hành chính (level 7-8)
  { code: 'CHUYEN_VIEN', name: 'Chuyên viên', description: 'Chuyên viên hành chính', positionScope: 'UNIT' as PositionScope, level: 7 },
  { code: 'CAN_BO_THU_VIEN', name: 'Cán bộ Thư viện', description: 'Cán bộ thư viện', positionScope: 'UNIT' as PositionScope, level: 8 },
  { code: 'CAN_BO_TAI_CHINH', name: 'Cán bộ Tài chính', description: 'Cán bộ tài chính', positionScope: 'UNIT' as PositionScope, level: 8 },
  { code: 'CAN_BO_TO_CHUC', name: 'Cán bộ Tổ chức', description: 'Cán bộ tổ chức cán bộ', positionScope: 'UNIT' as PositionScope, level: 8 },
  { code: 'CAN_BO_DANG', name: 'Cán bộ Đảng', description: 'Cán bộ công tác Đảng', positionScope: 'UNIT' as PositionScope, level: 8 },
  
  // Quản trị hệ thống (level 3)
  { code: 'QUAN_TRI_HE_THONG', name: 'Quản trị hệ thống', description: 'Quản trị viên CNTT', positionScope: 'ACADEMY' as PositionScope, level: 3 },
  { code: 'KY_THUAT_VIEN', name: 'Kỹ thuật viên', description: 'Kỹ thuật viên CNTT', positionScope: 'ACADEMY' as PositionScope, level: 7 },
  
  // Học viên (level 10)
  { code: 'HOC_VIEN_QUAN_SU', name: 'Học viên quân sự', description: 'Học viên đào tạo sĩ quan', positionScope: 'SELF' as PositionScope, level: 10 },
  { code: 'SINH_VIEN_DAN_SU', name: 'Sinh viên dân sự', description: 'Sinh viên đào tạo dân sự', positionScope: 'SELF' as PositionScope, level: 10 },
  { code: 'HOC_VIEN_CAO_HOC', name: 'Học viên cao học', description: 'Học viên cao học/NCS', positionScope: 'SELF' as PositionScope, level: 10 },
];

// ===========================================
// DANH SÁCH 65+ FUNCTION CODES
// ===========================================
const FUNCTIONS = [
  // ===== MODULE: PERSONNEL (Quân nhân - CSDL #1-4) =====
  { code: 'VIEW_PERSONNEL', name: 'Xem hồ sơ cán bộ', module: 'personnel', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'VIEW_PERSONNEL_DETAIL', name: 'Xem chi tiết hồ sơ', module: 'personnel', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'VIEW_PERSONNEL_SENSITIVE', name: 'Xem thông tin nhạy cảm', module: 'personnel', actionType: 'VIEW' as ActionType, isCritical: true },
  { code: 'CREATE_PERSONNEL', name: 'Tạo hồ sơ cán bộ', module: 'personnel', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'UPDATE_PERSONNEL', name: 'Cập nhật hồ sơ', module: 'personnel', actionType: 'UPDATE' as ActionType, isCritical: false },
  { code: 'DELETE_PERSONNEL', name: 'Xóa hồ sơ cán bộ', module: 'personnel', actionType: 'DELETE' as ActionType, isCritical: true },
  { code: 'APPROVE_PERSONNEL', name: 'Phê duyệt hồ sơ', module: 'personnel', actionType: 'APPROVE' as ActionType, isCritical: true },
  { code: 'EXPORT_PERSONNEL', name: 'Xuất dữ liệu cán bộ', module: 'personnel', actionType: 'EXPORT' as ActionType, isCritical: true },
  { code: 'IMPORT_PERSONNEL', name: 'Nhập dữ liệu cán bộ', module: 'personnel', actionType: 'IMPORT' as ActionType, isCritical: true },
  { code: 'VIEW_CAREER_HISTORY', name: 'Xem quá trình công tác', module: 'personnel', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'UPDATE_CAREER_HISTORY', name: 'Cập nhật quá trình CT', module: 'personnel', actionType: 'UPDATE' as ActionType, isCritical: false },
  
  // ===== MODULE: TRAINING (Đào tạo - CSDL #5-6) =====
  { code: 'VIEW_TRAINING', name: 'Xem thông tin đào tạo', module: 'training', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'VIEW_COURSE', name: 'Xem môn học', module: 'training', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'CREATE_COURSE', name: 'Tạo môn học', module: 'training', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'UPDATE_COURSE', name: 'Cập nhật môn học', module: 'training', actionType: 'UPDATE' as ActionType, isCritical: false },
  { code: 'DELETE_COURSE', name: 'Xóa môn học', module: 'training', actionType: 'DELETE' as ActionType, isCritical: true },
  { code: 'REGISTER_COURSE', name: 'Đăng ký môn học', module: 'training', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'VIEW_GRADE', name: 'Xem điểm học tập', module: 'training', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'CREATE_GRADE_DRAFT', name: 'Nhập điểm (nháp)', module: 'training', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'SUBMIT_GRADE', name: 'Trình duyệt điểm', module: 'training', actionType: 'SUBMIT' as ActionType, isCritical: false },
  { code: 'APPROVE_GRADE', name: 'Phê duyệt điểm', module: 'training', actionType: 'APPROVE' as ActionType, isCritical: true },
  { code: 'REJECT_GRADE', name: 'Từ chối điểm', module: 'training', actionType: 'REJECT' as ActionType, isCritical: true },
  { code: 'EXPORT_GRADE', name: 'Xuất bảng điểm', module: 'training', actionType: 'EXPORT' as ActionType, isCritical: false },
  { code: 'VIEW_STUDENT', name: 'Xem thông tin học viên', module: 'training', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'VIEW_STUDENT_DETAIL', name: 'Xem chi tiết học viên', module: 'training', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'CREATE_STUDENT', name: 'Tạo hồ sơ học viên', module: 'training', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'UPDATE_STUDENT', name: 'Cập nhật hồ sơ HV', module: 'training', actionType: 'UPDATE' as ActionType, isCritical: false },
  { code: 'DELETE_STUDENT', name: 'Xóa hồ sơ học viên', module: 'training', actionType: 'DELETE' as ActionType, isCritical: true },
  { code: 'EXPORT_STUDENT', name: 'Xuất danh sách học viên', module: 'training', actionType: 'EXPORT' as ActionType, isCritical: false },
  
  // ===== MODULE: RESEARCH (NCKH - CSDL #7-8) =====
  { code: 'VIEW_RESEARCH', name: 'Xem đề tài NCKH', module: 'research', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'CREATE_RESEARCH', name: 'Tạo đề tài NCKH', module: 'research', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'UPDATE_RESEARCH', name: 'Cập nhật đề tài', module: 'research', actionType: 'UPDATE' as ActionType, isCritical: false },
  { code: 'DELETE_RESEARCH', name: 'Xóa đề tài NCKH', module: 'research', actionType: 'DELETE' as ActionType, isCritical: true },
  { code: 'SUBMIT_RESEARCH', name: 'Trình duyệt đề tài', module: 'research', actionType: 'SUBMIT' as ActionType, isCritical: false },
  { code: 'APPROVE_RESEARCH', name: 'Phê duyệt đề tài', module: 'research', actionType: 'APPROVE' as ActionType, isCritical: true },
  { code: 'REJECT_RESEARCH', name: 'Từ chối đề tài', module: 'research', actionType: 'REJECT' as ActionType, isCritical: true },
  { code: 'VIEW_PUBLICATION', name: 'Xem công bố khoa học', module: 'research', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'CREATE_PUBLICATION', name: 'Tạo công bố khoa học', module: 'research', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'UPDATE_PUBLICATION', name: 'Cập nhật công bố', module: 'research', actionType: 'UPDATE' as ActionType, isCritical: false },
  
  // ===== MODULE: PARTY (Đảng viên - CSDL #17) =====
  { code: 'VIEW_PARTY_MEMBER', name: 'Xem hồ sơ Đảng viên', module: 'party', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'VIEW_PARTY_SENSITIVE', name: 'Xem thông tin ĐV nhạy cảm', module: 'party', actionType: 'VIEW' as ActionType, isCritical: true },
  { code: 'CREATE_PARTY_MEMBER', name: 'Tạo hồ sơ Đảng viên', module: 'party', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'UPDATE_PARTY_MEMBER', name: 'Cập nhật hồ sơ ĐV', module: 'party', actionType: 'UPDATE' as ActionType, isCritical: false },
  { code: 'DELETE_PARTY_MEMBER', name: 'Xóa hồ sơ Đảng viên', module: 'party', actionType: 'DELETE' as ActionType, isCritical: true },
  { code: 'APPROVE_PARTY_MEMBER', name: 'Phê duyệt hồ sơ ĐV', module: 'party', actionType: 'APPROVE' as ActionType, isCritical: true },
  { code: 'VIEW_PARTY_ACTIVITY', name: 'Xem sinh hoạt Đảng', module: 'party', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'CREATE_PARTY_ACTIVITY', name: 'Tạo sinh hoạt Đảng', module: 'party', actionType: 'CREATE' as ActionType, isCritical: false },
  
  // ===== MODULE: POLICY (Chính sách - CSDL #18, #27) =====
  { code: 'VIEW_POLICY', name: 'Xem chính sách', module: 'policy', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'CREATE_POLICY_REQUEST', name: 'Tạo yêu cầu chính sách', module: 'policy', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'UPDATE_POLICY_REQUEST', name: 'Cập nhật yêu cầu', module: 'policy', actionType: 'UPDATE' as ActionType, isCritical: false },
  { code: 'SUBMIT_POLICY_REQUEST', name: 'Trình duyệt yêu cầu', module: 'policy', actionType: 'SUBMIT' as ActionType, isCritical: false },
  { code: 'APPROVE_POLICY', name: 'Phê duyệt chính sách', module: 'policy', actionType: 'APPROVE' as ActionType, isCritical: true },
  { code: 'REJECT_POLICY', name: 'Từ chối chính sách', module: 'policy', actionType: 'REJECT' as ActionType, isCritical: true },
  
  // ===== MODULE: INSURANCE (Bảo hiểm - CSDL #28) =====
  { code: 'VIEW_INSURANCE', name: 'Xem thông tin bảo hiểm', module: 'insurance', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'VIEW_INSURANCE_SENSITIVE', name: 'Xem số sổ BHXH/BHYT', module: 'insurance', actionType: 'VIEW' as ActionType, isCritical: true },
  { code: 'UPDATE_INSURANCE', name: 'Cập nhật bảo hiểm', module: 'insurance', actionType: 'UPDATE' as ActionType, isCritical: false },
  { code: 'APPROVE_INSURANCE', name: 'Phê duyệt bảo hiểm', module: 'insurance', actionType: 'APPROVE' as ActionType, isCritical: true },
  { code: 'EXPORT_INSURANCE', name: 'Xuất dữ liệu bảo hiểm', module: 'insurance', actionType: 'EXPORT' as ActionType, isCritical: true },
  
  // ===== MODULE: AWARDS (Thi đua khen thưởng - CSDL #18) =====
  { code: 'VIEW_AWARD', name: 'Xem khen thưởng', module: 'awards', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'CREATE_AWARD', name: 'Đề xuất khen thưởng', module: 'awards', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'UPDATE_AWARD', name: 'Cập nhật khen thưởng', module: 'awards', actionType: 'UPDATE' as ActionType, isCritical: false },
  { code: 'APPROVE_AWARD', name: 'Phê duyệt khen thưởng', module: 'awards', actionType: 'APPROVE' as ActionType, isCritical: true },
  { code: 'VIEW_DISCIPLINE', name: 'Xem kỷ luật', module: 'awards', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'CREATE_DISCIPLINE', name: 'Tạo quyết định kỷ luật', module: 'awards', actionType: 'CREATE' as ActionType, isCritical: true },
  { code: 'APPROVE_DISCIPLINE', name: 'Phê duyệt kỷ luật', module: 'awards', actionType: 'APPROVE' as ActionType, isCritical: true },
  
  // ===== MODULE: FACULTY (Giảng viên - CSDL #3) =====
  { code: 'VIEW_FACULTY', name: 'Xem danh sách giảng viên', module: 'faculty', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'VIEW_FACULTY_DETAIL', name: 'Xem chi tiết giảng viên', module: 'faculty', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'CREATE_FACULTY', name: 'Tạo hồ sơ giảng viên', module: 'faculty', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'UPDATE_FACULTY', name: 'Cập nhật hồ sơ GV', module: 'faculty', actionType: 'UPDATE' as ActionType, isCritical: false },
  { code: 'DELETE_FACULTY', name: 'Xóa hồ sơ giảng viên', module: 'faculty', actionType: 'DELETE' as ActionType, isCritical: true },
  { code: 'EXPORT_FACULTY', name: 'Xuất dữ liệu giảng viên', module: 'faculty', actionType: 'EXPORT' as ActionType, isCritical: false },
  { code: 'VIEW_FACULTY_RESEARCH', name: 'Xem NCKH của GV', module: 'faculty', actionType: 'VIEW' as ActionType, isCritical: false },
  
  // ===== MODULE: DATA (Dữ liệu - BigData) =====
  { code: 'VIEW_DATA', name: 'Xem dữ liệu', module: 'data', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'CREATE_DATA', name: 'Tạo/Upload dữ liệu', module: 'data', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'UPDATE_DATA', name: 'Cập nhật dữ liệu', module: 'data', actionType: 'UPDATE' as ActionType, isCritical: false },
  { code: 'DELETE_DATA', name: 'Xóa dữ liệu', module: 'data', actionType: 'DELETE' as ActionType, isCritical: true },
  { code: 'EXPORT_DATA', name: 'Xuất dữ liệu', module: 'data', actionType: 'EXPORT' as ActionType, isCritical: false },
  { code: 'IMPORT_DATA', name: 'Nhập dữ liệu', module: 'data', actionType: 'IMPORT' as ActionType, isCritical: true },
  { code: 'QUERY_DATA', name: 'Truy vấn dữ liệu', module: 'data', actionType: 'VIEW' as ActionType, isCritical: false },
  
  // ===== MODULE: SYSTEM (Quản trị hệ thống) =====
  { code: 'MANAGE_USERS', name: 'Quản lý người dùng', module: 'system', actionType: 'UPDATE' as ActionType, isCritical: true },
  { code: 'MANAGE_UNITS', name: 'Quản lý đơn vị', module: 'system', actionType: 'UPDATE' as ActionType, isCritical: true },
  { code: 'MANAGE_RBAC', name: 'Quản lý phân quyền', module: 'system', actionType: 'UPDATE' as ActionType, isCritical: true },
  { code: 'VIEW_AUDIT_LOG', name: 'Xem nhật ký hệ thống', module: 'system', actionType: 'VIEW' as ActionType, isCritical: true },
  { code: 'VIEW_DASHBOARD', name: 'Xem Dashboard', module: 'system', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'VIEW_DASHBOARD_COMMAND', name: 'Xem Dashboard Chỉ huy', module: 'system', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'MANAGE_AI_CONFIG', name: 'Cấu hình AI', module: 'system', actionType: 'UPDATE' as ActionType, isCritical: true },
  { code: 'MANAGE_BACKUP', name: 'Quản lý sao lưu', module: 'system', actionType: 'UPDATE' as ActionType, isCritical: true },
  { code: 'VIEW_SYSTEM_HEALTH', name: 'Xem trạng thái hệ thống', module: 'system', actionType: 'VIEW' as ActionType, isCritical: false },
];

// ===========================================
// GÁN QUYỀN MẶC ĐỊNH CHO TỪNG CHỨC DANH
// ===========================================
const POSITION_FUNCTION_MAPPINGS: { positionCode: string; functionCodes: { code: string; scope: FunctionScope }[] }[] = [
  // Giám đốc - TOÀN QUYỀN
  {
    positionCode: 'GIAM_DOC',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'ACADEMY' },
      { code: 'VIEW_PERSONNEL_SENSITIVE', scope: 'ACADEMY' },
      { code: 'APPROVE_PERSONNEL', scope: 'ACADEMY' },
      { code: 'VIEW_TRAINING', scope: 'ACADEMY' },
      { code: 'APPROVE_GRADE', scope: 'ACADEMY' },
      { code: 'VIEW_RESEARCH', scope: 'ACADEMY' },
      { code: 'APPROVE_RESEARCH', scope: 'ACADEMY' },
      { code: 'VIEW_PARTY_MEMBER', scope: 'ACADEMY' },
      { code: 'APPROVE_PARTY_MEMBER', scope: 'ACADEMY' },
      { code: 'APPROVE_POLICY', scope: 'ACADEMY' },
      { code: 'APPROVE_AWARD', scope: 'ACADEMY' },
      { code: 'APPROVE_DISCIPLINE', scope: 'ACADEMY' },
      { code: 'VIEW_DASHBOARD_COMMAND', scope: 'ACADEMY' },
      { code: 'VIEW_AUDIT_LOG', scope: 'ACADEMY' },
    ],
  },
  // Phó Giám đốc
  {
    positionCode: 'PHO_GIAM_DOC',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'ACADEMY' },
      { code: 'VIEW_PERSONNEL_SENSITIVE', scope: 'ACADEMY' },
      { code: 'VIEW_TRAINING', scope: 'ACADEMY' },
      { code: 'APPROVE_GRADE', scope: 'ACADEMY' },
      { code: 'VIEW_RESEARCH', scope: 'ACADEMY' },
      { code: 'APPROVE_RESEARCH', scope: 'ACADEMY' },
      { code: 'VIEW_PARTY_MEMBER', scope: 'ACADEMY' },
      { code: 'APPROVE_POLICY', scope: 'ACADEMY' },
      { code: 'VIEW_DASHBOARD_COMMAND', scope: 'ACADEMY' },
    ],
  },
  // Trưởng Khoa
  {
    positionCode: 'TRUONG_KHOA',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'DEPARTMENT' },
      { code: 'UPDATE_PERSONNEL', scope: 'DEPARTMENT' },
      { code: 'VIEW_TRAINING', scope: 'DEPARTMENT' },
      { code: 'APPROVE_GRADE', scope: 'DEPARTMENT' },
      { code: 'VIEW_STUDENT', scope: 'DEPARTMENT' },
      { code: 'UPDATE_STUDENT', scope: 'DEPARTMENT' },
      { code: 'VIEW_RESEARCH', scope: 'DEPARTMENT' },
      { code: 'APPROVE_RESEARCH', scope: 'DEPARTMENT' },
      { code: 'CREATE_AWARD', scope: 'DEPARTMENT' },
      { code: 'VIEW_DASHBOARD', scope: 'DEPARTMENT' },
      // FACULTY module
      { code: 'VIEW_FACULTY', scope: 'DEPARTMENT' },
      { code: 'VIEW_FACULTY_DETAIL', scope: 'DEPARTMENT' },
      { code: 'CREATE_FACULTY', scope: 'DEPARTMENT' },
      { code: 'UPDATE_FACULTY', scope: 'DEPARTMENT' },
      { code: 'EXPORT_FACULTY', scope: 'DEPARTMENT' },
      { code: 'VIEW_FACULTY_RESEARCH', scope: 'DEPARTMENT' },
    ],
  },
  // Trưởng Phòng
  {
    positionCode: 'TRUONG_PHONG',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'DEPARTMENT' },
      { code: 'UPDATE_PERSONNEL', scope: 'DEPARTMENT' },
      { code: 'CREATE_AWARD', scope: 'DEPARTMENT' },
      { code: 'VIEW_DASHBOARD', scope: 'DEPARTMENT' },
    ],
  },
  // Chủ nhiệm Bộ môn
  {
    positionCode: 'CHU_NHIEM_BO_MON',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'UNIT' },
      { code: 'VIEW_TRAINING', scope: 'UNIT' },
      { code: 'APPROVE_GRADE', scope: 'UNIT' },
      { code: 'VIEW_STUDENT', scope: 'UNIT' },
      { code: 'VIEW_RESEARCH', scope: 'UNIT' },
      { code: 'SUBMIT_RESEARCH', scope: 'UNIT' },
      { code: 'VIEW_DASHBOARD', scope: 'UNIT' },
      // FACULTY module
      { code: 'VIEW_FACULTY', scope: 'UNIT' },
      { code: 'VIEW_FACULTY_DETAIL', scope: 'UNIT' },
      { code: 'UPDATE_FACULTY', scope: 'UNIT' },
      { code: 'VIEW_FACULTY_RESEARCH', scope: 'UNIT' },
    ],
  },
  // Giảng viên
  {
    positionCode: 'GIANG_VIEN',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'SELF' },
      { code: 'VIEW_COURSE', scope: 'UNIT' },
      { code: 'CREATE_GRADE_DRAFT', scope: 'UNIT' },
      { code: 'SUBMIT_GRADE', scope: 'UNIT' },
      { code: 'VIEW_STUDENT', scope: 'UNIT' },
      { code: 'VIEW_RESEARCH', scope: 'SELF' },
      { code: 'CREATE_RESEARCH', scope: 'SELF' },
      { code: 'UPDATE_RESEARCH', scope: 'SELF' },
      { code: 'SUBMIT_RESEARCH', scope: 'SELF' },
      { code: 'CREATE_PUBLICATION', scope: 'SELF' },
      { code: 'VIEW_DASHBOARD', scope: 'SELF' },
      // FACULTY module - giảng viên chỉ xem thông tin của mình
      { code: 'VIEW_FACULTY', scope: 'SELF' },
      { code: 'VIEW_FACULTY_DETAIL', scope: 'SELF' },
      { code: 'UPDATE_FACULTY', scope: 'SELF' },
      { code: 'VIEW_FACULTY_RESEARCH', scope: 'SELF' },
    ],
  },
  // Quản trị hệ thống
  {
    positionCode: 'QUAN_TRI_HE_THONG',
    functionCodes: [
      { code: 'MANAGE_USERS', scope: 'ACADEMY' },
      { code: 'MANAGE_UNITS', scope: 'ACADEMY' },
      { code: 'MANAGE_RBAC', scope: 'ACADEMY' },
      { code: 'VIEW_AUDIT_LOG', scope: 'ACADEMY' },
      { code: 'MANAGE_AI_CONFIG', scope: 'ACADEMY' },
      { code: 'MANAGE_BACKUP', scope: 'ACADEMY' },
      { code: 'VIEW_SYSTEM_HEALTH', scope: 'ACADEMY' },
      { code: 'VIEW_DASHBOARD', scope: 'ACADEMY' },
      // FACULTY module - admin có toàn quyền
      { code: 'VIEW_FACULTY', scope: 'ACADEMY' },
      { code: 'VIEW_FACULTY_DETAIL', scope: 'ACADEMY' },
      { code: 'CREATE_FACULTY', scope: 'ACADEMY' },
      { code: 'UPDATE_FACULTY', scope: 'ACADEMY' },
      { code: 'DELETE_FACULTY', scope: 'ACADEMY' },
      { code: 'EXPORT_FACULTY', scope: 'ACADEMY' },
      { code: 'VIEW_FACULTY_RESEARCH', scope: 'ACADEMY' },
      // DATA module - admin có toàn quyền
      { code: 'VIEW_DATA', scope: 'ACADEMY' },
      { code: 'CREATE_DATA', scope: 'ACADEMY' },
      { code: 'UPDATE_DATA', scope: 'ACADEMY' },
      { code: 'DELETE_DATA', scope: 'ACADEMY' },
      { code: 'EXPORT_DATA', scope: 'ACADEMY' },
      { code: 'IMPORT_DATA', scope: 'ACADEMY' },
      { code: 'QUERY_DATA', scope: 'ACADEMY' },
    ],
  },
  // Học viên
  {
    positionCode: 'HOC_VIEN_QUAN_SU',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'SELF' },
      { code: 'VIEW_COURSE', scope: 'UNIT' },
      { code: 'REGISTER_COURSE', scope: 'SELF' },
      { code: 'VIEW_GRADE', scope: 'SELF' },
      { code: 'VIEW_DASHBOARD', scope: 'SELF' },
    ],
  },
  // Cán bộ Đảng
  {
    positionCode: 'CAN_BO_DANG',
    functionCodes: [
      { code: 'VIEW_PARTY_MEMBER', scope: 'UNIT' },
      { code: 'CREATE_PARTY_MEMBER', scope: 'UNIT' },
      { code: 'UPDATE_PARTY_MEMBER', scope: 'UNIT' },
      { code: 'VIEW_PARTY_ACTIVITY', scope: 'UNIT' },
      { code: 'CREATE_PARTY_ACTIVITY', scope: 'UNIT' },
    ],
  },
  // ========== 13 POSITIONS CÒN THIẾU ==========
  // Chính ủy - quyền cao cấp về công tác Đảng
  {
    positionCode: 'CHINH_UY',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'ACADEMY' },
      { code: 'VIEW_PERSONNEL_DETAIL', scope: 'ACADEMY' },
      { code: 'VIEW_PARTY_MEMBER', scope: 'ACADEMY' },
      { code: 'VIEW_PARTY_SENSITIVE', scope: 'ACADEMY' },
      { code: 'APPROVE_PARTY_MEMBER', scope: 'ACADEMY' },
      { code: 'VIEW_PARTY_ACTIVITY', scope: 'ACADEMY' },
      { code: 'CREATE_PARTY_ACTIVITY', scope: 'ACADEMY' },
      { code: 'VIEW_AWARD', scope: 'ACADEMY' },
      { code: 'APPROVE_AWARD', scope: 'ACADEMY' },
      { code: 'VIEW_DISCIPLINE', scope: 'ACADEMY' },
      { code: 'APPROVE_DISCIPLINE', scope: 'ACADEMY' },
      { code: 'VIEW_DASHBOARD_COMMAND', scope: 'ACADEMY' },
    ],
  },
  // Phó Trưởng Khoa - quyền xem và cập nhật trong phạm vi khoa
  {
    positionCode: 'PHO_TRUONG_KHOA',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'DEPARTMENT' },
      { code: 'VIEW_PERSONNEL_DETAIL', scope: 'DEPARTMENT' },
      { code: 'UPDATE_PERSONNEL', scope: 'DEPARTMENT' },
      { code: 'VIEW_CAREER_HISTORY', scope: 'DEPARTMENT' },
      { code: 'VIEW_TRAINING', scope: 'DEPARTMENT' },
      { code: 'VIEW_COURSE', scope: 'DEPARTMENT' },
      { code: 'VIEW_GRADE', scope: 'DEPARTMENT' },
      { code: 'VIEW_STUDENT', scope: 'DEPARTMENT' },
      { code: 'VIEW_STUDENT_DETAIL', scope: 'DEPARTMENT' },
      { code: 'UPDATE_STUDENT', scope: 'DEPARTMENT' },
      { code: 'VIEW_RESEARCH', scope: 'DEPARTMENT' },
      { code: 'CREATE_RESEARCH', scope: 'DEPARTMENT' },
      { code: 'UPDATE_RESEARCH', scope: 'DEPARTMENT' },
      { code: 'VIEW_FACULTY', scope: 'DEPARTMENT' },
      { code: 'VIEW_FACULTY_DETAIL', scope: 'DEPARTMENT' },
      { code: 'VIEW_PARTY_MEMBER', scope: 'DEPARTMENT' },
      { code: 'VIEW_POLICY', scope: 'DEPARTMENT' },
      { code: 'VIEW_AWARD', scope: 'DEPARTMENT' },
      { code: 'VIEW_DASHBOARD', scope: 'DEPARTMENT' },
    ],
  },
  // Phó Trưởng Phòng
  {
    positionCode: 'PHO_TRUONG_PHONG',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'DEPARTMENT' },
      { code: 'VIEW_PERSONNEL_DETAIL', scope: 'DEPARTMENT' },
      { code: 'UPDATE_PERSONNEL', scope: 'DEPARTMENT' },
      { code: 'VIEW_CAREER_HISTORY', scope: 'DEPARTMENT' },
      { code: 'VIEW_RESEARCH', scope: 'DEPARTMENT' },
      { code: 'CREATE_RESEARCH', scope: 'DEPARTMENT' },
      { code: 'VIEW_POLICY', scope: 'DEPARTMENT' },
      { code: 'CREATE_POLICY_REQUEST', scope: 'DEPARTMENT' },
      { code: 'UPDATE_POLICY_REQUEST', scope: 'DEPARTMENT' },
      { code: 'VIEW_INSURANCE', scope: 'DEPARTMENT' },
      { code: 'VIEW_AWARD', scope: 'DEPARTMENT' },
      { code: 'VIEW_DASHBOARD', scope: 'DEPARTMENT' },
    ],
  },
  // Phó Chủ nhiệm Bộ môn
  {
    positionCode: 'PHO_CHU_NHIEM_BM',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'UNIT' },
      { code: 'VIEW_PERSONNEL_DETAIL', scope: 'UNIT' },
      { code: 'VIEW_CAREER_HISTORY', scope: 'UNIT' },
      { code: 'VIEW_TRAINING', scope: 'UNIT' },
      { code: 'VIEW_COURSE', scope: 'UNIT' },
      { code: 'CREATE_COURSE', scope: 'UNIT' },
      { code: 'UPDATE_COURSE', scope: 'UNIT' },
      { code: 'VIEW_GRADE', scope: 'UNIT' },
      { code: 'VIEW_STUDENT', scope: 'UNIT' },
      { code: 'VIEW_STUDENT_DETAIL', scope: 'UNIT' },
      { code: 'UPDATE_STUDENT', scope: 'UNIT' },
      { code: 'VIEW_RESEARCH', scope: 'UNIT' },
      { code: 'CREATE_RESEARCH', scope: 'UNIT' },
      { code: 'VIEW_FACULTY', scope: 'UNIT' },
      { code: 'VIEW_FACULTY_DETAIL', scope: 'UNIT' },
      { code: 'VIEW_DASHBOARD', scope: 'UNIT' },
    ],
  },
  // Giảng viên chính - quyền xem và tạo
  {
    positionCode: 'GIANG_VIEN_CHINH',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'SELF' },
      { code: 'VIEW_PERSONNEL_DETAIL', scope: 'SELF' },
      { code: 'VIEW_TRAINING', scope: 'UNIT' },
      { code: 'VIEW_COURSE', scope: 'UNIT' },
      { code: 'CREATE_COURSE', scope: 'UNIT' },
      { code: 'UPDATE_COURSE', scope: 'UNIT' },
      { code: 'VIEW_GRADE', scope: 'UNIT' },
      { code: 'CREATE_GRADE_DRAFT', scope: 'UNIT' },
      { code: 'SUBMIT_GRADE', scope: 'UNIT' },
      { code: 'VIEW_STUDENT', scope: 'UNIT' },
      { code: 'VIEW_STUDENT_DETAIL', scope: 'UNIT' },
      { code: 'UPDATE_STUDENT', scope: 'UNIT' },
      { code: 'VIEW_RESEARCH', scope: 'SELF' },
      { code: 'CREATE_RESEARCH', scope: 'SELF' },
      { code: 'UPDATE_RESEARCH', scope: 'SELF' },
      { code: 'SUBMIT_RESEARCH', scope: 'SELF' },
      { code: 'VIEW_PUBLICATION', scope: 'SELF' },
      { code: 'CREATE_PUBLICATION', scope: 'SELF' },
      { code: 'UPDATE_PUBLICATION', scope: 'SELF' },
      { code: 'VIEW_FACULTY', scope: 'SELF' },
      { code: 'VIEW_FACULTY_DETAIL', scope: 'SELF' },
      { code: 'UPDATE_FACULTY', scope: 'SELF' },
      { code: 'VIEW_DASHBOARD', scope: 'SELF' },
    ],
  },
  // Trợ giảng - quyền hạn chế
  {
    positionCode: 'TRO_GIANG',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'SELF' },
      { code: 'VIEW_COURSE', scope: 'UNIT' },
      { code: 'VIEW_GRADE', scope: 'UNIT' },
      { code: 'VIEW_STUDENT', scope: 'UNIT' },
      { code: 'VIEW_RESEARCH', scope: 'UNIT' },
      { code: 'VIEW_FACULTY', scope: 'UNIT' },
      { code: 'VIEW_DASHBOARD', scope: 'SELF' },
    ],
  },
  // Nghiên cứu viên - chuyên về NCKH
  {
    positionCode: 'NGHIEN_CUU_VIEN',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'SELF' },
      { code: 'VIEW_RESEARCH', scope: 'UNIT' },
      { code: 'CREATE_RESEARCH', scope: 'SELF' },
      { code: 'UPDATE_RESEARCH', scope: 'SELF' },
      { code: 'SUBMIT_RESEARCH', scope: 'SELF' },
      { code: 'VIEW_PUBLICATION', scope: 'UNIT' },
      { code: 'CREATE_PUBLICATION', scope: 'SELF' },
      { code: 'UPDATE_PUBLICATION', scope: 'SELF' },
      { code: 'VIEW_DASHBOARD', scope: 'SELF' },
    ],
  },
  // Chuyên viên - hỗ trợ hành chính
  {
    positionCode: 'CHUYEN_VIEN',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'UNIT' },
      { code: 'VIEW_PERSONNEL_DETAIL', scope: 'UNIT' },
      { code: 'VIEW_CAREER_HISTORY', scope: 'UNIT' },
      { code: 'VIEW_COURSE', scope: 'UNIT' },
      { code: 'VIEW_GRADE', scope: 'UNIT' },
      { code: 'VIEW_STUDENT', scope: 'UNIT' },
      { code: 'VIEW_POLICY', scope: 'UNIT' },
      { code: 'CREATE_POLICY_REQUEST', scope: 'UNIT' },
      { code: 'VIEW_INSURANCE', scope: 'UNIT' },
      { code: 'VIEW_AWARD', scope: 'UNIT' },
      { code: 'VIEW_DASHBOARD', scope: 'UNIT' },
    ],
  },
  // Cán bộ Thư viện
  {
    positionCode: 'CAN_BO_THU_VIEN',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'ACADEMY' },
      { code: 'VIEW_COURSE', scope: 'ACADEMY' },
      { code: 'VIEW_STUDENT', scope: 'ACADEMY' },
      { code: 'VIEW_RESEARCH', scope: 'ACADEMY' },
      { code: 'VIEW_PUBLICATION', scope: 'ACADEMY' },
      { code: 'VIEW_DASHBOARD', scope: 'UNIT' },
    ],
  },
  // Cán bộ Tài chính
  {
    positionCode: 'CAN_BO_TAI_CHINH',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'ACADEMY' },
      { code: 'VIEW_PERSONNEL_DETAIL', scope: 'ACADEMY' },
      { code: 'VIEW_CAREER_HISTORY', scope: 'ACADEMY' },
      { code: 'VIEW_POLICY', scope: 'ACADEMY' },
      { code: 'CREATE_POLICY_REQUEST', scope: 'UNIT' },
      { code: 'UPDATE_POLICY_REQUEST', scope: 'UNIT' },
      { code: 'VIEW_INSURANCE', scope: 'ACADEMY' },
      { code: 'UPDATE_INSURANCE', scope: 'UNIT' },
      { code: 'VIEW_AWARD', scope: 'ACADEMY' },
      { code: 'VIEW_DASHBOARD', scope: 'UNIT' },
    ],
  },
  // Cán bộ Tổ chức
  {
    positionCode: 'CAN_BO_TO_CHUC',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'ACADEMY' },
      { code: 'VIEW_PERSONNEL_DETAIL', scope: 'ACADEMY' },
      { code: 'CREATE_PERSONNEL', scope: 'ACADEMY' },
      { code: 'UPDATE_PERSONNEL', scope: 'ACADEMY' },
      { code: 'VIEW_CAREER_HISTORY', scope: 'ACADEMY' },
      { code: 'UPDATE_CAREER_HISTORY', scope: 'ACADEMY' },
      { code: 'VIEW_PARTY_MEMBER', scope: 'ACADEMY' },
      { code: 'CREATE_PARTY_MEMBER', scope: 'ACADEMY' },
      { code: 'UPDATE_PARTY_MEMBER', scope: 'ACADEMY' },
      { code: 'VIEW_POLICY', scope: 'ACADEMY' },
      { code: 'CREATE_POLICY_REQUEST', scope: 'ACADEMY' },
      { code: 'UPDATE_POLICY_REQUEST', scope: 'ACADEMY' },
      { code: 'SUBMIT_POLICY_REQUEST', scope: 'ACADEMY' },
      { code: 'VIEW_AWARD', scope: 'ACADEMY' },
      { code: 'CREATE_AWARD', scope: 'ACADEMY' },
      { code: 'UPDATE_AWARD', scope: 'ACADEMY' },
      { code: 'VIEW_DISCIPLINE', scope: 'ACADEMY' },
      { code: 'CREATE_DISCIPLINE', scope: 'ACADEMY' },
      { code: 'VIEW_DASHBOARD', scope: 'UNIT' },
    ],
  },
  // Kỹ thuật viên
  {
    positionCode: 'KY_THUAT_VIEN',
    functionCodes: [
      { code: 'VIEW_PERSONNEL', scope: 'UNIT' },
      { code: 'VIEW_COURSE', scope: 'ACADEMY' },
      { code: 'VIEW_STUDENT', scope: 'ACADEMY' },
      { code: 'VIEW_DATA', scope: 'ACADEMY' },
      { code: 'CREATE_DATA', scope: 'ACADEMY' },
      { code: 'VIEW_DASHBOARD', scope: 'UNIT' },
    ],
  },
  // Sinh viên dân sự - chỉ xem thông tin cá nhân
  {
    positionCode: 'SINH_VIEN_DAN_SU',
    functionCodes: [
      { code: 'VIEW_COURSE', scope: 'UNIT' },
      { code: 'REGISTER_COURSE', scope: 'SELF' },
      { code: 'VIEW_GRADE', scope: 'SELF' },
      { code: 'VIEW_RESEARCH', scope: 'UNIT' },
      { code: 'VIEW_DASHBOARD', scope: 'SELF' },
    ],
  },
  // Học viên cao học
  {
    positionCode: 'HOC_VIEN_CAO_HOC',
    functionCodes: [
      { code: 'VIEW_COURSE', scope: 'UNIT' },
      { code: 'REGISTER_COURSE', scope: 'SELF' },
      { code: 'VIEW_GRADE', scope: 'SELF' },
      { code: 'VIEW_RESEARCH', scope: 'UNIT' },
      { code: 'CREATE_RESEARCH', scope: 'SELF' },
      { code: 'UPDATE_RESEARCH', scope: 'SELF' },
      { code: 'SUBMIT_RESEARCH', scope: 'SELF' },
      { code: 'VIEW_PUBLICATION', scope: 'UNIT' },
      { code: 'VIEW_DASHBOARD', scope: 'SELF' },
    ],
  },
];

// ===========================================
// MAIN SEED FUNCTION
// ===========================================
async function seedRBAC() {
  console.log('🚀 Bắt đầu seed RBAC Function-based...');
  console.log('=' .repeat(50));

  // 1. Seed Positions
  console.log('\n📋 Seed Chức vụ (Position)...');
  let positionCount = 0;
  for (const pos of POSITIONS) {
    const existing = await prisma.position.findUnique({ where: { code: pos.code } });
    if (!existing) {
      await prisma.position.create({ data: pos });
      positionCount++;
      console.log(`  ✓ Tạo: ${pos.code} - ${pos.name}`);
    } else {
      console.log(`  - Đã có: ${pos.code}`);
    }
  }
  console.log(`  → Tổng tạo mới: ${positionCount}/${POSITIONS.length}`);

  // 2. Seed Functions
  console.log('\n🔑 Seed Chức năng (Function)...');
  let functionCount = 0;
  for (const func of FUNCTIONS) {
    const existing = await prisma.function.findUnique({ where: { code: func.code } });
    if (!existing) {
      await prisma.function.create({ data: func });
      functionCount++;
    }
  }
  console.log(`  → Tổng tạo mới: ${functionCount}/${FUNCTIONS.length} function codes`);

  // 3. Seed PositionFunction mappings
  console.log('\n🔗 Seed Gán quyền (PositionFunction)...');
  let mappingCount = 0;
  for (const mapping of POSITION_FUNCTION_MAPPINGS) {
    const position = await prisma.position.findUnique({ where: { code: mapping.positionCode } });
    if (!position) {
      console.log(`  ⚠ Không tìm thấy Position: ${mapping.positionCode}`);
      continue;
    }

    for (const funcMapping of mapping.functionCodes) {
      const func = await prisma.function.findUnique({ where: { code: funcMapping.code } });
      if (!func) {
        console.log(`  ⚠ Không tìm thấy Function: ${funcMapping.code}`);
        continue;
      }

      const existing = await prisma.positionFunction.findUnique({
        where: {
          positionId_functionId: {
            positionId: position.id,
            functionId: func.id,
          },
        },
      });

      if (!existing) {
        await prisma.positionFunction.create({
          data: {
            positionId: position.id,
            functionId: func.id,
            scope: funcMapping.scope,
          },
        });
        mappingCount++;
      }
    }
    console.log(`  ✓ ${mapping.positionCode}: ${mapping.functionCodes.length} quyền`);
  }
  console.log(`  → Tổng mapping tạo mới: ${mappingCount}`);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✅ HOÀN THÀNH SEED RBAC');
  console.log(`  • Position: ${POSITIONS.length} chức vụ`);
  console.log(`  • Function: ${FUNCTIONS.length} function codes`);
  console.log(`  • Mappings: ${mappingCount} gán quyền`);
  console.log('='.repeat(50));
}

// Run
seedRBAC()
  .catch((e) => {
    console.error('❌ Lỗi seed RBAC:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
