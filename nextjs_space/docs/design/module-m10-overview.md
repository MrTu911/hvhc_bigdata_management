# MODULE M10 – CSDL GIÁO DỤC ĐÀO TẠO
# Quản lý toàn diện vòng đời người học và chương trình đào tạo

---

## 1. Mục tiêu module

M10 là hệ thống quản lý giáo dục đào tạo toàn diện của Học viện Hậu cần, được xây dựng để thay thế và nâng cấp toàn bộ phân hệ đào tạo hiện có, kế thừa dữ liệu từ phần mềm quản lý đào tạo LAN cũ.

M10 quản lý đồng thời hai vòng đời:
- vòng đời người học: từ tiếp nhận đến tốt nghiệp
- vòng đời chương trình đào tạo: từ thiết kế đến đánh giá lại

M10 không phải là hệ thống LMS. Đây là hệ thống quản trị đào tạo cấp học viện.

---

## 2. Thông tin tổng quan

- Mã module: M10
- Tên module: CSDL Giáo dục Đào tạo – Quản lý toàn diện vòng đời người học
- Phiên bản thiết kế: v1.0/2026
- Số use case: 12
- Đường dẫn chính: `/dashboard/education/*`
- RBAC prefix: `EDU.*`
- Hệ đào tạo hỗ trợ:
  - Đại học chính quy
  - Liên thông
  - Sau đại học (ThS/TS)
  - Bồi dưỡng ngắn hạn
- Liên thông:
  - Phòng Đào tạo LAN (import)
  - Cục Đào tạo BQP
  - Bộ GD&ĐT (HEMIS)

---

## 3. 12 Use Cases của M10

- UC-51: Quản lý hồ sơ người học toàn trình
- UC-52: Quản lý chương trình đào tạo & khung học phần
- UC-53: Quản lý kế hoạch đào tạo học kỳ / năm học
- UC-54: Quản lý lớp học phần, lịch học, phân công giảng viên
- UC-55: Quản lý điểm danh và chuyên cần
- UC-56: Quản lý điểm và kết quả học phần
- UC-57: Academic Warning Engine – cảnh báo học vụ
- UC-58: Quản lý rèn luyện, khen thưởng, kỷ luật người học
- UC-59: Quản lý khóa luận / luận văn / đồ án
- UC-60: Graduation Rule Engine – xét tốt nghiệp & văn bằng
- UC-61: Kho tra cứu học vụ & hồ sơ đào tạo
- UC-62: Dashboard điều hành giáo dục đào tạo + AI

---

## 4. Vai trò của M10 trong toàn hệ thống

### 4.1. Quan hệ với M01
M10 phải dùng:
- auth
- RBAC
- scope dữ liệu
- audit log
- bảo vệ dữ liệu điểm, hồ sơ học viên, kết quả tốt nghiệp

### 4.2. Quan hệ với M02
M10 dùng master data người thật / cán bộ / đơn vị từ M02 cho:
- giảng viên
- cán bộ quản lý đào tạo
- một phần hồ sơ người học nếu cần liên thông nhân sự nội bộ

### 4.3. Quan hệ với M09
Đầu ra đào tạo có thể phản hồi sang hồ sơ khoa học hoặc hồ sơ học thuật liên quan ở M09, đặc biệt với sau đại học, khóa luận, luận văn, luận án. :contentReference[oaicite:1]{index=1}

### 4.4. Quan hệ với M05
Kết quả đào tạo, rèn luyện, khen thưởng, kỷ luật người học có thể phản hồi sang hồ sơ chính sách nếu thiết kế tích hợp rộng. Tài liệu M10 cũng xác định đầu ra đào tạo phản hồi lại M05. :contentReference[oaicite:2]{index=2}

### 4.5. Quan hệ với M18
Bảng điểm, quyết định, chứng chỉ, văn bằng, báo cáo đào tạo, biểu mẫu xét tốt nghiệp về lâu dài nên đi qua M18 để xuất file chuẩn.

### 4.6. Quan hệ với M19
M10 phải dùng M19 cho:
- năm học / học kỳ
- hình thức đào tạo
- chuyên ngành
- học vị / học hàm
- danh mục chuẩn hóa phục vụ CTĐT và học vụ. Tài liệu M19 đã nêu `MD_ACADEMIC_YEAR` là danh mục dùng cho module đào tạo. 

---

## 5. Hai vòng đời cốt lõi

### 5.1. Vòng đời người học
- tuyển vào / tiếp nhận
- phân lớp / khóa
- đăng ký học
- học tập / chuyên cần
- điểm thành phần / điểm học phần
- cảnh báo học vụ
- rèn luyện / thưởng / kỷ luật
- khóa luận / luận văn / đồ án
- xét tốt nghiệp
- cấp văn bằng
- lưu hồ sơ học vụ

### 5.2. Vòng đời chương trình đào tạo
- thiết kế CTĐT
- version hóa CTĐT
- xây khung học phần
- lập kế hoạch năm học / học kỳ
- mở lớp học phần
- phân công giảng viên
- đánh giá và điều chỉnh CTĐT

---

## 6. Các rủi ro bắt buộc phải kiểm soát

Theo tài liệu kỹ thuật:
1. Không version hóa CTĐT → vỡ dữ liệu khi áp dụng CTĐT mới
2. Thiếu audit trail điểm → vi phạm quy chế, tranh chấp
3. Gộp master data vào M10 → duplicate dữ liệu, khó dùng chung
4. Conflict engine chậm → xếp lịch lâu, UX kém
5. Graduation engine sai rule → cấp bằng sai người / thiếu người
6. Migration dữ liệu LAN → mất lịch sử nếu không có ETL `DRY_RUN`
7. Thiếu scope RBAC → lộ điểm, lộ dữ liệu lớp khác :contentReference[oaicite:4]{index=4}

---

## 7. Data model lõi cấp module

Các nhóm entity trung tâm:
- `StudentProfile`
- `Program`
- `ProgramVersion`
- `Course`
- `SemesterPlan`
- `CourseSection`
- `AttendanceRecord`
- `GradeRecord`
- `ScoreHistory`
- `AcademicWarning`
- `StudentConductRecord`
- `ThesisProject`
- `GraduationAudit`
- `DiplomaRecord`
- `AcademicRepositoryItem`

---

## 8. Kiến trúc code cho project hiện tại

### API
- `app/api/education/**`

### Pages
- `app/dashboard/education/**`

### Components
- `components/education/**`

### Services
- `lib/services/education/**`

### Repositories
- `lib/repositories/education/**`

### Validators
- `lib/validators/education/**`

### Prisma
- `prisma/schema.prisma`

---

## 9. Phase triển khai M10

### Phase 1
- UC-51, UC-52, UC-53, UC-54
- khóa dữ liệu người học, CTĐT, kế hoạch, lớp học phần

### Phase 2
- UC-55, UC-56, UC-57, UC-58
- khóa điểm danh, điểm, cảnh báo học vụ, rèn luyện

### Phase 3
- UC-59, UC-60, UC-61, UC-62
- khóa luận / tốt nghiệp / kho học vụ / dashboard

---

## 10. Notes for Claude

- M10 là module nghiệp vụ lớn, không được giản lược thành “quản lý lớp học”
- Bắt buộc phải có `ProgramVersion` trước go-live
- Bắt buộc phải có `ScoreHistory` cho điểm
- Không đưa master data vào M10 nếu M19 đã cung cấp
- Graduation engine phải tách thành service rõ ràng, không đặt trong UI