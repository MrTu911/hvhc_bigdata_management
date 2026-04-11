# CLAUDE SYSTEM GUIDE
# HVHC BIGDATA / SOFTWARE ENGINEERING OPERATING MANUAL

Tài liệu này là hướng dẫn vận hành bắt buộc cho Claude khi làm việc trong repo này.

Mục tiêu:
- giúp Claude hành xử như một chuyên gia lập trình phát triển phần mềm,
- bám đúng kiến trúc toàn hệ thống,
- tôn trọng tài liệu thiết kế,
- triển khai code theo phase,
- giảm tối đa việc code lệch nghiệp vụ, lệch module, lệch data model.

Claude phải coi tài liệu này là luật vận hành trung tâm của repo.

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

Thứ tự đọc chuẩn:
1. `docs/design/system-overview.md`
2. `docs/design/system-module-map.md`
3. `docs/design/system-integration-map.md`
4. file overview của module
5. file use case / file chi tiết của module

Không được code một module lớn khi chưa đọc system docs.

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

## 2.4. Không phá dữ liệu cũ khi chưa có kế hoạch migrate
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

## 2.5. Không làm module theo kiểu cô lập giả tạo
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

## 3.3. Các module nghiệp vụ lớn hiện tại
- **M03**: đảng viên
- **M05**: chính sách
- **M09**: nghiên cứu khoa học
- **M10**: giáo dục đào tạo

## 3.4. Quy tắc phụ thuộc chuẩn
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
6. Phase nào đang làm
7. Rủi ro dữ liệu/kiến trúc nằm ở đâu

## 6.3. Trong khi code
Claude phải:
- chỉ code đúng phase được giao
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
  - `review-code`
  - `debug-production-issue`
  - `testing.md`
  - `security.md`

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
Trước khi làm module lớn, phải đọc:
- `docs/design/system-overview.md`
- `docs/design/system-module-map.md`
- `docs/design/system-integration-map.md`

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

---

# 11. QUY TẮC CHO BẢO MẬT

## 11.1. Mọi module nhạy cảm phải đi qua M01
Các module sau mặc định là nhạy cảm cao:
- M03
- M05
- M10
- M01
- các route điểm, chính sách, đảng viên, session, audit, retirement, discipline

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

## 12.2. Review sau mỗi phase lớn
Sau khi xong một phase quan trọng, Claude nên chủ động review:
- lệch design chưa
- lệch architecture chưa
- thiếu integration chưa
- thiếu validation chưa
- rủi ro production chưa

---

# 13. ĐỊNH DẠNG ĐẦU RA BẮT BUỘC

## 13.1. Khi phân tích
Claude phải trả:
1. Tóm tắt
2. Dữ liệu lõi
3. API/UI chính
4. Phụ thuộc hệ thống
5. File cần tạo/sửa
6. Phase triển khai
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

# 14. QUY TẮC CHO MỘT SỐ MODULE TRỌNG ĐIỂM

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

---

# 15. CHIẾN LƯỢC LÀM VIỆC MẶC ĐỊNH

Nếu không có chỉ dẫn khác, Claude phải đi theo chiến lược này:

1. đọc system docs
2. đọc module overview
3. đọc module detail docs
4. phân tích module
5. mapping vào codebase hiện có
6. chia phase
7. code đúng phase được giao
8. báo cáo file đã tạo/sửa
9. review phase
10. đề xuất bước tiếp theo

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

---

# 17. KHI KHÔNG CHẮC CHẮN

Khi không chắc:
1. kiểm tra schema hiện có
2. kiểm tra code hiện có
3. kiểm tra design docs
4. kiểm tra system integration docs
5. chọn phương án ít phá dữ liệu nhất
6. nêu rõ giả định kỹ thuật thay vì tự quyết mù quáng

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