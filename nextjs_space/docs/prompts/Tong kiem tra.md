Rất đúng lúc. Sau Sprint 13, anh nên chuyển sang 3 việc:

1. **kiểm tra và sửa chữa các điểm còn yếu**,
2. **tạo dữ liệu mẫu đủ sâu để test thật**,
3. **hoàn thiện RBAC theo vai trò và chức vụ**.

Tôi viết cho anh bộ prompt dùng ngay với Claude trong VS Code, theo đúng hướng đó.

---

# I. Trình tự nên làm sau Sprint 13

Đi đúng thứ tự này:

**Bước 1**: kiểm tra kiến trúc và lỗi còn sót
**Bước 2**: sửa lỗi nền tảng
**Bước 3**: tạo dữ liệu mẫu
**Bước 4**: seed RBAC đầy đủ
**Bước 5**: test end-to-end theo vai trò
**Bước 6**: rà lại bảo mật, audit, export, workflow

Không nên làm seed dữ liệu trước khi rà RBAC, vì rất dễ sinh dữ liệu đúng nhưng quyền sai.

---

# II. Prompt tổng kiểm tra sau Sprint 13

Dán prompt này trước để Claude rà toàn cục.

```text
We have completed Sprint 13 for the HVHC BigData science-domain extension.

Now perform a post-Sprint-13 stabilization audit for the project.

Scope:
- M20 Science Activities
- M21 Science Resources
- M22 Science Data Hub
- M23 Science Councils & Evaluation
- M24 Science Budgets
- M25 Science Works & Library
- M26 Science Search, AI & Reports

Base modules that must remain the platform foundation:
- M01 Security Platform
- M02 Personnel Core
- M13 Workflow Platform
- M18 Export & Template Platform
- M19 Master Data Platform

Your task:
1. review the current implementation against architecture
2. identify incomplete, weak, or inconsistent areas
3. identify bypasses of M01/M02/M13/M18/M19
4. identify schema/data integrity issues
5. identify RBAC gaps
6. identify missing sample data needed for realistic testing
7. propose a fix order by severity

Return the answer in this structure:
1. Critical architecture issues
2. Critical security and RBAC issues
3. Data integrity and schema issues
4. Workflow / export / master-data integration issues
5. Missing seed/sample data
6. Recommended fix order
7. Files likely affected
Do not write code yet.
```

---

# III. Prompt kiểm tra từng module M20–M26

## 1. Prompt rà M20

```text
Review M20 Science Activities after Sprint 13.

Check:
- lifecycle completeness
- workflow transitions
- ownership guards
- archive/lock behavior
- milestone/progress logic
- acceptance flow
- audit coverage
- integration with M13, M23, M24, M25, M18, M19

Return:
1. missing rules
2. broken transitions
3. missing permissions
4. weak audit points
5. missing sample data scenarios
6. exact fixes needed
Do not write code yet.
```

## 2. Prompt rà M21

```text
Review M21 Science Resources after Sprint 13.

Check:
- scientist profile completeness
- boundary with M02 Personnel Core
- internal vs external career source separation
- awards ownership boundary
- expert pool quality
- unit capacity aggregation
- ORCID sync readiness
- export readiness through M18

Return:
1. source-of-truth issues
2. data duplication risks
3. missing validations
4. missing RBAC checks
5. sample data required
6. exact fixes needed
Do not write code yet.
```

## 3. Prompt rà M22

```text
Review M22 Science Data Hub after Sprint 13.

Check:
- unified records
- dashboard aggregation
- data quality scoring
- alerts
- catalog namespace usage
- dependency on M20/M21/M23/M24/M25
- M19 boundary
- export/report support

Return:
1. aggregation risks
2. source-of-truth risks
3. data-quality gaps
4. missing permissions
5. sample data gaps
6. exact fixes needed
Do not write code yet.
```

## 4. Prompt rà M23

```text
Review M23 Science Councils & Evaluation after Sprint 13.

Check:
- council creation
- role assignment
- conflict-of-interest rules
- closed review visibility
- vote calculation
- acceptance finalization
- council minutes generation path
- audit coverage
- integration with M20, M21, M13, M18

Return:
1. missing council rules
2. visibility/security issues
3. vote and acceptance risks
4. missing RBAC checks
5. sample data scenarios required
6. exact fixes needed
Do not write code yet.
```

## 5. Prompt rà M24

```text
Review M24 Science Budgets after Sprint 13.

Check:
- budget creation
- line items
- approval flow
- disbursement flow
- threshold alerts
- planned vs actual calculations
- budget-to-project relationship
- export/report support
- audit coverage

Return:
1. finance-rule issues
2. calculation risks
3. missing permissions
4. missing validations
5. sample data required
6. exact fixes needed
Do not write code yet.
```

