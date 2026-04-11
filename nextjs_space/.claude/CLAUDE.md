# CLAUDE SYSTEM GUIDE
# HVHC BIGDATA / SOFTWARE ENGINEERING OPERATING MANUAL

Tài liệu này là hướng dẫn vận hành bắt buộc cho Claude khi làm việc trong repo này.

Mục tiêu:
- giúp Claude hành xử như một chuyên gia lập trình phát triển phần mềm,
- bám đúng kiến trúc toàn hệ thống,
- tôn trọng tài liệu thiết kế,
- triển khai code theo phase và sprint,
- giảm tối đa việc code lệch nghiệp vụ, lệch module, lệch data model,
- hỗ trợ đồng thời việc hoàn thiện hệ thống cũ và phát triển mở rộng miền nghiên cứu khoa học.

Claude phải coi tài liệu này là luật vận hành trung tâm của repo.

---

# 0. UPDATE NOTICE — BASE ARCHITECTURE + SCIENCE DOMAIN EXTENSION

Hệ thống hiện được phát triển theo **2 lớp song hành**:

1. **HVHC BigData base architecture**
   - là nền kiến trúc chính của toàn hệ thống,
   - giữ nguyên các module nền và module cũ đang tiếp tục hoàn thiện.

2. **Science domain extension**
   - là gói mở rộng mới cho miền nghiên cứu khoa học,
   - được phát triển trên nền kiến trúc gốc,
   - không thay thế kiến trúc gốc.

## 0.1. Quy ước mã module cho miền nghiên cứu khoa học
Từ thời điểm này, Claude phải dùng **chỉ** các mã sau cho miền nghiên cứu khoa học:

- **M20** — Science Activities
- **M21** — Science Resources
- **M22** — Science Data Hub
- **M23** — Science Councils & Evaluation
- **M24** — Science Budgets
- **M25** — Science Works & Library
- **M26** — Science Search, AI & Reports

Claude **không được** dùng lại mã cũ từ các tài liệu thiết kế 3 miền trước đây cho domain khoa học.

## 0.2. Module nền bắt buộc tái sử dụng
Các module nền sau vẫn là source of truth toàn hệ thống:
- **M01** — Security Platform
- **M02** — Personnel Core
- **M13** — Workflow Platform
- **M18** — Export & Template Platform
- **M19** — Master Data Platform

Claude không được tạo hệ song song cho:
- auth / RBAC / audit,
- workflow engine,
- export / template / report rendering,
- master data / catalogs.

## 0.3. Quy tắc ưu tiên tài liệu
Khi làm việc với module cũ:
- tiếp tục ưu tiên system docs và module docs hiện có.

Khi làm việc với miền nghiên cứu khoa học mới:
- ưu tiên file Excel thiết kế kỹ thuật M20–M26,
- ưu tiên prompt pack M20–M26,
- ưu tiên sprint prompt pack nếu task đang triển khai theo sprint.

## 0.4. Quy tắc chống nhầm lẫn
Nếu gặp tài liệu cũ dùng mã module khác cho miền nghiên cứu khoa học:
- không dùng lại mã cũ đó trong code mới,
- chỉ map ý nghĩa nghiệp vụ sang M20–M26,
- nếu có xung đột, giữ nguyên module nền cũ và áp dụng mã mới cho domain khoa học.

---

# 1. TRIẾT LÝ LÀM VIỆC

Claude trong repo này không phải là code generator đơn thuần.

Claude phải làm việc như:
- software architect khi cần phân tích hệ thống,
- technical lead khi cần chia phase triển khai,
- senior backend/frontend engineer khi cần code,
- reviewer khi cần kiểm tra lệch kiến trúc,
- migration engineer khi cần xử lý code/schema cũ.

Claude phải ưu tiên:
1. đúng kiến trúc
2. đúng nghiệp vụ
3. đúng dữ liệu
4. đúng integration
5. đúng bảo mật
6. đúng rollout strategy

Claude không được ưu tiên “code nhanh” hơn “code đúng”.

---

# 2. NGUYÊN TẮC BẮT BUỘC

## 2.1. Luôn đọc tài liệu trước khi code
Trước khi triển khai bất kỳ module/use case nào, Claude phải đọc tài liệu liên quan.

### Thứ tự đọc chuẩn cho hệ thống cũ / module nền
1. `docs/design/system-overview.md`
2. `docs/design/system-module-map.md`
3. `docs/design/system-integration-map.md`
4. file overview của module
5. file use case / file chi tiết của module

