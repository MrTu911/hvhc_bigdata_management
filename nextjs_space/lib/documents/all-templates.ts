/**
 * Tất cả 28 Templates Hồ sơ Nghiệm thu CNTT
 * Format: Times New Roman, Size 14
 */

import { DOCUMENT_HEADER, CSS_STYLESHEET } from './templates';

// E1.3: Kế hoạch triển khai CNTT
export const E1_3_KE_HOACH_TRIEN_KHAI = () => `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
<div class="document">
  ${DOCUMENT_HEADER}
  <div class="doc-title">KẾ HOẠCH TRIỂN KHAI</div>
  <div class="doc-subtitle">Hệ thống Quản lý Dữ liệu lớn Học viện Hậu cần</div>
  
  <div class="section-title">I. MỤC TIÊU</div>
  <p>Triển khai thành công Hệ thống BigData quản lý 7 miền CSDL, đảm bảo đáp ứng yêu cầu nghiệp vụ và tuân thủ quy định ATTT của BQP.</p>
  
  <div class="section-title">II. PHẠM VI TRIỂN KHAI</div>
  <ul>
    <li><b>Phạm vi địa lý:</b> Toàn bộ Học viện Hậu cần và các đơn vị trực thuộc</li>
    <li><b>Phạm vi nghiệp vụ:</b> 7 miền CSDL theo QĐ 144/BQP</li>
    <li><b>Đối tượng sử dụng:</b> 1,299+ cán bộ, giảng viên; 3,500+ học viên</li>
  </ul>
  
  <div class="section-title">III. CÁC GIAI ĐOẠN TRIỂN KHAI</div>
  <table>
    <tr><th>Giai đoạn</th><th>Nội dung</th><th>Thời gian</th><th>Trạng thái</th></tr>
    <tr><td>1</td><td>Nền tảng (Schema, RBAC Engine, Audit)</td><td>2 tuần</td><td>✅ Hoàn thành</td></tr>
    <tr><td>2</td><td>Phân quyền (Chuyển API → authorize)</td><td>2 tuần</td><td>✅ Hoàn thành</td></tr>
    <tr><td>3</td><td>Nghiệp vụ (Workflow, Chính sách, Bảo hiểm)</td><td>3 tuần</td><td>⏳ Đang thực hiện</td></tr>
    <tr><td>4</td><td>Giao diện (Dashboard, RBAC UI)</td><td>2 tuần</td><td>⏳ Đang thực hiện</td></tr>
    <tr><td>5</td><td>Hồ sơ nghiệm thu</td><td>1 tuần</td><td>⏳ Đang thực hiện</td></tr>
  </table>
  
  <div class="section-title">IV. PHÂN CÔNG THỰC HIỆN</div>
  <table>
    <tr><th>Đơn vị</th><th>Nhiệm vụ</th></tr>
    <tr><td>Phòng CNTT</td><td>Chủ trì kỹ thuật, vận hành hệ thống</td></tr>
    <tr><td>Phòng Đào tạo</td><td>Phối hợp nghiệp vụ CSDL đào tạo, học viên</td></tr>
    <tr><td>Ban Cán bộ</td><td>Phối hợp nghiệp vụ CSDL nhân sự</td></tr>
    <tr><td>Phòng KH-CN</td><td>Phối hợp nghiệp vụ NCKH</td></tr>
    <tr><td>Các khoa/phòng</td><td>Sử dụng và phản hồi</td></tr>
  </table>
  
  <div class="section-title">V. NGUỒN LỰC</div>
  <ul>
    <li><b>Nhân lực:</b> Tổ triển khai 6 người, chuyên gia kỹ thuật</li>
    <li><b>Hạ tầng:</b> Server PostgreSQL, Redis, AWS S3</li>
    <li><b>Phần mềm:</b> Next.js 14, Prisma ORM, Abacus AI</li>
  </ul>
  
  <div style="margin-top: 40pt; text-align: right;">
    <p><b>TỔ TRIỂN KHAI</b></p>
  </div>
</div>
</body></html>
`;

