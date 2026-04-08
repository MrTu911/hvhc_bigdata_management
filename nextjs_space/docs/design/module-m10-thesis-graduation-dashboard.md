# MODULE M10 – THESIS / GRADUATION / REPOSITORY / DASHBOARD
# UC-59, UC-60, UC-61, UC-62

---

## 1. Mục tiêu

Xây dựng:
- quản lý khóa luận / luận văn / đồ án,
- Graduation Rule Engine,
- kho tra cứu học vụ & hồ sơ đào tạo,
- dashboard điều hành giáo dục đào tạo + AI.

---

## 2. Use Cases liên quan

### UC-59 – Quản lý khóa luận / luận văn / đồ án
- giao đề tài
- giảng viên hướng dẫn
- tiến độ
- hội đồng
- điểm bảo vệ
- tài liệu lưu trữ

### UC-60 – Graduation Rule Engine
- xét tốt nghiệp theo rule
- kiểm tra tín chỉ
- GPA
- điều kiện bắt buộc
- văn bằng / chứng chỉ đi kèm
- danh sách đủ/không đủ

### UC-61 – Kho tra cứu học vụ & hồ sơ đào tạo
- tra cứu kết quả học tập
- tra cứu hồ sơ đào tạo
- full-text / filter cơ bản
- lưu tài liệu học vụ

### UC-62 – Dashboard điều hành giáo dục đào tạo + AI
- KPI đào tạo
- cảnh báo
- xu hướng
- phân bố tốt nghiệp / học vụ
- AI summary hoặc dự báo nếu có

---

## 3. Data Model

### 3.1. ThesisProject

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| studentId | string | yes | FK StudentProfile |
| thesisType | string | yes | khóa luận/luận văn/đồ án |
| title | string | yes | đề tài |
| advisorId | string | no | GV hướng dẫn |
| reviewerId | string | no | phản biện |
| defenseDate | DateTime | no | ngày bảo vệ |
| defenseScore | float | no | điểm |
| status | string | yes | DRAFT/IN_PROGRESS/DEFENDED/ARCHIVED |
| repositoryFileUrl | string | no | file lưu trữ |

### 3.2. GraduationAudit

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| studentId | string | yes | FK StudentProfile |
| auditDate | DateTime | yes | ngày xét |
| totalCreditsEarned | int | no | tín chỉ đạt |
| gpa | float | no | GPA |
| conductEligible | boolean | yes | đủ điều kiện rèn luyện |
| thesisEligible | boolean | yes | đủ điều kiện khóa luận |
| languageEligible | boolean | yes | đủ điều kiện ngoại ngữ |
| graduationEligible | boolean | yes | đủ điều kiện tốt nghiệp |
| failureReasonsJson | Json | no | lý do chưa đạt |
| decisionNo | string | no | quyết định nếu có |

### 3.3. DiplomaRecord

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| studentId | string | yes | FK StudentProfile |
| diplomaNo | string | no | số văn bằng |
| graduationDate | DateTime | no | ngày tốt nghiệp |
| diplomaType | string | yes | loại văn bằng |
| classification | string | no | xếp loại |
| issuedAt | DateTime | no | ngày cấp |

### 3.4. AcademicRepositoryItem

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| studentId | string | no | FK nếu gắn người học |
| itemType | string | yes | transcript/thesis/dossier/... |
| title | string | yes | tiêu đề |
| fileUrl | string | no | file |
| metadataJson | Json | no | metadata |
| indexedAt | DateTime | no | thời gian index |

---

## 4. Business Rules

- graduation engine phải kiểm tra rule nhất quán, không cấp bằng sai người
- `GraduationAudit` phải lưu failureReasons
- thesis phải gắn giảng viên hướng dẫn nếu loại bắt buộc
- repository chỉ lưu/bộc lộ theo scope quyền phù hợp
- UAT graduation engine với bộ dữ liệu mẫu là bắt buộc trước go-live

---

## 5. Validation Rules

- defenseScore không âm
- totalCreditsEarned không âm
- gpa hợp lệ
- graduationEligible phải phản ánh logic rule engine
- diplomaNo unique nếu đã cấp
- status thesis hợp lệ

---

## 6. API Contract

### Thesis
- `GET /api/education/thesis`
- `POST /api/education/thesis`
- `PATCH /api/education/thesis/[id]`

### Graduation
- `POST /api/education/graduation/audit`
- `GET /api/education/graduation/audit/[studentId]`
- `POST /api/education/graduation/export`

### Repository
- `GET /api/education/repository/search`
- `GET /api/education/repository/[id]`

### Dashboard
- `GET /api/education/dashboard/stats`
- `GET /api/education/dashboard/trends`

---

## 7. UI / Pages

### Pages
- `app/dashboard/education/thesis/page.tsx`
- `app/dashboard/education/graduation/page.tsx`
- `app/dashboard/education/repository/page.tsx`
- `app/dashboard/education/dashboard/page.tsx`

### Components
- `components/education/thesis/thesis-table.tsx`
- `components/education/thesis/thesis-form.tsx`
- `components/education/graduation/graduation-audit-panel.tsx`
- `components/education/graduation/graduation-result-table.tsx`
- `components/education/repository/academic-repository-search.tsx`
- `components/education/dashboard/education-kpi-cards.tsx`
- `components/education/dashboard/education-trend-chart.tsx`

---

## 8. Kiến trúc code

### Services
- `lib/services/education/thesis.service.ts`
- `lib/services/education/graduation-engine.service.ts`
- `lib/services/education/academic-repository.service.ts`
- `lib/services/education/education-dashboard.service.ts`

### Repositories
- `lib/repositories/education/thesis.repo.ts`
- `lib/repositories/education/graduation.repo.ts`
- `lib/repositories/education/repository.repo.ts`
- `lib/repositories/education/dashboard.repo.ts`

---

## 9. Phase triển khai cho Claude

### Phase 1
- schema ThesisProject, GraduationAudit, DiplomaRecord, AcademicRepositoryItem

### Phase 2
- thesis APIs + graduation audit APIs

### Phase 3
- repository search + dashboard APIs

### Phase 4
- UI thesis / graduation / repository / dashboard

---

## 10. Notes for Claude

- Graduation engine là phần rủi ro cao nhất của M10
- Không để logic xét tốt nghiệp nằm trong UI
- Kho tra cứu học vụ phải tách khỏi CRUD người học
- Báo cáo và văn bằng về lâu dài nên đi qua M18