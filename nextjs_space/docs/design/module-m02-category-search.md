# MODULE M02 – CATEGORY-SPECIFIC PROFILE & TALENT SEARCH
# UC-13, UC-14

---

## 1. Mục tiêu

Xây dựng:
- quản lý hồ sơ theo loại cán bộ,
- engine quy hoạch và tìm kiếm nguồn cán bộ,
- dashboard tìm nguồn theo tiêu chí tổ chức, học vấn, đơn vị, công tác, khoa học.

---

## 2. Use Cases liên quan

### UC-13 – Quản lý hồ sơ theo loại cán bộ
Hồ sơ hiển thị / validate khác nhau theo loại:
- sĩ quan
- QNCN
- HSQ chiến sĩ
- học viên quân sự
- CNVCQP
- sinh viên dân sự
- giảng viên

### UC-14 – Engine quy hoạch & tìm kiếm nguồn cán bộ
Tìm kiếm theo:
- quân hàm / chức vụ
- đơn vị
- trình độ học vấn / học vị
- chuyên ngành
- lý luận chính trị
- lịch sử công tác
- thành tích khoa học
- nhóm tuổi / năm công tác
- điều kiện quy hoạch theo quy tắc

---

## 3. Business Logic

### 3.1. Category-specific profile
Mỗi `PersonnelCategory` có:
- field bắt buộc khác nhau,
- layout tab khác nhau,
- validation khác nhau,
- khả năng hiển thị khác nhau.

Ví dụ:
- học viên quân sự: ưu tiên đào tạo, kết quả học tập, hệ đào tạo
- giảng viên: ưu tiên học hàm, học vị, giờ giảng, nghiên cứu
- sĩ quan: ưu tiên quân hàm, chức vụ, đơn vị, quá trình công tác
- CNVCQP: ưu tiên chức danh nghề nghiệp, ngạch bậc

### 3.2. Talent search / planning
Engine phải hỗ trợ filter nhiều chiều và ranking ứng viên theo rule:
- đủ điều kiện cứng
- điểm phù hợp
- khoảng trống cần đào tạo bổ sung

---

## 4. Data / scoring inputs

Nguồn dữ liệu đầu vào:
- Personnel
- CareerHistory
- EducationHistory
- ScientificProfile
- PartyMember nếu cần theo scope cho phép
- Reward/Discipline nếu rule nghiệp vụ cần
- FacultyProfile nếu là nhóm giảng viên

---

## 5. Search API

### GET `/api/personnel/search`
Filter:
- keyword
- category
- unitId
- rank
- position
- degree
- major
- academicTitle
- politicalTheory
- ageRange
- serviceYears
- hasResearch
- page
- pageSize

### POST `/api/personnel/talent-search`
Mục đích:
- tìm nguồn cán bộ theo job target / planning requirement

Request ví dụ:
```json
{
  "targetPosition": "Chu nhiem Khoa",
  "requiredUnitId": "unit_x",
  "requiredDegree": "TS",
  "requiredPoliticalTheory": "CAO_CAP",
  "requiredServiceYearsMin": 8,
  "preferredMajor": ["Hau can QS", "Kinh te QP"]
}

Response:

danh sách ứng viên
score
matched criteria
missing criteria
6. UI / Pages
Pages
app/dashboard/personnel/search/page.tsx
app/dashboard/personnel/planning/page.tsx
Components
components/personnel/search/personnel-search-filter.tsx
components/personnel/search/personnel-search-result-table.tsx
components/personnel/search/talent-ranking-panel.tsx
components/personnel/profile/category-specific-sections.tsx
7. Kiến trúc code
Services
lib/services/personnel/personnel-search.service.ts
lib/services/personnel/personnel-planning.service.ts
Repositories
lib/repositories/personnel/personnel-search.repo.ts
Validators
lib/validators/personnel/personnel-search.schema.ts
8. Business Rules
Search phải tôn trọng scope của M01
Không hiển thị dữ liệu nhạy cảm nếu thiếu quyền
Talent ranking chỉ là công cụ hỗ trợ quyết định, không thay quyết định nhân sự
Category-specific layout phải dùng cấu hình hoặc strategy pattern nếu hợp lý, tránh hard-code quá phân tán
9. Validation Rules
category phải đúng enum
page/pageSize hợp lệ
search filter hợp lệ
talent search request phải có ít nhất 1 tiêu chí meaningful
10. Phase triển khai cho Claude
Phase 1
category-specific config / strategy
search API cơ bản
Phase 2
talent search scoring engine
planning UI
Phase 3
tối ưu filter / ranking / profile layout
11. Notes for Claude
Đây không phải chỉ là “search form”
Mục tiêu là hỗ trợ quy hoạch và tìm nguồn cán bộ
Nên chừa abstraction cho scoring rule để điều chỉnh sau

---

# 5) `docs/prompts/m02-prompts.md`

```md
# M02 PROMPTS – BỘ PROMPT CHUẨN CHO MODULE CSDL CÁN BỘ NHÂN SỰ

---

# 1. PROMPT MỞ ĐẦU M02

## 1.1. Đọc overview
```text
Đọc:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m02-overview.md

Chưa code.

Hãy tóm tắt:
1. Vai trò của M02 trong toàn hệ thống
2. 6 use case của M02
3. Vì sao M02 là master data nguồn cho nhiều module
4. M02 aggregate dữ liệu từ những module nào
5. M19 hỗ trợ gì cho M02
6. Thứ tự phase triển khai hợp lý
1.2. Mapping codebase
Đọc:
- docs/design/module-m02-overview.md
- docs/design/module-m02-profile360.md
- docs/design/module-m02-career-family-academic.md
- docs/design/module-m02-category-search.md

Chưa code.

Hãy:
1. Mapping M02 vào codebase hiện tại
2. Liệt kê file cần tạo/sửa
3. Chỉ ra điểm nào phải tái sử dụng User/Unit hiện có
4. Nêu chỗ nào phải tích hợp M01/M19
5. Chia phase triển khai