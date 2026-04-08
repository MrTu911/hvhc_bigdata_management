# MODULE M02 – PROFILE 360 & PERSONNEL MASTER
# UC-09, UC-11, một phần UC-13

---

## 1. Mục tiêu

Xây dựng:
- bảng Personnel master,
- hồ sơ cán bộ 360°,
- lý lịch khoa học và thành tích học thuật,
- giao diện hồ sơ hợp nhất từ nhiều module nguồn.

Đây là phần trung tâm của M02.

---

## 2. Use Cases liên quan

### UC-09 – Hồ sơ cán bộ 360°
- hiển thị một hồ sơ duy nhất từ nhiều nguồn
- thay cho việc tra cứu rời rạc nhiều nơi
- hỗ trợ xuất mẫu 2A-LLĐV

### UC-11 – Lý lịch khoa học & thành tích học thuật
- học hàm / học vị
- công bố
- đề tài
- hướng nghiên cứu
- H-index và thông tin khoa học nếu có

### UC-13 – Quản lý hồ sơ theo loại cán bộ
- hồ sơ hiển thị khác nhau theo phân loại cán bộ
- dùng cùng nền Personnel nhưng có logic hiển thị / validate khác nhau

---

## 3. Data Model

### 3.1. Personnel

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| personnelCode | string | yes | mã cán bộ nội bộ |
| militaryIdNumber | string | no | mã định danh quân nhân |
| citizenId | string | no | CCCD |
| officerCardNo | string | no | số thẻ sĩ quan |
| taxCode | string | no | mã số thuế |
| fullName | string | yes | họ tên |
| fullNameEn | string | no | họ tên tiếng Anh |
| dateOfBirth | DateTime | no | ngày sinh |
| gender | Gender | yes | giới tính |
| bloodType | BloodType | no | nhóm máu |
| ethnicity | string | no | dân tộc |
| religion | string | no | tôn giáo |
| placeOfOrigin | string | no | quê quán |
| birthPlace | string | no | nơi sinh |
| permanentAddress | string | no | thường trú |
| temporaryAddress | string | no | tạm trú |
| category | PersonnelCategory | yes | loại cán bộ |
| managingOrgan | ManagingOrgan | yes | cơ quan quản lý |
| rank | string | no | quân hàm |
| rankDate | DateTime | no | ngày phong / thăng |
| position | string | no | chức vụ hiện tại |
| positionDate | DateTime | no | ngày bổ nhiệm |
| unitId | string | no | FK Unit |
| enlistmentDate | DateTime | no | ngày nhập ngũ |
| serviceYears | int | no | số năm công tác |
| politicalTheory | string | no | lý luận chính trị |
| education | string | no | học vấn |
| specialization | string | no | chuyên ngành |
| academicTitle | string | no | học hàm |
| academicDegree | string | no | học vị |
| academicDegreeMajor | string | no | chuyên ngành bằng cao nhất |
| academicDegreeYear | int | no | năm cấp bằng |
| partyJoinDate | DateTime | no | ngày vào Đảng dự bị |
| partyOfficialDate | DateTime | no | ngày chính thức |
| partyPosition | string | no | chức vụ Đảng |
| workStatus | WorkStatus | yes | trạng thái công tác |
| workStatusDate | DateTime | no | ngày đổi trạng thái |
| createdAt | DateTime | yes | tạo |
| updatedAt | DateTime | yes | cập nhật |

### 3.2. ScientificProfile
Nếu đã tách thành bảng riêng:
- hIndex
- publicationCount
- mainResearchFields
- notableWorks
- researchKeywords
- biography khoa học

Nếu hệ thống chọn aggregate từ M09 nhiều hơn, `ScientificProfile` có thể chỉ giữ phần bổ sung cục bộ.

---

## 4. Hồ sơ 360° – Nguồn dữ liệu hợp nhất

Hồ sơ 360° phải có các tab:

### 4.1. Thông tin cơ bản
Nguồn:
- Personnel (M02)

### 4.2. Học vấn & đào tạo
Nguồn:
- EducationHistory (M02)

### 4.3. Lịch sử công tác
Nguồn:
- CareerHistory (M02)

### 4.4. Đảng viên
Nguồn:
- PartyMember (M03)

### 4.5. Khen thưởng
Nguồn:
- RewardRecord (M05)

### 4.6. Kỷ luật
Nguồn:
- DisciplineRecord (M05)

### 4.7. Bảo hiểm
Nguồn:
- InsuranceProfile (M05)

### 4.8. Phụ cấp
Nguồn:
- AllowanceRecord (M05)

### 4.9. Lý lịch khoa học
Nguồn:
- ScientificProfile (M02 + M09)
- ResearchMember / ResearchProject (M09)

### 4.10. Gia đình
Nguồn:
- FamilyMember (M02)

### 4.11. Giảng dạy
Nguồn:
- FacultyProfile (M07)

---

## 5. API hồ sơ 360°

### GET `/api/personnel/[id]/profile360`

Yêu cầu:
- kiểm tra `checkScopeAccess(requesterId, personnelId, 'PERSONNEL.VIEW')`
- kiểm tra quyền xem trường nhạy cảm `PERSONNEL.SENSITIVE`
- aggregate đa nguồn bằng service layer
- optimize bằng `Promise.all`

Response:
```json
{
  "success": true,
  "data": {
    "personnel": {},
    "careerHistory": [],
    "educationHistory": [],
    "familyMembers": [],
    "partyMember": {},
    "rewards": [],
    "disciplines": [],
    "insurance": {},
    "allowances": [],
    "scientificProfile": {},
    "researchProjects": [],
    "facultyProfile": {},
    "warnings": []
  },
  "error": null
}

6. Business Rules
personnelCode unique
militaryIdNumber unique nếu có
citizenId phải hợp lệ theo rule hệ thống
profile360 không được lộ trường nhạy cảm nếu thiếu quyền
nếu module ngoài chưa triển khai, profile360 phải degrade gracefully
phân loại hồ sơ khác nhau theo PersonnelCategory
7. Validation Rules
fullName, category, managingOrgan, gender bắt buộc
unitId phải tồn tại nếu có
academicDegreeYear hợp lệ
serviceYears không âm
các lookup text nên dần thay bằng category code từ M19
8. UI / Pages
Pages
app/dashboard/personnel/[id]/page.tsx
app/dashboard/personnel/[id]/profile360/page.tsx
Components
components/personnel/profile/personnel-summary-card.tsx
components/personnel/profile/personnel-tabs.tsx
components/personnel/profile/scientific-profile-panel.tsx
components/personnel/profile/sensitive-fields-guard.tsx
9. Kiến trúc code
API
app/api/personnel/[id]/route.ts
app/api/personnel/[id]/profile360/route.ts
Services
lib/services/personnel/personnel-profile.service.ts
lib/services/personnel/personnel-profile360.service.ts
Repositories
lib/repositories/personnel/personnel.repo.ts
10. Phase triển khai cho Claude
Phase 1
schema Personnel + ScientificProfile
Phase 2
CRUD personnel + basic detail API
Phase 3
profile360 aggregate service + API
Phase 4
profile360 UI tabs
11. Notes for Claude
Profile360 là aggregate đa module, không chỉ là include từ một bảng
Phải chừa integration points với M03, M05, M07, M09
Nếu các module đó chưa xong, dùng adapter boundary rõ ràng