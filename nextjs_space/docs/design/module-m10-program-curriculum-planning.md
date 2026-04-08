# MODULE M10 – PROGRAM / CURRICULUM / PLANNING
# UC-52, UC-53, UC-54

---

## 1. Mục tiêu

Xây dựng:
- quản lý chương trình đào tạo có version,
- khung học phần,
- kế hoạch đào tạo năm học / học kỳ,
- lớp học phần, lịch học, phân công giảng viên.

---

## 2. Use Cases liên quan

### UC-52 – Quản lý CTĐT & khung học phần
- chương trình đào tạo
- version chương trình
- khung học phần
- điều chỉnh theo từng khóa

### UC-53 – Quản lý kế hoạch đào tạo học kỳ / năm học
- mở học kỳ
- kế hoạch học phần theo khóa
- phân bổ tiến độ giảng dạy

### UC-54 – Quản lý lớp học phần, lịch học, phân công giảng viên
- tạo lớp học phần
- xếp lịch
- gán giảng viên
- conflict detection

---

## 3. Data Model

### 3.1. Program

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| code | string | yes | mã CTĐT |
| name | string | yes | tên CTĐT |
| level | string | yes | trình độ đào tạo |
| majorCode | string | yes | chuyên ngành |
| totalCredits | int | no | tổng tín chỉ |
| isActive | boolean | yes | active |
| createdAt | DateTime | yes | tạo |

### 3.2. ProgramVersion

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| programId | string | yes | FK Program |
| versionCode | string | yes | version |
| effectiveFromCohort | string | yes | áp dụng từ khóa |
| totalCredits | int | no | tổng tín chỉ |
| requiredCoursesJson | Json | no | khung học phần |
| status | string | yes | DRAFT/PUBLISHED/ARCHIVED |
| createdAt | DateTime | yes | tạo |

### 3.3. Course

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| code | string | yes | mã học phần |
| name | string | yes | tên học phần |
| credits | int | yes | tín chỉ |
| departmentCode | string | no | bộ môn phụ trách |
| prerequisitesJson | Json | no | học phần tiên quyết |
| isActive | boolean | yes | active |

### 3.4. SemesterPlan

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| academicYear | string | yes | năm học |
| semesterCode | string | yes | học kỳ |
| cohortCode | string | no | khóa |
| programVersionId | string | yes | FK ProgramVersion |
| plannedCoursesJson | Json | no | danh sách học phần |
| status | string | yes | DRAFT/PUBLISHED/CLOSED |

### 3.5. CourseSection

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| semesterPlanId | string | yes | FK SemesterPlan |
| courseId | string | yes | FK Course |
| sectionCode | string | yes | mã lớp học phần |
| lecturerId | string | no | FK cán bộ/giảng viên |
| classTimeJson | Json | no | lịch học |
| roomCode | string | no | phòng |
| maxStudents | int | no | sĩ số tối đa |
| status | string | yes | OPEN/CLOSED/CANCELLED |

---

## 4. Business Rules

- `ProgramVersion` là bắt buộc trước go-live
- không áp CTĐT mới bằng cách sửa đè version cũ
- conflict engine phải kiểm tra trùng:
  - giảng viên
  - phòng
  - thời gian
- semester plan phải gắn program version
- course section phải gắn semester plan

---

## 5. Validation Rules

- `Program.code`, `Course.code`, `CourseSection.sectionCode` unique theo rule phù hợp
- totalCredits, credits, maxStudents không âm
- academicYear/semesterCode hợp lệ
- `effectiveFromCohort` bắt buộc
- prerequisitesJson hợp lệ

---

## 6. API Contract

### Program
- `GET /api/education/programs`
- `POST /api/education/programs`
- `GET /api/education/programs/[id]`
- `POST /api/education/programs/[id]/versions`

### Planning
- `GET /api/education/semester-plans`
- `POST /api/education/semester-plans`

### Course section
- `GET /api/education/course-sections`
- `POST /api/education/course-sections`
- `POST /api/education/course-sections/conflict-check`

---

## 7. UI / Pages

### Pages
- `app/dashboard/education/programs/page.tsx`
- `app/dashboard/education/planning/page.tsx`
- `app/dashboard/education/course-sections/page.tsx`

### Components
- `components/education/program/program-table.tsx`
- `components/education/program/program-version-list.tsx`
- `components/education/planning/semester-plan-board.tsx`
- `components/education/section/section-scheduler.tsx`
- `components/education/section/conflict-panel.tsx`

---

## 8. Kiến trúc code

### Services
- `lib/services/education/program.service.ts`
- `lib/services/education/program-version.service.ts`
- `lib/services/education/semester-plan.service.ts`
- `lib/services/education/course-section.service.ts`

### Repositories
- `lib/repositories/education/program.repo.ts`
- `lib/repositories/education/planning.repo.ts`
- `lib/repositories/education/course-section.repo.ts`

---

## 9. Phase triển khai cho Claude

### Phase 1
- schema Program, ProgramVersion, Course, SemesterPlan, CourseSection

### Phase 2
- program/version APIs + planning APIs

### Phase 3
- conflict-check service + scheduling UI

---

## 10. Notes for Claude

- `ProgramVersion` là bắt buộc, không được bỏ qua
- Không gộp master data như academic year/major vào M10 nếu M19 đã có
- conflict engine nên tách service riêng