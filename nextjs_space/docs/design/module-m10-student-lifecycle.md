# MODULE M10 – STUDENT LIFECYCLE
# UC-51, UC-58

---

## 1. Mục tiêu

Xây dựng:
- hồ sơ người học toàn trình,
- quản lý trạng thái học tập / học vụ / rèn luyện,
- khen thưởng / kỷ luật người học,
- profile 360° cho người học trong suốt khóa học.

---

## 2. Use Cases liên quan

### UC-51 – Quản lý hồ sơ người học toàn trình
- hồ sơ cá nhân
- thông tin khóa / lớp / ngành / hệ đào tạo
- trạng thái học vụ
- lịch sử kết quả
- liên kết học vụ / rèn luyện / khóa luận / tốt nghiệp

### UC-58 – Quản lý rèn luyện, khen thưởng, kỷ luật người học
- điểm rèn luyện
- khen thưởng học viên
- kỷ luật học viên
- lịch sử nhiều học kỳ / năm học

---

## 3. Data Model

### 3.1. StudentProfile

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| studentCode | string | yes | mã học viên/sinh viên |
| fullName | string | yes | họ tên |
| dateOfBirth | DateTime | no | ngày sinh |
| gender | string | yes | giới tính |
| category | string | yes | hệ / loại người học |
| cohortCode | string | yes | khóa |
| classCode | string | no | lớp hành chính |
| majorCode | string | yes | chuyên ngành |
| studyMode | string | yes | hình thức đào tạo |
| currentStatus | StudentStatus | yes | trạng thái hiện tại |
| admissionDate | DateTime | no | ngày nhập học |
| expectedGraduationDate | DateTime | no | tốt nghiệp dự kiến |
| currentProgramVersionId | string | no | FK ProgramVersion |
| advisorId | string | no | cố vấn học tập |
| unitId | string | no | đơn vị quản lý |
| createdAt | DateTime | yes | tạo |
| updatedAt | DateTime | yes | cập nhật |

### 3.2. StudentConductRecord

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| studentId | string | yes | FK StudentProfile |
| academicYear | string | yes | năm học |
| semesterCode | string | yes | học kỳ |
| conductScore | float | yes | điểm rèn luyện |
| conductGrade | string | no | xếp loại |
| rewardSummary | string | no | thưởng |
| disciplineSummary | string | no | kỷ luật |
| approvedBy | string | no | người duyệt |
| approvedAt | DateTime | no | ngày duyệt |

### 3.3. StudentStatus enum
- ACTIVE
- TEMP_SUSPENDED
- STUDY_DELAY
- REPEATING
- DROPPED_OUT
- GRADUATED
- RESERVED

---

## 4. Business Rules

- `studentCode` unique
- mỗi người học có một `currentProgramVersionId` tại một thời điểm
- điểm rèn luyện theo học kỳ / năm học
- thưởng/kỷ luật người học phải hiển thị trong hồ sơ toàn trình
- mọi thay đổi trạng thái học tập phải có lịch sử hoặc audit

---

## 5. Validation Rules

- `studentCode`, `fullName`, `majorCode`, `studyMode`, `currentStatus` bắt buộc
- `conductScore` không âm
- `academicYear`, `semesterCode` hợp lệ
- `expectedGraduationDate` hợp lệ

---

## 6. API Contract

### Student
- `GET /api/education/students`
- `POST /api/education/students`
- `GET /api/education/students/[id]`
- `PATCH /api/education/students/[id]`

### Conduct / reward / discipline
- `GET /api/education/students/[id]/conduct`
- `POST /api/education/students/[id]/conduct`
- `GET /api/education/students/[id]/profile360`

---

## 7. UI / Pages

### Pages
- `app/dashboard/education/students/page.tsx`
- `app/dashboard/education/students/[id]/page.tsx`

### Components
- `components/education/student/student-table.tsx`
- `components/education/student/student-profile-tabs.tsx`
- `components/education/student/student-summary-card.tsx`
- `components/education/student/conduct-record-table.tsx`

---

## 8. Kiến trúc code

### Services
- `lib/services/education/student-profile.service.ts`
- `lib/services/education/student-conduct.service.ts`

### Repositories
- `lib/repositories/education/student-profile.repo.ts`
- `lib/repositories/education/student-conduct.repo.ts`

---

## 9. Phase triển khai cho Claude

### Phase 1
- schema StudentProfile + StudentConductRecord

### Phase 2
- student CRUD + conduct APIs

### Phase 3
- student profile360 UI

---

## 10. Notes for Claude

- Student profile là vòng đời dài, không chỉ là danh bạ học viên
- Khen thưởng/kỷ luật người học phải nối vào profile
- Các lookup major/studyMode/academicYear nên lấy từ M19