## 5) `docs/design/module-m07-dashboard-reporting.md`

# Module M07 – Dashboard GV-HV và Báo cáo thi đua

## 1. Mục tiêu

Tài liệu này triển khai UC-38: dashboard tổng hợp giảng viên–học viên và báo cáo thi đua. Tài liệu gốc xác định đây là chức năng mới của M07, đi cùng hai nhóm dữ liệu lớn: hiệu quả giảng viên và kết quả học tập/hồ sơ học viên. fileciteturn1file0L33-L41

## 2. Nhóm dashboard

### 2.1. Faculty dashboard

* số giảng viên theo khoa/bộ môn
* phân bố học hàm/học vị/chức danh
* tải giảng hiện tại
* top/bottom EIS theo kỳ
* cảnh báo quá tải
* tình hình hướng dẫn học viên

### 2.2. Student dashboard

* số sinh viên/học viên theo khóa, lớp, ngành
* GPA trung bình theo khóa/ngành/lớp
* tỷ lệ cảnh báo học tập
* tỷ lệ probation
* điểm rèn luyện trung bình
* tiến độ khóa luận/luận văn

### 2.3. Thi đua và tổng hợp

* đề xuất thi đua giảng viên dựa trên EIS + tải giảng + nghiên cứu
* đề xuất theo dõi học viên nổi bật / học viên cảnh báo
* báo cáo tổng hợp khoa/bộ môn/khóa học

## 3. KPI gợi ý

### Faculty KPIs

* tổng giảng viên
* tỷ lệ đạt chuẩn học vị
* EIS trung bình theo kỳ
* số giảng viên quá tải/thiếu tải
* số giảng viên tham gia hướng dẫn

### Student KPIs

* tổng người học
* GPA trung bình
* số học viên cảnh báo học tập
* số probation
* số đúng tiến độ khóa luận

## 4. Bộ lọc cần có

* học kỳ
* khoa/bộ môn
* khóa học
* lớp
* ngành
* loại chương trình
* học vị/chức danh
* trạng thái học tập

## 5. Nguồn dữ liệu

* `FacultyProfile`
* `FacultyEISScore`
* `FacultyWorkloadSnapshot`
* `StudentProfile`
* `StudentGpaHistory`
* `StudentConductSnapshot`
* dữ liệu đọc từ M10 và M09

## 6. Nguyên tắc thi đua/báo cáo

1. Không dùng duy nhất `totalEIS` làm quyết định thi đua.
2. Phải cho drill-down từng thành phần dữ liệu.
3. Báo cáo thi đua là công cụ hỗ trợ, không thay thế quyết định tổ chức-cán bộ.
4. Mọi tiêu chí tổng hợp phải cấu hình được.

## 7. API gợi ý

* `GET /api/faculty/dashboard/summary`
* `GET /api/faculty/dashboard/eis-ranking`
* `GET /api/faculty/dashboard/workload-alerts`
* `GET /api/students/dashboard/summary`
* `GET /api/students/dashboard/gpa-distribution`
* `GET /api/students/dashboard/warnings`
* `GET /api/m07/dashboard/thi-dua-report`
* `GET /api/m07/reports/export`

## 8. Rủi ro cần kiểm soát

* KPI không nhất quán giữa dashboard và báo cáo xuất file.
* Xếp hạng giảng viên quá đơn giản gây phản cảm nghiệp vụ.
* Dashboard dùng runtime query quá nặng.
* Dữ liệu thi đua hiển thị vượt scope.

---