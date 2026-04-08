# MODULE M03 – PARTY MEMBER LIFECYCLE
# UC-63, UC-65

---

## 1. Mục tiêu

Xây dựng:
- hồ sơ đảng viên toàn trình theo Mẫu 2A-LLĐV,
- pipeline kết nạp đảng viên mới,
- logic chuyển trạng thái từ quần chúng ưu tú đến đảng viên chính thức.

Đây là lõi quan trọng nhất của M03.

---

## 2. Use Cases liên quan

### UC-63 – Hồ sơ đảng viên toàn trình
- hồ sơ 360° theo mẫu 2A-LLĐV
- tab:
  - lý lịch bản thân
  - thông tin Đảng
  - quá trình hoạt động
  - đánh giá các năm
  - sinh hoạt Đảng
  - đảng phí
  - khen thưởng/kỷ luật
  - chuyển sinh hoạt
  - kiểm tra/giám sát
- xuất PDF mẫu chuẩn

### UC-65 – Quy trình kết nạp Đảng viên mới
- theo dõi quần chúng ưu tú
- học cảm tình Đảng
- đối tượng kết nạp
- chi bộ xét
- cấp trên duyệt
- kết nạp đảng viên dự bị
- nhắc chuyển chính thức sau 12 tháng

---

## 3. Data Model

### 3.1. PartyMember

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| userId | string | yes | FK User/Personnel |
| partyCardNo | string | no | số thẻ đảng viên |
| status | PartyMemberStatus | yes | trạng thái hiện tại |
| joinDate | DateTime | no | ngày kết nạp dự bị |
| officialDate | DateTime | no | ngày chính thức |
| partyOrgId | string | yes | FK tổ chức Đảng |
| partyRole | string | no | chức vụ Đảng |
| introducer1 | string | no | người giới thiệu 1 |
| introducer2 | string | no | người giới thiệu 2 |
| currentReviewGrade | ReviewGrade | no | xếp loại gần nhất |
| currentDebtAmount | float | no | nợ đảng phí hiện tại |
| confidentialNote | string | no | ghi chú nhạy cảm |
| createdAt | DateTime | yes | tạo |
| updatedAt | DateTime | yes | cập nhật |

### 3.2. PartyRecruitmentPipeline

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| userId | string | yes | ứng viên |
| currentStep | RecruitmentStep | yes | bước hiện tại |
| targetPartyOrgId | string | yes | tổ chức đích |
| camTinhDate | DateTime | no | ngày học cảm tình |
| doiTuongDate | DateTime | no | ngày vào diện đối tượng |
| chiBoProposalDate | DateTime | no | ngày chi bộ xét |
| capTrenApprovalDate | DateTime | no | ngày cấp trên duyệt |
| joinedDate | DateTime | no | ngày kết nạp |
| assistantMember1 | string | no | đảng viên giúp đỡ |
| assistantMember2 | string | no | đảng viên giúp đỡ |
| dossierStatus | string | no | tình trạng hồ sơ |
| note | string | no | ghi chú |
| createdAt | DateTime | yes | tạo |

### 3.3. Quan hệ
- `PartyMember.userId` → User/Personnel
- `PartyRecruitmentPipeline.userId` → User/Personnel
- một người có thể đi từ pipeline sang PartyMember khi kết nạp

---

## 4. Hồ sơ đảng viên 360°

### Nguồn dữ liệu
- Nhân thân: User/Personnel
- Thông tin Đảng: PartyMember
- Quá trình hoạt động CM: CareerHistory từ module nhân sự
- Đánh giá các năm: PartyAnnualReview
- Sinh hoạt Đảng: PartyMeetingAttendance
- Đảng phí: PartyFeePayment
- Khen thưởng/kỷ luật Đảng: PartyAward, PartyDiscipline
- Chuyển sinh hoạt: PartyTransfer
- Kiểm tra/giám sát: PartyInspectionTarget

### API chính
- `GET /api/party/members/[id]`
- `GET /api/party/members/[id]/profile360`
- `POST /api/party/members/[id]/export-2a` (về lâu dài nên nối M18)

---

## 5. Business Rules

### 5.1. Vòng đời
- QUAN_CHUNG → CAM_TINH → DOI_TUONG → DU_BI → CHINH_THUC
- sau khi là chính thức có thể phát sinh:
  - CHUYEN_DI
  - XOA_TEN_TU_NGUYEN
  - KHAI_TRU

### 5.2. Kết nạp
- chỉ người ở pipeline hợp lệ mới được tạo PartyMember
- thời gian dự bị 12 tháng
- hệ thống phải tự nhắc chuyển chính thức khi đến hạn

### 5.3. Hồ sơ nhạy cảm
- trường nhạy cảm chỉ hiển thị với quyền `PARTY.MEMBER_SENSITIVE`
- mọi sửa đổi phải audit

### 5.4. Hồ sơ 2A-LLĐV
- phải tổng hợp dữ liệu đa bảng
- xuất theo mẫu chuẩn, có thể in trực tiếp

---

## 6. Validation Rules

- `userId` bắt buộc
- `partyOrgId` bắt buộc
- `status` phải đúng enum
- `officialDate >= joinDate` nếu cả hai cùng có
- `currentDebtAmount` không âm
- pipeline step phải hợp lệ theo luồng

---

## 7. UI / Pages

### Pages
- `app/dashboard/party/members/page.tsx`
- `app/dashboard/party/members/[id]/page.tsx`
- `app/dashboard/party/recruitment/page.tsx`

### Components
- `components/party/member/party-member-profile-tabs.tsx`
- `components/party/member/party-member-summary-card.tsx`
- `components/party/recruitment/recruitment-pipeline-board.tsx`
- `components/party/recruitment/recruitment-step-form.tsx`

---

## 8. Kiến trúc code

### Services
- `lib/services/party/party-member.service.ts`
- `lib/services/party/party-profile360.service.ts`
- `lib/services/party/party-recruitment.service.ts`

### Repositories
- `lib/repositories/party/party-member.repo.ts`
- `lib/repositories/party/party-recruitment.repo.ts`

---

## 9. Phase triển khai cho Claude

### Phase 1
- schema PartyMember + PartyRecruitmentPipeline

### Phase 2
- member CRUD + profile360 aggregate API

### Phase 3
- recruitment pipeline service + APIs

### Phase 4
- UI hồ sơ đảng viên + recruitment board

---

## 10. Notes for Claude

- Không tách hồ sơ đảng viên khỏi master nhân thân M02
- Profile360 phải aggregate đa bảng
- Recruitment pipeline phải encode được các bước theo thiết kế
- Cần chừa điểm nối với workflow M13 cho bước duyệt cấp trên