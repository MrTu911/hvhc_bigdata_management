# MODULE M03 – UBKT & DASHBOARD
# UC-71, UC-72

---

## 1. Mục tiêu

Xây dựng:
- phân hệ kiểm tra, giám sát của UBKT,
- dashboard điều hành & báo cáo Đảng toàn hệ thống.

---

## 2. Use Cases liên quan

### UC-71 – UBKT
- kiểm tra định kỳ
- kiểm tra khi có dấu hiệu
- giám sát chuyên đề
- phúc kết kỷ luật
- ghi đối tượng, kết luận, kiến nghị, tài liệu

### UC-72 – Dashboard điều hành & báo cáo
- số lượng đảng viên theo trạng thái
- kết nạp mới
- tỷ lệ dự họp
- nợ đảng phí
- xếp loại các năm
- số vụ kỷ luật / kiểm tra
- báo cáo theo tổ chức Đảng

---

## 3. Data Model

### 3.1. PartyInspectionTarget

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| partyMemberId | string | no | kiểm tra cá nhân |
| partyOrgId | string | no | kiểm tra tổ chức |
| inspectionType | InspectionType | yes | loại kiểm tra |
| title | string | yes | tên đợt kiểm tra |
| openedAt | DateTime | yes | bắt đầu |
| closedAt | DateTime | no | kết thúc |
| findings | string | no | kết luận |
| recommendation | string | no | kiến nghị |
| decisionRef | string | no | văn bản liên quan |
| attachmentUrl | string | no | hồ sơ |
| createdBy | string | no | người tạo |

### 3.2. Dashboard aggregate
Không nhất thiết là bảng thật ở phase đầu; có thể aggregate runtime hoặc materialized view sau.

---

## 4. Business Rules

- một đợt kiểm tra có thể nhắm:
  - cá nhân
  - tổ chức
- phải có inspectionType hợp lệ
- findings/recommendation phải lưu được
- dashboard phải support theo:
  - thời gian
  - tổ chức Đảng
  - đơn vị
  - loại sự kiện

---

## 5. API Contract

### Inspection
- `GET /api/party/inspections`
- `POST /api/party/inspections`
- `GET /api/party/inspections/[id]`
- `PUT /api/party/inspections/[id]`

### Dashboard
- `GET /api/party/dashboard/stats`
- `GET /api/party/dashboard/trends`
- `POST /api/party/reports/export`

---

## 6. UI / Pages

### Pages
- `app/dashboard/party/inspections/page.tsx`
- `app/dashboard/party/dashboard/page.tsx`

### Components
- `components/party/inspection/inspection-table.tsx`
- `components/party/inspection/inspection-detail-drawer.tsx`
- `components/party/dashboard/party-kpi-cards.tsx`
- `components/party/dashboard/party-trend-charts.tsx`
- `components/party/dashboard/party-org-summary.tsx`

---

## 7. Kiến trúc code

### Services
- `lib/services/party/party-inspection.service.ts`
- `lib/services/party/party-dashboard.service.ts`

### Repositories
- `lib/repositories/party/party-inspection.repo.ts`
- `lib/repositories/party/party-dashboard.repo.ts`

---

## 8. Phase triển khai cho Claude

### Phase 1
- inspection schema + APIs

### Phase 2
- dashboard aggregate APIs

### Phase 3
- inspection UI + dashboard UI

---

## 9. Notes for Claude

- Dashboard không chỉ là biểu đồ đẹp; phải bám nghiệp vụ Đảng
- Các chỉ số phải đọc được từ các bảng lõi của M03
- Export report về lâu dài nên nối M18