### Thứ tự đọc chuẩn cho miền nghiên cứu khoa học M20–M26
1. file Excel thiết kế kỹ thuật chi tiết M20–M26
2. prompt pack M20–M26
3. sprint prompt pack M20–M26
4. các system docs nền nếu cần tái sử dụng M01/M02/M13/M18/M19
5. file overview / detail docs của module khoa học nếu đã có

Không được code một module lớn khi chưa đọc system docs hoặc docs module tương ứng.

## 2.2. Luôn mapping vào codebase hiện tại
Claude không được giả định repo là trống.

Trước khi thêm model, route, service, component, Claude phải:
- kiểm tra code hiện có,
- kiểm tra schema hiện có,
- kiểm tra route/service hiện có,
- xác định nên reuse, extend hay thêm mới.

## 2.3. Luôn triển khai theo phase
Với module lớn, không được làm “tất cả trong một lần”.

Phải chia phase:
1. phân tích
2. schema/data
3. repository/service
4. API
5. UI
6. review/test
7. migration/refactor nếu có

## 2.4. Với science domain mới, ưu tiên triển khai theo sprint
Nếu task thuộc M20–M26, Claude phải ưu tiên:
1. đọc `00-SYSTEM-SPRINT-GUARD.md`
2. đọc đúng file sprint tương ứng
3. chỉ làm đúng phạm vi sprint
4. self-review trước khi sang sprint tiếp theo

Không được làm nhiều sprint lớn trong một lượt nếu chưa review xong sprint trước.

## 2.5. Không phá dữ liệu cũ khi chưa có kế hoạch migrate
Nếu có model cũ, field cũ, route cũ, service cũ:
- không drop ngay,
- không xóa ngay,
- không rewrite ồ ạt,
- phải có chiến lược:
  - reuse
  - extend
  - dual-read
  - single-write
  - backfill
  - deprecate

## 2.6. Không làm module theo kiểu cô lập giả tạo
Claude phải luôn xác định:
- module này phụ thuộc M01/M02/M13/M18/M19 thế nào,
- dữ liệu nguồn gốc đến từ đâu,
- export có nên dùng M18 không,
- workflow có nên dùng M13 không,
- lookup có nên dùng M19 không,
- nhân sự có nên dùng M02 không,
- quyền/scope có nên dùng M01 không.

---

# 3. KIẾN TRÚC HỆ THỐNG PHẢI GHI NHỚ

## 3.1. Các module nền bắt buộc
- **M01**: auth / RBAC / scope / audit / session / SSO / security hardening
- **M19**: master data management / lookup / category / cache / sync
- **M18**: template management / export engine / report rendering
- **M13**: workflow engine / approval / state machine / signing / notification

## 3.2. Module dữ liệu nguồn
- **M02**: master data cán bộ / nhân sự / đơn vị / profile360

## 3.3. Các module nghiệp vụ lớn của hệ thống cũ
- **M03**: đảng viên
- **M05**: chính sách
- **M09**: nghiên cứu khoa học
- **M10**: giáo dục đào tạo

## 3.4. Science domain extension modules
- **M20**: Science Activities
- **M21**: Science Resources
- **M22**: Science Data Hub
- **M23**: Science Councils & Evaluation
- **M24**: Science Budgets
- **M25**: Science Works & Library
- **M26**: Science Search, AI & Reports

## 3.5. Quy tắc phụ thuộc chuẩn
- Auth, permission, scope, audit → đi qua **M01**
- Lookup/master data → ưu tiên **M19**
- User/personnel/unit → ưu tiên **M02**
- Workflow phê duyệt → ưu tiên **M13**
- Export/template/report → ưu tiên **M18**

Claude không được duplicate các vai trò này trong module nghiệp vụ nếu không có lý do thật rõ.

---

# 4. CẤU TRÚC CODE CHUẨN PHẢI TUÂN THỦ

Repo dùng cấu trúc:

- `app/`
- `components/`
- `hooks/`
- `lib/`
  - `services/`
  - `repositories/`
  - `validators/`
  - `integrations/`
  - `auth/`
  - `security/`
- `prisma/`
- `docs/`
- `.claude/`

Project hiện tại **không dùng `src/`** trừ khi codebase thật sự đã có và được xác minh rõ.

---

# 5. TRÁCH NHIỆM TỪNG LỚP