// E1.4: Biên bản họp triển khai
export const E1_4_BIEN_BAN_HOP = () => `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
<div class="document">
  ${DOCUMENT_HEADER}
  <div class="doc-title">BIÊN BẢN HỌP</div>
  <div class="doc-subtitle">Triển khai Hệ thống BigData Học viện Hậu cần</div>
  
  <p><b>Thời gian:</b> ___ giờ ___ phút, ngày ___ tháng ___ năm 2026</p>
  <p><b>Địa điểm:</b> Phòng họp Học viện Hậu cần</p>
  <p><b>Chủ trì:</b> Đ/c _____________, Phó Giám đốc Học viện</p>
  <p><b>Thành phần:</b> Tổ triển khai, đại diện các khoa/phòng liên quan</p>
  
  <div class="section-title">I. NỘI DUNG CUỘC HỌP</div>
  
  <div class="subsection-title">1. Báo cáo tiến độ triển khai</div>
  <ul>
    <li>Hoàn thành Giai đoạn 1: Nền tảng kỹ thuật</li>
    <li>Hoàn thành Giai đoạn 2: Hệ thống phân quyền RBAC</li>
    <li>Đang triển khai Giai đoạn 3: Các nghiệp vụ chính</li>
  </ul>
  
  <div class="subsection-title">2. Các vấn đề cần giải quyết</div>
  <ul>
    <li>Chuẩn hóa dữ liệu đầu vào từ các đơn vị</li>
    <li>Đào tạo người dùng cuối</li>
    <li>Tích hợp với hệ thống hiện có</li>
  </ul>
  
  <div class="section-title">II. KẾT LUẬN</div>
  <p>Cuộc họp thống nhất các nội dung sau:</p>
  <ol>
    <li>Tiếp tục triển khai theo kế hoạch đã duyệt</li>
    <li>Tổ chức đào tạo cho các đơn vị trong tháng ___/2026</li>
    <li>Hoàn thiện hồ sơ nghiệm thu trước ngày ___/___/2026</li>
  </ol>
  
  <p>Cuộc họp kết thúc lúc ___ giờ ___ phút cùng ngày.</p>
  
  <div style="display: flex; justify-content: space-between; margin-top: 40pt;">
    <div style="width: 45%; text-align: center;"><b>THƯ KÝ</b><br/><br/><br/><br/><br/></div>
    <div style="width: 45%; text-align: center;"><b>CHỦ TRÌ</b><br/><br/><br/><br/><br/></div>
  </div>
</div>
</body></html>
`;

// E2.2: Sơ đồ kiến trúc BEFORE/AFTER
export const E2_2_SO_DO_KIEN_TRUC = () => `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
<div class="document">
  ${DOCUMENT_HEADER}
  <div class="doc-title">SƠ ĐỒ KIẾN TRÚC HỆ THỐNG</div>
  <div class="doc-subtitle">Trước và sau khi triển khai BigData</div>
  
  <div class="section-title">I. KIẾN TRÚC TRƯỚC (BEFORE)</div>
  <table>
    <tr><th>Thành phần</th><th>Tình trạng</th><th>Vấn đề</th></tr>
    <tr><td>Dữ liệu</td><td>Phân tán, file Excel riêng lẻ</td><td>Khó tổng hợp, thiếu đồng bộ</td></tr>
    <tr><td>Phân quyền</td><td>Thủ công theo role cứng</td><td>Không linh hoạt khi thay đổi tổ chức</td></tr>
    <tr><td>Báo cáo</td><td>Tổng hợp thủ công</td><td>Chậm, dễ sai sót</td></tr>
    <tr><td>Audit Log</td><td>Không có hệ thống</td><td>Không truy vết được</td></tr>
    <tr><td>Tích hợp</td><td>Không liên thông</td><td>Dữ liệu rời rạc</td></tr>
  </table>
  
  <div class="section-title">II. KIẾN TRÚC SAU (AFTER)</div>
  <table>
    <tr><th>Thành phần</th><th>Giải pháp</th><th>Lợi ích</th></tr>
    <tr><td>Dữ liệu</td><td>PostgreSQL tập trung, 7 miền CSDL</td><td>Đồng bộ, chuẩn hóa</td></tr>
    <tr><td>Phân quyền</td><td>Function-based RBAC, 71 functions</td><td>Linh hoạt, dễ mở rộng</td></tr>
    <tr><td>Báo cáo</td><td>Dashboard thời gian thực</td><td>Nhanh, chính xác</td></tr>
    <tr><td>Audit Log</td><td>logAudit() toàn diện</td><td>Truy vết, giải trình</td></tr>
    <tr><td>Tích hợp</td><td>API RESTful, 262 endpoints</td><td>Liên thông dữ liệu</td></tr>
  </table>
  
  <div class="section-title">III. SƠ ĐỒ TỔNG THỂ</div>
  <pre style="font-family: monospace; font-size: 11pt; background: #f5f5f5; padding: 15pt; border: 1px solid #ccc;">
┌────────────────────────────────────────────────────────────┐
│          LỚP TRÌNH BÀY (PRESENTATION LAYER)             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │ Dashboard   │ │ CSDL Module │ │   Admin UI  │  │
│  └─────────────┘ └─────────────┘ └─────────────┘  │
└────────────────────────────────────────────────────────────┘
                            │
┌────────────────────────────────────────────────────────────┐
│            LỚP NGHIỆP VỤ (BUSINESS LAYER)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │ RBAC Engine │ │  Workflow   │ │ Audit Log   │  │
│  └─────────────┘ └─────────────┘ └─────────────┘  │
│                  262 API Endpoints                       │
└────────────────────────────────────────────────────────────┘
                            │
┌────────────────────────────────────────────────────────────┐
│              LỚP DỮ LIỆU (DATA LAYER)                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │ PostgreSQL  │ │    Redis    │ │   AWS S3    │  │
│  └─────────────┘ └─────────────┘ └─────────────┘  │
└────────────────────────────────────────────────────────────┘
  </pre>
  
  <div style="margin-top: 40pt; text-align: right;"><b>TỔ TRIỂN KHAI</b></div>
</div>
</body></html>
`;

