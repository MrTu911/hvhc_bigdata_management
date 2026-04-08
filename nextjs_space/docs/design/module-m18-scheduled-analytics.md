# MODULE M18 – SCHEDULED EXPORT & ANALYTICS
# UC-T10, UC-T11

---

## 1. Mục tiêu

Xây dựng:
- scheduled export theo cron
- analytics sử dụng template
- dashboard giám sát hiệu quả render và lỗi

---

## 2. Use Cases liên quan

### UC-T10 – Thống kê sử dụng Template
- top template
- export theo ngày
- thời gian render trung bình
- tỷ lệ lỗi
- drill-down theo template/user/unit

### UC-T11 – Scheduled Export
- tạo lịch export định kỳ
- chọn template + filter entity + cron
- nhập email người nhận
- chạy batch tự động
- gửi email/notification

---

## 3. Data Model

### 3.1. TemplateSchedule

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| templateId | string | yes | FK template |
| filterJson | Json | yes | filter entity |
| cronExpression | string | yes | cron |
| outputFormat | string | yes | file format |
| recipientEmails | string[] | yes | danh sách nhận |
| zipName | string | no | tên zip |
| isActive | boolean | yes | active flag |
| lastRunStatus | string | no | trạng thái chạy gần nhất |
| nextRunAt | DateTime | no | lần chạy tiếp theo |
| createdBy | string | no | user id |
| createdAt | DateTime | yes | tạo |

### 3.2. TemplateAnalyticsDaily

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| templateId | string | yes | FK template |
| statDate | DateTime | yes | ngày thống kê |
| exportCount | int | yes | số export |
| avgRenderMs | float | no | thời gian trung bình |
| errorCount | int | yes | số lỗi |
| topUserJson | Json | no | top users |
| unitStatsJson | Json | no | theo đơn vị |

---

## 4. Business Rules

- cron expression phải hợp lệ
- max 5 schedules / user
- nếu filter không trả entity nào, gửi thông báo rỗng
- nếu email fail, retry tối đa theo rule
- analytics là dữ liệu tổng hợp, không thay export jobs history
- analytics có thể cache TTL ngắn

---

## 5. API Contract

### Scheduled
- `GET /api/templates/schedules`
- `POST /api/templates/schedules`
- `DELETE /api/templates/schedules/[id]`

### Analytics
- `GET /api/templates/analytics`
- `GET /api/templates/analytics/[templateId]`

---

## 6. UI / Pages

### Pages
- `app/dashboard/templates/schedules/page.tsx`
- `app/dashboard/templates/analytics/page.tsx`

### Components
- `components/templates/schedule/schedule-manager.tsx`
- `components/templates/schedule/create-schedule-modal.tsx`
- `components/templates/schedule/cron-builder.tsx`
- `components/templates/analytics/template-analytics-dashboard.tsx`
- `components/templates/analytics/top-templates-chart.tsx`
- `components/templates/analytics/render-time-histogram.tsx`

---

## 7. Kiến trúc code

### API
- `app/api/templates/schedules/route.ts`
- `app/api/templates/schedules/[id]/route.ts`
- `app/api/templates/analytics/route.ts`
- `app/api/templates/analytics/[templateId]/route.ts`

### Services
- `lib/services/template/template-schedule.service.ts`
- `lib/services/template/template-analytics.service.ts`

### Repositories
- `lib/repositories/template/template-schedule.repo.ts`
- `lib/repositories/template/template-analytics.repo.ts`

---

## 8. Phase triển khai cho Claude

### Phase 1
- schedule schema + CRUD API

### Phase 2
- analytics aggregate API

### Phase 3
- schedule UI + cron builder

### Phase 4
- analytics dashboard UI

---

## 9. Notes for Claude

- Scheduled export không chỉ là “cron job”
- Phải gắn với export engine, email notification, retry và job tracking
- Analytics phải drill-down được theo template và thời gian