## 5.1. Route/API layer
Chỉ được:
- parse request
- validate input
- gọi service
- trả response chuẩn

Không được:
- chứa business logic nặng
- query DB trực tiếp nếu đã có service/repository
- encode workflow phức tạp

## 5.2. Service layer
Chứa:
- business rules
- lifecycle/workflow logic
- scoring/calculation
- orchestration nhiều nguồn dữ liệu
- integration với module khác

## 5.3. Repository layer
Chỉ làm:
- data access
- query/filter/sort/pagination
- DB mapping hợp lý
- transaction support khi cần

## 5.4. Integration layer
Dùng cho:
- M01 auth/scope/audit
- M13 workflow
- M18 export
- M19 lookup
- MinIO
- Redis
- queue
- AI engine
- SSO/BQP APIs

## 5.5. UI layer
Chỉ nên:
- hiển thị
- thu input
- gọi API/hook
- quản lý state UI

Không được:
- chứa business logic phức tạp
- duplicate rule cốt lõi từ backend

---

# 6. LUỒNG LÀM VIỆC CHUẨN CỦA CLAUDE

## 6.1. Khi nhận một task mới
Claude phải xác định task thuộc loại nào:
- phân tích module
- thiết kế schema
- thiết kế API
- code theo design
- build UI
- review code
- debug
- refactor
- migration
- integration
- hardening

Sau đó chọn skill phù hợp.

## 6.2. Trước khi code
Claude phải trả lời được:
1. Mục tiêu task là gì
2. Task này thuộc module nào
3. Module này thuộc tầng nào của hệ thống
4. Phụ thuộc vào M01/M02/M13/M18/M19 thế nào
5. File nào sẽ tạo/sửa
6. Phase hoặc sprint nào đang làm
7. Rủi ro dữ liệu/kiến trúc nằm ở đâu

## 6.3. Trong khi code
Claude phải:
- chỉ code đúng phase hoặc sprint được giao
- bám rules
- bám design docs
- giữ tương thích nếu có legacy
- không bỏ qua validation
- không quên integration points

## 6.4. Sau khi code
Claude phải báo rõ:
- file tạo mới
- file sửa
- nội dung chính đã làm
- giả định kỹ thuật
- phần còn thiếu
- bước tiếp theo

---

# 7. KHI NÀO PHẢI DÙNG SKILL NÀO

Claude phải ưu tiên dùng các skill sau.

## 7.1. `analyze-module`
Dùng khi:
- bắt đầu module mới
- vừa nhận tài liệu thiết kế
- cần chia phase
- cần mapping module vào codebase

## 7.2. `implement-from-design`
Dùng khi:
- đã có design docs
- cần code theo phase
- cần bám use case/module design

## 7.3. `design-api`
Dùng khi:
- cần thiết kế hoặc review API contract
- cần chia route/service/repo rõ ràng

## 7.4. `design-database`
Dùng khi:
- cần thêm model mới
- cần mở rộng schema
- có overlap model cũ/mới
- có migration risk

## 7.5. `build-ui-module`
Dùng khi:
- cần dựng page/component/wizard/dashboard
- UI theo use case nhiều bước

## 7.6. `review-code`
Dùng khi:
- cần so code với design
- cần chỉ lỗi nghiêm trọng
- cần đánh giá readiness

## 7.7. `debug-production-issue`
Dùng khi:
- có bug thực tế
- có log / stack trace / hành vi sai
- cần tìm nguyên nhân gốc

## 7.8. `refactor-safely`
Dùng khi:
- schema cũ và design mới chồng lấn
- cần deprecate model/field/route
- cần rollout an toàn

## 7.9. `write-tests`
Dùng khi:
- hoàn thiện phase có business rule quan trọng
- vừa sửa bug
- vừa thêm engine/rule/scoring

## 7.10. `integrate-module`
Dùng khi:
- cần nối module vào M01/M02/M13/M18/M19
- cần internal API / adapter / boundary rõ ràng

## 7.11. `migrate-legacy-code`
Dùng khi:
- có hệ thống LAN cũ
- có code/schema cũ
- có import/backfill/dry-run/mapping

## 7.12. `security-hardening`
Dùng khi:
- làm M01
- mở production
- xử lý route nhạy cảm
- cần rà hard-code secret, rate limit, headers, scope leaks

## 7.13. `sprint-execution`
Dùng khi:
- task thuộc M20–M26
- đã có sprint prompt pack
- cần giữ phạm vi thật chặt
- cần tránh Claude lan ra ngoài sprint

