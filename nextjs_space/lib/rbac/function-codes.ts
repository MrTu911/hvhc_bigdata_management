/**
 * FUNCTION CODES - Mã chức năng theo module
 * 
 * Quy ước đặt tên:
 * - VIEW_*: Xem dữ liệu
 * - CREATE_*: Tạo mới
 * - UPDATE_*: Cập nhật
 * - DELETE_*: Xóa
 * - APPROVE_*: Phê duyệt
 * - REJECT_*: Từ chối
 * - SUBMIT_*: Gửi yêu cầu
 * - EXPORT_*: Xuất dữ liệu
 * - IMPORT_*: Nhập dữ liệu
 * - MANAGE_*: Quản lý (full CRUD)
 */

// ===== MODULE: PERSONNEL (QUÂN NHÂN) =====
export const PERSONNEL = {
  VIEW: 'VIEW_PERSONNEL',           // Xem danh sách cán bộ
  VIEW_DETAIL: 'VIEW_PERSONNEL_DETAIL', // Xem chi tiết hồ sơ
  VIEW_SENSITIVE: 'VIEW_PERSONNEL_SENSITIVE', // Xem thông tin nhạy cảm (lương, CCCD...)
  CREATE: 'CREATE_PERSONNEL',       // Thêm cán bộ mới
  UPDATE: 'UPDATE_PERSONNEL',       // Cập nhật thông tin
  DELETE: 'DELETE_PERSONNEL',       // Xóa cán bộ
  APPROVE: 'APPROVE_PERSONNEL',     // Phê duyệt hồ sơ
  EXPORT: 'EXPORT_PERSONNEL',       // Xuất danh sách
  IMPORT: 'IMPORT_PERSONNEL',       // Nhập dữ liệu
  SUBMIT: 'SUBMIT_PERSONNEL',       // Gửi hồ sơ duyệt
} as const;

// ===== MODULE: TRAINING (GIẢNG DẠY) =====
export const TRAINING = {
  VIEW: 'VIEW_TRAINING',            // Xem thông tin đào tạo
  VIEW_COURSE: 'VIEW_COURSE',       // Xem môn học/khóa học
  CREATE_COURSE: 'CREATE_COURSE',   // Tạo khóa học
  UPDATE_COURSE: 'UPDATE_COURSE',   // Cập nhật khóa học
  DELETE_COURSE: 'DELETE_COURSE',   // Xóa khóa học
  VIEW_GRADE: 'VIEW_GRADE',         // Xem điểm
  CREATE_GRADE_DRAFT: 'CREATE_GRADE_DRAFT', // Tạo điểm nháp
  SUBMIT_GRADE: 'SUBMIT_GRADE',     // Gửi điểm lên duyệt
  APPROVE_GRADE: 'APPROVE_GRADE',   // Phê duyệt điểm
  REJECT_GRADE: 'REJECT_GRADE',     // Từ chối điểm
  REGISTER_COURSE: 'REGISTER_COURSE', // Đăng ký khóa học
} as const;

// ===== MODULE: EDUCATION (CHƯƠNG TRÌNH ĐÀO TẠO) =====
export const EDUCATION = {
  // Chương trình đào tạo
  VIEW_PROGRAM: 'VIEW_PROGRAM',           // Xem CTĐT
  CREATE_PROGRAM: 'CREATE_PROGRAM',       // Tạo CTĐT mới
  UPDATE_PROGRAM: 'UPDATE_PROGRAM',       // Cập nhật CTĐT
  DELETE_PROGRAM: 'DELETE_PROGRAM',       // Xóa CTĐT
  APPROVE_PROGRAM: 'APPROVE_PROGRAM',     // Phê duyệt CTĐT
  // Khung chương trình
  VIEW_CURRICULUM: 'VIEW_CURRICULUM',     // Xem khung CTĐT
  CREATE_CURRICULUM: 'CREATE_CURRICULUM', // Tạo khung CTĐT
  UPDATE_CURRICULUM: 'UPDATE_CURRICULUM', // Cập nhật khung CTĐT
  DELETE_CURRICULUM: 'DELETE_CURRICULUM', // Xóa khung CTĐT
  // Năm học & Học kỳ
  VIEW_TERM: 'VIEW_TERM',                 // Xem năm học/học kỳ
  MANAGE_TERM: 'MANAGE_TERM',             // Quản lý năm học/học kỳ
  // Lớp học phần
  VIEW_CLASS_SECTION: 'VIEW_CLASS_SECTION',     // Xem lớp học phần
  CREATE_CLASS_SECTION: 'CREATE_CLASS_SECTION', // Tạo lớp học phần
  UPDATE_CLASS_SECTION: 'UPDATE_CLASS_SECTION', // Cập nhật lớp học phần
  DELETE_CLASS_SECTION: 'DELETE_CLASS_SECTION', // Xóa lớp học phần
  // Lịch huấn luyện
  VIEW_SCHEDULE: 'VIEW_SCHEDULE',         // Xem lịch học
  CREATE_SCHEDULE: 'CREATE_SCHEDULE',     // Tạo lịch học
  UPDATE_SCHEDULE: 'UPDATE_SCHEDULE',     // Cập nhật lịch học
  DELETE_SCHEDULE: 'DELETE_SCHEDULE',     // Xóa lịch học
  // Điểm danh
  VIEW_ATTENDANCE: 'VIEW_ATTENDANCE',     // Xem điểm danh
  MANAGE_ATTENDANCE: 'MANAGE_ATTENDANCE', // Quản lý điểm danh
  // Ghi danh
  VIEW_ENROLLMENT: 'VIEW_ENROLLMENT',     // Xem ghi danh
  MANAGE_ENROLLMENT: 'MANAGE_ENROLLMENT', // Quản lý ghi danh
  // Hồ sơ người học (M10)
  VIEW_STUDENT: 'VIEW_STUDENT',           // Xem hồ sơ học viên
  CREATE_STUDENT: 'CREATE_STUDENT',       // Tạo hồ sơ học viên
  UPDATE_STUDENT: 'UPDATE_STUDENT',       // Cập nhật hồ sơ học viên
  VIEW_STUDENT_PROFILE360: 'VIEW_STUDENT_PROFILE360', // Xem hồ sơ 360° học viên
  // Rèn luyện / khen thưởng / kỷ luật học viên (M10)
  VIEW_CONDUCT: 'VIEW_CONDUCT',           // Xem điểm rèn luyện
  MANAGE_CONDUCT: 'MANAGE_CONDUCT',       // Quản lý điểm rèn luyện
  // Điểm và kết quả học phần (M10 – UC-56)
  VIEW_GRADE: 'VIEW_GRADE',               // Xem điểm học phần
  MANAGE_GRADE: 'MANAGE_GRADE',           // Nhập / sửa điểm (giảng viên)
  APPROVE_GRADE: 'APPROVE_GRADE',         // Duyệt điểm (Phòng đào tạo)
  // Cảnh báo học vụ (M10 – UC-57)
  VIEW_WARNING: 'VIEW_WARNING',           // Xem cảnh báo học vụ
  MANAGE_WARNING: 'MANAGE_WARNING',       // Chạy engine / đánh dấu giải quyết
  // Khóa luận / Luận văn (M10 – UC-59)
  VIEW_THESIS: 'VIEW_THESIS',             // Xem danh sách khóa luận
  MANAGE_THESIS: 'MANAGE_THESIS',         // Tạo / cập nhật khóa luận
  // Xét tốt nghiệp (M10 – UC-60)
  VIEW_GRADUATION: 'VIEW_GRADUATION',     // Xem kết quả xét tốt nghiệp
  RUN_GRADUATION: 'RUN_GRADUATION',       // Chạy graduation engine
  APPROVE_GRADUATION: 'APPROVE_GRADUATION', // Duyệt tốt nghiệp
  EXPORT_GRADUATION: 'EXPORT_GRADUATION', // Xuất danh sách / văn bằng
  // Kho học vụ (M10 – UC-61)
  VIEW_REPOSITORY: 'VIEW_REPOSITORY',     // Tra cứu kho học vụ
  // Hệ đào tạo & Tiểu đoàn (M10 – unit hierarchy)
  VIEW_TRAINING_SYSTEM: 'VIEW_TRAINING_SYSTEM',     // Xem danh sách và chi tiết Hệ đào tạo
  MANAGE_TRAINING_SYSTEM: 'MANAGE_TRAINING_SYSTEM', // Quản lý cấu hình Hệ đào tạo
  VIEW_BATTALION: 'VIEW_BATTALION',                 // Xem danh sách và chi tiết Tiểu đoàn
  MANAGE_BATTALION: 'MANAGE_BATTALION',             // Quản lý cấu hình Tiểu đoàn
} as const;