// E3.1: Danh mục CSDL
export const E3_1_DANH_MUC_CSDL = () => `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
<div class="document">
  ${DOCUMENT_HEADER}
  <div class="doc-title">DANH MỤC CƠ SỞ DỮ LIỆU</div>
  <div class="doc-subtitle">Hệ thống BigData Học viện Hậu cần</div>
  
  <div class="section-title">I. TỔNG QUAN</div>
  <p>Hệ thống quản lý 7 miền cơ sở dữ liệu theo Quyết định 144/2021/QĐ-BQP của Bộ Quốc phòng.</p>
  
  <div class="section-title">II. DANH MỤC CHI TIẾT</div>
  
  <table>
    <tr>
      <th>STT</th>
      <th>Miền CSDL</th>
      <th>Bảng chính</th>
      <th>Mô tả</th>
      <th>Số bản ghi</th>
    </tr>
    <tr>
      <td style="text-align: center;">1</td>
      <td><b>CSDL Quân nhân</b></td>
      <td>User, CareerHistory, Unit</td>
      <td>Thông tin cán bộ, quân nhân</td>
      <td style="text-align: center;">1,299+</td>
    </tr>
    <tr>
      <td style="text-align: center;">2</td>
      <td><b>CSDL Đảng viên</b></td>
      <td>PartyMember, PartyActivity</td>
      <td>Hồ sơ đảng viên, hoạt động đảng</td>
      <td style="text-align: center;">800+</td>
    </tr>
    <tr>
      <td style="text-align: center;">3</td>
      <td><b>CSDL Thi đua KT</b></td>
      <td>AwardsRecord, DisciplineRecord</td>
      <td>Khen thưởng, kỷ luật</td>
      <td style="text-align: center;">500+</td>
    </tr>
    <tr>
      <td style="text-align: center;">4</td>
      <td><b>CSDL Chính sách</b></td>
      <td>PolicyCategory, PolicyRequest, PolicyAttachment</td>
      <td>Chế độ chính sách</td>
      <td style="text-align: center;">300+</td>
    </tr>
    <tr>
      <td style="text-align: center;">5</td>
      <td><b>CSDL Bảo hiểm XH</b></td>
      <td>SocialInsurance, InsuranceHistory</td>
      <td>Bảo hiểm xã hội, y tế</td>
      <td style="text-align: center;">1,299+</td>
    </tr>
    <tr>
      <td style="text-align: center;">6</td>
      <td><b>CSDL Giảng viên</b></td>
      <td>FacultyProfile, TeachingSubject, ResearchProject</td>
      <td>Hồ sơ giảng viên, NCKH</td>
      <td style="text-align: center;">264+</td>
    </tr>
    <tr>
      <td style="text-align: center;">7</td>
      <td><b>CSDL Học viên QS</b></td>
      <td>HocVien, KetQuaHocTap, CourseRegistration</td>
      <td>Học viên, kết quả đào tạo</td>
      <td style="text-align: center;">3,500+</td>
    </tr>
  </table>
  
  <div class="section-title">III. BẢNG HỖ TRỢ CHUNG</div>
  <table>
    <tr><th>Bảng</th><th>Mô tả</th></tr>
    <tr><td>Position</td><td>23 chức danh chuẩn hóa</td></tr>
    <tr><td>Function</td><td>71 chức năng phân quyền</td></tr>
    <tr><td>PositionFunction</td><td>Ma trận gán quyền</td></tr>
    <tr><td>AuditLog</td><td>Nhật ký hoạt động</td></tr>
    <tr><td>SecurityEvent</td><td>Sự kiện an ninh</td></tr>
  </table>
  
  <div style="margin-top: 40pt; text-align: right;"><b>TỔ TRIỂN KHAI</b></div>
</div>
</body></html>
`;

