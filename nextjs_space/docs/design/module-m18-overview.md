# MODULE M18 – TEMPLATE MANAGEMENT & EXPORT ENGINE

---

## 1. Mục tiêu module

Xây dựng module quản lý template và xuất dữ liệu dùng chung cho toàn hệ thống HVHC BigData nhằm:
- tập trung toàn bộ logic xuất file vào một nơi,
- chuẩn hóa quy trình render mẫu biểu,
- quản lý version template,
- tích hợp RBAC + scope dữ liệu,
- hỗ trợ xuất đơn lẻ, xuất hàng loạt, xuất định kỳ,
- cung cấp internal API cho AI, chatbot và workflow engine.

---

## 2. Thông tin tổng quan

- Mã module: M18
- Tên module: Quản lý Template & Xuất Dữ liệu
- Vai trò: module hạ tầng dùng chung
- Phạm vi: 12 use case
- API endpoints: 28
- Nhóm template: 6
- Mẫu biểu ban đầu: khoảng 22
- Output formats:
  - DOCX
  - PDF
  - XLSX
  - HTML
- Stack chính:
  - Next.js 14 API Routes
  - Prisma ORM
  - PostgreSQL
  - Redis / Bull queue
  - MinIO
  - docxtemplater
  - exceljs
  - puppeteer

---

## 3. Vai trò chiến lược của M18

M18 là “single source of truth” cho mọi chức năng:
- export biểu mẫu
- render báo cáo
- batch export
- scheduled export
- internal render cho AI/chatbot/workflow

Thay vì mỗi module tự viết logic xuất file, toàn bộ logic export tập trung về M18. Khi biểu mẫu BQP thay đổi, chỉ cần cập nhật tại M18.

---

## 4. Các mục tiêu thiết kế chính

### 4.1. Single Source of Truth
Toàn bộ logic xuất file tập trung trong một module.

### 4.2. Template Versioning
Mỗi template có nhiều phiên bản; file đã xuất phải gắn với đúng version template tại thời điểm render.

### 4.3. RBAC tích hợp
Mọi lệnh export phải kiểm tra:
- function code
- scope dữ liệu:
  - SELF
  - UNIT
  - DEPT
  - ACADEMY

### 4.4. Multi-source Data Resolver
Template có thể lấy dữ liệu từ nhiều module nguồn M02–M17 qua internal API hoặc repository/service layer.

### 4.5. Async Batch Export
- export đơn lẻ: ưu tiên sync, mục tiêu nhanh
- export hàng loạt: queue Bull + Redis + progress tracking

### 4.6. AI-ready / Internal-ready
M10 (AI Report), M13 (Workflow), M15 (Chatbot) có thể gọi M18 qua internal API không qua UI.

---

## 5. 12 Use Cases của M18

- UC-T01: Quản lý danh mục Template
- UC-T02: Quản lý phiên bản Template
- UC-T03: Xây dựng Data Map (Field Mapping)
- UC-T04: Preview Template với dữ liệu thực
- UC-T05: Xuất đơn lẻ (Self-export)
- UC-T06: Xuất hàng loạt (Batch export)
- UC-T07: Lịch sử / quản lý Export Jobs
- UC-T08: Template Library / chọn mẫu theo nghiệp vụ
- UC-T09: Internal Render API cho AI / Chatbot / Workflow
- UC-T10: Analytics / thống kê sử dụng template
- UC-T11: Scheduled Export (xuất định kỳ)
- UC-T12: Nhập template từ file Word / Excel hiện có

---

## 6. Nhóm chức năng chính

### 6.1. Template Core
- template CRUD
- upload file mẫu
- metadata
- active / inactive
- versioning
- rollback

### 6.2. Data Mapping & Preview
- scan placeholder
- ánh xạ placeholder ↔ field dữ liệu
- preview với dữ liệu thực
- field browser tất cả module

### 6.3. Export Engine
- self export
- batch export
- export jobs history
- download file
- retry failed jobs

### 6.4. Internal Integration
- internal render API
- internal datamap resolve API
- dùng cho chatbot/AI/workflow

### 6.5. Scheduled Export
- cron-based export
- recipient emails
- job history
- auto-run batch + notify

### 6.6. Analytics
- top templates
- total exports
- avg render ms
- error rate
- by day / by template / by user / by unit

---

## 7. RBAC

### 7.1. Function codes (10 codes)

