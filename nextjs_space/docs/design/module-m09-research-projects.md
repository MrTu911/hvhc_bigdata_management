# MODULE M09 – UC-45
# QUẢN LÝ ĐỀ TÀI NGHIÊN CỨU KHOA HỌC TOÀN TRÌNH

---

## 1. Mục tiêu use case

Xây dựng phân hệ quản lý đề tài nghiên cứu khoa học toàn trình, là hạt nhân của Module M09. Phân hệ này quản lý đề tài từ lúc đăng ký đến khi nghiệm thu, lưu trữ và liên thông, đồng thời làm trục liên kết với công bố khoa học, hồ sơ nhà khoa học, AI duplicate detection và AI trend analytics.

---

## 2. Thông tin use case

- Mã UC: UC-45
- Trạng thái: Hoàn thiện
- Độ phức tạp: Cao
- Đường dẫn chính: `/dashboard/research/projects/*`
- Tác nhân:
  - Nhà khoa học (PI)
  - Phòng KHQS
  - Hội đồng KH
  - BGĐ Học viện
- RBAC:
  - `RESEARCH.PROJECT_VIEW`
  - `RESEARCH.PROJECT_CREATE`
  - `RESEARCH.PROJECT_UPDATE`
  - `RESEARCH.PROJECT_APPROVE`
  - `RESEARCH.PROJECT_DELETE`
  - `RESEARCH.EXPORT`

---

## 3. Vai trò trong toàn module M09

UC-45 là use case lõi, liên kết:
- UC-46: Công bố khoa học và sáng kiến
- UC-47: Hồ sơ nhà khoa học
- UC-48: AI phân tích xu hướng nghiên cứu
- UC-49: AI phát hiện trùng lặp đề tài

Mọi quyết định thiết kế ở UC-45 phải tính đến khả năng mở rộng sang các UC còn lại.

---

## 4. Luồng nghiệp vụ chính

Vòng đời quản lý đề tài gồm 7 bước tuần tự:

### Bước 1 – Đề xuất
- Nhà khoa học nộp phiếu đăng ký
- Thông tin chính:
  - title
  - abstract
  - keywords
  - category
  - budget
  - team
- Hệ thống có thể trigger AI duplicate check theo UC-49

### Bước 2 – Thẩm định sơ bộ
- Phòng KHQS kiểm tra điều kiện:
  - học hàm / học vị
  - quota đề tài
  - điều kiện hồ sơ
- Hội đồng KH thẩm định đề cương và chấm điểm

### Bước 3 – Phê duyệt kinh phí
- BGĐ phê duyệt hoặc từ chối
- Hệ thống sinh mã đề tài
- Gửi thông báo cho các bên liên quan

### Bước 4 – Ký hợp đồng
- Tạo hợp đồng số
- Gắn timeline
- Tạo milestone
- Cố định kế hoạch triển khai

### Bước 5 – Thực hiện và báo cáo tiến độ
- PI cập nhật phần trăm hoàn thành
- Nộp báo cáo định kỳ
- Upload minh chứng
- Hệ thống cảnh báo trễ hạn

### Bước 6 – Nghiệm thu
- Hội đồng nhập điểm
- Ghi kết luận
- Ra quyết định:
  - Đạt
  - Không đạt
  - Yêu cầu chỉnh sửa
- Lưu biên bản nghiệm thu số

### Bước 7 – Lưu trữ
- Đưa vào kho tra cứu
- Gắn metadata
- Chuẩn bị liên thông dữ liệu với BQP
- Gắn công bố liên quan nếu có

---

## 5. Màn hình giao diện

### 5.1. `/dashboard/research/projects`
Màn hình danh sách đề tài:
- filter theo:
  - năm
  - cấp đề tài
  - trạng thái
  - đơn vị
  - PI
- table view
- kanban view theo phase
- export Excel / PDF

### 5.2. `/dashboard/research/projects/new`
Wizard 4 bước:
1. Thông tin cơ bản
2. Nhân sự
3. Kế hoạch và kinh phí
4. Review và submit