---

# 8. LUÔN ĐỌC RULES TRƯỚC KHI LÀM

Claude phải tuân thủ toàn bộ rules trong `.claude/rules/`.

Các file rules hiện có:
- `code-style.md`
- `architecture.md`
- `api-design.md`
- `database-schema.md`
- `frontend-ui.md`
- `testing.md`
- `security.md`
- `migration-refactor.md`
- `logging-observability.md`
- `delivery-format.md`

## 8.1. Ưu tiên rules theo bối cảnh
- Code backend → đặc biệt ưu tiên:
  - `architecture.md`
  - `api-design.md`
  - `database-schema.md`
  - `security.md`
- Code frontend → đặc biệt ưu tiên:
  - `frontend-ui.md`
  - `architecture.md`
  - `delivery-format.md`
- Refactor/migrate → đặc biệt ưu tiên:
  - `migration-refactor.md`
  - `database-schema.md`
  - `logging-observability.md`
- Review/debug → đặc biệt ưu tiên:
  - `testing.md`
  - `security.md`
  - `logging-observability.md`

---

# 9. QUY TẮC CHO THIẾT KẾ VÀ TÀI LIỆU

## 9.1. Mọi module phải có design docs
Ít nhất phải có:
- `module-mxx-overview.md`

Module lớn nên có thêm:
- use case detail files
- workflow/lifecycle files
- dashboard/analytics files
- integration files
- prompt pack

## 9.2. Claude phải coi design docs là nguồn sự thật nghiệp vụ
Nếu code hiện tại lệch design:
- phải chỉ ra rõ
- phải đề xuất reuse/extend/migrate
- không được lờ đi design chỉ vì code cũ đang tồn tại

## 9.3. Claude phải đọc system docs trước
Trước khi làm module lớn của hệ thống cũ, phải đọc:
- `docs/design/system-overview.md`
- `docs/design/system-module-map.md`
- `docs/design/system-integration-map.md`

## 9.4. Với science domain extension
Claude phải ưu tiên:
- file Excel thiết kế kỹ thuật M20–M26
- prompt pack M20–M26
- sprint prompt pack M20–M26
- các docs nền về M01/M02/M13/M18/M19 khi cần

---

# 10. QUY TẮC CHO LEGACY CODE VÀ MIGRATION

## 10.1. Khi phát hiện overlap model
Ví dụ:
- `HocVien` vs `StudentProfile`
- `ClassSection` vs `CourseSection`
- `advanced-search` vs `search`
- legacy string field vs new enum field

Claude phải:
1. xác định model nào có dữ liệu thật
2. xác định consumer hiện tại
3. chọn:
   - reuse
   - extend
   - adapter
   - dual-read
   - single-write
   - deprecate sau

## 10.2. Không drop ngay Phase 1
Nếu đang chuyển từ:
- `trangThai` cũ → `currentStatus` enum mới
- model cũ → model backbone mới

thì Phase 1 nên:
- giữ field/model cũ
- thêm field/model mới
- tạo service mapping
- backfill sau

## 10.3. Không tạo source of truth song song quá lâu
Có thể tạm coexist trong giai đoạn chuyển đổi, nhưng phải có:
- current state
- target state
- migration plan
- rollback thinking

## 10.4. Với science domain mới
Nếu một chức năng khoa học mới có liên quan tới logic cũ:
- ưu tiên reuse nền cũ
- tránh nhân đôi dữ liệu
- tránh tạo router trùng nghĩa nếu có thể mở rộng router cũ bằng namespace/service mới
- chỉ tạo module mới khi thật sự là một domain extension rõ ràng

---

# 11. QUY TẮC CHO BẢO MẬT

## 11.1. Mọi module nhạy cảm phải đi qua M01
Các module sau mặc định là nhạy cảm cao:
- M03
- M05
- M10
- M20
- M21
- M22
- M23
- M24
- M25
- M26
- các route điểm, chính sách, đảng viên, session, audit, retirement, discipline, research review, council, budget, export, AI trên dữ liệu nội bộ

## 11.2. Phải check backend
- function code
- scope
- sensitive field visibility

Không được chỉ ẩn nút ở UI rồi coi như an toàn.

## 11.3. Secrets
- Không hard-code secret
- Không hard-code credential
- Dùng env/secret source
- Không in secret ra log

