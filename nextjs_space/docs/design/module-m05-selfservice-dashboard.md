# MODULE M05 – SELF-SERVICE & DASHBOARD
# UC-83, UC-84

---

## 1. Mục tiêu

Xây dựng:
- cổng tự phục vụ cho cán bộ tra cứu và nộp đề xuất chế độ 24/7,
- dashboard điều hành và báo cáo tự động cho BGĐ, Phòng Chính sách, Phòng Tài chính.

---

## 2. Use Cases liên quan

### UC-83 – Self-service Portal
Tính năng chính:
- xem hồ sơ chính sách cá nhân
- tra cứu lịch sử BHXH
- nộp đơn đề xuất chế độ
- xem điểm thi đua tích lũy
- tra cứu chính sách hiện hành
- tải biểu mẫu
- nhận thông báo quyết định

### UC-84 – Dashboard điều hành & Báo cáo tự động
Đối tượng:
- BGĐ Học viện
- Phòng Chính sách
- Phòng Tài chính

Báo cáo/KPI:
- tổng khen thưởng năm
- tỷ lệ đạt chuẩn chiến sĩ thi đua
- tổng chi phụ cấp/trợ cấp
- hồ sơ đang chờ xử lý
- thẻ BHYT sắp hết hạn
- kỷ luật sắp xóa án
- hưu trí 24 tháng tới
- D02-TS BHXH
- báo cáo người có công
- xu hướng chi phụ cấp 12 tháng. :contentReference[oaicite:4]{index=4}

---

## 3. Data Model

### 3.1. PolicySelfServiceRequest

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| personnelId | string | yes | FK Personnel |
| requestType | string | yes | loại đề nghị |
| requestPayload | Json | yes | dữ liệu form |
| evidenceUrl | string | no | minh chứng |
| workflowStatus | string | yes | trạng thái |
| submittedAt | DateTime | yes | ngày nộp |
| resolvedAt | DateTime | no | ngày xử lý |
| note | string | no | ghi chú |

### 3.2. PolicyDashboardAggregate
Có thể là bảng aggregate hoặc runtime query/materialized view ở phase đầu:
- rewardCount
- disciplinePendingClearCount
- expiringHealthCardCount
- retirement24mCount
- totalAllowanceSpend
- totalSubsidySpend
- pendingRequestCount
- emulationScoreSummary

---

## 4. Business Rules

### Self-service
- chỉ xem dữ liệu của chính mình theo scope SELF
- được nộp đơn đề xuất chế độ
- theo dõi trạng thái workflow
- được tải biểu mẫu và tra cứu văn bản chính sách

### Dashboard
- KPI theo vai trò người xem
- BGĐ xem toàn Học viện
- Phòng Chính sách xem hồ sơ xử lý/chính sách
- Phòng Tài chính xem chi phí / xu hướng chi

### Notification
- push notification khi có quyết định khen thưởng / kỷ luật / chế độ
- nhắc sắp hết hạn BHYT
- nhắc hưu trí 24 tháng tới

---

## 5. Validation Rules

- requestType bắt buộc
- requestPayload phải là JSON hợp lệ
- personnelId phải khớp người dùng self-service nếu scope SELF
- workflowStatus hợp lệ

---

## 6. API Contract

### Self-service
- `GET /api/policy/self/profile`
- `GET /api/policy/self/insurance-history`
- `POST /api/policy/self/requests`
- `GET /api/policy/self/requests`
- `GET /api/policy/self/emulation-score`
- `GET /api/policy/self/policies/search`
- `GET /api/policy/self/forms`

### Dashboard
- `GET /api/policy/dashboard/stats`
- `GET /api/policy/dashboard/trends`
- `POST /api/policy/reports/export`

---

## 7. UI / Pages

### Pages
- `app/dashboard/policy/self/page.tsx`
- `app/dashboard/policy/dashboard/page.tsx`

### Components
- `components/policy/self/self-policy-tabs.tsx`
- `components/policy/self/self-request-form.tsx`
- `components/policy/self/self-notification-list.tsx`
- `components/policy/dashboard/policy-kpi-cards.tsx`
- `components/policy/dashboard/policy-trend-chart.tsx`
- `components/policy/dashboard/pending-cases-panel.tsx`

---

## 8. Kiến trúc code

### Services
- `lib/services/policy/policy-self.service.ts`
- `lib/services/policy/policy-dashboard.service.ts`
- `lib/services/policy/policy-notification.service.ts`

### Repositories
- `lib/repositories/policy/policy-self.repo.ts`
- `lib/repositories/policy/policy-dashboard.repo.ts`

---

## 9. Phase triển khai cho Claude

### Phase 1
- self-service requests + self APIs cơ bản

### Phase 2
- dashboard aggregate APIs

### Phase 3
- self-service UI + dashboard UI

### Phase 4
- notifications + report export integration

---

## 10. Notes for Claude

- Self-service phải bám triết lý “24/7 không cần lên Phòng Chính sách”
- Dashboard không chỉ là chart đẹp; phải bám KPI quản trị của từng đối tượng
- Báo cáo xuất ra về lâu dài nên nối M18