### 5.3. `/dashboard/research/projects/[id]`
Chi tiết đề tài:
- timeline / Gantt
- milestone tracker
- lịch sử thay đổi
- tài liệu đính kèm
- hội đồng / review
- công bố liên quan

### 5.4. `/dashboard/research/projects/[id]/review`
Màn hình nghiệm thu:
- form review
- bảng điểm
- quyết định
- upload biên bản

### 5.5. `/dashboard/research/dashboard`
KPI:
- tổng số đề tài
- % đúng tiến độ
- kinh phí đã giải ngân
- biểu đồ theo năm / cấp / trạng thái

---

## 6. Data Model

### 6.1. ResearchProject

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | khóa chính |
| projectCode | string | yes | mã đề tài duy nhất |
| title | string | yes | tên đề tài |
| titleEn | string | no | tên tiếng Anh |
| abstract | string | no | tóm tắt |
| keywords | string[] | yes | từ khóa |
| category | ResearchCategory | yes | cấp đề tài |
| field | ResearchField | yes | lĩnh vực |
| subField | string | no | lĩnh vực phụ |
| researchType | ResearchType | yes | loại nghiên cứu |
| status | ProjectStatus | yes | trạng thái |
| phase | ProjectPhase | yes | giai đoạn |
| startDate | DateTime | no | ngày bắt đầu |
| endDate | DateTime | no | ngày kết thúc kế hoạch |
| actualEndDate | DateTime | no | ngày kết thúc thực tế |
| budgetRequested | float | no | kinh phí đề nghị |
| budgetApproved | float | no | kinh phí được duyệt |
| budgetUsed | float | no | kinh phí đã sử dụng |
| budgetYear | int | no | năm kế hoạch |
| principalInvestigatorId | string | yes | FK User |
| unitId | string | yes | FK Unit |
| bqpProjectCode | string | no | mã đề tài từ BQP |
| duplicateCheckId | string | no | liên kết kết quả AI duplicate check |
| createdAt | DateTime | yes | ngày tạo |
| updatedAt | DateTime | yes | ngày cập nhật |

### 6.2. ResearchMember
Liên kết thành viên với đề tài.

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | khóa chính |
| projectId | string | yes | FK ResearchProject |
| userId | string | yes | FK User |
| role | MemberRole | yes | vai trò trong đề tài |
| note | string | no | ghi chú |
| createdAt | DateTime | yes | ngày tạo |

### 6.3. ResearchMilestone

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | khóa chính |
| projectId | string | yes | FK ResearchProject |
| title | string | yes | tên mốc |
| dueDate | DateTime | yes | hạn mốc |
| completedAt | DateTime | no | ngày hoàn thành |
| status | MilestoneStatus | yes | trạng thái mốc |
| note | string | no | ghi chú |
| attachmentUrl | string | no | file minh chứng |

### 6.4. ResearchReview

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | khóa chính |
| projectId | string | yes | FK ResearchProject |
| reviewType | ReviewType | yes | loại review |
| reviewDate | DateTime | yes | ngày review |
| committeeIds | string[] | yes | thành viên hội đồng |
| score | float | no | điểm |
| grade | string | no | xếp loại |
| comments | string | no | nhận xét |
| decision | ReviewDecision | yes | quyết định |
| minutesUrl | string | no | biên bản |

---

## 7. Enums bắt buộc

### 7.1. ProjectStatus
- DRAFT
- SUBMITTED
- UNDER_REVIEW
- APPROVED
- REJECTED
- IN_PROGRESS
- PAUSED
- COMPLETED
- CANCELLED

### 7.2. ProjectPhase
- PROPOSAL
- CONTRACT
- EXECUTION
- MIDTERM_REVIEW
- FINAL_REVIEW
- ACCEPTED
- ARCHIVED

### 7.3. ResearchCategory
- CAP_HOC_VIEN
- CAP_TONG_CUC
- CAP_BO_QUOC_PHONG
- CAP_NHA_NUOC
- SANG_KIEN_CO_SO

### 7.4. ResearchType
- CO_BAN
- UNG_DUNG
- TRIEN_KHAI
- SANG_KIEN_KINH_NGHIEM

