/**
 * seed_rbac_full.ts
 * Seed hợp nhất: tất cả Functions + tất cả Positions + phân quyền đầy đủ theo chức vụ
 * Admin (SYSTEM_ADMIN) nhận toàn bộ function codes ở scope ACADEMY
 *
 * Idempotent: chạy nhiều lần không tạo duplicate
 * Run: npx tsx --require dotenv/config prisma/seed/seed_rbac_full.ts
 */

import { PrismaClient, ActionType, FunctionScope } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: FUNCTION DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
interface FDef {
  code?: string;
  name: string;
  description?: string;
  module: string;
  actionType: ActionType;
  isCritical?: boolean;
}

const FUNCTION_DEFS: Record<string, FDef> = {
  // ── PERSONNEL ──
  VIEW_PERSONNEL:              { name: 'Xem danh sách cán bộ',                  module: 'PERSONNEL',         actionType: 'VIEW' },
  VIEW_PERSONNEL_DETAIL:       { name: 'Xem chi tiết hồ sơ cán bộ',             module: 'PERSONNEL',         actionType: 'VIEW' },
  VIEW_PERSONNEL_SENSITIVE:    { name: 'Xem thông tin nhạy cảm cán bộ',         module: 'PERSONNEL',         actionType: 'VIEW',   isCritical: true },
  CREATE_PERSONNEL:            { name: 'Thêm cán bộ mới',                       module: 'PERSONNEL',         actionType: 'CREATE', isCritical: true },
  UPDATE_PERSONNEL:            { name: 'Cập nhật thông tin cán bộ',              module: 'PERSONNEL',         actionType: 'UPDATE' },
  DELETE_PERSONNEL:            { name: 'Xóa hồ sơ cán bộ',                      module: 'PERSONNEL',         actionType: 'DELETE', isCritical: true },
  APPROVE_PERSONNEL:           { name: 'Phê duyệt hồ sơ cán bộ',                module: 'PERSONNEL',         actionType: 'APPROVE', isCritical: true },
  EXPORT_PERSONNEL:            { name: 'Xuất danh sách cán bộ',                 module: 'PERSONNEL',         actionType: 'EXPORT' },
  IMPORT_PERSONNEL:            { name: 'Nhập dữ liệu cán bộ',                   module: 'PERSONNEL',         actionType: 'IMPORT', isCritical: true },
  SUBMIT_PERSONNEL:            { name: 'Gửi hồ sơ cán bộ lên duyệt',           module: 'PERSONNEL',         actionType: 'SUBMIT' },
  VIEW_CAREER_HISTORY:         { name: 'Xem quá trình công tác',                module: 'PERSONNEL',         actionType: 'VIEW' },
  UPDATE_CAREER_HISTORY:       { name: 'Cập nhật quá trình công tác',           module: 'PERSONNEL',         actionType: 'UPDATE' },
  VIEW_EDUCATION_HISTORY:      { name: 'Xem lịch sử học vấn',                  module: 'PERSONNEL',         actionType: 'VIEW' },
  UPDATE_EDUCATION_HISTORY:    { name: 'Cập nhật lịch sử học vấn',             module: 'PERSONNEL',         actionType: 'UPDATE' },
  VIEW_FAMILY_RELATIONS:       { name: 'Xem thông tin thân nhân',               module: 'PERSONNEL',         actionType: 'VIEW',   isCritical: true },
  UPDATE_FAMILY_RELATIONS:     { name: 'Cập nhật thông tin thân nhân',          module: 'PERSONNEL',         actionType: 'UPDATE', isCritical: true },
  VIEW_SOLDIER_PROFILE:        { name: 'Xem hồ sơ quân nhân',                  module: 'PERSONNEL',         actionType: 'VIEW' },
  UPDATE_SOLDIER_PROFILE:      { name: 'Cập nhật hồ sơ quân nhân',             module: 'PERSONNEL',         actionType: 'UPDATE', isCritical: true },

  // ── TRAINING ──
  VIEW_TRAINING:               { name: 'Xem thông tin đào tạo',                module: 'TRAINING',          actionType: 'VIEW' },
  VIEW_COURSE:                 { name: 'Xem môn học / khóa học',               module: 'TRAINING',          actionType: 'VIEW' },
  CREATE_COURSE:               { name: 'Tạo môn học / khóa học',               module: 'TRAINING',          actionType: 'CREATE' },
  UPDATE_COURSE:               { name: 'Cập nhật môn học / khóa học',          module: 'TRAINING',          actionType: 'UPDATE' },
  DELETE_COURSE:               { name: 'Xóa môn học / khóa học',               module: 'TRAINING',          actionType: 'DELETE' },
  VIEW_GRADE:                  { name: 'Xem điểm học viên',                    module: 'TRAINING',          actionType: 'VIEW' },
  CREATE_GRADE_DRAFT:          { name: 'Nhập điểm nháp',                       module: 'TRAINING',          actionType: 'CREATE' },
  SUBMIT_GRADE:                { name: 'Gửi điểm lên duyệt',                   module: 'TRAINING',          actionType: 'SUBMIT' },
  APPROVE_GRADE:               { name: 'Phê duyệt điểm',                       module: 'TRAINING',          actionType: 'APPROVE', isCritical: true },
  REJECT_GRADE:                { name: 'Từ chối điểm',                         module: 'TRAINING',          actionType: 'REJECT' },
  REGISTER_COURSE:             { name: 'Đăng ký môn học',                      module: 'TRAINING',          actionType: 'CREATE' },
  EXPORT_GRADE:                { name: 'Xuất bảng điểm',                       module: 'TRAINING',          actionType: 'EXPORT' },

  // ── EDUCATION ──
  VIEW_PROGRAM:                { name: 'Xem chương trình đào tạo',             module: 'EDUCATION',         actionType: 'VIEW' },
  CREATE_PROGRAM:              { name: 'Tạo chương trình đào tạo',             module: 'EDUCATION',         actionType: 'CREATE' },
  UPDATE_PROGRAM:              { name: 'Cập nhật chương trình đào tạo',        module: 'EDUCATION',         actionType: 'UPDATE' },
  DELETE_PROGRAM:              { name: 'Xóa chương trình đào tạo',             module: 'EDUCATION',         actionType: 'DELETE' },
  APPROVE_PROGRAM:             { name: 'Phê duyệt chương trình đào tạo',       module: 'EDUCATION',         actionType: 'APPROVE', isCritical: true },
  VIEW_CURRICULUM:             { name: 'Xem khung chương trình',               module: 'EDUCATION',         actionType: 'VIEW' },
  CREATE_CURRICULUM:           { name: 'Tạo khung chương trình',               module: 'EDUCATION',         actionType: 'CREATE' },
  UPDATE_CURRICULUM:           { name: 'Cập nhật khung chương trình',          module: 'EDUCATION',         actionType: 'UPDATE' },
  DELETE_CURRICULUM:           { name: 'Xóa khung chương trình',               module: 'EDUCATION',         actionType: 'DELETE' },
  VIEW_TERM:                   { name: 'Xem năm học / học kỳ',                 module: 'EDUCATION',         actionType: 'VIEW' },
  MANAGE_TERM:                 { name: 'Quản lý năm học / học kỳ',             module: 'EDUCATION',         actionType: 'UPDATE' },
  VIEW_CLASS_SECTION:          { name: 'Xem lớp học phần',                     module: 'EDUCATION',         actionType: 'VIEW' },
  CREATE_CLASS_SECTION:        { name: 'Mở lớp học phần',                      module: 'EDUCATION',         actionType: 'CREATE' },
  UPDATE_CLASS_SECTION:        { name: 'Cập nhật lớp học phần',                module: 'EDUCATION',         actionType: 'UPDATE' },
  DELETE_CLASS_SECTION:        { name: 'Xóa lớp học phần',                     module: 'EDUCATION',         actionType: 'DELETE' },
  VIEW_SCHEDULE:               { name: 'Xem thời khóa biểu',                   module: 'EDUCATION',         actionType: 'VIEW' },
  CREATE_SCHEDULE:             { name: 'Tạo thời khóa biểu',                   module: 'EDUCATION',         actionType: 'CREATE' },
  UPDATE_SCHEDULE:             { name: 'Cập nhật thời khóa biểu',              module: 'EDUCATION',         actionType: 'UPDATE' },
  DELETE_SCHEDULE:             { name: 'Xóa lịch học',                         module: 'EDUCATION',         actionType: 'DELETE' },
  VIEW_ATTENDANCE:             { name: 'Xem điểm danh',                        module: 'EDUCATION',         actionType: 'VIEW' },
  MANAGE_ATTENDANCE:           { name: 'Quản lý điểm danh',                    module: 'EDUCATION',         actionType: 'UPDATE' },
  VIEW_ENROLLMENT:             { name: 'Xem ghi danh',                         module: 'EDUCATION',         actionType: 'VIEW' },
  MANAGE_ENROLLMENT:           { name: 'Quản lý ghi danh',                     module: 'EDUCATION',         actionType: 'UPDATE' },
  VIEW_CONDUCT:                { name: 'Xem điểm rèn luyện',                   module: 'EDUCATION',         actionType: 'VIEW' },
  MANAGE_CONDUCT:              { name: 'Quản lý điểm rèn luyện',               module: 'EDUCATION',         actionType: 'UPDATE' },
  MANAGE_GRADE:                { name: 'Nhập / sửa điểm học phần',             module: 'EDUCATION',         actionType: 'UPDATE', isCritical: true },
  VIEW_WARNING:                { name: 'Xem cảnh báo học vụ',                  module: 'EDUCATION',         actionType: 'VIEW' },
  MANAGE_WARNING:              { name: 'Quản lý cảnh báo học vụ',              module: 'EDUCATION',         actionType: 'UPDATE' },
  VIEW_THESIS:                 { name: 'Xem khóa luận / luận văn',             module: 'EDUCATION',         actionType: 'VIEW' },
  MANAGE_THESIS:               { name: 'Quản lý khóa luận / luận văn',         module: 'EDUCATION',         actionType: 'UPDATE' },
  VIEW_GRADUATION:             { name: 'Xem kết quả xét tốt nghiệp',           module: 'EDUCATION',         actionType: 'VIEW' },
  RUN_GRADUATION:              { name: 'Chạy engine xét tốt nghiệp',           module: 'EDUCATION',         actionType: 'UPDATE', isCritical: true },
  APPROVE_GRADUATION:          { name: 'Phê duyệt tốt nghiệp',                 module: 'EDUCATION',         actionType: 'APPROVE', isCritical: true },
  EXPORT_GRADUATION:           { name: 'Xuất danh sách / văn bằng',            module: 'EDUCATION',         actionType: 'EXPORT' },
  VIEW_REPOSITORY:             { name: 'Tra cứu kho học vụ',                   module: 'EDUCATION',         actionType: 'VIEW' },
  VIEW_TRAINING_SYSTEM:        { name: 'Xem hệ đào tạo',                       module: 'EDUCATION',         actionType: 'VIEW' },
  MANAGE_TRAINING_SYSTEM:      { name: 'Quản lý hệ đào tạo',                   module: 'EDUCATION',         actionType: 'UPDATE', isCritical: true },
  VIEW_BATTALION:              { name: 'Xem tiểu đoàn',                        module: 'EDUCATION',         actionType: 'VIEW' },
  MANAGE_BATTALION:            { name: 'Quản lý tiểu đoàn',                    module: 'EDUCATION',         actionType: 'UPDATE', isCritical: true },

  // ── EXAM ──
  VIEW_EXAM_PLAN:              { name: 'Xem kế hoạch thi',                     module: 'EXAM',              actionType: 'VIEW' },
  CREATE_EXAM_PLAN:            { name: 'Tạo kế hoạch thi',                     module: 'EXAM',              actionType: 'CREATE' },
  UPDATE_EXAM_PLAN:            { name: 'Cập nhật kế hoạch thi',                module: 'EXAM',              actionType: 'UPDATE' },
  DELETE_EXAM_PLAN:            { name: 'Xóa kế hoạch thi',                     module: 'EXAM',              actionType: 'DELETE' },
  APPROVE_EXAM_PLAN:           { name: 'Phê duyệt kế hoạch thi',               module: 'EXAM',              actionType: 'APPROVE', isCritical: true },
  PUBLISH_EXAM_PLAN:           { name: 'Công bố kế hoạch thi',                 module: 'EXAM',              actionType: 'UPDATE' },
  VIEW_EXAM_SESSION:           { name: 'Xem ca thi',                           module: 'EXAM',              actionType: 'VIEW' },
  CREATE_EXAM_SESSION:         { name: 'Tạo ca thi',                           module: 'EXAM',              actionType: 'CREATE' },
  UPDATE_EXAM_SESSION:         { name: 'Cập nhật ca thi',                      module: 'EXAM',              actionType: 'UPDATE' },
  DELETE_EXAM_SESSION:         { name: 'Xóa ca thi',                           module: 'EXAM',              actionType: 'DELETE' },
  SUPERVISE_EXAM:              { name: 'Thực hiện coi thi',                    module: 'EXAM',              actionType: 'UPDATE' },
  VIEW_EXAM_REG:               { name: 'Xem đăng ký thi',                      module: 'EXAM',              actionType: 'VIEW' },
  MANAGE_EXAM_REG:             { name: 'Quản lý đăng ký thi',                  module: 'EXAM',              actionType: 'UPDATE' },
  REGISTER_EXAM:               { name: 'Đăng ký thi',                          module: 'EXAM',              actionType: 'CREATE' },

  // ── QUESTION_BANK ──
  VIEW_QUESTION_BANK:          { name: 'Xem ngân hàng câu hỏi',               module: 'QUESTION_BANK',     actionType: 'VIEW' },
  CREATE_QUESTION_BANK:        { name: 'Tạo ngân hàng câu hỏi',               module: 'QUESTION_BANK',     actionType: 'CREATE' },
  UPDATE_QUESTION_BANK:        { name: 'Cập nhật ngân hàng câu hỏi',          module: 'QUESTION_BANK',     actionType: 'UPDATE' },
  DELETE_QUESTION_BANK:        { name: 'Xóa ngân hàng câu hỏi',               module: 'QUESTION_BANK',     actionType: 'DELETE' },
  VIEW_QUESTION:               { name: 'Xem câu hỏi',                         module: 'QUESTION_BANK',     actionType: 'VIEW' },
  CREATE_QUESTION:             { name: 'Tạo câu hỏi',                         module: 'QUESTION_BANK',     actionType: 'CREATE' },
  UPDATE_QUESTION:             { name: 'Cập nhật câu hỏi',                    module: 'QUESTION_BANK',     actionType: 'UPDATE' },
  DELETE_QUESTION:             { name: 'Xóa câu hỏi',                         module: 'QUESTION_BANK',     actionType: 'DELETE' },
  REVIEW_QUESTION:             { name: 'Duyệt câu hỏi',                       module: 'QUESTION_BANK',     actionType: 'APPROVE' },
  IMPORT_QUESTION:             { name: 'Nhập câu hỏi',                        module: 'QUESTION_BANK',     actionType: 'IMPORT' },
  EXPORT_QUESTION:             { name: 'Xuất câu hỏi',                        module: 'QUESTION_BANK',     actionType: 'EXPORT' },

  // ── LEARNING_MATERIAL ──
  VIEW_LEARNING_MATERIAL:      { name: 'Xem học liệu',                        module: 'LEARNING_MATERIAL', actionType: 'VIEW' },
  CREATE_LEARNING_MATERIAL:    { name: 'Tạo học liệu',                        module: 'LEARNING_MATERIAL', actionType: 'CREATE' },
  UPDATE_LEARNING_MATERIAL:    { name: 'Cập nhật học liệu',                   module: 'LEARNING_MATERIAL', actionType: 'UPDATE' },
  DELETE_LEARNING_MATERIAL:    { name: 'Xóa học liệu',                        module: 'LEARNING_MATERIAL', actionType: 'DELETE' },
  DOWNLOAD_LEARNING_MATERIAL:  { name: 'Tải học liệu',                        module: 'LEARNING_MATERIAL', actionType: 'VIEW' },
  UPLOAD_LEARNING_MATERIAL:    { name: 'Upload học liệu',                     module: 'LEARNING_MATERIAL', actionType: 'CREATE' },
  APPROVE_LEARNING_MATERIAL:   { name: 'Phê duyệt học liệu',                  module: 'LEARNING_MATERIAL', actionType: 'APPROVE' },

  // ── LAB ──
  VIEW_LAB:                    { name: 'Xem phòng thí nghiệm',                module: 'LAB',               actionType: 'VIEW' },
  CREATE_LAB:                  { name: 'Tạo phòng thí nghiệm',                module: 'LAB',               actionType: 'CREATE' },
  UPDATE_LAB:                  { name: 'Cập nhật phòng thí nghiệm',           module: 'LAB',               actionType: 'UPDATE' },
  DELETE_LAB:                  { name: 'Xóa phòng thí nghiệm',                module: 'LAB',               actionType: 'DELETE' },
  VIEW_LAB_EQUIPMENT:          { name: 'Xem thiết bị PTN',                    module: 'LAB',               actionType: 'VIEW' },
  CREATE_LAB_EQUIPMENT:        { name: 'Thêm thiết bị PTN',                   module: 'LAB',               actionType: 'CREATE' },
  UPDATE_LAB_EQUIPMENT:        { name: 'Cập nhật thiết bị PTN',               module: 'LAB',               actionType: 'UPDATE' },
  DELETE_LAB_EQUIPMENT:        { name: 'Xóa thiết bị PTN',                    module: 'LAB',               actionType: 'DELETE' },
  MANAGE_LAB_MAINTENANCE:      { name: 'Quản lý bảo trì PTN',                 module: 'LAB',               actionType: 'UPDATE' },
  VIEW_LAB_SESSION:            { name: 'Xem buổi thực hành',                  module: 'LAB',               actionType: 'VIEW' },
  CREATE_LAB_SESSION:          { name: 'Tạo buổi thực hành',                  module: 'LAB',               actionType: 'CREATE' },
  UPDATE_LAB_SESSION:          { name: 'Cập nhật buổi thực hành',             module: 'LAB',               actionType: 'UPDATE' },
  DELETE_LAB_SESSION:          { name: 'Xóa buổi thực hành',                  module: 'LAB',               actionType: 'DELETE' },

  // ── RESEARCH ──
  VIEW_RESEARCH:               { name: 'Xem đề tài nghiên cứu',               module: 'RESEARCH',          actionType: 'VIEW' },
  CREATE_RESEARCH:             { name: 'Đăng ký đề tài nghiên cứu',           module: 'RESEARCH',          actionType: 'CREATE' },
  UPDATE_RESEARCH:             { name: 'Cập nhật đề tài nghiên cứu',          module: 'RESEARCH',          actionType: 'UPDATE' },
  DELETE_RESEARCH:             { name: 'Xóa đề tài nghiên cứu',               module: 'RESEARCH',          actionType: 'DELETE' },
  SUBMIT_RESEARCH:             { name: 'Nộp đề tài nghiên cứu',               module: 'RESEARCH',          actionType: 'SUBMIT' },
  REVIEW_RESEARCH:             { name: 'Xét duyệt đề tài nghiên cứu',         module: 'RESEARCH',          actionType: 'APPROVE' },
  APPROVE_RESEARCH:            { name: 'Phê duyệt đề tài nghiên cứu',         module: 'RESEARCH',          actionType: 'APPROVE', isCritical: true },
  REJECT_RESEARCH:             { name: 'Từ chối đề tài nghiên cứu',           module: 'RESEARCH',          actionType: 'REJECT' },
  EVALUATE_RESEARCH:           { name: 'Đánh giá kết quả nghiên cứu',         module: 'RESEARCH',          actionType: 'UPDATE' },
  VIEW_PUBLICATION:            { name: 'Xem công trình khoa học',              module: 'RESEARCH',          actionType: 'VIEW' },
  CREATE_PUBLICATION:          { name: 'Thêm công trình khoa học',             module: 'RESEARCH',          actionType: 'CREATE' },
  UPDATE_PUBLICATION:          { name: 'Cập nhật công trình khoa học',         module: 'RESEARCH',          actionType: 'UPDATE' },
  DELETE_PUBLICATION:          { name: 'Xóa công trình khoa học',              module: 'RESEARCH',          actionType: 'DELETE' },
  VIEW_RESEARCH_PUB:           { name: 'Xem danh sách công bố KH',            module: 'RESEARCH',          actionType: 'VIEW' },
  CREATE_RESEARCH_PUB:         { name: 'Thêm công bố khoa học',               module: 'RESEARCH',          actionType: 'CREATE' },
  UPDATE_RESEARCH_PUB:         { name: 'Cập nhật công bố khoa học',           module: 'RESEARCH',          actionType: 'UPDATE' },
  DELETE_RESEARCH_PUB:         { name: 'Xóa công bố khoa học',                module: 'RESEARCH',          actionType: 'DELETE' },
  IMPORT_RESEARCH_PUB:         { name: 'Import danh mục công bố (BibTeX)',    module: 'RESEARCH',          actionType: 'IMPORT' },
  EXPORT_RESEARCH_PUB:         { name: 'Xuất danh mục công bố',               module: 'RESEARCH',          actionType: 'EXPORT' },
  VIEW_RESEARCH_SCIENTIST:     { name: 'Xem hồ sơ nhà khoa học (NCKH)',       module: 'RESEARCH',          actionType: 'VIEW' },
  UPDATE_RESEARCH_SCIENTIST:   { name: 'Cập nhật hồ sơ nhà khoa học',         module: 'RESEARCH',          actionType: 'UPDATE' },
  EXPORT_RESEARCH_SCIENTIST:   { name: 'Xuất hồ sơ nhà khoa học',             module: 'RESEARCH',          actionType: 'EXPORT' },

  // ── PARTY ──
  VIEW_PARTY:                  { name: 'Xem thông tin Đảng viên',             module: 'PARTY',             actionType: 'VIEW' },
  CREATE_PARTY:                { name: 'Kết nạp Đảng viên mới',               module: 'PARTY',             actionType: 'CREATE', isCritical: true },
  UPDATE_PARTY:                { name: 'Cập nhật hồ sơ Đảng viên',            module: 'PARTY',             actionType: 'UPDATE' },
  DELETE_PARTY:                { name: 'Xóa hồ sơ Đảng viên',                 module: 'PARTY',             actionType: 'DELETE', isCritical: true },
  APPROVE_PARTY:               { name: 'Phê duyệt kết nạp Đảng',              module: 'PARTY',             actionType: 'APPROVE', isCritical: true },
  VIEW_PARTY_MEMBER:           { name: 'Xem hồ sơ đảng viên',                module: 'PARTY',             actionType: 'VIEW' },
  CREATE_PARTY_MEMBER:         { name: 'Tạo hồ sơ đảng viên',                module: 'PARTY',             actionType: 'CREATE', isCritical: true },
  UPDATE_PARTY_MEMBER:         { name: 'Cập nhật hồ sơ đảng viên',           module: 'PARTY',             actionType: 'UPDATE' },
  DELETE_PARTY_MEMBER:         { name: 'Xóa hồ sơ đảng viên',                module: 'PARTY',             actionType: 'DELETE', isCritical: true },
  VIEW_PARTY_MEMBER_SENSITIVE: { name: 'Xem thông tin nhạy cảm đảng viên',   module: 'PARTY',             actionType: 'VIEW',   isCritical: true },
  UPDATE_PARTY_MEMBER_SENSITIVE:{ name: 'Cập nhật thông tin nhạy cảm đảng viên', module: 'PARTY',         actionType: 'UPDATE', isCritical: true },
  VIEW_PARTY_ORG:              { name: 'Xem cơ cấu tổ chức Đảng',            module: 'PARTY',             actionType: 'VIEW' },
  CREATE_PARTY_ORG:            { name: 'Tạo tổ chức Đảng',                    module: 'PARTY',             actionType: 'CREATE', isCritical: true },
  UPDATE_PARTY_ORG:            { name: 'Cập nhật tổ chức Đảng',               module: 'PARTY',             actionType: 'UPDATE' },
  VIEW_PARTY_MEETING:          { name: 'Xem cuộc họp Đảng',                   module: 'PARTY',             actionType: 'VIEW' },
  MANAGE_PARTY_MEETING:        { name: 'Quản lý sinh hoạt Đảng',              module: 'PARTY',             actionType: 'UPDATE' },
  VIEW_PARTY_ACTIVITY:         { name: 'Xem hoạt động chi bộ',                module: 'PARTY',             actionType: 'VIEW' },
  MANAGE_PARTY_ACTIVITY:       { name: 'Quản lý hoạt động chi bộ',            module: 'PARTY',             actionType: 'UPDATE' },
  CREATE_PARTY_ACTIVITY:       { name: 'Tạo hoạt động chi bộ',                module: 'PARTY',             actionType: 'CREATE' },
  VIEW_PARTY_FEE:              { name: 'Xem đảng phí',                        module: 'PARTY',             actionType: 'VIEW' },
  MANAGE_PARTY_FEE:            { name: 'Quản lý đảng phí',                    module: 'PARTY',             actionType: 'UPDATE' },
  VIEW_PARTY_REVIEW:           { name: 'Xem đánh giá đảng viên',              module: 'PARTY',             actionType: 'VIEW' },
  MANAGE_PARTY_REVIEW:         { name: 'Quản lý đánh giá đảng viên',          module: 'PARTY',             actionType: 'UPDATE' },
  VIEW_PARTY_EVALUATION:       { name: 'Xem xếp loại đảng viên',              module: 'PARTY',             actionType: 'VIEW' },
  CREATE_PARTY_EVALUATION:     { name: 'Lập phiếu đánh giá đảng viên',        module: 'PARTY',             actionType: 'CREATE' },
  APPROVE_PARTY_EVALUATION:    { name: 'Phê duyệt đánh giá đảng viên',        module: 'PARTY',             actionType: 'APPROVE' },
  VIEW_PARTY_DISCIPLINE:       { name: 'Xem kỷ luật đảng viên',               module: 'PARTY',             actionType: 'VIEW' },
  APPROVE_PARTY_DISCIPLINE:    { name: 'Phê duyệt kỷ luật đảng viên',         module: 'PARTY',             actionType: 'APPROVE', isCritical: true },
  VIEW_PARTY_TRANSFER:         { name: 'Xem chuyển sinh hoạt Đảng',           module: 'PARTY',             actionType: 'VIEW' },
  APPROVE_PARTY_TRANSFER:      { name: 'Phê duyệt chuyển sinh hoạt Đảng',     module: 'PARTY',             actionType: 'APPROVE', isCritical: true },
  VIEW_PARTY_ADMISSION:        { name: 'Xem hồ sơ kết nạp Đảng',              module: 'PARTY',             actionType: 'VIEW' },
  SUBMIT_PARTY_ADMISSION:      { name: 'Nộp hồ sơ kết nạp Đảng',              module: 'PARTY',             actionType: 'SUBMIT' },
  APPROVE_PARTY_ADMISSION:     { name: 'Phê duyệt kết nạp đảng viên',         module: 'PARTY',             actionType: 'APPROVE', isCritical: true },
  VIEW_PARTY_INSPECTION:       { name: 'Xem kiểm tra Đảng',                   module: 'PARTY',             actionType: 'VIEW' },
  MANAGE_PARTY_INSPECTION:     { name: 'Quản lý kiểm tra Đảng',               module: 'PARTY',             actionType: 'UPDATE', isCritical: true },
  VIEW_PARTY_DASHBOARD:        { name: 'Xem dashboard Đảng',                  module: 'PARTY',             actionType: 'VIEW' },
  VIEW_PARTY_REPORT:           { name: 'Xem báo cáo Đảng',                    module: 'PARTY',             actionType: 'VIEW' },
  EXPORT_PARTY_REPORT:         { name: 'Xuất báo cáo Đảng',                   module: 'PARTY',             actionType: 'EXPORT' },
  EXPORT_PARTY:                { name: 'Xuất báo cáo tổng hợp Đảng',          module: 'PARTY',             actionType: 'EXPORT' },

  // ── POLICY ──
  VIEW_POLICY:                 { name: 'Xem chính sách phúc lợi',             module: 'POLICY',            actionType: 'VIEW' },
  CREATE_POLICY:               { name: 'Tạo hồ sơ chính sách',                module: 'POLICY',            actionType: 'CREATE' },
  CREATE_POLICY_REQUEST:       { name: 'Gửi yêu cầu hưởng chính sách',        module: 'POLICY',            actionType: 'SUBMIT' },
  UPDATE_POLICY:               { name: 'Cập nhật hồ sơ chính sách',           module: 'POLICY',            actionType: 'UPDATE' },
  DELETE_POLICY:               { name: 'Xóa hồ sơ chính sách',                module: 'POLICY',            actionType: 'DELETE' },
  APPROVE_POLICY:              { name: 'Phê duyệt hồ sơ chính sách',          module: 'POLICY',            actionType: 'APPROVE', isCritical: true },
  REJECT_POLICY:               { name: 'Từ chối hồ sơ chính sách',            module: 'POLICY',            actionType: 'REJECT' },
  REVIEW_POLICY:               { name: 'Xét duyệt hồ sơ chính sách',          module: 'POLICY',            actionType: 'APPROVE' },
  EXPORT_POLICY:               { name: 'Xuất báo cáo chính sách',             module: 'POLICY',            actionType: 'EXPORT' },

  // ── INSURANCE ──
  VIEW_INSURANCE:              { name: 'Xem hồ sơ bảo hiểm',                  module: 'INSURANCE',         actionType: 'VIEW' },
  CREATE_INSURANCE:            { name: 'Tạo hồ sơ bảo hiểm',                  module: 'INSURANCE',         actionType: 'CREATE' },
  UPDATE_INSURANCE:            { name: 'Cập nhật thông tin bảo hiểm',          module: 'INSURANCE',         actionType: 'UPDATE' },
  DELETE_INSURANCE:            { name: 'Xóa hồ sơ bảo hiểm',                  module: 'INSURANCE',         actionType: 'DELETE' },
  APPROVE_INSURANCE_CLAIM:     { name: 'Phê duyệt yêu cầu bảo hiểm',          module: 'INSURANCE',         actionType: 'APPROVE', isCritical: true },
  EXPORT_INSURANCE:            { name: 'Xuất báo cáo bảo hiểm',               module: 'INSURANCE',         actionType: 'EXPORT' },
  IMPORT_INSURANCE:            { name: 'Nhập dữ liệu bảo hiểm',               module: 'INSURANCE',         actionType: 'IMPORT' },

  // ── AWARDS ──
  VIEW_AWARD:                  { name: 'Xem danh sách khen thưởng',            module: 'AWARDS',            actionType: 'VIEW' },
  CREATE_AWARD:                { name: 'Đề xuất khen thưởng',                  module: 'AWARDS',            actionType: 'CREATE' },
  UPDATE_AWARD:                { name: 'Cập nhật hồ sơ khen thưởng',           module: 'AWARDS',            actionType: 'UPDATE' },
  DELETE_AWARD:                { name: 'Xóa hồ sơ khen thưởng',               module: 'AWARDS',            actionType: 'DELETE' },
  APPROVE_AWARD:               { name: 'Phê duyệt khen thưởng',               module: 'AWARDS',            actionType: 'APPROVE', isCritical: true },
  EXPORT_AWARD:                { name: 'Xuất báo cáo khen thưởng',             module: 'AWARDS',            actionType: 'EXPORT' },
  VIEW_DISCIPLINE:             { name: 'Xem danh sách kỷ luật',                module: 'AWARDS',            actionType: 'VIEW' },
  CREATE_DISCIPLINE:           { name: 'Lập hồ sơ kỷ luật',                   module: 'AWARDS',            actionType: 'CREATE', isCritical: true },
  APPROVE_DISCIPLINE:          { name: 'Phê duyệt kỷ luật',                   module: 'AWARDS',            actionType: 'APPROVE', isCritical: true },

  // ── STUDENT ──
  VIEW_STUDENT:                { name: 'Xem danh sách học viên',               module: 'STUDENT',           actionType: 'VIEW' },
  VIEW_STUDENT_DETAIL:         { name: 'Xem chi tiết hồ sơ học viên',          module: 'STUDENT',           actionType: 'VIEW' },
  CREATE_STUDENT:              { name: 'Nhập học viên mới',                    module: 'STUDENT',           actionType: 'CREATE' },
  UPDATE_STUDENT:              { name: 'Cập nhật thông tin học viên',           module: 'STUDENT',           actionType: 'UPDATE' },
  DELETE_STUDENT:              { name: 'Xóa hồ sơ học viên',                  module: 'STUDENT',           actionType: 'DELETE', isCritical: true },
  EXPORT_STUDENT:              { name: 'Xuất danh sách học viên',              module: 'STUDENT',           actionType: 'EXPORT' },
  VIEW_STUDENT_GRADE:          { name: 'Xem kết quả học tập học viên',         module: 'STUDENT',           actionType: 'VIEW' },
  VIEW_STUDENT_CONDUCT:        { name: 'Xem rèn luyện học viên',               module: 'STUDENT',           actionType: 'VIEW' },
  MANAGE_STUDENT_CONDUCT:      { name: 'Quản lý rèn luyện học viên',           module: 'STUDENT',           actionType: 'UPDATE' },
  VIEW_STUDENT_GPA:            { name: 'Xem GPA học viên',                     module: 'STUDENT',           actionType: 'VIEW' },
  MANAGE_STUDENT_GPA:          { name: 'Quản lý GPA học viên',                 module: 'STUDENT',           actionType: 'UPDATE', isCritical: true },
  VIEW_STUDENT_DASHBOARD:      { name: 'Xem dashboard học viên',               module: 'STUDENT',           actionType: 'VIEW' },
  VIEW_STUDENT_PROFILE360:     { name: 'Xem hồ sơ 360° học viên',             module: 'STUDENT',           actionType: 'VIEW' },

  // ── FACULTY ──
  VIEW_FACULTY:                { name: 'Xem danh sách giảng viên',             module: 'FACULTY',           actionType: 'VIEW' },
  VIEW_FACULTY_DETAIL:         { name: 'Xem chi tiết hồ sơ giảng viên',        module: 'FACULTY',           actionType: 'VIEW' },
  CREATE_FACULTY:              { name: 'Thêm giảng viên mới',                  module: 'FACULTY',           actionType: 'CREATE' },
  UPDATE_FACULTY:              { name: 'Cập nhật hồ sơ giảng viên',            module: 'FACULTY',           actionType: 'UPDATE' },
  DELETE_FACULTY:              { name: 'Xóa hồ sơ giảng viên',                module: 'FACULTY',           actionType: 'DELETE' },
  EXPORT_FACULTY:              { name: 'Xuất danh sách giảng viên',            module: 'FACULTY',           actionType: 'EXPORT' },
  IMPORT_FACULTY:              { name: 'Nhập dữ liệu giảng viên',              module: 'FACULTY',           actionType: 'IMPORT' },
  VIEW_FACULTY_RESEARCH:       { name: 'Xem nghiên cứu của giảng viên',        module: 'FACULTY',           actionType: 'VIEW' },
  VIEW_FACULTY_STATS:          { name: 'Xem thống kê giảng viên',              module: 'FACULTY',           actionType: 'VIEW' },
  VIEW_FACULTY_INSTRUCTORS:    { name: 'Xem danh sách giảng viên khoa',        module: 'FACULTY',           actionType: 'VIEW' },
  VIEW_FACULTY_CLASSES:        { name: 'Xem lớp do giảng viên phụ trách',      module: 'FACULTY',           actionType: 'VIEW' },
  VIEW_FACULTY_PERFORMANCE:    { name: 'Xem hiệu suất giảng dạy',              module: 'FACULTY',           actionType: 'VIEW' },
  VIEW_FACULTY_EIS:            { name: 'Xem điểm EIS giảng viên',              module: 'FACULTY',           actionType: 'VIEW' },
  MANAGE_FACULTY_EIS:          { name: 'Quản lý điểm EIS giảng viên',          module: 'FACULTY',           actionType: 'UPDATE', isCritical: true },
  VIEW_FACULTY_PROFILE360:     { name: 'Xem hồ sơ 360° giảng viên',           module: 'FACULTY',           actionType: 'VIEW' },
  VIEW_FACULTY_WORKLOAD:       { name: 'Xem tải giảng giảng viên',             module: 'FACULTY',           actionType: 'VIEW' },
  MANAGE_FACULTY_WORKLOAD:     { name: 'Quản lý tải giảng giảng viên',         module: 'FACULTY',           actionType: 'UPDATE' },

  // ── DATA ──
  VIEW_DATA:                   { name: 'Xem dữ liệu BigData',                  module: 'DATA',              actionType: 'VIEW' },
  CREATE_DATA:                 { name: 'Tải lên dữ liệu mới',                  module: 'DATA',              actionType: 'CREATE' },
  UPDATE_DATA:                 { name: 'Cập nhật dữ liệu',                     module: 'DATA',              actionType: 'UPDATE' },
  DELETE_DATA:                 { name: 'Xóa dữ liệu',                          module: 'DATA',              actionType: 'DELETE', isCritical: true },
  EXPORT_DATALAKE:             { name: 'Xuất dữ liệu BigData',                 module: 'DATA',              actionType: 'EXPORT' },
  IMPORT_DATA:                 { name: 'Nhập dữ liệu vào BigData',              module: 'DATA',              actionType: 'IMPORT' },
  QUERY_DATA:                  { name: 'Truy vấn dữ liệu BigData',              module: 'DATA',              actionType: 'VIEW' },
  VIEW_ETL:                    { name: 'Xem ETL Workflow',                      module: 'DATA',              actionType: 'VIEW' },
  VIEW_ETL_LOGS:               { name: 'Xem log ETL',                          module: 'DATA',              actionType: 'VIEW' },
  CREATE_ETL:                  { name: 'Tạo ETL Workflow',                      module: 'DATA',              actionType: 'CREATE' },
  UPDATE_ETL:                  { name: 'Cập nhật ETL Workflow',                 module: 'DATA',              actionType: 'UPDATE' },
  DELETE_ETL:                  { name: 'Xóa ETL Workflow',                      module: 'DATA',              actionType: 'DELETE' },
  EXECUTE_ETL:                 { name: 'Chạy ETL Workflow',                     module: 'DATA',              actionType: 'UPDATE', isCritical: true },
  VIEW_GOVERNANCE:             { name: 'Xem quản trị dữ liệu',                 module: 'DATA',              actionType: 'VIEW' },
  VIEW_GOVERNANCE_COMPLIANCE:  { name: 'Xem tuân thủ dữ liệu',                 module: 'DATA',              actionType: 'VIEW' },
  VIEW_GOVERNANCE_LINEAGE:     { name: 'Xem data lineage',                     module: 'DATA',              actionType: 'VIEW' },
  VIEW_GOVERNANCE_RETENTION:   { name: 'Xem chính sách lưu trữ dữ liệu',       module: 'DATA',              actionType: 'VIEW' },
  MANAGE_GOVERNANCE:           { name: 'Quản lý quản trị dữ liệu',             module: 'DATA',              actionType: 'UPDATE', isCritical: true },

  // ── DASHBOARD ──
  VIEW_DASHBOARD:              { name: 'Xem Dashboard tổng quan',              module: 'DASHBOARD',         actionType: 'VIEW' },
  VIEW_DASHBOARD_COMMAND:      { name: 'Xem Dashboard chỉ huy',                module: 'DASHBOARD',         actionType: 'VIEW' },
  VIEW_DASHBOARD_ADMIN:        { name: 'Xem Dashboard quản trị',               module: 'DASHBOARD',         actionType: 'VIEW' },
  VIEW_DASHBOARD_FACULTY:      { name: 'Xem Dashboard giảng viên',             module: 'DASHBOARD',         actionType: 'VIEW' },
  VIEW_DASHBOARD_STUDENT:      { name: 'Xem Dashboard học viên',               module: 'DASHBOARD',         actionType: 'VIEW' },

  // ── SYSTEM ──
  MANAGE_USERS:                { name: 'Quản lý tài khoản người dùng',         module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  VIEW_USERS:                  { name: 'Xem danh sách người dùng',             module: 'SYSTEM',            actionType: 'VIEW' },
  RESET_USER_PASSWORD:         { name: 'Đặt lại mật khẩu người dùng',          module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  TOGGLE_USER_STATUS:          { name: 'Khóa / Mở khóa tài khoản',            module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  MANAGE_UNITS:                { name: 'Quản lý đơn vị tổ chức',               module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  VIEW_UNITS:                  { name: 'Xem sơ đồ tổ chức đơn vị',            module: 'SYSTEM',            actionType: 'VIEW' },
  ASSIGN_PERSONNEL_TO_UNIT:    { name: 'Gán nhân sự vào đơn vị',               module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  VIEW_INFRASTRUCTURE:         { name: 'Xem cấu hình hạ tầng',                 module: 'SYSTEM',            actionType: 'VIEW' },
  MANAGE_INFRASTRUCTURE:       { name: 'Quản lý cấu hình hạ tầng',             module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  VIEW_RBAC:                   { name: 'Xem cấu hình phân quyền RBAC',         module: 'SYSTEM',            actionType: 'VIEW' },
  MANAGE_RBAC:                 { name: 'Quản lý phân quyền RBAC',              module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  MANAGE_POSITIONS:            { name: 'Quản lý chức vụ',                      module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  MANAGE_FUNCTIONS:            { name: 'Quản lý mã chức năng',                 module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  MANAGE_SOD:                  { name: 'Quản lý Separation of Duties',         module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  LINK_PERSONNEL:              { name: 'Liên kết tài khoản với cán bộ',        module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  VIEW_AUDIT_LOG:              { name: 'Xem nhật ký kiểm toán',                module: 'SYSTEM',            actionType: 'VIEW' },
  EXPORT_AUDIT_LOG:            { name: 'Xuất nhật ký kiểm toán',               module: 'SYSTEM',            actionType: 'EXPORT' },
  VIEW_AUDIT_LOGS:             { name: 'Xem nhật ký hệ thống',                 module: 'SYSTEM',            actionType: 'VIEW' },
  EXPORT_AUDIT_LOGS:           { name: 'Xuất nhật ký hệ thống',                module: 'SYSTEM',            actionType: 'EXPORT' },
  VIEW_AUDIT_SUSPICIOUS:       { name: 'Xem hoạt động bất thường',             module: 'SYSTEM',            actionType: 'VIEW' },
  VIEW_SYSTEM_HEALTH:          { name: 'Xem giám sát hệ thống',                module: 'SYSTEM',            actionType: 'VIEW' },
  VIEW_SYSTEM_STATS:           { name: 'Xem thống kê hệ thống',                module: 'SYSTEM',            actionType: 'VIEW' },
  MANAGE_API_GATEWAY:          { name: 'Quản lý API Gateway',                   module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  MANAGE_AI_CONFIG:            { name: 'Cấu hình AI & Machine Learning',        module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  MANAGE_BACKUP:               { name: 'Quản lý sao lưu dữ liệu',              module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  VIEW_DEPARTMENT:             { name: 'Xem thông tin khoa / phòng ban',        module: 'SYSTEM',            actionType: 'VIEW' },
  CREATE_DEPARTMENT:           { name: 'Tạo khoa / phòng ban mới',              module: 'SYSTEM',            actionType: 'CREATE' },
  UPDATE_DEPARTMENT:           { name: 'Cập nhật thông tin khoa / phòng ban',   module: 'SYSTEM',            actionType: 'UPDATE' },
  DELETE_DEPARTMENT:           { name: 'Xóa khoa / phòng ban',                  module: 'SYSTEM',            actionType: 'DELETE' },
  VIEW_MONITORING_ALERTS:      { name: 'Xem cảnh báo hệ thống',                module: 'SYSTEM',            actionType: 'VIEW' },
  MANAGE_MONITORING_ALERTS:    { name: 'Quản lý cảnh báo hệ thống',            module: 'SYSTEM',            actionType: 'UPDATE' },
  VIEW_MONITORING_SERVICES:    { name: 'Xem trạng thái dịch vụ',               module: 'SYSTEM',            actionType: 'VIEW' },
  MANAGE_MONITORING_SERVICES:  { name: 'Quản lý dịch vụ hệ thống',             module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  VIEW_ML_MODELS:              { name: 'Xem mô hình ML',                       module: 'SYSTEM',            actionType: 'VIEW' },
  MANAGE_ML_MODELS:            { name: 'Quản lý mô hình ML',                   module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  TRAIN_ML_MODELS:             { name: 'Huấn luyện mô hình ML',                module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  VIEW_SECURITY_POLICY:        { name: 'Xem chính sách bảo mật',               module: 'SYSTEM',            actionType: 'VIEW' },
  MANAGE_SECURITY_POLICY:      { name: 'Quản lý chính sách bảo mật',           module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  VIEW_AUTH_SESSIONS:          { name: 'Xem phiên đăng nhập',                  module: 'SYSTEM',            actionType: 'VIEW' },
  REVOKE_AUTH_SESSION:         { name: 'Thu hồi phiên đăng nhập',              module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  MANAGE_MASTER_DATA:          { name: 'Quản lý danh mục dùng chung',          module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  VIEW_THEME:                  { name: 'Xem cài đặt giao diện',                module: 'SYSTEM',            actionType: 'VIEW' },
  UPDATE_THEME:                { name: 'Cập nhật giao diện hệ thống',           module: 'SYSTEM',            actionType: 'UPDATE' },
  MANAGE_THEME_BRANDING:       { name: 'Quản lý thương hiệu hệ thống',         module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  VIEW_DOCUMENTS:              { name: 'Xem tài liệu',                         module: 'SYSTEM',            actionType: 'VIEW' },
  GENERATE_PDF_DOCUMENTS:      { name: 'Tạo tài liệu PDF',                     module: 'SYSTEM',            actionType: 'CREATE' },
  EXPORT_DOCUMENTS:            { name: 'Xuất tài liệu',                        module: 'SYSTEM',            actionType: 'EXPORT' },
  VIEW_DIGITAL_DOCS:           { name: 'Xem văn bản số',                       module: 'SYSTEM',            actionType: 'VIEW' },
  CREATE_DIGITAL_DOCS:         { name: 'Đăng ký văn bản mới',                  module: 'SYSTEM',            actionType: 'CREATE' },
  UPDATE_DIGITAL_DOCS:         { name: 'Cập nhật văn bản',                     module: 'SYSTEM',            actionType: 'UPDATE' },
  DELETE_DIGITAL_DOCS:         { name: 'Xóa văn bản',                          module: 'SYSTEM',            actionType: 'DELETE' },
  SEARCH_DIGITAL_DOCS:         { name: 'Tìm kiếm văn bản toàn văn',            module: 'SYSTEM',            actionType: 'VIEW' },
  OCR_DIGITAL_DOCS:            { name: 'Nhận dạng văn bản (OCR)',              module: 'SYSTEM',            actionType: 'CREATE' },
  DOWNLOAD_DIGITAL_DOCS:       { name: 'Tải văn bản số',                       module: 'SYSTEM',            actionType: 'VIEW' },
  APPROVE_DIGITAL_DOCS:        { name: 'Phê duyệt văn bản',                    module: 'SYSTEM',            actionType: 'APPROVE', isCritical: true },
  MANAGE_DIGITAL_DOCS:         { name: 'Quản lý kho văn bản số',               module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  VIEW_TEMPLATES:              { name: 'Xem thư viện mẫu báo cáo',             module: 'SYSTEM',            actionType: 'VIEW' },
  MANAGE_TEMPLATES:            { name: 'Quản lý mẫu báo cáo',                  module: 'SYSTEM',            actionType: 'UPDATE', isCritical: true },
  PREVIEW_TEMPLATES:           { name: 'Xem trước mẫu với dữ liệu thực',       module: 'SYSTEM',            actionType: 'VIEW' },
  EXPORT_BATCH:                { name: 'Xuất hàng loạt',                       module: 'SYSTEM',            actionType: 'EXPORT' },
  VIEW_EXPORT_JOBS:            { name: 'Xem lịch sử xuất dữ liệu',             module: 'SYSTEM',            actionType: 'VIEW' },
  RETRY_EXPORT_JOB:            { name: 'Thử lại xuất dữ liệu',                 module: 'SYSTEM',            actionType: 'UPDATE' },
  MANAGE_EXPORT_SCHEDULES:     { name: 'Quản lý lịch xuất định kỳ',            module: 'SYSTEM',            actionType: 'UPDATE' },
  VIEW_TEMPLATE_ANALYTICS:     { name: 'Xem thống kê sử dụng mẫu',             module: 'SYSTEM',            actionType: 'VIEW' },
  IMPORT_TEMPLATES:            { name: 'Nhập mẫu từ file Word/Excel',          module: 'SYSTEM',            actionType: 'IMPORT' },

  // ── AI ──
  USE_AI_CHAT:                 { name: 'Sử dụng AI Chat',                      module: 'AI',                actionType: 'VIEW' },
  VIEW_AI_INSIGHTS:            { name: 'Xem AI Insights',                      module: 'AI',                actionType: 'VIEW' },
  VIEW_AI_STUDENT_INSIGHTS:    { name: 'Xem AI phân tích học viên',            module: 'AI',                actionType: 'VIEW' },
  VIEW_AI_FACULTY_INSIGHTS:    { name: 'Xem AI phân tích giảng viên',          module: 'AI',                actionType: 'VIEW' },
  VIEW_AI_PERSONNEL_INSIGHTS:  { name: 'Xem AI phân tích cán bộ',              module: 'AI',                actionType: 'VIEW' },
  PREDICT_AI_RISK:             { name: 'Dự đoán rủi ro bằng AI',               module: 'AI',                actionType: 'VIEW' },
  ANALYZE_AI_TRENDS:           { name: 'Phân tích xu hướng bằng AI',           module: 'AI',                actionType: 'VIEW' },
  ANALYZE_AI_SENTIMENT:        { name: 'Phân tích cảm xúc bằng AI',           module: 'AI',                actionType: 'VIEW' },
  GENERATE_AI_REPORT:          { name: 'Tạo báo cáo tự động bằng AI',         module: 'AI',                actionType: 'CREATE' },
  VIEW_AI_RECOMMENDATIONS:     { name: 'Xem đề xuất từ AI',                   module: 'AI',                actionType: 'VIEW' },
  VIEW_AI_MONITOR:             { name: 'Giám sát hiệu suất AI',                module: 'AI',                actionType: 'VIEW' },
  VIEW_AI_EARLY_WARNINGS:      { name: 'Xem cảnh báo sớm từ AI',              module: 'AI',                actionType: 'VIEW' },
  ANALYZE_AI_FEEDBACK:         { name: 'Phân tích phản hồi bằng AI',          module: 'AI',                actionType: 'VIEW' },
  SUMMARIZE_AI:                { name: 'Tóm tắt nội dung bằng AI',            module: 'AI',                actionType: 'VIEW' },

  // ── WORKFLOW ──
  VIEW_WORKFLOW:               { name: 'Xem danh sách quy trình',              module: 'WORKFLOW',          actionType: 'VIEW' },
  VIEW_WORKFLOW_DETAIL:        { name: 'Xem chi tiết quy trình',               module: 'WORKFLOW',          actionType: 'VIEW' },
  VIEW_WORKFLOW_DEFS:          { name: 'Xem định nghĩa quy trình',             module: 'WORKFLOW',          actionType: 'VIEW' },
  MANAGE_WORKFLOW_DEFS:        { name: 'Quản lý định nghĩa quy trình',         module: 'WORKFLOW',          actionType: 'CREATE', isCritical: true },
  VIEW_ALL_WORKFLOW_INSTANCES: { name: 'Xem tất cả quy trình đang chạy',      module: 'WORKFLOW',          actionType: 'VIEW' },
  APPROVE_WORKFLOW:            { name: 'Phê duyệt bước quy trình',             module: 'WORKFLOW',          actionType: 'APPROVE', isCritical: true },
  REJECT_WORKFLOW:             { name: 'Từ chối bước quy trình',               module: 'WORKFLOW',          actionType: 'REJECT' },
  CANCEL_WORKFLOW:             { name: 'Hủy quy trình',                        module: 'WORKFLOW',          actionType: 'UPDATE', isCritical: true },
  MONITOR_WORKFLOW:            { name: 'Giám sát hiệu suất quy trình',         module: 'WORKFLOW',          actionType: 'VIEW' },
  'WF.INITIATE':               { name: 'Khởi tạo quy trình mới',              module: 'WORKFLOW',          actionType: 'SUBMIT' },
  'WF.ACT':                    { name: 'Thực hiện hành động quy trình',        module: 'WORKFLOW',          actionType: 'APPROVE', isCritical: true },
  'WF.SIGN':                   { name: 'Ký số điện tử trong quy trình',        module: 'WORKFLOW',          actionType: 'APPROVE', isCritical: true },
  'WF.DESIGN':                 { name: 'Thiết kế mẫu quy trình',              module: 'WORKFLOW',          actionType: 'CREATE', isCritical: true },
  'WF.OVERRIDE':               { name: 'Phê duyệt / Lưu trữ phiên bản quy trình', module: 'WORKFLOW',     actionType: 'UPDATE', isCritical: true },
  'WF.DASHBOARD':              { name: 'Xem dashboard quy trình toàn cục',     module: 'WORKFLOW',          actionType: 'VIEW' },
  'WF.EXPORT':                 { name: 'Xuất báo cáo quy trình',               module: 'WORKFLOW',          actionType: 'EXPORT' },

  // ── SCIENCE (M20-M26) ──
  VIEW_SCIENCE_CATALOG:        { name: 'Xem danh mục khoa học',               module: 'SCIENCE',           actionType: 'VIEW' },
  MANAGE_SCIENCE_CATALOG:      { name: 'Quản lý danh mục khoa học',           module: 'SCIENCE',           actionType: 'CREATE', isCritical: true },
  VIEW_SCIENTIST_PROFILE:      { name: 'Xem hồ sơ nhà khoa học',             module: 'SCIENCE',           actionType: 'VIEW' },
  MANAGE_SCIENTIST_PROFILE:    { name: 'Quản lý hồ sơ nhà khoa học',         module: 'SCIENCE',           actionType: 'UPDATE' },
  SYNC_ORCID:                  { name: 'Đồng bộ ORCID',                       module: 'SCIENCE',           actionType: 'IMPORT' },
  CREATE_RESEARCH_PROJECT:     { name: 'Tạo đề tài NCKH',                     module: 'SCIENCE',           actionType: 'CREATE' },
  APPROVE_RESEARCH_DEPT:       { name: 'Phê duyệt đề tài cấp phòng',         module: 'SCIENCE',           actionType: 'APPROVE', isCritical: true },
  APPROVE_RESEARCH_ACADEMY:    { name: 'Phê duyệt đề tài cấp học viện',      module: 'SCIENCE',           actionType: 'APPROVE', isCritical: true },
  CREATE_SCIENTIFIC_WORK:      { name: 'Tạo công trình khoa học',             module: 'SCIENCE',           actionType: 'CREATE' },
  IMPORT_FROM_CROSSREF:        { name: 'Import từ CrossRef / DOI',            module: 'SCIENCE',           actionType: 'IMPORT' },
  UPLOAD_LIBRARY:              { name: 'Upload tài liệu thư viện số',         module: 'SCIENCE',           actionType: 'CREATE' },
  DOWNLOAD_LIBRARY_NORMAL:     { name: 'Tải tài liệu thường',                 module: 'SCIENCE',           actionType: 'VIEW' },
  DOWNLOAD_LIBRARY_SECRET:     { name: 'Tải tài liệu mật',                   module: 'SCIENCE',           actionType: 'VIEW',   isCritical: true },
  MANAGE_RESEARCH_BUDGET:      { name: 'Quản lý kinh phí NCKH',               module: 'SCIENCE',           actionType: 'UPDATE' },
  APPROVE_BUDGET:              { name: 'Phê duyệt kinh phí NCKH',             module: 'SCIENCE',           actionType: 'APPROVE', isCritical: true },
  VIEW_BUDGET_FINANCE:         { name: 'Xem chi tiết tài chính NCKH',         module: 'SCIENCE',           actionType: 'VIEW',   isCritical: true },
  MANAGE_COUNCIL:              { name: 'Quản lý hội đồng khoa học',           module: 'SCIENCE',           actionType: 'CREATE', isCritical: true },
  SUBMIT_REVIEW:               { name: 'Nộp phản biện hội đồng',              module: 'SCIENCE',           actionType: 'SUBMIT' },
  FINALIZE_ACCEPTANCE:         { name: 'Kết luận nghiệm thu',                  module: 'SCIENCE',           actionType: 'APPROVE', isCritical: true },
  VIEW_SCIENCE_DASHBOARD:      { name: 'Xem dashboard khoa học',              module: 'SCIENCE',           actionType: 'VIEW' },
  VIEW_SCIENCE_DATA_QUALITY:   { name: 'Xem chất lượng dữ liệu KH',          module: 'SCIENCE',           actionType: 'VIEW' },
  USE_SCIENCE_SEARCH:          { name: 'Tìm kiếm thông minh KHQL',            module: 'SCIENCE',           actionType: 'VIEW' },
  USE_AI_SCIENCE:              { name: 'Dùng AI KHQL',                        module: 'SCIENCE',           actionType: 'VIEW' },
  USE_AI_SCIENCE_ADMIN:        { name: 'Admin AI KHQL',                       module: 'SCIENCE',           actionType: 'UPDATE', isCritical: true },
  EXPORT_SCIENCE_REPORT:       { name: 'Xuất báo cáo KHQL',                   module: 'SCIENCE',           actionType: 'EXPORT' },

  // ── PERSONAL (tự phục vụ) ──
  MANAGE_MY_PROFILE:           { name: 'Quản lý hồ sơ cá nhân',               module: 'PERSONAL',          actionType: 'UPDATE' },
  VIEW_MY_NOTIFICATIONS:       { name: 'Xem thông báo cá nhân',               module: 'PERSONAL',          actionType: 'VIEW' },
  VIEW_MY_TASKS:               { name: 'Xem công việc được giao',              module: 'PERSONAL',          actionType: 'VIEW' },
  MANAGE_MY_SECURITY:          { name: 'Quản lý bảo mật tài khoản cá nhân',   module: 'PERSONAL',          actionType: 'UPDATE' },
  VIEW_MY_CAREER_HISTORY:      { name: 'Xem lịch sử công tác cá nhân',        module: 'PERSONAL',          actionType: 'VIEW' },
  REQUEST_MY_INFO_UPDATE:      { name: 'Yêu cầu cập nhật thông tin cá nhân',  module: 'PERSONAL',          actionType: 'SUBMIT' },
  VIEW_MY_GRADE:               { name: 'Xem điểm học tập cá nhân',            module: 'PERSONAL',          actionType: 'VIEW' },
  VIEW_MY_CONDUCT:             { name: 'Xem điểm rèn luyện cá nhân',          module: 'PERSONAL',          actionType: 'VIEW' },
  VIEW_MY_SCHEDULE:            { name: 'Xem thời khóa biểu cá nhân',          module: 'PERSONAL',          actionType: 'VIEW' },
  VIEW_MY_GRADUATION:          { name: 'Xem kết quả tốt nghiệp cá nhân',      module: 'PERSONAL',          actionType: 'VIEW' },
  VIEW_MY_AWARD:               { name: 'Xem khen thưởng cá nhân',             module: 'PERSONAL',          actionType: 'VIEW' },
  VIEW_MY_POLICY:              { name: 'Xem chính sách phúc lợi cá nhân',     module: 'PERSONAL',          actionType: 'VIEW' },
  VIEW_MY_INSURANCE:           { name: 'Xem bảo hiểm cá nhân',               module: 'PERSONAL',          actionType: 'VIEW' },
  VIEW_MY_RESEARCH:            { name: 'Xem nghiên cứu cá nhân',              module: 'PERSONAL',          actionType: 'VIEW' },
  VIEW_MY_PUBLICATIONS:        { name: 'Xem công bố khoa học cá nhân',        module: 'PERSONAL',          actionType: 'VIEW' },

  // ── INFRA ──
  'INFRA.VIEW':                { name: 'Xem tổng quan hạ tầng',               module: 'INFRASTRUCTURE',    actionType: 'VIEW' },
  'INFRA.PIPELINE_VIEW':       { name: 'Xem pipeline definitions và runs',    module: 'INFRASTRUCTURE',    actionType: 'VIEW' },
  'INFRA.PIPELINE_MANAGE':     { name: 'Trigger và disable pipeline',         module: 'INFRASTRUCTURE',    actionType: 'UPDATE', isCritical: true },
  'INFRA.STORAGE_VIEW':        { name: 'Xem bucket config và usage',          module: 'INFRASTRUCTURE',    actionType: 'VIEW' },
  'INFRA.STORAGE_MANAGE':      { name: 'Sửa lifecycle/retention policy',      module: 'INFRASTRUCTURE',    actionType: 'UPDATE', isCritical: true },
  'INFRA.DATA_QUALITY_VIEW':   { name: 'Xem DQ rules và results',             module: 'INFRASTRUCTURE',    actionType: 'VIEW' },
  'INFRA.DATA_QUALITY_MANAGE': { name: 'Tạo/sửa data quality rules',         module: 'INFRASTRUCTURE',    actionType: 'UPDATE', isCritical: true },
  'INFRA.BACKUP_VIEW':         { name: 'Xem backup jobs và artifacts',        module: 'INFRASTRUCTURE',    actionType: 'VIEW' },
  'INFRA.BACKUP_MANAGE':       { name: 'Trigger backup thủ công',             module: 'INFRASTRUCTURE',    actionType: 'CREATE', isCritical: true },
  'INFRA.RESTORE_REQUEST':     { name: 'Yêu cầu restore',                     module: 'INFRASTRUCTURE',    actionType: 'CREATE', isCritical: true },
  'INFRA.RESTORE_MANAGE':      { name: 'Approve/verify restore',              module: 'INFRASTRUCTURE',    actionType: 'APPROVE', isCritical: true },
  'INFRA.DR_VIEW':             { name: 'Xem DR plans và exercises',           module: 'INFRASTRUCTURE',    actionType: 'VIEW' },
  'INFRA.DR_MANAGE':           { name: 'Tạo DR plan và ghi kết quả diễn tập', module: 'INFRASTRUCTURE',   actionType: 'UPDATE', isCritical: true },
  'INFRA.ALERT_VIEW':          { name: 'Xem metric threshold policies',       module: 'INFRASTRUCTURE',    actionType: 'VIEW' },
  'INFRA.ALERT_MANAGE':        { name: 'Sửa ngưỡng cảnh báo',                module: 'INFRASTRUCTURE',    actionType: 'UPDATE', isCritical: true },
  'INFRA.ADMIN':               { name: 'Toàn quyền module hạ tầng',           module: 'INFRASTRUCTURE',    actionType: 'UPDATE', isCritical: true },
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: POSITION DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
interface PosDef {
  code: string;
  name: string;
  description?: string;
  level: number;
  positionScope: 'ACADEMY' | 'UNIT';
}

const POSITIONS: PosDef[] = [
  // ── Quản trị ──
  { code: 'SYSTEM_ADMIN',          name: 'Quản trị hệ thống',                     description: 'Toàn quyền hệ thống',                                           level: 100, positionScope: 'ACADEMY' },

  // ── Cấp Học viện ──
  { code: 'GIAM_DOC',              name: 'Giám đốc Học viện',                     description: 'VIEW toàn bộ + APPROVE cấp học viện',                           level: 95,  positionScope: 'ACADEMY' },
  { code: 'CHINH_UY',              name: 'Chính ủy Học viện',                     description: 'VIEW toàn bộ, phụ trách chính trị tư tưởng',                   level: 93,  positionScope: 'ACADEMY' },
  { code: 'PHO_CHINH_UY',          name: 'Phó Chính ủy Học viện',                description: 'VIEW toàn bộ, hỗ trợ Chính ủy',                                level: 92,  positionScope: 'ACADEMY' },
  { code: 'PHO_GIAM_DOC',          name: 'Phó Giám đốc Học viện',                description: 'VIEW toàn bộ, phụ trách công tác được giao',                   level: 90,  positionScope: 'ACADEMY' },
  { code: 'PHO_GIAM_DOC_KH',       name: 'Phó Giám đốc phụ trách Khoa học',      description: 'VIEW domain nghiên cứu khoa học, giảng viên, giáo dục',        level: 88,  positionScope: 'ACADEMY' },
  { code: 'PHO_GIAM_DOC_HC_HCKT',  name: 'Phó Giám đốc phụ trách Hậu cần-KT',   description: 'VIEW domain nhân sự, bảo hiểm, chính sách',                    level: 87,  positionScope: 'ACADEMY' },

  // ── Cấp Khoa/Phòng ──
  { code: 'TRUONG_KHOA',           name: 'Trưởng Khoa',                           description: 'Quản lý cấp khoa: FACULTY + EDUCATION + RESEARCH',             level: 80,  positionScope: 'UNIT' },
  { code: 'PHO_TRUONG_KHOA',       name: 'Phó Trưởng Khoa',                       description: 'Hỗ trợ Trưởng Khoa, không APPROVE/DELETE',                     level: 78,  positionScope: 'UNIT' },
  { code: 'CHI_HUY_KHOA',          name: 'Chỉ huy Khoa',                          description: 'Quản lý cấp khoa tương đương Trưởng Khoa',                     level: 80,  positionScope: 'UNIT' },
  { code: 'TRUONG_PHONG_DANG',     name: 'Trưởng phòng Chính trị',                description: 'Full CRUD: PARTY + AWARDS + PERSONNEL',                        level: 70,  positionScope: 'UNIT' },
  { code: 'TRUONG_PHONG_DAO_TAO',  name: 'Trưởng phòng Đào tạo',                 description: 'Full CRUD: EDUCATION + STUDENT + TRAINING + EXAM',              level: 70,  positionScope: 'UNIT' },
  { code: 'TRUONG_PHONG_NHAN_SU',  name: 'Trưởng phòng Nhân sự/Hậu cần',         description: 'Full CRUD: PERSONNEL + INSURANCE + POLICY',                    level: 70,  positionScope: 'UNIT' },
  { code: 'TRUONG_PHONG_KHOA_HOC', name: 'Trưởng phòng Khoa học',                description: 'Full CRUD: RESEARCH + SCIENCE',                                 level: 70,  positionScope: 'UNIT' },
  { code: 'TRUONG_PHONG_CHINH_SACH',name: 'Trưởng phòng Chính sách',             description: 'Full CRUD: POLICY + INSURANCE',                                 level: 70,  positionScope: 'UNIT' },
  { code: 'PHO_TRUONG_PHONG',      name: 'Phó Trưởng phòng',                      description: 'VIEW + CREATE + UPDATE, không APPROVE/DELETE',                  level: 65,  positionScope: 'UNIT' },
  { code: 'CHI_HUY_PHONG',         name: 'Chỉ huy Phòng',                         description: 'Full CRUD PERSONNEL + INSURANCE + POLICY trong đơn vị',        level: 70,  positionScope: 'UNIT' },
  { code: 'B1_TRUONG_PHONG',       name: 'Trưởng ban Đào tạo (B1)',               description: 'Full CRUD tương đương Trưởng phòng Đào tạo',                   level: 68,  positionScope: 'UNIT' },
  { code: 'B2_TRUONG_PHONG',       name: 'Trưởng ban Khoa học (B2)',              description: 'Full CRUD: RESEARCH + SCIENCE',                                 level: 68,  positionScope: 'UNIT' },
  { code: 'B3_CNCT',               name: 'Chính trị viên Hệ (B3)',                description: 'PARTY + AWARDS + student conduct trong đơn vị',                 level: 68,  positionScope: 'UNIT' },
  { code: 'B3_PCNCT_BT',           name: 'Phó Chính trị viên Hệ (B3)',            description: 'PARTY + AWARDS, giới hạn DELETE',                              level: 65,  positionScope: 'UNIT' },

  // ── Cấp Hệ/Tiểu đoàn/Ban ──
  { code: 'CHI_HUY_HE',            name: 'Hệ trưởng',                             description: 'Quản lý học viên và rèn luyện trong Hệ',                       level: 75,  positionScope: 'UNIT' },
  { code: 'CHI_HUY_TIEU_DOAN',     name: 'Chỉ huy Tiểu đoàn',                    description: 'Quản lý cấp tiểu đoàn',                                        level: 74,  positionScope: 'UNIT' },
  { code: 'CHI_HUY_BAN',           name: 'Chỉ huy Ban',                           description: 'Quản lý cấp ban',                                              level: 73,  positionScope: 'UNIT' },

  // ── Cấp Bộ môn ──
  { code: 'CHI_HUY_BO_MON',        name: 'Chỉ huy Bộ môn',                       description: 'Quản lý cấp bộ môn',                                           level: 72,  positionScope: 'UNIT' },
  { code: 'CHU_NHIEM_BO_MON',      name: 'Chủ nhiệm Bộ môn',                      description: 'Tương thích dữ liệu cũ, tương đương CHI_HUY_BO_MON',          level: 71,  positionScope: 'UNIT' },
  { code: 'PHO_CHU_NHIEM_BM',      name: 'Phó Chủ nhiệm Bộ môn',                 description: 'Hỗ trợ Chủ nhiệm Bộ môn',                                     level: 70,  positionScope: 'UNIT' },

  // ── Cán bộ chuyên môn ──
  { code: 'GIANG_VIEN',            name: 'Giảng viên',                            description: 'Giảng dạy và quản lý học vụ trong phạm vi đơn vị',             level: 50,  positionScope: 'UNIT' },
  { code: 'GIANG_VIEN_CHINH',      name: 'Giảng viên chính',                      description: 'Giảng viên có thâm niên, tương đương GIANG_VIEN',              level: 52,  positionScope: 'UNIT' },
  { code: 'TRO_GIANG',             name: 'Trợ giảng',                             description: 'Hỗ trợ giảng dạy, quyền tương đương GIANG_VIEN',              level: 48,  positionScope: 'UNIT' },
  { code: 'NGHIEN_CUU_VIEN',       name: 'Nghiên cứu viên',                       description: 'Nghiên cứu khoa học, tập trung RESEARCH + SCIENCE',            level: 50,  positionScope: 'UNIT' },
  { code: 'TRO_LY',                name: 'Trợ lý',                                description: 'Hỗ trợ nghiệp vụ hành chính',                                 level: 45,  positionScope: 'UNIT' },
  { code: 'NHAN_VIEN',             name: 'Nhân viên',                             description: 'Nhân viên nghiệp vụ',                                          level: 40,  positionScope: 'UNIT' },
  { code: 'CHUYEN_VIEN',           name: 'Chuyên viên',                           description: 'Chuyên viên nghiệp vụ, VIEW + CREATE',                         level: 42,  positionScope: 'UNIT' },
  { code: 'KY_THUAT_VIEN',         name: 'Kỹ thuật viên',                         description: 'Hỗ trợ kỹ thuật, giám sát hệ thống',                          level: 35,  positionScope: 'UNIT' },
  { code: 'CAN_BO_DANG',           name: 'Cán bộ Đảng',                           description: 'Cán bộ chuyên trách đảng vụ tại cơ quan chính trị',           level: 42,  positionScope: 'UNIT' },
  { code: 'CAN_BO_TO_CHUC',        name: 'Cán bộ Tổ chức',                        description: 'Cán bộ chuyên trách công tác tổ chức',                         level: 42,  positionScope: 'UNIT' },
  { code: 'CAN_BO_TAI_CHINH',      name: 'Cán bộ Tài chính',                      description: 'Cán bộ kế toán/tài chính, INSURANCE + POLICY',                 level: 42,  positionScope: 'UNIT' },
  { code: 'CAN_BO_THU_VIEN',       name: 'Cán bộ Thư viện',                       description: 'Quản lý học liệu và kho tài liệu',                             level: 42,  positionScope: 'UNIT' },

  // ── Người học ──
  { code: 'HOC_VIEN_QUAN_SU',      name: 'Học viên quân sự',                      description: 'Học viên hệ chỉ huy, chỉ xem hồ sơ cá nhân',                  level: 10,  positionScope: 'UNIT' },
  { code: 'HOC_VIEN_CAO_HOC',      name: 'Học viên cao học',                      description: 'Học viên sau đại học, chỉ xem hồ sơ cá nhân',                 level: 10,  positionScope: 'UNIT' },
  { code: 'SINH_VIEN',             name: 'Sinh viên dân sự',                       description: 'Sinh viên cử nhân, chỉ xem hồ sơ học tập cá nhân',            level: 10,  positionScope: 'UNIT' },
  { code: 'SINH_VIEN_DAN_SU',      name: 'Sinh viên dân sự (alias)',               description: 'Alias cho SINH_VIEN để tương thích cũ',                        level: 10,  positionScope: 'UNIT' },
  { code: 'GUEST',                 name: 'Khách',                                  description: 'Chỉ xem dashboard cơ bản',                                     level: 1,   positionScope: 'UNIT' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: PERMISSION PREDICATES
// Each returns true if a function should be granted to the position
// ─────────────────────────────────────────────────────────────────────────────
function m(fn: FDef) { return fn.module.toUpperCase(); }
function at(fn: FDef) { return fn.actionType; }

const VIEW_EXPORT = new Set(['VIEW', 'EXPORT']);
const VIEW_EXPORT_DOWNLOAD = new Set(['VIEW', 'EXPORT', 'DOWNLOAD']);
const CRUD_NO_DELETE_APPROVE = new Set(['VIEW', 'CREATE', 'UPDATE', 'EXPORT', 'IMPORT', 'SUBMIT']);

function allowSystemAdmin(_fn: FDef): boolean { return true; }

function allowGiamDoc(fn: FDef): boolean {
  if (m(fn) === 'SYSTEM') return at(fn) === 'VIEW';
  if (m(fn) === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD' || fn.code === 'VIEW_DASHBOARD_COMMAND';
  if (m(fn) === 'PERSONAL') return true;
  if (m(fn) === 'INFRASTRUCTURE') return VIEW_EXPORT_DOWNLOAD.has(at(fn));
  if (VIEW_EXPORT_DOWNLOAD.has(at(fn))) return true;
  const approveModules = new Set(['RESEARCH', 'SCIENCE', 'EDUCATION', 'AWARDS', 'POLICY', 'PARTY', 'WORKFLOW']);
  if (approveModules.has(m(fn)) && ['APPROVE', 'REJECT'].includes(at(fn))) return true;
  return ['FINALIZE_ACCEPTANCE', 'WF.OVERRIDE', 'EVALUATE_RESEARCH'].includes(fn.code);
}

function allowPhoGiamDoc(fn: FDef): boolean {
  if (m(fn) === 'SYSTEM') return at(fn) === 'VIEW';
  if (m(fn) === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD' || fn.code === 'VIEW_DASHBOARD_COMMAND';
  if (m(fn) === 'PERSONAL') return true;
  if (m(fn) === 'INFRASTRUCTURE') return VIEW_EXPORT_DOWNLOAD.has(at(fn));
  return VIEW_EXPORT_DOWNLOAD.has(at(fn));
}

function allowPhoGiamDocKH(fn: FDef): boolean {
  const mods = new Set(['RESEARCH', 'SCIENCE', 'FACULTY', 'EDUCATION', 'PERSONAL']);
  if (m(fn) === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD' || fn.code === 'VIEW_DASHBOARD_COMMAND';
  if (!mods.has(m(fn))) return false;
  return VIEW_EXPORT_DOWNLOAD.has(at(fn));
}

function allowPhoGiamDocHCHCKT(fn: FDef): boolean {
  const mods = new Set(['PERSONNEL', 'INSURANCE', 'POLICY', 'AWARDS', 'PERSONAL']);
  if (m(fn) === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD' || fn.code === 'VIEW_DASHBOARD_COMMAND';
  if (!mods.has(m(fn))) return false;
  return VIEW_EXPORT_DOWNLOAD.has(at(fn));
}

function allowTruongKhoa(fn: FDef): boolean {
  if (m(fn) === 'SYSTEM') return VIEW_EXPORT.has(at(fn));
  if (m(fn) === 'DASHBOARD') return ['VIEW_DASHBOARD', 'VIEW_DASHBOARD_COMMAND', 'VIEW_DASHBOARD_FACULTY'].includes(fn.code);
  if (m(fn) === 'PERSONAL') return true;
  if (m(fn) === 'INFRASTRUCTURE') return false;
  return ['VIEW', 'CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'EXPORT', 'IMPORT', 'SUBMIT'].includes(at(fn));
}

function allowTruongPhongDang(fn: FDef): boolean {
  if (m(fn) === 'PARTY' || m(fn) === 'AWARDS') return true;
  if (m(fn) === 'PERSONNEL') return true;
  if (m(fn) === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m(fn) === 'PERSONAL') return true;
  if (m(fn) === 'WORKFLOW') return ['VIEW', 'SUBMIT', 'APPROVE', 'REJECT'].includes(at(fn));
  return false;
}

function allowTruongPhongDaoTao(fn: FDef): boolean {
  const fullMods = new Set(['EDUCATION', 'STUDENT', 'TRAINING', 'EXAM', 'QUESTION_BANK', 'LEARNING_MATERIAL']);
  if (fullMods.has(m(fn))) return true;
  if (m(fn) === 'FACULTY') return VIEW_EXPORT.has(at(fn));
  if (m(fn) === 'PERSONNEL') return VIEW_EXPORT.has(at(fn));
  if (m(fn) === 'DASHBOARD') return ['VIEW_DASHBOARD', 'VIEW_DASHBOARD_FACULTY', 'VIEW_DASHBOARD_STUDENT'].includes(fn.code);
  if (m(fn) === 'PERSONAL') return true;
  if (m(fn) === 'WORKFLOW') return ['VIEW', 'SUBMIT', 'APPROVE', 'REJECT'].includes(at(fn));
  return false;
}

function allowTruongPhongNhanSu(fn: FDef): boolean {
  const fullMods = new Set(['PERSONNEL', 'INSURANCE', 'POLICY']);
  if (fullMods.has(m(fn))) return true;
  if (m(fn) === 'AWARDS') return VIEW_EXPORT.has(at(fn));
  if (m(fn) === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m(fn) === 'PERSONAL') return true;
  if (m(fn) === 'WORKFLOW') return ['VIEW', 'SUBMIT', 'APPROVE', 'REJECT'].includes(at(fn));
  return false;
}

function allowTruongPhongKhoaHoc(fn: FDef): boolean {
  const fullMods = new Set(['RESEARCH', 'SCIENCE']);
  if (fullMods.has(m(fn))) return true;
  if (m(fn) === 'FACULTY') return VIEW_EXPORT.has(at(fn));
  if (m(fn) === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m(fn) === 'PERSONAL') return true;
  if (m(fn) === 'WORKFLOW') return ['VIEW', 'SUBMIT', 'APPROVE', 'REJECT'].includes(at(fn));
  return false;
}

function allowTruongPhongChinhSach(fn: FDef): boolean {
  if (m(fn) === 'POLICY' || m(fn) === 'INSURANCE') return true;
  if (m(fn) === 'PERSONNEL') return VIEW_EXPORT.has(at(fn));
  if (m(fn) === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m(fn) === 'PERSONAL') return true;
  if (m(fn) === 'WORKFLOW') return ['VIEW', 'SUBMIT', 'APPROVE', 'REJECT'].includes(at(fn));
  return false;
}

function allowPhoTruongPhong(fn: FDef): boolean {
  if (m(fn) === 'PERSONNEL' || m(fn) === 'INSURANCE' || m(fn) === 'POLICY') return CRUD_NO_DELETE_APPROVE.has(at(fn));
  if (m(fn) === 'AWARDS') return VIEW_EXPORT.has(at(fn));
  if (m(fn) === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m(fn) === 'PERSONAL') return true;
  return false;
}

function allowChiHuyHe(fn: FDef): boolean {
  if (m(fn) === 'STUDENT') return true;
  if (m(fn) === 'EDUCATION') return at(fn) === 'VIEW' || fn.code === 'MANAGE_CONDUCT';
  if (m(fn) === 'TRAINING') return VIEW_EXPORT.has(at(fn));
  if (m(fn) === 'PERSONNEL') return VIEW_EXPORT.has(at(fn));
  if (m(fn) === 'PARTY') return at(fn) === 'VIEW';
  if (m(fn) === 'AWARDS') return VIEW_EXPORT.has(at(fn));
  if (m(fn) === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m(fn) === 'PERSONAL') return true;
  return false;
}

function allowChiHuyBoMon(fn: FDef): boolean {
  if (m(fn) === 'SYSTEM') return at(fn) === 'VIEW';
  if (m(fn) === 'DASHBOARD') return ['VIEW_DASHBOARD', 'VIEW_DASHBOARD_FACULTY'].includes(fn.code);
  if (m(fn) === 'PERSONAL') return true;
  if (m(fn) === 'INFRASTRUCTURE') return false;
  return ['VIEW', 'CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'EXPORT', 'IMPORT', 'SUBMIT'].includes(at(fn));
}

function allowGiangVien(fn: FDef): boolean {
  const mods = new Set(['TRAINING', 'EDUCATION', 'FACULTY', 'RESEARCH', 'QUESTION_BANK', 'LEARNING_MATERIAL', 'DASHBOARD', 'AI', 'PERSONAL']);
  if (!mods.has(m(fn))) return false;
  if (m(fn) === 'DASHBOARD') return ['VIEW_DASHBOARD', 'VIEW_DASHBOARD_FACULTY'].includes(fn.code);
  if (m(fn) === 'PERSONAL') return true;
  return ['VIEW', 'CREATE', 'UPDATE', 'SUBMIT', 'EXPORT', 'IMPORT'].includes(at(fn));
}

function allowNghienCuuVien(fn: FDef): boolean {
  const mods = new Set(['RESEARCH', 'SCIENCE', 'FACULTY', 'DASHBOARD', 'AI', 'PERSONAL']);
  if (!mods.has(m(fn))) return false;
  if (m(fn) === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m(fn) === 'PERSONAL') return true;
  return ['VIEW', 'CREATE', 'UPDATE', 'SUBMIT', 'EXPORT', 'IMPORT'].includes(at(fn));
}

function allowCanBoDang(fn: FDef): boolean {
  if (m(fn) === 'PARTY') return !['DELETE', 'APPROVE'].includes(at(fn));
  if (m(fn) === 'AWARDS') return ['VIEW', 'CREATE', 'EXPORT'].includes(at(fn));
  if (m(fn) === 'PERSONNEL') return ['VIEW', 'CREATE', 'EXPORT'].includes(at(fn));
  if (m(fn) === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m(fn) === 'PERSONAL') return true;
  return false;
}

function allowCanBoTaiChinh(fn: FDef): boolean {
  if (m(fn) === 'INSURANCE') return true;
  if (m(fn) === 'POLICY') return ['VIEW', 'CREATE', 'UPDATE', 'EXPORT'].includes(at(fn));
  if (m(fn) === 'AWARDS') return VIEW_EXPORT.has(at(fn));
  if (m(fn) === 'PERSONNEL') return VIEW_EXPORT.has(at(fn));
  if (m(fn) === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m(fn) === 'PERSONAL') return true;
  return false;
}

function allowCanBoThuVien(fn: FDef): boolean {
  if (m(fn) === 'LEARNING_MATERIAL') return true;
  if (m(fn) === 'SYSTEM') return ['VIEW_DOCUMENTS', 'SEARCH_DIGITAL_DOCS', 'DOWNLOAD_DIGITAL_DOCS', 'VIEW_DIGITAL_DOCS'].includes(fn.code);
  if (m(fn) === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m(fn) === 'PERSONAL') return true;
  return false;
}

function allowKyThuatVien(fn: FDef): boolean {
  if (m(fn) === 'INFRASTRUCTURE') return ['INFRA.VIEW', 'INFRA.PIPELINE_VIEW', 'INFRA.STORAGE_VIEW', 'INFRA.DATA_QUALITY_VIEW', 'INFRA.BACKUP_VIEW', 'INFRA.BACKUP_MANAGE', 'INFRA.RESTORE_REQUEST', 'INFRA.DR_VIEW', 'INFRA.ALERT_VIEW'].includes(fn.code);
  if (m(fn) === 'SYSTEM') return ['VIEW_SYSTEM_HEALTH', 'VIEW_INFRASTRUCTURE', 'VIEW_SYSTEM_STATS', 'VIEW_MONITORING_ALERTS', 'VIEW_MONITORING_SERVICES'].includes(fn.code);
  if (m(fn) === 'DATA') return VIEW_EXPORT.has(at(fn));
  if (m(fn) === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m(fn) === 'PERSONAL') return true;
  return false;
}

function allowTroLyNhanVien(fn: FDef): boolean {
  const mods = new Set(['SYSTEM', 'DASHBOARD', 'PERSONAL']);
  if (!mods.has(m(fn)) && m(fn) !== 'DATA') return fn.code === 'VIEW_DASHBOARD';
  if (m(fn) === 'SYSTEM') return at(fn) === 'VIEW';
  if (m(fn) === 'DATA') return VIEW_EXPORT.has(at(fn));
  if (m(fn) === 'DASHBOARD') return fn.code === 'VIEW_DASHBOARD';
  if (m(fn) === 'PERSONAL') return true;
  return false;
}

function allowHocVien(fn: FDef): boolean {
  const whitelist = new Set([
    'VIEW_DASHBOARD', 'VIEW_DASHBOARD_STUDENT',
    'VIEW_TRAINING', 'VIEW_COURSE', 'VIEW_GRADE', 'VIEW_SCHEDULE',
    'VIEW_ATTENDANCE', 'VIEW_ENROLLMENT', 'VIEW_THESIS',
    'VIEW_WARNING', 'VIEW_GRADUATION', 'VIEW_REPOSITORY',
    'REGISTER_COURSE', 'REGISTER_EXAM', 'VIEW_EXAM_REG', 'VIEW_EXAM_SESSION', 'VIEW_EXAM_PLAN',
    'DOWNLOAD_LEARNING_MATERIAL', 'VIEW_LEARNING_MATERIAL',
    'MANAGE_MY_PROFILE', 'VIEW_MY_NOTIFICATIONS', 'VIEW_MY_TASKS',
    'MANAGE_MY_SECURITY', 'VIEW_MY_CAREER_HISTORY', 'REQUEST_MY_INFO_UPDATE',
    'VIEW_MY_GRADE', 'VIEW_MY_CONDUCT', 'VIEW_MY_SCHEDULE',
    'VIEW_MY_GRADUATION', 'VIEW_MY_AWARD', 'VIEW_MY_POLICY', 'VIEW_MY_INSURANCE',
    'VIEW_MY_RESEARCH', 'VIEW_MY_PUBLICATIONS',
  ]);
  return whitelist.has(fn.code);
}

// Map position code → predicate + scope
function getPredicateAndScope(posCode: string): { predicate: (fn: FDef) => boolean; scope: FunctionScope } {
  switch (posCode) {
    case 'SYSTEM_ADMIN':                                     return { predicate: allowSystemAdmin,         scope: 'ACADEMY' };
    case 'GIAM_DOC':                                         return { predicate: allowGiamDoc,             scope: 'ACADEMY' };
    case 'CHINH_UY':
    case 'PHO_CHINH_UY':
    case 'PHO_GIAM_DOC':                                     return { predicate: allowPhoGiamDoc,          scope: 'ACADEMY' };
    case 'PHO_GIAM_DOC_KH':                                  return { predicate: allowPhoGiamDocKH,        scope: 'ACADEMY' };
    case 'PHO_GIAM_DOC_HC_HCKT':                             return { predicate: allowPhoGiamDocHCHCKT,    scope: 'ACADEMY' };
    case 'TRUONG_KHOA':
    case 'PHO_TRUONG_KHOA':
    case 'CHI_HUY_KHOA':                                     return { predicate: allowTruongKhoa,          scope: 'DEPARTMENT' };
    case 'TRUONG_PHONG_DANG':
    case 'B3_CNCT':
    case 'B3_PCNCT_BT':                                      return { predicate: allowTruongPhongDang,     scope: 'DEPARTMENT' };
    case 'TRUONG_PHONG_DAO_TAO':
    case 'B1_TRUONG_PHONG':                                  return { predicate: allowTruongPhongDaoTao,   scope: 'DEPARTMENT' };
    case 'TRUONG_PHONG_NHAN_SU':
    case 'CHI_HUY_PHONG':                                    return { predicate: allowTruongPhongNhanSu,   scope: 'DEPARTMENT' };
    case 'TRUONG_PHONG_KHOA_HOC':
    case 'B2_TRUONG_PHONG':                                  return { predicate: allowTruongPhongKhoaHoc,  scope: 'DEPARTMENT' };
    case 'TRUONG_PHONG_CHINH_SACH':                          return { predicate: allowTruongPhongChinhSach,scope: 'DEPARTMENT' };
    case 'PHO_TRUONG_PHONG':                                 return { predicate: allowPhoTruongPhong,      scope: 'DEPARTMENT' };
    case 'CHI_HUY_HE':
    case 'CHI_HUY_TIEU_DOAN':
    case 'CHI_HUY_BAN':                                      return { predicate: allowChiHuyHe,            scope: 'UNIT' };
    case 'CHI_HUY_BO_MON':
    case 'CHU_NHIEM_BO_MON':
    case 'PHO_CHU_NHIEM_BM':                                 return { predicate: allowChiHuyBoMon,         scope: 'UNIT' };
    case 'GIANG_VIEN':
    case 'GIANG_VIEN_CHINH':
    case 'TRO_GIANG':                                        return { predicate: allowGiangVien,           scope: 'UNIT' };
    case 'NGHIEN_CUU_VIEN':                                  return { predicate: allowNghienCuuVien,       scope: 'UNIT' };
    case 'TRO_LY':
    case 'NHAN_VIEN':
    case 'CHUYEN_VIEN':                                      return { predicate: allowTroLyNhanVien,       scope: 'UNIT' };
    case 'KY_THUAT_VIEN':                                    return { predicate: allowKyThuatVien,         scope: 'UNIT' };
    case 'CAN_BO_DANG':
    case 'CAN_BO_TO_CHUC':                                   return { predicate: allowCanBoDang,           scope: 'UNIT' };
    case 'CAN_BO_TAI_CHINH':                                 return { predicate: allowCanBoTaiChinh,       scope: 'UNIT' };
    case 'CAN_BO_THU_VIEN':                                  return { predicate: allowCanBoThuVien,        scope: 'UNIT' };
    case 'HOC_VIEN_QUAN_SU':
    case 'HOC_VIEN_CAO_HOC':
    case 'SINH_VIEN':
    case 'SINH_VIEN_DAN_SU':                                 return { predicate: allowHocVien,             scope: 'SELF' };
    case 'GUEST':                                            return { predicate: (fn) => fn.code === 'VIEW_DASHBOARD', scope: 'SELF' };
    default:                                                 return { predicate: () => false,              scope: 'SELF' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: SEED LOGIC
// ─────────────────────────────────────────────────────────────────────────────
async function seedFunctions(): Promise<void> {
  console.log('\n📌 [1/3] Seed Functions...');
  let created = 0;
  let updated = 0;

  for (const [code, def] of Object.entries(FUNCTION_DEFS)) {
    const existing = await prisma.function.findUnique({ where: { code } });
    if (existing) {
      await prisma.function.update({
        where: { code },
        data: { name: def.name, description: def.description ?? null, module: def.module, actionType: def.actionType, isCritical: def.isCritical ?? false, isActive: true },
      });
      updated++;
    } else {
      await prisma.function.create({
        data: { code, name: def.name, description: def.description ?? null, module: def.module, actionType: def.actionType, isCritical: def.isCritical ?? false, isActive: true },
      });
      created++;
    }
  }

  const total = await prisma.function.count({ where: { isActive: true } });
  console.log(`  ✅ Tạo mới: ${created} | Cập nhật: ${updated} | Tổng active: ${total}`);
}

async function seedPositions(): Promise<void> {
  console.log('\n📌 [2/3] Seed Positions...');
  let created = 0;
  let updated = 0;

  for (const pos of POSITIONS) {
    const existing = await prisma.position.findUnique({ where: { code: pos.code } });
    const data = { name: pos.name, description: pos.description ?? null, level: pos.level, isActive: true };

    if (existing) {
      await prisma.position.update({ where: { code: pos.code }, data: data as any });
      updated++;
    } else {
      await prisma.position.create({ data: { code: pos.code, ...data } as any });
      created++;
    }
  }

  console.log(`  ✅ Tạo mới: ${created} | Cập nhật: ${updated}`);
}

async function seedGrants(): Promise<void> {
  console.log('\n📌 [3/3] Seed Position Grants...');

  const allFunctions = Object.entries(FUNCTION_DEFS).map(([code, def]) => ({ code, ...def }));
  let totalCreated = 0;
  let totalUpdated = 0;

  for (const pos of POSITIONS) {
    const position = await prisma.position.findUnique({ where: { code: pos.code } });
    if (!position) {
      console.warn(`  ⚠️  Position không tồn tại: ${pos.code}`);
      continue;
    }

    const { predicate, scope } = getPredicateAndScope(pos.code);
    const allowedFunctions = allFunctions.filter(predicate);

    let posCreated = 0;
    let posUpdated = 0;

    for (const fn of allowedFunctions) {
      const fnRecord = await prisma.function.findUnique({ where: { code: fn.code } });
      if (!fnRecord) continue;

      const existing = await prisma.positionFunction.findFirst({
        where: { positionId: position.id, functionId: fnRecord.id },
      });

      if (!existing) {
        await prisma.positionFunction.create({
          data: { positionId: position.id, functionId: fnRecord.id, scope: scope as FunctionScope, isActive: true } as any,
        });
        posCreated++;
      } else if (!existing.isActive || (existing as any).scope !== scope) {
        await prisma.positionFunction.update({
          where: { id: existing.id },
          data: { isActive: true, scope: scope as FunctionScope } as any,
        });
        posUpdated++;
      }
    }

    totalCreated += posCreated;
    totalUpdated += posUpdated;

    if (posCreated > 0 || posUpdated > 0) {
      console.log(`  ✅ ${pos.code.padEnd(28)} scope=${scope.padEnd(10)} grants=${allowedFunctions.length} (+${posCreated} new, ~${posUpdated} upd)`);
    } else {
      console.log(`  ⏩ ${pos.code.padEnd(28)} scope=${scope.padEnd(10)} grants=${allowedFunctions.length} (no change)`);
    }
  }

  console.log(`\n  📊 Tổng grants tạo mới: ${totalCreated} | Cập nhật: ${totalUpdated}`);
}

async function assignAdminUser(): Promise<void> {
  console.log('\n📌 [+] Gán SYSTEM_ADMIN cho tài khoản admin...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@demo.hvhc.edu.vn';
  const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  const position = await prisma.position.findUnique({ where: { code: 'SYSTEM_ADMIN' } });

  if (!adminUser) {
    console.log(`  ⚠️  Không tìm thấy user: ${adminEmail} — bỏ qua bước này`);
    return;
  }
  if (!position) {
    console.log('  ⚠️  SYSTEM_ADMIN position chưa tồn tại');
    return;
  }

  const existing = await prisma.userPosition.findFirst({
    where: { userId: adminUser.id, positionId: position.id },
  });

  if (!existing) {
    await prisma.userPosition.create({
      data: { userId: adminUser.id, positionId: position.id, isPrimary: true, isActive: true, startDate: new Date() } as any,
    });
    console.log(`  ✅ Gán SYSTEM_ADMIN → ${adminEmail}`);
  } else {
    await prisma.userPosition.update({
      where: { id: existing.id },
      data: { isPrimary: true, isActive: true, endDate: null } as any,
    });
    console.log(`  ✅ Cập nhật UserPosition → ${adminEmail}`);
  }
}

async function printSummary(): Promise<void> {
  console.log('\n📊 ═══════════════════ TỔNG KẾT ═══════════════════');

  const totalFunctions = await prisma.function.count({ where: { isActive: true } });
  const totalPositions = await prisma.position.count({ where: { isActive: true } });
  const totalGrants    = await prisma.positionFunction.count({ where: { isActive: true } });

  console.log(`  Functions active : ${totalFunctions}`);
  console.log(`  Positions active : ${totalPositions}`);
  console.log(`  Grants active    : ${totalGrants}`);

  const adminPos = await prisma.position.findUnique({
    where: { code: 'SYSTEM_ADMIN' },
    include: { _count: { select: { functions: true } } },
  });
  if (adminPos) {
    const adminGrants = await prisma.positionFunction.count({ where: { positionId: adminPos.id, isActive: true } });
    console.log(`\n  SYSTEM_ADMIN grants: ${adminGrants} / ${totalFunctions} functions`);
    if (adminGrants < totalFunctions) {
      console.warn('  ⚠️  Admin chưa có đủ grant so với tổng functions! Chạy lại script để sync.');
    } else {
      console.log('  ✅ Admin đã có toàn bộ quyền.');
    }
  }

  const byModule = await prisma.function.groupBy({
    by: ['module'],
    where: { isActive: true },
    _count: { id: true },
    orderBy: { module: 'asc' },
  });
  console.log('\n  Functions theo module:');
  byModule.forEach(r => console.log(`    ${r.module.padEnd(22)} ${r._count.id}`));

  console.log('\n  ⚠️  Đăng xuất & đăng nhập lại để refresh permission cache.');
  console.log('═══════════════════════════════════════════════════\n');
}

async function main() {
  console.log('🚀 seed_rbac_full.ts — Seed toàn bộ RBAC (Functions + Positions + Grants)');
  await seedFunctions();
  await seedPositions();
  await seedGrants();
  await assignAdminUser();
  await printSummary();
}

main()
  .catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
