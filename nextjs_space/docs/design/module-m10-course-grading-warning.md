# MODULE M10 – ATTENDANCE / GRADING / WARNING
# UC-55, UC-56, UC-57

---

## 1. Mục tiêu

Xây dựng:
- quản lý điểm danh / chuyên cần,
- quản lý điểm và kết quả học phần,
- Academic Warning Engine cảnh báo học vụ.

---

## 2. Use Cases liên quan

### UC-55 – Quản lý điểm danh và chuyên cần
- điểm danh theo lớp học phần
- tổng hợp chuyên cần
- tỷ lệ vắng có phép / không phép

### UC-56 – Quản lý điểm và kết quả học phần
- điểm thành phần
- điểm thi
- điểm tổng kết
- grade letter / pass-fail
- lịch sử thay đổi điểm

### UC-57 – Academic Warning Engine
- cảnh báo học vụ
- dựa trên:
  - GPA
  - nợ môn
  - chuyên cần
  - số tín chỉ không đạt
- xếp mức cảnh báo và gợi ý xử lý

---

## 3. Data Model

### 3.1. AttendanceRecord

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| courseSectionId | string | yes | FK CourseSection |
| studentId | string | yes | FK StudentProfile |
| sessionDate | DateTime | yes | buổi học |
| attendanceStatus | string | yes | PRESENT/ABSENT/LATE/EXCUSED |
| note | string | no | ghi chú |
| recordedBy | string | no | giảng viên/cán bộ |

### 3.2. GradeRecord

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| courseSectionId | string | yes | FK CourseSection |
| studentId | string | yes | FK StudentProfile |
| attendanceScore | float | no | điểm chuyên cần |
| midtermScore | float | no | giữa kỳ |
| finalScore | float | no | cuối kỳ |
| totalScore | float | no | tổng |
| letterGrade | string | no | A/B/C... |
| passFlag | boolean | yes | đạt / không đạt |
| updatedAt | DateTime | yes | cập nhật |

### 3.3. ScoreHistory

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| gradeRecordId | string | yes | FK GradeRecord |
| changedBy | string | no | người sửa |
| oldValues | Json | no | điểm cũ |
| newValues | Json | no | điểm mới |
| changedAt | DateTime | yes | thời điểm |
| reason | string | no | lý do |

### 3.4. AcademicWarning

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| studentId | string | yes | FK StudentProfile |
| academicYear | string | yes | năm học |
| semesterCode | string | yes | học kỳ |
| warningLevel | string | yes | LOW/MEDIUM/HIGH/CRITICAL |
| warningReasonJson | Json | no | lý do |
| suggestedAction | string | no | gợi ý xử lý |
| generatedAt | DateTime | yes | thời điểm tạo |

---

## 4. Business Rules

- `ScoreHistory` là mandatory, không được bypass
- mọi sửa điểm phải ghi lịch sử
- warning engine không thay quyết định của nhà trường, chỉ hỗ trợ
- attendance phải gắn đúng lớp học phần và người học
- totalScore / passFlag có thể tính tự động từ rule

---

## 5. Validation Rules

- attendanceStatus hợp lệ
- điểm không âm và không vượt ngưỡng quy định
- academicYear/semesterCode hợp lệ
- warningLevel hợp lệ

---

## 6. API Contract

### Attendance
- `GET /api/education/attendance`
- `POST /api/education/attendance`

### Grades
- `GET /api/education/grades`
- `POST /api/education/grades`
- `PATCH /api/education/grades/[id]`
- `GET /api/education/grades/[id]/history`

### Warning
- `GET /api/education/warnings`
- `POST /api/education/warnings/recalculate`

---

## 7. UI / Pages

### Pages
- `app/dashboard/education/attendance/page.tsx`
- `app/dashboard/education/grades/page.tsx`
- `app/dashboard/education/warnings/page.tsx`

### Components
- `components/education/attendance/attendance-sheet.tsx`
- `components/education/grades/grade-grid.tsx`
- `components/education/grades/score-history-drawer.tsx`
- `components/education/warning/warning-list.tsx`
- `components/education/warning/warning-summary-cards.tsx`

---

## 8. Kiến trúc code

### Services
- `lib/services/education/attendance.service.ts`
- `lib/services/education/grade.service.ts`
- `lib/services/education/academic-warning.service.ts`

### Repositories
- `lib/repositories/education/attendance.repo.ts`
- `lib/repositories/education/grade.repo.ts`
- `lib/repositories/education/warning.repo.ts`

---

## 9. Phase triển khai cho Claude

### Phase 1
- schema AttendanceRecord, GradeRecord, ScoreHistory, AcademicWarning

### Phase 2
- attendance/grade APIs + score history

### Phase 3
- warning engine service + APIs

### Phase 4
- UI attendance/grades/warnings

---

## 10. Notes for Claude

- `ScoreHistory` là bắt buộc, không được bỏ qua
- Warning engine phải tách khỏi UI
- Scope RBAC là rủi ro lớn, cần cắm sớm kiểm tra quyền xem/sửa điểm