// E4.1: Mô hình RBAC Function-based
export const E4_1_MO_HINH_RBAC = () => `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
<div class="document">
  ${DOCUMENT_HEADER}
  <div class="doc-title">MÔ HÌNH PHÂN QUYỀN RBAC FUNCTION-BASED</div>
  <div class="doc-subtitle">Hệ thống BigData Học viện Hậu cần</div>
  
  <div class="section-title">I. TỔNG QUAN MÔ HÌNH</div>
  <p>Hệ thống áp dụng mô hình <b>Function-based RBAC</b> (Role-Based Access Control dựa trên chức năng), khác biệt với RBAC truyền thống dựa trên role cứng.</p>
  
  <div class="subsection-title">Ưu điểm của Function-based RBAC:</div>
  <ul>
    <li>Không vỡ hệ thống khi đổi tên chức danh</li>
    <li>Không cần sửa code khi tái cơ cấu tổ chức</li>
    <li>Phân quyền chi tiết đến từng chức năng</li>
    <li>Hỗ trợ scope: self / unit / academy</li>
  </ul>
  
  <div class="section-title">II. CÁC THÀNH PHẦN</div>
  
  <table>
    <tr><th>Thành phần</th><th>Mô tả</th><th>Ví dụ</th></tr>
    <tr>
      <td><b>Position</b></td>
      <td>Chức danh logic, không phụ thuộc tên gọi</td>
      <td>GIAM_DOC, TRUONG_KHOA, GIANG_VIEN</td>
    </tr>
    <tr>
      <td><b>Function</b></td>
      <td>Chức năng cụ thể (quyền thực)</td>
      <td>VIEW_PERSONNEL, APPROVE_GRADE</td>
    </tr>
    <tr>
      <td><b>PositionFunction</b></td>
      <td>Ma trận gán quyền Position-Function</td>
      <td>TRUONG_KHOA + VIEW_PERSONNEL + scope:unit</td>
    </tr>
    <tr>
      <td><b>UserPosition</b></td>
      <td>Gán chức danh cho user theo đơn vị & thời gian</td>
      <td>User A + TRUONG_KHOA + Khoa CNTT + 2024-2027</td>
    </tr>
    <tr>
      <td><b>Scope</b></td>
      <td>Phạm vi truy cập</td>
      <td>self: chỉ bản thân, unit: đơn vị, academy: toàn HV</td>
    </tr>
  </table>
  
  <div class="section-title">III. HÀM PHÂN QUYỀN CỐT LÕI</div>
  <pre style="font-family: monospace; font-size: 11pt; background: #f5f5f5; padding: 15pt; border: 1px solid #ccc;">
async function authorize(user, functionCode, context) {
  // 1. Lấy các Position của user
  const positions = await getUserPositions(user.id);
  
  // 2. Kiểm tra từng position có function được gán không
  for (const pos of positions) {
    const grant = await getPositionFunction(pos.id, functionCode);
    if (grant) {
      // 3. Kiểm tra scope
      if (checkScope(grant.scope, context)) {
        return { allowed: true, scope: grant.scope };
      }
    }
  }
  
  return { allowed: false };
}
  </pre>
  
  <div class="section-title">IV. DANH SÁCH 23 CHỨC DANH</div>
  <table>
    <tr><th>STT</th><th>Mã</th><th>Tên chức danh</th></tr>
    <tr><td>1</td><td>GIAM_DOC</td><td>Giám đốc Học viện</td></tr>
    <tr><td>2</td><td>PHO_GIAM_DOC</td><td>Phó Giám đốc Học viện</td></tr>
    <tr><td>3</td><td>TRUONG_KHOA</td><td>Trưởng Khoa</td></tr>
    <tr><td>4</td><td>PHO_KHOA</td><td>Phó Trưởng Khoa</td></tr>
    <tr><td>5</td><td>TRUONG_PHONG</td><td>Trưởng Phòng</td></tr>
    <tr><td>6</td><td>PHO_PHONG</td><td>Phó Trưởng Phòng</td></tr>
    <tr><td>7</td><td>TRUONG_BAN</td><td>Trưởng Ban</td></tr>
    <tr><td>8</td><td>CHU_NHIEM_BO_MON</td><td>Chủ nhiệm Bộ môn</td></tr>
    <tr><td>9</td><td>GIANG_VIEN</td><td>Giảng viên</td></tr>
    <tr><td>10</td><td>NGHIEN_CUU_VIEN</td><td>Nghiên cứu viên</td></tr>
    <tr><td colspan="3" style="text-align: center;"><i>... và 13 chức danh khác</i></td></tr>
  </table>
  
  <div style="margin-top: 40pt; text-align: right;"><b>TỔ TRIỂN KHAI</b></div>
</div>
</body></html>
`;