// ===== MODULE: EXAM (KHẢO THÍ) =====
export const EXAM = {
  // Kế hoạch thi
  VIEW_EXAM_PLAN: 'VIEW_EXAM_PLAN',         // Xem kế hoạch thi
  CREATE_EXAM_PLAN: 'CREATE_EXAM_PLAN',     // Tạo kế hoạch thi
  UPDATE_EXAM_PLAN: 'UPDATE_EXAM_PLAN',     // Cập nhật kế hoạch thi
  DELETE_EXAM_PLAN: 'DELETE_EXAM_PLAN',     // Xóa kế hoạch thi
  APPROVE_EXAM_PLAN: 'APPROVE_EXAM_PLAN',   // Phê duyệt kế hoạch thi
  PUBLISH_EXAM_PLAN: 'PUBLISH_EXAM_PLAN',   // Công bố kế hoạch thi
  // Ca thi
  VIEW_EXAM_SESSION: 'VIEW_EXAM_SESSION',   // Xem ca thi
  CREATE_EXAM_SESSION: 'CREATE_EXAM_SESSION', // Tạo ca thi
  UPDATE_EXAM_SESSION: 'UPDATE_EXAM_SESSION', // Cập nhật ca thi
  DELETE_EXAM_SESSION: 'DELETE_EXAM_SESSION', // Xóa ca thi
  SUPERVISE_EXAM: 'SUPERVISE_EXAM',         // Coi thi
  // Đăng ký thi
  VIEW_EXAM_REG: 'VIEW_EXAM_REG',           // Xem đăng ký thi
  MANAGE_EXAM_REG: 'MANAGE_EXAM_REG',       // Quản lý đăng ký thi
  REGISTER_EXAM: 'REGISTER_EXAM',           // Đăng ký thi (học viên)
} as const;

// ===== MODULE: QUESTION_BANK (NGÂN HÀNG CÂU HỎI) =====
export const QUESTION_BANK = {
  VIEW: 'VIEW_QUESTION_BANK',             // Xem ngân hàng câu hỏi
  CREATE: 'CREATE_QUESTION_BANK',         // Tạo ngân hàng câu hỏi
  UPDATE: 'UPDATE_QUESTION_BANK',         // Cập nhật
  DELETE: 'DELETE_QUESTION_BANK',         // Xóa
  // Câu hỏi
  VIEW_QUESTION: 'VIEW_QUESTION',         // Xem câu hỏi
  CREATE_QUESTION: 'CREATE_QUESTION',     // Tạo câu hỏi
  UPDATE_QUESTION: 'UPDATE_QUESTION',     // Cập nhật câu hỏi
  DELETE_QUESTION: 'DELETE_QUESTION',     // Xóa câu hỏi
  REVIEW_QUESTION: 'REVIEW_QUESTION',     // Duyệt câu hỏi
  IMPORT_QUESTION: 'IMPORT_QUESTION',     // Nhập câu hỏi
  EXPORT_QUESTION: 'EXPORT_QUESTION',     // Xuất câu hỏi
} as const;

// ===== MODULE: LEARNING_MATERIAL (HỌC LIỆU) =====
export const LEARNING_MATERIAL = {
  VIEW: 'VIEW_LEARNING_MATERIAL',         // Xem học liệu
  CREATE: 'CREATE_LEARNING_MATERIAL',     // Tạo học liệu
  UPDATE: 'UPDATE_LEARNING_MATERIAL',     // Cập nhật học liệu
  DELETE: 'DELETE_LEARNING_MATERIAL',     // Xóa học liệu
  DOWNLOAD: 'DOWNLOAD_LEARNING_MATERIAL', // Tải học liệu
  UPLOAD: 'UPLOAD_LEARNING_MATERIAL',     // Upload học liệu
  APPROVE: 'APPROVE_LEARNING_MATERIAL',   // Phê duyệt học liệu
} as const;

// ===== MODULE: LAB (PHÒNG THÍ NGHIỆM) =====
export const LAB = {
  // Phòng thí nghiệm
  VIEW: 'VIEW_LAB',                       // Xem PTN
  CREATE: 'CREATE_LAB',                   // Tạo PTN
  UPDATE: 'UPDATE_LAB',                   // Cập nhật PTN
  DELETE: 'DELETE_LAB',                   // Xóa PTN
  // Thiết bị
  VIEW_EQUIPMENT: 'VIEW_LAB_EQUIPMENT',   // Xem thiết bị
  CREATE_EQUIPMENT: 'CREATE_LAB_EQUIPMENT', // Thêm thiết bị
  UPDATE_EQUIPMENT: 'UPDATE_LAB_EQUIPMENT', // Cập nhật thiết bị
  DELETE_EQUIPMENT: 'DELETE_LAB_EQUIPMENT', // Xóa thiết bị
  MANAGE_MAINTENANCE: 'MANAGE_LAB_MAINTENANCE', // Quản lý bảo trì
  // Buổi thực hành
  VIEW_SESSION: 'VIEW_LAB_SESSION',       // Xem buổi thực hành
  CREATE_SESSION: 'CREATE_LAB_SESSION',   // Tạo buổi thực hành
  UPDATE_SESSION: 'UPDATE_LAB_SESSION',   // Cập nhật buổi thực hành
  DELETE_SESSION: 'DELETE_LAB_SESSION',   // Xóa buổi thực hành
} as const;