### 7.5. ResearchField
- HOC_THUAT_QUAN_SU
- HAU_CAN_KY_THUAT
- KHOA_HOC_XA_HOI
- KHOA_HOC_TU_NHIEN
- CNTT
- Y_DUOC
- KHAC

### 7.6. MemberRole
- CHU_NHIEM
- THU_KY_KHOA_HOC
- THANH_VIEN_CHINH
- CONG_TAC_VIEN

### 7.7. ReviewType
- THAM_DINH_DE_CUONG
- KIEM_TRA_GIUA_KY
- NGHIEM_THU_CO_SO
- NGHIEM_THU_CAP_HV
- NGHIEM_THU_CAP_TREN

### 7.8. ReviewDecision
- PASSED
- FAILED
- REVISION_REQUIRED

### 7.9. MilestoneStatus
- PENDING
- COMPLETED
- OVERDUE
- CANCELLED

---

## 8. Business Rules

### 8.1. Quy tắc định danh
- `projectCode` là duy nhất
- Có thể sinh mã chính thức khi phê duyệt

### 8.2. Quy tắc nhân sự
- `principalInvestigatorId` là bắt buộc
- `unitId` là bắt buộc
- Thành viên không được trùng lặp vai trò không hợp lệ trong cùng một đề tài

### 8.3. Quy tắc kinh phí
- `budgetRequested`, `budgetApproved`, `budgetUsed` không được âm
- `budgetApproved` chỉ thay đổi ở bước phê duyệt hoặc nghiệp vụ tương đương
- `budgetUsed` cập nhật theo tiến độ / giải ngân

### 8.4. Quy tắc trạng thái
Không được nhảy trạng thái tùy ý. Luồng chuẩn:
- DRAFT → SUBMITTED
- SUBMITTED → UNDER_REVIEW / REJECTED
- UNDER_REVIEW → APPROVED / REJECTED
- APPROVED → IN_PROGRESS
- IN_PROGRESS → PAUSED / COMPLETED
- PAUSED → IN_PROGRESS / CANCELLED

### 8.5. Quy tắc phase
Luồng phase chuẩn:
- PROPOSAL
- CONTRACT
- EXECUTION
- MIDTERM_REVIEW
- FINAL_REVIEW
- ACCEPTED
- ARCHIVED

### 8.6. Quy tắc xóa
- Chỉ cho phép xóa khi `status = DRAFT`

### 8.7. Quy tắc review / nghiệm thu
- Phải có `ResearchReview`
- Phải có decision
- Nếu yêu cầu chỉnh sửa thì không được coi là completed
- Chỉ khi passed / accepted hợp lệ mới được chuyển sang hoàn tất hoặc lưu trữ

---

## 9. Validation Rules

- `title` bắt buộc
- `projectCode` bắt buộc với trường hợp đã sinh mã
- `keywords` là mảng chuỗi hợp lệ
- `category`, `field`, `researchType`, `status`, `phase` phải đúng enum
- `principalInvestigatorId` bắt buộc
- `unitId` bắt buộc
- `budgetYear` nếu có phải hợp lệ
- `dueDate` của milestone phải hợp lệ
- `page`, `pageSize` phải hợp lệ với API danh sách

---

## 10. Security và RBAC

- Mọi API phải có kiểm tra quyền phù hợp
- Dữ liệu phải tuân thủ scope:
  - SELF
  - UNIT
  - toàn Học viện
  - ADMIN
- Route không trả stack trace
- File đính kèm phải dùng signed URL nếu áp dụng kho file
- Approve / review / export / sync phải có audit log

---

## 11. API Contract

### 11.1. GET `/api/research/projects`
Mục đích:
- Lấy danh sách đề tài

Filter:
- keyword
- status
- category
- field
- unitId
- principalInvestigatorId
- budgetYear
- page
- pageSize