// E4.2: Danh mục Function Code
export const E4_2_DANH_MUC_FUNCTION = () => `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
<div class="document">
  ${DOCUMENT_HEADER}
  <div class="doc-title">DANH MỤC FUNCTION CODE</div>
  <div class="doc-subtitle">71 chức năng phân quyền hệ thống</div>
  
  <div class="section-title">I. NHÓM QUÂN NHÂN (PERSONNEL)</div>
  <table>
    <tr><th>Code</th><th>Mô tả</th><th>Scope mặc định</th></tr>
    <tr><td>VIEW_PERSONNEL</td><td>Xem thông tin quân nhân</td><td>unit</td></tr>
    <tr><td>CREATE_PERSONNEL</td><td>Tạo mới hồ sơ quân nhân</td><td>unit</td></tr>
    <tr><td>UPDATE_PERSONNEL</td><td>Cập nhật thông tin quân nhân</td><td>unit</td></tr>
    <tr><td>DELETE_PERSONNEL</td><td>Xóa hồ sơ quân nhân</td><td>academy</td></tr>
    <tr><td>APPROVE_PERSONNEL</td><td>Duyệt hồ sơ quân nhân</td><td>unit</td></tr>
  </table>
  
  <div class="section-title">II. NHÓM ĐÀO TẠO (TRAINING)</div>
  <table>
    <tr><th>Code</th><th>Mô tả</th><th>Scope</th></tr>
    <tr><td>VIEW_TRAINING</td><td>Xem thông tin đào tạo</td><td>unit</td></tr>
    <tr><td>CREATE_GRADE_DRAFT</td><td>Tạo điểm nháp</td><td>self</td></tr>
    <tr><td>APPROVE_GRADE</td><td>Duyệt điểm chính thức</td><td>unit</td></tr>
    <tr><td>VIEW_COURSE</td><td>Xem khóa học</td><td>academy</td></tr>
    <tr><td>REGISTER_COURSE</td><td>Đăng ký khóa học</td><td>self</td></tr>
  </table>
  
  <div class="section-title">III. NHÓM NCKH (RESEARCH)</div>
  <table>
    <tr><th>Code</th><th>Mô tả</th><th>Scope</th></tr>
    <tr><td>CREATE_RESEARCH</td><td>Tạo đề tài NCKH</td><td>self</td></tr>
    <tr><td>UPDATE_RESEARCH</td><td>Cập nhật đề tài</td><td>self</td></tr>
    <tr><td>SUBMIT_RESEARCH</td><td>Gửi duyệt đề tài</td><td>self</td></tr>
    <tr><td>APPROVE_RESEARCH</td><td>Duyệt đề tài NCKH</td><td>unit</td></tr>
    <tr><td>VIEW_RESEARCH</td><td>Xem đề tài NCKH</td><td>unit</td></tr>
  </table>
  
  <div class="section-title">IV. NHÓM ĐẢNG VIÊN (PARTY)</div>
  <table>
    <tr><th>Code</th><th>Mô tả</th><th>Scope</th></tr>
    <tr><td>VIEW_PARTY_MEMBER</td><td>Xem thông tin đảng viên</td><td>unit</td></tr>
    <tr><td>CREATE_PARTY_MEMBER</td><td>Tạo hồ sơ đảng viên</td><td>unit</td></tr>
    <tr><td>UPDATE_PARTY_MEMBER</td><td>Cập nhật hồ sơ đảng viên</td><td>unit</td></tr>
    <tr><td>APPROVE_PARTY_MEMBER</td><td>Duyệt hồ sơ đảng viên</td><td>academy</td></tr>
  </table>
  
  <div class="section-title">V. NHÓM CHÍNH SÁCH (POLICY)</div>
  <table>
    <tr><th>Code</th><th>Mô tả</th><th>Scope</th></tr>
    <tr><td>VIEW_POLICY</td><td>Xem chính sách</td><td>self</td></tr>
    <tr><td>CREATE_POLICY_REQUEST</td><td>Tạo yêu cầu chính sách</td><td>self</td></tr>
    <tr><td>APPROVE_POLICY</td><td>Duyệt yêu cầu chính sách</td><td>academy</td></tr>
    <tr><td>REJECT_POLICY</td><td>Từ chối yêu cầu chính sách</td><td>academy</td></tr>
  </table>
  
  <div class="section-title">VI. NHÓM HỆ THỐNG (SYSTEM)</div>
  <table>
    <tr><th>Code</th><th>Mô tả</th><th>Scope</th></tr>
    <tr><td>MANAGE_USERS</td><td>Quản lý tài khoản</td><td>academy</td></tr>
    <tr><td>MANAGE_UNITS</td><td>Quản lý đơn vị</td><td>academy</td></tr>
    <tr><td>MANAGE_RBAC</td><td>Quản lý phân quyền</td><td>academy</td></tr>
    <tr><td>VIEW_AUDIT_LOG</td><td>Xem nhật ký hệ thống</td><td>academy</td></tr>
    <tr><td>VIEW_DASHBOARD</td><td>Xem dashboard chỉ huy</td><td>academy</td></tr>
  </table>
  
  <p><i>Tổng cộng: 71 function codes thuộc 8 nhóm nghiệp vụ</i></p>
  
  <div style="margin-top: 40pt; text-align: right;"><b>TỔ TRIỂN KHAI</b></div>
</div>
</body></html>
`;