// ===== MODULE: RESEARCH (NGHIÊN CỨU) =====
export const RESEARCH = {
  VIEW: 'VIEW_RESEARCH',            // Xem đề tài
  CREATE: 'CREATE_RESEARCH',        // Tạo đề tài
  UPDATE: 'UPDATE_RESEARCH',        // Cập nhật đề tài
  DELETE: 'DELETE_RESEARCH',        // Xóa đề tài
  SUBMIT: 'SUBMIT_RESEARCH',        // Nộp đề tài
  REVIEW: 'REVIEW_RESEARCH',        // Xét duyệt đề tài
  APPROVE: 'APPROVE_RESEARCH',      // Phê duyệt đề tài
  REJECT: 'REJECT_RESEARCH',        // Từ chối đề tài
  EVALUATE: 'EVALUATE_RESEARCH',    // Đánh giá đề tài
  // UC-46: Công bố khoa học
  PUB_VIEW: 'VIEW_RESEARCH_PUB',    // Xem danh sách công bố
  PUB_CREATE: 'CREATE_RESEARCH_PUB', // Thêm công bố mới
  PUB_UPDATE: 'UPDATE_RESEARCH_PUB', // Cập nhật công bố
  PUB_DELETE: 'DELETE_RESEARCH_PUB', // Xóa công bố
  PUB_IMPORT: 'IMPORT_RESEARCH_PUB', // Import BibTeX/Excel
  PUB_EXPORT: 'EXPORT_RESEARCH_PUB', // Export danh mục
  PUB_REVIEW: 'REVIEW_RESEARCH_PUB', // Phòng KH duyệt/từ chối công bố cá nhân
  // UC-47: Hồ sơ nhà khoa học
  SCIENTIST_VIEW:   'VIEW_RESEARCH_SCIENTIST',   // Xem hồ sơ nhà khoa học
  SCIENTIST_UPDATE: 'UPDATE_RESEARCH_SCIENTIST', // Cập nhật hồ sơ nhà khoa học
  SCIENTIST_EXPORT: 'EXPORT_RESEARCH_SCIENTIST', // Export hồ sơ / bản đồ năng lực
} as const;

// ===== MODULE: PARTY (ĐẢNG VIÊN) =====
export const PARTY = {
  // Generic (backward compatibility)
  VIEW: 'VIEW_PARTY',
  CREATE: 'CREATE_PARTY',
  UPDATE: 'UPDATE_PARTY',
  DELETE: 'DELETE_PARTY',
  APPROVE: 'APPROVE_PARTY',

  // Member & sensitive profile
  VIEW_MEMBER: 'VIEW_PARTY_MEMBER',
  CREATE_MEMBER: 'CREATE_PARTY_MEMBER',
  UPDATE_MEMBER: 'UPDATE_PARTY_MEMBER',
  DELETE_MEMBER: 'DELETE_PARTY_MEMBER',
  VIEW_SENSITIVE: 'VIEW_PARTY_MEMBER_SENSITIVE',
  UPDATE_SENSITIVE: 'UPDATE_PARTY_MEMBER_SENSITIVE',

  // Organization
  VIEW_ORG: 'VIEW_PARTY_ORG',
  CREATE_ORG: 'CREATE_PARTY_ORG',
  UPDATE_ORG: 'UPDATE_PARTY_ORG',

  // Meeting / Activity / Fee
  VIEW_MEETING: 'VIEW_PARTY_MEETING',
  MANAGE_MEETING: 'MANAGE_PARTY_MEETING',
  VIEW_ACTIVITY: 'VIEW_PARTY_ACTIVITY',
  MANAGE_ACTIVITY: 'MANAGE_PARTY_ACTIVITY',
  VIEW_FEE: 'VIEW_PARTY_FEE',
  MANAGE_FEE: 'MANAGE_PARTY_FEE',

  // Review / Discipline / Transfer / Admission
  VIEW_REVIEW: 'VIEW_PARTY_REVIEW',
  MANAGE_REVIEW: 'MANAGE_PARTY_REVIEW',
  VIEW_DISCIPLINE: 'VIEW_PARTY_DISCIPLINE',
  APPROVE_DISCIPLINE: 'APPROVE_PARTY_DISCIPLINE',
  VIEW_TRANSFER: 'VIEW_PARTY_TRANSFER',
  APPROVE_TRANSFER: 'APPROVE_PARTY_TRANSFER',
  VIEW_ADMISSION: 'VIEW_PARTY_ADMISSION',
  APPROVE_ADMISSION: 'APPROVE_PARTY_ADMISSION',

  // Inspection / Dashboard / Reports
  VIEW_INSPECTION: 'VIEW_PARTY_INSPECTION',
  MANAGE_INSPECTION: 'MANAGE_PARTY_INSPECTION',
  VIEW_DASHBOARD: 'VIEW_PARTY_DASHBOARD',
  VIEW_REPORT: 'VIEW_PARTY_REPORT',
  EXPORT_REPORT: 'EXPORT_PARTY_REPORT',
} as const;

// ===== MODULE: POLICY (CHÍNH SÁCH) =====
export const POLICY = {
  VIEW: 'VIEW_POLICY',              // Xem chính sách
  CREATE: 'CREATE_POLICY',          // Tạo chính sách
  CREATE_REQUEST: 'CREATE_POLICY_REQUEST', // Tạo hồ sơ yêu cầu
  UPDATE: 'UPDATE_POLICY',          // Cập nhật
  DELETE: 'DELETE_POLICY',          // Xóa
  APPROVE: 'APPROVE_POLICY',        // Phê duyệt
  REJECT: 'REJECT_POLICY',          // Từ chối
  REVIEW: 'REVIEW_POLICY',          // Xét duyệt
} as const;

// ===== MODULE: INSURANCE (BẢO HIỂM) =====
export const INSURANCE = {
  VIEW: 'VIEW_INSURANCE',           // Xem bảo hiểm
  CREATE: 'CREATE_INSURANCE',       // Tạo hồ sơ
  UPDATE: 'UPDATE_INSURANCE',       // Cập nhật
  DELETE: 'DELETE_INSURANCE',       // Xóa
  APPROVE_CLAIM: 'APPROVE_INSURANCE_CLAIM', // Phê duyệt yêu cầu
} as const;