| Code | ActionType | Mô tả | Scope tối thiểu |
| --- | --- | --- | --- |
| `VIEW_TEMPLATES` | VIEW | Xem danh mục / thư viện template | UNIT |
| `MANAGE_TEMPLATES` | UPDATE | Quản lý template: CRUD, upload, versioning, rollback | ACADEMY |
| `PREVIEW_TEMPLATES` | VIEW | Preview template với dữ liệu thực | UNIT |
| `EXPORT_DATA` | EXPORT | Xuất file đơn lẻ | SELF |
| `EXPORT_BATCH` | EXPORT | Xuất hàng loạt | UNIT |
| `VIEW_EXPORT_JOBS` | VIEW | Xem lịch sử export jobs | SELF |
| `RETRY_EXPORT_JOB` | UPDATE | Retry export job thất bại | UNIT |
| `MANAGE_EXPORT_SCHEDULES` | UPDATE | Quản lý lịch xuất định kỳ | DEPARTMENT |
| `VIEW_TEMPLATE_ANALYTICS` | VIEW | Xem thống kê sử dụng template | UNIT |
| `IMPORT_TEMPLATES` | IMPORT | Import template từ Word/Excel hiện có | ACADEMY |

### 7.2. Phân nhóm theo vai trò

| Vai trò | Codes tiêu biểu |
| --- | --- |
| SYSTEM_ADMIN / GIAM_DOC | Toàn bộ 10 codes, scope ACADEMY |
| TRUONG_PHONG | MANAGE, PREVIEW, EXPORT_BATCH, VIEW_JOBS, MANAGE_SCHEDULES, VIEW_ANALYTICS |
| TRUONG_KHOA / CHI_HUY_BO_MON | VIEW, PREVIEW, EXPORT_DATA, EXPORT_BATCH, VIEW_JOBS |
| GIANG_VIEN / NGHIEN_CUU_VIEN | VIEW, EXPORT_DATA (SELF), VIEW_JOBS (SELF) |

### 7.3. Internal API
Các API internal (M10, M13, M15 gọi M18) dùng service token/JWT riêng, không qua RBAC position.

---

## 8. Kiến trúc dữ liệu tổng thể

### Entity chính
- `ReportTemplate`
- `ReportTemplateVersion`
- `TemplateExportJob`
- `TemplateSchedule`
- `TemplateAnalyticsDaily`
- `TemplateImportAnalysis`

### Quan hệ tổng quát
- Một template có nhiều versions
- Một template có nhiều export jobs
- Một template có nhiều schedules
- Một template có thể có analytics tổng hợp theo ngày
- Import analysis là phiên phân tích tạm thời trước khi confirm

---

## 9. API tổng thể

### Template CRUD / Versioning
- `GET /api/templates`
- `POST /api/templates`
- `GET /api/templates/[id]`
- `PUT /api/templates/[id]`
- `DELETE /api/templates/[id]`
- `POST /api/templates/[id]/upload`
- `GET /api/templates/[id]/versions`
- `POST /api/templates/[id]/rollback`

### Data Map / Preview
- `GET /api/templates/[id]/datamap`
- `PUT /api/templates/[id]/datamap`
- `POST /api/templates/[id]/preview`
- `GET /api/templates/fields`

### Export
- `POST /api/templates/export`
- `POST /api/templates/export/batch`
- `GET /api/templates/export/jobs`
- `GET /api/templates/export/jobs/[jobId]`
- `GET /api/templates/export/jobs/[jobId]/download`
- `POST /api/templates/export/jobs/[jobId]/retry`

### Internal
- `POST /api/internal/templates/render`
- `POST /api/internal/templates/datamap/resolve`

### Scheduled
- `GET /api/templates/schedules`
- `POST /api/templates/schedules`
- `DELETE /api/templates/schedules/[id]`

### Analytics
- `GET /api/templates/analytics`
- `GET /api/templates/analytics/[templateId]`

### Import
- `POST /api/templates/import/analyze`
- `POST /api/templates/import/confirm`

---

## 10. Frontend tổng thể

Các màn hình chính:
- `/dashboard/templates`
- `/dashboard/templates/new`
- `/dashboard/templates/[id]/edit`
- `/dashboard/templates/[id]/datamap`
- `/dashboard/templates/batch`
- `/dashboard/templates/history`
- `/dashboard/templates/analytics`
- `/dashboard/templates/schedules`
- `/dashboard/templates/import`

---

## 11. Kiến trúc code cho project hiện tại

### API
- `app/api/templates/**`
- `app/api/internal/templates/**`

### UI pages
- `app/dashboard/templates/**`

### Components
- `components/templates/**`

### Services
- `lib/services/template/**`

### Repositories
- `lib/repositories/template/**`

### Integrations
- `lib/integrations/minio/**`
- `lib/integrations/queue/**`
- `lib/integrations/render/**`

### Prisma
- `prisma/schema.prisma`

---

## 12. Phase triển khai M18

### Phase 1
- Template core schema + CRUD + upload + versioning

### Phase 2
- Data map + fields browser + preview

### Phase 3
- Export engine đơn lẻ + batch + jobs history

### Phase 4
- Scheduled export

### Phase 5
- Internal API + analytics

### Phase 6
- Import template từ file cũ + migration tooling

---

## 13. Notes for Claude

- M18 là module hạ tầng lớn, không phải CRUD đơn giản
- Phải giữ tính generic, reusable và internal-ready
- Không nhúng logic export rời rạc vào từng module khác
- Mọi export về lâu dài phải quy về M18