// E5.1: Quy chế ATTT
export const E5_1_QUY_CHE_ATTT = () => `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
<div class="document">
  ${DOCUMENT_HEADER}
  <div class="doc-title">QUY CHẾ QUẢN LÝ, KHAI THÁC VÀ BẢO ĐẢM ATTT</div>
  <div class="doc-subtitle">Hệ thống BigData Học viện Hậu cần</div>
  
  <div class="section-title">CHƯƠNG I: QUY ĐỊNH CHUNG</div>
  
  <p><b>Điều 1. Phạm vi áp dụng</b></p>
  <p>Quy chế này quy định việc quản lý, khai thác và bảo đảm an toàn thông tin cho Hệ thống BigData Học viện Hậu cần, áp dụng cho tất cả cán bộ, giảng viên, học viên sử dụng hệ thống.</p>
  
  <p><b>Điều 2. Nguyên tắc bảo đảm ATTT</b></p>
  <ol>
    <li>Tuân thủ Nghị định 85/2016/NĐ-CP về bảo đảm ATTT hệ thống thông tin</li>
    <li>Tuân thủ QĐ 144/2021/QĐ-BQP của Bộ Quốc phòng</li>
    <li>Phân quyền theo nguyên tắc tối thiểu (Least Privilege)</li>
    <li>Ghi nhật ký đầy đủ mọi hoạt động</li>
  </ol>
  
  <div class="section-title">CHƯƠNG II: QUẢN LÝ TÀI KHOẢN</div>
  
  <p><b>Điều 3. Cấp phát tài khoản</b></p>
  <ol>
    <li>Tài khoản chỉ được cấp theo đề nghị của đơn vị và duyệt của Ban Giám đốc</li>
    <li>Mỗi người dùng chỉ được cấp một tài khoản</li>
    <li>Không chia sẻ tài khoản cho người khác</li>
  </ol>
  
  <p><b>Điều 4. Quản lý mật khẩu</b></p>
  <ol>
    <li>Mật khẩu tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số, ký tự đặc biệt</li>
    <li>Thay đổi mật khẩu định kỳ 90 ngày</li>
    <li>Không sử dụng lại 5 mật khẩu gần nhất</li>
    <li>Khóa tài khoản sau 5 lần đăng nhập sai</li>
  </ol>
  
  <div class="section-title">CHƯƠNG III: PHÂN QUYỀN TRUY CẬP</div>
  
  <p><b>Điều 5. Nguyên tắc phân quyền</b></p>
  <ol>
    <li>Áp dụng mô hình Function-based RBAC</li>
    <li>Phân quyền theo chức năng, không theo role cứng</li>
    <li>Hỗ trợ scope: self (cá nhân), unit (đơn vị), academy (toàn Học viện)</li>
    <li>Rà soát quyền định kỳ hàng quý</li>
  </ol>
  
  <div class="section-title">CHƯƠNG IV: GHI NHẬT KÝ HỆ THỐNG</div>
  
  <p><b>Điều 6. Các hoạt động được ghi nhật ký</b></p>
  <ul>
    <li>Đăng nhập / đăng xuất</li>
    <li>Xem / tạo / sửa / xóa dữ liệu</li>
    <li>Truy cập bị từ chối</li>
    <li>Thay đổi cấu hình hệ thống</li>
  </ul>
  
  <p><b>Điều 7. Thời gian lưu trữ log</b></p>
  <p>Nhật ký hệ thống được lưu trữ tối thiểu 5 năm theo quy định của BQP.</p>
  
  <div class="section-title">CHƯƠNG V: Xử LÝ SỰ CỐ</div>
  
  <p><b>Điều 8. Phân loại sự cố</b></p>
  <ul>
    <li><b>Mức 1:</b> Sự cố nghiêm trọng - rò rỉ dữ liệu, tấn công mạng</li>
    <li><b>Mức 2:</b> Sự cố trung bình - lỗi hệ thống, mất dịch vụ</li>
    <li><b>Mức 3:</b> Sự cố nhẹ - lỗi người dùng, cần hướng dẫn</li>
  </ul>
  
  <div style="margin-top: 40pt;">
    <p style="text-align: right;"><i>Hà Nội, ngày ___ tháng ___ năm 2026</i></p>
    <p style="text-align: right;"><b>GIÁM ĐỐC HỌC VIỆN HẬU CẦN</b></p>
  </div>
</div>
</body></html>
`;

