/**
 * Seed: Toàn bộ Chức năng (Functions) cho hệ thống HVHC
 * - Chuẩn hóa module name → UPPERCASE
 * - Đặt tên tiếng Việt đầy đủ
 * - Đặt actionType, isCritical đúng
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_functions_complete.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FunctionDef {
  code: string;
  name: string;
  description?: string;
  module: string;
  actionType: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'EXPORT' | 'IMPORT' | 'SUBMIT';
  isCritical?: boolean;
}

const ALL_FUNCTIONS: FunctionDef[] = [
  // ─── PERSONNEL ───
  { code: 'VIEW_PERSONNEL',           name: 'Xem danh sách cán bộ',           description: 'Xem danh sách toàn bộ cán bộ nhân sự',                   module: 'PERSONNEL', actionType: 'VIEW' },
  { code: 'VIEW_PERSONNEL_DETAIL',    name: 'Xem chi tiết hồ sơ cán bộ',      description: 'Xem đầy đủ thông tin cá nhân và lịch sử công tác',        module: 'PERSONNEL', actionType: 'VIEW' },
  { code: 'VIEW_PERSONNEL_SENSITIVE', name: 'Xem thông tin nhạy cảm cán bộ',  description: 'Xem lương, CCCD, số tài khoản ngân hàng',                 module: 'PERSONNEL', actionType: 'VIEW',   isCritical: true },
  { code: 'CREATE_PERSONNEL',         name: 'Thêm cán bộ mới',                description: 'Tạo hồ sơ cán bộ nhân sự mới vào hệ thống',              module: 'PERSONNEL', actionType: 'CREATE', isCritical: true },
  { code: 'UPDATE_PERSONNEL',         name: 'Cập nhật thông tin cán bộ',       description: 'Chỉnh sửa thông tin trong hồ sơ cán bộ',                 module: 'PERSONNEL', actionType: 'UPDATE' },
  { code: 'DELETE_PERSONNEL',         name: 'Xóa hồ sơ cán bộ',               description: 'Xóa vĩnh viễn hồ sơ cán bộ khỏi hệ thống',              module: 'PERSONNEL', actionType: 'DELETE', isCritical: true },
  { code: 'APPROVE_PERSONNEL',        name: 'Phê duyệt hồ sơ cán bộ',          description: 'Duyệt hồ sơ mới hoặc cập nhật thông tin cán bộ',         module: 'PERSONNEL', actionType: 'APPROVE', isCritical: true },
  { code: 'EXPORT_PERSONNEL',         name: 'Xuất danh sách cán bộ',            description: 'Xuất file Excel/PDF danh sách cán bộ',                   module: 'PERSONNEL', actionType: 'EXPORT' },
  { code: 'IMPORT_PERSONNEL',         name: 'Nhập dữ liệu cán bộ',             description: 'Nhập hàng loạt cán bộ từ file Excel',                    module: 'PERSONNEL', actionType: 'IMPORT', isCritical: true },
  { code: 'SUBMIT_PERSONNEL',         name: 'Gửi hồ sơ cán bộ lên duyệt',      description: 'Nộp hồ sơ cán bộ chờ phê duyệt cấp trên',               module: 'PERSONNEL', actionType: 'SUBMIT' },
  { code: 'VIEW_CAREER_HISTORY',      name: 'Xem quá trình công tác',           description: 'Xem lịch sử vị trí và chuyển công tác của cán bộ',       module: 'PERSONNEL', actionType: 'VIEW' },
  { code: 'UPDATE_CAREER_HISTORY',    name: 'Cập nhật quá trình công tác',      description: 'Ghi thêm hoặc chỉnh sửa quá trình công tác',             module: 'PERSONNEL', actionType: 'UPDATE' },
  { code: 'VIEW_EDUCATION_HISTORY',   name: 'Xem lịch sử học vấn',             description: 'Xem bằng cấp và quá trình đào tạo của cán bộ',           module: 'PERSONNEL', actionType: 'VIEW' },
  { code: 'UPDATE_EDUCATION_HISTORY', name: 'Cập nhật lịch sử học vấn',         description: 'Bổ sung hoặc chỉnh sửa bằng cấp, khóa học',             module: 'PERSONNEL', actionType: 'UPDATE' },
  { code: 'VIEW_FAMILY_RELATIONS',    name: 'Xem thông tin thân nhân',          description: 'Xem danh sách và thông tin người thân của cán bộ',        module: 'PERSONNEL', actionType: 'VIEW',   isCritical: true },
  { code: 'UPDATE_FAMILY_RELATIONS',  name: 'Cập nhật thông tin thân nhân',     description: 'Thêm/sửa thông tin người thân',                          module: 'PERSONNEL', actionType: 'UPDATE', isCritical: true },
  { code: 'VIEW_SOLDIER_PROFILE',     name: 'Xem hồ sơ quân nhân',             description: 'Xem thông tin quân hàm và binh nghiệp',                  module: 'PERSONNEL', actionType: 'VIEW' },
  { code: 'UPDATE_SOLDIER_PROFILE',   name: 'Cập nhật hồ sơ quân nhân',         description: 'Cập nhật quân hàm, đơn vị chiến đấu, chiến công',        module: 'PERSONNEL', actionType: 'UPDATE', isCritical: true },

  // ─── TRAINING ───
  { code: 'VIEW_TRAINING',            name: 'Xem thông tin đào tạo',            description: 'Xem tổng quan các chương trình đào tạo',                  module: 'TRAINING', actionType: 'VIEW' },
  { code: 'VIEW_COURSE',              name: 'Xem môn học / khóa học',            description: 'Xem danh sách và chi tiết môn học',                       module: 'TRAINING', actionType: 'VIEW' },
  { code: 'CREATE_COURSE',            name: 'Tạo môn học / khóa học',            description: 'Tạo mới môn học hoặc khóa huấn luyện',                   module: 'TRAINING', actionType: 'CREATE' },
  { code: 'UPDATE_COURSE',            name: 'Cập nhật môn học / khóa học',       description: 'Chỉnh sửa thông tin môn học, giảng viên phụ trách',       module: 'TRAINING', actionType: 'UPDATE' },
  { code: 'DELETE_COURSE',            name: 'Xóa môn học / khóa học',            description: 'Xóa môn học khỏi hệ thống',                              module: 'TRAINING', actionType: 'DELETE' },
  { code: 'VIEW_GRADE',               name: 'Xem điểm học viên',                 description: 'Xem kết quả học tập của học viên',                        module: 'TRAINING', actionType: 'VIEW' },
  { code: 'CREATE_GRADE_DRAFT',       name: 'Nhập điểm nháp',                    description: 'Tạo bản điểm nháp chờ xác nhận',                         module: 'TRAINING', actionType: 'CREATE' },
  { code: 'SUBMIT_GRADE',             name: 'Gửi điểm lên duyệt',               description: 'Nộp bảng điểm chính thức chờ phê duyệt',                 module: 'TRAINING', actionType: 'SUBMIT' },
  { code: 'APPROVE_GRADE',            name: 'Phê duyệt điểm',                    description: 'Xác nhận và khóa bảng điểm chính thức',                  module: 'TRAINING', actionType: 'APPROVE', isCritical: true },
  { code: 'REJECT_GRADE',             name: 'Từ chối điểm',                      description: 'Trả lại bảng điểm yêu cầu chỉnh sửa',                    module: 'TRAINING', actionType: 'REJECT' },
  { code: 'REGISTER_COURSE',          name: 'Đăng ký môn học',                   description: 'Đăng ký tham gia môn học (dành cho học viên)',             module: 'TRAINING', actionType: 'CREATE' },
  { code: 'EXPORT_GRADE',             name: 'Xuất bảng điểm',                    description: 'Xuất bảng điểm ra file Excel/PDF',                        module: 'TRAINING', actionType: 'EXPORT' },

  // ─── EDUCATION ───
  { code: 'VIEW_PROGRAM',             name: 'Xem chương trình đào tạo',          description: 'Xem danh mục và nội dung chương trình đào tạo',           module: 'EDUCATION', actionType: 'VIEW' },
  { code: 'CREATE_PROGRAM',           name: 'Tạo chương trình đào tạo',          description: 'Xây dựng chương trình đào tạo mới',                       module: 'EDUCATION', actionType: 'CREATE' },
  { code: 'UPDATE_PROGRAM',           name: 'Cập nhật chương trình đào tạo',     description: 'Chỉnh sửa nội dung chương trình đào tạo',                 module: 'EDUCATION', actionType: 'UPDATE' },
  { code: 'DELETE_PROGRAM',           name: 'Xóa chương trình đào tạo',          description: 'Xóa chương trình đào tạo khỏi hệ thống',                 module: 'EDUCATION', actionType: 'DELETE' },
  { code: 'APPROVE_PROGRAM',          name: 'Phê duyệt chương trình đào tạo',    description: 'Ban hành chương trình đào tạo chính thức',               module: 'EDUCATION', actionType: 'APPROVE', isCritical: true },
  { code: 'VIEW_CURRICULUM',          name: 'Xem khung chương trình',            description: 'Xem cấu trúc tín chỉ và học phần',                        module: 'EDUCATION', actionType: 'VIEW' },
  { code: 'CREATE_CURRICULUM',        name: 'Tạo khung chương trình',            description: 'Xây dựng cấu trúc tín chỉ cho ngành học',                 module: 'EDUCATION', actionType: 'CREATE' },
  { code: 'UPDATE_CURRICULUM',        name: 'Cập nhật khung chương trình',       description: 'Chỉnh sửa khung phân phối tín chỉ',                       module: 'EDUCATION', actionType: 'UPDATE' },
  { code: 'DELETE_CURRICULUM',        name: 'Xóa khung chương trình',            description: 'Xóa khung chương trình đào tạo',                          module: 'EDUCATION', actionType: 'DELETE' },
  { code: 'VIEW_TERM',                name: 'Xem năm học / học kỳ',              description: 'Xem cấu hình năm học và học kỳ',                          module: 'EDUCATION', actionType: 'VIEW' },
  { code: 'MANAGE_TERM',              name: 'Quản lý năm học / học kỳ',          description: 'Tạo, sửa, xóa năm học và học kỳ',                        module: 'EDUCATION', actionType: 'UPDATE' },
  { code: 'VIEW_CLASS_SECTION',       name: 'Xem lớp học phần',                  description: 'Xem danh sách lớp học phần theo học kỳ',                  module: 'EDUCATION', actionType: 'VIEW' },
  { code: 'CREATE_CLASS_SECTION',     name: 'Mở lớp học phần',                   description: 'Mở lớp học phần mới cho học kỳ',                          module: 'EDUCATION', actionType: 'CREATE' },
  { code: 'UPDATE_CLASS_SECTION',     name: 'Cập nhật lớp học phần',             description: 'Chỉnh sửa thông tin lớp học phần',                        module: 'EDUCATION', actionType: 'UPDATE' },
  { code: 'DELETE_CLASS_SECTION',     name: 'Xóa lớp học phần',                  description: 'Xóa lớp học phần khỏi học kỳ',                           module: 'EDUCATION', actionType: 'DELETE' },
  { code: 'VIEW_SCHEDULE',            name: 'Xem thời khóa biểu',                description: 'Xem lịch học và lịch huấn luyện',                         module: 'EDUCATION', actionType: 'VIEW' },
  { code: 'CREATE_SCHEDULE',          name: 'Tạo thời khóa biểu',               description: 'Lập lịch học mới cho học kỳ',                             module: 'EDUCATION', actionType: 'CREATE' },
  { code: 'UPDATE_SCHEDULE',          name: 'Cập nhật thời khóa biểu',           description: 'Chỉnh sửa thời gian và địa điểm học',                     module: 'EDUCATION', actionType: 'UPDATE' },
  { code: 'DELETE_SCHEDULE',          name: 'Xóa lịch học',                      description: 'Xóa buổi học hoặc lịch học khỏi hệ thống',               module: 'EDUCATION', actionType: 'DELETE' },
  { code: 'VIEW_ATTENDANCE',          name: 'Xem điểm danh',                     description: 'Xem trạng thái điểm danh của học viên',                   module: 'EDUCATION', actionType: 'VIEW' },
  { code: 'MANAGE_ATTENDANCE',        name: 'Quản lý điểm danh',                 description: 'Ghi nhận và chỉnh sửa điểm danh',                         module: 'EDUCATION', actionType: 'UPDATE' },
  { code: 'VIEW_ENROLLMENT',          name: 'Xem ghi danh',                      description: 'Xem danh sách học viên đăng ký lớp học phần',             module: 'EDUCATION', actionType: 'VIEW' },
  { code: 'MANAGE_ENROLLMENT',        name: 'Quản lý ghi danh',                  description: 'Thêm/xóa học viên khỏi lớp học phần',                    module: 'EDUCATION', actionType: 'UPDATE' },
  // M10 – Hồ sơ người học
  { code: 'VIEW_STUDENT',            name: 'Xem hồ sơ học viên',               description: 'Xem danh sách và thông tin học viên',                    module: 'EDUCATION', actionType: 'VIEW' },
  { code: 'CREATE_STUDENT',          name: 'Tạo hồ sơ học viên',               description: 'Thêm học viên mới vào hệ thống',                         module: 'EDUCATION', actionType: 'CREATE' },
  { code: 'UPDATE_STUDENT',          name: 'Cập nhật hồ sơ học viên',          description: 'Chỉnh sửa thông tin học viên',                            module: 'EDUCATION', actionType: 'UPDATE' },
  { code: 'VIEW_STUDENT_PROFILE360', name: 'Xem hồ sơ 360° học viên',          description: 'Xem toàn bộ hồ sơ học vụ tổng hợp của học viên',         module: 'EDUCATION', actionType: 'VIEW' },
  // M10 – Rèn luyện
  { code: 'VIEW_CONDUCT',            name: 'Xem điểm rèn luyện',               description: 'Xem điểm rèn luyện của học viên',                         module: 'EDUCATION', actionType: 'VIEW' },
  { code: 'MANAGE_CONDUCT',          name: 'Quản lý điểm rèn luyện',           description: 'Nhập và cập nhật điểm rèn luyện học viên',                module: 'EDUCATION', actionType: 'UPDATE' },
  // M10 – UC-56: Điểm học phần
  { code: 'MANAGE_GRADE',            name: 'Nhập / sửa điểm học phần',         description: 'Nhập và chỉnh sửa điểm của học viên trong lớp học phần', module: 'EDUCATION', actionType: 'UPDATE', isCritical: true },
  // M10 – UC-57: Cảnh báo học vụ
  { code: 'VIEW_WARNING',            name: 'Xem cảnh báo học vụ',              description: 'Xem danh sách cảnh báo học vụ của học viên',              module: 'EDUCATION', actionType: 'VIEW' },
  { code: 'MANAGE_WARNING',          name: 'Quản lý cảnh báo học vụ',          description: 'Chạy engine cảnh báo và đánh dấu giải quyết',             module: 'EDUCATION', actionType: 'UPDATE' },
  // M10 – UC-59: Khóa luận / Luận văn
  { code: 'VIEW_THESIS',             name: 'Xem khóa luận / luận văn',         description: 'Xem danh sách và thông tin khóa luận',                    module: 'EDUCATION', actionType: 'VIEW' },
  { code: 'MANAGE_THESIS',           name: 'Quản lý khóa luận / luận văn',     description: 'Tạo và cập nhật thông tin khóa luận',                     module: 'EDUCATION', actionType: 'UPDATE' },
  // M10 – UC-60: Xét tốt nghiệp
  { code: 'VIEW_GRADUATION',         name: 'Xem kết quả xét tốt nghiệp',       description: 'Xem kết quả và danh sách đủ điều kiện tốt nghiệp',       module: 'EDUCATION', actionType: 'VIEW' },
  { code: 'RUN_GRADUATION',          name: 'Chạy engine xét tốt nghiệp',       description: 'Kích hoạt engine xét điều kiện tốt nghiệp',               module: 'EDUCATION', actionType: 'UPDATE', isCritical: true },
  { code: 'APPROVE_GRADUATION',      name: 'Phê duyệt tốt nghiệp',             description: 'Xác nhận danh sách học viên đủ điều kiện tốt nghiệp',    module: 'EDUCATION', actionType: 'APPROVE', isCritical: true },
  { code: 'EXPORT_GRADUATION',       name: 'Xuất danh sách / văn bằng',        description: 'Xuất danh sách tốt nghiệp và thông tin văn bằng',         module: 'EDUCATION', actionType: 'EXPORT' },
  // M10 – UC-61: Kho học vụ
  { code: 'VIEW_REPOSITORY',         name: 'Tra cứu kho học vụ',               description: 'Tra cứu dữ liệu học vụ lưu trữ',                         module: 'EDUCATION', actionType: 'VIEW' },

  // ─── RESEARCH ───
  { code: 'VIEW_RESEARCH',            name: 'Xem đề tài nghiên cứu',             description: 'Xem danh sách và thông tin đề tài NCKH',                  module: 'RESEARCH', actionType: 'VIEW' },
  { code: 'CREATE_RESEARCH',          name: 'Đăng ký đề tài nghiên cứu',         description: 'Tạo hồ sơ đăng ký đề tài nghiên cứu mới',               module: 'RESEARCH', actionType: 'CREATE' },
  { code: 'UPDATE_RESEARCH',          name: 'Cập nhật đề tài nghiên cứu',        description: 'Chỉnh sửa thông tin, tiến độ, kết quả đề tài',           module: 'RESEARCH', actionType: 'UPDATE' },
  { code: 'DELETE_RESEARCH',          name: 'Xóa đề tài nghiên cứu',             description: 'Hủy và xóa đề tài nghiên cứu',                           module: 'RESEARCH', actionType: 'DELETE' },
  { code: 'SUBMIT_RESEARCH',          name: 'Nộp đề tài nghiên cứu',             description: 'Nộp hồ sơ đề tài lên hội đồng xét duyệt',               module: 'RESEARCH', actionType: 'SUBMIT' },
  { code: 'REVIEW_RESEARCH',          name: 'Xét duyệt đề tài nghiên cứu',       description: 'Xem xét và cho ý kiến về đề tài',                        module: 'RESEARCH', actionType: 'APPROVE' },
  { code: 'APPROVE_RESEARCH',         name: 'Phê duyệt đề tài nghiên cứu',       description: 'Chính thức phê duyệt và cấp kinh phí đề tài',            module: 'RESEARCH', actionType: 'APPROVE', isCritical: true },
  { code: 'REJECT_RESEARCH',          name: 'Từ chối đề tài nghiên cứu',         description: 'Từ chối đề tài nghiên cứu với lý do cụ thể',             module: 'RESEARCH', actionType: 'REJECT' },
  { code: 'EVALUATE_RESEARCH',        name: 'Đánh giá kết quả nghiên cứu',       description: 'Đánh giá và cho điểm kết quả nghiên cứu',                module: 'RESEARCH', actionType: 'UPDATE' },
  { code: 'VIEW_PUBLICATION',         name: 'Xem công trình khoa học',            description: 'Xem danh sách bài báo, công trình KHCN đã công bố',      module: 'RESEARCH', actionType: 'VIEW' },
  { code: 'CREATE_PUBLICATION',       name: 'Thêm công trình khoa học',           description: 'Khai báo bài báo, sách, công trình KH mới',              module: 'RESEARCH', actionType: 'CREATE' },
  { code: 'UPDATE_PUBLICATION',       name: 'Cập nhật công trình khoa học',       description: 'Chỉnh sửa thông tin công trình khoa học',                module: 'RESEARCH', actionType: 'UPDATE' },
  { code: 'DELETE_PUBLICATION',       name: 'Xóa công trình khoa học',            description: 'Xóa công trình khoa học khỏi hệ thống',                 module: 'RESEARCH', actionType: 'DELETE' },

  // ─── PARTY ───
  { code: 'VIEW_PARTY',               name: 'Xem thông tin Đảng viên',            description: 'Xem danh sách và hồ sơ đảng viên',                      module: 'PARTY', actionType: 'VIEW' },
  { code: 'CREATE_PARTY',             name: 'Kết nạp Đảng viên mới',              description: 'Tạo hồ sơ kết nạp Đảng viên mới',                      module: 'PARTY', actionType: 'CREATE', isCritical: true },
  { code: 'UPDATE_PARTY',             name: 'Cập nhật hồ sơ Đảng viên',           description: 'Chỉnh sửa thông tin và quá trình đảng của đảng viên',   module: 'PARTY', actionType: 'UPDATE' },
  { code: 'DELETE_PARTY',             name: 'Xóa hồ sơ Đảng viên',               description: 'Xóa hồ sơ đảng viên',                                  module: 'PARTY', actionType: 'DELETE', isCritical: true },
  { code: 'APPROVE_PARTY',            name: 'Phê duyệt kết nạp Đảng',             description: 'Phê duyệt việc kết nạp đảng viên mới',                 module: 'PARTY', actionType: 'APPROVE', isCritical: true },
  { code: 'MANAGE_PARTY_MEETING',     name: 'Quản lý sinh hoạt Đảng',             description: 'Ghi nhận và quản lý các buổi sinh hoạt chi bộ',         module: 'PARTY', actionType: 'UPDATE' },
  { code: 'VIEW_PARTY_EVALUATION',    name: 'Xem đánh giá Đảng viên',             description: 'Xem kết quả đánh giá, xếp loại đảng viên',             module: 'PARTY', actionType: 'VIEW' },
  { code: 'CREATE_PARTY_EVALUATION',  name: 'Lập phiếu đánh giá Đảng viên',      description: 'Tạo phiếu đánh giá chất lượng đảng viên hàng năm',     module: 'PARTY', actionType: 'CREATE' },
  { code: 'APPROVE_PARTY_EVALUATION', name: 'Phê duyệt đánh giá Đảng viên',      description: 'Xác nhận kết quả đánh giá đảng viên',                  module: 'PARTY', actionType: 'APPROVE' },
  { code: 'VIEW_PARTY_ADMISSION',     name: 'Xem hồ sơ kết nạp Đảng',            description: 'Xem danh sách và tiến trình hồ sơ kết nạp',            module: 'PARTY', actionType: 'VIEW' },
  { code: 'SUBMIT_PARTY_ADMISSION',   name: 'Nộp hồ sơ kết nạp Đảng',            description: 'Nộp hồ sơ xin kết nạp Đảng',                          module: 'PARTY', actionType: 'SUBMIT' },
  { code: 'VIEW_PARTY_ACTIVITY',      name: 'Xem hoạt động chi bộ',               description: 'Xem lịch và biên bản sinh hoạt chi bộ',                module: 'PARTY', actionType: 'VIEW' },
  { code: 'CREATE_PARTY_ACTIVITY',    name: 'Tạo hoạt động chi bộ',               description: 'Ghi nhận hoạt động, nghị quyết chi bộ',                module: 'PARTY', actionType: 'CREATE' },
  { code: 'EXPORT_PARTY',             name: 'Xuất báo cáo Đảng',                  description: 'Xuất báo cáo tổng hợp đảng viên',                      module: 'PARTY', actionType: 'EXPORT' },

  // ─── POLICY ───
  { code: 'VIEW_POLICY',              name: 'Xem chính sách phúc lợi',            description: 'Xem danh sách chính sách và chế độ phúc lợi',           module: 'POLICY', actionType: 'VIEW' },
  { code: 'CREATE_POLICY',            name: 'Tạo hồ sơ chính sách',               description: 'Tạo hồ sơ hưởng chính sách cho cán bộ',                module: 'POLICY', actionType: 'CREATE' },
  { code: 'CREATE_POLICY_REQUEST',    name: 'Gửi yêu cầu hưởng chính sách',       description: 'Nộp hồ sơ đề nghị hưởng chế độ chính sách',            module: 'POLICY', actionType: 'SUBMIT' },
  { code: 'UPDATE_POLICY',            name: 'Cập nhật hồ sơ chính sách',           description: 'Chỉnh sửa thông tin hồ sơ chính sách',                 module: 'POLICY', actionType: 'UPDATE' },
  { code: 'DELETE_POLICY',            name: 'Xóa hồ sơ chính sách',               description: 'Hủy và xóa hồ sơ chính sách',                          module: 'POLICY', actionType: 'DELETE' },
  { code: 'APPROVE_POLICY',           name: 'Phê duyệt hồ sơ chính sách',          description: 'Xác nhận và phê duyệt hưởng chính sách',               module: 'POLICY', actionType: 'APPROVE', isCritical: true },
  { code: 'REJECT_POLICY',            name: 'Từ chối hồ sơ chính sách',            description: 'Từ chối hồ sơ với lý do cụ thể',                       module: 'POLICY', actionType: 'REJECT' },
  { code: 'REVIEW_POLICY',            name: 'Xét duyệt hồ sơ chính sách',          description: 'Thẩm định hồ sơ trước khi phê duyệt',                  module: 'POLICY', actionType: 'APPROVE' },
  { code: 'EXPORT_POLICY',            name: 'Xuất báo cáo chính sách',             description: 'Xuất danh sách hồ sơ và thống kê chính sách',          module: 'POLICY', actionType: 'EXPORT' },

  // ─── INSURANCE ───
  { code: 'VIEW_INSURANCE',           name: 'Xem hồ sơ bảo hiểm',                description: 'Xem thông tin bảo hiểm xã hội, y tế của cán bộ',        module: 'INSURANCE', actionType: 'VIEW' },
  { code: 'CREATE_INSURANCE',         name: 'Tạo hồ sơ bảo hiểm',                description: 'Lập hồ sơ bảo hiểm cho cán bộ mới',                    module: 'INSURANCE', actionType: 'CREATE' },
  { code: 'UPDATE_INSURANCE',         name: 'Cập nhật thông tin bảo hiểm',        description: 'Chỉnh sửa thông tin và mức đóng bảo hiểm',              module: 'INSURANCE', actionType: 'UPDATE' },
  { code: 'DELETE_INSURANCE',         name: 'Xóa hồ sơ bảo hiểm',                description: 'Xóa hồ sơ bảo hiểm khỏi hệ thống',                    module: 'INSURANCE', actionType: 'DELETE' },
  { code: 'APPROVE_INSURANCE_CLAIM',  name: 'Phê duyệt yêu cầu bảo hiểm',         description: 'Xét duyệt và phê duyệt hồ sơ chi trả bảo hiểm',        module: 'INSURANCE', actionType: 'APPROVE', isCritical: true },
  { code: 'EXPORT_INSURANCE',         name: 'Xuất báo cáo bảo hiểm',              description: 'Xuất dữ liệu bảo hiểm cho cơ quan BHXH',               module: 'INSURANCE', actionType: 'EXPORT' },
  { code: 'IMPORT_INSURANCE',         name: 'Nhập dữ liệu bảo hiểm',              description: 'Nhập dữ liệu từ file cơ quan BHXH',                    module: 'INSURANCE', actionType: 'IMPORT' },

  // ─── AWARDS ───
  { code: 'VIEW_AWARD',               name: 'Xem danh sách khen thưởng',           description: 'Xem lịch sử và hồ sơ khen thưởng của cán bộ',          module: 'AWARDS', actionType: 'VIEW' },
  { code: 'CREATE_AWARD',             name: 'Đề xuất khen thưởng',                 description: 'Tạo hồ sơ đề xuất khen thưởng cán bộ',                 module: 'AWARDS', actionType: 'CREATE' },
  { code: 'UPDATE_AWARD',             name: 'Cập nhật hồ sơ khen thưởng',          description: 'Chỉnh sửa nội dung hồ sơ khen thưởng',                 module: 'AWARDS', actionType: 'UPDATE' },
  { code: 'DELETE_AWARD',             name: 'Xóa hồ sơ khen thưởng',              description: 'Xóa hồ sơ khen thưởng khỏi hệ thống',                 module: 'AWARDS', actionType: 'DELETE' },
  { code: 'APPROVE_AWARD',            name: 'Phê duyệt khen thưởng',               description: 'Quyết định tặng thưởng và ký quyết định',              module: 'AWARDS', actionType: 'APPROVE', isCritical: true },
  { code: 'VIEW_DISCIPLINE',          name: 'Xem danh sách kỷ luật',               description: 'Xem hồ sơ và quyết định kỷ luật cán bộ',               module: 'AWARDS', actionType: 'VIEW' },
  { code: 'CREATE_DISCIPLINE',        name: 'Lập hồ sơ kỷ luật',                  description: 'Tạo hồ sơ xử lý kỷ luật cán bộ',                      module: 'AWARDS', actionType: 'CREATE', isCritical: true },
  { code: 'APPROVE_DISCIPLINE',       name: 'Phê duyệt kỷ luật',                   description: 'Ký quyết định và áp dụng hình thức kỷ luật',           module: 'AWARDS', actionType: 'APPROVE', isCritical: true },
  { code: 'EXPORT_AWARD',             name: 'Xuất báo cáo khen thưởng',            description: 'Xuất tổng hợp khen thưởng kỷ luật',                    module: 'AWARDS', actionType: 'EXPORT' },

  // ─── STUDENT ───
  { code: 'VIEW_STUDENT',             name: 'Xem danh sách học viên',              description: 'Xem danh sách học viên theo khóa, lớp',                module: 'STUDENT', actionType: 'VIEW' },
  { code: 'VIEW_STUDENT_DETAIL',      name: 'Xem chi tiết hồ sơ học viên',         description: 'Xem đầy đủ hồ sơ và kết quả học tập của học viên',     module: 'STUDENT', actionType: 'VIEW' },
  { code: 'CREATE_STUDENT',           name: 'Nhập học viên mới',                   description: 'Tạo hồ sơ học viên mới khi nhập học',                  module: 'STUDENT', actionType: 'CREATE' },
  { code: 'UPDATE_STUDENT',           name: 'Cập nhật thông tin học viên',          description: 'Chỉnh sửa thông tin cá nhân và hồ sơ học viên',        module: 'STUDENT', actionType: 'UPDATE' },
  { code: 'DELETE_STUDENT',           name: 'Xóa hồ sơ học viên',                  description: 'Xóa vĩnh viễn hồ sơ học viên',                        module: 'STUDENT', actionType: 'DELETE', isCritical: true },
  { code: 'EXPORT_STUDENT',           name: 'Xuất danh sách học viên',              description: 'Xuất file Excel/PDF danh sách học viên',               module: 'STUDENT', actionType: 'EXPORT' },
  { code: 'VIEW_STUDENT_GRADE',       name: 'Xem kết quả học tập học viên',         description: 'Xem bảng điểm và xếp loại học tập',                    module: 'STUDENT', actionType: 'VIEW' },
  { code: 'VIEW_STUDENT_CONDUCT',     name: 'Xem rèn luyện học viên',               description: 'Xem điểm và xếp loại rèn luyện học viên',              module: 'STUDENT', actionType: 'VIEW' },
  { code: 'MANAGE_STUDENT_CONDUCT',   name: 'Quản lý rèn luyện học viên',           description: 'Nhập và chỉnh sửa điểm rèn luyện học viên',            module: 'STUDENT', actionType: 'UPDATE' },

  // ─── FACULTY ───
  { code: 'VIEW_FACULTY',             name: 'Xem danh sách giảng viên',            description: 'Xem danh sách giảng viên toàn học viện',               module: 'FACULTY', actionType: 'VIEW' },
  { code: 'VIEW_FACULTY_DETAIL',      name: 'Xem chi tiết hồ sơ giảng viên',       description: 'Xem đầy đủ hồ sơ và thành tích giảng viên',            module: 'FACULTY', actionType: 'VIEW' },
  { code: 'CREATE_FACULTY',           name: 'Thêm giảng viên mới',                 description: 'Tạo hồ sơ giảng viên mới vào hệ thống',               module: 'FACULTY', actionType: 'CREATE' },
  { code: 'UPDATE_FACULTY',           name: 'Cập nhật hồ sơ giảng viên',           description: 'Chỉnh sửa thông tin và thành tích giảng viên',         module: 'FACULTY', actionType: 'UPDATE' },
  { code: 'DELETE_FACULTY',           name: 'Xóa hồ sơ giảng viên',               description: 'Xóa hồ sơ giảng viên khỏi hệ thống',                 module: 'FACULTY', actionType: 'DELETE' },
  { code: 'EXPORT_FACULTY',           name: 'Xuất danh sách giảng viên',            description: 'Xuất file thống kê giảng viên',                        module: 'FACULTY', actionType: 'EXPORT' },
  { code: 'IMPORT_FACULTY',           name: 'Nhập dữ liệu giảng viên',             description: 'Nhập hàng loạt dữ liệu giảng viên từ file',            module: 'FACULTY', actionType: 'IMPORT' },
  { code: 'VIEW_FACULTY_RESEARCH',    name: 'Xem nghiên cứu của giảng viên',        description: 'Xem đề tài NCKH và công trình của giảng viên',         module: 'FACULTY', actionType: 'VIEW' },
  { code: 'VIEW_FACULTY_STATS',       name: 'Xem thống kê giảng viên',              description: 'Xem báo cáo tổng hợp về giảng viên theo khoa',         module: 'FACULTY', actionType: 'VIEW' },
  { code: 'VIEW_FACULTY_INSTRUCTORS', name: 'Xem danh sách giảng viên của khoa',    description: 'Xem phân công giảng viên theo bộ môn',                 module: 'FACULTY', actionType: 'VIEW' },
  { code: 'VIEW_FACULTY_CLASSES',     name: 'Xem lớp học do giảng viên phụ trách',  description: 'Xem phân công giảng dạy của giảng viên',               module: 'FACULTY', actionType: 'VIEW' },
  { code: 'VIEW_FACULTY_PERFORMANCE', name: 'Xem hiệu suất giảng dạy',              description: 'Xem đánh giá và chỉ số KPI giảng dạy',                module: 'FACULTY', actionType: 'VIEW' },

  // ─── DASHBOARD ───
  { code: 'VIEW_DASHBOARD',           name: 'Xem Dashboard tổng quan',             description: 'Xem trang tổng quan hệ thống',                         module: 'DASHBOARD', actionType: 'VIEW' },
  { code: 'VIEW_DASHBOARD_COMMAND',   name: 'Xem Dashboard chỉ huy',               description: 'Xem tổng quan chiến lược cho cấp chỉ huy',             module: 'DASHBOARD', actionType: 'VIEW' },
  { code: 'VIEW_DASHBOARD_ADMIN',     name: 'Xem Dashboard quản trị',              description: 'Xem dashboard quản trị hệ thống',                     module: 'DASHBOARD', actionType: 'VIEW' },
  { code: 'VIEW_DASHBOARD_FACULTY',   name: 'Xem Dashboard giảng viên',            description: 'Xem dashboard thống kê giảng viên',                   module: 'DASHBOARD', actionType: 'VIEW' },
  { code: 'VIEW_DASHBOARD_STUDENT',   name: 'Xem Dashboard học viên',              description: 'Xem dashboard kết quả học tập học viên',              module: 'DASHBOARD', actionType: 'VIEW' },

  // ─── SYSTEM ───
  { code: 'MANAGE_USERS',             name: 'Quản lý tài khoản người dùng',        description: 'Toàn quyền CRUD tài khoản người dùng',                 module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  { code: 'VIEW_USERS',               name: 'Xem danh sách người dùng',            description: 'Xem tài khoản và trạng thái người dùng',               module: 'SYSTEM', actionType: 'VIEW' },
  { code: 'RESET_USER_PASSWORD',      name: 'Đặt lại mật khẩu người dùng',         description: 'Reset và cấp mật khẩu mới cho người dùng',             module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  { code: 'TOGGLE_USER_STATUS',       name: 'Khóa / Mở khóa tài khoản',           description: 'Tạm khóa hoặc mở khóa tài khoản người dùng',          module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  { code: 'MANAGE_UNITS',             name: 'Quản lý đơn vị tổ chức',              description: 'Toàn quyền CRUD cấu trúc đơn vị',                     module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  { code: 'VIEW_UNITS',               name: 'Xem sơ đồ tổ chức đơn vị',           description: 'Xem cây tổ chức và danh sách đơn vị',                 module: 'SYSTEM', actionType: 'VIEW' },
  { code: 'ASSIGN_PERSONNEL_TO_UNIT', name: 'Gán nhân sự vào đơn vị',              description: 'Phân công cán bộ vào đơn vị tổ chức',                 module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  { code: 'VIEW_INFRASTRUCTURE',      name: 'Xem cấu hình hạ tầng',               description: 'Xem cấu hình server, database, dịch vụ',              module: 'SYSTEM', actionType: 'VIEW' },
  { code: 'MANAGE_INFRASTRUCTURE',    name: 'Quản lý cấu hình hạ tầng',            description: 'Cấu hình server, kết nối database, dịch vụ cloud',    module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  { code: 'VIEW_RBAC',                name: 'Xem cấu hình phân quyền RBAC',        description: 'Xem ma trận quyền và phân công chức vụ',               module: 'SYSTEM', actionType: 'VIEW' },
  { code: 'MANAGE_RBAC',              name: 'Quản lý phân quyền RBAC',             description: 'Toàn quyền quản lý chức vụ, chức năng, ma trận quyền', module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  { code: 'MANAGE_POSITIONS',         name: 'Quản lý chức vụ',                     description: 'Tạo, sửa, xóa chức vụ trong hệ thống',                module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  { code: 'MANAGE_FUNCTIONS',         name: 'Quản lý mã chức năng',                description: 'Tạo, sửa, xóa function codes trong RBAC',              module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  { code: 'MANAGE_SOD',               name: 'Quản lý tách biệt nhiệm vụ (SoD)',    description: 'Cấu hình các ràng buộc Separation of Duties',          module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  { code: 'LINK_PERSONNEL',           name: 'Liên kết tài khoản với cán bộ',        description: 'Kết nối tài khoản người dùng với hồ sơ cán bộ',        module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  { code: 'VIEW_AUDIT_LOG',           name: 'Xem nhật ký kiểm toán',               description: 'Xem log hoạt động và sự kiện hệ thống',               module: 'SYSTEM', actionType: 'VIEW' },
  { code: 'EXPORT_AUDIT_LOG',         name: 'Xuất nhật ký kiểm toán',              description: 'Xuất file audit log để phân tích',                    module: 'SYSTEM', actionType: 'EXPORT' },
  { code: 'VIEW_SYSTEM_HEALTH',       name: 'Xem giám sát hệ thống',               description: 'Xem trạng thái, tài nguyên và cảnh báo hệ thống',     module: 'SYSTEM', actionType: 'VIEW' },
  { code: 'VIEW_SYSTEM_STATS',        name: 'Xem thống kê hệ thống',               description: 'Xem số liệu sử dụng hệ thống theo thời gian',         module: 'SYSTEM', actionType: 'VIEW' },
  { code: 'MANAGE_API_GATEWAY',       name: 'Quản lý API Gateway',                  description: 'Tạo, quản lý API key và giám sát lưu lượng API',      module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  { code: 'MANAGE_AI_CONFIG',         name: 'Cấu hình AI & Machine Learning',       description: 'Cấu hình mô hình AI, API key và tham số ML',          module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  { code: 'MANAGE_BACKUP',            name: 'Quản lý sao lưu dữ liệu',             description: 'Tạo lịch sao lưu và phục hồi dữ liệu',                module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },
  { code: 'VIEW_DASHBOARD_ADMIN',     name: 'Xem Dashboard quản trị hệ thống',      description: 'Xem tổng quan quản trị hệ thống',                     module: 'SYSTEM', actionType: 'VIEW' },

  // ─── DATA ───
  { code: 'VIEW_DATA',                name: 'Xem dữ liệu BigData',                 description: 'Xem dữ liệu trong kho BigData',                        module: 'DATA', actionType: 'VIEW' },
  { code: 'CREATE_DATA',              name: 'Tải lên dữ liệu mới',                 description: 'Upload và tạo tập dữ liệu mới',                        module: 'DATA', actionType: 'CREATE' },
  { code: 'UPDATE_DATA',              name: 'Cập nhật dữ liệu',                    description: 'Chỉnh sửa và cập nhật tập dữ liệu',                   module: 'DATA', actionType: 'UPDATE' },
  { code: 'DELETE_DATA',              name: 'Xóa dữ liệu',                         description: 'Xóa tập dữ liệu khỏi kho BigData',                    module: 'DATA', actionType: 'DELETE', isCritical: true },
  { code: 'EXPORT_DATA',              name: 'Xuất dữ liệu BigData',                description: 'Xuất tập dữ liệu ra file hoặc hệ thống ngoài',         module: 'DATA', actionType: 'EXPORT' },
  { code: 'IMPORT_DATA',              name: 'Nhập dữ liệu vào BigData',             description: 'Nhập dữ liệu từ nguồn bên ngoài vào kho',             module: 'DATA', actionType: 'IMPORT' },
  { code: 'QUERY_DATA',               name: 'Truy vấn dữ liệu BigData',             description: 'Chạy truy vấn phân tích trên kho dữ liệu',            module: 'DATA', actionType: 'VIEW' },

  // ─── AI ───
  { code: 'USE_AI_CHAT',              name: 'Sử dụng AI Chat',                      description: 'Tương tác với trợ lý AI để hỏi đáp',                  module: 'AI', actionType: 'VIEW' },
  { code: 'VIEW_AI_INSIGHTS',         name: 'Xem AI Insights',                      description: 'Xem phân tích và dự báo từ AI',                        module: 'AI', actionType: 'VIEW' },
  { code: 'VIEW_AI_STUDENT_INSIGHTS', name: 'Xem AI phân tích học viên',            description: 'Xem phân tích xu hướng học tập của học viên từ AI',    module: 'AI', actionType: 'VIEW' },
  { code: 'VIEW_AI_FACULTY_INSIGHTS', name: 'Xem AI phân tích giảng viên',          description: 'Xem phân tích hiệu suất giảng viên từ AI',             module: 'AI', actionType: 'VIEW' },
  { code: 'VIEW_AI_PERSONNEL_INSIGHTS',name:'Xem AI phân tích cán bộ',             description: 'Xem phân tích nguồn nhân lực từ AI',                  module: 'AI', actionType: 'VIEW' },
  { code: 'PREDICT_AI_RISK',          name: 'Dự đoán rủi ro bằng AI',               description: 'Sử dụng AI dự đoán rủi ro học tập, nhân sự',          module: 'AI', actionType: 'VIEW' },
  { code: 'ANALYZE_AI_TRENDS',        name: 'Phân tích xu hướng bằng AI',           description: 'Phân tích xu hướng dữ liệu theo thời gian',           module: 'AI', actionType: 'VIEW' },
  { code: 'GENERATE_AI_REPORT',       name: 'Tạo báo cáo tự động bằng AI',          description: 'Tạo báo cáo phân tích tự động với AI',                module: 'AI', actionType: 'CREATE' },
  { code: 'VIEW_AI_RECOMMENDATIONS',  name: 'Xem đề xuất từ AI',                    description: 'Xem các gợi ý cải thiện từ hệ thống AI',              module: 'AI', actionType: 'VIEW' },
  { code: 'VIEW_AI_MONITOR',          name: 'Giám sát hiệu suất AI',                description: 'Xem trạng thái và hiệu suất các mô hình AI',          module: 'AI', actionType: 'VIEW' },
  { code: 'VIEW_AI_EARLY_WARNINGS',   name: 'Xem cảnh báo sớm từ AI',               description: 'Xem cảnh báo nguy cơ học lực, kỷ luật từ AI',         module: 'AI', actionType: 'VIEW' },

  // ─── EXAM ───
  { code: 'VIEW_EXAM_PLAN',           name: 'Xem kế hoạch thi',                    description: 'Xem lịch thi và kế hoạch khảo thí',                   module: 'SYSTEM', actionType: 'VIEW' },
  { code: 'CREATE_EXAM_PLAN',         name: 'Tạo kế hoạch thi',                    description: 'Lập kế hoạch tổ chức kỳ thi',                         module: 'SYSTEM', actionType: 'CREATE' },
  { code: 'APPROVE_EXAM_PLAN',        name: 'Phê duyệt kế hoạch thi',              description: 'Phê duyệt và ban hành kế hoạch thi',                  module: 'SYSTEM', actionType: 'APPROVE', isCritical: true },
  { code: 'VIEW_EXAM_SESSION',        name: 'Xem ca thi',                          description: 'Xem thông tin ca thi và danh sách thí sinh',          module: 'SYSTEM', actionType: 'VIEW' },
  { code: 'CREATE_EXAM_SESSION',      name: 'Tạo ca thi',                          description: 'Lập lịch và tổ chức ca thi cụ thể',                  module: 'SYSTEM', actionType: 'CREATE' },
  { code: 'SUPERVISE_EXAM',           name: 'Thực hiện coi thi',                   description: 'Ghi nhận việc coi thi và điểm danh thí sinh',         module: 'SYSTEM', actionType: 'UPDATE' },
  { code: 'REGISTER_EXAM',            name: 'Đăng ký thi',                         description: 'Học viên đăng ký tham gia kỳ thi',                    module: 'STUDENT', actionType: 'CREATE' },
  { code: 'MANAGE_EXAM_REG',          name: 'Quản lý đăng ký thi',                 description: 'Xử lý và xác nhận đăng ký thi của học viên',          module: 'SYSTEM', actionType: 'UPDATE' },

  // ─── DEPARTMENT ───
  { code: 'VIEW_DEPARTMENT',          name: 'Xem thông tin khoa / phòng ban',       description: 'Xem thông tin và cơ cấu khoa, phòng ban',              module: 'SYSTEM', actionType: 'VIEW' },
  { code: 'CREATE_DEPARTMENT',        name: 'Tạo khoa / phòng ban mới',             description: 'Tạo đơn vị khoa, phòng ban trong hệ thống',           module: 'SYSTEM', actionType: 'CREATE' },
  { code: 'UPDATE_DEPARTMENT',        name: 'Cập nhật thông tin khoa / phòng ban',  description: 'Chỉnh sửa thông tin đơn vị khoa, phòng ban',          module: 'SYSTEM', actionType: 'UPDATE' },
  { code: 'DELETE_DEPARTMENT',        name: 'Xóa khoa / phòng ban',                description: 'Xóa đơn vị khoa hoặc phòng ban',                      module: 'SYSTEM', actionType: 'DELETE' },

  // ─── AUDIT ───
  { code: 'VIEW_AUDIT_LOGS',          name: 'Xem nhật ký hệ thống',                description: 'Xem toàn bộ nhật ký hoạt động người dùng',            module: 'SYSTEM', actionType: 'VIEW' },
  { code: 'EXPORT_AUDIT_LOGS',        name: 'Xuất nhật ký hệ thống',               description: 'Xuất nhật ký để kiểm tra, phân tích bảo mật',         module: 'SYSTEM', actionType: 'EXPORT' },
  { code: 'VIEW_AUDIT_SUSPICIOUS',    name: 'Xem hoạt động bất thường',             description: 'Xem cảnh báo và hành vi đáng ngờ trong hệ thống',     module: 'SYSTEM', actionType: 'VIEW' },

  // ─── MONITORING ───
  { code: 'VIEW_MONITORING_ALERTS',   name: 'Xem cảnh báo hệ thống',               description: 'Xem danh sách cảnh báo và alert đang hoạt động',      module: 'SYSTEM', actionType: 'VIEW' },
  { code: 'MANAGE_MONITORING_ALERTS', name: 'Quản lý cảnh báo hệ thống',            description: 'Thiết lập và điều chỉnh quy tắc cảnh báo',            module: 'SYSTEM', actionType: 'UPDATE' },
  { code: 'VIEW_MONITORING_SERVICES', name: 'Xem trạng thái dịch vụ',               description: 'Xem uptime và trạng thái các dịch vụ',                module: 'SYSTEM', actionType: 'VIEW' },
  { code: 'MANAGE_MONITORING_SERVICES',name:'Quản lý dịch vụ hệ thống',            description: 'Khởi động, dừng, cấu hình các dịch vụ',               module: 'SYSTEM', actionType: 'UPDATE', isCritical: true },

  // ─── ETL ───
  { code: 'VIEW_ETL',                 name: 'Xem ETL Workflow',                     description: 'Xem danh sách và trạng thái các pipeline ETL',         module: 'DATA', actionType: 'VIEW' },
  { code: 'VIEW_ETL_LOGS',            name: 'Xem log ETL',                          description: 'Xem log thực thi và lỗi của pipeline ETL',             module: 'DATA', actionType: 'VIEW' },
  { code: 'CREATE_ETL',               name: 'Tạo ETL Workflow',                     description: 'Xây dựng pipeline xử lý dữ liệu mới',                 module: 'DATA', actionType: 'CREATE' },
  { code: 'UPDATE_ETL',               name: 'Cập nhật ETL Workflow',                description: 'Chỉnh sửa cấu hình pipeline ETL',                     module: 'DATA', actionType: 'UPDATE' },
  { code: 'DELETE_ETL',               name: 'Xóa ETL Workflow',                     description: 'Xóa pipeline ETL khỏi hệ thống',                      module: 'DATA', actionType: 'DELETE' },
  { code: 'EXECUTE_ETL',              name: 'Chạy ETL Workflow',                    description: 'Kích hoạt thực thi pipeline ETL thủ công',             module: 'DATA', actionType: 'UPDATE', isCritical: true },

  // ─── WORKFLOW (M13 Engine) ───
  { code: 'VIEW_WORKFLOW',                 name: 'Xem danh sách quy trình',              description: 'Xem danh sách workflow instances thuộc phạm vi quyền hạn',             module: 'WORKFLOW', actionType: 'VIEW' },
  { code: 'VIEW_WORKFLOW_DETAIL',          name: 'Xem chi tiết quy trình',               description: 'Xem đầy đủ thông tin và lịch sử của một workflow instance',             module: 'WORKFLOW', actionType: 'VIEW' },
  { code: 'VIEW_WORKFLOW_DEFS',            name: 'Xem định nghĩa quy trình',             description: 'Xem danh sách template và cấu hình quy trình',                         module: 'WORKFLOW', actionType: 'VIEW' },
  { code: 'MANAGE_WORKFLOW_DEFS',          name: 'Quản lý định nghĩa quy trình',         description: 'Tạo, sửa, xóa workflow template và phiên bản',                         module: 'WORKFLOW', actionType: 'CREATE',   isCritical: true },
  { code: 'VIEW_ALL_WORKFLOW_INSTANCES',   name: 'Xem tất cả quy trình đang chạy',       description: 'Xem toàn bộ workflow instances trong phạm vi quản lý',                 module: 'WORKFLOW', actionType: 'VIEW' },
  { code: 'APPROVE_WORKFLOW',             name: 'Phê duyệt bước quy trình',              description: 'Thực hiện hành động phê duyệt tại bước workflow hiện tại',             module: 'WORKFLOW', actionType: 'APPROVE',  isCritical: true },
  { code: 'REJECT_WORKFLOW',              name: 'Từ chối bước quy trình',                description: 'Từ chối hồ sơ tại bước workflow hiện tại',                             module: 'WORKFLOW', actionType: 'REJECT' },
  { code: 'CANCEL_WORKFLOW',              name: 'Hủy quy trình',                         description: 'Hủy toàn bộ workflow instance (người khởi tạo hoặc quản trị)',         module: 'WORKFLOW', actionType: 'UPDATE',   isCritical: true },
  { code: 'MONITOR_WORKFLOW',             name: 'Giám sát hiệu suất quy trình',          description: 'Xem dashboard tổng hợp, bottleneck và thống kê quy trình',             module: 'WORKFLOW', actionType: 'VIEW' },
  { code: 'WF.INITIATE',                  name: 'Khởi tạo quy trình mới',               description: 'Tạo workflow instance mới cho một đối tượng',                          module: 'WORKFLOW', actionType: 'SUBMIT' },
  { code: 'WF.ACT',                       name: 'Thực hiện hành động quy trình',         description: 'Approve / Reject / Return / Comment tại bước được giao',               module: 'WORKFLOW', actionType: 'APPROVE',  isCritical: true },
  { code: 'WF.SIGN',                      name: 'Ký số điện tử trong quy trình',         description: 'Thực hiện ký số tại bước yêu cầu chữ ký điện tử',                     module: 'WORKFLOW', actionType: 'APPROVE',  isCritical: true },
  { code: 'WF.DESIGN',                    name: 'Thiết kế mẫu quy trình',                description: 'Tạo và chỉnh sửa workflow template (chỉ bản DRAFT)',                   module: 'WORKFLOW', actionType: 'CREATE',   isCritical: true },
  { code: 'WF.OVERRIDE',                  name: 'Phê duyệt / Lưu trữ phiên bản QT',     description: 'Publish / Archive template version; can thiệp hoặc force cancel',      module: 'WORKFLOW', actionType: 'UPDATE',   isCritical: true },
  { code: 'WF.DASHBOARD',                 name: 'Xem dashboard quy trình toàn cục',      description: 'Xem tổng quan và KPI workflow toàn học viện',                          module: 'WORKFLOW', actionType: 'VIEW' },
  { code: 'WF.EXPORT',                    name: 'Xuất báo cáo quy trình',               description: 'Xuất thống kê, lịch sử và báo cáo workflow ra file',                   module: 'WORKFLOW', actionType: 'EXPORT' },
];

async function main() {
  console.log('🔄 Bước 1: Chuẩn hóa module name → UPPERCASE cho tất cả functions hiện có...');

  // Lấy toàn bộ functions hiện tại
  const existing = await prisma.function.findMany({ select: { id: true, code: true, module: true } });
  let normalizedCount = 0;

  for (const fn of existing) {
    const upper = fn.module.toUpperCase();
    if (fn.module !== upper) {
      await prisma.function.update({ where: { id: fn.id }, data: { module: upper } });
      normalizedCount++;
    }
  }
  console.log(`  ✅ Đã chuẩn hóa ${normalizedCount} / ${existing.length} records`);

  console.log('\n🔄 Bước 2: Upsert toàn bộ chức năng với tên tiếng Việt đầy đủ...');

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const fn of ALL_FUNCTIONS) {
    try {
      const result = await prisma.function.upsert({
        where: { code: fn.code },
        update: {
          name: fn.name,
          description: fn.description ?? null,
          module: fn.module,
          actionType: fn.actionType,
          isCritical: fn.isCritical ?? false,
          isActive: true,
        },
        create: {
          code: fn.code,
          name: fn.name,
          description: fn.description ?? null,
          module: fn.module,
          actionType: fn.actionType,
          isCritical: fn.isCritical ?? false,
          isActive: true,
        },
      });
      // If it was created (didn't exist before)
      const wasExisting = existing.find(e => e.code === fn.code);
      if (wasExisting) updated++; else created++;
    } catch (err: any) {
      errors.push(`${fn.code}: ${err.message}`);
    }
  }

  console.log(`  ✅ Tạo mới: ${created}`);
  console.log(`  ✅ Cập nhật: ${updated}`);
  if (errors.length > 0) {
    console.log(`  ⚠️  Lỗi: ${errors.length}`);
    errors.forEach(e => console.log(`    - ${e}`));
  }

  // Thống kê cuối
  const finalCount = await prisma.function.count();
  const byModule = await prisma.function.groupBy({ by: ['module'], _count: { id: true }, orderBy: { module: 'asc' } });
  console.log(`\n📊 Tổng kết: ${finalCount} chức năng`);
  byModule.forEach(m => console.log(`  ${m.module.padEnd(20)} ${m._count.id} chức năng`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
