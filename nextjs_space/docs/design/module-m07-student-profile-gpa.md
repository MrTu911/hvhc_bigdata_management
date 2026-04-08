## 4) `docs/design/module-m07-student-profile-gpa.md`

# Module M07 – Hồ sơ học viên 360° và GPA tích lũy

## 1. Mục tiêu

Tài liệu này bao phủ hai nhóm chức năng phía người học:

* UC-36: Hồ sơ học viên 360°
* UC-37: Quản lý kết quả học tập và GPA tích lũy

Theo tài liệu gốc, `StudentProfile` hỗ trợ đồng thời sinh viên dân sự và học viên quân sự; có `personnelId` tùy chọn cho học viên quân sự, `studentCode`, khóa học, lớp, ngành, loại chương trình, cố vấn học tập, GPA tích lũy, tổng tín chỉ, trạng thái học tập, điểm rèn luyện, liên kết enrollment, thesis topics và party status. fileciteturn1file0L86-L104

## 2. Mô hình dữ liệu lõi

### 2.1. `StudentProfile`

Các trường cốt lõi theo tài liệu gốc:

* `personnelId?`
* `studentCode`
* `cohort`
* `className`
* `major`
* `programType`
* `advisorId`
* `cumulativeGPA`
* `totalCredits`
* `academicStatus`
* `conductAverage`
* liên kết enrollments, thesis topics, party status. fileciteturn1file0L86-L104

### 2.2. Bảng phụ trợ nên bổ sung

* `StudentGpaHistory`
* `StudentAcademicWarning`
* `StudentAdvisorAssignment`
* `StudentConductSnapshot`
* `StudentProfileAccessLog`

## 3. Hồ sơ học viên 360°

Hồ sơ học viên nên có 7 nhóm thông tin:

1. Thông tin nhận diện cơ bản.
2. Liên kết Personnel nếu là học viên quân sự.
3. Khóa, lớp, ngành, loại chương trình.
4. Cố vấn học tập và bộ môn/khoa phụ trách.
5. Kết quả học tập: GPA, tín chỉ, xu hướng học kỳ.
6. Rèn luyện, cảnh báo học tập, trạng thái học tập.
7. Khóa luận/luận văn, đảng tịch/tổ chức liên quan nếu được phân quyền xem.

## 4. GPA tích lũy

### 4.1. Vai trò

Tài liệu gốc xác định `cumulativeGPA` là chỉ số lõi tổng hợp từ M10 và là trọng tâm của UC-37. fileciteturn1file0L86-L104

### 4.2. Nguồn dữ liệu

* điểm học phần từ M10
* số tín chỉ học phần
* kết quả cải thiện/nâng điểm nếu có
* trạng thái hoàn thành học phần

### 4.3. Nguyên tắc tính

1. M10 là nguồn điểm chính thức.
2. M07 lưu read-model và lịch sử GPA theo kỳ.
3. Khi có thay đổi điểm cuối cùng đã được chốt, GPA phải được đồng bộ lại.
4. Cần phân biệt GPA hiện hành và GPA lịch sử từng học kỳ.

## 5. Trạng thái học tập

Tài liệu gốc dùng `academicStatus` với mặc định `NORMAL` và ví dụ các giá trị `NORMAL | WARNING | PROBATION`. fileciteturn1file0L93-L99

Nên chuẩn hóa enum:

* `NORMAL`
* `WARNING`
* `PROBATION`
* `SUSPENDED`
* `GRADUATED`
* `DROPPED`

## 6. Cố vấn học tập

`advisorId` liên kết với `FacultyProfile`, vì vậy M07 cần bảo đảm:

* có thể truy vấn danh sách học viên theo cố vấn,
* giảng viên chỉ xem được học viên trong phạm vi lớp dạy/cố vấn theo scope,
* dashboard có thống kê theo cố vấn.

## 7. API gợi ý

Tài liệu gốc đã xác định:

* `GET /api/students`
* `GET /api/students/[id]/profile360`
* `GET /api/students/[id]/gpa-trend`. fileciteturn1file0L118-L124

Nên bổ sung:

* `GET /api/students/[id]/academic-summary`
* `GET /api/students/[id]/conduct-trend`
* `GET /api/students/advisor/:facultyId`
* `POST /api/students/gpa/rebuild`

## 8. RBAC gợi ý

* `STUDENT.VIEW`
* `STUDENT.MANAGE`
* `STUDENT.GPA_VIEW`
* `STUDENT.GPA_MANAGE`
* `STUDENT.CONDUCT_VIEW`
* `STUDENT.DASHBOARD_VIEW`
* `STUDENT.EXPORT`

## 9. Rủi ro cần kiểm soát

* Học viên dân sự không có `personnelId` nên dễ phát sinh luồng xác thực/ghép hồ sơ riêng.
* GPA lệch nếu lấy từ dữ liệu nháp chưa chốt ở M10.
* Giảng viên xem rộng quá phạm vi cố vấn/lớp dạy.
* Trạng thái học tập không cập nhật theo ngưỡng cảnh báo đã thống nhất.

---