Response:
```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "pageSize": 10
  },
  "error": null
}

11.2. POST /api/research/projects

Mục đích:

Tạo đề tài mới
Có thể trigger duplicate check

Request mẫu:

{
  "title": "Tên đề tài",
  "abstract": "Tóm tắt",
  "keywords": ["AI", "Hậu cần"],
  "category": "CAP_HOC_VIEN",
  "field": "CNTT",
  "researchType": "UNG_DUNG",
  "status": "DRAFT",
  "phase": "PROPOSAL",
  "budgetRequested": 100000000,
  "budgetYear": 2026,
  "principalInvestigatorId": "user_id",
  "unitId": "unit_id"
}

Response:

{
  "success": true,
  "data": {
    "id": "generated-id"
  },
  "error": null
}
11.3. GET /api/research/projects/[id]

Mục đích:

Lấy chi tiết đề tài
Có thể include milestones, members, reviews tùy phase triển khai
11.4. PATCH /api/research/projects/[id]

Mục đích:

Cập nhật đề tài theo quyền
11.5. DELETE /api/research/projects/[id]

Mục đích:

Xóa đề tài
Chỉ cho phép khi còn ở DRAFT

Response:

{
  "success": true,
  "data": true,
  "error": null
}
11.6. POST /api/research/projects/[id]/approve

Mục đích:

Phê duyệt / từ chối đề tài
11.7. POST /api/research/projects/[id]/review

Mục đích:

Tạo hoặc ghi nhận phiên review / nghiệm thu
11.8. GET /api/research/dashboard/stats

Mục đích:

Số liệu dashboard của nghiên cứu khoa học
11.9. POST /api/research/export

Mục đích:

Xuất biểu mẫu, báo cáo, danh sách
12. Integration
12.1. Duplicate Detection
Trigger AI duplicate check ở bước đề xuất
Lưu liên kết kết quả vào duplicateCheckId
12.2. Publication Linkage
Công bố khoa học có thể gắn với ResearchProject
12.3. BQP Sync
Sau nghiệm thu / accepted
Đẩy dữ liệu phù hợp ra luồng đồng bộ
12.4. Tài chính
Có liên hệ nghiệp vụ với Phòng Tài chính ở phần kinh phí
13. Kiến trúc code cho project hiện tại
13.1. API layer
app/api/research/projects/route.ts
app/api/research/projects/[id]/route.ts
app/api/research/projects/[id]/approve/route.ts
app/api/research/projects/[id]/review/route.ts
app/api/research/dashboard/stats/route.ts
app/api/research/export/route.ts
13.2. Service layer
lib/services/research-project.service.ts
lib/services/research-review.service.ts
lib/services/research-milestone.service.ts
13.3. Repository layer
lib/repositories/research-project.repo.ts
lib/repositories/research-review.repo.ts
lib/repositories/research-milestone.repo.ts
13.4. Validators
lib/validators/research-project.schema.ts
lib/validators/research-review.schema.ts
lib/validators/research-milestone.schema.ts
13.5. UI
components/research/project/project-form-wizard.tsx
components/research/project/project-list-table.tsx
components/research/project/project-kanban.tsx
components/research/project/project-detail-tabs.tsx
components/research/project/review-form.tsx
13.6. Pages
app/dashboard/research/projects/page.tsx
app/dashboard/research/projects/new/page.tsx
app/dashboard/research/projects/[id]/page.tsx
app/dashboard/research/projects/[id]/review/page.tsx
app/dashboard/research/dashboard/page.tsx
14. Giai đoạn triển khai cho Claude
Phase 1
Prisma schema
enums
ResearchProject
ResearchMember
ResearchMilestone
ResearchReview
Phase 2
validators
repositories
Phase 3
services
workflow business rules
Phase 4
API CRUD + approve + review
Phase 5
UI list + wizard create + detail + review
Phase 6
dashboard stats
export
review, lint, test
15. Notes for Claude
Project hiện tại dùng app/, không dùng src/
Không được giản lược UC-45 thành CRUD đơn thuần
Phải giữ:
lifecycle
status/phase
milestone
review
RBAC
hướng tích hợp duplicate check và BQP sync
Khi code phải báo rõ:
file tạo mới
file sửa
giả định kỹ thuật
phần còn thiếu để sang phase tiếp theo