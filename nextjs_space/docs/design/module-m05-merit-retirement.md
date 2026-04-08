# MODULE M05 – NGƯỜI CÓ CÔNG / HƯU TRÍ
# UC-81, UC-82

---

## 1. Mục tiêu

Xây dựng:
- hồ sơ người có công,
- Retirement Planner dự báo nghỉ hưu và mức hưởng.

---

## 2. Use Cases liên quan

### UC-81 – Hồ sơ người có công
Quản lý các loại hồ sơ:
- thương binh
- bệnh binh
- người hoạt động cách mạng
- thân nhân liệt sĩ
- anh hùng LLVT
- anh hùng lao động
- khai quốc công thần

### UC-82 – Retirement Planner
Tính năng cốt lõi:
- tự động tính ngày đủ điều kiện nghỉ hưu
- nhắc trước 24 tháng
- mô phỏng 3 kịch bản:
  1. nghỉ đúng hạn
  2. nghỉ trước tuổi
  3. gia hạn 1–5 năm
- checklist hồ sơ hưu trí 12 loại giấy tờ

---

## 3. Data Model

### 3.1. MeritProfile

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| personnelId | string | yes | FK Personnel |
| meritType | MeritType | yes | loại người có công |
| certificateNo | string | no | số giấy tờ xác nhận |
| issuedBy | string | no | cơ quan cấp |
| issuedDate | DateTime | no | ngày cấp |
| benefitSummary | string | no | quyền lợi chính |
| attachmentUrl | string | no | hồ sơ scan |
| note | string | no | ghi chú |

### 3.2. RetirementProfile

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| personnelId | string | yes | FK Personnel |
| retirementType | RetirementType | yes | loại nghỉ hưu / thôi việc |
| expectedRetirementDate | DateTime | no | ngày đủ điều kiện |
| earlyRetirementDate | DateTime | no | ngày nếu nghỉ trước |
| extensionMaxDate | DateTime | no | ngày tối đa nếu kéo dài |
| estimatedPension | float | no | dự tính lương hưu |
| preparationStartedAt | DateTime | no | bắt đầu chuẩn bị hồ sơ |
| status | string | yes | PREP / READY / SUBMITTED / COMPLETED |
| note | string | no | ghi chú |

### 3.3. RetirementScenario

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| retirementProfileId | string | yes | FK RetirementProfile |
| scenarioType | string | yes | NORMAL / EARLY / EXTEND |
| projectedDate | DateTime | no | ngày dự kiến |
| projectedPension | float | no | mức hưởng dự kiến |
| explanation | string | no | giải thích |

---

## 4. Business Rules

### Người có công
- một người có thể có một hoặc nhiều hồ sơ người có công tùy rule
- meritType phải đúng enum
- attachment là hồ sơ pháp lý quan trọng

### Hưu trí
- phải tính theo tuổi và thâm niên BHXH
- phải nhắc trước 24 tháng
- phải hỗ trợ mô phỏng 3 kịch bản
- checklist hồ sơ là phần cốt lõi của planner

---

## 5. Validation Rules

- `personnelId` bắt buộc
- `meritType`, `retirementType` hợp lệ
- `estimatedPension` không âm
- projected values không âm
- expectedRetirementDate hợp lệ

---

## 6. API Contract

### Merit
- `GET /api/policy/merit`
- `POST /api/policy/merit`
- `GET /api/policy/merit/[id]`

### Retirement
- `GET /api/policy/retirement/[personnelId]`
- `POST /api/policy/retirement/calculate`
- `GET /api/policy/retirement/upcoming-24m`

---

## 7. UI / Pages

### Pages
- `app/dashboard/policy/merit/page.tsx`
- `app/dashboard/policy/retirement/page.tsx`

### Components
- `components/policy/merit/merit-profile-form.tsx`
- `components/policy/retirement/retirement-planner-panel.tsx`
- `components/policy/retirement/retirement-scenario-cards.tsx`
- `components/policy/retirement/retirement-checklist.tsx`

---

## 8. Kiến trúc code

### Services
- `lib/services/policy/merit.service.ts`
- `lib/services/policy/retirement.service.ts`

### Repositories
- `lib/repositories/policy/merit.repo.ts`
- `lib/repositories/policy/retirement.repo.ts`

---

## 9. Phase triển khai cho Claude

### Phase 1
- schema MeritProfile, RetirementProfile, RetirementScenario

### Phase 2
- merit + retirement calculation APIs

### Phase 3
- planner UI + upcoming reminders

---

## 10. Notes for Claude

- Retirement Planner là tính năng tư vấn nghiệp vụ, không chỉ lưu hồ sơ
- Các công thức phải tách khỏi UI
- Reminder 24 tháng là yêu cầu quan trọng của thiết kế