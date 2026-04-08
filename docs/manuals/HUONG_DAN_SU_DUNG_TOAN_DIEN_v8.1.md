# HƯỚNG DẪN SỬ DỤNG TOÀN DIỆN
## HỆ THỐNG QUẢN LÝ DỮ LIỆU LỚN HVHC v8.1

---

## MỤC LỤC

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Module Quản Lý Cán Bộ - Nhân Sự](#2-module-quản-lý-cán-bộ---nhân-sự)
3. [Module Quản Lý Đảng Viên](#3-module-quản-lý-đảng-viên)
4. [Module Bảo Hiểm Xã Hội](#4-module-bảo-hiểm-xã-hội)
5. [Module Chính Sách - Chế Độ](#5-module-chính-sách---chế-độ)
6. [Module Khen Thưởng - Kỷ Luật](#6-module-khen-thưởng---kỷ-luật)
7. [Module Giảng Viên - Học Viên](#7-module-giảng-viên---học-viên)
8. [Module Đào Tạo](#8-module-đào-tạo)
9. [Module Nghiên Cứu Khoa Học](#9-module-nghiên-cứu-khoa-học)
10. [Module Quản Trị Hệ Thống](#10-module-quản-trị-hệ-thống)
11. [Tính Năng AI & Phân Tích](#11-tính-năng-ai--phân-tích)
12. [Bảng Điều Khiển Chỉ Huy](#12-bảng-điều-khiển-chỉ-huy)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Giới Thiệu

Hệ thống Quản lý Dữ liệu lớn HVHC v8.1 là nền tảng số hóa toàn diện cho Học viện Hậu cần, tích hợp 8 cơ sở dữ liệu nghiệp vụ chính với công nghệ AI tiên tiến.

### 1.2 Điểm Mạnh Tổng Thể

| Tiêu chí | Mô tả |
|----------|-------|
| **Tích hợp đồng bộ** | 8 CSDL liên thông, loại bỏ "ốc đảo dữ liệu" |
| **RBAC động** | Phân quyền theo chức vụ với 88+ mã chức năng |
| **AI thông minh** | Dự báo rủi ro, phân tích xu hướng tự động |
| **Realtime Dashboard** | Cập nhật tức thời, auto-refresh 30s |
| **Bảo mật nhiều lớp** | Mã hóa, audit log, kiểm soát phiên |

### 1.3 Thông Tin Đăng Nhập Demo

```
Tài khoản quản trị: john@doe.com / password123
URL: https://bigdatahvhc.abacusai.app
```

---

## 2. MODULE QUẢN LÝ CÁN BỘ - NHÂN SỰ

### 2.1 Tổng Quan

Module quản lý toàn diện thông tin 287 cán bộ, sĩ quan của Học viện với đầy đủ hồ sơ cá nhân, quân hàm, chức vụ.

### 2.2 Các Chức Năng Chính

#### 2.2.1 Danh Sách Cán Bộ (`/dashboard/personnel/list`)

**Mô tả:** Hiển thị danh sách toàn bộ cán bộ với bộ lọc nâng cao.

**Cách sử dụng:**
1. Truy cập menu "CSDL Cán bộ - Nhân sự" → "Danh sách cán bộ"
2. Sử dụng bộ lọc: Đơn vị, Quân hàm, Chức vụ, Trạng thái
3. Tìm kiếm nhanh bằng tên hoặc mã cán bộ
4. Click vào tên để xem chi tiết

**Điểm mạnh:**
- ✅ **Tìm kiếm đa chiều:** Lọc theo 5+ tiêu chí cùng lúc
- ✅ **Phân trang thông minh:** 20 bản ghi/trang, tối ưu hiệu năng
- ✅ **Export đa định dạng:** Excel, CSV với filter hiện tại
- ✅ **Responsive:** Hiển thị tốt trên mobile/tablet

**Mã chức năng RBAC:** `VIEW_PERSONNEL`, `EXPORT_PERSONNEL`

#### 2.2.2 Thêm Mới Cán Bộ (`/dashboard/personnel/create`)

**Mô tả:** Form nhập liệu đầy đủ thông tin cán bộ mới.

**Cách sử dụng:**
1. Click "+ Thêm mới" từ danh sách
2. Điền các trường bắt buộc: Họ tên, CCCD, Ngày sinh, Đơn vị
3. Upload ảnh 3x4 (nếu có)
4. Chọn Quân hàm, Chức vụ từ dropdown
5. Nhấn "Lưu" để hoàn tất

**Điểm mạnh:**
- ✅ **Validation realtime:** Kiểm tra trùng CCCD, email ngay khi nhập
- ✅ **Auto-complete:** Gợi ý đơn vị, chức vụ khi gõ
- ✅ **Audit trail:** Ghi log người tạo, thời gian

**Mã chức năng RBAC:** `CREATE_PERSONNEL`

#### 2.2.3 Hồ Sơ Cán Bộ (`/dashboard/personnel/[id]`)

**Mô tả:** Xem và chỉnh sửa hồ sơ chi tiết cán bộ.

**Các tab thông tin:**
- **Thông tin cá nhân:** Họ tên, ngày sinh, quê quán, CCCD
- **Quân sự:** Quân hàm, chức vụ, ngày nhập ngũ
- **Đào tạo:** Học vị, chuyên ngành, trường đào tạo
- **Gia đình:** Thông tin vợ/chồng, con cái
- **Lịch sử công tác:** Các vị trí đã trải qua

**Điểm mạnh:**
- ✅ **Layout tab:** Tổ chức khoa học, dễ tra cứu
- ✅ **Lịch sử thay đổi:** Xem mọi lần cập nhật
- ✅ **Liên kết CSDL:** Link đến hồ sơ Đảng, BHXH, Khen thưởng

**Mã chức năng RBAC:** `VIEW_PERSONNEL_DETAIL`, `UPDATE_PERSONNEL`

#### 2.2.4 Thống Kê Nhân Sự (`/dashboard/personnel/statistics`)

**Mô tả:** Dashboard thống kê tổng hợp về cơ cấu nhân sự.

**Biểu đồ hiển thị:**
- Phân bố theo quân hàm (Pie Chart)
- Phân bố theo đơn vị (Bar Chart)
- Xu hướng tuyển dụng theo năm (Line Chart)
- Độ tuổi trung bình theo đơn vị

**Điểm mạnh:**
- ✅ **Recharts interactive:** Click vào biểu đồ để drill-down
- ✅ **Auto-refresh:** Cập nhật mỗi 30 giây
- ✅ **Export báo cáo:** Xuất PDF/Excel tự động

**Mã chức năng RBAC:** `VIEW_PERSONNEL_STATS`

---

## 3. MODULE QUẢN LÝ ĐẢNG VIÊN

### 3.1 Tổng Quan

Quản lý 251 đảng viên với đầy đủ hồ sơ lý lịch Đảng, quá trình phát triển, sinh hoạt chi bộ.

### 3.2 Các Chức Năng Chính

#### 3.2.1 Danh Sách Đảng Viên (`/dashboard/party/list`)

**Mô tả:** Quản lý danh sách đảng viên theo chi bộ, đảng bộ.

**Cách sử dụng:**
1. Truy cập "CSDL Đảng viên" → "Danh sách"
2. Lọc theo: Chi bộ, Năm vào Đảng, Chức vụ Đảng
3. Xem thông tin: Số thẻ Đảng, Ngày vào Đảng, Chi bộ sinh hoạt

**Điểm mạnh:**
- ✅ **Phân cấp chi bộ:** Hiển thị cây tổ chức Đảng
- ✅ **Theo dõi sinh hoạt:** Badge nhắc nhở thiếu buổi sinh hoạt
- ✅ **Liên kết hồ sơ:** Auto-link đến CSDL Cán bộ

**Mã chức năng RBAC:** `VIEW_PARTY_MEMBER`

#### 3.2.2 Hồ Sơ Đảng Viên (`/dashboard/party/[id]`)

**Mô tả:** Hồ sơ lý lịch Đảng viên đầy đủ theo mẫu 2A-LLDV.

**Thông tin bao gồm:**
- Lý lịch tự khai
- Quá trình hoạt động cách mạng
- Khen thưởng, kỷ luật Đảng
- Nhận xét đánh giá hàng năm

**Điểm mạnh:**
- ✅ **Chuẩn mẫu BQP:** Tuân thủ quy định quản lý Đảng viên
- ✅ **PDF Export:** Xuất hồ sơ theo đúng mẫu quy định
- ✅ **Bảo mật cao:** Chỉ Bí thư Chi bộ trở lên được xem

**Mã chức năng RBAC:** `VIEW_PARTY_MEMBER_DETAIL`

#### 3.2.3 Phát Triển Đảng (`/dashboard/party/development`)

**Mô tả:** Theo dõi quy trình kết nạp Đảng viên mới.

**Các bước quy trình:**
1. Cảm tình Đảng → Học cảm tình
2. Đối tượng Đảng → Học lý luận chính trị
3. Đảng viên dự bị → Theo dõi 12 tháng
4. Đảng viên chính thức

**Điểm mạnh:**
- ✅ **Workflow tự động:** Nhắc nhở deadline từng bước
- ✅ **Checklist chuẩn:** Đảm bảo đủ hồ sơ thủ tục
- ✅ **Báo cáo tiến độ:** Thống kê theo chi bộ

**Mã chức năng RBAC:** `CREATE_PARTY_MEMBER`, `APPROVE_PARTY_MEMBER`

---

## 4. MODULE BẢO HIỂM XÃ HỘI

### 4.1 Tổng Quan

Quản lý toàn diện hồ sơ bảo hiểm xã hội, y tế, thất nghiệp cho cán bộ với tự động tính toán quyền lợi.

### 4.2 Các Chức Năng Chính

#### 4.2.1 Danh Sách Hồ Sơ BHXH (`/dashboard/insurance/list`)

**Mô tả:** Quản lý hồ sơ tham gia BHXH của cán bộ.

**Thông tin hiển thị:**
- Mã số BHXH, Số sổ BHXH
- Ngày bắt đầu tham gia
- Mức đóng hiện tại
- Trạng thái: Đang đóng, Tạm dừng, Đã nghỉ

**Điểm mạnh:**
- ✅ **Auto-calculate:** Tự động tính mức đóng theo lương
- ✅ **Nhắc nhở:** Cảnh báo hồ sơ sắp hết hạn
- ✅ **Đồng bộ:** Liên kết với CSDL Cán bộ realtime

**Mã chức năng RBAC:** `VIEW_INSURANCE`

#### 4.2.2 Giải Quyết Chế Độ (`/dashboard/insurance/claims`)

**Mô tả:** Xử lý các yêu cầu giải quyết chế độ BHXH.

**Các loại chế độ:**
- Ốm đau, thai sản
- Tai nạn lao động
- Hưu trí, tử tuất
- Một lần

**Điểm mạnh:**
- ✅ **Workflow phê duyệt:** 3 cấp duyệt với comment
- ✅ **Tự động tính toán:** Mức hưởng theo quy định
- ✅ **Track tiến độ:** Timeline xử lý rõ ràng

**Mã chức năng RBAC:** `VIEW_INSURANCE_CLAIM`, `APPROVE_INSURANCE_CLAIM`

#### 4.2.3 Báo Cáo BHXH (`/dashboard/insurance/reports`)

**Mô tả:** Tổng hợp báo cáo theo quy định BHXH Việt Nam.

**Các mẫu báo cáo:**
- D02-TS: Danh sách lao động tham gia BHXH
- D03-TS: Bảng tổng hợp thu BHXH
- D05-TS: Danh sách người hưởng chế độ

**Điểm mạnh:**
- ✅ **Chuẩn BHXH VN:** Đúng mẫu, đúng định dạng
- ✅ **Tự động aggregate:** Tổng hợp từ dữ liệu gốc
- ✅ **Export Excel/PDF:** Sẵn sàng nộp cơ quan

**Mã chức năng RBAC:** `EXPORT_INSURANCE_REPORT`

---

## 5. MODULE CHÍNH SÁCH - CHẾ ĐỘ

### 5.1 Tổng Quan

Quản lý các chính sách, chế độ đãi ngộ cho cán bộ: phụ cấp, trợ cấp, nhà ở, đất đai.

### 5.2 Các Chức Năng Chính

#### 5.2.1 Danh Mục Chính Sách (`/dashboard/policy/catalog`)

**Mô tả:** Tra cứu các văn bản chính sách hiện hành.

**Phân loại:**
- Chính sách tiền lương, phụ cấp
- Chế độ nhà ở, đất ở
- Trợ cấp khó khăn
- Chính sách hưu trí

**Điểm mạnh:**
- ✅ **Full-text search:** Tìm kiếm trong nội dung văn bản
- ✅ **Version control:** Theo dõi lịch sử sửa đổi
- ✅ **Nhắc nhở hết hạn:** Cảnh báo văn bản sắp hết hiệu lực

**Mã chức năng RBAC:** `VIEW_POLICY`

#### 5.2.2 Đề Xuất Chế Độ (`/dashboard/policy/requests`)

**Mô tả:** Cán bộ đề xuất hưởng các chế độ chính sách.

**Quy trình:**
1. Cán bộ tạo đề xuất với hồ sơ đính kèm
2. Trưởng đơn vị xác nhận
3. Phòng Chính sách thẩm định
4. Thủ trưởng phê duyệt

**Điểm mạnh:**
- ✅ **Online submission:** Không cần giấy tờ
- ✅ **Multi-attachment:** Đính kèm nhiều file
- ✅ **Track realtime:** Xem tiến độ từng bước

**Mã chức năng RBAC:** `CREATE_POLICY_REQUEST`, `APPROVE_POLICY`

---

## 6. MODULE KHEN THƯỞNG - KỶ LUẬT

### 6.1 Tổng Quan

Quản lý toàn bộ thành tích khen thưởng và vi phạm kỷ luật của cán bộ.

### 6.2 Các Chức Năng Chính

#### 6.2.1 Danh Sách Khen Thưởng (`/dashboard/awards/list`)

**Mô tả:** Quản lý các quyết định khen thưởng.

**Phân loại khen thưởng:**
- Huân chương, Huy chương
- Bằng khen, Giấy khen
- Chiến sĩ thi đua các cấp
- Danh hiệu anh hùng

**Điểm mạnh:**
- ✅ **Xếp hạng tự động:** Tính điểm thành tích tích lũy
- ✅ **Timeline:** Hiển thị lịch sử khen thưởng theo thời gian
- ✅ **Đề xuất AI:** Gợi ý ứng viên đủ điều kiện

**Mã chức năng RBAC:** `VIEW_AWARD`, `CREATE_AWARD`

#### 6.2.2 Quản Lý Kỷ Luật (`/dashboard/awards/discipline`)

**Mô tả:** Theo dõi các hình thức kỷ luật.

**Các hình thức:**
- Khiển trách
- Cảnh cáo
- Hạ bậc lương
- Cách chức, giáng chức

**Điểm mạnh:**
- ✅ **Bảo mật cao:** Chỉ cấp có thẩm quyền xem
- ✅ **Xóa án tự động:** Nhắc nhở khi đủ điều kiện
- ✅ **Audit trail:** Log đầy đủ ai xem, ai sửa

**Mã chức năng RBAC:** `VIEW_DISCIPLINE`, `CREATE_DISCIPLINE`

---

## 7. MODULE GIẢNG VIÊN - HỌC VIÊN

### 7.1 Tổng Quan

Quản lý 50 giảng viên và 200 học viên với đầy đủ hồ sơ học thuật, kết quả giảng dạy/học tập.

### 7.2 Các Chức Năng Quản Lý Giảng Viên

#### 7.2.1 Danh Sách Giảng Viên (`/dashboard/faculty/list`)

**Mô tả:** Quản lý danh sách giảng viên theo khoa/bộ môn.

**Thông tin hiển thị:**
- Họ tên, Học hàm, Học vị
- Chuyên ngành, Đơn vị
- Số môn giảng dạy, Số NCKH

**Cách sử dụng:**
1. Truy cập "CSDL Giảng viên - Học viên" → "Danh sách giảng viên"
2. Lọc theo: Khoa, Học vị, Chuyên ngành
3. Export Excel/CSV với bộ lọc hiện tại

**Điểm mạnh:**
- ✅ **Badge thống kê:** Hiển thị số dự án, công bố ngay trên list
- ✅ **Quick actions:** Xem chi tiết, chỉnh sửa, xóa inline
- ✅ **Responsive table:** Cuộn ngang trên mobile

**Mã chức năng RBAC:** `VIEW_FACULTY`, `EXPORT_FACULTY`

#### 7.2.2 Hồ Sơ Giảng Viên (`/dashboard/faculty/[id]`)

**Mô tả:** Hồ sơ chi tiết giảng viên với phân tích AI.

**Các tab:**
- **Thông tin cơ bản:** Cá nhân, học vị, chuyên môn
- **Giảng dạy:** Danh sách môn, số tiết, đánh giá
- **Nghiên cứu:** Dự án, công bố, trích dẫn
- **AI Insights:** Radar chart năng lực, khuyến nghị phát triển

**Điểm mạnh:**
- ✅ **EIS Score:** Chỉ số hiệu quả giảng viên (Education Impact Score)
- ✅ **Radar Chart:** Phân tích 6 chiều năng lực học thuật
- ✅ **Trend Analysis:** So sánh với kỳ trước

**Mã chức năng RBAC:** `VIEW_FACULTY_DETAIL`

#### 7.2.3 Học Viên Hướng Dẫn (`/dashboard/faculty/my-students`)

**Mô tả:** Giảng viên xem danh sách học viên đang hướng dẫn.

**Thống kê hiển thị:**
- 4 KPI Tiles: Tổng HV, GPA TB, Xuất sắc, Yếu
- Pie Chart phân bố học lực
- Card list với GPA màu sắc

**Điểm mạnh:**
- ✅ **Personal dashboard:** Chỉ hiện HV do mình hướng dẫn
- ✅ **GPA alert:** Highlight học viên có GPA thấp
- ✅ **Quick link:** Click card để xem chi tiết

**Mã chức năng RBAC:** `VIEW_STUDENT`

#### 7.2.4 Phân Tích Giảng Dạy (`/dashboard/faculty/teaching-analytics`)

**Mô tả:** Dashboard phân tích hiệu quả giảng dạy.

**Biểu đồ:**
- Line Chart: Xu hướng điểm TB theo học kỳ
- Table: 12 cột chi tiết kết quả
- Export: CSV/PDF với filter

**Điểm mạnh:**
- ✅ **Multi-semester view:** So sánh qua nhiều kỳ
- ✅ **Drill-down:** Click biểu đồ để xem chi tiết
- ✅ **UTF-8 BOM:** Export CSV đúng tiếng Việt

**Mã chức năng RBAC:** `VIEW_TEACHING_STATS`

### 7.3 Các Chức Năng Quản Lý Học Viên

#### 7.3.1 Danh Sách Học Viên (`/dashboard/student/list`)

**Mô tả:** Quản lý toàn bộ học viên theo khóa/lớp.

**Bộ lọc:**
- Khoa, Lớp, Trạng thái học tập
- Pagination 20 items/page
- Export với filter hiện tại

**Điểm mạnh:**
- ✅ **Realtime count:** Badge số lượng filter đang áp dụng
- ✅ **Bulk actions:** Chọn nhiều để export/xóa
- ✅ **Smart search:** Tìm theo tên/mã/lớp/email

**Mã chức năng RBAC:** `VIEW_STUDENT`, `EXPORT_STUDENT`

#### 7.3.2 Hồ Sơ Học Viên (`/dashboard/student/[id]`)

**Mô tả:** Hồ sơ chi tiết với AI insights.

**Các tab:**
- **Thông tin cơ bản:** Cá nhân, quê quán, gia đình
- **Kết quả học tập:** Bảng điểm, GPA, xếp loại
- **AI Insights:** Dự báo rủi ro, xu hướng GPA, khuyến nghị

**Điểm mạnh:**
- ✅ **Risk prediction:** AI dự báo học viên có nguy cơ
- ✅ **GPA trend:** Biểu đồ xu hướng với confidence interval
- ✅ **Auto recommendations:** Đề xuất can thiệp tự động

**Mã chức năng RBAC:** `VIEW_STUDENT_DETAIL`

#### 7.3.3 Thống Kê Học Viên (`/dashboard/student/stats`)

**Mô tả:** Tổng hợp thống kê học lực.

**Biểu đồ:**
- Pie: Phân loại học lực (Xuất sắc/Giỏi/Khá/Yếu)
- Bar: Tỷ lệ đạt theo môn
- Table: Top 10 học viên

**Điểm mạnh:**
- ✅ **Recharts interactive:** Click để drill-down
- ✅ **Compare mode:** So sánh với kỳ trước
- ✅ **Export QTV only:** Bảo mật dữ liệu

**Mã chức năng RBAC:** `VIEW_STUDENT_STATS`

---

## 8. MODULE ĐÀO TẠO

### 8.1 Tổng Quan

Quản lý toàn bộ quy trình đào tạo: chương trình, khung chương trình, môn học, thời khóa biểu, kỳ thi.

### 8.2 Các Chức Năng Chính

#### 8.2.1 Chương Trình Đào Tạo (`/dashboard/education/programs`)

**Mô tả:** Quản lý các chương trình đào tạo theo trình độ.

**Phân loại:**
- Cử nhân (4 năm)
- Thạc sĩ (2 năm)
- Tiến sĩ (3-4 năm)
- Bồi dưỡng ngắn hạn

**Điểm mạnh:**
- ✅ **Version control:** Theo dõi các lần sửa đổi CTDT
- ✅ **Credit management:** Tính tín chỉ tự động
- ✅ **Prerequisite check:** Kiểm tra môn tiên quyết

**Mã chức năng RBAC:** `VIEW_PROGRAM`, `CREATE_PROGRAM`

#### 8.2.2 Khung Chương Trình (`/dashboard/education/curriculum`)

**Mô tả:** Thiết kế khung chương trình theo năm/học kỳ.

**Tính năng:**
- Drag-drop sắp xếp môn học
- Tính tổng tín chỉ tự động
- Cảnh báo conflict môn tiên quyết

**Điểm mạnh:**
- ✅ **Visual builder:** Kéo thả trực quan
- ✅ **Auto-validate:** Kiểm tra ràng buộc tự động
- ✅ **Export PDF:** In khung chương trình

**Mã chức năng RBAC:** `VIEW_CURRICULUM`, `MANAGE_CURRICULUM`

#### 8.2.3 Quản Lý Môn Học (`/dashboard/education/courses`)

**Mô tả:** Danh mục 128 môn học với thông tin chi tiết.

**Thông tin môn học:**
- Mã môn, Tên môn, Số tín chỉ
- Số tiết LT/TH/TN
- Môn tiên quyết
- Khoa phụ trách

**Điểm mạnh:**
- ✅ **Syllabus attachment:** Đính kèm đề cương
- ✅ **Material linking:** Liên kết tài liệu học tập
- ✅ **Usage tracking:** Thống kê số lớp mở

**Mã chức năng RBAC:** `VIEW_COURSE`, `CREATE_COURSE`

#### 8.2.4 Thời Khóa Biểu (`/dashboard/education/schedule`)

**Mô tả:** Xếp lịch giảng dạy theo tuần/tháng.

**Tính năng:**
- Calendar view: Tuần, Tháng
- Drag-drop xếp lịch
- Kiểm tra conflict phòng/GV

**Điểm mạnh:**
- ✅ **Smart scheduling:** AI đề xuất lịch tối ưu
- ✅ **Conflict detection:** Cảnh báo trùng lịch realtime
- ✅ **Room utilization:** Tối ưu sử dụng phòng

**Mã chức năng RBAC:** `VIEW_SCHEDULE`, `CREATE_SCHEDULE`

#### 8.2.5 Kế Hoạch Thi (`/dashboard/education/exam-plan`)

**Mô tả:** Lập kế hoạch thi theo học kỳ.

**Thông tin:**
- Danh sách môn thi
- Ngày giờ, Phòng thi
- Giám thị, Coi thi

**Điểm mạnh:**
- ✅ **Auto-assign:** Phân công giám thị tự động
- ✅ **Conflict check:** Kiểm tra SV thi cùng giờ
- ✅ **Print schedule:** In lịch thi cá nhân

**Mã chức năng RBAC:** `VIEW_EXAM_PLAN`, `CREATE_EXAM`

#### 8.2.6 Ngân Hàng Đề Thi (`/dashboard/education/question-bank`)

**Mô tả:** Quản lý kho đề thi/câu hỏi theo môn.

**Phân loại:**
- Theo mức độ: Nhận biết, Thông hiểu, Vận dụng
- Theo dạng: Trắc nghiệm, Tự luận
- Theo chương, bài

**Điểm mạnh:**
- ✅ **Random generation:** Tạo đề thi ngẫu nhiên
- ✅ **Difficulty balancing:** Cân bằng độ khó
- ✅ **Version control:** Lưu lịch sử sử dụng

**Mã chức năng RBAC:** `VIEW_QUESTION_BANK`, `CREATE_QUESTION`

#### 8.2.7 Tài Liệu Học Tập (`/dashboard/education/materials`)

**Mô tả:** Kho tài liệu học tập số hóa.

**Phân loại:**
- Giáo trình, Bài giảng
- Tài liệu tham khảo
- Video, Multimedia

**Điểm mạnh:**
- ✅ **Cloud storage:** Lưu trữ S3, không giới hạn
- ✅ **Full-text search:** Tìm trong nội dung PDF
- ✅ **Access tracking:** Thống kê lượt tải

**Mã chức năng RBAC:** `VIEW_LEARNING_MATERIAL`, `UPLOAD_MATERIAL`

#### 8.2.8 Quản Lý Hệ Số (`/dashboard/admin/he-so-mon-hoc`)

**Mô tả:** Cấu hình hệ số tính điểm theo môn.

**Các hệ số:**
- Chuyên cần (CC): 10%
- Giữa kỳ (GK): 20%
- Bài tập (BT): 20%
- Cuối kỳ: 50%

**Điểm mạnh:**
- ✅ **Realtime validation:** Tổng hệ số = 1.0 (xanh/đỏ)
- ✅ **Per-subject config:** Cấu hình riêng từng môn
- ✅ **Auto-calculate:** Tính điểm tổng kết tự động

**Mã chức năng RBAC:** `MANAGE_COEFFICIENT`

---

## 9. MODULE NGHIÊN CỨU KHOA HỌC

### 9.1 Tổng Quan

Quản lý 78 dự án nghiên cứu, công bố khoa học, hội thảo với phân tích xu hướng AI.

### 9.2 Các Chức Năng Chính

#### 9.2.1 Tổng Quan NCKH (`/dashboard/research`)

**Mô tả:** Dashboard tổng hợp hoạt động nghiên cứu.

**KPI Cards:**
- Tổng dự án: 78
- Đang triển khai: 45
- Hoàn thành: 28
- Công bố quốc tế: 15

**Điểm mạnh:**
- ✅ **Realtime stats:** Cập nhật tự động
- ✅ **Chart interactive:** Click để xem chi tiết
- ✅ **Export report:** Báo cáo NCKH định kỳ

**Mã chức năng RBAC:** `VIEW_RESEARCH`

#### 9.2.2 Danh Sách Dự Án (`/dashboard/research/projects`)

**Mô tả:** Quản lý các đề tài, dự án NCKH.

**Phân loại:**
- Cấp Nhà nước
- Cấp Bộ Quốc phòng
- Cấp Học viện
- Cấp Khoa

**Điểm mạnh:**
- ✅ **Milestone tracking:** Theo dõi tiến độ từng giai đoạn
- ✅ **Budget management:** Quản lý kinh phí
- ✅ **Team assignment:** Phân công thành viên

**Mã chức năng RBAC:** `VIEW_RESEARCH`, `CREATE_RESEARCH`

#### 9.2.3 Danh Sách Nhà Khoa Học (`/dashboard/research/scientists`)

**Mô tả:** Hồ sơ các nhà khoa học của Học viện.

**Thông tin:**
- Hồ sơ học thuật
- Danh sách công bố
- Chỉ số trích dẫn (H-index)
- Dự án tham gia

**Điểm mạnh:**
- ✅ **Citation tracking:** Theo dõi trích dẫn tự động
- ✅ **Profile linking:** Liên kết Google Scholar, ORCID
- ✅ **Ranking:** Xếp hạng theo thành tích

**Mã chức năng RBAC:** `VIEW_SCIENTIST`

#### 9.2.4 Xu Hướng AI (`/dashboard/research/ai-trends`)

**Mô tả:** AI phân tích xu hướng nghiên cứu.

**Tính năng:**
- Keyword trending analysis
- Topic modeling
- Collaboration network
- Recommendation engine

**Điểm mạnh:**
- ✅ **ML-powered:** Sử dụng NLP phân tích
- ✅ **Visualization:** Network graph, Word cloud
- ✅ **Recommendations:** Đề xuất hướng nghiên cứu mới

**Mã chức năng RBAC:** `VIEW_AI_ANALYTICS`

---

## 10. MODULE QUẢN TRỊ HỆ THỐNG

### 10.1 Tổng Quan

Các chức năng quản trị dành cho Admin: quản lý người dùng, đơn vị, phân quyền RBAC.

### 10.2 Các Chức Năng Chính

#### 10.2.1 Quản Lý Người Dùng (`/dashboard/admin/users`)

**Mô tả:** CRUD tài khoản người dùng hệ thống.

**Tính năng:**
- Tạo, sửa, xóa tài khoản
- Khóa/Mở khóa tài khoản
- Reset mật khẩu
- Gán chức vụ (Position)

**Cách sử dụng:**
1. Truy cập "Quản trị hệ thống" → "Quản lý người dùng"
2. Click "+ Thêm mới" để tạo user
3. Chọn Position từ dropdown (liên kết RBAC)
4. Hệ thống tự động gán quyền theo Position

**Điểm mạnh:**
- ✅ **Position dropdown:** Chọn từ danh sách, không nhập tay
- ✅ **Auto RBAC:** Quyền tự động theo Position
- ✅ **Bulk import:** Import từ Excel

**Mã chức năng RBAC:** `MANAGE_USERS`

#### 10.2.2 Quản Lý Đơn Vị (`/dashboard/admin/units`)

**Mô tả:** Quản lý cấu trúc tổ chức theo dạng cây.

**Tính năng:**
- Thêm/Sửa/Xóa đơn vị
- Drag-drop sắp xếp
- Gán chỉ huy
- Xem sơ đồ tổ chức

**Điểm mạnh:**
- ✅ **Tree view:** Hiển thị cây tổ chức trực quan
- ✅ **Cascade update:** Cập nhật con khi sửa cha
- ✅ **Org chart:** Export sơ đồ tổ chức PDF

**Mã chức năng RBAC:** `MANAGE_UNITS`

#### 10.2.3 Trung Tâm RBAC (`/dashboard/admin/rbac`)

**Mô tả:** Quản lý phân quyền động theo chức vụ.

**Các chức năng con:**
- **Quản lý Chức vụ:** CRUD 14+ positions
- **Quản lý Chức năng:** 88+ function codes
- **Ma trận quyền:** Gán function → position
- **SoD Check:** Kiểm tra conflict quyền

**Cách sử dụng:**
1. Vào "Quản lý Chức vụ" để xem/thêm position
2. Vào "Ma trận quyền" để gán functions
3. Toggle switch ON/OFF từng function
4. Chọn scope: Toàn học viện / Đơn vị

**Điểm mạnh:**
- ✅ **Module grouping:** Functions nhóm theo CSDL
- ✅ **Batch toggle:** Bật/tắt nhiều function cùng lúc
- ✅ **Scope support:** Phân quyền theo phạm vi
- ✅ **Live update:** Sidebar tự động cập nhật

**Mã chức năng RBAC:** `MANAGE_RBAC`

#### 10.2.4 Nhật Ký Hệ Thống (`/dashboard/admin/audit-logs`)

**Mô tả:** Xem log tất cả hoạt động trong hệ thống.

**Thông tin log:**
- Timestamp, User, IP
- Action: LOGIN, LOGOUT, CREATE, UPDATE, DELETE
- Resource type, Resource ID
- Old value, New value

**Điểm mạnh:**
- ✅ **Full audit:** Ghi lại mọi thao tác
- ✅ **Diff view:** So sánh giá trị cũ/mới
- ✅ **Export compliance:** Đáp ứng yêu cầu kiểm toán

**Mã chức năng RBAC:** `VIEW_AUDIT_LOG`

#### 10.2.5 Cấu Hình AI (`/dashboard/admin/ai-settings`)

**Mô tả:** Cấu hình provider và model AI.

**Tùy chọn:**
- Provider: Abacus AI / OpenAI
- API Key configuration
- Model selection
- Test connection

**Điểm mạnh:**
- ✅ **Multi-provider:** Hỗ trợ nhiều LLM provider
- ✅ **Connection test:** Kiểm tra kết nối ngay
- ✅ **Secure storage:** API key mã hóa

**Mã chức năng RBAC:** `MANAGE_AI_CONFIG`

---

## 11. TÍNH NĂNG AI & PHÂN TÍCH

### 11.1 AI Student Insights

**Mô tả:** Phân tích dự báo học viên bằng AI.

**Tính năng:**
- **Risk Prediction:** Dự báo học viên có nguy cơ (high/medium/low)
- **GPA Trend:** Phân tích xu hướng với confidence interval
- **Recommendations:** Đề xuất can thiệp tự động

**Điểm mạnh:**
- ✅ **5-tier scoring:** Hệ thống đánh giá 5 mức
- ✅ **Mitigation strategies:** Gợi ý biện pháp cụ thể
- ✅ **Historical pattern:** Phân tích lịch sử thất bại

**API:** `/api/ai/predict-risk`, `/api/ai/student-trends`

### 11.2 Faculty Radar Chart

**Mô tả:** Biểu đồ radar năng lực giảng viên.

**6 chiều đánh giá:**
1. Teaching (Giảng dạy)
2. Research (Nghiên cứu)
3. Mentorship (Hướng dẫn)
4. Publication (Công bố)
5. Service (Phục vụ)
6. Innovation (Đổi mới)

**Điểm mạnh:**
- ✅ **Confidence color:** Xanh (80-100), Vàng (50-80), Đỏ (<50)
- ✅ **Comparison:** So sánh với trung bình khoa
- ✅ **Trend tracking:** Theo dõi theo thời gian

### 11.3 Sentiment Analysis

**Mô tả:** Phân tích cảm xúc văn bản hàng loạt.

**Tính năng:**
- Multi-document analysis
- Keyword extraction
- Summary generation

**Ứng dụng:**
- Phân tích feedback sinh viên
- Đánh giá báo cáo nghiên cứu
- Tổng hợp ý kiến hội nghị

### 11.4 Report Generation

**Mô tả:** Tạo báo cáo tự động hàng tháng.

**Các loại báo cáo:**
- Báo cáo nhân sự
- Báo cáo đào tạo
- Báo cáo NCKH
- Báo cáo tổng hợp

**Điểm mạnh:**
- ✅ **PDF/Excel:** Đa định dạng
- ✅ **AI insights:** Nhận xét tự động
- ✅ **Historical compare:** So sánh kỳ trước

---

## 12. BẢNG ĐIỀU KHIỂN CHỈ HUY

### 12.1 Executive Dashboard (`/dashboard/command`)

**Mô tả:** Dashboard tổng hợp cho Ban Giám đốc.

### 12.2 Các Tab Chính

#### Tab 1: Overview (Tổng quan)

**KPI Cards:**
- Tổng cán bộ: 287
- Đảng viên: 251
- Giảng viên: 50
- Học viên: 200
- Dự án NCKH: 78
- Môn học: 128

**Biểu đồ:**
- Trend line nhân sự 12 tháng
- Distribution pie charts

#### Tab 2: Databases (Cơ sở dữ liệu)

**Thống kê CSDL:**
- Số bản ghi từng module
- Tỷ lệ điền đầy đủ
- Last update timestamp

#### Tab 3: Analytics (Phân tích)

**Dashboards:**
- Training completion rate
- Research productivity
- Personnel growth

#### Tab 4: System (Hệ thống)

**Health metrics:**
- Server uptime
- Database size
- Active users

**Điểm mạnh chung:**
- ✅ **Auto-refresh:** Cập nhật mỗi 30 giây
- ✅ **Role-based view:** Hiển thị theo quyền
- ✅ **Export dashboard:** PDF/PNG screenshot
- ✅ **Mobile responsive:** Xem trên điện thoại

---

## PHỤ LỤC

### A. Bảng Mã Chức Năng RBAC

| Module | Mã chức năng | Mô tả |
|--------|--------------|-------|
| PERSONNEL | VIEW_PERSONNEL | Xem danh sách cán bộ |
| PERSONNEL | CREATE_PERSONNEL | Thêm mới cán bộ |
| PERSONNEL | UPDATE_PERSONNEL | Cập nhật thông tin |
| PERSONNEL | DELETE_PERSONNEL | Xóa cán bộ |
| PERSONNEL | EXPORT_PERSONNEL | Xuất dữ liệu |
| PARTY | VIEW_PARTY_MEMBER | Xem đảng viên |
| PARTY | CREATE_PARTY_MEMBER | Kết nạp đảng viên |
| INSURANCE | VIEW_INSURANCE | Xem hồ sơ BHXH |
| INSURANCE | APPROVE_INSURANCE_CLAIM | Duyệt chế độ |
| EDUCATION | VIEW_COURSE | Xem môn học |
| EDUCATION | CREATE_SCHEDULE | Xếp thời khóa biểu |
| RESEARCH | VIEW_RESEARCH | Xem dự án NCKH |
| RESEARCH | CREATE_RESEARCH | Tạo dự án mới |
| SYSTEM | MANAGE_USERS | Quản lý người dùng |
| SYSTEM | MANAGE_RBAC | Quản lý phân quyền |
| SYSTEM | VIEW_AUDIT_LOG | Xem nhật ký |

### B. Danh Sách Chức Vụ Mặc Định

| Mã | Tên chức vụ | Số quyền |
|----|-------------|----------|
| SYSTEM_ADMIN | Quản trị hệ thống | 88 |
| GIAM_DOC | Giám đốc | 28 |
| PHO_GIAM_DOC | Phó Giám đốc | 24 |
| TRUONG_KHOA | Trưởng Khoa | 20 |
| TRUONG_PHONG | Trưởng Phòng | 18 |
| GIANG_VIEN | Giảng viên | 12 |
| CAN_BO | Cán bộ | 8 |

### C. Yêu Cầu Hệ Thống

**Browser hỗ trợ:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Độ phân giải tối thiểu:** 1280x720

---

## THÔNG TIN LIÊN HỆ HỖ TRỢ

- **Email:** support@hvhc.edu.vn
- **Hotline:** 024-xxxx-xxxx
- **Tài liệu online:** https://bigdatahvhc.abacusai.app/docs

---

*Tài liệu được tạo tự động bởi Hệ thống HVHC BigData Management v8.1*
*Ngày cập nhật: 23/02/2026*