// ===== MODULE: AWARDS (THI ĐUA - KHEN THƯỢNG) =====
export const AWARDS = {
  VIEW: 'VIEW_AWARD',               // Xem khen thưởng
  CREATE: 'CREATE_AWARD',           // Đề xuất khen thưởng
  UPDATE: 'UPDATE_AWARD',           // Cập nhật
  DELETE: 'DELETE_AWARD',           // Xóa
  APPROVE: 'APPROVE_AWARD',         // Phê duyệt
  VIEW_DISCIPLINE: 'VIEW_DISCIPLINE', // Xem kỷ luật
  CREATE_DISCIPLINE: 'CREATE_DISCIPLINE', // Tạo kỷ luật
  APPROVE_DISCIPLINE: 'APPROVE_DISCIPLINE', // Phê duyệt kỷ luật
} as const;

// ===== MODULE: STUDENT (HỌC VIÊN) =====
export const STUDENT = {
  VIEW: 'VIEW_STUDENT',             // Xem thông tin học viên
  VIEW_DETAIL: 'VIEW_STUDENT_DETAIL', // Xem chi tiết
  CREATE: 'CREATE_STUDENT',         // Thêm học viên
  UPDATE: 'UPDATE_STUDENT',         // Cập nhật
  DELETE: 'DELETE_STUDENT',         // Xóa
  EXPORT: 'EXPORT_STUDENT',         // Xuất danh sách
  // M07 – GPA & academic status
  GPA_VIEW: 'VIEW_STUDENT_GPA',           // Xem GPA tích lũy và lịch sử GPA theo kỳ
  GPA_MANAGE: 'MANAGE_STUDENT_GPA',       // Trigger rebuild GPA batch, ghi StudentGpaHistory + AcademicWarning
  CONDUCT_VIEW: 'VIEW_STUDENT_CONDUCT',   // Xem điểm rèn luyện học viên
  DASHBOARD_VIEW: 'VIEW_STUDENT_DASHBOARD', // Xem dashboard học viên tổng hợp
  // M07 – Hồ sơ 360°
  PROFILE360_VIEW: 'VIEW_STUDENT_PROFILE360', // Xem hồ sơ 360° tổng hợp học viên
} as const;

// ===== MODULE: FACULTY (GIẢNG VIÊN) =====
export const FACULTY = {
  VIEW: 'VIEW_FACULTY',             // Xem danh sách giảng viên
  VIEW_DETAIL: 'VIEW_FACULTY_DETAIL', // Xem chi tiết
  CREATE: 'CREATE_FACULTY',         // Thêm giảng viên
  UPDATE: 'UPDATE_FACULTY',         // Cập nhật
  DELETE: 'DELETE_FACULTY',         // Xóa
  EXPORT: 'EXPORT_FACULTY',         // Xuất danh sách
  IMPORT: 'IMPORT_FACULTY',         // Nhập dữ liệu
  VIEW_RESEARCH: 'VIEW_FACULTY_RESEARCH', // Xem nghiên cứu
  VIEW_STATS: 'VIEW_FACULTY_STATS', // Xem thống kê giảng viên (Dashboard Khoa)
  VIEW_INSTRUCTORS: 'VIEW_FACULTY_INSTRUCTORS', // Xem danh sách giảng viên của khoa
  VIEW_CLASSES: 'VIEW_FACULTY_CLASSES', // Xem lớp học của khoa
  VIEW_PERFORMANCE: 'VIEW_FACULTY_PERFORMANCE', // Xem hiệu suất giảng viên
  // M07 – EIS Score
  EIS_VIEW: 'VIEW_FACULTY_EIS',     // Xem điểm EIS và lịch sử EIS
  EIS_MANAGE: 'MANAGE_FACULTY_EIS', // Trigger tính EIS (batch/single), ghi FacultyEISScore
  // M07 – Hồ sơ 360°
  PROFILE360_VIEW: 'VIEW_FACULTY_PROFILE360', // Xem hồ sơ 360° tổng hợp
  // M07 – Tải giảng
  WORKLOAD_VIEW: 'VIEW_FACULTY_WORKLOAD',     // Xem snapshot tải giảng và cảnh báo quá tải
  WORKLOAD_MANAGE: 'MANAGE_FACULTY_WORKLOAD', // Trigger rebuild workload snapshot batch/single
} as const;

// ===== MODULE: DATA (DỮ LIỆU) =====
export const DATA = {
  VIEW: 'VIEW_DATA',                // Xem dữ liệu
  CREATE: 'CREATE_DATA',            // Tạo/upload dữ liệu
  UPDATE: 'UPDATE_DATA',            // Cập nhật dữ liệu
  DELETE: 'DELETE_DATA',            // Xóa dữ liệu
  EXPORT: 'EXPORT_DATALAKE',         // Xuất dữ liệu (data module – tránh trùng với M18 EXPORT_DATA)
  IMPORT: 'IMPORT_DATA',            // Nhập dữ liệu
  QUERY: 'QUERY_DATA',              // Truy vấn dữ liệu
} as const;

// ===== MODULE: SYSTEM (HỆ THỐNG) =====
export const SYSTEM = {
  // User Management
  MANAGE_USERS: 'MANAGE_USERS',     // Quản lý người dùng (full CRUD)
  VIEW_USERS: 'VIEW_USERS',         // Xem danh sách người dùng
  RESET_PASSWORD: 'RESET_USER_PASSWORD', // Reset mật khẩu
  TOGGLE_USER_STATUS: 'TOGGLE_USER_STATUS', // Khóa/mở khóa tài khoản
  
  // Unit Management
  MANAGE_UNITS: 'MANAGE_UNITS',     // Quản lý đơn vị (full CRUD)
  VIEW_UNITS: 'VIEW_UNITS',         // Xem đơn vị
  ASSIGN_PERSONNEL: 'ASSIGN_PERSONNEL_TO_UNIT', // Gán nhân sự vào đơn vị
  
  // Infrastructure Management
  VIEW_INFRASTRUCTURE: 'VIEW_INFRASTRUCTURE', // Xem cấu hình hạ tầng
  MANAGE_INFRASTRUCTURE: 'MANAGE_INFRASTRUCTURE', // Quản lý cấu hình hạ tầng
  
  // RBAC Management
  VIEW_RBAC: 'VIEW_RBAC',           // Xem cấu hình RBAC
  MANAGE_RBAC: 'MANAGE_RBAC',       // Quản lý RBAC (positions, functions)
  MANAGE_POSITIONS: 'MANAGE_POSITIONS', // Quản lý chức vụ
  MANAGE_FUNCTIONS: 'MANAGE_FUNCTIONS', // Quản lý function codes
  MANAGE_SOD: 'MANAGE_SOD',         // Quản lý Separation of Duties
  LINK_PERSONNEL: 'LINK_PERSONNEL', // Liên kết tài khoản - cán bộ
  
  // Audit & Monitoring
  VIEW_AUDIT_LOG: 'VIEW_AUDIT_LOG', // Xem log kiểm toán
  EXPORT_AUDIT_LOG: 'EXPORT_AUDIT_LOG', // Xuất log kiểm toán
  VIEW_SYSTEM_HEALTH: 'VIEW_SYSTEM_HEALTH', // Giám sát hệ thống
  VIEW_SYSTEM_STATS: 'VIEW_SYSTEM_STATS', // Xem thống kê hệ thống
  
  // API Gateway
  MANAGE_API_GATEWAY: 'MANAGE_API_GATEWAY', // Quản lý API Gateway
  
  // AI & Config
  MANAGE_AI_CONFIG: 'MANAGE_AI_CONFIG', // Cấu hình AI
  MANAGE_BACKUP: 'MANAGE_BACKUP',   // Sao lưu
  
  // Dashboard
  VIEW_DASHBOARD: 'VIEW_DASHBOARD_ADMIN', // Xem dashboard admin
} as const;

