/**
 * SEED DEMO DATA v8.2
 * Dữ liệu mẫu hoàn chỉnh cho hệ thống HVHC BigData
 * Phù hợp với Position-based RBAC mới
 * 
 * Chạy: npx tsx prisma/seed/seed_demo_data_v8.ts
 */

import { PrismaClient, UserRole, PositionScope, FunctionScope, ActionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Mật khẩu demo chung
const DEMO_PASSWORD = 'Hv@2025';

// ==================================================
// 1. ĐỊNH NGHĨA POSITIONS MỚI
// ==================================================
const POSITIONS = [
  // Quản trị hệ thống
  { code: 'SYSTEM_ADMIN', name: 'Quản trị hệ thống', description: 'Quản trị toàn bộ hệ thống', positionScope: 'ACADEMY' as PositionScope, level: 100 },
  // Cấp Học viện
  { code: 'CHI_HUY_HOC_VIEN', name: 'Chỉ huy Học viện', description: 'Giám đốc/Phó Giám đốc Học viện', positionScope: 'ACADEMY' as PositionScope, level: 90 },
  // Cấp Khoa/Phòng
  { code: 'CHI_HUY_KHOA', name: 'Chỉ huy Khoa', description: 'Trưởng/Phó Khoa', positionScope: 'DEPARTMENT' as PositionScope, level: 80 },
  { code: 'CHI_HUY_PHONG', name: 'Chỉ huy Phòng', description: 'Trưởng/Phó Phòng ban', positionScope: 'DEPARTMENT' as PositionScope, level: 80 },
  // Cấp Hệ/Tiểu đoàn
  { code: 'CHI_HUY_HE', name: 'Chỉ huy Hệ', description: 'Chỉ huy Hệ quản lý học viên', positionScope: 'UNIT' as PositionScope, level: 75 },
  { code: 'CHI_HUY_TIEU_DOAN', name: 'Chỉ huy Tiểu đoàn', description: 'Chỉ huy Tiểu đoàn huấn luyện', positionScope: 'UNIT' as PositionScope, level: 75 },
  // Cấp Bộ môn/Ban
  { code: 'CHI_HUY_BO_MON', name: 'Chỉ huy Bộ môn', description: 'Chỉ huy Bộ môn giảng dạy', positionScope: 'UNIT' as PositionScope, level: 70 },
  { code: 'CHI_HUY_BAN', name: 'Chỉ huy Ban', description: 'Chỉ huy Ban nghiệp vụ', positionScope: 'UNIT' as PositionScope, level: 70 },
  // Giảng viên & Nghiên cứu
  { code: 'GIANG_VIEN', name: 'Giảng viên', description: 'Giảng viên giảng dạy', positionScope: 'SELF' as PositionScope, level: 60 },
  { code: 'NGHIEN_CUU_VIEN', name: 'Nghiên cứu viên', description: 'Nghiên cứu viên khoa học', positionScope: 'SELF' as PositionScope, level: 60 },
  // Nhân viên hỗ trợ
  { code: 'TRO_LY', name: 'Trợ lý', description: 'Trợ lý nghiệp vụ', positionScope: 'UNIT' as PositionScope, level: 50 },
  { code: 'NHAN_VIEN', name: 'Nhân viên', description: 'Nhân viên văn phòng', positionScope: 'SELF' as PositionScope, level: 40 },
  // Học viên
  { code: 'HOC_VIEN', name: 'Học viên', description: 'Học viên đang học tập', positionScope: 'SELF' as PositionScope, level: 10 },
  { code: 'SINH_VIEN', name: 'Sinh viên', description: 'Sinh viên dân sự', positionScope: 'SELF' as PositionScope, level: 10 },
  { code: 'GUEST', name: 'Khách', description: 'Tài khoản khách', positionScope: 'SELF' as PositionScope, level: 1 },
];

// ==================================================
// 2. ĐỊNH NGHĨA FUNCTIONS (88+ mã chức năng)
// ==================================================
const FUNCTIONS = [
  // SYSTEM MODULE
  { code: 'SYSTEM.MANAGE_USERS', name: 'Quản lý người dùng', module: 'system', actionType: 'UPDATE' as ActionType, isCritical: true },
  { code: 'SYSTEM.MANAGE_UNITS', name: 'Quản lý đơn vị', module: 'system', actionType: 'UPDATE' as ActionType, isCritical: true },
  { code: 'SYSTEM.MANAGE_RBAC', name: 'Quản lý phân quyền', module: 'system', actionType: 'UPDATE' as ActionType, isCritical: true },
  { code: 'SYSTEM.VIEW_AUDIT_LOG', name: 'Xem nhật ký hệ thống', module: 'system', actionType: 'VIEW' as ActionType, isCritical: true },
  { code: 'SYSTEM.MANAGE_AI_CONFIG', name: 'Cấu hình AI', module: 'system', actionType: 'UPDATE' as ActionType, isCritical: true },
  { code: 'SYSTEM.VIEW_HEALTH', name: 'Xem tình trạng hệ thống', module: 'system', actionType: 'VIEW' as ActionType, isCritical: false },
  
  // DASHBOARD MODULE
  { code: 'DASHBOARD.VIEW', name: 'Xem dashboard cơ bản', module: 'dashboard', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'DASHBOARD.VIEW_COMMAND', name: 'Xem dashboard chỉ huy', module: 'dashboard', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'DASHBOARD.VIEW_ADMIN', name: 'Xem dashboard admin', module: 'dashboard', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'DASHBOARD.VIEW_FACULTY', name: 'Xem dashboard giảng viên', module: 'dashboard', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'DASHBOARD.VIEW_STUDENT', name: 'Xem dashboard học viên', module: 'dashboard', actionType: 'VIEW' as ActionType, isCritical: false },
  
  // PERSONNEL MODULE
  { code: 'PERSONNEL.VIEW', name: 'Xem danh sách cán bộ', module: 'personnel', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'PERSONNEL.VIEW_DETAIL', name: 'Xem chi tiết hồ sơ', module: 'personnel', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'PERSONNEL.VIEW_SENSITIVE', name: 'Xem thông tin nhạy cảm', module: 'personnel', actionType: 'VIEW' as ActionType, isCritical: true },
  { code: 'PERSONNEL.CREATE', name: 'Thêm cán bộ', module: 'personnel', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'PERSONNEL.UPDATE', name: 'Cập nhật cán bộ', module: 'personnel', actionType: 'UPDATE' as ActionType, isCritical: false },
  { code: 'PERSONNEL.DELETE', name: 'Xóa cán bộ', module: 'personnel', actionType: 'DELETE' as ActionType, isCritical: true },
  { code: 'PERSONNEL.APPROVE', name: 'Phê duyệt hồ sơ', module: 'personnel', actionType: 'APPROVE' as ActionType, isCritical: true },
  { code: 'PERSONNEL.EXPORT', name: 'Xuất dữ liệu', module: 'personnel', actionType: 'EXPORT' as ActionType, isCritical: false },
  
  // PARTY MODULE (Đảng viên)
  { code: 'PARTY.VIEW', name: 'Xem đảng viên', module: 'party', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'PARTY.CREATE', name: 'Tạo hồ sơ ĐV', module: 'party', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'PARTY.UPDATE', name: 'Cập nhật ĐV', module: 'party', actionType: 'UPDATE' as ActionType, isCritical: false },
  { code: 'PARTY.APPROVE', name: 'Phê duyệt ĐV', module: 'party', actionType: 'APPROVE' as ActionType, isCritical: true },
  { code: 'PARTY.MANAGE_FEE', name: 'Quản lý đảng phí', module: 'party', actionType: 'UPDATE' as ActionType, isCritical: false },
  { code: 'PARTY.MANAGE_ACTIVITY', name: 'Quản lý sinh hoạt', module: 'party', actionType: 'UPDATE' as ActionType, isCritical: false },
  
  // INSURANCE MODULE
  { code: 'INSURANCE.VIEW', name: 'Xem bảo hiểm', module: 'insurance', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'INSURANCE.CREATE_CLAIM', name: 'Tạo yêu cầu', module: 'insurance', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'INSURANCE.APPROVE_CLAIM', name: 'Phê duyệt yêu cầu', module: 'insurance', actionType: 'APPROVE' as ActionType, isCritical: true },
  { code: 'INSURANCE.EXPORT', name: 'Xuất báo cáo BH', module: 'insurance', actionType: 'EXPORT' as ActionType, isCritical: false },
  
  // POLICY MODULE (Chính sách)
  { code: 'POLICY.VIEW', name: 'Xem chính sách', module: 'policy', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'POLICY.CREATE', name: 'Tạo hồ sơ CS', module: 'policy', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'POLICY.APPROVE', name: 'Phê duyệt CS', module: 'policy', actionType: 'APPROVE' as ActionType, isCritical: true },
  
  // AWARDS MODULE (Khen thưởng)
  { code: 'AWARDS.VIEW', name: 'Xem khen thưởng', module: 'awards', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'AWARDS.CREATE', name: 'Đề xuất KT', module: 'awards', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'AWARDS.APPROVE', name: 'Phê duyệt KT', module: 'awards', actionType: 'APPROVE' as ActionType, isCritical: true },
  
  // FACULTY MODULE (Giảng viên)
  { code: 'FACULTY.VIEW', name: 'Xem giảng viên', module: 'faculty', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'FACULTY.VIEW_DETAIL', name: 'Xem chi tiết GV', module: 'faculty', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'FACULTY.CREATE', name: 'Tạo hồ sơ GV', module: 'faculty', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'FACULTY.UPDATE', name: 'Cập nhật GV', module: 'faculty', actionType: 'UPDATE' as ActionType, isCritical: false },
  { code: 'FACULTY.EXPORT', name: 'Xuất DS giảng viên', module: 'faculty', actionType: 'EXPORT' as ActionType, isCritical: false },
  
  // STUDENT MODULE (Học viên)
  { code: 'STUDENT.VIEW', name: 'Xem học viên', module: 'student', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'STUDENT.VIEW_DETAIL', name: 'Xem chi tiết HV', module: 'student', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'STUDENT.CREATE', name: 'Tạo hồ sơ HV', module: 'student', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'STUDENT.UPDATE', name: 'Cập nhật HV', module: 'student', actionType: 'UPDATE' as ActionType, isCritical: false },
  { code: 'STUDENT.VIEW_GRADE', name: 'Xem điểm', module: 'student', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'STUDENT.SUBMIT_GRADE', name: 'Gửi điểm', module: 'student', actionType: 'SUBMIT' as ActionType, isCritical: false },
  { code: 'STUDENT.APPROVE_GRADE', name: 'Phê duyệt điểm', module: 'student', actionType: 'APPROVE' as ActionType, isCritical: true },
  
  // EDUCATION MODULE (Đào tạo)
  { code: 'EDUCATION.VIEW_PROGRAM', name: 'Xem CTĐT', module: 'education', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'EDUCATION.CREATE_PROGRAM', name: 'Tạo CTĐT', module: 'education', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'EDUCATION.APPROVE_PROGRAM', name: 'Phê duyệt CTĐT', module: 'education', actionType: 'APPROVE' as ActionType, isCritical: true },
  { code: 'EDUCATION.VIEW_TERM', name: 'Xem học kỳ', module: 'education', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'EDUCATION.MANAGE_TERM', name: 'Quản lý học kỳ', module: 'education', actionType: 'UPDATE' as ActionType, isCritical: false },
  { code: 'EDUCATION.VIEW_SCHEDULE', name: 'Xem lịch học', module: 'education', actionType: 'VIEW' as ActionType, isCritical: false },
  
  // RESEARCH MODULE (Nghiên cứu)
  { code: 'RESEARCH.VIEW', name: 'Xem đề tài', module: 'research', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'RESEARCH.CREATE', name: 'Tạo đề tài', module: 'research', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'RESEARCH.UPDATE', name: 'Cập nhật đề tài', module: 'research', actionType: 'UPDATE' as ActionType, isCritical: false },
  { code: 'RESEARCH.DELETE', name: 'Xóa đề tài', module: 'research', actionType: 'DELETE' as ActionType, isCritical: true },
  { code: 'RESEARCH.APPROVE', name: 'Phê duyệt đề tài', module: 'research', actionType: 'APPROVE' as ActionType, isCritical: true },
  
  // DATA MODULE (BigData)
  { code: 'DATA.VIEW', name: 'Xem dữ liệu', module: 'data', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'DATA.UPLOAD', name: 'Upload dữ liệu', module: 'data', actionType: 'CREATE' as ActionType, isCritical: false },
  { code: 'DATA.QUERY', name: 'Truy vấn dữ liệu', module: 'data', actionType: 'VIEW' as ActionType, isCritical: false },
  { code: 'DATA.EXPORT', name: 'Xuất dữ liệu', module: 'data', actionType: 'EXPORT' as ActionType, isCritical: false },
];

// ==================================================
// 3. POSITION-FUNCTION MAPPINGS
// ==================================================
const POSITION_FUNCTION_MAPPINGS: Record<string, { code: string; scope: FunctionScope }[]> = {
  'SYSTEM_ADMIN': [
    // Full quyền system
    { code: 'SYSTEM.MANAGE_USERS', scope: 'ACADEMY' },
    { code: 'SYSTEM.MANAGE_UNITS', scope: 'ACADEMY' },
    { code: 'SYSTEM.MANAGE_RBAC', scope: 'ACADEMY' },
    { code: 'SYSTEM.VIEW_AUDIT_LOG', scope: 'ACADEMY' },
    { code: 'SYSTEM.MANAGE_AI_CONFIG', scope: 'ACADEMY' },
    { code: 'SYSTEM.VIEW_HEALTH', scope: 'ACADEMY' },
    // Full dashboard
    { code: 'DASHBOARD.VIEW', scope: 'ACADEMY' },
    { code: 'DASHBOARD.VIEW_COMMAND', scope: 'ACADEMY' },
    { code: 'DASHBOARD.VIEW_ADMIN', scope: 'ACADEMY' },
    { code: 'DASHBOARD.VIEW_FACULTY', scope: 'ACADEMY' },
    { code: 'DASHBOARD.VIEW_STUDENT', scope: 'ACADEMY' },
    // Full PERSONNEL
    { code: 'PERSONNEL.VIEW', scope: 'ACADEMY' },
    { code: 'PERSONNEL.VIEW_DETAIL', scope: 'ACADEMY' },
    { code: 'PERSONNEL.VIEW_SENSITIVE', scope: 'ACADEMY' },
    { code: 'PERSONNEL.CREATE', scope: 'ACADEMY' },
    { code: 'PERSONNEL.UPDATE', scope: 'ACADEMY' },
    { code: 'PERSONNEL.DELETE', scope: 'ACADEMY' },
    { code: 'PERSONNEL.APPROVE', scope: 'ACADEMY' },
    { code: 'PERSONNEL.EXPORT', scope: 'ACADEMY' },
    // Full modules khác...
    { code: 'PARTY.VIEW', scope: 'ACADEMY' },
    { code: 'INSURANCE.VIEW', scope: 'ACADEMY' },
    { code: 'POLICY.VIEW', scope: 'ACADEMY' },
    { code: 'AWARDS.VIEW', scope: 'ACADEMY' },
    { code: 'FACULTY.VIEW', scope: 'ACADEMY' },
    { code: 'STUDENT.VIEW', scope: 'ACADEMY' },
    { code: 'EDUCATION.VIEW_PROGRAM', scope: 'ACADEMY' },
    { code: 'RESEARCH.VIEW', scope: 'ACADEMY' },
    { code: 'DATA.VIEW', scope: 'ACADEMY' },
    { code: 'DATA.UPLOAD', scope: 'ACADEMY' },
    { code: 'DATA.QUERY', scope: 'ACADEMY' },
    { code: 'DATA.EXPORT', scope: 'ACADEMY' },
  ],
  'CHI_HUY_HOC_VIEN': [
    { code: 'DASHBOARD.VIEW', scope: 'ACADEMY' },
    { code: 'DASHBOARD.VIEW_COMMAND', scope: 'ACADEMY' },
    { code: 'PERSONNEL.VIEW', scope: 'ACADEMY' },
    { code: 'PERSONNEL.APPROVE', scope: 'ACADEMY' },
    { code: 'PARTY.VIEW', scope: 'ACADEMY' },
    { code: 'PARTY.APPROVE', scope: 'ACADEMY' },
    { code: 'INSURANCE.VIEW', scope: 'ACADEMY' },
    { code: 'INSURANCE.APPROVE_CLAIM', scope: 'ACADEMY' },
    { code: 'POLICY.VIEW', scope: 'ACADEMY' },
    { code: 'POLICY.APPROVE', scope: 'ACADEMY' },
    { code: 'AWARDS.VIEW', scope: 'ACADEMY' },
    { code: 'AWARDS.APPROVE', scope: 'ACADEMY' },
    { code: 'STUDENT.VIEW', scope: 'ACADEMY' },
    { code: 'STUDENT.APPROVE_GRADE', scope: 'ACADEMY' },
    { code: 'EDUCATION.VIEW_PROGRAM', scope: 'ACADEMY' },
    { code: 'EDUCATION.APPROVE_PROGRAM', scope: 'ACADEMY' },
    { code: 'RESEARCH.VIEW', scope: 'ACADEMY' },
    { code: 'RESEARCH.APPROVE', scope: 'ACADEMY' },
    { code: 'DATA.VIEW', scope: 'ACADEMY' },
  ],
  'CHI_HUY_KHOA': [
    { code: 'DASHBOARD.VIEW', scope: 'DEPARTMENT' },
    { code: 'DASHBOARD.VIEW_FACULTY', scope: 'DEPARTMENT' },
    { code: 'PERSONNEL.VIEW', scope: 'DEPARTMENT' },
    { code: 'PERSONNEL.VIEW_DETAIL', scope: 'DEPARTMENT' },
    { code: 'PERSONNEL.UPDATE', scope: 'DEPARTMENT' },
    { code: 'FACULTY.VIEW', scope: 'DEPARTMENT' },
    { code: 'FACULTY.VIEW_DETAIL', scope: 'DEPARTMENT' },
    { code: 'FACULTY.UPDATE', scope: 'DEPARTMENT' },
    { code: 'STUDENT.VIEW', scope: 'DEPARTMENT' },
    { code: 'STUDENT.VIEW_DETAIL', scope: 'DEPARTMENT' },
    { code: 'STUDENT.APPROVE_GRADE', scope: 'DEPARTMENT' },
    { code: 'EDUCATION.VIEW_PROGRAM', scope: 'DEPARTMENT' },
    { code: 'EDUCATION.CREATE_PROGRAM', scope: 'DEPARTMENT' },
    { code: 'RESEARCH.VIEW', scope: 'DEPARTMENT' },
    { code: 'RESEARCH.APPROVE', scope: 'DEPARTMENT' },
    { code: 'AWARDS.VIEW', scope: 'DEPARTMENT' },
    { code: 'AWARDS.CREATE', scope: 'DEPARTMENT' },
  ],
  'CHI_HUY_PHONG': [
    { code: 'DASHBOARD.VIEW', scope: 'DEPARTMENT' },
    { code: 'PERSONNEL.VIEW', scope: 'DEPARTMENT' },
    { code: 'PERSONNEL.VIEW_DETAIL', scope: 'DEPARTMENT' },
    { code: 'PARTY.VIEW', scope: 'DEPARTMENT' },
    { code: 'INSURANCE.VIEW', scope: 'DEPARTMENT' },
    { code: 'POLICY.VIEW', scope: 'DEPARTMENT' },
    { code: 'POLICY.CREATE', scope: 'DEPARTMENT' },
  ],
  'CHI_HUY_BO_MON': [
    { code: 'DASHBOARD.VIEW', scope: 'UNIT' },
    { code: 'DASHBOARD.VIEW_FACULTY', scope: 'UNIT' },
    { code: 'FACULTY.VIEW', scope: 'UNIT' },
    { code: 'FACULTY.VIEW_DETAIL', scope: 'UNIT' },
    { code: 'STUDENT.VIEW', scope: 'UNIT' },
    { code: 'STUDENT.VIEW_GRADE', scope: 'UNIT' },
    { code: 'STUDENT.APPROVE_GRADE', scope: 'UNIT' },
    { code: 'EDUCATION.VIEW_PROGRAM', scope: 'UNIT' },
    { code: 'EDUCATION.VIEW_SCHEDULE', scope: 'UNIT' },
    { code: 'RESEARCH.VIEW', scope: 'UNIT' },
    { code: 'RESEARCH.CREATE', scope: 'UNIT' },
  ],
  'CHI_HUY_HE': [
    { code: 'DASHBOARD.VIEW', scope: 'UNIT' },
    { code: 'STUDENT.VIEW', scope: 'UNIT' },
    { code: 'STUDENT.VIEW_DETAIL', scope: 'UNIT' },
    { code: 'STUDENT.VIEW_GRADE', scope: 'UNIT' },
    { code: 'EDUCATION.VIEW_SCHEDULE', scope: 'UNIT' },
  ],
  'CHI_HUY_TIEU_DOAN': [
    { code: 'DASHBOARD.VIEW', scope: 'UNIT' },
    { code: 'PERSONNEL.VIEW', scope: 'UNIT' },
    { code: 'STUDENT.VIEW', scope: 'UNIT' },
  ],
  'CHI_HUY_BAN': [
    { code: 'DASHBOARD.VIEW', scope: 'UNIT' },
    { code: 'PERSONNEL.VIEW', scope: 'UNIT' },
    { code: 'POLICY.VIEW', scope: 'UNIT' },
  ],
  'GIANG_VIEN': [
    { code: 'DASHBOARD.VIEW', scope: 'SELF' },
    { code: 'DASHBOARD.VIEW_FACULTY', scope: 'SELF' },
    { code: 'FACULTY.VIEW', scope: 'SELF' },
    { code: 'STUDENT.VIEW', scope: 'UNIT' },
    { code: 'STUDENT.VIEW_GRADE', scope: 'UNIT' },
    { code: 'STUDENT.SUBMIT_GRADE', scope: 'SELF' },
    { code: 'EDUCATION.VIEW_PROGRAM', scope: 'UNIT' },
    { code: 'EDUCATION.VIEW_SCHEDULE', scope: 'SELF' },
    { code: 'RESEARCH.VIEW', scope: 'SELF' },
    { code: 'RESEARCH.CREATE', scope: 'SELF' },
    { code: 'RESEARCH.UPDATE', scope: 'SELF' },
  ],
  'NGHIEN_CUU_VIEN': [
    { code: 'DASHBOARD.VIEW', scope: 'SELF' },
    { code: 'RESEARCH.VIEW', scope: 'SELF' },
    { code: 'RESEARCH.CREATE', scope: 'SELF' },
    { code: 'RESEARCH.UPDATE', scope: 'SELF' },
    { code: 'DATA.VIEW', scope: 'SELF' },
    { code: 'DATA.QUERY', scope: 'SELF' },
  ],
  'TRO_LY': [
    { code: 'DASHBOARD.VIEW', scope: 'UNIT' },
    { code: 'PERSONNEL.VIEW', scope: 'UNIT' },
    { code: 'POLICY.VIEW', scope: 'UNIT' },
    { code: 'POLICY.CREATE', scope: 'UNIT' },
    { code: 'INSURANCE.VIEW', scope: 'UNIT' },
  ],
  'NHAN_VIEN': [
    { code: 'DASHBOARD.VIEW', scope: 'SELF' },
    { code: 'PERSONNEL.VIEW', scope: 'SELF' },
  ],
  'HOC_VIEN': [
    { code: 'DASHBOARD.VIEW', scope: 'SELF' },
    { code: 'DASHBOARD.VIEW_STUDENT', scope: 'SELF' },
    { code: 'STUDENT.VIEW_GRADE', scope: 'SELF' },
    { code: 'EDUCATION.VIEW_PROGRAM', scope: 'SELF' },
    { code: 'EDUCATION.VIEW_SCHEDULE', scope: 'SELF' },
  ],
  'SINH_VIEN': [
    { code: 'DASHBOARD.VIEW', scope: 'SELF' },
    { code: 'DASHBOARD.VIEW_STUDENT', scope: 'SELF' },
    { code: 'STUDENT.VIEW_GRADE', scope: 'SELF' },
    { code: 'EDUCATION.VIEW_PROGRAM', scope: 'SELF' },
    { code: 'EDUCATION.VIEW_SCHEDULE', scope: 'SELF' },
  ],
  'GUEST': [
    { code: 'DASHBOARD.VIEW', scope: 'SELF' },
  ],
};

// ==================================================
// 4. TÀI KHOẢN DEMO
// ==================================================
const DEMO_USERS = [
  // SYSTEM ADMIN
  {
    email: 'admin@hvhc.edu.vn',
    name: 'Nguyễn Văn Quản',
    role: 'QUAN_TRI_HE_THONG' as UserRole,
    position: 'SYSTEM_ADMIN',
    rank: null,
    title: 'CN',
    unitCode: 'HVHC',
  },
  // CHỈ HUY HỌC VIỆN
  {
    email: 'giamdoc@hvhc.edu.vn',
    name: 'Đại tá Phan Tùng Sơn',
    role: 'CHI_HUY_HOC_VIEN' as UserRole,
    position: 'CHI_HUY_HOC_VIEN',
    rank: 'Đại tá',
    title: 'PGS.TS',
    unitCode: 'HVHC',
  },
  // CHỈ HUY KHOA
  {
    email: 'truongkhoa.cntt@hvhc.edu.vn',
    name: 'Thượng tá Trần Đức Minh',
    role: 'CHI_HUY_KHOA_PHONG' as UserRole,
    position: 'CHI_HUY_KHOA',
    rank: 'Thượng tá',
    title: 'TS',
    unitCode: 'KCNTT',
  },
  // CHỈ HUY PHÒNG
  {
    email: 'truongphong.tchc@hvhc.edu.vn',
    name: 'Thượng tá Lê Văn Hòa',
    role: 'CHI_HUY_KHOA_PHONG' as UserRole,
    position: 'CHI_HUY_PHONG',
    rank: 'Thượng tá',
    title: 'ThS',
    unitCode: 'PTCHC',
  },
  // CHỈ HUY BỘ MÔN
  {
    email: 'cnbm.httt@hvhc.edu.vn',
    name: 'Trung tá Lưu Đức Nhật',
    role: 'CHU_NHIEM_BO_MON' as UserRole,
    position: 'CHI_HUY_BO_MON',
    rank: 'Trung tá',
    title: 'TS',
    unitCode: 'BMHTTT',
  },
  // CHỈ HUY HỆ
  {
    email: 'chihuyhehe1@hvhc.edu.vn',
    name: 'Thiếu tá Nguyễn Văn Dũng',
    role: 'GIANG_VIEN' as UserRole,
    position: 'CHI_HUY_HE',
    rank: 'Thiếu tá',
    title: 'ThS',
    unitCode: 'HE1',
  },
  // CHỈ HUY TIỂU ĐOÀN
  {
    email: 'chihuytd1@hvhc.edu.vn',
    name: 'Thiếu tá Phạm Văn Tuấn',
    role: 'GIANG_VIEN' as UserRole,
    position: 'CHI_HUY_TIEU_DOAN',
    rank: 'Thiếu tá',
    title: 'ThS',
    unitCode: 'TD1',
  },
  // GIẢNG VIÊN
  {
    email: 'giangvien01@hvhc.edu.vn',
    name: 'PGS.TS Vũ Văn Bân',
    role: 'GIANG_VIEN' as UserRole,
    position: 'GIANG_VIEN',
    rank: 'Đại úy',
    title: 'PGS.TS',
    unitCode: 'KCNTT',
  },
  // NGHIÊN CỨU VIÊN
  {
    email: 'nckh01@hvhc.edu.vn',
    name: 'GS.TS Vũ Đức Thành',
    role: 'GIANG_VIEN' as UserRole,
    position: 'NGHIEN_CUU_VIEN',
    rank: 'Đại tá',
    title: 'GS.TS',
    unitCode: 'KCNTT',
  },
  // TRỢ LÝ
  {
    email: 'troly.tchc@hvhc.edu.vn',
    name: 'Đại úy Nguyễn Minh Tuấn',
    role: 'GIANG_VIEN' as UserRole,
    position: 'TRO_LY',
    rank: 'Đại úy',
    title: 'CN',
    unitCode: 'PTCHC',
  },
  // NHÂN VIÊN
  {
    email: 'nhanvien01@hvhc.edu.vn',
    name: 'Trung úy Lê Thị Hạnh',
    role: 'GIANG_VIEN' as UserRole,
    position: 'NHAN_VIEN',
    rank: 'Trung úy',
    title: 'Cử nhân',
    unitCode: 'PTCHC',
  },
  // HỌC VIÊN
  {
    email: 'hocvien01@hvhc.edu.vn',
    name: 'Trung úy Hoàng Văn An',
    role: 'HOC_VIEN_SINH_VIEN' as UserRole,
    position: 'HOC_VIEN',
    rank: 'Trung úy',
    title: null,
    unitCode: 'HE1',
  },
  // SINH VIÊN DÂN SỰ
  {
    email: 'sinhvien01@hvhc.edu.vn',
    name: 'Nguyễn Thị Lan',
    role: 'HOC_VIEN_SINH_VIEN' as UserRole,
    position: 'SINH_VIEN',
    rank: null,
    title: null,
    unitCode: 'KCNTT',
  },
];

// ==================================================
// 5. ĐƠN VỊ MẪU
// ==================================================
const DEMO_UNITS = [
  { code: 'HVHC', name: 'Học viện Hậu cần', shortName: 'HVHC', level: 1, type: 'ACADEMY' },
  // Khoa
  { code: 'KCNTT', name: 'Khoa CNTT', shortName: 'CNTT', level: 2, type: 'DEPARTMENT', parentCode: 'HVHC' },
  { code: 'KHCQS', name: 'Khoa Hậu cần Quân sự', shortName: 'HCQS', level: 2, type: 'DEPARTMENT', parentCode: 'HVHC' },
  { code: 'KVTHC', name: 'Khoa Vận tải - Hóa chất', shortName: 'VT-HC', level: 2, type: 'DEPARTMENT', parentCode: 'HVHC' },
  { code: 'KTCQS', name: 'Khoa Tài chính Quân sự', shortName: 'TCQS', level: 2, type: 'DEPARTMENT', parentCode: 'HVHC' },
  { code: 'KKTXD', name: 'Khoa Kỹ thuật Xây dựng', shortName: 'KTXD', level: 2, type: 'DEPARTMENT', parentCode: 'HVHC' },
  // Phòng
  { code: 'PTCHC', name: 'Phòng Tổ chức Cán bộ', shortName: 'TCHC', level: 2, type: 'DEPARTMENT', parentCode: 'HVHC' },
  { code: 'PDT', name: 'Phòng Đào tạo', shortName: 'ĐT', level: 2, type: 'DEPARTMENT', parentCode: 'HVHC' },
  { code: 'PQLKH', name: 'Phòng Quản lý Khoa học', shortName: 'QLKH', level: 2, type: 'DEPARTMENT', parentCode: 'HVHC' },
  { code: 'PCTCT', name: 'Phòng Công tác Chính trị', shortName: 'CTCT', level: 2, type: 'DEPARTMENT', parentCode: 'HVHC' },
  // Bộ môn
  { code: 'BMHTTT', name: 'Bộ môn Hệ thống thông tin', shortName: 'HTTT', level: 3, type: 'UNIT', parentCode: 'KCNTT' },
  { code: 'BMKHMT', name: 'Bộ môn Khoa học Máy tính', shortName: 'KHMT', level: 3, type: 'UNIT', parentCode: 'KCNTT' },
  { code: 'BMMMT', name: 'Bộ môn Mạng Máy tính', shortName: 'MMT', level: 3, type: 'UNIT', parentCode: 'KCNTT' },
  // Hệ
  { code: 'HE1', name: 'Hệ 1 - Quân sự', shortName: 'Hệ1', level: 3, type: 'UNIT', parentCode: 'HVHC' },
  { code: 'HE2', name: 'Hệ 2 - Hậu cần', shortName: 'Hệ2', level: 3, type: 'UNIT', parentCode: 'HVHC' },
  // Tiểu đoàn
  { code: 'TD1', name: 'Tiểu đoàn 1', shortName: 'TĐ1', level: 3, type: 'UNIT', parentCode: 'HE1' },
  { code: 'TD2', name: 'Tiểu đoàn 2', shortName: 'TĐ2', level: 3, type: 'UNIT', parentCode: 'HE1' },
];

// ==================================================
// MAIN SEED FUNCTION
// ==================================================
async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu demo v8.2...');
  
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  
  // 1. Tạo đơn vị
  console.log('\n🏢 Tạo đơn vị...');
  for (const unit of DEMO_UNITS) {
    const parentId = unit.parentCode 
      ? (await prisma.unit.findFirst({ where: { code: unit.parentCode } }))?.id 
      : null;
    
    await prisma.unit.upsert({
      where: { code: unit.code },
      update: { name: unit.name, level: unit.level, parentId },
      create: { 
        code: unit.code, 
        name: unit.name, 
        type: unit.type, 
        level: unit.level, 
        parentId,
      },
    });
  }
  console.log(`✅ Tạo ${DEMO_UNITS.length} đơn vị`);

  // 2. Tạo Positions
  console.log('\n💼 Tạo chức vụ...');
  for (const pos of POSITIONS) {
    await prisma.position.upsert({
      where: { code: pos.code },
      update: pos,
      create: pos,
    });
  }
  console.log(`✅ Tạo ${POSITIONS.length} chức vụ`);

  // 3. Tạo Functions
  console.log('\n⚙️ Tạo chức năng...');
  for (const func of FUNCTIONS) {
    await prisma.function.upsert({
      where: { code: func.code },
      update: func,
      create: func,
    });
  }
  console.log(`✅ Tạo ${FUNCTIONS.length} chức năng`);

  // 4. Tạo PositionFunction mappings
  console.log('\n🔗 Gán quyền cho chức vụ...');
  let mappingCount = 0;
  for (const [positionCode, functions] of Object.entries(POSITION_FUNCTION_MAPPINGS)) {
    const position = await prisma.position.findUnique({ where: { code: positionCode } });
    if (!position) continue;
    
    for (const func of functions) {
      const functionRecord = await prisma.function.findUnique({ where: { code: func.code } });
      if (!functionRecord) continue;
      
      await prisma.positionFunction.upsert({
        where: {
          positionId_functionId: {
            positionId: position.id,
            functionId: functionRecord.id,
          },
        },
        update: { scope: func.scope },
        create: {
          positionId: position.id,
          functionId: functionRecord.id,
          scope: func.scope,
        },
      });
      mappingCount++;
    }
  }
  console.log(`✅ Gán ${mappingCount} quyền`);

  // 5. Tạo Users và gán UserPosition
  console.log('\n👤 Tạo tài khoản demo...');
  for (const userData of DEMO_USERS) {
    const unit = await prisma.unit.findFirst({ where: { code: userData.unitCode } });
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        role: userData.role,
        status: 'ACTIVE',
        unitId: unit?.id,
        rank: userData.rank,
        position: userData.title,
      },
      create: {
        email: userData.email,
        name: userData.name,
        password: passwordHash,
        role: userData.role,
        status: 'ACTIVE',
        unitId: unit?.id,
        rank: userData.rank,
        position: userData.title,
      },
    });

    // Gán Position
    const position = await prisma.position.findUnique({ where: { code: userData.position } });
    if (position) {
      const existingUp = await prisma.userPosition.findFirst({
        where: { userId: user.id, positionId: position.id },
      });
      if (!existingUp) {
        await prisma.userPosition.create({
          data: {
            userId: user.id,
            positionId: position.id,
            isPrimary: true,
            unitId: unit?.id,
          },
        });
      }
    }
    
    console.log(`  ✅ ${userData.name} (${userData.email}) - ${userData.position}`);
  }

  // 6. Tạo test user (required by system)
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: { password: passwordHash },
    create: {
      email: 'john@doe.com',
      name: 'Test User',
      password: passwordHash,
      role: 'QUAN_TRI_HE_THONG',
      status: 'ACTIVE',
    },
  });

  console.log('\n✅ Hoàn thành seed dữ liệu demo!');
  console.log('\n📝 Tài khoản demo:');
  console.log('   Mật khẩu chung: Hv@2025');
  console.log('   admin@hvhc.edu.vn - Quản trị hệ thống');
  console.log('   giamdoc@hvhc.edu.vn - Giám đốc Học viện');
  console.log('   truongkhoa.cntt@hvhc.edu.vn - Trưởng Khoa CNTT');
  console.log('   giangvien01@hvhc.edu.vn - Giảng viên');
  console.log('   hocvien01@hvhc.edu.vn - Học viên');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
