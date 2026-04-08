# MODULE M03 – REVIEW / DISCIPLINE / TRANSFER
# UC-68, UC-69, UC-70

---

## 1. Mục tiêu

Xây dựng:
- đánh giá phân loại đảng viên hàng năm,
- khen thưởng / kỷ luật trong Đảng,
- chuyển sinh hoạt Đảng / chuyển Đảng.

---

## 2. Use Cases liên quan

### UC-68 – Đánh giá phân loại đảng viên hàng năm
- HTXSNV / HTTNV / HTNV / KHNV
- lưu nhận xét, minh chứng, xu hướng nhiều năm

### UC-69 – Khen thưởng & kỷ luật trong Đảng
- quyết định
- mức độ
- tài liệu kèm theo
- ghi vào hồ sơ 360°

### UC-70 – Chuyển sinh hoạt & chuyển Đảng
- chuyển sinh hoạt tạm thời
- chuyển chính thức
- giấy giới thiệu
- trạng thái xác nhận bên nhận

---

## 3. Data Model

### 3.1. PartyAnnualReview

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| partyMemberId | string | yes | FK party member |
| reviewYear | int | yes | năm đánh giá |
| grade | ReviewGrade | yes | xếp loại |
| comments | string | no | nhận xét |
| approvedBy | string | no | người duyệt |
| approvedAt | DateTime | no | ngày duyệt |
| evidenceUrl | string | no | minh chứng |

### 3.2. PartyAward

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| partyMemberId | string | yes | FK party member |
| title | string | yes | tên khen thưởng |
| decisionNo | string | no | số quyết định |
| decisionDate | DateTime | no | ngày quyết định |
| issuer | string | no | cấp ra quyết định |
| note | string | no | ghi chú |
| attachmentUrl | string | no | file |

### 3.3. PartyDiscipline

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| partyMemberId | string | yes | FK party member |
| severity | DisciplineSeverity | yes | mức kỷ luật |
| decisionNo | string | no | số quyết định |
| decisionDate | DateTime | no | ngày quyết định |
| expiryDate | DateTime | no | ngày hết hiệu lực nếu có |
| issuer | string | no | cơ quan ra quyết định |
| reason | string | no | lý do |
| attachmentUrl | string | no | file |

### 3.4. PartyTransfer

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| partyMemberId | string | yes | FK party member |
| transferType | TransferType | yes | loại chuyển |
| fromPartyOrgId | string | yes | tổ chức nguồn |
| toPartyOrgId | string | yes | tổ chức đích |
| transferDate | DateTime | yes | ngày chuyển |
| introductionLetterNo | string | no | giấy giới thiệu |
| confirmStatus | string | yes | chờ/đã xác nhận/từ chối |
| confirmDate | DateTime | no | ngày xác nhận |
| note | string | no | ghi chú |

---

## 4. Business Rules

- mỗi năm / mỗi đảng viên có tối đa một bản review chính
- grade phải đúng enum
- discipline severity phải đúng enum
- transfer phải ghi rõ nguồn/đích
- transfer confirmStatus phải theo flow
- award/discipline phải hiển thị vào hồ sơ đảng viên

---

## 5. Validation Rules

- `reviewYear` hợp lệ
- `grade` hợp lệ
- `severity` hợp lệ
- `fromPartyOrgId != toPartyOrgId`
- `transferDate` hợp lệ
- file attach nếu có phải hợp lệ

---

## 6. API Contract

### Review
- `GET /api/party/reviews`
- `POST /api/party/reviews`
- `PUT /api/party/reviews/[id]`

### Award / Discipline
- `GET /api/party/awards`
- `POST /api/party/awards`
- `GET /api/party/disciplines`
- `POST /api/party/disciplines`

### Transfer
- `GET /api/party/transfers`
- `POST /api/party/transfers`
- `POST /api/party/transfers/[id]/confirm`

---

## 7. UI / Pages

### Pages
- `app/dashboard/party/reviews/page.tsx`
- `app/dashboard/party/awards/page.tsx`
- `app/dashboard/party/disciplines/page.tsx`
- `app/dashboard/party/transfers/page.tsx`

### Components
- `components/party/review/review-table.tsx`
- `components/party/review/review-form.tsx`
- `components/party/discipline/discipline-form.tsx`
- `components/party/transfer/transfer-form.tsx`
- `components/party/transfer/transfer-status-badge.tsx`

---

## 8. Kiến trúc code

### Services
- `lib/services/party/party-review.service.ts`
- `lib/services/party/party-award-discipline.service.ts`
- `lib/services/party/party-transfer.service.ts`

### Repositories
- `lib/repositories/party/party-review.repo.ts`
- `lib/repositories/party/party-award.repo.ts`
- `lib/repositories/party/party-discipline.repo.ts`
- `lib/repositories/party/party-transfer.repo.ts`

---

## 9. Phase triển khai cho Claude

### Phase 1
- schema review / award / discipline / transfer

### Phase 2
- APIs + services

### Phase 3
- UI forms + tables

### Phase 4
- transfer confirm flow + integration với workflow nếu cần

---

## 10. Notes for Claude

- Review/discipline/transfer đều là phần nhạy cảm, phải có audit
- Transfer nên chừa integration point với workflow M13
- Discipline severity có thể dùng lookup M19 nếu đã chuẩn hóa