// ===== MODULE: DASHBOARD =====
export const DASHBOARD = {
  VIEW: 'VIEW_DASHBOARD',           // Xem dashboard cơ bản
  VIEW_COMMAND: 'VIEW_DASHBOARD_COMMAND', // Dashboard chỉ huy
  VIEW_ADMIN: 'VIEW_DASHBOARD_ADMIN', // Dashboard admin
  VIEW_FACULTY: 'VIEW_DASHBOARD_FACULTY', // Dashboard giảng viên
  VIEW_STUDENT: 'VIEW_DASHBOARD_STUDENT', // Dashboard học viên
} as const;

// ===== MODULE: AI (TRÍ TUỆ NHÂN TẠO) =====
export const AI = {
  // Chat & Tương tác
  USE_CHAT: 'USE_AI_CHAT',                    // Sử dụng AI chat
  
  // Phân tích & Insights
  VIEW_INSIGHTS: 'VIEW_AI_INSIGHTS',          // Xem AI insights
  VIEW_STUDENT_INSIGHTS: 'VIEW_AI_STUDENT_INSIGHTS', // Xem insights học viên
  VIEW_FACULTY_INSIGHTS: 'VIEW_AI_FACULTY_INSIGHTS', // Xem insights giảng viên
  VIEW_PERSONNEL_INSIGHTS: 'VIEW_AI_PERSONNEL_INSIGHTS', // Xem insights nhân sự
  
  // Dự đoán & Phân tích
  PREDICT_RISK: 'PREDICT_AI_RISK',            // Dự đoán rủi ro
  ANALYZE_TRENDS: 'ANALYZE_AI_TRENDS',        // Phân tích xu hướng
  ANALYZE_SENTIMENT: 'ANALYZE_AI_SENTIMENT',  // Phân tích cảm xúc
  
  // Báo cáo & Đề xuất
  GENERATE_REPORT: 'GENERATE_AI_REPORT',      // Tạo báo cáo AI
  VIEW_RECOMMENDATIONS: 'VIEW_AI_RECOMMENDATIONS', // Xem đề xuất
  
  // Giám sát & Cảnh báo
  VIEW_MONITOR: 'VIEW_AI_MONITOR',            // Xem giám sát AI
  VIEW_EARLY_WARNINGS: 'VIEW_AI_EARLY_WARNINGS', // Xem cảnh báo sớm
  
  // NLP & Xử lý văn bản
  ANALYZE_FEEDBACK: 'ANALYZE_AI_FEEDBACK',    // Phân tích phản hồi
  SUMMARIZE: 'SUMMARIZE_AI',                  // Tóm tắt nội dung
} as const;

// ===== MODULE: INFRA (M12 – QUẢN LÝ DỮ LIỆU & HẠ TẦNG) =====
export const INFRA = {
  VIEW:              'INFRA.VIEW',              // Xem tổng quan hạ tầng
  PIPELINE_VIEW:     'INFRA.PIPELINE_VIEW',     // Xem pipeline definitions và runs
  PIPELINE_MANAGE:   'INFRA.PIPELINE_MANAGE',   // Trigger, disable pipeline
  STORAGE_VIEW:      'INFRA.STORAGE_VIEW',      // Xem bucket config và usage
  STORAGE_MANAGE:    'INFRA.STORAGE_MANAGE',    // Sửa lifecycle/retention policy
  DATA_QUALITY_VIEW: 'INFRA.DATA_QUALITY_VIEW', // Xem DQ rules và results
  DATA_QUALITY_MANAGE: 'INFRA.DATA_QUALITY_MANAGE', // Tạo/sửa DQ rules
  BACKUP_VIEW:       'INFRA.BACKUP_VIEW',       // Xem backup jobs và artifacts
  BACKUP_MANAGE:     'INFRA.BACKUP_MANAGE',     // Trigger backup thủ công
  RESTORE_REQUEST:   'INFRA.RESTORE_REQUEST',   // Yêu cầu restore
  RESTORE_MANAGE:    'INFRA.RESTORE_MANAGE',    // Approve/verify restore (cấp cao hơn)
  DR_VIEW:           'INFRA.DR_VIEW',           // Xem DR plans và exercises
  DR_MANAGE:         'INFRA.DR_MANAGE',         // Tạo DR plan, ghi kết quả diễn tập
  ALERT_VIEW:        'INFRA.ALERT_VIEW',        // Xem metric threshold policies
  ALERT_MANAGE:      'INFRA.ALERT_MANAGE',      // Sửa ngưỡng cảnh báo
  ADMIN:             'INFRA.ADMIN',             // Toàn quyền module hạ tầng
} as const;

// ===== MODULE: MONITORING (GIÁM SÁT HỆ THỐNG) =====
export const MONITORING = {
  VIEW_ALERTS: 'VIEW_MONITORING_ALERTS',      // Xem cảnh báo
  MANAGE_ALERTS: 'MANAGE_MONITORING_ALERTS',  // Quản lý cảnh báo
  VIEW_SERVICES: 'VIEW_MONITORING_SERVICES',  // Xem dịch vụ
  MANAGE_SERVICES: 'MANAGE_MONITORING_SERVICES', // Quản lý dịch vụ
} as const;

// ===== MODULE: AUDIT (KIỂM TOÁN) =====
export const AUDIT = {
  VIEW_LOGS: 'VIEW_AUDIT_LOGS',               // Xem audit logs
  EXPORT_LOGS: 'EXPORT_AUDIT_LOGS',           // Xuất audit logs
  VIEW_SUSPICIOUS: 'VIEW_AUDIT_SUSPICIOUS',   // Xem hoạt động đáng ngờ
} as const;

// ===== MODULE: ML (MACHINE LEARNING) =====
export const ML = {
  VIEW_MODELS: 'VIEW_ML_MODELS',              // Xem ML models
  MANAGE_MODELS: 'MANAGE_ML_MODELS',          // Quản lý ML models
  TRAIN_MODELS: 'TRAIN_ML_MODELS',            // Huấn luyện models
} as const;

