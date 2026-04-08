# MODULE M03 – PARTY ORG / MEETING / PARTY FEE
# UC-64, UC-66, UC-67

---

## 1. Mục tiêu

Xây dựng:
- cây tổ chức Đảng nhiều cấp,
- quản lý sinh hoạt Chi bộ và biên bản số,
- quản lý đảng phí tự động.

Đây là nhóm vận hành thường kỳ của M03.

---

## 2. Use Cases liên quan

### UC-64 – Cơ cấu tổ chức Đảng
- Đảng ủy Học viện
- Đảng bộ
- Chi bộ cơ sở
- Chi bộ ghép
- gắn với cơ cấu quân sự / đơn vị

### UC-66 – Sinh hoạt Chi bộ & biên bản số
- lịch họp
- điểm danh
- biên bản số
- nghị quyết
- tỉ lệ tham dự
- các loại cuộc họp

### UC-67 – Quản lý đảng phí tự động
- lịch thu theo tháng
- tính nợ
- theo dõi nộp / chưa nộp
- cảnh báo nợ đảng phí

---

## 3. Data Model

### 3.1. PartyOrganization

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| code | string | yes | unique |
| name | string | yes | tên tổ chức |
| level | PartyOrgLevel | yes | cấp |
| parentId | string | no | self reference |
| linkedUnitId | string | no | gắn đơn vị quân sự |
| secretaryUserId | string | no | bí thư |
| deputySecretaryUserId | string | no | phó bí thư |
| isActive | boolean | yes | active |
| createdAt | DateTime | yes | tạo |

### 3.2. PartyMeeting

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| partyOrgId | string | yes | FK tổ chức |
| meetingType | MeetingType | yes | loại họp |
| title | string | yes | tiêu đề |
| meetingDate | DateTime | yes | ngày họp |
| location | string | no | địa điểm |
| agenda | string | no | nội dung |
| minutesUrl | string | no | file biên bản |
| resolutionUrl | string | no | nghị quyết |
| status | string | yes | draft / held / closed |
| createdBy | string | no | người tạo |

### 3.3. PartyMeetingAttendance

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| meetingId | string | yes | FK meeting |
| partyMemberId | string | yes | FK party member |
| attendanceStatus | string | yes | present/absent |
| absenceReason | string | no | lý do |
| note | string | no | ghi chú |

### 3.4. PartyFeePayment

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| partyMemberId | string | yes | FK party member |
| paymentMonth | string | yes | YYYY-MM |
| expectedAmount | float | yes | phải nộp |
| actualAmount | float | yes | đã nộp |
| paymentDate | DateTime | no | ngày nộp |
| debtAmount | float | yes | nợ còn lại |
| status | string | yes | PAID / PARTIAL / UNPAID |
| note | string | no | ghi chú |

---

## 4. Business Rules

### Party organization
- cây tổ chức phải hỗ trợ nhiều cấp
- một tổ chức Đảng có thể gắn với đơn vị quân sự tương ứng

### Meetings
- meeting phải gắn partyOrgId
- attendance tính được tỷ lệ tham dự
- biên bản số và nghị quyết lưu file key/url
- loại họp dùng enum MeetingType

### Party fee
- mỗi tháng / mỗi đảng viên có một bản ghi chính
- debtAmount = expectedAmount - actualAmount nếu chưa đủ
- currentDebtAmount của PartyMember có thể aggregate từ PartyFeePayment

---

## 5. Validation Rules

- `code` unique trong PartyOrganization
- meetingDate hợp lệ
- paymentMonth đúng định dạng
- expectedAmount, actualAmount, debtAmount không âm
- attendanceStatus hợp lệ

---

## 6. API Contract

### Org
- `GET /api/party/orgs`
- `POST /api/party/orgs`
- `PUT /api/party/orgs/[id]`

### Meeting
- `GET /api/party/meetings`
- `POST /api/party/meetings`
- `GET /api/party/meetings/[id]`
- `POST /api/party/meetings/[id]/attendance`
- `POST /api/party/meetings/[id]/minutes`

### Fee
- `GET /api/party/fees`
- `POST /api/party/fees`
- `POST /api/party/fees/auto-generate`
- `GET /api/party/members/[id]/fee-history`

---

## 7. UI / Pages

### Pages
- `app/dashboard/party/orgs/page.tsx`
- `app/dashboard/party/meetings/page.tsx`
- `app/dashboard/party/fees/page.tsx`

### Components
- `components/party/org/party-org-tree.tsx`
- `components/party/meeting/meeting-calendar.tsx`
- `components/party/meeting/attendance-sheet.tsx`
- `components/party/fee/party-fee-table.tsx`
- `components/party/fee/debt-summary-card.tsx`

---

## 8. Kiến trúc code

### Services
- `lib/services/party/party-org.service.ts`
- `lib/services/party/party-meeting.service.ts`
- `lib/services/party/party-fee.service.ts`

### Repositories
- `lib/repositories/party/party-org.repo.ts`
- `lib/repositories/party/party-meeting.repo.ts`
- `lib/repositories/party/party-fee.repo.ts`

---

## 9. Phase triển khai cho Claude

### Phase 1
- schema PartyOrganization, PartyMeeting, PartyMeetingAttendance, PartyFeePayment

### Phase 2
- org/meeting/fee APIs

### Phase 3
- org tree + meeting + fee UI

---

## 10. Notes for Claude

- PartyOrganization phải map rõ với cây đơn vị nếu cần
- Meeting/Attendance/Fee là ba nhóm dùng thường xuyên nên API phải tối ưu filter cơ bản
- Fee auto-generate nên chừa scheduler hook nếu làm sau