## 6. Prompt rà M25

```text
Review M25 Science Works & Library after Sprint 13.

Check:
- scientific works CRUD
- authorship structure
- CrossRef import
- duplicate checking
- library upload/search/download
- metadata quality
- access logs
- indexing and worker readiness
- integration with M21, M22, M26, M18, M19

Return:
1. metadata issues
2. indexing/queue risks
3. permission issues
4. missing validations
5. sample data required
6. exact fixes needed
Do not write code yet.
```

## 7. Prompt rà M26

```text
Review M26 Science Search, AI & Reports after Sprint 13.

Check:
- keyword/full-text/semantic/hybrid search
- saved filters
- AI chat
- summarize
- research trends
- duplicate check
- reporting routes
- export through M18
- scope/sensitivity enforcement

Return:
1. search quality risks
2. AI safety and data-scope risks
3. report/export issues
4. missing permissions
5. sample data required
6. exact fixes needed
Do not write code yet.
```

---

# IV. Prompt sửa chữa theo mức ưu tiên

Sau khi Claude review xong, dùng prompt này để bắt nó sửa theo lô nhỏ.

```text
Use the stabilization audit findings as the approved backlog.

Now implement only Priority 1 fixes.

Rules:
- do not add new features
- do not redesign architecture
- only fix broken or weak areas
- keep changes migration-safe
- preserve existing data
- reuse M01/M02/M13/M18/M19 correctly

Before coding, return:
1. exact issues to fix now
2. files to change
3. migration impact
4. risk level

Then implement only Priority 1 fixes.

After coding, return:
1. files changed
2. fixes completed
3. remaining Priority 2 items
4. blockers
```

---

# V. Prompt tạo dữ liệu mẫu đầy đủ

Đây là prompt quan trọng để tạo seed data thật, không hời hợt.

```text
Create realistic seed/sample data for the HVHC BigData science-domain extension.

Target modules:
- M20 Science Activities
- M21 Science Resources
- M22 Science Data Hub
- M23 Science Councils & Evaluation
- M24 Science Budgets
- M25 Science Works & Library
- M26 Science Search, AI & Reports

Requirements:
1. sample data must be realistic, relational, and internally consistent
2. sample data must support end-to-end testing
3. sample data must cover happy path, edge cases, and rejection cases
4. sample data must include multiple units, multiple roles, and multiple project states
5. sample data must support search, reports, councils, budgets, library, and data-quality features
6. do not use random meaningless values

Please generate:
1. seed data plan
2. entity counts by module
3. dependency order for seed insertion
4. named test scenarios
5. files that should contain seeds
6. whether to use Prisma seed, SQL seed, or JSON fixtures for each part

Do not write the full seed code yet.
```

---

# VI. Cấu trúc dữ liệu mẫu tôi khuyên dùng

Anh nên yêu cầu Claude seed theo quy mô như sau.

## 1. Đơn vị và người dùng

* 1 `ADMIN`
* 1 `ACADEMY_CHIEF`
* 1 `SCIENCE_DEPT_HEAD`
* 3 `DEPARTMENT_CHIEF`
* 12 `RESEARCHER`
* 8 `REVIEWER`
* 2 `LIBRARIAN`
* 2 `FINANCE_OFFICER` hoặc người quản lý kinh phí nếu anh đã có role riêng
* 3–5 đơn vị khoa/bộ môn/phòng

## 2. M21 — Nhà khoa học

* 20 hồ sơ nhà khoa học
* trong đó:

  * 12 đang công tác
  * 3 nghỉ/không hoạt động
  * 5 có ORCID
* đủ:

  * học vị
  * học hàm
  * lĩnh vực nghiên cứu
  * quá trình nội bộ và bên ngoài
  * giải thưởng khoa học
  * chỉ số công bố

## 3. M20 — Hồ sơ khoa học

Ít nhất 18 hồ sơ:

* 4 `DRAFT`
* 3 `SUBMITTED`
* 3 `UNDER_REVIEW`
* 2 `APPROVED`
* 3 `IN_PROGRESS`
* 1 `PENDING_REVIEW`
* 1 `COMPLETED`
* 1 `ARCHIVED`

Phải có:

* đề tài cấp khác nhau
* sáng kiến
* giáo trình/tài liệu nếu cùng workflow
* chủ nhiệm và thành viên khác nhau
* ít nhất 2 hồ sơ bị trả lại/sửa

## 4. M23 — Hội đồng

