## 3) `docs/design/module-m07-teaching-workload.md`

# Module M07 – Phân công giảng dạy và Tải giảng tự động

## 1. Mục tiêu

Tài liệu này chi tiết hóa UC-35: phân công giảng dạy và tải giảng tự động. Theo tài liệu gốc, tải giảng trong `FacultyProfile` được tính từ `CourseSection` của M10 và có `weeklyHoursLimit` mặc định 16 giờ/tuần cùng `currentWeeklyHours` tính tự động. fileciteturn1file0L42-L55

## 2. Nguyên tắc thiết kế

1. M10 là nguồn chuẩn của lịch dạy, lớp học phần, phân công tiết dạy.
2. M07 chỉ đọc, tổng hợp, snapshot và cảnh báo quá tải.
3. Không nhập tay song song tải giảng nếu đã có nguồn từ M10.
4. Cần phân biệt tải giảng kế hoạch và tải giảng thực tế.

## 3. Dữ liệu cần tổng hợp

* tổng số lớp học phần đang giảng dạy
* số giờ dạy/tuần hiện tại
* số giờ dạy theo kỳ
* số giờ vượt định mức
* số lớp làm cố vấn học tập/hướng dẫn
* số học phần mới nhận phân công

## 4. Bảng phụ trợ gợi ý

* `FacultyTeachingAssignment`
* `FacultyWorkloadSnapshot`
* `FacultyWorkloadAlert`
* `FacultyCourseSectionLink`

## 5. Logic tính tải giảng

### 5.1. Tải hiện tại

`currentWeeklyHours` được tính từ dữ liệu lớp học phần đang hoạt động trong M10, tổng hợp theo số tiết, số buổi, vai trò giảng viên chính/phụ và quy đổi giờ chuẩn.

### 5.2. Cảnh báo quá tải

Nếu `currentWeeklyHours > weeklyHoursLimit`, hệ thống tạo cảnh báo để dashboard và bộ môn xử lý.

### 5.3. Snapshot theo kỳ

Cần lưu snapshot theo tuần hoặc theo học kỳ để tránh dashboard tính lại quá nặng từ lịch học chi tiết.

## 6. Quy trình nghiệp vụ

1. M10 chốt phân công lớp học phần.
2. M07 đồng bộ read-model hoặc truy vấn service tổng hợp.
3. Hệ thống tính giờ dạy hiện tại.
4. So với `weeklyHoursLimit`.
5. Sinh cảnh báo quá tải/thiếu tải.
6. Hiển thị ở hồ sơ giảng viên và dashboard khoa/bộ môn.

## 7. API gợi ý

* `GET /api/faculty/workload`
* `GET /api/faculty/[id]/workload-history`
* `GET /api/faculty/workload/alerts`
* `POST /api/faculty/workload/rebuild`

## 8. Rủi ro cần kiểm soát

* Không thống nhất quy đổi giờ chuẩn giữa các loại lớp.
* Thiếu distinction giữa kế hoạch và thực dạy.
* Dùng truy vấn runtime quá nặng từ M10.
* Cảnh báo quá tải nhưng không có drill-down chi tiết.

---