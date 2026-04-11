Dưới đây là nội dung đầy đủ cho file **`system-extension-science-domain.md`** để anh copy dùng ngay. Nội dung này được viết theo hướng: **giữ kiến trúc nền HVHC BigData hiện có**, đồng thời **bổ sung lớp mở rộng miền nghiên cứu khoa học M20–M26**; không thay thế các module nền M01, M02, M13, M18, M19 đã được xác lập trong system docs.   

```md
# SYSTEM EXTENSION – SCIENCE DOMAIN
# HVHC BIGDATA / SCIENCE DOMAIN EXTENSION ARCHITECTURE

---

## 1. Mục tiêu tài liệu

Tài liệu này mô tả lớp mở rộng kiến trúc cho **miền nghiên cứu khoa học** trong hệ thống HVHC BigData.

Mục tiêu:
- xác định rõ phạm vi của **science domain extension**,
- chuẩn hóa hệ mã module mới **M20–M26**,
- tránh nhầm lẫn với numbering cũ của các tài liệu thiết kế khoa học trước đây,
- bảo đảm mọi phát triển mới của miền nghiên cứu khoa học **đặt trên nền kiến trúc gốc** của HVHC BigData,
- quy định rõ module nào là **module nền tái sử dụng bắt buộc**,
- giúp Claude và đội phát triển không thiết kế science domain như một hệ thống tách rời.

Tài liệu này **không thay thế**:
- `system-overview.md`
- `system-module-map.md`
- `system-integration-map.md`

Tài liệu này là **extension layer** cho kiến trúc hệ thống.

---

## 2. Nguyên tắc kiến trúc tổng quát

### 2.1. Science domain là lớp mở rộng, không phải hệ thống mới
Miền nghiên cứu khoa học được phát triển như một **domain extension** của HVHC BigData.

Điều đó có nghĩa:
- science domain dùng chung nền bảo mật, workflow, export, master data của toàn hệ thống,
- science domain không được tự tạo lại auth riêng,
- science domain không được tự tạo workflow engine riêng,
- science domain không được tự tạo export/report engine riêng,
- science domain không được tự tạo hệ master data/catalog riêng tách khỏi toàn hệ thống.

### 2.2. Kiến trúc gốc vẫn là source of truth nền tảng
Các file system docs hiện có vẫn là source of truth cho:
- cấu trúc thư mục project,
- triết lý module nền,
- nguyên tắc phụ thuộc module,
- nguyên tắc tích hợp,
- chuẩn code toàn hệ thống.

Science domain phải **bám nền này**, không được phá vỡ nó.

### 2.3. Hệ mã module mới cho science domain
Từ thời điểm này, miền nghiên cứu khoa học dùng **duy nhất** hệ mã mới:

- **M20** — Science Activities
- **M21** — Science Resources
- **M22** — Science Data Hub
- **M23** — Science Councils & Evaluation
- **M24** — Science Budgets
- **M25** — Science Works & Library
- **M26** — Science Search, AI & Reports

### 2.4. Không dùng lại mã cũ của thiết kế khoa học trước đây cho code mới
Nếu các tài liệu cũ của miền khoa học dùng numbering khác, Claude và đội phát triển phải:
- **không** dùng lại numbering cũ đó trong code mới,
- chỉ map **ý nghĩa nghiệp vụ** từ tài liệu cũ sang các module M20–M26,
- ưu tiên giữ nhất quán module code mới trong:
  - design docs mới,
  - prompt pack,
  - backlog,
  - task list,
  - implementation notes,
  - code comments,
  - review notes.

---

## 3. Module nền bắt buộc tái sử dụng

Science domain extension bắt buộc tái sử dụng các module nền sau:

### 3.1. M01 — Security Platform
M01 cung cấp:
- auth,
- RBAC,
- function code,
- scope,
- audit,
- session,
- SSO,
- security hardening.

Mọi API nghiệp vụ của science domain phải đi qua logic quyền của M01.

### 3.2. M02 — Personnel Core
M02 là nguồn dữ liệu người dùng, nhân sự, đơn vị.

Science domain phải dùng M02 cho:
- nhà khoa học,
- chủ nhiệm đề tài,
- thành viên nghiên cứu,
- chuyên gia,
- cán bộ tham gia hội đồng,
- đơn vị chủ trì,
- đơn vị phối hợp.

### 3.3. M13 — Workflow Platform
M13 là workflow engine dùng chung của hệ thống.

Science domain phải dùng M13 cho:
- luồng đề xuất,
- thẩm định,
- phê duyệt,
- giao thực hiện,
- nghiệm thu,
- công nhận kết quả,
- phê duyệt ngân sách,
- phê duyệt các action quản trị chất lượng dữ liệu nếu cần.

Không được tạo workflow engine riêng trong M20–M26 nếu M13 có thể đáp ứng.

### 3.4. M18 — Export & Template Platform
M18 là single source of truth cho:
- export docx/xlsx/pdf,
- template versioning,
- report rendering,
- batch export,
- scheduled export,
- internal render cho workflow/AI.

Science domain phải dùng M18 cho:
- biểu mẫu BQP,
- hồ sơ nhà khoa học,
- báo cáo khoa học,
- biên bản hội đồng,
- báo cáo dữ liệu khoa học,
- xuất kết quả tra cứu,
- báo cáo AI nếu có đầu ra tài liệu.

### 3.5. M19 — Master Data Platform
M19 là nguồn chuẩn hóa:
- lookup,
- category,
- item,
- cây danh mục,
- config dùng chung,
- cache master data,
- change log/sync log master data.

Science domain phải dùng M19 cho:
- lĩnh vực nghiên cứu,
- cấp đề tài,
- loại hồ sơ,
- loại công trình,
- nhà xuất bản,
- loại tạp chí,
- nguồn kinh phí,
- loại hội đồng,
- loại vai trò hội đồng,
- loại trạng thái chuẩn hóa,
- mọi dropdown/filter có bản chất master data.

Không hard-code enum tại UI/API nếu M19 đã có category phù hợp.

---

## 4. Danh mục module science domain extension

### 4.1. M20 — Science Activities
M20 là module quản lý **toàn bộ vòng đời hồ sơ hoạt động khoa học**.

Phạm vi chính:
- cổng đề xuất hồ sơ khoa học,
- tiếp nhận và sơ kiểm,
- thẩm định và phê duyệt,
- giao thực hiện,
- theo dõi tiến độ,
- kiểm tra giữa kỳ,
- nghiệm thu,
- công nhận kết quả,
- lưu trữ hồ sơ.

Bản chất:
- module nghiệp vụ lõi,
- lifecycle-heavy,
- phụ thuộc mạnh vào workflow,
- phụ thuộc mạnh vào audit,
- phụ thuộc vào M23, M24, M25, M26.

### 4.2. M21 — Science Resources
M21 là module quản lý **tiềm lực khoa học**.

Phạm vi chính:
- hồ sơ nhà khoa học,
- năng lực đơn vị khoa học,
- nguồn chuyên gia,
- chỉ số tiềm lực và năng lực khoa học.

Bản chất:
- nguồn dữ liệu nghiệp vụ cho các module khoa học khác,
- phụ thuộc mạnh vào M02,
- có aggregate và analytics,
- không được nhân đôi dữ liệu nhân sự.

### 4.3. M22 — Science Data Hub
M22 là module quản lý **kho dữ liệu khoa học hợp nhất**.

Phạm vi chính:
- dashboard dữ liệu khoa học,
- hồ sơ dữ liệu hợp nhất,
- danh mục khoa học dưới dạng namespace nghiệp vụ,
- theo dõi chất lượng dữ liệu,
- cảnh báo dữ liệu thiếu/trùng/lỗi,
- các aggregate view khoa học.

Bản chất:
- data hub ở cấp domain,
- không phải database tách rời khỏi hệ thống,
- không được trở thành source of truth song song với module gốc.

### 4.4. M23 — Science Councils & Evaluation
M23 là module quản lý **hội đồng khoa học và đánh giá**.

Phạm vi chính:
- thành lập hội đồng,
- phân công thành viên,
- phân công phản biện,
- phản biện kín,
- bỏ phiếu,
- kết luận,
- biên bản họp,
- hỗ trợ đánh giá nghiệm thu.

Bản chất:
- module nhạy cảm cao,
- liên quan trực tiếp đến M20 và M21,
- yêu cầu audit, visibility rule, closed review.

### 4.5. M24 — Science Budgets
M24 là module quản lý **kinh phí khoa học**.

Phạm vi chính:
- dự toán,
- phê duyệt kinh phí,
- giải ngân,
- theo dõi kế hoạch/thực tế,
- cảnh báo vượt ngưỡng,
- hỗ trợ quyết toán trong lifecycle hồ sơ khoa học.

Bản chất:
- module nghiệp vụ tài chính nội bộ của science domain,
- phụ thuộc chặt vào M20,
- phải tách business calculation vào service layer.

### 4.6. M25 — Science Works & Library
M25 là module quản lý **công trình khoa học và thư viện số khoa học**.

Phạm vi chính:
- bài báo,
- giáo trình,
- sách,
- chuyên khảo,
- metadata công trình,
- DOI/ISBN/ISSN,
- import metadata,
- duplicate check công trình,
- thư viện số,
- tài liệu khoa học,
- analytics khai thác tài liệu.

Bản chất:
- nguồn tri thức tích lũy,
- phục vụ M21, M22, M26,
- có tích hợp storage/search/metadata.

### 4.7. M26 — Science Search, AI & Reports
M26 là module quản lý **tra cứu, AI và báo cáo cho science domain**.

Phạm vi chính:
- tìm kiếm keyword/full-text/semantic/hybrid,
- lưu bộ lọc tra cứu,
- chatbot/RAG trên dữ liệu khoa học,
- summarize,
- research trends,
- duplicate check ở cấp toàn miền,
- báo cáo hoạt động khoa học,
- báo cáo tiềm lực,
- báo cáo động theo bộ lọc,
- generate biểu mẫu qua M18.

Bản chất:
- lớp tăng cường,
- không phải source of truth dữ liệu gốc,
- phải tôn trọng scope, sensitivity, approved-data rules.

---

## 5. Phân tầng của science domain trong kiến trúc tổng thể

Science domain extension được xem như **tầng mở rộng nghiệp vụ chuyên sâu** nằm trên nền HVHC BigData.

### 5.1. Tầng nền tái sử dụng
- M01 Security
- M02 Personnel
- M13 Workflow
- M18 Export
- M19 Master Data

### 5.2. Tầng nghiệp vụ khoa học
- M20 Science Activities
- M21 Science Resources
- M23 Science Councils & Evaluation
- M24 Science Budgets
- M25 Science Works & Library

### 5.3. Tầng dữ liệu hợp nhất và tăng cường
- M22 Science Data Hub
- M26 Science Search, AI & Reports

---

## 6. Phụ thuộc chuẩn giữa các module M20–M26

### 6.1. M20 phụ thuộc vào
- **M01**: auth, scope, audit
- **M02**: chủ nhiệm, thành viên, đơn vị
- **M13**: workflow lifecycle
- **M18**: biểu mẫu/quyết định/báo cáo hồ sơ
- **M19**: loại hồ sơ, cấp đề tài, trạng thái chuẩn hóa
- **M23**: hội đồng thẩm định/nghiệm thu
- **M24**: ngân sách khoa học
- **M25**: công trình/sản phẩm đầu ra
- **M26**: duplicate/trends/reporting/search support

### 6.2. M21 phụ thuộc vào
- **M01**: auth/scope/audit
- **M02**: nhân sự và đơn vị nguồn
- **M18**: export hồ sơ
- **M19**: danh mục học vị, học hàm, lĩnh vực, loại đơn vị, loại chuyên gia

### 6.3. M22 phụ thuộc vào
- **M01**: security/scope
- **M18**: export/report
- **M19**: danh mục và namespace khoa học
- dữ liệu nguồn từ:
  - M20
  - M21
  - M23
  - M24
  - M25

### 6.4. M23 phụ thuộc vào
- **M01**: auth/audit
- **M13**: workflow integration
- **M18**: biên bản/quyết định
- **M21**: nguồn chuyên gia
- **M20**: hồ sơ được đưa vào thẩm định/nghiệm thu

### 6.5. M24 phụ thuộc vào
- **M01**: auth/audit
- **M18**: biểu mẫu/báo cáo kinh phí
- **M19**: nguồn kinh phí, loại ngân sách, hạng mục
- **M20**: đề tài/hồ sơ khoa học được gắn kinh phí

### 6.6. M25 phụ thuộc vào
- **M01**: auth/access control
- **M18**: export hồ sơ công trình/tài liệu
- **M19**: loại công trình, loại tài liệu, NXB, tạp chí
- **M21**: tác giả/nhà khoa học
- storage, indexing, metadata services theo kiến trúc nền

### 6.7. M26 phụ thuộc vào
- **M01**: scope/sensitivity/access control
- **M18**: report/export
- **M19**: filter/master data
- **M22**: data hub và aggregate views
- **M20/M21/M23/M24/M25**: dữ liệu nguồn nghiệp vụ
- AI/integration layer dùng chung của toàn hệ thống nếu có

---

## 7. Quy tắc tích hợp bắt buộc

### 7.1. Không bypass module nền
Science domain không được:
- tự hard-code quyền ở module nghiệp vụ,
- tự hard-code lookup ở module nghiệp vụ,
- tự viết export engine riêng,
- tự viết workflow engine riêng,
- tự tạo person master riêng,
- tự tạo catalog engine riêng.

### 7.2. Nguồn dữ liệu gốc phải rõ
Trong science domain, nguồn dữ liệu gốc được hiểu như sau:
- auth/scope/audit: **M01**
- personnel/unit backbone: **M02**
- workflow: **M13**
- export/template/report rendering: **M18**
- master data/catalog/lookup: **M19**
- science activities lifecycle: **M20**
- science resources/source entities: **M21**
- councils/evaluation records: **M23**
- budgets: **M24**
- works/library/knowledge assets: **M25**
- aggregate science hub views: **M22**
- search/AI/reporting orchestration: **M26**

### 7.3. Tích hợp phải qua boundary rõ ràng
Mọi tích hợp giữa M20–M26 với module nền phải đi qua:
- internal API,
- service adapter,
- integration service,
- repository boundary rõ ràng nếu là data access nội bộ.

Không được trộn business logic lớn trực tiếp trong UI hoặc route handler.

---

## 8. Cấu trúc route UI chuẩn cho science domain

Science domain dùng route group riêng trong `app/`:

### 8.1. M20 — Science Activities
- `app/(dashboard)/science/activities/proposals/`
- `app/(dashboard)/science/activities/intake/`
- `app/(dashboard)/science/activities/review/`
- `app/(dashboard)/science/activities/execution/`
- `app/(dashboard)/science/activities/progress/`
- `app/(dashboard)/science/activities/acceptance/`
- `app/(dashboard)/science/activities/archive/`

### 8.2. M21 — Science Resources
- `app/(dashboard)/science/resources/scientists/`
- `app/(dashboard)/science/resources/units/`
- `app/(dashboard)/science/resources/experts/`
- `app/(dashboard)/science/resources/capacity/`

### 8.3. M22 — Science Data Hub
- `app/(dashboard)/science/database/overview/`
- `app/(dashboard)/science/database/records/`
- `app/(dashboard)/science/database/catalogs/`
- `app/(dashboard)/science/database/quality/`

### 8.4. M23 — Science Councils & Evaluation
- `app/(dashboard)/science/activities/councils/`

### 8.5. M24 — Science Budgets
- dùng trong:
  - `app/(dashboard)/science/activities/execution/`
  - `app/(dashboard)/science/activities/progress/`

### 8.6. M25 — Science Works & Library
- `app/(dashboard)/science/resources/works/`
- `app/(dashboard)/science/resources/library/`

### 8.7. M26 — Science Search, AI & Reports
- `app/(dashboard)/science/database/search/`
- `app/(dashboard)/science/database/ai-tools/`
- `app/(dashboard)/science/database/reports/`

---

## 9. Quy tắc phát triển bằng Claude cho science domain

### 9.1. Mỗi module M20–M26 phải có docs riêng
Tối thiểu mỗi module phải có:
- 1 overview
- 1 core/detail file
- 1 prompt pack

Module lớn phải có thêm:
- workflow/lifecycle docs
- integration docs
- report/search/AI docs nếu cần

### 9.2. Claude phải làm theo phase hoặc sprint
Mỗi module M20–M26 phải đi theo nhịp:
1. đọc docs
2. mapping vào codebase hiện có
3. schema
4. validators
5. repositories/services
6. API
7. UI
8. review
9. hardening

Nếu dùng sprint pack, Claude phải:
- chỉ làm đúng sprint hiện tại,
- không lấn sprint khác,
- self-review trước khi sang sprint sau.

### 9.3. Không code cả science domain bằng một prompt ngắn
Science domain có nhiều phụ thuộc nền và nhiều ràng buộc tích hợp.

Không được:
- giao một prompt ngắn yêu cầu “làm toàn bộ M20–M26”,
- để Claude tự quyết module boundary mà không có docs,
- để Claude dựng song song nền auth/workflow/export/master data.

---

## 10. Quy tắc migration khi science domain chồng với logic cũ

Nếu science domain mở rộng có overlap với module cũ:
- không drop model/field/route cũ ngay,
- không rewrite ồ ạt,
- phải xác định:
  - current state,
  - target state,
  - compatibility plan,
  - migration steps,
  - rollback thinking.

### 10.1. Ưu tiên reuse hơn replace
Nếu một phần logic cũ dùng được:
- ưu tiên reuse,
- nếu thiếu thì extend,
- chỉ tạo mới hoàn toàn khi domain mới thực sự khác biệt.

### 10.2. Không tạo source of truth song song quá lâu
Có thể coexist tạm thời, nhưng phải xác định rõ:
- cái nào là dữ liệu nguồn,
- cái nào là aggregate,
- cái nào là adapter tạm,
- khi nào deprecate.

---

## 11. Ưu tiên triển khai đề xuất cho science domain

### Giai đoạn 1 — nền domain khoa học
- M20
- M21
- M23

### Giai đoạn 2 — nguồn lực và tài sản khoa học
- M24
- M25

### Giai đoạn 3 — hợp nhất dữ liệu và tăng cường
- M22
- M26

Lý do:
- cần nguồn hoạt động và nguồn lực trước,
- cần hội đồng và ngân sách để lifecycle vận hành đủ chiều sâu,
- cần works/library để có tài sản tri thức,
- sau đó mới xây data hub, search, AI, reports trên dữ liệu đã hình thành.

---

## 12. Notes for Claude

- Science domain extension là lớp mở rộng **trên nền HVHC BigData**, không phải hệ thống mới.
- Khi làm M20–M26, luôn kiểm tra phụ thuộc vào M01/M02/M13/M18/M19 trước.
- Không dùng mã cũ của thiết kế khoa học trước đây cho code mới.
- Không coi M22 là source of truth độc lập nếu thực tế nó chỉ là aggregate hub.
- Không tự dựng export engine, workflow engine, master data engine, auth engine trong science domain.
- Không thiết kế science domain theo kiểu self-contained giả tạo nếu thực tế nó phụ thuộc mạnh vào nền hệ thống.
- Mọi quyết định thiết kế của science domain phải ưu tiên:
  1. đúng nền kiến trúc,
  2. đúng dữ liệu nguồn,
  3. đúng tích hợp,
  4. đúng bảo mật,
  5. đúng khả năng rollout dài hạn.
```

Nếu anh muốn, tôi viết tiếp luôn cho anh **đoạn chèn bổ sung vào `system-module-map.md`** và **`system-integration-map.md`** để bộ tài liệu đồng bộ hoàn toàn.