// ===== MODULE: SECURITY (BẢO MẬT) =====
export const SECURITY = {
  VIEW_POLICY: 'VIEW_SECURITY_POLICY',        // Xem chính sách bảo mật
  MANAGE_POLICY: 'MANAGE_SECURITY_POLICY',    // Quản lý chính sách bảo mật
  // UC-06: Session management
  VIEW_SESSIONS: 'VIEW_AUTH_SESSIONS',        // Xem danh sách phiên đăng nhập
  REVOKE_SESSION: 'REVOKE_AUTH_SESSION',      // Thu hồi phiên đăng nhập
} as const;

// ===== MODULE: GOVERNANCE (QUẢN TRỊ DỮ LIỆU) =====
export const GOVERNANCE = {
  VIEW: 'VIEW_GOVERNANCE',                    // Xem governance
  VIEW_COMPLIANCE: 'VIEW_GOVERNANCE_COMPLIANCE', // Xem compliance
  VIEW_LINEAGE: 'VIEW_GOVERNANCE_LINEAGE',    // Xem data lineage
  VIEW_RETENTION: 'VIEW_GOVERNANCE_RETENTION', // Xem retention policies
  MANAGE: 'MANAGE_GOVERNANCE',                // Quản lý governance
} as const;

// ===== MODULE: MASTER_DATA – M19 MDM =====
// MANAGE_MASTER_DATA is seeded in seed_master_data_v1.ts.
// Use these codes for all /api/admin/master-data/** routes.
export const MASTER_DATA = {
  MANAGE: 'MANAGE_MASTER_DATA',               // Quản lý danh mục dùng chung (admin)
} as const;

// ===== MODULE: THEME (GIAO DIỆN) =====
export const THEME = {
  VIEW: 'VIEW_THEME',                         // Xem theme
  UPDATE: 'UPDATE_THEME',                     // Cập nhật theme
  MANAGE_BRANDING: 'MANAGE_THEME_BRANDING',   // Quản lý branding
} as const;

// ===== MODULE: DOCUMENTS (TÀI LIỆU) =====
export const DOCUMENTS = {
  VIEW: 'VIEW_DOCUMENTS',                     // Xem tài liệu
  GENERATE_PDF: 'GENERATE_PDF_DOCUMENTS',     // Tạo PDF
  EXPORT: 'EXPORT_DOCUMENTS',                 // Xuất tài liệu
} as const;

// ===== MODULE: ETL (EXTRACT-TRANSFORM-LOAD) =====
export const ETL = {
  VIEW: 'VIEW_ETL',                           // Xem ETL jobs
  VIEW_LOGS: 'VIEW_ETL_LOGS',                 // Xem logs
  CREATE: 'CREATE_ETL',                       // Tạo ETL workflow
  UPDATE: 'UPDATE_ETL',                       // Cập nhật ETL workflow
  DELETE: 'DELETE_ETL',                       // Xóa ETL workflow
  EXECUTE: 'EXECUTE_ETL',                     // Chạy ETL workflow
} as const;

// ===== MODULE: DEPARTMENT (KHOA/PHÒNG) =====
export const DEPARTMENT = {
  VIEW: 'VIEW_DEPARTMENT',                    // Xem khoa/phòng
  CREATE: 'CREATE_DEPARTMENT',                // Tạo khoa/phòng
  UPDATE: 'UPDATE_DEPARTMENT',                // Cập nhật khoa/phòng
  DELETE: 'DELETE_DEPARTMENT',                // Xóa khoa/phòng
} as const;

// ===== MODULE: WORKFLOW (QUY TRÌNH NGHIỆP VỤ) =====
export const WORKFLOW = {
  VIEW: 'VIEW_WORKFLOW',                      // Xem danh sách workflow
  VIEW_DETAIL: 'VIEW_WORKFLOW_DETAIL',        // Xem chi tiết workflow instance
  VIEW_DEFINITIONS: 'VIEW_WORKFLOW_DEFS',     // Xem định nghĩa workflow
  MANAGE_DEFINITIONS: 'MANAGE_WORKFLOW_DEFS', // Quản lý định nghĩa workflow
  VIEW_ALL_INSTANCES: 'VIEW_ALL_WORKFLOW_INSTANCES', // Xem tất cả instances
  APPROVE: 'APPROVE_WORKFLOW',                // Phê duyệt bước workflow
  REJECT: 'REJECT_WORKFLOW',                  // Từ chối bước workflow
  CANCEL: 'CANCEL_WORKFLOW',                  // Hủy workflow instance
  MONITOR: 'MONITOR_WORKFLOW',                // Giám sát hiệu suất workflow
  // M13 Engine function codes
  INITIATE: 'WF.INITIATE',   // Khởi tạo workflow instance mới
  ACT: 'WF.ACT',             // Thực hiện action tại bước (approve/reject/return/comment)
  SIGN: 'WF.SIGN',           // Ký số điện tử tại bước yêu cầu ký
  DESIGN: 'WF.DESIGN',       // Thiết kế / sửa workflow template (draft)
  OVERRIDE: 'WF.OVERRIDE',   // Publish / archive template; force action
  DASHBOARD: 'WF.DASHBOARD', // Xem dashboard workflow toàn cục
  EXPORT: 'WF.EXPORT',       // Xuất báo cáo workflow
} as const;

// ===== MODULE: DIGITAL_DOCS (VĂN BẢN SỐ) =====
export const DIGITAL_DOCS = {
  VIEW: 'VIEW_DIGITAL_DOCS',                  // Xem văn bản số
  CREATE: 'CREATE_DIGITAL_DOCS',              // Đăng ký văn bản mới
  UPDATE: 'UPDATE_DIGITAL_DOCS',              // Cập nhật văn bản
  DELETE: 'DELETE_DIGITAL_DOCS',              // Xóa văn bản
  SEARCH: 'SEARCH_DIGITAL_DOCS',              // Tìm kiếm toàn văn
  OCR: 'OCR_DIGITAL_DOCS',                   // Nhận dạng văn bản (OCR)
  DOWNLOAD: 'DOWNLOAD_DIGITAL_DOCS',          // Tải xuống văn bản
  APPROVE: 'APPROVE_DIGITAL_DOCS',            // Phê duyệt văn bản
  MANAGE: 'MANAGE_DIGITAL_DOCS',              // Quản lý kho văn bản
} as const;