* 6 hội đồng
* gồm:

  * 3 hội đồng thẩm định
  * 3 hội đồng nghiệm thu
* ít nhất:

  * 1 hội đồng pass
  * 1 hội đồng fail
  * 1 hội đồng cần sửa rồi nộp lại
* có phản biện kín và bỏ phiếu đủ kịch bản

## 5. M24 — Kinh phí

* 10 budget
* gồm:

  * 4 draft
  * 3 approved
  * 2 partially disbursed
  * 1 gần vượt ngưỡng 90%
* phải có line items khác nhau

## 6. M25 — Công trình và thư viện

* 25 scientific works
* 40 library items
* 10 tài liệu có thể semantic search
* 5 tài liệu mật/phân quyền cao hơn
* 5 mục có metadata thiếu để test data quality
* 3 bản ghi gần trùng để test duplicate

## 7. M22/M26 — Dữ liệu để test search, AI, reports

Phải seed đủ để:

* search theo tác giả
* search theo đơn vị
* search theo năm
* search theo lĩnh vực
* search theo loại công trình
* dashboard theo đơn vị
* report theo kỳ
* AI summarize theo tài liệu
* AI trends theo nhóm đề tài

---

# VII. Prompt tạo seed code thật

Khi đã chốt kế hoạch seed, dùng prompt này.

```text
Implement the approved sample data seed plan for the science domain.

Requirements:
- create realistic, relational, internally consistent seed data
- preserve architecture boundaries
- do not create fake data with meaningless labels
- use Vietnamese military-academic naming style where appropriate
- all foreign keys must be valid
- all state transitions must make sense
- all sample data must support end-to-end testing

Seed scope:
- users, roles, role assignments
- units
- scientists
- science catalogs
- projects
- project members
- milestones
- councils and reviews
- budgets and line items
- scientific works
- library items
- data-quality test records
- search/report test data

Before coding, return:
1. seed file plan
2. insertion order
3. dependencies
4. collision risks

Then implement the seed files.
```

---

# VIII. Prompt tạo RBAC đầy đủ

Đây là prompt để Claude thiết kế đầy đủ RBAC theo vai trò và chức vụ.

```text
Design and implement a complete RBAC setup for the HVHC BigData science-domain extension.

Base requirements:
- reuse M01 as the only security/RBAC platform
- support both role-based and function-based access
- support unit scope where appropriate
- do not hard-code authorization only in the UI
- backend checks are mandatory

Target roles:
- ADMIN
- ACADEMY_CHIEF
- SCIENCE_DEPT_HEAD
- DEPARTMENT_CHIEF
- RESEARCHER
- REVIEWER
- LIBRARIAN
- FINANCE_OFFICER (if not already present, propose whether this should be a dedicated role or a function bundle)

Science modules:
- M20
- M21
- M22
- M23
- M24
- M25
- M26

Tasks:
1. define the RBAC matrix by role
2. define function codes by module
3. define which permissions are global and which are scope-bound
4. define which actions require elevated approval roles
5. identify missing function codes in the current codebase
6. propose seed data for roles, permissions, and role-function mappings

Return:
1. role matrix
2. function code catalog
3. scope rules
4. admin-only actions
5. missing RBAC pieces
6. implementation plan
Do not write code yet.
```

---

# IX. Ma trận RBAC tôi khuyên anh dùng

## Vai trò

* **ADMIN**: toàn quyền hệ thống, cấu hình, seed, catalog, audit, user-role assignment
* **ACADEMY_CHIEF**: xem toàn cục, phê duyệt cấp học viện, duyệt kết quả cuối
* **SCIENCE_DEPT_HEAD**: quản lý toàn domain khoa học, phê duyệt cấp phòng KHQS, xem mọi đơn vị
* **DEPARTMENT_CHIEF**: quản lý phạm vi đơn vị mình, duyệt cấp đơn vị
* **RESEARCHER**: tạo và cập nhật hồ sơ của mình, xem dữ liệu được cấp quyền
* **REVIEWER**: chỉ xem hồ sơ được phân công, nộp phản biện, không thấy phản biện kín khác
* **LIBRARIAN**: quản thư viện số, metadata, indexing theo quyền
* **FINANCE_OFFICER**: quản lý dự toán, giải ngân, theo dõi chi, không được duyệt học thuật

## Nhóm function code nên có

### M20

