
---

# 3) `docs/design/module-m02-career-family-academic.md`

```md
# MODULE M02 – CAREER / FAMILY / ACADEMIC
# UC-10, UC-12, phần học vấn của UC-11

---

## 1. Mục tiêu

Xây dựng các bảng và chức năng:
- lịch sử công tác theo timeline,
- lịch sử học vấn / đào tạo,
- quản lý thành viên gia đình,
- phục vụ hồ sơ 360 và engine quy hoạch cán bộ.

---

## 2. Use Cases liên quan

### UC-10 – Lịch sử công tác
- timeline bổ nhiệm, điều động, thăng quân hàm, biệt phái, đi học, về đơn vị
- gắn quyết định, ngày hiệu lực, đơn vị trước/sau

### UC-12 – Quản lý gia đình
- vợ/chồng
- con
- cha mẹ
- người phụ thuộc
- thông tin cơ bản, nghề nghiệp, quan hệ

### Học vấn / đào tạo
- các bằng cấp theo thời gian
- trường đào tạo
- chuyên ngành
- GPA / xếp loại nếu có

---

## 3. Data Model

### 3.1. CareerHistory

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| personnelId | string | yes | FK Personnel |
| eventType | CareerEventType | yes | loại sự kiện |
| title | string | yes | tên sự kiện |
| fromPosition | string | no | chức vụ trước |
| toPosition | string | no | chức vụ sau |
| fromRank | string | no | quân hàm trước |
| toRank | string | no | quân hàm sau |
| fromUnitId | string | no | đơn vị trước |
| toUnitId | string | no | đơn vị sau |
| effectiveDate | DateTime | yes | ngày hiệu lực |
| endDate | DateTime | no | ngày kết thúc |
| decisionNo | string | no | số quyết định |
| decisionAuthority | string | no | cơ quan ra quyết định |
| decisionUrl | string | no | file scan |
| reason | string | no | lý do |
| note | string | no | ghi chú |
| createdAt | DateTime | yes | tạo |
| recordedBy | string | no | người nhập |

### 3.2. EducationHistory

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| personnelId | string | yes | FK Personnel |
| institutionName | string | yes | cơ sở đào tạo |
| degreeLevel | string | no | trình độ |
| academicDegree | string | no | học vị |
| major | string | no | chuyên ngành |
| studyMode | string | no | hình thức đào tạo |
| startYear | int | no | năm bắt đầu |
| endYear | int | no | năm kết thúc |
| graduationResult | string | no | xếp loại |
| gpa | float | no | GPA |
| certificateNo | string | no | số văn bằng |
| note | string | no | ghi chú |

### 3.3. FamilyMember

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| personnelId | string | yes | FK Personnel |
| fullName | string | yes | họ tên |
| relationship | string | yes | quan hệ |
| dateOfBirth | DateTime | no | ngày sinh |
| occupation | string | no | nghề nghiệp |
| workplace | string | no | nơi công tác |
| address | string | no | địa chỉ |
| dependentFlag | boolean | yes | người phụ thuộc |
| note | string | no | ghi chú |

---

## 4. Enums / lookup cần dùng

### CareerEventType
- APPOINTMENT
- TRANSFER
- RANK_PROMOTION
- RANK_DEMOTION
- SECONDMENT
- STUDY_LEAVE
- RETURN
- RETIREMENT_PREP
- UNIT_CHANGE
- POSITION_CHANGE

### Lookup nên lấy từ M19
- MD_ACADEMIC_DEGREE
- MD_ACADEMIC_TITLE
- MD_MAJOR
- MD_INSTITUTION
- MD_STUDY_MODE
- MD_LANGUAGE
- MD_LANGUAGE_LEVEL
- MD_IT_LEVEL
- MD_PROVINCE / DISTRICT / WARD

---

## 5. Business Rules

- CareerHistory sắp theo `effectiveDate desc`
- event timeline không được mâu thuẫn thời gian nghiêm trọng
- một người có thể có nhiều EducationHistory
- FamilyMember phải gắn đúng `personnelId`
- decision file của CareerHistory nên lưu MinIO key hoặc signed url source
- family data là nhạy cảm, cần scope + sensitive check phù hợp

---

## 6. Validation Rules

- `personnelId` bắt buộc
- `title` và `eventType` bắt buộc ở CareerHistory
- `institutionName` bắt buộc cho EducationHistory
- `relationship` bắt buộc cho FamilyMember
- `startYear <= endYear` nếu cả hai cùng có
- `gpa` hợp lệ
- `effectiveDate` hợp lệ

---

## 7. API Contract

### Career
- `GET /api/personnel/[id]/career`
- `POST /api/personnel/[id]/career`
- `PUT /api/personnel/career/[careerId]`
- `DELETE /api/personnel/career/[careerId]`

### Education
- `GET /api/personnel/[id]/education`
- `POST /api/personnel/[id]/education`
- `PUT /api/personnel/education/[educationId]`
- `DELETE /api/personnel/education/[educationId]`

### Family
- `GET /api/personnel/[id]/family`
- `POST /api/personnel/[id]/family`
- `PUT /api/personnel/family/[familyId]`
- `DELETE /api/personnel/family/[familyId]`

---

## 8. UI / Pages

### Components
- `components/personnel/career/career-timeline.tsx`
- `components/personnel/career/career-event-form.tsx`
- `components/personnel/education/education-table.tsx`
- `components/personnel/family/family-member-table.tsx`
- `components/personnel/family/family-member-form.tsx`

---

## 9. Kiến trúc code

### Services
- `lib/services/personnel/career.service.ts`
- `lib/services/personnel/education.service.ts`
- `lib/services/personnel/family.service.ts`

### Repositories
- `lib/repositories/personnel/career.repo.ts`
- `lib/repositories/personnel/education.repo.ts`
- `lib/repositories/personnel/family.repo.ts`

---

## 10. Phase triển khai cho Claude

### Phase 1
- schema CareerHistory, EducationHistory, FamilyMember

### Phase 2
- CRUD APIs + repositories + services

### Phase 3
- UI timeline / tables / forms

---

## 11. Notes for Claude

- Timeline công tác phải ưu tiên UX rõ ràng theo thời gian
- Education và Family phải phục vụ trực tiếp profile360
- Dùng lookup M19 thay vì enum hard-code nếu category đã sẵn