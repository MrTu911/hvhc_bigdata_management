# MODULE M09 – UC-47
# HỒ SƠ NHÀ KHOA HỌC (SCIENTIST PROFILE)

---

## 1. Mục tiêu use case

Xây dựng hồ sơ nhà khoa học 360 độ cho cán bộ nghiên cứu trong Học viện Hậu cần, phục vụ:
- quản lý năng lực nghiên cứu,
- theo dõi công bố và đề tài,
- lập bản đồ năng lực nghiên cứu,
- gợi ý chuyên gia phản biện / hội đồng / PI,
- làm nguồn dữ liệu cho AI phân tích xu hướng và duplicate detection.

---

## 2. Thông tin use case

- Mã UC: UC-47
- Trạng thái: CÓ – Hoàn thiện
- Độ phức tạp: Trung bình
- Đường dẫn: `/dashboard/research/scientists/*`
- RBAC:
  - `RESEARCH.SCIENTIST_VIEW`
  - `RESEARCH.SCIENTIST_UPDATE`
  - `RESEARCH.SCIENTIST_EXPORT`

---

## 3. Chức năng chính

### 3.1. Hồ sơ nhà khoa học 360 độ
- thông tin cơ bản
- học hàm / học vị
- chuyên ngành
- đơn vị
- lĩnh vực nghiên cứu
- từ khóa nghiên cứu
- công bố
- đề tài
- sáng kiến
- giải thưởng / thành tích

### 3.2. Chỉ số khoa học
- H-index
- i10-index
- tổng số trích dẫn
- tổng số công bố
- số đề tài chủ nhiệm / tham gia

### 3.3. Bản đồ năng lực nghiên cứu
Tính năng đặc biệt của UC-47:
- hiển thị phân bố chuyên môn theo:
  - đơn vị
  - lĩnh vực
  - học hàm
- hỗ trợ:
  - hình thành nhóm nghiên cứu liên ngành
  - phân công phản biện / hội đồng
  - xác định lĩnh vực còn trống
  - báo cáo năng lực nghiên cứu tổng thể

### 3.4. Gợi ý chuyên gia
- gợi ý PI hoặc thành viên phù hợp cho đề tài mới
- gợi ý chuyên gia phản biện
- gợi ý người hướng dẫn / đồng hướng dẫn

---

## 4. Data Model

### 4.1. ScientistProfile

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | khóa chính |
| userId | string | yes | FK User |
| academicRank | string | no | học hàm |
| degree | string | no | học vị |
| specialization | string | no | chuyên ngành |
| researchFields | string[] | yes | lĩnh vực nghiên cứu |
| keywords | string[] | yes | từ khóa nghiên cứu |
| hIndex | int | no | H-index |
| i10Index | int | no | i10-index |
| citationCount | int | no | tổng trích dẫn |
| publicationCount | int | no | tổng công bố |
| projectLeadCount | int | no | số đề tài chủ nhiệm |
| projectMemberCount | int | no | số đề tài tham gia |
| awards | string[] | yes | giải thưởng / thành tích |
| biography | string | no | mô tả ngắn |
| researchVector | string | no | vector hoặc key tham chiếu AI |
| createdAt | DateTime | yes | ngày tạo |
| updatedAt | DateTime | yes | ngày cập nhật |

### 4.2. Quan hệ logic
- `ScientistProfile.userId` → `User`
- Một `ScientistProfile` liên kết với:
  - nhiều `ResearchProject` qua PI hoặc ResearchMember
  - nhiều `ResearchPublication` qua PublicationAuthor hoặc owner
- Có thể đọc thêm từ `FacultyProfile`, `ScientificProfile` nếu hệ thống hiện có

---

## 5. Business Rules

- Mỗi `User` chỉ có một `ScientistProfile`
- Hồ sơ có thể tổng hợp từ nhiều nguồn:
  - User
  - FacultyProfile
  - ScientificProfile
  - ResearchProject
  - ResearchPublication
- `hIndex`, `i10Index`, `citationCount` không âm
- Hệ thống phải hỗ trợ tính hoặc cập nhật chỉ số định kỳ
- Bản đồ năng lực nghiên cứu phải tổng hợp được theo đơn vị và lĩnh vực

---

## 6. Validation Rules

- `userId` bắt buộc
- `hIndex`, `i10Index`, `citationCount`, `publicationCount` không âm
- `researchFields` và `keywords` là mảng chuỗi hợp lệ
- một `userId` không được có nhiều profile

---

## 7. API Contract

### 7.1. GET `/api/research/scientists`
Filter:
- keyword
- unitId
- specialization
- researchField
- degree
- academicRank
- page
- pageSize

### 7.2. GET `/api/research/scientists/[id]`
- lấy chi tiết hồ sơ nhà khoa học

### 7.3. PATCH `/api/research/scientists/[id]`
- cập nhật hồ sơ

### 7.4. GET `/api/research/scientists/capacity-map`
- dữ liệu bản đồ năng lực nghiên cứu

### 7.5. POST `/api/research/scientists/export`
- export danh mục / hồ sơ

---

## 8. UI / Pages

- `app/dashboard/research/scientists/page.tsx`
- `app/dashboard/research/scientists/[id]/page.tsx`
- `app/dashboard/research/scientists/capacity-map/page.tsx`

Components:
- `components/research/scientist/scientist-table.tsx`
- `components/research/scientist/scientist-profile-card.tsx`
- `components/research/scientist/scientist-metrics.tsx`
- `components/research/scientist/research-capacity-map.tsx`

---

## 9. Kiến trúc code

### API
- `app/api/research/scientists/route.ts`
- `app/api/research/scientists/[id]/route.ts`
- `app/api/research/scientists/capacity-map/route.ts`
- `app/api/research/scientists/export/route.ts`

### Service
- `lib/services/scientist-profile.service.ts`

### Repository
- `lib/repositories/scientist-profile.repo.ts`

### Validator
- `lib/validators/scientist-profile.schema.ts`

---

## 10. Tích hợp với các UC khác

- UC-45: lấy PI, thành viên đề tài
- UC-46: thống kê công bố
- UC-48: gợi ý nhà khoa học phù hợp, phân tích researchVector
- UC-49: so sánh tương đồng chuyên môn khi phát hiện trùng lặp hoặc gợi ý hội đồng

---

## 11. Phase triển khai cho Claude

### Phase 1
- schema `ScientistProfile`

### Phase 2
- service tổng hợp profile từ User / Project / Publication

### Phase 3
- API danh sách + chi tiết

### Phase 4
- capacity map endpoint

### Phase 5
- UI hồ sơ + bản đồ năng lực

---

## 12. Notes for Claude

- Đây không phải chỉ là “profile cán bộ”
- Phải là hồ sơ khoa học 360 độ
- Nếu hệ thống đã có `FacultyProfile` hoặc `ScientificProfile`, phải tái sử dụng và mở rộng thay vì tạo dữ liệu trùng
- Bản đồ năng lực nghiên cứu là tính năng trọng tâm của UC-47