// E6.1: Mô tả cơ chế Audit Log
export const E6_1_MO_TA_AUDIT_LOG = () => `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
<div class="document">
  ${DOCUMENT_HEADER}
  <div class="doc-title">MÔ TẢ CƠ CHẾ GHI AUDIT LOG</div>
  <div class="doc-subtitle">Hệ thống BigData Học viện Hậu cần</div>
  
  <div class="section-title">I. TỔNG QUAN</div>
  <p>Hệ thống Audit Log được thiết kế để ghi lại toàn bộ hoạt động của người dùng trên hệ thống, phục vụ mục đích:</p>
  <ul>
    <li>Truy vết hoạt động khi cần</li>
    <li>Phát hiện truy cập trái phép</li>
    <li>Hỗ trợ thanh tra, kiểm tra</li>
    <li>Tuân thủ quy định ATTT của BQP</li>
  </ul>
  
  <div class="section-title">II. CẤU TRÚC AUDIT LOG</div>
  <table>
    <tr><th>Trường</th><th>Kiểu</th><th>Mô tả</th></tr>
    <tr><td>id</td><td>UUID</td><td>ID duy nhất của log</td></tr>
    <tr><td>userId</td><td>UUID</td><td>ID người dùng thực hiện</td></tr>
    <tr><td>functionCode</td><td>String</td><td>Mã chức năng (VD: VIEW_PERSONNEL)</td></tr>
    <tr><td>action</td><td>Enum</td><td>VIEW, CREATE, UPDATE, DELETE, LOGIN, LOGOUT</td></tr>
    <tr><td>resourceType</td><td>String</td><td>Loại tài nguyên (USER, STUDENT, GRADE...)</td></tr>
    <tr><td>resourceId</td><td>String</td><td>ID của tài nguyên</td></tr>
    <tr><td>oldValue</td><td>JSON</td><td>Giá trị trước khi thay đổi</td></tr>
    <tr><td>newValue</td><td>JSON</td><td>Giá trị sau khi thay đổi</td></tr>
    <tr><td>result</td><td>Enum</td><td>SUCCESS, FAIL, DENIED</td></tr>
    <tr><td>ipAddress</td><td>String</td><td>Địa chỉ IP</td></tr>
    <tr><td>userAgent</td><td>String</td><td>Thông tin trình duyệt</td></tr>
    <tr><td>timestamp</td><td>DateTime</td><td>Thời điểm thực hiện</td></tr>
  </table>
  
  <div class="section-title">III. HÀM GHI LOG</div>
  <pre style="font-family: monospace; font-size: 11pt; background: #f5f5f5; padding: 15pt; border: 1px solid #ccc;">
import { logAudit } from '@/lib/audit';

await logAudit({
  userId: session.user.id,
  functionCode: 'UPDATE_PERSONNEL',
  action: 'UPDATE',
  resourceType: 'USER',
  resourceId: userId,
  oldValue: existingUser,
  newValue: updatedUser,
  result: 'SUCCESS',
  ipAddress: request.headers.get('x-forwarded-for'),
  userAgent: request.headers.get('user-agent'),
});
  </pre>
  
  <div class="section-title">IV. CÁC SỰ KIỆN ĐƯỢC GHI</div>
  <table>
    <tr><th>Loại sự kiện</th><th>Mô tả</th><th>Mức độ quan trọng</th></tr>
    <tr><td>LOGIN_SUCCESS</td><td>Đăng nhập thành công</td><td>INFO</td></tr>
    <tr><td>LOGIN_FAILED</td><td>Đăng nhập thất bại</td><td>WARNING</td></tr>
    <tr><td>UNAUTHORIZED_ACCESS</td><td>Truy cập không quyền</td><td>CRITICAL</td></tr>
    <tr><td>DATA_BREACH_ATTEMPT</td><td>Cố truy cập dữ liệu ngoài scope</td><td>CRITICAL</td></tr>
    <tr><td>MASS_DELETE</td><td>Xóa hàng loạt</td><td>WARNING</td></tr>
    <tr><td>ADMIN_ACTION</td><td>Hành động quản trị</td><td>INFO</td></tr>
  </table>
  
  <div class="section-title">V. THỜI GIAN LƯU TRỮ</div>
  <p>Theo quy định của Bộ Quốc phòng và Nghị định 85/2016/NĐ-CP, nhật ký hệ thống được lưu trữ tối thiểu <b>5 năm</b>.</p>
  
  <div style="margin-top: 40pt; text-align: right;"><b>TỔ TRIỂN KHAI</b></div>
</div>
</body></html>
`;

// E7.1: Kế hoạch kiểm thử
export const E7_1_KE_HOACH_KIEM_THU = () => `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
<div class="document">
  ${DOCUMENT_HEADER}
  <div class="doc-title">KẾ HOẠCH KIỂM THỎ HỆ THỐNG</div>
  <div class="doc-subtitle">Hệ thống BigData Học viện Hậu cần</div>
  
  <div class="section-title">I. MỤC TIÊU KIỂM THỎ</div>
  <ul>
    <li>Xác nhận hệ thống hoạt động đúng theo yêu cầu</li>
    <li>Kiểm tra tính năng phân quyền RBAC</li>
    <li>Kiểm tra cơ chế Audit Log</li>
    <li>Đánh giá hiệu năng hệ thống</li>
  </ul>
  
  <div class="section-title">II. PHẠM VI KIỂM THỎ</div>
  <table>
    <tr><th>Module</th><th>Nội dung kiểm thử</th><th>Số test case</th></tr>
    <tr><td>Xác thực</td><td>Đăng nhập, đăng xuất, quên mật khẩu</td><td>15</td></tr>
    <tr><td>Phân quyền RBAC</td><td>Kiểm tra 71 function codes</td><td>71</td></tr>
    <tr><td>CSDL Quân nhân</td><td>CRUD thông tin quân nhân</td><td>20</td></tr>
    <tr><td>CSDL Học viên</td><td>CRUD hồ sơ, điểm</td><td>25</td></tr>
    <tr><td>CSDL Giảng viên</td><td>CRUD hồ sơ, NCKH</td><td>20</td></tr>
    <tr><td>Workflow</td><td>Chuyển trạng thái điểm, NCKH</td><td>15</td></tr>
    <tr><td>Audit Log</td><td>Kiểm tra ghi log</td><td>10</td></tr>
    <tr><td>Dashboard</td><td>Hiển thị dữ liệu</td><td>8</td></tr>
    <tr><td><b>Tổng</b></td><td></td><td><b>184</b></td></tr>
  </table>
  
  <div class="section-title">III. TIÊU CHÍ NGHIỆM THU</div>
  <ul>
    <li>≥ 95% test cases PASS</li>
    <li>Không có lỗi nghiêm trọng (Critical/Blocker)</li>
    <li>Thời gian phản hồi API < 2 giây</li>
    <li>Hệ thống hoạt động ổn định 72 giờ liên tục</li>
  </ul>
  
  <div class="section-title">IV. LỊCH TRÌNH KIỂM THỎ</div>
  <table>
    <tr><th>Giai đoạn</th><th>Nội dung</th><th>Thời gian</th></tr>
    <tr><td>1</td><td>Kiểm thử đơn vị (Unit Test)</td><td>3 ngày</td></tr>
    <tr><td>2</td><td>Kiểm thử tích hợp (Integration Test)</td><td>2 ngày</td></tr>
    <tr><td>3</td><td>Kiểm thử hệ thống (System Test)</td><td>3 ngày</td></tr>
    <tr><td>4</td><td>Kiểm thử nghiệm thu (UAT)</td><td>2 ngày</td></tr>
  </table>
  
  <div style="margin-top: 40pt; text-align: right;"><b>TỔ TRIỂN KHAI</b></div>
</div>
</body></html>
`;

