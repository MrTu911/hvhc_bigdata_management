
---

# 4) `docs/design/module-m18-export-engine.md`

```md
# MODULE M18 – EXPORT ENGINE
# UC-T05, UC-T06, UC-T07, UC-T09

---

## 1. Mục tiêu

Xây dựng engine xuất dữ liệu:
- export đơn lẻ
- export hàng loạt
- quản lý export jobs
- download / retry
- internal render API cho AI/chatbot/workflow

---

## 2. Use Cases liên quan

### UC-T05 – Xuất đơn lẻ
- xuất 1 hồ sơ
- ưu tiên sync nếu nhanh
- trả file trực tiếp hoặc signed URL

### UC-T06 – Xuất hàng loạt
- tối đa 500 entity / batch
- Bull queue + Redis
- progress real-time

### UC-T07 – Lịch sử / quản lý Export Jobs
- history
- status
- download
- retry failed only

### UC-T09 – Internal Render API
- service-to-service render
- không qua UI
- dành cho AI/chatbot/workflow

---

## 3. Data Model

### 3.1. TemplateExportJob

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| templateId | string | yes | FK template |
| jobType | string | yes | SINGLE / BATCH / INTERNAL |
| outputFormat | string | yes | PDF/DOCX/XLSX/HTML |
| entityIds | Json | no | danh sách entity |
| filterJson | Json | no | filter batch |
| status | string | yes | QUEUED / PROCESSING / DONE / FAILED / PARTIAL |
| progressPct | int | yes | phần trăm tiến độ |
| successCount | int | yes | số thành công |
| failCount | int | yes | số lỗi |
| fileKey | string | no | file output trên MinIO |
| zipName | string | no | tên zip |
| renderMs | int | no | thời gian render |
| requestedBy | string | no | user id / caller |
| createdAt | DateTime | yes | tạo |
| finishedAt | DateTime | no | xong |

---

## 4. Business Rules

- export đơn lẻ: nếu render nhanh thì sync, nếu chậm chuyển async
- batch max 500 entity
- download result có TTL
- retry chỉ với entity lỗi nếu `retryFailedOnly = true`
- internal render phải xác thực bằng service token
- export phải kiểm tra template active + RBAC scope

---

## 5. API Contract

### Export
- `POST /api/templates/export`
- `POST /api/templates/export/batch`

### Jobs
- `GET /api/templates/export/jobs`
- `GET /api/templates/export/jobs/[jobId]`
- `GET /api/templates/export/jobs/[jobId]/download`
- `POST /api/templates/export/jobs/[jobId]/retry`

### Internal
- `POST /api/internal/templates/render`
- `POST /api/internal/templates/datamap/resolve`

---

## 6. UI / Pages

### Pages
- `app/dashboard/templates/batch/page.tsx`
- `app/dashboard/templates/history/page.tsx`

### Components
- `components/templates/export/export-quick-button.tsx`
- `components/templates/export/batch-export-center.tsx`
- `components/templates/export/export-job-progress.tsx`
- `components/templates/export/export-history-table.tsx`
- `components/templates/export/export-progress-toast.tsx`

---

## 7. Kiến trúc code

### API
- `app/api/templates/export/route.ts`
- `app/api/templates/export/batch/route.ts`
- `app/api/templates/export/jobs/[jobId]/route.ts`
- `app/api/templates/export/jobs/[jobId]/download/route.ts`
- `app/api/templates/export/jobs/[jobId]/retry/route.ts`
- `app/api/internal/templates/render/route.ts`
- `app/api/internal/templates/datamap/resolve/route.ts`

### Services
- `lib/services/template/template-export.service.ts`
- `lib/services/template/template-export-job.service.ts`
- `lib/services/template/template-internal-render.service.ts`

### Repositories
- `lib/repositories/template/template-export-job.repo.ts`

### Integrations
- `lib/integrations/queue/template-export.queue.ts`
- `lib/integrations/minio/template-storage.ts`

---

## 8. Phase triển khai cho Claude

### Phase 1
- export job schema + repository

### Phase 2
- self export API

### Phase 3
- batch export + queue

### Phase 4
- jobs history + download + retry

### Phase 5
- internal render APIs

---

## 9. Notes for Claude

- Export engine là lõi vận hành của M18
- Không được gắn chặt với một module nghiệp vụ cụ thể
- Internal API phải giữ ranh giới rõ giữa user-facing và service-facing