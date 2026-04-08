# MODULE M05 – BHXH / BHYT / PHỤ CẤP / TRỢ CẤP
# UC-77, UC-78, UC-79, UC-80

---

## 1. Mục tiêu

Xây dựng:
- hồ sơ BHXH/BHYT quân đội,
- giải quyết chế độ BHXH,
- engine tính phụ cấp tự động,
- quản lý trợ cấp & chế độ chính sách.

---

## 2. Use Cases liên quan

### UC-77 – Hồ sơ BHXH/BHYT quân đội
- số sổ
- mã BHYT
- lịch sử đóng
- thẻ BHYT, ngày hết hạn
- cảnh báo 30 ngày trước khi hết hạn

### UC-78 – Giải quyết chế độ BHXH
- tính điều kiện hưởng
- xử lý hồ sơ chế độ
- xuất D02-TS BHXH
- workflow và trạng thái hồ sơ

### UC-79 – Phụ cấp tự động
- tự động tính mức phụ cấp
- phụ thuộc:
  - chức vụ
  - quân hàm
  - thâm niên
  - vùng / điều kiện đặc thù
- mục tiêu 100% chính xác

### UC-80 – Trợ cấp & chế độ chính sách
- trợ cấp khó khăn
- trợ cấp đặc thù
- các trường hợp đề xuất chế độ, upload minh chứng, theo dõi trạng thái

---

## 3. Data Model

### 3.1. InsuranceProfile

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| personnelId | string | yes | FK Personnel |
| insuranceNo | string | no | số sổ BHXH |
| healthInsuranceNo | string | no | mã BHYT |
| participationMonths | int | no | tổng tháng đóng |
| currentContributionBase | float | no | mức đóng hiện tại |
| cardExpiryDate | DateTime | no | hết hạn thẻ BHYT |
| lastUpdatedAt | DateTime | no | cập nhật gần nhất |

### 3.2. InsuranceContributionHistory

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| insuranceProfileId | string | yes | FK InsuranceProfile |
| monthKey | string | yes | YYYY-MM |
| contributionAmount | float | yes | số tiền đóng |
| contributionBase | float | no | mức đóng |
| unitContribution | float | no | đơn vị đóng |
| personalContribution | float | no | cá nhân đóng |

### 3.3. InsuranceSettlement

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| personnelId | string | yes | FK Personnel |
| settlementType | string | yes | loại chế độ |
| dossierNo | string | no | số hồ sơ |
| requestedAt | DateTime | yes | ngày đề nghị |
| approvedAt | DateTime | no | ngày duyệt |
| workflowStatus | string | yes | trạng thái |
| amountCalculated | float | no | mức tính |
| resultNote | string | no | ghi chú |
| attachmentUrl | string | no | file |

### 3.4. AllowanceRecord

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| personnelId | string | yes | FK Personnel |
| allowanceType | string | yes | loại phụ cấp |
| effectiveFrom | DateTime | yes | hiệu lực từ |
| effectiveTo | DateTime | no | hiệu lực đến |
| amount | float | yes | mức hưởng |
| calculationBase | Json | no | cơ sở tính |
| autoCalculated | boolean | yes | auto hay tay |
| note | string | no | ghi chú |

### 3.5. SubsidyCase

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| personnelId | string | yes | FK Personnel |
| subsidyType | string | yes | loại trợ cấp |
| requestedAt | DateTime | yes | ngày nộp |
| workflowStatus | string | yes | trạng thái |
| expectedAmount | float | no | dự tính |
| approvedAmount | float | no | mức duyệt |
| evidenceUrl | string | no | minh chứng |
| note | string | no | ghi chú |

---

## 4. Business Rules

### BHYT/BHXH
- phải cảnh báo trước khi thẻ hết hạn
- participationMonths phải cập nhật được theo lịch sử
- hồ sơ settlement phải có workflow status rõ

### Phụ cấp
- amount không nhập tay vô tổ chức nếu thuộc loại auto
- phải tách calculation service khỏi CRUD
- lưu calculationBase để audit

### Trợ cấp
- hồ sơ đề nghị có trạng thái
- chứng từ / minh chứng là bắt buộc với một số loại
- thời gian giải quyết cần rút xuống dưới 2 ngày theo mục tiêu thiết kế

---

## 5. Validation Rules

- `personnelId` bắt buộc
- monthKey đúng định dạng
- contributionAmount, amount, expectedAmount, approvedAmount không âm
- cardExpiryDate hợp lệ
- effectiveFrom/effectiveTo hợp lệ

---

## 6. API Contract

### Insurance
- `GET /api/policy/insurance/[personnelId]`
- `POST /api/policy/insurance/[personnelId]/contributions`
- `GET /api/policy/insurance/expiring-cards`

### Settlement
- `GET /api/policy/insurance-settlements`
- `POST /api/policy/insurance-settlements`
- `POST /api/policy/insurance-settlements/export-d02ts`

### Allowance
- `GET /api/policy/allowances`
- `POST /api/policy/allowances/recalculate`
- `POST /api/policy/allowances`

### Subsidy
- `GET /api/policy/subsidies`
- `POST /api/policy/subsidies`

---

## 7. UI / Pages

### Pages
- `app/dashboard/policy/insurance/page.tsx`
- `app/dashboard/policy/allowances/page.tsx`
- `app/dashboard/policy/subsidies/page.tsx`

### Components
- `components/policy/insurance/insurance-profile-card.tsx`
- `components/policy/insurance/contribution-history-table.tsx`
- `components/policy/insurance/expiry-warning-card.tsx`
- `components/policy/allowance/allowance-table.tsx`
- `components/policy/allowance/recalculate-panel.tsx`
- `components/policy/subsidy/subsidy-request-form.tsx`

---

## 8. Kiến trúc code

### Services
- `lib/services/policy/insurance.service.ts`
- `lib/services/policy/insurance-settlement.service.ts`
- `lib/services/policy/allowance.service.ts`
- `lib/services/policy/subsidy.service.ts`

### Repositories
- `lib/repositories/policy/insurance.repo.ts`
- `lib/repositories/policy/allowance.repo.ts`
- `lib/repositories/policy/subsidy.repo.ts`

---

## 9. Phase triển khai cho Claude

### Phase 1
- schema InsuranceProfile, InsuranceContributionHistory, InsuranceSettlement, AllowanceRecord, SubsidyCase

### Phase 2
- insurance/allowance/subsidy APIs

### Phase 3
- expiry warning + D02-TS export scaffold + recalculation service

### Phase 4
- UI insurance/allowance/subsidy

---

## 10. Notes for Claude

- Các phép tính phụ cấp/BHXH phải tách riêng thành service có audit
- D02-TS export về lâu dài nên đi qua M18
- Các category trợ cấp, phụ cấp, loại BHXH nên dần chuẩn hóa qua M19