// ===== MODULE: TEMPLATES (M18 - QUẢN LÝ TEMPLATE & XUẤT DỮ LIỆU) =====
export const TEMPLATES = {
  // Template core (UC-T01, UC-T02, UC-T08)
  VIEW: 'VIEW_TEMPLATES',               // Xem danh mục / thư viện template
  MANAGE: 'MANAGE_TEMPLATES',           // Quản lý template: CRUD, upload, versioning, rollback
  // Data map & Preview (UC-T03, UC-T04)
  PREVIEW: 'PREVIEW_TEMPLATES',         // Preview template với dữ liệu thực — cần riêng vì load real data
  // Export engine (UC-T05, UC-T06, UC-T07)
  EXPORT_DATA: 'EXPORT_DATA',           // Xuất đơn lẻ (scope: SELF/UNIT)
  EXPORT_BATCH: 'EXPORT_BATCH',         // Xuất hàng loạt (scope: UNIT/DEPT/ACADEMY)
  VIEW_JOBS: 'VIEW_EXPORT_JOBS',        // Xem lịch sử export jobs
  RETRY_JOB: 'RETRY_EXPORT_JOB',        // Retry job thất bại
  // Scheduled export (UC-T11)
  MANAGE_SCHEDULES: 'MANAGE_EXPORT_SCHEDULES', // Quản lý lịch xuất định kỳ
  // Analytics (UC-T10)
  VIEW_ANALYTICS: 'VIEW_TEMPLATE_ANALYTICS',   // Xem thống kê sử dụng template
  // Import (UC-T12)
  IMPORT: 'IMPORT_TEMPLATES',           // Import template từ file Word/Excel hiện có
} as const;

// ===== MODULE: SCIENCE (CSDL-KHQL – Khoa học Quản lý) =====
// Phase 1: M01 Danh mục + M13 RBAC
// Path prefix: /api/science/*  (không đụng /api/research/*)
export const SCIENCE = {
  // M01 – Danh mục KH
  CATALOG_VIEW:   'VIEW_SCIENCE_CATALOG',       // Xem danh mục lĩnh vực, loại công trình...
  CATALOG_MANAGE: 'MANAGE_SCIENCE_CATALOG',     // Quản lý danh mục KH (ADMIN/DEPT_HEAD)

  // M02 – Hồ sơ nhà khoa học
  SCIENTIST_VIEW:   'VIEW_SCIENTIST_PROFILE',   // Xem hồ sơ nhà KH
  SCIENTIST_MANAGE: 'MANAGE_SCIENTIST_PROFILE', // Quản lý/cập nhật hồ sơ
  SCIENTIST_SYNC_ORCID: 'SYNC_ORCID',          // Đồng bộ ORCID

  // M03 – Đề tài NCKH
  PROJECT_CREATE:          'CREATE_RESEARCH_PROJECT',    // Tạo đề tài
  PROJECT_APPROVE_DEPT:    'APPROVE_RESEARCH_DEPT',      // Phê duyệt cấp phòng
  PROJECT_APPROVE_ACADEMY: 'APPROVE_RESEARCH_ACADEMY',  // Phê duyệt cấp học viện

  // M04 – Công trình KH (sách, giáo trình)
  WORK_CREATE:       'CREATE_SCIENTIFIC_WORK',   // Tạo công trình KH
  WORK_IMPORT_DOI:   'IMPORT_FROM_CROSSREF',     // Import từ CrossRef/DOI

  // M05 – Thư viện số
  LIBRARY_UPLOAD:           'UPLOAD_LIBRARY',            // Upload tài liệu
  LIBRARY_DOWNLOAD_NORMAL:  'DOWNLOAD_LIBRARY_NORMAL',   // Tải tài liệu thường
  LIBRARY_DOWNLOAD_SECRET:  'DOWNLOAD_LIBRARY_SECRET',   // Tải tài liệu mật

  // M06 – Kinh phí NCKH
  BUDGET_MANAGE: 'MANAGE_RESEARCH_BUDGET', // Quản lý dự toán/giải ngân
  BUDGET_APPROVE: 'APPROVE_BUDGET',        // Phê duyệt kinh phí
  BUDGET_VIEW_FINANCE: 'VIEW_BUDGET_FINANCE', // Xem chi tiết tài chính

  // M07 – Hội đồng KH
  COUNCIL_MANAGE:           'MANAGE_COUNCIL',       // Thành lập, quản lý hội đồng
  COUNCIL_SUBMIT_REVIEW:    'SUBMIT_REVIEW',         // Nộp phản biện (REVIEWER role)
  COUNCIL_FINALIZE:         'FINALIZE_ACCEPTANCE',  // Kết luận nghiệm thu

  // M06b – File minh chứng đính kèm (Phase 6)
  ATTACHMENT_UPLOAD: 'UPLOAD_SCIENCE_ATTACHMENT',  // Upload file minh chứng
  ATTACHMENT_VIEW:   'VIEW_SCIENCE_ATTACHMENT',    // Xem / tải file minh chứng
  ATTACHMENT_DELETE: 'DELETE_SCIENCE_ATTACHMENT',  // Xóa file minh chứng

  // M09/M11/M12/M14 – Dashboard, Tìm kiếm, AI, Báo cáo
  DASHBOARD_VIEW:    'VIEW_SCIENCE_DASHBOARD',      // Xem dashboard KHQL
  DATA_QUALITY_VIEW: 'VIEW_SCIENCE_DATA_QUALITY',   // Xem báo cáo chất lượng dữ liệu KH
  SEARCH_USE:        'USE_SCIENCE_SEARCH',           // Tìm kiếm thông minh
  AI_USE:            'USE_AI_SCIENCE',               // Dùng AI KHQL (chatbot, trends)
  AI_ADMIN:          'USE_AI_SCIENCE_ADMIN',         // Admin AI KHQL
  REPORT_EXPORT:     'EXPORT_SCIENCE_REPORT',        // Xuất báo cáo BQP
} as const;

// ===== MODULE: PERSONAL (Tài khoản cá nhân — SELF scope mặc định) =====
export const PERSONAL = {
  // Tầng 0: Mọi người dùng
  MANAGE_PROFILE:       'MANAGE_MY_PROFILE',        // Xem/cập nhật hồ sơ cá nhân
  VIEW_NOTIFICATIONS:   'VIEW_MY_NOTIFICATIONS',    // Xem thông báo cá nhân
  VIEW_DASHBOARD:       'VIEW_MY_DASHBOARD',        // Xem trang tổng quan cá nhân
  VIEW_TASKS:           'VIEW_MY_TASKS',            // Xem công việc đang thực hiện
  MANAGE_SECURITY:      'MANAGE_MY_SECURITY',       // Quản lý bảo mật tài khoản
  VIEW_CAREER_HISTORY:  'VIEW_MY_CAREER_HISTORY',   // Xem quá trình công tác
  REQUEST_INFO_UPDATE:  'REQUEST_MY_INFO_UPDATE',   // Gửi yêu cầu cập nhật thông tin
  VIEW_POLICY:          'VIEW_MY_POLICY',           // Xem chính sách/chế độ của tôi
  VIEW_INSURANCE:       'VIEW_MY_INSURANCE',        // Xem thông tin bảo hiểm
  VIEW_AWARD:           'VIEW_MY_AWARD',            // Xem khen thưởng/kỷ luật
  // Tầng 1: Giảng viên / Nghiên cứu viên
  VIEW_RESEARCH:        'VIEW_MY_RESEARCH',         // Xem đề tài NCKH của tôi
  VIEW_PUBLICATIONS:    'VIEW_MY_PUBLICATIONS',     // Xem công bố khoa học của tôi
  SUBMIT_PUBLICATION:   'SUBMIT_MY_PUBLICATION',    // Tự đăng + nộp công bố để phòng KH duyệt
  MANAGE_SCIENTIFIC_CV: 'MANAGE_MY_SCIENTIFIC_CV',  // Quản lý lý lịch khoa học
  VIEW_GRADE_SUBMISSIONS: 'VIEW_MY_GRADE_SUBMISSIONS', // Xem lịch sử điểm đã trình duyệt
  // Tầng 2: Học viên / Sinh viên
  VIEW_GRADE:           'VIEW_MY_GRADE',            // Xem điểm học tập của tôi
  VIEW_CONDUCT:         'VIEW_MY_CONDUCT',          // Xem điểm rèn luyện của tôi
  VIEW_SCHEDULE:        'VIEW_MY_SCHEDULE',         // Xem thời khóa biểu
  VIEW_GRADUATION:      'VIEW_MY_GRADUATION',       // Xem trạng thái xét tốt nghiệp
} as const;

