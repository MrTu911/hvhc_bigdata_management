# MODULE M05 – KHEN THƯỞNG / THI ĐUA / KỶ LUẬT
# UC-73, UC-74, UC-75, UC-76

---

## 1. Mục tiêu

Xây dựng:
- hồ sơ khen thưởng toàn trình,
- phong trào thi đua và điểm tích lũy,
- AI gợi ý đối tượng khen thưởng,
- hồ sơ kỷ luật hành chính và nhắc xóa án tự động.

---

## 2. Use Cases liên quan

### UC-73 – Hồ sơ khen thưởng toàn trình
Workflow:
- DRAFT
- PROPOSED
- UNIT_VERIFIED
- DEPT_REVIEWED
- APPROVED
- REJECTED

Quy trình:
1. Đơn vị tạo hồ sơ đề xuất
2. Hệ thống tự kiểm điều kiện
3. Phòng Thi đua thẩm định
4. BGĐ/Thủ trưởng phê duyệt
5. Lưu vào hồ sơ cá nhân
6. Batch export danh sách báo cáo BQP

### UC-74 – Quản lý phong trào thi đua & điểm tích lũy
- điểm thi đua cá nhân
- điểm đơn vị
- campaign
- tích điểm theo kỳ / năm

### UC-75 – AI gợi ý đối tượng khen thưởng
- đọc điểm thi đua
- đọc lịch sử khen thưởng / kỷ luật
- gợi ý ứng viên phù hợp
- đây là công cụ hỗ trợ, không thay quyết định

### UC-76 – Hồ sơ kỷ luật hành chính + nhắc hạn
- lưu quyết định kỷ luật
- theo dõi thời hạn xóa án
- nhắc tự động trước hạn
- block đề xuất khen thưởng nếu án còn hiệu lực

---

## 3. Data Model

### 3.1. RewardRecord

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| personnelId | string | yes | FK Personnel |
| rewardType | string | yes | loại khen thưởng |
| rewardLevel | string | no | cấp khen thưởng |
| emulationTitle | string | no | danh hiệu thi đua |
| workflowStatus | RewardWorkflowStatus | yes | trạng thái |
| achievementSummary | string | no | tóm tắt thành tích |
| campaignId | string | no | liên kết campaign |
| proposedByUnitId | string | no | đơn vị đề xuất |
| decisionNo | string | no | số quyết định |
| decisionDate | DateTime | no | ngày quyết định |
| approvedBy | string | no | người duyệt |
| attachmentUrl | string | no | minh chứng |
| createdAt | DateTime | yes | tạo |

### 3.2. EmulationCampaign

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| code | string | yes | mã đợt thi đua |
| name | string | yes | tên phong trào |
| startDate | DateTime | yes | bắt đầu |
| endDate | DateTime | yes | kết thúc |
| targetUnitId | string | no | đơn vị áp dụng |
| ruleJson | Json | no | rule tính điểm |
| isActive | boolean | yes | active |

### 3.3. DisciplineRecord

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| personnelId | string | yes | FK Personnel |
| disciplineType | string | yes | hình thức kỷ luật |
| disciplineReason | string | no | lý do |
| decisionNo | string | no | số quyết định |
| decisionDate | DateTime | no | ngày quyết định |
| effectiveDate | DateTime | no | ngày có hiệu lực |
| clearDate | DateTime | no | ngày đủ điều kiện xóa án |
| isCleared | boolean | yes | đã xóa án hay chưa |
| note | string | no | ghi chú |
| attachmentUrl | string | no | file |

### 3.4. EmulationScoreLedger
Bảng hoặc aggregate lưu điểm thi đua theo cá nhân / kỳ.

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| personnelId | string | yes | FK Personnel |
| campaignId | string | yes | FK campaign |
| score | float | yes | điểm |
| scoreBreakdown | Json | no | chi tiết điểm |
| rankInUnit | int | no | xếp hạng trong đơn vị |
| calculatedAt | DateTime | yes | thời điểm tính |

---

## 4. Business Rules

### Khen thưởng
- chỉ được APPROVED khi đủ điều kiện
- nếu còn kỷ luật chưa xóa án thì block hoặc cảnh báo theo rule
- sau khi APPROVED phải cộng vào hồ sơ cá nhân
- phải hỗ trợ export danh sách báo cáo cấp trên

### Thi đua
- điểm thi đua phải tính theo rule/campaign
- điểm là dữ liệu hỗ trợ xét khen thưởng
- phải theo dõi lịch sử theo năm/kỳ

### Kỷ luật
- mỗi hồ sơ kỷ luật có clearDate
- hệ thống phải nhắc trước hạn xóa án
- trạng thái xóa án ảnh hưởng eligibility cho khen thưởng

### AI gợi ý
- chỉ hỗ trợ quyết định
- không tự động phê duyệt
- phải giải thích được tiêu chí gợi ý

---

## 5. Validation Rules

- `personnelId` bắt buộc
- rewardType/disciplineType hợp lệ
- workflowStatus hợp lệ
- clearDate không được trước decisionDate nếu cùng có
- `startDate <= endDate` cho campaign
- score không âm

---

## 6. API Contract

### Reward
- `GET /api/policy/rewards`
- `POST /api/policy/rewards`
- `PUT /api/policy/rewards/[id]`
- `POST /api/policy/rewards/[id]/approve`
- `POST /api/policy/rewards/export`

### Emulation
- `GET /api/policy/emulation/campaigns`
- `POST /api/policy/emulation/campaigns`
- `GET /api/policy/emulation/scores`

### AI suggestion
- `GET /api/policy/ai/reward-suggestions`

### Discipline
- `GET /api/policy/disciplines`
- `POST /api/policy/disciplines`
- `POST /api/policy/disciplines/[id]/clear`

---

## 7. UI / Pages

### Pages
- `app/dashboard/policy/rewards/page.tsx`
- `app/dashboard/policy/emulation/page.tsx`
- `app/dashboard/policy/disciplines/page.tsx`

### Components
- `components/policy/reward/reward-workflow-board.tsx`
- `components/policy/reward/reward-form.tsx`
- `components/policy/emulation/emulation-score-table.tsx`
- `components/policy/discipline/discipline-form.tsx`
- `components/policy/discipline/clear-reminder-card.tsx`
- `components/policy/ai/reward-suggestion-panel.tsx`

---

## 8. Kiến trúc code

### Services
- `lib/services/policy/reward.service.ts`
- `lib/services/policy/emulation.service.ts`
- `lib/services/policy/discipline.service.ts`
- `lib/services/policy/reward-ai.service.ts`

### Repositories
- `lib/repositories/policy/reward.repo.ts`
- `lib/repositories/policy/emulation.repo.ts`
- `lib/repositories/policy/discipline.repo.ts`

---

## 9. Phase triển khai cho Claude

### Phase 1
- schema RewardRecord, EmulationCampaign, DisciplineRecord, EmulationScoreLedger

### Phase 2
- reward/discipline CRUD + workflow APIs

### Phase 3
- emulation score APIs + rule scaffold

### Phase 4
- AI suggestion endpoint + UI

---

## 10. Notes for Claude

- Khen thưởng và kỷ luật có ràng buộc pháp lý, phải có audit
- Clear date của kỷ luật là logic trọng yếu
- AI suggestion không được thay thế phê duyệt con người
- Dùng M19 cho reward/discipline categories nếu category đã có