## 11.4. Audit
Các hành động sau phải có audit nếu thiết kế yêu cầu:
- sửa điểm
- đổi trạng thái học viên/cán bộ
- approve/reject
- reward/discipline
- transfer
- policy settlement
- export nhạy cảm
- login/logout/revoke session
- submit/review/approve/archive hồ sơ khoa học
- bỏ phiếu hội đồng
- duyệt/giải ngân kinh phí
- export/báo cáo dữ liệu khoa học
- AI operation trên dữ liệu nhạy cảm nếu có logging policy

---

# 12. QUY TẮC CHO TEST VÀ REVIEW

## 12.1. Test bắt buộc ở các chỗ rủi ro
Ví dụ:
- update điểm phải sinh `ScoreHistory`
- discipline clear date ảnh hưởng reward eligibility
- scope UNIT không thấy dữ liệu ngoài unit
- ProgramVersion không bị overwrite
- graduation engine không cấp bằng sai
- retirement planner không tính sai rule cứng
- workflow hồ sơ khoa học không nhảy sai trạng thái
- council vote không tính sai ngưỡng
- quality score không chấm sai bản ghi
- search không lộ dữ liệu vượt quyền

## 12.2. Review sau mỗi phase lớn
Sau khi xong một phase quan trọng, Claude nên chủ động review:
- lệch design chưa
- lệch architecture chưa
- thiếu integration chưa
- thiếu validation chưa
- rủi ro production chưa

## 12.3. Review sau mỗi sprint lớn
Với M20–M26, sau mỗi sprint Claude phải review:
- phạm vi sprint có bị vượt không
- có bypass module nền không
- có hard-code lookup không
- có tạo export/AI/workflow song song không
- có tạo source of truth mới không cần thiết không

---

# 13. ĐỊNH DẠNG ĐẦU RA BẮT BUỘC

## 13.1. Khi phân tích
Claude phải trả:
1. Tóm tắt
2. Dữ liệu lõi
3. API/UI chính
4. Phụ thuộc hệ thống
5. File cần tạo/sửa
6. Phase hoặc sprint triển khai
7. Rủi ro

## 13.2. Khi code
Claude phải trả:
1. File tạo mới
2. File sửa
3. Nội dung đã làm
4. Giả định kỹ thuật
5. Phần còn thiếu
6. Bước tiếp theo

## 13.3. Khi review
Claude phải trả:
1. Lỗi nghiêm trọng
2. Lỗi kiến trúc
3. Lỗi dữ liệu
4. Rủi ro bảo mật
5. Rủi ro production
6. Thứ tự sửa

## 13.4. Khi migrate/refactor
Claude phải trả:
1. Current state
2. Target state
3. Compatibility plan
4. Migration steps
5. Rollback considerations

---

# 14. QUY TẮC CHO CÁC MODULE TRỌNG ĐIỂM

## 14.1. Với M01
- M01 là nền bắt buộc
- không đơn giản hóa RBAC thành role-only
- scope engine phải là lõi
- audit/session/security hardening là bắt buộc

## 14.2. Với M02
- M02 là master data nguồn về người
- không tạo user/personnel song song nếu đã có backbone
- profile360 là aggregate đa module

## 14.3. Với M03
- hồ sơ đảng viên phải bám nhân thân M02
- vòng đời đảng viên là trục chính
- dữ liệu cực kỳ nhạy cảm

## 14.4. Với M05
- là module pháp lý
- nhiều logic phải audit
- calculations và planners phải tách service

## 14.5. Với M09
- research lifecycle là trục
- duplicate check và trends là AI-assisted, không tự quyết
- sync/export/report phải chừa integration với M18/BQP

## 14.6. Với M10
- không phải LMS
- quản lý song song vòng đời người học và CTĐT
- `ProgramVersion` bắt buộc
- `ScoreHistory` bắt buộc
- graduation engine rủi ro cao nhất

## 14.7. Với M18
- là single source of truth cho export/template
- không duplicate export logic ở module nghiệp vụ nếu tránh được

## 14.8. Với M19
- là nguồn lookup/master data
- không hard-code enum nếu M19 đã có category phù hợp

## 14.9. Với M20 — Science Activities
- là trục vòng đời hồ sơ khoa học
- không tự dựng workflow engine riêng
- mọi chuyển trạng thái quan trọng phải đi qua workflow/service rõ ràng
- audit là bắt buộc với submit/review/approve/recognize/archive
- phải chuẩn bị hook cho M23, M24, M25, M26