// ===== MODULE: PROMOTION (KHAI BÁO & DUYỆT THĂNG QUÂN HÀM) =====
export const PROMOTION = {
  VIEW_OWN:           'VIEW_OWN_RANK_DECLARATION',      // Cán bộ xem bản khai của mình
  VIEW_UNIT:          'VIEW_UNIT_RANK_DECLARATIONS',    // HR/chỉ huy đơn vị xem bản khai trong đơn vị
  VIEW_ORGAN:         'VIEW_ORGAN_RANK_DECLARATIONS',   // Cơ quan quản lý xem tất cả bản khai chờ duyệt
  CREATE_SELF:        'CREATE_SELF_RANK_DECLARATION',   // Cán bộ tự khai báo lịch sử quân hàm
  CREATE_ON_BEHALF:   'CREATE_RANK_DECLARATION_BEHALF', // HR khai hộ cán bộ
  SUBMIT:             'SUBMIT_RANK_DECLARATION',        // Nộp bản khai lên cơ quan duyệt
  APPROVE:            'APPROVE_RANK_DECLARATION',       // Cơ quan cán bộ/quân lực phê duyệt
  REJECT:             'REJECT_RANK_DECLARATION',        // Cơ quan từ chối / trả lại bản khai
  REQUEST_AMENDMENT:  'REQUEST_RANK_AMENDMENT',         // Đề nghị chỉnh sửa sau khi đã duyệt
  APPROVE_AMENDMENT:  'APPROVE_RANK_AMENDMENT',         // Cơ quan duyệt yêu cầu chỉnh sửa
  ADMIN_CREATE:       'ADMIN_CREATE_PROMOTION',         // Admin ghi trực tiếp (bypass workflow)
  VIEW_PROPOSALS:     'VIEW_PROMOTION_PROPOSALS',       // Xem đề nghị thăng quân hàm
  CREATE_PROPOSAL:    'CREATE_PROMOTION_PROPOSAL',      // Đơn vị tạo đề nghị thăng quân hàm
  APPROVE_PROPOSAL:   'APPROVE_PROMOTION_PROPOSAL',     // Cơ quan phê duyệt đề nghị
} as const;

// ===== ALL FUNCTION CODES (for seeding) =====
export const ALL_FUNCTION_CODES = {
  ...PERSONNEL,
  ...TRAINING,
  ...EDUCATION,
  ...EXAM,
  ...QUESTION_BANK,
  ...LEARNING_MATERIAL,
  ...LAB,
  ...RESEARCH,
  ...PARTY,
  ...POLICY,
  ...INSURANCE,
  ...AWARDS,
  ...STUDENT,
  ...FACULTY,
  ...DATA,
  ...SYSTEM,
  ...DASHBOARD,
  ...AI,
  ...INFRA,
  ...MONITORING,
  ...AUDIT,
  ...ML,
  ...SECURITY,
  ...GOVERNANCE,
  ...MASTER_DATA,
  ...THEME,
  ...DOCUMENTS,
  ...ETL,
  ...DEPARTMENT,
  ...WORKFLOW,
  ...DIGITAL_DOCS,
  ...TEMPLATES,
  ...SCIENCE,
  ...PERSONAL,
  ...PROMOTION,
} as const;

// ===== FUNCTION_CODES (grouped by module) =====
export const FUNCTION_CODES = {
  PERSONNEL,
  TRAINING,
  EDUCATION,
  EXAM,
  QUESTION_BANK,
  LEARNING_MATERIAL,
  LAB,
  RESEARCH,
  PARTY,
  POLICY,
  INSURANCE,
  AWARDS,
  AWARD: AWARDS,  // Alias
  STUDENT,
  FACULTY,
  DATA,
  SYSTEM,
  DASHBOARD,
  AI,
  INFRA,
  MONITORING,
  AUDIT,
  ML,
  SECURITY,
  GOVERNANCE,
  MASTER_DATA,
  THEME,
  DOCUMENTS,
  ETL,
  DEPARTMENT,
  WORKFLOW,
  DIGITAL_DOCS,
  TEMPLATES,
  SCIENCE,
  PERSONAL,
  PROMOTION,
} as const;

// Type for all function codes
export type FunctionCode = typeof ALL_FUNCTION_CODES[keyof typeof ALL_FUNCTION_CODES];

// Module mapping for display
export const MODULE_NAMES: Record<string, string> = {
  personnel: 'Quân nhân',
  training: 'Giảng dạy',
  education: 'Chương trình đào tạo',
  exam: 'Khảo thí',
  question_bank: 'Ngân hàng câu hỏi',
  learning_material: 'Học liệu',
  lab: 'Phòng thí nghiệm',
  research: 'Nghiên cứu',
  party: 'Đảng viên',
  policy: 'Chính sách',
  insurance: 'Bảo hiểm',
  awards: 'Thi đua - Khen thưởng',
  student: 'Học viên',
  faculty: 'Giảng viên',
  data: 'Dữ liệu',
  system: 'Hệ thống',
  dashboard: 'Dashboard',
  ai: 'Trí tuệ nhân tạo',
  monitoring: 'Giám sát hệ thống',
  audit: 'Kiểm toán',
  ml: 'Machine Learning',
  security: 'Bảo mật',
  governance: 'Quản trị dữ liệu',
  theme: 'Giao diện',
  documents: 'Tài liệu',
  etl: 'ETL Workflow',
  department: 'Khoa/Phòng',
  workflow: 'Quy trình nghiệp vụ',
  digital_docs: 'Văn bản số',
  science: 'CSDL Khoa học Quản lý',
  promotion: 'Khai báo & Duyệt Thăng Quân hàm',
};
