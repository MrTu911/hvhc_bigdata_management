# SYSTEM INTEGRATION MAP – HVHC BIGDATA

---

## 1. Mục tiêu tài liệu

Tài liệu này mô tả:
- luồng tích hợp giữa các module,
- module nào gọi module nào,
- dữ liệu nào là nguồn gốc,
- tích hợp nào là bắt buộc,
- ranh giới giữa module hạ tầng và module nghiệp vụ.

Tài liệu này giúp Claude không thiết kế module theo kiểu cô lập sai thực tế.

---

## 2. Sơ đồ tích hợp tổng thể

```text
M01 Security / RBAC / Scope / Audit
   ├── cấp auth + function code + scope cho toàn bộ hệ thống
   │
   ├── M19 Master Data
   │     ├── cấp lookup/category/config cho M01–M17, M18, M09, M10
   │     └── cấp useMasterData + MasterDataSelect
   │
   ├── M02 Personnel Master
   │     ├── cấp User / Personnel / Unit cho các module nghiệp vụ
   │     └── aggregate profile360 từ M03, M05, M09, M07...
   │
   ├── M13 Workflow Engine
   │     ├── state machine
   │     ├── workflow designer
   │     ├── approval
   │     └── gắn vào M03, M05, M09, M10...
   │
   └── M18 Template / Export
         ├── render report/template cho nhiều module
         ├── internal render cho AI/chatbot/workflow
         └── lấy dữ liệu từ M02–M17 qua resolver/API nội bộ

3. Luồng tích hợp chính
3.1. M01 → toàn hệ thống

M01 cung cấp:

xác thực người dùng,
RBAC function code,
scope kiểm soát dữ liệu,
audit log,
session control,
MFA/OTP,
SSO.

Mọi API nghiệp vụ phải đi qua logic quyền của M01.

3.2. M19 → toàn hệ thống

M19 cung cấp:

danh mục lookup dùng chung,
category/item APIs,
tree data cho danh mục phân cấp,
Redis cache cho lookup,
shared hook useMasterData,
shared component MasterDataSelect.

Mục tiêu là các module không còn hard-code enum ở UI/API.

3.3. M02 → toàn hệ thống nghiệp vụ

M02 cung cấp:

User
Personnel
Unit
career history
education history
family members
scientific profile nguồn
các dữ liệu master về nhân sự

Các module nghiệp vụ khác FK hoặc reference về M02.

4. Tích hợp theo cặp module
4.1. M01 ↔ M02

M01 dùng M02

map user ↔ personnel nếu hệ thống định danh dùng personnelId
map unit / position / department

M02 dùng M01

scope check trên profile360
quyền xem dữ liệu nhạy cảm
audit xem hồ sơ
4.2. M01 ↔ M13

M13 dùng M01

kiểm tra actor permission theo role/position/function/scope
audit hành động phê duyệt

M01 dùng M13

không bắt buộc trực tiếp, nhưng các audit/wf action có thể ghi log chung
4.3. M01 ↔ M18

M18 dùng M01

RBAC cho export
scope dữ liệu khi render
auth cho internal APIs

M01 dùng M18

có thể dùng M18 để xuất audit/report bảo mật sau này
4.4. M01 ↔ M19

M01 dùng M19

scope level lookup
system config lookup
một số category chung

M19 dùng M01

admin auth
audit log
quyền quản trị danh mục
4.5. M02 ↔ M03

M03 dùng M02

User / Personnel / Unit là nguồn định danh đảng viên
CareerHistory để xác minh quá trình hoạt động
Đơn vị quân sự gắn với tổ chức Đảng

M02 dùng M03

profile360 hiển thị dữ liệu đảng viên
4.6. M02 ↔ M05

M05 dùng M02

hồ sơ nhân sự, đơn vị, thâm niên, loại quân nhân
eligibility theo nhân sự

M02 dùng M05

profile360 hiển thị khen thưởng, kỷ luật, bảo hiểm, phụ cấp
4.7. M02 ↔ M09

M09 dùng M02

PI, thành viên nghiên cứu, đơn vị chủ trì
học hàm, học vị, chuyên ngành từ nguồn nhân sự

M02 dùng M09

profile360 hiển thị lý lịch khoa học, đề tài, công bố
4.8. M02 ↔ M10

M10 dùng M02

giảng viên, cán bộ quản lý đào tạo
đơn vị, học vị, học hàm
có thể gắn cán bộ với người học trong vài quy trình

M02 dùng M10

profile360 có thể hiển thị dữ liệu giảng dạy/đào tạo nếu áp dụng
4.9. M13 ↔ M03

M13 cấp workflow cho:

kết nạp Đảng
chuyển sinh hoạt Đảng
đánh giá, phân loại đảng viên
kiểm tra, kỷ luật nội bộ
4.10. M13 ↔ M05

M13 cấp workflow cho:

phê duyệt khen thưởng
xử lý trợ cấp
hồ sơ chính sách
quy trình kỷ luật hoặc duyệt chế độ nếu có
4.11. M13 ↔ M09

M13 cấp workflow cho:

đề xuất đề tài
thẩm định / phê duyệt
nghiệm thu đề tài
các phiên review / hội đồng
4.12. M13 ↔ M10

M13 cấp workflow cho:

bảo lưu / thôi học
xét tốt nghiệp
phê duyệt điểm
cấp chứng chỉ
phúc khảo
các quy trình đào tạo khác
4.13. M18 ↔ M02–M17

M18 lấy dữ liệu nguồn từ các module nghiệp vụ qua:

internal API
service adapter
multi-source resolver

M18 không sở hữu dữ liệu nghiệp vụ gốc, chỉ render từ nguồn khác.

4.14. M18 ↔ M10 / M13 / M15

M10 dùng M18

xuất bảng điểm, chứng chỉ, báo cáo đào tạo

M13 dùng M18

xuất quyết định, biểu mẫu workflow

M15 / chatbot / AI

gọi internal render để sinh tài liệu không qua UI
4.15. M19 ↔ M02

M19 cấp danh mục cho:

học vị, học hàm, ngoại ngữ, tin học, chuyên ngành
loại đơn vị, chức danh nghề nghiệp
nhiều lookup khác cho M02

M02 là nơi dùng lookup nhiều nhất.

4.16. M19 ↔ M03

M19 cấp:

loại tổ chức
trạng thái
danh mục xếp loại
category chính trị / hành chính cần chuẩn hóa nếu thiết kế quyết định dùng lookup
4.17. M19 ↔ M05

M19 cấp:

loại khen thưởng
loại kỷ luật
danh mục chế độ/chính sách
danh mục bảo hiểm, phụ cấp, người có công
4.18. M19 ↔ M09

M19 cấp:

cấp đề tài
lĩnh vực nghiên cứu
học vị / học hàm
danh mục công bố / loại công trình
các danh mục chuẩn hóa khác
4.19. M19 ↔ M10

M19 cấp:

năm học / học kỳ
chuyên ngành đào tạo
hình thức đào tạo
học vị / học hàm
các danh mục chuẩn hóa cho giáo dục đào tạo

## 4.20. Tích hợp cho Science Domain Extension

Science domain extension là lớp mở rộng mới của hệ thống, gồm các module:
- M20 Science Activities
- M21 Science Resources
- M22 Science Data Hub
- M23 Science Councils & Evaluation
- M24 Science Budgets
- M25 Science Works & Library
- M26 Science Search, AI & Reports

Các module này không được hoạt động như một hệ thống độc lập, mà phải tích hợp trên nền:
- M01 Security / RBAC / Scope / Audit
- M02 Personnel Master
- M13 Workflow Engine
- M18 Template / Export
- M19 Master Data

---

### 4.20.1. M20 ↔ M01
**M20 dùng M01**
- xác thực người dùng
- RBAC cho create/update/submit/review/approve/archive
- scope dữ liệu theo đơn vị / vai trò
- audit toàn bộ các action quan trọng

**M01 dùng M20**
- không bắt buộc trực tiếp
- có thể ghi audit/wf actions liên quan hồ sơ khoa học

---

### 4.20.2. M20 ↔ M02
**M20 dùng M02**
- chủ nhiệm đề tài
- thành viên nghiên cứu
- đơn vị chủ trì / phối hợp
- thông tin nhân sự để xác minh hồ sơ

**M02 dùng M20**
- profile360 có thể hiển thị:
  - đề tài
  - sáng kiến
  - công trình
  - lịch sử tham gia nghiên cứu

---

### 4.20.3. M20 ↔ M13
**M20 dùng M13**
- workflow đề xuất
- workflow tiếp nhận / thẩm định / phê duyệt
- workflow nghiệm thu
- workflow công nhận / lưu trữ nếu thiết kế áp dụng

**M13 dùng M20**
- lấy business context cho workflow instances
- có thể render biểu mẫu/quyết định qua M18 dựa trên dữ liệu M20

---

### 4.20.4. M20 ↔ M18
**M20 dùng M18**
- xuất biểu mẫu đề tài
- quyết định giao nhiệm vụ
- báo cáo tiến độ
- hồ sơ nghiệm thu
- báo cáo tổng hợp hồ sơ khoa học

**M18 dùng M20**
- lấy dữ liệu nguồn hồ sơ khoa học để render tài liệu

---

### 4.20.5. M20 ↔ M19
**M20 dùng M19**
- loại hồ sơ khoa học
- cấp đề tài
- lĩnh vực nghiên cứu
- trạng thái chuẩn hóa
- danh mục liên quan workflow/form/filter

**M19 dùng M20**
- không bắt buộc trực tiếp ngoài admin/audit/master data governance

---

### 4.20.6. M20 ↔ M23
**M20 dùng M23**
- lập hội đồng thẩm định
- lập hội đồng nghiệm thu
- nhận kết quả đánh giá hội đồng
- dùng kết luận hội đồng để quyết định bước tiếp theo

**M23 dùng M20**
- lấy hồ sơ khoa học làm đối tượng được đánh giá

---

### 4.20.7. M20 ↔ M24
**M20 dùng M24**
- tạo dự toán gắn hồ sơ khoa học
- phê duyệt kinh phí
- theo dõi giải ngân / sử dụng
- hỗ trợ quyết toán

**M24 dùng M20**
- dùng hồ sơ khoa học làm business object gốc của ngân sách khoa học

---

### 4.20.8. M20 ↔ M25
**M20 dùng M25**
- ghi nhận sản phẩm đầu ra
- liên kết công trình khoa học / tài liệu / sản phẩm
- chuyển kết quả sang kho tri thức nếu cần

**M25 dùng M20**
- liên kết công trình/tài liệu với đề tài, sáng kiến, hồ sơ khoa học

---

### 4.20.9. M21 ↔ M01
**M21 dùng M01**
- auth
- scope dữ liệu nhà khoa học
- audit các chỉnh sửa hồ sơ và chỉ số

**M01 dùng M21**
- không bắt buộc trực tiếp ngoài security/audit

---

### 4.20.10. M21 ↔ M02
**M21 dùng M02**
- reuse dữ liệu cán bộ / đơn vị
- map nhà khoa học với personnel/unit hiện có
- không nhân đôi backbone nhân sự

**M02 dùng M21**
- profile360 có thể hiển thị lý lịch khoa học mở rộng

---

### 4.20.11. M21 ↔ M18
**M21 dùng M18**
- export hồ sơ nhà khoa học
- export báo cáo năng lực đơn vị
- export danh sách chuyên gia

---

### 4.20.12. M21 ↔ M19
**M21 dùng M19**
- học hàm
- học vị
- lĩnh vực nghiên cứu
- loại chuyên gia
- loại đơn vị
- các lookup chuẩn hóa khác

---

### 4.20.13. M21 ↔ M23
**M23 dùng M21**
- lọc chuyên gia đủ điều kiện
- kiểm tra xung đột lợi ích
- chọn thành viên hội đồng phù hợp

**M21 dùng M23**
- có thể tổng hợp lịch sử tham gia hội đồng để làm chỉ số/chỉ báo năng lực

---

### 4.20.14. M22 ↔ M01
**M22 dùng M01**
- scope dữ liệu khi xem dashboard/hồ sơ hợp nhất
- audit với các action quản trị dữ liệu
- kiểm soát truy cập dữ liệu nhạy cảm

---

### 4.20.15. M22 ↔ M18
**M22 dùng M18**
- export dashboard
- export hồ sơ hợp nhất
- export báo cáo chất lượng dữ liệu
- export báo cáo dữ liệu khoa học

---

### 4.20.16. M22 ↔ M19
**M22 dùng M19**
- namespace catalogs khoa học
- filters chuẩn hóa
- lookup cho dashboard, quality, records, reports

---

### 4.20.17. M22 ↔ M20/M21/M23/M24/M25
**M22 dùng các module nguồn**
- M20: hồ sơ khoa học và lifecycle
- M21: nhà khoa học / đơn vị / chuyên gia
- M23: hội đồng / phản biện / đánh giá
- M24: ngân sách khoa học
- M25: công trình / thư viện / tài liệu

**Nguyên tắc**
- M22 là aggregate/data-hub layer
- M22 không sở hữu dữ liệu nghiệp vụ gốc nếu dữ liệu đó đã thuộc module nguồn

---

### 4.20.18. M23 ↔ M01
**M23 dùng M01**
- auth/scope
- audit vote/review/session actions
- visibility control cho closed review

---

### 4.20.19. M23 ↔ M13
**M23 dùng M13**
- gắn action hội đồng vào workflow hồ sơ khoa học nếu cần
- đồng bộ kết quả đánh giá với bước workflow tiếp theo

---

### 4.20.20. M23 ↔ M18
**M23 dùng M18**
- biên bản họp
- kết luận hội đồng
- quyết định liên quan hội đồng nếu cần export/template

---

### 4.20.21. M24 ↔ M01
**M24 dùng M01**
- auth
- scope
- audit approval/disbursement/adjustment

---

### 4.20.22. M24 ↔ M18
**M24 dùng M18**
- dự toán
- phê duyệt kinh phí
- báo cáo sử dụng kinh phí
- báo cáo quyết toán

---

### 4.20.23. M24 ↔ M19
**M24 dùng M19**
- nguồn kinh phí
- loại ngân sách
- loại hạng mục chi
- danh mục cảnh báo/threshold nếu được cấu hình hóa

---

### 4.20.24. M25 ↔ M01
**M25 dùng M01**
- auth/access control
- download permission
- audit upload/update/download nhạy cảm nếu cần

---

### 4.20.25. M25 ↔ M18
**M25 dùng M18**
- export metadata công trình
- export hồ sơ thư viện
- export thống kê tài liệu

---

### 4.20.26. M25 ↔ M19
**M25 dùng M19**
- loại công trình
- loại tài liệu
- NXB
- tạp chí
- lĩnh vực
- mức phân loại chuẩn hóa khác

---

### 4.20.27. M25 ↔ M21
**M25 dùng M21**
- tác giả / đồng tác giả / nhà khoa học
- liên kết công trình với năng lực khoa học cá nhân và đơn vị

---

### 4.20.28. M26 ↔ M01
**M26 dùng M01**
- search scope
- sensitivity control
- AI/report access control
- audit report generation và AI actions nếu policy yêu cầu

---

### 4.20.29. M26 ↔ M18
**M26 dùng M18**
- generate báo cáo
- export kết quả tìm kiếm
- render tài liệu đầu ra của reporting layer

---

### 4.20.30. M26 ↔ M19
**M26 dùng M19**
- filters
- categories
- search facets
- reporting parameters chuẩn hóa

---

### 4.20.31. M26 ↔ M22
**M26 dùng M22**
- unified records
- data hub views
- dashboard/quality context
- aggregate data phục vụ report/AI/search

---

### 4.20.32. M26 ↔ M20/M21/M23/M24/M25
**M26 dùng dữ liệu nguồn**
- M20 cho search/report về hồ sơ khoa học
- M21 cho search/report về nhà khoa học, đơn vị, chuyên gia
- M23 cho report và evaluation insights
- M24 cho report ngân sách
- M25 cho search/AI/report trên công trình và thư viện

**Nguyên tắc**
- M26 là orchestration/search/report/AI layer
- M26 không được trở thành source of truth dữ liệu nghiệp vụ gốc

---

## 4.21. Quy tắc bắt buộc cho Science Domain Extension

### 4.21.1. Không bypass module nền
Các module M20–M26:
- không tự hard-code quyền, phải đi qua M01
- không tự hard-code lookup, phải ưu tiên M19
- không tự viết export engine riêng nếu có thể đi qua M18
- không tự dựng workflow engine riêng nếu đã có M13
- không tự tạo nhân sự/đơn vị master riêng nếu đã có M02

### 4.21.2. Nguồn dữ liệu gốc phải rõ
- auth/scope/audit: M01
- personnel/unit backbone: M02
- workflow: M13
- export/template: M18
- master data: M19
- science lifecycle: M20
- science resources: M21
- councils/evaluation: M23
- budgets: M24
- works/library: M25
- aggregate data hub: M22
- search/AI/report orchestration: M26

### 4.21.3. Không thiết kế science domain theo kiểu self-contained giả tạo
Khi làm M20–M26, Claude luôn phải xác định:
- dữ liệu gốc đến từ đâu,
- phụ thuộc vào M01/M02/M13/M18/M19 ở mức nào,
- có cần hook vào export/workflow/master data hay không.

Nếu thực tế phụ thuộc mạnh vào nền, không được thiết kế như một hệ độc lập.
5. Tích hợp với hệ ngoài
5.1. BQP SSO / Định danh quân nhân

Qua M01:

OIDC / SAML
militaryId
unitCode mapping
5.2. BQP / National master data

Qua M19:

sync category/item
source tracking
sync log
5.3. BQP Research

Qua M09:

liên thông đề tài / nghiệm thu / công bố
5.4. Storage / Queue / Render
MinIO: file template, export file, attachment
Redis/Bull: queue batch export, cache
render adapters: docxtemplater, exceljs, puppeteer
6. Quy tắc tích hợp chuẩn
6.1. Không bypass module nền
Không tự hard-code quyền ở module nghiệp vụ, phải đi qua M01
Không tự hard-code lookup ở module nghiệp vụ, phải ưu tiên M19
Không tự viết export riêng ở module nghiệp vụ nếu có thể đi qua M18
Không tự dựng workflow riêng ở module nghiệp vụ nếu đã có M13
6.2. Nguồn dữ liệu gốc phải rõ
người dùng/cán bộ: M02
RBAC/scope/audit: M01
lookup/master data: M19
workflow: M13
export/template: M18
6.3. Tích hợp phải qua service boundary rõ ràng
internal API
service adapter
repository chỉ dùng trong phạm vi module nếu cần
7. Notes for Claude
Khi làm một module, luôn xác định:
module đó lấy dữ liệu gốc từ đâu,
phụ thuộc vào M01/M02/M13/M18/M19 ở mức nào,
có cần hook vào export/workflow/master data hay không.
Không thiết kế module theo kiểu self-contained giả tạo nếu thực tế nó phụ thuộc mạnh vào module khác.