* `SCI.M20.PROJECT.VIEW`
* `SCI.M20.PROJECT.CREATE`
* `SCI.M20.PROJECT.UPDATE_OWN`
* `SCI.M20.PROJECT.UPDATE_ANY`
* `SCI.M20.PROJECT.SUBMIT`
* `SCI.M20.PROJECT.REVIEW`
* `SCI.M20.PROJECT.APPROVE_DEPT`
* `SCI.M20.PROJECT.APPROVE_ACADEMY`
* `SCI.M20.PROJECT.ACTIVATE`
* `SCI.M20.PROJECT.ARCHIVE`

### M21

* `SCI.M21.SCIENTIST.VIEW`
* `SCI.M21.SCIENTIST.CREATE`
* `SCI.M21.SCIENTIST.UPDATE`
* `SCI.M21.SCIENTIST.EXPORT`
* `SCI.M21.UNIT_CAPACITY.VIEW`
* `SCI.M21.EXPERT.SUGGEST`

### M22

* `SCI.M22.DASHBOARD.VIEW`
* `SCI.M22.RECORDS.VIEW`
* `SCI.M22.CATALOG.VIEW`
* `SCI.M22.CATALOG.MANAGE`
* `SCI.M22.DATA_QUALITY.VIEW`
* `SCI.M22.DATA_QUALITY.APPROVE`

### M23

* `SCI.M23.COUNCIL.VIEW`
* `SCI.M23.COUNCIL.CREATE`
* `SCI.M23.COUNCIL.MANAGE`
* `SCI.M23.REVIEW.SUBMIT`
* `SCI.M23.VOTE.SUBMIT`
* `SCI.M23.ACCEPTANCE.FINALIZE`

### M24

* `SCI.M24.BUDGET.VIEW`
* `SCI.M24.BUDGET.CREATE`
* `SCI.M24.BUDGET.UPDATE`
* `SCI.M24.BUDGET.APPROVE`
* `SCI.M24.DISBURSEMENT.MANAGE`

### M25

* `SCI.M25.WORK.VIEW`
* `SCI.M25.WORK.CREATE`
* `SCI.M25.WORK.UPDATE`
* `SCI.M25.WORK.IMPORT_CROSSREF`
* `SCI.M25.WORK.DUPLICATE_CHECK`
* `SCI.M25.LIBRARY.VIEW`
* `SCI.M25.LIBRARY.UPLOAD`
* `SCI.M25.LIBRARY.DOWNLOAD`
* `SCI.M25.LIBRARY.ADMIN`

### M26

* `SCI.M26.SEARCH.USE`
* `SCI.M26.AI.USE`
* `SCI.M26.REPORT.VIEW`
* `SCI.M26.REPORT.EXPORT`
* `SCI.M26.REPORT.ADMIN`

---

# X. Prompt seed RBAC thật

```text
Implement the approved RBAC design for the science-domain extension on top of M01.

Tasks:
1. create or update role seeds
2. create function code seeds for M20–M26
3. create role-function mappings
4. apply scope-aware rules for:
   - unit-level actors
   - academy-level actors
   - reviewers assigned to councils
   - finance-only actions
5. ensure backend enforcement points exist
6. create sample users for each role

Before coding, return:
1. seed files to change
2. function code naming rules
3. scope model
4. migration safety notes

Then implement the RBAC seed and mapping setup.
```

---

# XI. Prompt test toàn bộ theo vai trò

```text
Create an end-to-end role-based test checklist for the science domain.

Roles to test:
- ADMIN
- ACADEMY_CHIEF
- SCIENCE_DEPT_HEAD
- DEPARTMENT_CHIEF
- RESEARCHER
- REVIEWER
- LIBRARIAN
- FINANCE_OFFICER

Modules to test:
- M20
- M21
- M22
- M23
- M24
- M25
- M26

Return:
1. role-by-role test scenarios
2. expected allowed actions
3. expected forbidden actions
4. cross-unit access tests
5. audit-required action tests
6. export/report tests
7. AI/search scope tests
```

---

# XII. Nội dung tiếp theo tốt nhất cho anh

Tôi khuyên anh gửi cho Claude theo đúng thứ tự sau:

**Lượt 1**: prompt tổng kiểm tra sau Sprint 13
**Lượt 2**: prompt sửa lỗi Priority 1
**Lượt 3**: prompt thiết kế seed data
**Lượt 4**: prompt implement seed data
**Lượt 5**: prompt thiết kế RBAC
**Lượt 6**: prompt implement RBAC
**Lượt 7**: prompt test theo vai trò

Đó là đường đi chắc và sạch nhất.

Nếu anh muốn, tôi sẽ viết tiếp cho anh **một file duy nhất dạng “master prompt pack sau Sprint 13”**, gom toàn bộ các prompt trên thành bộ hoàn chỉnh để anh dùng luôn trong VS Code.
