# M18 PROMPTS – BỘ PROMPT CHUẨN CHO MODULE TEMPLATE MANAGEMENT & EXPORT ENGINE

---

# 1. PROMPT MỞ ĐẦU M18

## 1.1. Đọc overview
```text
Đọc docs/design/system-overview.md và docs/design/module-m18-overview.md.

Chưa code.

Hãy tóm tắt:
1. Vai trò của M18 trong toàn hệ thống
2. 12 use case của M18
3. 6 nhóm chức năng chính
4. Các entity lõi
5. Các nhóm API chính
6. Thứ tự phase triển khai hợp lý
7. Các điểm bắt buộc phải giữ để không làm sai bản chất M18

1.2. Mapping codebase
Đọc docs/design/system-overview.md và docs/design/module-m18-overview.md.

Chưa code.

Hãy:
1. Mapping M18 vào codebase hiện tại
2. Liệt kê file cần tạo và file có thể tái sử dụng
3. Nêu phần nào là shared infrastructure:
   - MinIO
   - queue
   - render adapter
   - auth/RBAC
4. Chỉ ra điểm cần xác minh trong schema hiện tại trước khi viết Prisma


2. PROMPT CHO TEMPLATE MANAGEMENT
2.1. Prompt mở đầu
/implement-from-design

Đọc docs/design/module-m18-overview.md và docs/design/module-m18-template-management.md.

Chưa code.

Hãy:
1. Tóm tắt UC-T01, UC-T02, UC-T08
2. Liệt kê model cần có
3. Liệt kê API và UI chính
4. Chia phase triển khai
2.2. Phase 1 schema
/m18-phase1-schema

Đọc docs/design/module-m18-template-management.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- cập nhật prisma/schema.prisma
- thêm model:
  - ReportTemplate
  - ReportTemplateVersion
- thêm enum hoặc field cần thiết cho outputFormats nếu cần
- relation và unique/index phù hợp

Không làm API.
Không làm UI.
Không làm upload thật.

Sau khi xong:
1. liệt kê model đã thêm
2. nêu unique/index
3. nêu relation
4. đưa lệnh prisma tiếp theo


2.3. Phase 2 CRUD API + service
Đọc docs/design/module-m18-template-management.md.

Triển khai Phase 2.

Yêu cầu:
- tạo repository + service + API cho template CRUD
- hỗ trợ:
  - GET list
  - POST create
  - GET detail
  - PUT update
  - DELETE soft delete
- response chuẩn: { success, data, error }

Chưa làm upload file.
Chưa làm rollback.

Sau khi xong:
- liệt kê endpoint
- nêu response shape
- nêu phần nào chờ versioning/upload


2.4. Phase 3 upload + versioning
Đọc docs/design/module-m18-template-management.md.

Triển khai Phase 3.

Yêu cầu:
- scaffold upload file template
- tạo version history API
- tạo rollback API
- nếu chưa có MinIO integration đầy đủ, tạo abstraction rõ ràng
- rollback phải chặn nếu job đang chạy theo rule thiết kế

Sau khi xong:
- nêu file đã tạo
- nêu phần nào là stub
- nêu phần nào ready
*************************************
2.5. Phase 4 UI
Đọc docs/design/module-m18-template-management.md.

Triển khai Phase 4.

Yêu cầu:
- tạo Template Library page
- tạo template wizard shell
- tạo template detail drawer
- tạo version history list

Sau khi xong:
- liệt kê file UI
- nêu phần nào là skeleton
- nêu phần nào có thể dùng ngay

2.6. Review
/review-m18

Hãy review phần Template Management của M18 theo:
- docs/design/module-m18-overview.md
- docs/design/module-m18-template-management.md

Kiểm tra:
- có đúng bản chất versioned template engine không
- có soft delete chưa
- có rollback guard chưa
- UI library có đủ cho admin nghiệp vụ chưa


3. PROMPT CHO DATA MAP & PREVIEW
3.1. Prompt mở đầu
/implement-from-design

Đọc docs/design/module-m18-overview.md và docs/design/module-m18-data-map-preview.md.

Chưa code.

Hãy:
1. Tóm tắt UC-T03, UC-T04
2. Chỉ ra dataMap shape
3. Liệt kê API cần có
4. Liệt kê component editor/preview cần có
5. Chia phase triển khai
3.2. Phase 1 fields catalog + validation
Đọc docs/design/module-m18-data-map-preview.md.

Triển khai Phase 1.

Yêu cầu:
- tạo datamap validation schema
- tạo fields catalog service / endpoint
- fields endpoint phải hỗ trợ search và filter theo module
- không hard-code fields trong UI

Sau khi xong:
- nêu response shape của fields endpoint
- nêu nơi lấy metadata fields
3.3. Phase 2 datamap API
Đọc docs/design/module-m18-data-map-preview.md.

Triển khai Phase 2.

Yêu cầu:
- tạo GET/PUT datamap API
- validate apiPath, transform, format, conditional
- trả warnings và errors rõ ràng

Sau khi xong:
- nêu JSON shape của datamap
- nêu logic warning vs error
3.4. Phase 3 preview API
Đọc docs/design/module-m18-data-map-preview.md.

Triển khai Phase 3.

Yêu cầu:
- tạo preview API
- preview không ghi ExportJob
- hỗ trợ stream hoặc signed preview URL
- check entity scope theo rule

Sau khi xong:
- nêu flow preview
- nêu response options
- nêu chỗ nào cần render adapter
3.5. Phase 4 editor UI
Đọc docs/design/module-m18-data-map-preview.md.

Triển khai Phase 4.

Yêu cầu:
- tạo Data Map Editor page
- 3 panel:
  - placeholder panel
  - Monaco JSON editor
  - field browser
- tạo preview modal

Sau khi xong:
- nêu component tree
- nêu state management approach
4. PROMPT CHO EXPORT ENGINE
4.1. Prompt mở đầu
/implement-from-design

Đọc docs/design/module-m18-overview.md và docs/design/module-m18-export-engine.md.

Chưa code.

Hãy:
1. Tóm tắt UC-T05, UC-T06, UC-T07, UC-T09
2. Liệt kê export job model cần có
3. Chia phần nào sync, phần nào async
4. Liệt kê internal APIs
5. Chia phase triển khai
4.2. Phase 1 export job schema
/m09-phase1-schema

Đọc docs/design/module-m18-export-engine.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- cập nhật prisma/schema.prisma
- thêm model TemplateExportJob
- thêm enum status/jobType nếu cần
- thêm index cho history lookup

Không làm API.
Không làm UI.

Sau khi xong:
- liệt kê model đã thêm
- nêu các index quan trọng
- đưa lệnh prisma tiếp theo
4.3. Phase 2 self export
Đọc docs/design/module-m18-export-engine.md.

Triển khai Phase 2.

Yêu cầu:
- tạo self export API
- nếu render nhanh thì sync
- nếu chậm thì trả jobId/async path
- validate template active + RBAC scope

Sau khi xong:
- nêu flow self export
- nêu response shape
- nêu chỗ nào dùng render adapter
4.4. Phase 3 batch export + jobs
Đọc docs/design/module-m18-export-engine.md.

Triển khai Phase 3.

Yêu cầu:
- tạo batch export API
- tạo jobs history API
- tạo download + retry endpoints
- chừa queue integration rõ ràng nếu Bull chưa cắm thật

Sau khi xong:
- nêu flow batch export
- nêu status lifecycle của job
- nêu phần nào stub/real
4.5. Phase 4 internal APIs
Đọc docs/design/module-m18-export-engine.md.

Triển khai Phase 4.

Yêu cầu:
- tạo internal render API
- tạo internal datamap resolve API
- giữ auth service-to-service tách biệt với user-facing auth

Sau khi xong:
- nêu cách validate service token
- nêu response shape
- nêu use cases gọi vào từ M10/M13/M15
4.6. Phase 5 UI
Đọc docs/design/module-m18-export-engine.md.

Triển khai Phase 5.

Yêu cầu:
- tạo Batch Export Center
- tạo Export History Page
- tạo Export Progress Toast
- tạo Export Quick Button shell

Sau khi xong:
- liệt kê file UI
- nêu flow user-facing
5. PROMPT CHO SCHEDULED EXPORT & ANALYTICS
5.1. Prompt mở đầu
/implement-from-design

Đọc docs/design/module-m18-overview.md và docs/design/module-m18-scheduled-analytics.md.

Chưa code.

Hãy:
1. Tóm tắt UC-T10, UC-T11
2. Liệt kê models cần có
3. Liệt kê APIs cần có
4. Chia phase triển khai
5.2. Phase 1 scheduled export
/m09-phase1-schema

Đọc docs/design/module-m18-scheduled-analytics.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- thêm model TemplateSchedule
- thêm relation với template
- thêm trường cron, recipients, nextRunAt, lastRunStatus

Không làm API/UI.

Sau khi xong:
- liệt kê model đã thêm
- nêu index/unique phù hợp
5.3. Phase 2 schedule API
Đọc docs/design/module-m18-scheduled-analytics.md.

Triển khai Phase 2.

Yêu cầu:
- tạo schedule list/create/delete APIs
- validate cron
- enforce max schedules/user
- chừa scheduler integration rõ ràng

Sau khi xong:
- nêu flow tạo lịch
- nêu chỗ cần node-cron hoặc scheduler adapter
5.4. Phase 3 analytics API
Đọc docs/design/module-m18-scheduled-analytics.md.

Triển khai Phase 3.

Yêu cầu:
- tạo analytics aggregate API
- hỗ trợ:
  - topTemplates
  - totalExports
  - avgRenderMs
  - errorRate
  - byDay
- hỗ trợ drill-down theo templateId

Sau khi xong:
- nêu response shape
- nêu chỗ nào cần Redis cache
5.5. Phase 4 UI
Đọc docs/design/module-m18-scheduled-analytics.md.

Triển khai Phase 4.

Yêu cầu:
- tạo Schedule Manager page
- tạo Analytics Dashboard page
- tạo Cron Builder shell
- tạo charts cho top templates / trends / render time / error rate

Sau khi xong:
- nêu component tree
- nêu phần nào ready, phần nào mock
6. PROMPT CHO IMPORT TEMPLATE & MIGRATION
6.1. Prompt mở đầu
/implement-from-design

Đọc docs/design/module-m18-overview.md và docs/design/module-m18-import-migration.md.

Chưa code.

Hãy:
1. Tóm tắt UC-T12
2. Liệt kê data model cần có
3. Liệt kê API analyze/confirm
4. Chia phase triển khai
5. Nêu rủi ro kỹ thuật của migration template cũ
6.2. Phase 1 schema
/m09-phase1-schema

Đọc docs/design/module-m18-import-migration.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- thêm model TemplateImportAnalysis
- có TTL / expiresAt
- lưu detectedFields, suggestedMappings, fileStats

Không làm API/UI.

Sau khi xong:
- liệt kê model
- nêu logic TTL
6.3. Phase 2 analyze API
Đọc docs/design/module-m18-import-migration.md.

Triển khai Phase 2.

Yêu cầu:
- tạo analyze API scaffold
- parse file upload
- trả:
  - suggestedPlaceholders
  - tables
  - fileStats
- nếu chưa có AI matcher thật, tạo abstraction rõ ràng

Sau khi xong:
- nêu response shape
- nêu parser / AI matcher boundary
6.4. Phase 3 confirm API
Đọc docs/design/module-m18-import-migration.md.

Triển khai Phase 3.

Yêu cầu:
- tạo confirm API
- nhận analysisId + confirmedMappings + templateMeta
- tạo template mới version 1

Sau khi xong:
- nêu flow confirm
- nêu relation với ReportTemplate / ReportTemplateVersion
6.5. Phase 4 import wizard UI
Đọc docs/design/module-m18-import-migration.md.

Triển khai Phase 4.

Yêu cầu:
- tạo Template Import Wizard
- 3 bước:
  1. upload
  2. review mapping
  3. confirm create
- hỗ trợ manual override rõ ràng

Sau khi xong:
- nêu component tree
- nêu phần nào phụ thuộc analyze API
7. PROMPT REVIEW TOÀN BỘ M18
/review-m09

Hãy review toàn bộ phần code M18 hiện có so với:
- docs/design/system-overview.md
- docs/design/module-m18-overview.md
- docs/design/module-m18-template-management.md
- docs/design/module-m18-data-map-preview.md
- docs/design/module-m18-export-engine.md
- docs/design/module-m18-scheduled-analytics.md
- docs/design/module-m18-import-migration.md

Output:
1. phần đã đạt
2. phần còn thiếu
3. phần lệch kiến trúc
4. rủi ro production
5. thứ tự sửa tối ưu

---

# Cách dùng ngay

Bắt đầu bằng 2 prompt này:

### Prompt 1
```text
Đọc docs/design/system-overview.md và docs/design/module-m18-overview.md.

Chưa code.

Hãy tóm tắt:
1. Vai trò của M18 trong toàn hệ thống
2. 12 use case của M18
3. 6 nhóm chức năng chính
4. Các entity lõi
5. Các nhóm API chính
6. Thứ tự phase triển khai hợp lý
Prompt 2
/implement-from-design

Đọc docs/design/module-m18-overview.md và docs/design/module-m18-template-management.md.

Chưa code.

Hãy:
1. Mapping M18 Template Management sang codebase hiện tại
2. Liệt kê file cần tạo/sửa
3. Chỉ ra điểm cần xác minh trong Prisma hiện tại
4. Chia phase triển khai