/**
 * seed_all_rbac.ts - Seed toàn bộ RBAC
 * 1. Upsert tất cả Function codes từ function-codes.ts
 * 2. Cấp toàn quyền cho SYSTEM_ADMIN (ACADEMY scope)
 * 3. Tạo các chức vụ TRUONG_PHONG với quyền theo module (UNIT scope)
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_all_rbac.ts
 */

import { PrismaClient, FunctionScope } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// ───────────────────────────────────────────────────
// Bảng tra cứu: code → { name, description, module, actionType, isCritical }
// ───────────────────────────────────────────────────
interface FDef {
  name: string;
  description?: string;
  module: string;
  actionType: string;
  isCritical?: boolean;
}

const FUNCTION_DEFS: Record<string, FDef> = {
  // ── PERSONNEL ──
  'VIEW_PERSONNEL':           { name: 'Xem danh sách cán bộ',            module: 'PERSONNEL', actionType: 'VIEW' },
  'VIEW_PERSONNEL_DETAIL':    { name: 'Xem chi tiết hồ sơ cán bộ',       module: 'PERSONNEL', actionType: 'VIEW' },
  'VIEW_PERSONNEL_SENSITIVE': { name: 'Xem thông tin nhạy cảm cán bộ',   module: 'PERSONNEL', actionType: 'VIEW',   isCritical: true },
  'CREATE_PERSONNEL':         { name: 'Thêm cán bộ mới',                 module: 'PERSONNEL', actionType: 'CREATE', isCritical: true },
  'UPDATE_PERSONNEL':         { name: 'Cập nhật thông tin cán bộ',        module: 'PERSONNEL', actionType: 'UPDATE' },
  'DELETE_PERSONNEL':         { name: 'Xóa hồ sơ cán bộ',               module: 'PERSONNEL', actionType: 'DELETE', isCritical: true },
  'APPROVE_PERSONNEL':        { name: 'Phê duyệt hồ sơ cán bộ',          module: 'PERSONNEL', actionType: 'APPROVE', isCritical: true },
  'EXPORT_PERSONNEL':         { name: 'Xuất danh sách cán bộ',           module: 'PERSONNEL', actionType: 'EXPORT' },
  'IMPORT_PERSONNEL':         { name: 'Nhập dữ liệu cán bộ',             module: 'PERSONNEL', actionType: 'IMPORT', isCritical: true },
  'SUBMIT_PERSONNEL':         { name: 'Gửi hồ sơ cán bộ lên duyệt',     module: 'PERSONNEL', actionType: 'SUBMIT' },
  'VIEW_CAREER_HISTORY':      { name: 'Xem quá trình công tác',           module: 'PERSONNEL', actionType: 'VIEW' },
  'UPDATE_CAREER_HISTORY':    { name: 'Cập nhật quá trình công tác',      module: 'PERSONNEL', actionType: 'UPDATE' },
  'VIEW_EDUCATION_HISTORY':   { name: 'Xem lịch sử học vấn',             module: 'PERSONNEL', actionType: 'VIEW' },
  'UPDATE_EDUCATION_HISTORY': { name: 'Cập nhật lịch sử học vấn',        module: 'PERSONNEL', actionType: 'UPDATE' },
  'VIEW_FAMILY_RELATIONS':    { name: 'Xem thông tin thân nhân',          module: 'PERSONNEL', actionType: 'VIEW',   isCritical: true },
  'UPDATE_FAMILY_RELATIONS':  { name: 'Cập nhật thông tin thân nhân',     module: 'PERSONNEL', actionType: 'UPDATE', isCritical: true },
  'VIEW_SOLDIER_PROFILE':     { name: 'Xem hồ sơ quân nhân',             module: 'PERSONNEL', actionType: 'VIEW' },
  'UPDATE_SOLDIER_PROFILE':   { name: 'Cập nhật hồ sơ quân nhân',        module: 'PERSONNEL', actionType: 'UPDATE', isCritical: true },

  // ── TRAINING ──
  'VIEW_TRAINING':            { name: 'Xem thông tin đào tạo',           module: 'TRAINING', actionType: 'VIEW' },
  'VIEW_COURSE':              { name: 'Xem môn học / khóa học',           module: 'TRAINING', actionType: 'VIEW' },
  'CREATE_COURSE':            { name: 'Tạo môn học / khóa học',           module: 'TRAINING', actionType: 'CREATE' },
  'UPDATE_COURSE':            { name: 'Cập nhật môn học / khóa học',      module: 'TRAINING', actionType: 'UPDATE' },
  'DELETE_COURSE':            { name: 'Xóa môn học / khóa học',           module: 'TRAINING', actionType: 'DELETE' },
  'VIEW_GRADE':               { name: 'Xem điểm học viên',               module: 'TRAINING', actionType: 'VIEW' },
  'CREATE_GRADE_DRAFT':       { name: 'Nhập điểm nháp',                  module: 'TRAINING', actionType: 'CREATE' },
  'SUBMIT_GRADE':             { name: 'Gửi điểm lên duyệt',              module: 'TRAINING', actionType: 'SUBMIT' },
  'APPROVE_GRADE':            { name: 'Phê duyệt điểm',                  module: 'TRAINING', actionType: 'APPROVE', isCritical: true },
  'REJECT_GRADE':             { name: 'Từ chối điểm',                    module: 'TRAINING', actionType: 'REJECT' },
  'REGISTER_COURSE':          { name: 'Đăng ký môn học',                 module: 'TRAINING', actionType: 'CREATE' },
  'EXPORT_GRADE':             { name: 'Xuất bảng điểm',                  module: 'TRAINING', actionType: 'EXPORT' },

  // ── EDUCATION ──
  'VIEW_PROGRAM':             { name: 'Xem chương trình đào tạo',        module: 'EDUCATION', actionType: 'VIEW' },
  'CREATE_PROGRAM':           { name: 'Tạo chương trình đào tạo',        module: 'EDUCATION', actionType: 'CREATE' },
  'UPDATE_PROGRAM':           { name: 'Cập nhật chương trình đào tạo',   module: 'EDUCATION', actionType: 'UPDATE' },
  'DELETE_PROGRAM':           { name: 'Xóa chương trình đào tạo',        module: 'EDUCATION', actionType: 'DELETE' },
  'APPROVE_PROGRAM':          { name: 'Phê duyệt chương trình đào tạo',  module: 'EDUCATION', actionType: 'APPROVE', isCritical: true },
  'VIEW_CURRICULUM':          { name: 'Xem khung chương trình',          module: 'EDUCATION', actionType: 'VIEW' },
  'CREATE_CURRICULUM':        { name: 'Tạo khung chương trình',          module: 'EDUCATION', actionType: 'CREATE' },
  'UPDATE_CURRICULUM':        { name: 'Cập nhật khung chương trình',     module: 'EDUCATION', actionType: 'UPDATE' },
  'DELETE_CURRICULUM':        { name: 'Xóa khung chương trình',          module: 'EDUCATION', actionType: 'DELETE' },
  'VIEW_TERM':                { name: 'Xem năm học / học kỳ',            module: 'EDUCATION', actionType: 'VIEW' },
  'MANAGE_TERM':              { name: 'Quản lý năm học / học kỳ',        module: 'EDUCATION', actionType: 'UPDATE' },
  'VIEW_CLASS_SECTION':       { name: 'Xem lớp học phần',               module: 'EDUCATION', actionType: 'VIEW' },
  'CREATE_CLASS_SECTION':     { name: 'Mở lớp học phần',                module: 'EDUCATION', actionType: 'CREATE' },
  'UPDATE_CLASS_SECTION':     { name: 'Cập nhật lớp học phần',          module: 'EDUCATION', actionType: 'UPDATE' },
  'DELETE_CLASS_SECTION':     { name: 'Xóa lớp học phần',               module: 'EDUCATION', actionType: 'DELETE' },
  'VIEW_SCHEDULE':            { name: 'Xem thời khóa biểu',             module: 'EDUCATION', actionType: 'VIEW' },
  'CREATE_SCHEDULE':          { name: 'Tạo thời khóa biểu',             module: 'EDUCATION', actionType: 'CREATE' },
  'UPDATE_SCHEDULE':          { name: 'Cập nhật thời khóa biểu',        module: 'EDUCATION', actionType: 'UPDATE' },
  'DELETE_SCHEDULE':          { name: 'Xóa lịch học',                   module: 'EDUCATION', actionType: 'DELETE' },
  'VIEW_ATTENDANCE':          { name: 'Xem điểm danh',                  module: 'EDUCATION', actionType: 'VIEW' },
  'MANAGE_ATTENDANCE':        { name: 'Quản lý điểm danh',              module: 'EDUCATION', actionType: 'UPDATE' },
  'VIEW_ENROLLMENT':          { name: 'Xem ghi danh',                   module: 'EDUCATION', actionType: 'VIEW' },
  'MANAGE_ENROLLMENT':        { name: 'Quản lý ghi danh',               module: 'EDUCATION', actionType: 'UPDATE' },
  'VIEW_CONDUCT':             { name: 'Xem điểm rèn luyện',             module: 'EDUCATION', actionType: 'VIEW' },
  'MANAGE_CONDUCT':           { name: 'Quản lý điểm rèn luyện',         module: 'EDUCATION', actionType: 'UPDATE' },
  'MANAGE_GRADE':             { name: 'Nhập / sửa điểm học phần',       module: 'EDUCATION', actionType: 'UPDATE', isCritical: true },
  'VIEW_WARNING':             { name: 'Xem cảnh báo học vụ',            module: 'EDUCATION', actionType: 'VIEW' },
  'MANAGE_WARNING':           { name: 'Quản lý cảnh báo học vụ',        module: 'EDUCATION', actionType: 'UPDATE' },
  'VIEW_THESIS':              { name: 'Xem khóa luận / luận văn',       module: 'EDUCATION', actionType: 'VIEW' },
  'MANAGE_THESIS':            { name: 'Quản lý khóa luận / luận văn',   module: 'EDUCATION', actionType: 'UPDATE' },
  'VIEW_GRADUATION':          { name: 'Xem kết quả xét tốt nghiệp',     module: 'EDUCATION', actionType: 'VIEW' },
  'RUN_GRADUATION':           { name: 'Chạy engine xét tốt nghiệp',     module: 'EDUCATION', actionType: 'UPDATE', isCritical: true },
  'APPROVE_GRADUATION':       { name: 'Phê duyệt tốt nghiệp',           module: 'EDUCATION', actionType: 'APPROVE', isCritical: true },
  'EXPORT_GRADUATION':        { name: 'Xuất danh sách / văn bằng',      module: 'EDUCATION', actionType: 'EXPORT' },
  'VIEW_REPOSITORY':          { name: 'Tra cứu kho học vụ',             module: 'EDUCATION', actionType: 'VIEW' },
  'VIEW_TRAINING_SYSTEM':     { name: 'Xem hệ đào tạo',                 module: 'EDUCATION', actionType: 'VIEW' },
  'MANAGE_TRAINING_SYSTEM':   { name: 'Quản lý hệ đào tạo',             module: 'EDUCATION', actionType: 'UPDATE', isCritical: true },
  'VIEW_BATTALION':           { name: 'Xem tiểu đoàn',                  module: 'EDUCATION', actionType: 'VIEW' },
  'MANAGE_BATTALION':         { name: 'Quản lý tiểu đoàn',              module: 'EDUCATION', actionType: 'UPDATE', isCritical: true },

  // ── EXAM ──
  'VIEW_EXAM_PLAN':           { name: 'Xem kế hoạch thi',               module: 'EXAM', actionType: 'VIEW' },
  'CREATE_EXAM_PLAN':         { name: 'Tạo kế hoạch thi',               module: 'EXAM', actionType: 'CREATE' },
  'UPDATE_EXAM_PLAN':         { name: 'Cập nhật kế hoạch thi',          module: 'EXAM', actionType: 'UPDATE' },
  'DELETE_EXAM_PLAN':         { name: 'Xóa kế hoạch thi',               module: 'EXAM', actionType: 'DELETE' },
  'APPROVE_EXAM_PLAN':        { name: 'Phê duyệt kế hoạch thi',         module: 'EXAM', actionType: 'APPROVE', isCritical: true },
  'PUBLISH_EXAM_PLAN':        { name: 'Công bố kế hoạch thi',           module: 'EXAM', actionType: 'UPDATE' },
  'VIEW_EXAM_SESSION':        { name: 'Xem ca thi',                     module: 'EXAM', actionType: 'VIEW' },
  'CREATE_EXAM_SESSION':      { name: 'Tạo ca thi',                     module: 'EXAM', actionType: 'CREATE' },
  'UPDATE_EXAM_SESSION':      { name: 'Cập nhật ca thi',                module: 'EXAM', actionType: 'UPDATE' },
  'DELETE_EXAM_SESSION':      { name: 'Xóa ca thi',                     module: 'EXAM', actionType: 'DELETE' },
  'SUPERVISE_EXAM':           { name: 'Thực hiện coi thi',              module: 'EXAM', actionType: 'UPDATE' },
  'VIEW_EXAM_REG':            { name: 'Xem đăng ký thi',                module: 'EXAM', actionType: 'VIEW' },
  'MANAGE_EXAM_REG':          { name: 'Quản lý đăng ký thi',            module: 'EXAM', actionType: 'UPDATE' },
  'REGISTER_EXAM':            { name: 'Đăng ký thi',                    module: 'EXAM', actionType: 'CREATE' },

  // ── QUESTION_BANK ──
  'VIEW_QUESTION_BANK':       { name: 'Xem ngân hàng câu hỏi',          module: 'QUESTION_BANK', actionType: 'VIEW' },
  'CREATE_QUESTION_BANK':     { name: 'Tạo ngân hàng câu hỏi',          module: 'QUESTION_BANK', actionType: 'CREATE' },
  'UPDATE_QUESTION_BANK':     { name: 'Cập nhật ngân hàng câu hỏi',     module: 'QUESTION_BANK', actionType: 'UPDATE' },
  'DELETE_QUESTION_BANK':     { name: 'Xóa ngân hàng câu hỏi',          module: 'QUESTION_BANK', actionType: 'DELETE' },
  'VIEW_QUESTION':            { name: 'Xem câu hỏi',                    module: 'QUESTION_BANK', actionType: 'VIEW' },
  'CREATE_QUESTION':          { name: 'Tạo câu hỏi',                    module: 'QUESTION_BANK', actionType: 'CREATE' },
  'UPDATE_QUESTION':          { name: 'Cập nhật câu hỏi',               module: 'QUESTION_BANK', actionType: 'UPDATE' },
  'DELETE_QUESTION':          { name: 'Xóa câu hỏi',                    module: 'QUESTION_BANK', actionType: 'DELETE' },
  'REVIEW_QUESTION':          { name: 'Duyệt câu hỏi',                  module: 'QUESTION_BANK', actionType: 'APPROVE' },
  'IMPORT_QUESTION':          { name: 'Nhập câu hỏi',                   module: 'QUESTION_BANK', actionType: 'IMPORT' },
  'EXPORT_QUESTION':          { name: 'Xuất câu hỏi',                   module: 'QUESTION_BANK', actionType: 'EXPORT' },

  // ── LEARNING_MATERIAL ──
  'VIEW_LEARNING_MATERIAL':   { name: 'Xem học liệu',                   module: 'LEARNING_MATERIAL', actionType: 'VIEW' },
  'CREATE_LEARNING_MATERIAL': { name: 'Tạo học liệu',                   module: 'LEARNING_MATERIAL', actionType: 'CREATE' },
  'UPDATE_LEARNING_MATERIAL': { name: 'Cập nhật học liệu',              module: 'LEARNING_MATERIAL', actionType: 'UPDATE' },
  'DELETE_LEARNING_MATERIAL': { name: 'Xóa học liệu',                   module: 'LEARNING_MATERIAL', actionType: 'DELETE' },
  'DOWNLOAD_LEARNING_MATERIAL': { name: 'Tải học liệu',                 module: 'LEARNING_MATERIAL', actionType: 'VIEW' },
  'UPLOAD_LEARNING_MATERIAL': { name: 'Upload học liệu',                module: 'LEARNING_MATERIAL', actionType: 'CREATE' },
  'APPROVE_LEARNING_MATERIAL': { name: 'Phê duyệt học liệu',            module: 'LEARNING_MATERIAL', actionType: 'APPROVE' },

  // ── LAB ──
  'VIEW_LAB':                 { name: 'Xem phòng thí nghiệm',           module: 'LAB', actionType: 'VIEW' },
  'CREATE_LAB':               { name: 'Tạo phòng thí nghiệm',           module: 'LAB', actionType: 'CREATE' },
  'UPDATE_LAB':               { name: 'Cập nhật phòng thí nghiệm',      module: 'LAB', actionType: 'UPDATE' },
  'DELETE_LAB':               { name: 'Xóa phòng thí nghiệm',           module: 'LAB', actionType: 'DELETE' },
  'VIEW_LAB_EQUIPMENT':       { name: 'Xem thiết bị PTN',               module: 'LAB', actionType: 'VIEW' },
  'CREATE_LAB_EQUIPMENT':     { name: 'Thêm thiết bị PTN',              module: 'LAB', actionType: 'CREATE' },
  'UPDATE_LAB_EQUIPMENT':     { name: 'Cập nhật thiết bị PTN',          module: 'LAB', actionType: 'UPDATE' },
  'DELETE_LAB_EQUIPMENT':     { name: 'Xóa thiết bị PTN',               module: 'LAB', actionType: 'DELETE' },
  'MANAGE_LAB_MAINTENANCE':   { name: 'Quản lý bảo trì PTN',            module: 'LAB', actionType: 'UPDATE' },
  'VIEW_LAB_SESSION':         { name: 'Xem buổi thực hành',             module: 'LAB', actionType: 'VIEW' },
  'CREATE_LAB_SESSION':       { name: 'Tạo buổi thực hành',             module: 'LAB', actionType: 'CREATE' },
  'UPDATE_LAB_SESSION':       { name: 'Cập nhật buổi thực hành',        module: 'LAB', actionType: 'UPDATE' },
  'DELETE_LAB_SESSION':       { name: 'Xóa buổi thực hành',             module: 'LAB', actionType: 'DELETE' },

  // ── RESEARCH ──
  'VIEW_RESEARCH':            { name: 'Xem đề tài nghiên cứu',          module: 'RESEARCH', actionType: 'VIEW' },
  'CREATE_RESEARCH':          { name: 'Đăng ký đề tài nghiên cứu',      module: 'RESEARCH', actionType: 'CREATE' },
  'UPDATE_RESEARCH':          { name: 'Cập nhật đề tài nghiên cứu',     module: 'RESEARCH', actionType: 'UPDATE' },
  'DELETE_RESEARCH':          { name: 'Xóa đề tài nghiên cứu',          module: 'RESEARCH', actionType: 'DELETE' },
  'SUBMIT_RESEARCH':          { name: 'Nộp đề tài nghiên cứu',          module: 'RESEARCH', actionType: 'SUBMIT' },
  'REVIEW_RESEARCH':          { name: 'Xét duyệt đề tài nghiên cứu',    module: 'RESEARCH', actionType: 'APPROVE' },
  'APPROVE_RESEARCH':         { name: 'Phê duyệt đề tài nghiên cứu',    module: 'RESEARCH', actionType: 'APPROVE', isCritical: true },
  'REJECT_RESEARCH':          { name: 'Từ chối đề tài nghiên cứu',      module: 'RESEARCH', actionType: 'REJECT' },
  'EVALUATE_RESEARCH':        { name: 'Đánh giá kết quả nghiên cứu',    module: 'RESEARCH', actionType: 'UPDATE' },
  'VIEW_PUBLICATION':         { name: 'Xem công trình khoa học',         module: 'RESEARCH', actionType: 'VIEW' },
  'CREATE_PUBLICATION':       { name: 'Thêm công trình khoa học',        module: 'RESEARCH', actionType: 'CREATE' },
  'UPDATE_PUBLICATION':       { name: 'Cập nhật công trình khoa học',    module: 'RESEARCH', actionType: 'UPDATE' },
  'DELETE_PUBLICATION':       { name: 'Xóa công trình khoa học',         module: 'RESEARCH', actionType: 'DELETE' },
  'VIEW_RESEARCH_PUB':        { name: 'Xem danh sách công bố KH',       module: 'RESEARCH', actionType: 'VIEW' },
  'CREATE_RESEARCH_PUB':      { name: 'Thêm công bố khoa học',          module: 'RESEARCH', actionType: 'CREATE' },
  'UPDATE_RESEARCH_PUB':      { name: 'Cập nhật công bố khoa học',      module: 'RESEARCH', actionType: 'UPDATE' },
  'DELETE_RESEARCH_PUB':      { name: 'Xóa công bố khoa học',           module: 'RESEARCH', actionType: 'DELETE' },
  'IMPORT_RESEARCH_PUB':      { name: 'Import danh mục công bố (BibTeX)', module: 'RESEARCH', actionType: 'IMPORT' },
  'EXPORT_RESEARCH_PUB':      { name: 'Xuất danh mục công bố',          module: 'RESEARCH', actionType: 'EXPORT' },
  'VIEW_RESEARCH_SCIENTIST':  { name: 'Xem hồ sơ nhà khoa học (NCKH)',  module: 'RESEARCH', actionType: 'VIEW' },
  'UPDATE_RESEARCH_SCIENTIST':{ name: 'Cập nhật hồ sơ nhà khoa học',    module: 'RESEARCH', actionType: 'UPDATE' },
  'EXPORT_RESEARCH_SCIENTIST':{ name: 'Xuất hồ sơ nhà khoa học',        module: 'RESEARCH', actionType: 'EXPORT' },

  // ── PARTY ──
  'VIEW_PARTY':               { name: 'Xem thông tin Đảng viên',        module: 'PARTY', actionType: 'VIEW' },
  'CREATE_PARTY':             { name: 'Kết nạp Đảng viên mới',          module: 'PARTY', actionType: 'CREATE', isCritical: true },
  'UPDATE_PARTY':             { name: 'Cập nhật hồ sơ Đảng viên',       module: 'PARTY', actionType: 'UPDATE' },
  'DELETE_PARTY':             { name: 'Xóa hồ sơ Đảng viên',            module: 'PARTY', actionType: 'DELETE', isCritical: true },
  'APPROVE_PARTY':            { name: 'Phê duyệt kết nạp Đảng',         module: 'PARTY', actionType: 'APPROVE', isCritical: true },
  'VIEW_PARTY_MEMBER':        { name: 'Xem hồ sơ đảng viên',            module: 'PARTY', actionType: 'VIEW' },
  'CREATE_PARTY_MEMBER':      { name: 'Tạo hồ sơ đảng viên',            module: 'PARTY', actionType: 'CREATE', isCritical: true },
  'UPDATE_PARTY_MEMBER':      { name: 'Cập nhật hồ sơ đảng viên',       module: 'PARTY', actionType: 'UPDATE' },
  'DELETE_PARTY_MEMBER':      { name: 'Xóa hồ sơ đảng viên',            module: 'PARTY', actionType: 'DELETE', isCritical: true },
  'VIEW_PARTY_MEMBER_SENSITIVE':  { name: 'Xem thông tin nhạy cảm đảng viên', module: 'PARTY', actionType: 'VIEW', isCritical: true },
  'UPDATE_PARTY_MEMBER_SENSITIVE':{ name: 'Cập nhật thông tin nhạy cảm đảng viên', module: 'PARTY', actionType: 'UPDATE', isCritical: true },
  'VIEW_PARTY_ORG':           { name: 'Xem cơ cấu tổ chức Đảng',        module: 'PARTY', actionType: 'VIEW' },
  'CREATE_PARTY_ORG':         { name: 'Tạo tổ chức Đảng',               module: 'PARTY', actionType: 'CREATE', isCritical: true },
  'UPDATE_PARTY_ORG':         { name: 'Cập nhật tổ chức Đảng',          module: 'PARTY', actionType: 'UPDATE' },
  'VIEW_PARTY_MEETING':       { name: 'Xem cuộc họp Đảng',              module: 'PARTY', actionType: 'VIEW' },
  'MANAGE_PARTY_MEETING':     { name: 'Quản lý sinh hoạt Đảng',         module: 'PARTY', actionType: 'UPDATE' },
  'VIEW_PARTY_ACTIVITY':      { name: 'Xem hoạt động chi bộ',           module: 'PARTY', actionType: 'VIEW' },
  'MANAGE_PARTY_ACTIVITY':    { name: 'Quản lý hoạt động chi bộ',       module: 'PARTY', actionType: 'UPDATE' },
  'CREATE_PARTY_ACTIVITY':    { name: 'Tạo hoạt động chi bộ',           module: 'PARTY', actionType: 'CREATE' },
  'VIEW_PARTY_FEE':           { name: 'Xem đảng phí',                   module: 'PARTY', actionType: 'VIEW' },
  'MANAGE_PARTY_FEE':         { name: 'Quản lý đảng phí',               module: 'PARTY', actionType: 'UPDATE' },
  'VIEW_PARTY_REVIEW':        { name: 'Xem đánh giá đảng viên',         module: 'PARTY', actionType: 'VIEW' },
  'MANAGE_PARTY_REVIEW':      { name: 'Quản lý đánh giá đảng viên',     module: 'PARTY', actionType: 'UPDATE' },
  'VIEW_PARTY_EVALUATION':    { name: 'Xem xếp loại đảng viên',         module: 'PARTY', actionType: 'VIEW' },
  'CREATE_PARTY_EVALUATION':  { name: 'Lập phiếu đánh giá đảng viên',   module: 'PARTY', actionType: 'CREATE' },
  'APPROVE_PARTY_EVALUATION': { name: 'Phê duyệt đánh giá đảng viên',   module: 'PARTY', actionType: 'APPROVE' },
  'VIEW_PARTY_DISCIPLINE':    { name: 'Xem kỷ luật đảng viên',          module: 'PARTY', actionType: 'VIEW' },
  'APPROVE_PARTY_DISCIPLINE': { name: 'Phê duyệt kỷ luật đảng viên',    module: 'PARTY', actionType: 'APPROVE', isCritical: true },
  'VIEW_PARTY_TRANSFER':      { name: 'Xem chuyển sinh hoạt Đảng',      module: 'PARTY', actionType: 'VIEW' },
  'APPROVE_PARTY_TRANSFER':   { name: 'Phê duyệt chuyển sinh hoạt Đảng', module: 'PARTY', actionType: 'APPROVE', isCritical: true },
  'VIEW_PARTY_ADMISSION':     { name: 'Xem hồ sơ kết nạp Đảng',         module: 'PARTY', actionType: 'VIEW' },
  'SUBMIT_PARTY_ADMISSION':   { name: 'Nộp hồ sơ kết nạp Đảng',         module: 'PARTY', actionType: 'SUBMIT' },
  'APPROVE_PARTY_ADMISSION':  { name: 'Phê duyệt kết nạp đảng viên',    module: 'PARTY', actionType: 'APPROVE', isCritical: true },
  'VIEW_PARTY_INSPECTION':    { name: 'Xem kiểm tra Đảng',              module: 'PARTY', actionType: 'VIEW' },
  'MANAGE_PARTY_INSPECTION':  { name: 'Quản lý kiểm tra Đảng',          module: 'PARTY', actionType: 'UPDATE', isCritical: true },
  'VIEW_PARTY_DASHBOARD':     { name: 'Xem dashboard Đảng',             module: 'PARTY', actionType: 'VIEW' },
  'VIEW_PARTY_REPORT':        { name: 'Xem báo cáo Đảng',               module: 'PARTY', actionType: 'VIEW' },
  'EXPORT_PARTY_REPORT':      { name: 'Xuất báo cáo Đảng',              module: 'PARTY', actionType: 'EXPORT' },
  'EXPORT_PARTY':             { name: 'Xuất báo cáo tổng hợp Đảng',     module: 'PARTY', actionType: 'EXPORT' },

  // ── POLICY ──
  'VIEW_POLICY':              { name: 'Xem chính sách phúc lợi',        module: 'POLICY', actionType: 'VIEW' },
  'CREATE_POLICY':            { name: 'Tạo hồ sơ chính sách',           module: 'POLICY', actionType: 'CREATE' },
  'CREATE_POLICY_REQUEST':    { name: 'Gửi yêu cầu hưởng chính sách',   module: 'POLICY', actionType: 'SUBMIT' },
  'UPDATE_POLICY':            { name: 'Cập nhật hồ sơ chính sách',      module: 'POLICY', actionType: 'UPDATE' },
  'DELETE_POLICY':            { name: 'Xóa hồ sơ chính sách',           module: 'POLICY', actionType: 'DELETE' },
  'APPROVE_POLICY':           { name: 'Phê duyệt hồ sơ chính sách',     module: 'POLICY', actionType: 'APPROVE', isCritical: true },
  'REJECT_POLICY':            { name: 'Từ chối hồ sơ chính sách',       module: 'POLICY', actionType: 'REJECT' },
  'REVIEW_POLICY':            { name: 'Xét duyệt hồ sơ chính sách',     module: 'POLICY', actionType: 'APPROVE' },
  'EXPORT_POLICY':            { name: 'Xuất báo cáo chính sách',        module: 'POLICY', actionType: 'EXPORT' },

  // ── INSURANCE ──
  'VIEW_INSURANCE':           { name: 'Xem hồ sơ bảo hiểm',            module: 'INSURANCE', actionType: 'VIEW' },
  'CREATE_INSURANCE':         { name: 'Tạo hồ sơ bảo hiểm',            module: 'INSURANCE', actionType: 'CREATE' },
  'UPDATE_INSURANCE':         { name: 'Cập nhật thông tin bảo hiểm',    module: 'INSURANCE', actionType: 'UPDATE' },
  'DELETE_INSURANCE':         { name: 'Xóa hồ sơ bảo hiểm',            module: 'INSURANCE', actionType: 'DELETE' },
  'APPROVE_INSURANCE_CLAIM':  { name: 'Phê duyệt yêu cầu bảo hiểm',    module: 'INSURANCE', actionType: 'APPROVE', isCritical: true },
  'EXPORT_INSURANCE':         { name: 'Xuất báo cáo bảo hiểm',         module: 'INSURANCE', actionType: 'EXPORT' },
  'IMPORT_INSURANCE':         { name: 'Nhập dữ liệu bảo hiểm',         module: 'INSURANCE', actionType: 'IMPORT' },

  // ── AWARDS ──
  'VIEW_AWARD':               { name: 'Xem danh sách khen thưởng',      module: 'AWARDS', actionType: 'VIEW' },
  'CREATE_AWARD':             { name: 'Đề xuất khen thưởng',            module: 'AWARDS', actionType: 'CREATE' },
  'UPDATE_AWARD':             { name: 'Cập nhật hồ sơ khen thưởng',     module: 'AWARDS', actionType: 'UPDATE' },
  'DELETE_AWARD':             { name: 'Xóa hồ sơ khen thưởng',         module: 'AWARDS', actionType: 'DELETE' },
  'APPROVE_AWARD':            { name: 'Phê duyệt khen thưởng',          module: 'AWARDS', actionType: 'APPROVE', isCritical: true },
  'EXPORT_AWARD':             { name: 'Xuất báo cáo khen thưởng',       module: 'AWARDS', actionType: 'EXPORT' },
  'VIEW_DISCIPLINE':          { name: 'Xem danh sách kỷ luật',          module: 'AWARDS', actionType: 'VIEW' },
  'CREATE_DISCIPLINE':        { name: 'Lập hồ sơ kỷ luật',             module: 'AWARDS', actionType: 'CREATE', isCritical: true },
  'APPROVE_DISCIPLINE':       { name: 'Phê duyệt kỷ luật',             module: 'AWARDS', actionType: 'APPROVE', isCritical: true },

  // ── STUDENT ──
  'VIEW_STUDENT':             { name: 'Xem danh sách học viên',         module: 'STUDENT', actionType: 'VIEW' },
  'VIEW_STUDENT_DETAIL':      { name: 'Xem chi tiết hồ sơ học viên',    module: 'STUDENT', actionType: 'VIEW' },
  'CREATE_STUDENT':           { name: 'Nhập học viên mới',              module: 'STUDENT', actionType: 'CREATE' },
  'UPDATE_STUDENT':           { name: 'Cập nhật thông tin học viên',     module: 'STUDENT', actionType: 'UPDATE' },
  'DELETE_STUDENT':           { name: 'Xóa hồ sơ học viên',            module: 'STUDENT', actionType: 'DELETE', isCritical: true },
  'EXPORT_STUDENT':           { name: 'Xuất danh sách học viên',        module: 'STUDENT', actionType: 'EXPORT' },
  'VIEW_STUDENT_GRADE':       { name: 'Xem kết quả học tập học viên',   module: 'STUDENT', actionType: 'VIEW' },
  'VIEW_STUDENT_CONDUCT':     { name: 'Xem rèn luyện học viên',         module: 'STUDENT', actionType: 'VIEW' },
  'MANAGE_STUDENT_CONDUCT':   { name: 'Quản lý rèn luyện học viên',     module: 'STUDENT', actionType: 'UPDATE' },
  'VIEW_STUDENT_GPA':         { name: 'Xem GPA học viên',               module: 'STUDENT', actionType: 'VIEW' },
  'MANAGE_STUDENT_GPA':       { name: 'Quản lý GPA học viên',           module: 'STUDENT', actionType: 'UPDATE', isCritical: true },
  'VIEW_STUDENT_DASHBOARD':   { name: 'Xem dashboard học viên',         module: 'STUDENT', actionType: 'VIEW' },
  'VIEW_STUDENT_PROFILE360':  { name: 'Xem hồ sơ 360° học viên',       module: 'STUDENT', actionType: 'VIEW' },

  // ── FACULTY ──
  'VIEW_FACULTY':             { name: 'Xem danh sách giảng viên',       module: 'FACULTY', actionType: 'VIEW' },
  'VIEW_FACULTY_DETAIL':      { name: 'Xem chi tiết hồ sơ giảng viên',  module: 'FACULTY', actionType: 'VIEW' },
  'CREATE_FACULTY':           { name: 'Thêm giảng viên mới',            module: 'FACULTY', actionType: 'CREATE' },
  'UPDATE_FACULTY':           { name: 'Cập nhật hồ sơ giảng viên',      module: 'FACULTY', actionType: 'UPDATE' },
  'DELETE_FACULTY':           { name: 'Xóa hồ sơ giảng viên',          module: 'FACULTY', actionType: 'DELETE' },
  'EXPORT_FACULTY':           { name: 'Xuất danh sách giảng viên',      module: 'FACULTY', actionType: 'EXPORT' },
  'IMPORT_FACULTY':           { name: 'Nhập dữ liệu giảng viên',        module: 'FACULTY', actionType: 'IMPORT' },
  'VIEW_FACULTY_RESEARCH':    { name: 'Xem nghiên cứu của giảng viên',  module: 'FACULTY', actionType: 'VIEW' },
  'VIEW_FACULTY_STATS':       { name: 'Xem thống kê giảng viên',        module: 'FACULTY', actionType: 'VIEW' },
  'VIEW_FACULTY_INSTRUCTORS': { name: 'Xem danh sách giảng viên khoa',  module: 'FACULTY', actionType: 'VIEW' },
  'VIEW_FACULTY_CLASSES':     { name: 'Xem lớp do giảng viên phụ trách', module: 'FACULTY', actionType: 'VIEW' },
  'VIEW_FACULTY_PERFORMANCE': { name: 'Xem hiệu suất giảng dạy',        module: 'FACULTY', actionType: 'VIEW' },
  'VIEW_FACULTY_EIS':         { name: 'Xem điểm EIS giảng viên',        module: 'FACULTY', actionType: 'VIEW' },
  'MANAGE_FACULTY_EIS':       { name: 'Quản lý điểm EIS giảng viên',    module: 'FACULTY', actionType: 'UPDATE', isCritical: true },
  'VIEW_FACULTY_PROFILE360':  { name: 'Xem hồ sơ 360° giảng viên',     module: 'FACULTY', actionType: 'VIEW' },
  'VIEW_FACULTY_WORKLOAD':    { name: 'Xem tải giảng giảng viên',       module: 'FACULTY', actionType: 'VIEW' },
  'MANAGE_FACULTY_WORKLOAD':  { name: 'Quản lý tải giảng giảng viên',   module: 'FACULTY', actionType: 'UPDATE' },

  // ── DATA ──
  'VIEW_DATA':                { name: 'Xem dữ liệu BigData',            module: 'DATA', actionType: 'VIEW' },
  'CREATE_DATA':              { name: 'Tải lên dữ liệu mới',            module: 'DATA', actionType: 'CREATE' },
  'UPDATE_DATA':              { name: 'Cập nhật dữ liệu',               module: 'DATA', actionType: 'UPDATE' },
  'DELETE_DATA':              { name: 'Xóa dữ liệu',                    module: 'DATA', actionType: 'DELETE', isCritical: true },
  'EXPORT_DATALAKE':          { name: 'Xuất dữ liệu BigData',           module: 'DATA', actionType: 'EXPORT' },
  'IMPORT_DATA':              { name: 'Nhập dữ liệu vào BigData',        module: 'DATA', actionType: 'IMPORT' },
  'QUERY_DATA':               { name: 'Truy vấn dữ liệu BigData',        module: 'DATA', actionType: 'VIEW' },
  'VIEW_ETL':                 { name: 'Xem ETL Workflow',               module: 'DATA', actionType: 'VIEW' },
  'VIEW_ETL_LOGS':            { name: 'Xem log ETL',                    module: 'DATA', actionType: 'VIEW' },
  'CREATE_ETL':               { name: 'Tạo ETL Workflow',               module: 'DATA', actionType: 'CREATE' },
  'UPDATE_ETL':               { name: 'Cập nhật ETL Workflow',          module: 'DATA', actionType: 'UPDATE' },
  'DELETE_ETL':               { name: 'Xóa ETL Workflow',               module: 'DATA', actionType: 'DELETE' },
  'EXECUTE_ETL':              { name: 'Chạy ETL Workflow',              module: 'DATA', actionType: 'UPDATE', isCritical: true },

  // ── DASHBOARD ──
  'VIEW_DASHBOARD':           { name: 'Xem Dashboard tổng quan',        module: 'DASHBOARD', actionType: 'VIEW' },
  'VIEW_DASHBOARD_COMMAND':   { name: 'Xem Dashboard chỉ huy',          module: 'DASHBOARD', actionType: 'VIEW' },
  'VIEW_DASHBOARD_ADMIN':     { name: 'Xem Dashboard quản trị',         module: 'DASHBOARD', actionType: 'VIEW' },
  'VIEW_DASHBOARD_FACULTY':   { name: 'Xem Dashboard giảng viên',       module: 'DASHBOARD', actionType: 'VIEW' },
  'VIEW_DASHBOARD_STUDENT':   { name: 'Xem Dashboard học viên',         module: 'DASHBOARD', actionType: 'VIEW' },

  // ── SYSTEM ──
  'MANAGE_USERS':             { name: 'Quản lý tài khoản người dùng',   module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  'VIEW_USERS':               { name: 'Xem danh sách người dùng',       module: 'SYSTEM', actionType: 'VIEW' },
  'RESET_USER_PASSWORD':      { name: 'Đặt lại mật khẩu người dùng',    module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  'TOGGLE_USER_STATUS':       { name: 'Khóa / Mở khóa tài khoản',      module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  'MANAGE_UNITS':             { name: 'Quản lý đơn vị tổ chức',         module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  'VIEW_UNITS':               { name: 'Xem sơ đồ tổ chức đơn vị',      module: 'SYSTEM', actionType: 'VIEW' },
  'ASSIGN_PERSONNEL_TO_UNIT': { name: 'Gán nhân sự vào đơn vị',         module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  'VIEW_INFRASTRUCTURE':      { name: 'Xem cấu hình hạ tầng',           module: 'SYSTEM', actionType: 'VIEW' },
  'MANAGE_INFRASTRUCTURE':    { name: 'Quản lý cấu hình hạ tầng',       module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  'VIEW_RBAC':                { name: 'Xem cấu hình phân quyền RBAC',   module: 'SYSTEM', actionType: 'VIEW' },
  'MANAGE_RBAC':              { name: 'Quản lý phân quyền RBAC',        module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  'MANAGE_POSITIONS':         { name: 'Quản lý chức vụ',                module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  'MANAGE_FUNCTIONS':         { name: 'Quản lý mã chức năng',           module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  'MANAGE_SOD':               { name: 'Quản lý Separation of Duties',   module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  'LINK_PERSONNEL':           { name: 'Liên kết tài khoản với cán bộ',  module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  'VIEW_AUDIT_LOG':           { name: 'Xem nhật ký kiểm toán',          module: 'SYSTEM', actionType: 'VIEW' },
  'EXPORT_AUDIT_LOG':         { name: 'Xuất nhật ký kiểm toán',         module: 'SYSTEM', actionType: 'EXPORT' },
  'VIEW_SYSTEM_HEALTH':       { name: 'Xem giám sát hệ thống',          module: 'SYSTEM', actionType: 'VIEW' },
  'VIEW_SYSTEM_STATS':        { name: 'Xem thống kê hệ thống',          module: 'SYSTEM', actionType: 'VIEW' },
  'MANAGE_API_GATEWAY':       { name: 'Quản lý API Gateway',             module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  'MANAGE_AI_CONFIG':         { name: 'Cấu hình AI & Machine Learning',  module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  'MANAGE_BACKUP':            { name: 'Quản lý sao lưu dữ liệu',        module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  'VIEW_DEPARTMENT':          { name: 'Xem thông tin khoa / phòng ban',  module: 'SYSTEM', actionType: 'VIEW' },
  'CREATE_DEPARTMENT':        { name: 'Tạo khoa / phòng ban mới',        module: 'SYSTEM', actionType: 'CREATE' },
  'UPDATE_DEPARTMENT':        { name: 'Cập nhật thông tin khoa / phòng ban', module: 'SYSTEM', actionType: 'UPDATE' },
  'DELETE_DEPARTMENT':        { name: 'Xóa khoa / phòng ban',            module: 'SYSTEM', actionType: 'DELETE' },
  'VIEW_AUDIT_LOGS':          { name: 'Xem nhật ký hệ thống',           module: 'SYSTEM', actionType: 'VIEW' },
  'EXPORT_AUDIT_LOGS':        { name: 'Xuất nhật ký hệ thống',          module: 'SYSTEM', actionType: 'EXPORT' },
  'VIEW_AUDIT_SUSPICIOUS':    { name: 'Xem hoạt động bất thường',        module: 'SYSTEM', actionType: 'VIEW' },
  'VIEW_MONITORING_ALERTS':   { name: 'Xem cảnh báo hệ thống',          module: 'SYSTEM', actionType: 'VIEW' },
  'MANAGE_MONITORING_ALERTS': { name: 'Quản lý cảnh báo hệ thống',      module: 'SYSTEM', actionType: 'UPDATE' },
  'VIEW_MONITORING_SERVICES': { name: 'Xem trạng thái dịch vụ',         module: 'SYSTEM', actionType: 'VIEW' },
  'MANAGE_MONITORING_SERVICES': { name: 'Quản lý dịch vụ hệ thống',     module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },

  // ── AI ──
  'USE_AI_CHAT':              { name: 'Sử dụng AI Chat',                 module: 'AI', actionType: 'VIEW' },
  'VIEW_AI_INSIGHTS':         { name: 'Xem AI Insights',                 module: 'AI', actionType: 'VIEW' },
  'VIEW_AI_STUDENT_INSIGHTS': { name: 'Xem AI phân tích học viên',       module: 'AI', actionType: 'VIEW' },
  'VIEW_AI_FACULTY_INSIGHTS': { name: 'Xem AI phân tích giảng viên',     module: 'AI', actionType: 'VIEW' },
  'VIEW_AI_PERSONNEL_INSIGHTS': { name: 'Xem AI phân tích cán bộ',       module: 'AI', actionType: 'VIEW' },
  'PREDICT_AI_RISK':          { name: 'Dự đoán rủi ro bằng AI',          module: 'AI', actionType: 'VIEW' },
  'ANALYZE_AI_TRENDS':        { name: 'Phân tích xu hướng bằng AI',      module: 'AI', actionType: 'VIEW' },
  'ANALYZE_AI_SENTIMENT':     { name: 'Phân tích cảm xúc bằng AI',      module: 'AI', actionType: 'VIEW' },
  'GENERATE_AI_REPORT':       { name: 'Tạo báo cáo tự động bằng AI',    module: 'AI', actionType: 'CREATE' },
  'VIEW_AI_RECOMMENDATIONS':  { name: 'Xem đề xuất từ AI',              module: 'AI', actionType: 'VIEW' },
  'VIEW_AI_MONITOR':          { name: 'Giám sát hiệu suất AI',           module: 'AI', actionType: 'VIEW' },
  'VIEW_AI_EARLY_WARNINGS':   { name: 'Xem cảnh báo sớm từ AI',         module: 'AI', actionType: 'VIEW' },
  'ANALYZE_AI_FEEDBACK':      { name: 'Phân tích phản hồi bằng AI',     module: 'AI', actionType: 'VIEW' },
  'SUMMARIZE_AI':             { name: 'Tóm tắt nội dung bằng AI',       module: 'AI', actionType: 'VIEW' },

  // ── ML ──
  'VIEW_ML_MODELS':           { name: 'Xem mô hình ML',                 module: 'SYSTEM', actionType: 'VIEW' },
  'MANAGE_ML_MODELS':         { name: 'Quản lý mô hình ML',             module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  'TRAIN_ML_MODELS':          { name: 'Huấn luyện mô hình ML',          module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },

  // ── SECURITY ──
  'VIEW_SECURITY_POLICY':     { name: 'Xem chính sách bảo mật',         module: 'SYSTEM', actionType: 'VIEW' },
  'MANAGE_SECURITY_POLICY':   { name: 'Quản lý chính sách bảo mật',     module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  'VIEW_AUTH_SESSIONS':       { name: 'Xem phiên đăng nhập',            module: 'SYSTEM', actionType: 'VIEW' },
  'REVOKE_AUTH_SESSION':      { name: 'Thu hồi phiên đăng nhập',        module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },

  // ── GOVERNANCE ──
  'VIEW_GOVERNANCE':          { name: 'Xem quản trị dữ liệu',           module: 'DATA', actionType: 'VIEW' },
  'VIEW_GOVERNANCE_COMPLIANCE': { name: 'Xem tuân thủ dữ liệu',         module: 'DATA', actionType: 'VIEW' },
  'VIEW_GOVERNANCE_LINEAGE':  { name: 'Xem data lineage',               module: 'DATA', actionType: 'VIEW' },
  'VIEW_GOVERNANCE_RETENTION':{ name: 'Xem chính sách lưu trữ dữ liệu', module: 'DATA', actionType: 'VIEW' },
  'MANAGE_GOVERNANCE':        { name: 'Quản lý quản trị dữ liệu',       module: 'DATA', actionType: 'UPDATE', isCritical: true },

  // ── MASTER_DATA ──
  'MANAGE_MASTER_DATA':       { name: 'Quản lý danh mục dùng chung',    module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },

  // ── THEME ──
  'VIEW_THEME':               { name: 'Xem cài đặt giao diện',          module: 'SYSTEM', actionType: 'VIEW' },
  'UPDATE_THEME':             { name: 'Cập nhật giao diện hệ thống',    module: 'SYSTEM', actionType: 'UPDATE' },
  'MANAGE_THEME_BRANDING':    { name: 'Quản lý thương hiệu hệ thống',   module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },

  // ── DOCUMENTS ──
  'VIEW_DOCUMENTS':           { name: 'Xem tài liệu',                   module: 'SYSTEM', actionType: 'VIEW' },
  'GENERATE_PDF_DOCUMENTS':   { name: 'Tạo tài liệu PDF',               module: 'SYSTEM', actionType: 'CREATE' },
  'EXPORT_DOCUMENTS':         { name: 'Xuất tài liệu',                  module: 'SYSTEM', actionType: 'EXPORT' },

  // ── WORKFLOW ──
  'VIEW_WORKFLOW':                { name: 'Xem danh sách quy trình',         module: 'WORKFLOW', actionType: 'VIEW' },
  'VIEW_WORKFLOW_DETAIL':         { name: 'Xem chi tiết quy trình',          module: 'WORKFLOW', actionType: 'VIEW' },
  'VIEW_WORKFLOW_DEFS':           { name: 'Xem định nghĩa quy trình',        module: 'WORKFLOW', actionType: 'VIEW' },
  'MANAGE_WORKFLOW_DEFS':         { name: 'Quản lý định nghĩa quy trình',    module: 'WORKFLOW', actionType: 'CREATE', isCritical: true },
  'VIEW_ALL_WORKFLOW_INSTANCES':  { name: 'Xem tất cả quy trình đang chạy', module: 'WORKFLOW', actionType: 'VIEW' },
  'APPROVE_WORKFLOW':             { name: 'Phê duyệt bước quy trình',        module: 'WORKFLOW', actionType: 'APPROVE', isCritical: true },
  'REJECT_WORKFLOW':              { name: 'Từ chối bước quy trình',          module: 'WORKFLOW', actionType: 'REJECT' },
  'CANCEL_WORKFLOW':              { name: 'Hủy quy trình',                   module: 'WORKFLOW', actionType: 'UPDATE', isCritical: true },
  'MONITOR_WORKFLOW':             { name: 'Giám sát hiệu suất quy trình',    module: 'WORKFLOW', actionType: 'VIEW' },
  'WF.INITIATE':                  { name: 'Khởi tạo quy trình mới',         module: 'WORKFLOW', actionType: 'SUBMIT' },
  'WF.ACT':                       { name: 'Thực hiện hành động quy trình',  module: 'WORKFLOW', actionType: 'APPROVE', isCritical: true },
  'WF.SIGN':                      { name: 'Ký số điện tử trong quy trình',  module: 'WORKFLOW', actionType: 'APPROVE', isCritical: true },
  'WF.DESIGN':                    { name: 'Thiết kế mẫu quy trình',         module: 'WORKFLOW', actionType: 'CREATE', isCritical: true },
  'WF.OVERRIDE':                  { name: 'Phê duyệt / Lưu trữ phiên bản quy trình', module: 'WORKFLOW', actionType: 'UPDATE', isCritical: true },
  'WF.DASHBOARD':                 { name: 'Xem dashboard quy trình toàn cục', module: 'WORKFLOW', actionType: 'VIEW' },
  'WF.EXPORT':                    { name: 'Xuất báo cáo quy trình',         module: 'WORKFLOW', actionType: 'EXPORT' },

  // ── DIGITAL_DOCS ──
  'VIEW_DIGITAL_DOCS':        { name: 'Xem văn bản số',                 module: 'SYSTEM', actionType: 'VIEW' },
  'CREATE_DIGITAL_DOCS':      { name: 'Đăng ký văn bản mới',            module: 'SYSTEM', actionType: 'CREATE' },
  'UPDATE_DIGITAL_DOCS':      { name: 'Cập nhật văn bản',               module: 'SYSTEM', actionType: 'UPDATE' },
  'DELETE_DIGITAL_DOCS':      { name: 'Xóa văn bản',                    module: 'SYSTEM', actionType: 'DELETE' },
  'SEARCH_DIGITAL_DOCS':      { name: 'Tìm kiếm văn bản toàn văn',      module: 'SYSTEM', actionType: 'VIEW' },
  'OCR_DIGITAL_DOCS':         { name: 'Nhận dạng văn bản (OCR)',        module: 'SYSTEM', actionType: 'CREATE' },
  'DOWNLOAD_DIGITAL_DOCS':    { name: 'Tải văn bản số',                 module: 'SYSTEM', actionType: 'VIEW' },
  'APPROVE_DIGITAL_DOCS':     { name: 'Phê duyệt văn bản',              module: 'SYSTEM', actionType: 'APPROVE', isCritical: true },
  'MANAGE_DIGITAL_DOCS':      { name: 'Quản lý kho văn bản số',         module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },

  // ── TEMPLATES ──
  'VIEW_TEMPLATES':           { name: 'Xem thư viện mẫu báo cáo',      module: 'SYSTEM', actionType: 'VIEW' },
  'MANAGE_TEMPLATES':         { name: 'Quản lý mẫu báo cáo',            module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  'PREVIEW_TEMPLATES':        { name: 'Xem trước mẫu với dữ liệu thực', module: 'SYSTEM', actionType: 'VIEW' },
  'EXPORT_BATCH':             { name: 'Xuất hàng loạt',                 module: 'SYSTEM', actionType: 'EXPORT' },
  'VIEW_EXPORT_JOBS':         { name: 'Xem lịch sử xuất dữ liệu',       module: 'SYSTEM', actionType: 'VIEW' },
  'RETRY_EXPORT_JOB':         { name: 'Thử lại xuất dữ liệu',           module: 'SYSTEM', actionType: 'UPDATE' },
  'MANAGE_EXPORT_SCHEDULES':  { name: 'Quản lý lịch xuất định kỳ',      module: 'SYSTEM', actionType: 'UPDATE' },
  'VIEW_TEMPLATE_ANALYTICS':  { name: 'Xem thống kê sử dụng mẫu',       module: 'SYSTEM', actionType: 'VIEW' },
  'IMPORT_TEMPLATES':         { name: 'Nhập mẫu từ file Word/Excel',    module: 'SYSTEM', actionType: 'IMPORT' },

  // ── SCIENCE ──
  'VIEW_SCIENCE_CATALOG':     { name: 'Xem danh mục khoa học',          module: 'SCIENCE', actionType: 'VIEW' },
  'MANAGE_SCIENCE_CATALOG':   { name: 'Quản lý danh mục khoa học',      module: 'SCIENCE', actionType: 'CREATE', isCritical: true },
  'VIEW_SCIENTIST_PROFILE':   { name: 'Xem hồ sơ nhà khoa học',        module: 'SCIENCE', actionType: 'VIEW' },
  'MANAGE_SCIENTIST_PROFILE': { name: 'Quản lý hồ sơ nhà khoa học',    module: 'SCIENCE', actionType: 'UPDATE' },
  'SYNC_ORCID':               { name: 'Đồng bộ ORCID',                  module: 'SCIENCE', actionType: 'IMPORT' },
  'CREATE_RESEARCH_PROJECT':  { name: 'Tạo đề tài NCKH',               module: 'SCIENCE', actionType: 'CREATE' },
  'APPROVE_RESEARCH_DEPT':    { name: 'Phê duyệt đề tài cấp phòng',    module: 'SCIENCE', actionType: 'APPROVE', isCritical: true },
  'APPROVE_RESEARCH_ACADEMY': { name: 'Phê duyệt đề tài cấp học viện', module: 'SCIENCE', actionType: 'APPROVE', isCritical: true },
  'CREATE_SCIENTIFIC_WORK':   { name: 'Tạo công trình khoa học',        module: 'SCIENCE', actionType: 'CREATE' },
  'IMPORT_FROM_CROSSREF':     { name: 'Import từ CrossRef / DOI',       module: 'SCIENCE', actionType: 'IMPORT' },
  'UPLOAD_LIBRARY':           { name: 'Upload tài liệu thư viện số',    module: 'SCIENCE', actionType: 'CREATE' },
  'DOWNLOAD_LIBRARY_NORMAL':  { name: 'Tải tài liệu thường',            module: 'SCIENCE', actionType: 'VIEW' },
  'DOWNLOAD_LIBRARY_SECRET':  { name: 'Tải tài liệu mật',              module: 'SCIENCE', actionType: 'VIEW', isCritical: true },
  'MANAGE_RESEARCH_BUDGET':   { name: 'Quản lý kinh phí NCKH',          module: 'SCIENCE', actionType: 'UPDATE' },
  'APPROVE_BUDGET':           { name: 'Phê duyệt kinh phí NCKH',        module: 'SCIENCE', actionType: 'APPROVE', isCritical: true },
  'VIEW_BUDGET_FINANCE':      { name: 'Xem chi tiết tài chính NCKH',    module: 'SCIENCE', actionType: 'VIEW', isCritical: true },
  'MANAGE_COUNCIL':           { name: 'Quản lý hội đồng khoa học',      module: 'SCIENCE', actionType: 'CREATE', isCritical: true },
  'SUBMIT_REVIEW':            { name: 'Nộp phản biện hội đồng',         module: 'SCIENCE', actionType: 'SUBMIT' },
  'FINALIZE_ACCEPTANCE':      { name: 'Kết luận nghiệm thu',             module: 'SCIENCE', actionType: 'APPROVE', isCritical: true },
  'VIEW_SCIENCE_DASHBOARD':   { name: 'Xem dashboard khoa học',         module: 'SCIENCE', actionType: 'VIEW' },
  'VIEW_SCIENCE_DATA_QUALITY':{ name: 'Xem chất lượng dữ liệu KH',     module: 'SCIENCE', actionType: 'VIEW' },
  'USE_SCIENCE_SEARCH':       { name: 'Tìm kiếm thông minh KHQL',       module: 'SCIENCE', actionType: 'VIEW' },
  'USE_AI_SCIENCE':           { name: 'Dùng AI KHQL',                   module: 'SCIENCE', actionType: 'VIEW' },
  'USE_AI_SCIENCE_ADMIN':     { name: 'Admin AI KHQL',                  module: 'SCIENCE', actionType: 'UPDATE', isCritical: true },
  'EXPORT_SCIENCE_REPORT':    { name: 'Xuất báo cáo KHQL',              module: 'SCIENCE', actionType: 'EXPORT' },
};

// ───────────────────────────────────────────────────
// TRUONG_PHONG positions definition
// Each entry: { code, name, description, level, modules[], excludeCodes[] }
// Gets VIEW/CREATE/UPDATE codes for listed modules at UNIT scope
// ───────────────────────────────────────────────────
const TRUONG_PHONG_POSITIONS = [
  {
    code: 'TRUONG_PHONG_NHAN_SU',
    name: 'Trưởng phòng Nhân sự',
    description: 'Quản lý CSDL cán bộ nhân sự trong đơn vị',
    level: 30,
    allowedCodes: [
      'VIEW_PERSONNEL', 'VIEW_PERSONNEL_DETAIL', 'CREATE_PERSONNEL', 'UPDATE_PERSONNEL',
      'APPROVE_PERSONNEL', 'EXPORT_PERSONNEL', 'IMPORT_PERSONNEL', 'SUBMIT_PERSONNEL',
      'VIEW_CAREER_HISTORY', 'UPDATE_CAREER_HISTORY', 'VIEW_EDUCATION_HISTORY',
      'UPDATE_EDUCATION_HISTORY', 'VIEW_FAMILY_RELATIONS', 'UPDATE_FAMILY_RELATIONS',
      'VIEW_SOLDIER_PROFILE', 'UPDATE_SOLDIER_PROFILE',
      'VIEW_DASHBOARD', 'VIEW_UNITS', 'VIEW_USERS',
    ],
  },
  {
    code: 'TRUONG_PHONG_DAO_TAO',
    name: 'Trưởng phòng Đào tạo',
    description: 'Quản lý CSDL Giáo dục - Đào tạo trong đơn vị',
    level: 30,
    allowedCodes: [
      'VIEW_TRAINING', 'VIEW_COURSE', 'CREATE_COURSE', 'UPDATE_COURSE',
      'VIEW_GRADE', 'CREATE_GRADE_DRAFT', 'SUBMIT_GRADE', 'APPROVE_GRADE', 'REJECT_GRADE',
      'EXPORT_GRADE', 'VIEW_PROGRAM', 'CREATE_PROGRAM', 'UPDATE_PROGRAM', 'APPROVE_PROGRAM',
      'VIEW_CURRICULUM', 'CREATE_CURRICULUM', 'UPDATE_CURRICULUM',
      'VIEW_TERM', 'MANAGE_TERM', 'VIEW_CLASS_SECTION', 'CREATE_CLASS_SECTION', 'UPDATE_CLASS_SECTION',
      'VIEW_SCHEDULE', 'CREATE_SCHEDULE', 'UPDATE_SCHEDULE',
      'VIEW_ATTENDANCE', 'MANAGE_ATTENDANCE', 'VIEW_ENROLLMENT', 'MANAGE_ENROLLMENT',
      'VIEW_CONDUCT', 'MANAGE_CONDUCT', 'MANAGE_GRADE', 'VIEW_WARNING', 'MANAGE_WARNING',
      'VIEW_THESIS', 'MANAGE_THESIS', 'VIEW_GRADUATION', 'RUN_GRADUATION', 'APPROVE_GRADUATION',
      'EXPORT_GRADUATION', 'VIEW_REPOSITORY', 'VIEW_TRAINING_SYSTEM', 'VIEW_BATTALION',
      'VIEW_STUDENT', 'VIEW_STUDENT_DETAIL', 'CREATE_STUDENT', 'UPDATE_STUDENT',
      'EXPORT_STUDENT', 'VIEW_STUDENT_GRADE', 'VIEW_STUDENT_CONDUCT',
      'VIEW_FACULTY', 'VIEW_FACULTY_DETAIL', 'VIEW_FACULTY_STATS', 'VIEW_FACULTY_CLASSES',
      'VIEW_EXAM_PLAN', 'CREATE_EXAM_PLAN', 'UPDATE_EXAM_PLAN', 'APPROVE_EXAM_PLAN',
      'VIEW_EXAM_SESSION', 'CREATE_EXAM_SESSION', 'SUPERVISE_EXAM', 'VIEW_EXAM_REG', 'MANAGE_EXAM_REG',
      'VIEW_DASHBOARD', 'VIEW_DASHBOARD_FACULTY', 'VIEW_DASHBOARD_STUDENT',
    ],
  },
  {
    code: 'TRUONG_PHONG_KHOA_HOC',
    name: 'Trưởng phòng Khoa học',
    description: 'Quản lý CSDL Nghiên cứu Khoa học trong đơn vị',
    level: 30,
    allowedCodes: [
      'VIEW_RESEARCH', 'CREATE_RESEARCH', 'UPDATE_RESEARCH', 'SUBMIT_RESEARCH',
      'REVIEW_RESEARCH', 'APPROVE_RESEARCH', 'REJECT_RESEARCH', 'EVALUATE_RESEARCH',
      'VIEW_PUBLICATION', 'CREATE_PUBLICATION', 'UPDATE_PUBLICATION',
      'VIEW_RESEARCH_PUB', 'CREATE_RESEARCH_PUB', 'UPDATE_RESEARCH_PUB',
      'IMPORT_RESEARCH_PUB', 'EXPORT_RESEARCH_PUB',
      'VIEW_RESEARCH_SCIENTIST', 'UPDATE_RESEARCH_SCIENTIST', 'EXPORT_RESEARCH_SCIENTIST',
      'VIEW_SCIENCE_CATALOG', 'MANAGE_SCIENCE_CATALOG',
      'VIEW_SCIENTIST_PROFILE', 'MANAGE_SCIENTIST_PROFILE', 'SYNC_ORCID',
      'CREATE_RESEARCH_PROJECT', 'APPROVE_RESEARCH_DEPT',
      'CREATE_SCIENTIFIC_WORK', 'IMPORT_FROM_CROSSREF',
      'UPLOAD_LIBRARY', 'DOWNLOAD_LIBRARY_NORMAL',
      'MANAGE_RESEARCH_BUDGET', 'APPROVE_BUDGET', 'VIEW_BUDGET_FINANCE',
      'MANAGE_COUNCIL', 'SUBMIT_REVIEW', 'FINALIZE_ACCEPTANCE',
      'VIEW_SCIENCE_DASHBOARD', 'VIEW_SCIENCE_DATA_QUALITY', 'USE_SCIENCE_SEARCH',
      'USE_AI_SCIENCE', 'EXPORT_SCIENCE_REPORT',
      'VIEW_DASHBOARD', 'VIEW_FACULTY_RESEARCH',
    ],
  },
  {
    code: 'TRUONG_PHONG_DANG',
    name: 'Trưởng phòng Đảng (Ban Chính trị)',
    description: 'Quản lý CSDL Đảng viên trong đơn vị',
    level: 30,
    allowedCodes: [
      'VIEW_PARTY', 'UPDATE_PARTY',
      'VIEW_PARTY_MEMBER', 'CREATE_PARTY_MEMBER', 'UPDATE_PARTY_MEMBER',
      'VIEW_PARTY_ORG', 'UPDATE_PARTY_ORG',
      'VIEW_PARTY_MEETING', 'MANAGE_PARTY_MEETING',
      'VIEW_PARTY_ACTIVITY', 'MANAGE_PARTY_ACTIVITY', 'CREATE_PARTY_ACTIVITY',
      'VIEW_PARTY_FEE', 'MANAGE_PARTY_FEE',
      'VIEW_PARTY_REVIEW', 'MANAGE_PARTY_REVIEW',
      'VIEW_PARTY_EVALUATION', 'CREATE_PARTY_EVALUATION', 'APPROVE_PARTY_EVALUATION',
      'VIEW_PARTY_DISCIPLINE',
      'VIEW_PARTY_TRANSFER', 'APPROVE_PARTY_TRANSFER',
      'VIEW_PARTY_ADMISSION', 'SUBMIT_PARTY_ADMISSION', 'APPROVE_PARTY_ADMISSION',
      'VIEW_PARTY_INSPECTION',
      'VIEW_PARTY_DASHBOARD', 'VIEW_PARTY_REPORT', 'EXPORT_PARTY_REPORT', 'EXPORT_PARTY',
      'VIEW_DASHBOARD',
    ],
  },
  {
    code: 'TRUONG_PHONG_CHINH_SACH',
    name: 'Trưởng phòng Chính sách',
    description: 'Quản lý CSDL Chính sách - Bảo hiểm - Thi đua Khen thưởng',
    level: 30,
    allowedCodes: [
      'VIEW_POLICY', 'CREATE_POLICY', 'CREATE_POLICY_REQUEST', 'UPDATE_POLICY',
      'APPROVE_POLICY', 'REJECT_POLICY', 'REVIEW_POLICY', 'EXPORT_POLICY',
      'VIEW_INSURANCE', 'CREATE_INSURANCE', 'UPDATE_INSURANCE',
      'APPROVE_INSURANCE_CLAIM', 'EXPORT_INSURANCE', 'IMPORT_INSURANCE',
      'VIEW_AWARD', 'CREATE_AWARD', 'UPDATE_AWARD', 'APPROVE_AWARD', 'EXPORT_AWARD',
      'VIEW_DISCIPLINE', 'CREATE_DISCIPLINE', 'APPROVE_DISCIPLINE',
      'VIEW_DASHBOARD', 'VIEW_UNITS',
    ],
  },
];

// ───────────────────────────────────────────────────
// Step 1: Seed all functions
// ───────────────────────────────────────────────────
async function seedAllFunctions() {
  console.log('\n🔄 Step 1: Seed tất cả Function codes...');

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const [code, def] of Object.entries(FUNCTION_DEFS)) {
    try {
      const existing = await prisma.function.findUnique({ where: { code } });

      if (existing) {
        await prisma.function.update({
          where: { code },
          data: {
            name: def.name,
            description: def.description ?? null,
            module: def.module,
            actionType: def.actionType,
            isCritical: def.isCritical ?? false,
            isActive: true,
          },
        });
        updated++;
      } else {
        await prisma.function.create({
          data: {
            code,
            name: def.name,
            description: def.description ?? null,
            module: def.module,
            actionType: def.actionType,
            isCritical: def.isCritical ?? false,
            isActive: true,
          },
        });
        created++;
      }
    } catch (err: any) {
      errors.push(`${code}: ${err.message}`);
    }
  }

  console.log(`  ✅ Tạo mới: ${created}`);
  console.log(`  ✅ Cập nhật: ${updated}`);
  if (errors.length > 0) {
    console.warn(`  ⚠️  Lỗi (${errors.length}):`);
    errors.forEach(e => console.warn(`    - ${e}`));
  }

  const total = await prisma.function.count({ where: { isActive: true } });
  console.log(`  📊 Tổng active functions trong DB: ${total}`);
  return total;
}

// ───────────────────────────────────────────────────
// Step 2: Ensure SYSTEM_ADMIN position và cấp toàn quyền
// ───────────────────────────────────────────────────
async function seedSystemAdmin() {
  console.log('\n🔄 Step 2: Cấp toàn quyền ACADEMY cho SYSTEM_ADMIN...');

  let position = await prisma.position.findFirst({ where: { code: 'SYSTEM_ADMIN' } });
  if (!position) {
    position = await prisma.position.create({
      data: {
        code: 'SYSTEM_ADMIN',
        name: 'Quản trị hệ thống',
        description: 'Toàn quyền quản trị hệ thống học viện',
        positionScope: 'ACADEMY',
        level: 100,
        isActive: true,
      } as any,
    });
    console.log('  ✅ Created SYSTEM_ADMIN position');
  } else {
    await prisma.position.update({
      where: { id: position.id },
      data: { positionScope: 'ACADEMY', level: 100, isActive: true } as any,
    });
    console.log('  ✅ SYSTEM_ADMIN position exists, updated');
  }

  const allFunctions = await prisma.function.findMany({ where: { isActive: true } });
  let grantCreated = 0;
  let grantUpdated = 0;

  for (const fn of allFunctions) {
    const existing = await prisma.positionFunction.findFirst({
      where: { positionId: position.id, functionId: fn.id },
    });

    if (!existing) {
      await prisma.positionFunction.create({
        data: {
          positionId: position.id,
          functionId: fn.id,
          scope: 'ACADEMY' as FunctionScope,
          isActive: true,
        } as any,
      });
      grantCreated++;
    } else if (!existing.isActive || (existing as any).scope !== 'ACADEMY') {
      await prisma.positionFunction.update({
        where: { id: existing.id },
        data: { isActive: true, scope: 'ACADEMY' as FunctionScope } as any,
      });
      grantUpdated++;
    }
  }

  console.log(`  ✅ Grants tạo mới: ${grantCreated}, cập nhật: ${grantUpdated}`);
  console.log(`  📊 Tổng grants SYSTEM_ADMIN: ${allFunctions.length}`);

  // Gán cho admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@demo.hvhc.edu.vn';
  const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (adminUser) {
    const existingUP = await prisma.userPosition.findFirst({
      where: { userId: adminUser.id, positionId: position.id },
    });
    if (!existingUP) {
      await prisma.userPosition.create({
        data: {
          userId: adminUser.id,
          positionId: position.id,
          isPrimary: true,
          isActive: true,
          startDate: new Date(),
        } as any,
      });
      console.log(`  ✅ Gán SYSTEM_ADMIN cho ${adminEmail}`);
    } else {
      await prisma.userPosition.update({
        where: { id: existingUP.id },
        data: { isPrimary: true, isActive: true, endDate: null } as any,
      });
      console.log(`  ✅ Đã cập nhật UserPosition cho ${adminEmail}`);
    }
  } else {
    console.log(`  ⚠️  Không tìm thấy admin user: ${adminEmail}`);
  }

  return position;
}

// ───────────────────────────────────────────────────
// Step 3: Tạo các chức vụ TRUONG_PHONG
// ───────────────────────────────────────────────────
async function seedTruongPhongPositions() {
  console.log('\n🔄 Step 3: Tạo chức vụ Trưởng phòng với quyền UNIT...');

  for (const def of TRUONG_PHONG_POSITIONS) {
    let position = await prisma.position.findFirst({ where: { code: def.code } });

    if (!position) {
      position = await prisma.position.create({
        data: {
          code: def.code,
          name: def.name,
          description: def.description,
          positionScope: 'UNIT',
          level: def.level,
          isActive: true,
        } as any,
      });
      console.log(`  ✅ Created: ${def.code}`);
    } else {
      await prisma.position.update({
        where: { id: position.id },
        data: { name: def.name, positionScope: 'UNIT', level: def.level, isActive: true } as any,
      });
      console.log(`  ✅ Updated: ${def.code}`);
    }

    // Gán các function codes được phép ở scope UNIT
    let grantCount = 0;
    for (const code of def.allowedCodes) {
      const fn = await prisma.function.findUnique({ where: { code } });
      if (!fn) {
        console.warn(`    ⚠️  Function not found: ${code}`);
        continue;
      }

      const existing = await prisma.positionFunction.findFirst({
        where: { positionId: position.id, functionId: fn.id },
      });

      if (!existing) {
        await prisma.positionFunction.create({
          data: {
            positionId: position.id,
            functionId: fn.id,
            scope: 'UNIT' as FunctionScope,
            isActive: true,
          } as any,
        });
        grantCount++;
      } else if (!existing.isActive) {
        await prisma.positionFunction.update({
          where: { id: existing.id },
          data: { isActive: true } as any,
        });
        grantCount++;
      }
    }
    console.log(`     → ${def.name}: ${grantCount} grants mới / tổng ${def.allowedCodes.length} codes`);
  }
}

// ───────────────────────────────────────────────────
// Summary
// ───────────────────────────────────────────────────
async function printSummary() {
  console.log('\n📊 ═══════════ TỔNG KẾT ═══════════');

  const totalFunctions = await prisma.function.count({ where: { isActive: true } });
  console.log(`  Active functions: ${totalFunctions}`);

  const byModule = await prisma.function.groupBy({
    by: ['module'],
    where: { isActive: true },
    _count: { id: true },
    orderBy: { module: 'asc' },
  });
  byModule.forEach(m => console.log(`    ${m.module.padEnd(20)} ${m._count.id}`));

  const positions = await prisma.position.findMany({
    where: { isActive: true },
    include: { _count: { select: { functions: true } } },
    orderBy: { level: 'desc' },
  });
  console.log(`\n  Chức vụ (${positions.length}):`);
  for (const p of positions) {
    console.log(`    ${p.code.padEnd(30)} level=${p.level} grants=${p._count.functions}`);
  }

  console.log('\n⚠️  Quan trọng: Đăng xuất & đăng nhập lại để refresh permission cache.');
  console.log('═══════════════════════════════════\n');
}

async function main() {
  console.log('🚀 Seed All RBAC - Functions + Admin + Trưởng phòng');

  await seedAllFunctions();
  await seedSystemAdmin();
  await seedTruongPhongPositions();
  await printSummary();
}

main()
  .catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