// E7.5: Hướng dẫn sử dụng
export const E7_5_HUONG_DAN_SU_DUNG = () => `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
<div class="document">
  ${DOCUMENT_HEADER}
  <div class="doc-title">HƯỚNG DẪN SỎ DỤNG HỆ THỐNG</div>
  <div class="doc-subtitle">Hệ thống BigData Học viện Hậu cần v8.0</div>
  
  <div class="section-title">I. TRUY CẬP HỆ THỐNG</div>
  
  <p><b>1.1. Địa chỉ truy cập:</b> https://bigdatahvhc.abacusai.app</p>
  
  <p><b>1.2. Tài khoản demo:</b></p>
  <table>
    <tr><th>Vai trò</th><th>Email</th><th>Mật khẩu</th></tr>
    <tr><td>Quản trị hệ thống</td><td>admin@hvhc.edu.vn</td><td>Hv@2025</td></tr>
    <tr><td>Giám đốc Học viện</td><td>director@hvhc.edu.vn</td><td>Hv@2025</td></tr>
    <tr><td>Trưởng Khoa</td><td>dept.head@hvhc.edu.vn</td><td>Hv@2025</td></tr>
    <tr><td>Chủ nhiệm Bộ môn</td><td>subject.head@hvhc.edu.vn</td><td>Hv@2025</td></tr>
    <tr><td>Giảng viên</td><td>instructor@hvhc.edu.vn</td><td>Hv@2025</td></tr>
    <tr><td>Nghiên cứu viên</td><td>researcher@hvhc.edu.vn</td><td>Hv@2025</td></tr>
    <tr><td>Kỹ thuật viên</td><td>technician@hvhc.edu.vn</td><td>Hv@2025</td></tr>
    <tr><td>Học viên</td><td>student@hvhc.edu.vn</td><td>Hv@2025</td></tr>
  </table>
  
  <div class="section-title">II. CÁC CHỨC NĂNG CHÍNH</div>
  
  <p><b>2.1. Dashboard</b></p>
  <ul>
    <li>Xem thống kê tổng quan</li>
    <li>Biểu đồ phân bố nhân sự, đào tạo, NCKH</li>
    <li>Tự động cập nhật mỗi 60 giây</li>
  </ul>
  
  <p><b>2.2. Quản lý CSDL</b></p>
  <ul>
    <li>CSDL Quân nhân: Xem, thêm, sửa thông tin cán bộ</li>
    <li>CSDL Học viên: Quản lý hồ sơ, điểm</li>
    <li>CSDL Giảng viên: Hồ sơ, NCKH, giảng dạy</li>
  </ul>
  
  <p><b>2.3. Workflow</b></p>
  <ul>
    <li>Tạo nháp → Gửi duyệt → Phê duyệt/Từ chối</li>
    <li>Áp dụng cho: Điểm học tập, Đề tài NCKH, Chính sách</li>
  </ul>
  
  <div class="section-title">III. HƯỚNG DẪN THEO VAI TRÒ</div>
  
  <p><b>3.1. Giảng viên:</b></p>
  <ul>
    <li>Nhập điểm học viên (trạng thái DRAFT)</li>
    <li>Gửi duyệt điểm (chuyển sang SUBMITTED)</li>
    <li>Quản lý đề tài NCKH cá nhân</li>
  </ul>
  
  <p><b>3.2. Trưởng Khoa:</b></p>
  <ul>
    <li>Duyệt điểm của giảng viên trong khoa</li>
    <li>Xem thống kê đào tạo của khoa</li>
    <li>Quản lý cán bộ trong đơn vị</li>
  </ul>
  
  <p><b>3.3. Quản trị viên:</b></p>
  <ul>
    <li>Quản lý tài khoản người dùng</li>
    <li>Cấu hình phân quyền RBAC</li>
    <li>Xem Audit Log hệ thống</li>
  </ul>
  
  <div class="section-title">IV. LIÊN HỆ HỖ TRỢ</div>
  <p><b>Phòng Công nghệ Thông tin - Học viện Hậu cần</b></p>
  <p>Email: cntt@hvhc.edu.vn</p>
  <p>Điện thoại: (024) xxxx xxxx</p>
  
  <div style="margin-top: 40pt; text-align: right;"><b>TỔ TRIỂN KHAI</b></div>
</div>
</body></html>
`;

export { CSS_STYLESHEET, DOCUMENT_HEADER };
