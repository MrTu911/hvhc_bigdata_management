# Module M07 – CSDL Giảng viên & Học viên

## 1) `docs/design/module-m07-overview.md`

# Module M07 – CSDL Giảng viên & Học viên

## 1. Mục tiêu module

M07 là module trung tâm quản lý đội ngũ giảng viên và người học tại Học viện Hậu cần. Module này định vị là lớp dữ liệu nghiệp vụ chuyên sâu nằm giữa quản lý nhân sự nền tảng và hệ thống đào tạo, nghiên cứu khoa học. Theo tài liệu gốc, M07 kế thừa master data từ M02, tích hợp chặt với M10 và M09; đồng thời nổi bật với ba trục năng lực: hồ sơ 360°, EIS Score 6 chiều cho giảng viên, và quản lý kết quả học tập/GPA tích lũy của học viên. fileciteturn1file0L1-L18

## 2. Định vị trong hệ thống

M07 không phải LMS đầy đủ và cũng không thay thế M10. M07 đóng vai trò “trục hồ sơ phân tích” cho hai nhóm đối tượng:

* Giảng viên: hồ sơ học hàm, học vị, chuyên ngành, nghiên cứu, tải giảng, EIS Score.
* Học viên/sinh viên: hồ sơ 360°, cố vấn học tập, GPA tích lũy, trạng thái học tập, rèn luyện, liên kết luận văn/khóa luận.

Tài liệu gốc xác định quy mô dữ liệu khoảng 50 giảng viên và khoảng 2.450 sinh viên/học viên; RBAC prefix dùng hai nhóm mã quyền `FACULTY.*` và `STUDENT.*`; đường dẫn giao diện chuẩn là `/dashboard/faculty/*` và `/dashboard/student/*`. fileciteturn1file0L19-L41

## 3. Phụ thuộc hệ thống

### 3.1. Phụ thuộc bắt buộc

#### M02 – Personnel / master data cán bộ

M07 dùng M02 làm nguồn chuẩn cho cán bộ, quân nhân, học vị, chứng chỉ, hồ sơ phát triển chuyên môn, đặc biệt với giảng viên và học viên quân sự. Tài liệu gốc nêu rõ M07 kế thừa master data từ M02. fileciteturn1file0L9-L15

#### M10 – Đào tạo

M07 lấy dữ liệu lớp học phần, điểm, phân công giảng dạy, kết quả học tập, cố vấn học tập, khóa luận, rèn luyện từ M10. Tài liệu gốc nêu rõ tải giảng được tính từ `CourseSection` trong M10; GPA, enrollment, thesis topics, conduct đều liên thông sang M10. fileciteturn1file0L54-L66 fileciteturn1file0L86-L104

#### M09 – Nghiên cứu khoa học

M07 lấy dữ liệu đề tài, công bố, sáng kiến, chỉ số nghiên cứu làm đầu vào cho EIS Score và hồ sơ giảng viên. Tài liệu gốc nêu rõ FacultyProfile liên kết ResearchProject, ResearchPublication; thành phần R và I của EIS lấy dữ liệu từ M09. fileciteturn1file0L63-L66 fileciteturn1file0L71-L84

### 3.2. Phụ thuộc nên có

#### M01 – Auth, RBAC, scope, audit

M07 cần M01 để kiểm soát RBAC prefix `FACULTY.*` và `STUDENT.*`, đồng thời bảo vệ quyền xem hồ sơ, điểm, dashboard, trigger tính EIS và xuất báo cáo. Tài liệu gốc đã chốt rõ hai nhóm prefix quyền. fileciteturn1file0L19-L41

#### M19 – Master Data

M07 nên dùng M19 để chuẩn hóa học hàm, học vị, chức danh giảng dạy, loại chương trình, trạng thái học tập, xu hướng EIS, loại cố vấn, nhóm chuyên ngành.

## 4. Use cases chính theo tài liệu gốc

M07 có 6 use case từ UC-33 đến UC-38, gồm 3 chức năng hiện hữu, 2 nâng cấp và 1 mới:

* UC-33: Hồ sơ giảng viên 360°
* UC-34: AI EIS Score – đánh giá hiệu quả giảng viên 6 chiều
* UC-35: Phân công giảng dạy & tải giảng tự động
* UC-36: Hồ sơ học viên 360°
* UC-37: Quản lý kết quả học tập & GPA tích lũy
* UC-38: Dashboard tổng hợp GV-HV + báo cáo thi đua. fileciteturn1file0L19-L41

## 5. Tác nhân hệ thống

* Quản trị đào tạo
* Quản trị khoa/bộ môn
* Giảng viên
* Cố vấn học tập
* Học viên/sinh viên
* Ban giám đốc/chỉ huy cần dashboard tổng hợp
* Hệ thống background jobs tính EIS và đồng bộ GPA

## 6. Thực thể lõi dự kiến

* `FacultyProfile`
* `FacultyEISScore`
* `FacultyWorkloadSnapshot`
* `FacultyAdvisingAssignment`
* `StudentProfile`
* `StudentAcademicSnapshot`
* `StudentGpaHistory`
* `StudentConductSnapshot`
* `FacultyDashboardMetric`
* `StudentDashboardMetric`

Trong đó hai model `FacultyProfile` và `StudentProfile` là lõi đã được tài liệu gốc phác thảo rõ. `FacultyEISScore` là bảng tính định kỳ theo học kỳ. fileciteturn1file0L42-L69 fileciteturn1file0L86-L104

## 7. Nguyên tắc thiết kế

1. Không tạo nguồn sự thật song song với M02, M10, M09.
2. M07 là lớp tổng hợp hồ sơ, phân tích và dashboard.
3. Dữ liệu tính toán như EIS, GPA tích lũy, tải giảng cần có cơ chế snapshot theo kỳ.
4. Hồ sơ 360° phải ưu tiên đọc từ các module nguồn trước khi ghi cache/snapshot.
5. Phân quyền phải đặc biệt chặt ở dữ liệu học viên, điểm, rèn luyện, thi đua.

## 8. Rủi ro kiến trúc cần kiểm soát

1. Trùng dữ liệu giảng viên với Personnel trong M02.
2. Trùng dữ liệu điểm và lớp học với M10.
3. Dùng EIS như số đánh giá tuyệt đối mà thiếu giải thích nguồn điểm thành phần.
4. Tính tải giảng trực tiếp từ runtime quá nặng, không có snapshot.
5. Scope không chặt làm giảng viên xem được học viên ngoài lớp/phạm vi phụ trách.
6. GPA bị lệch do không chuẩn hóa nguồn điểm cuối cùng từ M10.

## 9. Chiến lược triển khai theo phase

### Phase 1

* FacultyProfile
* StudentProfile
* Faculty workload read-model
* GPA read-model
* API profile360 cơ bản
* Dashboard tối thiểu

### Phase 2

* EIS engine hoàn chỉnh
* Snapshot GPA theo kỳ
* Academic/conduct warnings
* Bộ lọc dashboard nâng cao

### Phase 3

* AI recommendations cho EIS
* Thi đua giảng viên/học viên đa chiều
* Benchmark giữa khoa, bộ môn, khóa học
* Predictive analytics cho cảnh báo học tập

---