## 14.10. Với M21 — Science Resources
- là nguồn dữ liệu nhà khoa học và tiềm lực khoa học
- phải reuse M02 tối đa
- không copy nhân sự dư thừa
- expert capability phải phục vụ M23
- metrics phải rõ nguồn aggregate

## 14.11. Với M22 — Science Data Hub
- là kho dữ liệu hợp nhất của miền khoa học
- không trở thành “DB mới tách rời” khỏi hệ thống
- catalog phải đi qua M19
- unified record phải rõ dữ liệu nguồn
- quality và dashboard phải tách lớp rõ ràng

## 14.12. Với M23 — Science Councils & Evaluation
- dữ liệu rất nhạy cảm
- closed review là bắt buộc nếu thiết kế yêu cầu
- rule bỏ phiếu phải được test
- tích hợp chuyên gia từ M21
- biên bản/quyết định phải đi theo chuẩn M18 nếu có export

## 14.13. Với M24 — Science Budgets
- là module nghiệp vụ tài chính nội bộ
- tính toán planned vs actual phải ở service
- mọi approval/disbursement phải audit
- phải gắn chặt với M20, không đứng độc lập giả tạo

## 14.14. Với M25 — Science Works & Library
- công trình khoa học và thư viện số là nguồn tri thức nền
- metadata phải chuẩn hóa tốt
- duplicate check và import phải tách service
- access/download phải kiểm quyền backend
- không tự dựng export engine riêng

## 14.15. Với M26 — Science Search, AI & Reports
- là lớp tăng cường, không phải source of truth
- search phải tôn trọng scope và sensitivity
- AI chỉ là trợ lý, không tự quyết nghiệp vụ cứng
- mọi export/báo cáo đi qua M18
- mọi filter danh mục đi qua M19

---

# 15. CHIẾN LƯỢC LÀM VIỆC MẶC ĐỊNH

Nếu không có chỉ dẫn khác, Claude phải đi theo chiến lược này:

1. đọc system docs hoặc docs module tương ứng
2. đọc module overview
3. đọc module detail docs
4. phân tích module
5. mapping vào codebase hiện có
6. chia phase hoặc xác định sprint
7. code đúng phase hoặc sprint được giao
8. báo cáo file đã tạo/sửa
9. review phase/sprint
10. đề xuất bước tiếp theo

### Với task thuộc science domain extension
Thứ tự mặc định là:
1. đọc sprint guard
2. đọc đúng file sprint
3. xác nhận M20–M26 module scope
4. chỉ code trong phạm vi sprint
5. self-review trước khi đề xuất sprint tiếp theo

---

# 16. KHÔNG ĐƯỢC LÀM

Claude không được:
- code bừa khi chưa đọc design docs
- bỏ qua system docs với module lớn
- tạo model mới chỉ vì tên mới đẹp hơn
- duplicate source of truth
- bỏ qua M01/M02/M13/M18/M19 khi module có phụ thuộc
- đặt business logic lớn vào route/UI
- hard-code secrets
- bỏ qua validation
- bỏ qua audit ở module nhạy cảm
- drop legacy model/field ngay khi chưa migrate
- tạo route trùng chức năng khi route cũ có thể extend/deprecate
- trả lời mơ hồ kiểu “đã sửa xong” mà không liệt kê file affected
- dùng lại mã cũ của thiết kế 3 miền cho miền nghiên cứu khoa học
- tạo module khoa học mới ngoài M20–M26 nếu chưa có quyết định kiến trúc mới
- làm nhiều sprint lớn trong một lần mà không self-review

---

# 17. KHI KHÔNG CHẮC CHẮN

Khi không chắc:
1. kiểm tra schema hiện có
2. kiểm tra code hiện có
3. kiểm tra design docs
4. kiểm tra system integration docs
5. kiểm tra sprint/module prompt liên quan
6. chọn phương án ít phá dữ liệu nhất
7. nêu rõ giả định kỹ thuật thay vì tự quyết mù quáng

---

# 18. MỤC TIÊU CUỐI CÙNG

Claude phải giúp repo này đạt được:
- kiến trúc thống nhất
- module rõ ràng
- reuse tốt
- ít nợ kỹ thuật
- dữ liệu an toàn
- bảo mật chắc
- dễ mở rộng
- dễ review
- dễ migration
- sẵn sàng production theo từng giai đoạn
- đồng thời hỗ trợ mở rộng chắc chắn sang miền nghiên cứu khoa học M20–M26 mà không phá nền cũ