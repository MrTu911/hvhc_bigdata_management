## 6) Gợi ý `docs/prompts/m13-prompts.md`

# M13 Prompt Pack

## Prompt 1 – Analyze module M13

Đọc:

* .claude/CLAUDE.md
* docs/design/system-overview.md
* docs/design/system-module-map.md
* docs/design/system-integration-map.md
* docs/design/module-m13-overview.md
* docs/design/module-m13-state-machine.md
* docs/design/module-m13-designer.md
* docs/design/module-m13-signature-notification.md
* docs/design/module-m13-dashboard.md

Chưa code.

Hãy:

1. tóm tắt phạm vi M13
2. xác định các Prisma models cần có
3. mapping với M01, M02, M18, M19
4. chỉ ra phần nào nên làm Phase 1 trước
5. liệt kê các API routes cần dựng trước

## Prompt 2 – Implement Phase 1 schema for M13

Đọc toàn bộ design docs của M13.

Chỉ làm Phase 1.

Yêu cầu:

1. đề xuất Prisma schema cho các model lõi của M13
2. tránh duplicate source of truth với module nghiệp vụ
3. dùng enum rõ ràng cho workflow status, step status, action type
4. thêm indexes cần thiết cho dashboard và task inbox
5. giải thích từng model ngắn gọn

## Prompt 3 – Build state machine service

Đọc:

* module-m13-overview.md
* module-m13-state-machine.md

Chỉ triển khai service layer cho state machine.
Chưa làm UI designer.

Hãy:

1. tạo service start workflow
2. tạo service act on workflow
3. validate transition theo template version
4. ghi action log và step instance trong cùng transaction
5. fail-closed nếu không đủ quyền/scope

## Prompt 4 – Build workflow designer backend

Đọc:

* module-m13-designer.md

Hãy triển khai backend cho:

* workflow templates
* template versions
* step definitions
* transition definitions
* validate before publish

Không làm drag-drop frontend nâng cao nếu chưa có schema ổn định.

## Prompt 5 – Build approval + signature + notification

Đọc:

* module-m13-signature-notification.md

Hãy:

1. xây các action approve/reject/return
2. thiết kế signature adapter interface
3. xây notification service in-app trước
4. chuẩn bị background jobs cho reminder/escalation
5. chưa hard-code nhà cung cấp ký số

## Prompt 6 – Build dashboard and analytics

Đọc:

* module-m13-dashboard.md

Hãy:

1. thiết kế các query dashboard tối thiểu cho Phase 1
2. xây my work dashboard trước
3. thêm unit summary dashboard có scope filtering
4. đề xuất summary tables cho Phase 2
5. tránh query nặng không cần thiết

# M13 PROMPTS – BỘ PROMPT CHUẨN CHO MODULE WORKFLOW PHÊ DUYỆT ĐIỆN TỬ

Tài liệu này dùng để điều khiển Claude/Cline phát triển Module M13 theo đúng thiết kế kỹ thuật.

M13 là nền tảng workflow dùng chung cho toàn hệ thống:
- State Machine Engine
- Drag-drop Workflow Designer
- Ký số điện tử
- Thông báo & SLA reminder
- Dashboard workflow & báo cáo trạng thái

Phải bám đúng triết lý:
- configuration over code
- workflow mới không cần code thêm nếu nằm trong khả năng engine
- M13 là module nền, không phải module CRUD thông thường

---

# 1. PROMPT MỞ ĐẦU M13

## 1.1. Prompt đọc tổng quan M13

```text
Đọc các file:
- .claude/CLAUDE.md
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m13-overview.md

Nếu file overview chưa có đầy đủ, dùng trực tiếp tài liệu M13 đã được cung cấp trong cuộc trò chuyện.

Chưa code.

Hãy tóm tắt:
1. Vai trò của M13 trong toàn hệ thống
2. 5 use case của M13 (UC-85 → UC-89)
3. Triết lý "configuration over code" nghĩa là gì trong M13
4. M13 phụ thuộc vào M01 và M02 như thế nào
5. Những module nào sẽ dùng M13 trước (M03, M05, M09, M10…)
6. Thứ tự phase triển khai hợp lý
7. Những rủi ro kiến trúc nếu làm M13 sai cách
````

## 1.2. Prompt mapping M13 vào codebase

```text
Đọc:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- tài liệu M13 Workflow Phê duyệt Điện tử đã được cung cấp
- prisma/schema.prisma
- app/api/**
- lib/services/**
- lib/repositories/**
- components/**
- app/dashboard/**

Chưa code.

Hãy:
1. Mapping M13 vào codebase hiện tại
2. Liệt kê file cần tạo mới
3. Liệt kê file cần sửa
4. Chỉ ra integration points với:
   - M01 (RBAC/scope/audit/session)
   - M02 (Personnel/User/Unit)
   - M18 (export biểu mẫu/quyết định về sau nếu cần)
5. Chỉ ra model/schema hiện có nào có thể reuse
6. Chia phase triển khai cụ thể cho M13
```

---

# 2. PROMPT CHO UC-85 – STATE MACHINE ENGINE CORE

## 2.1. Prompt mở đầu UC-85

```text
/implement-from-design

Đọc tài liệu M13 – Workflow Phê duyệt Điện tử, tập trung phần:
- WorkflowDefinition
- WorkflowStep
- WorkflowInstance
- WorkflowHistory
- WorkflowStateMachine

Chưa code.

Hãy:
1. Tóm tắt UC-85 State Machine Engine
2. Liệt kê models Prisma cần có
3. Liệt kê enums cần có
4. Liệt kê services/repositories/APIs cần có
5. Chỉ ra chỗ nào phải tích hợp M01/M02
6. Chia phase triển khai
```

## 2.2. Phase 1 schema workflow core

```text
/m09-phase1-schema

Đọc tài liệu M13 phần schema Workflow.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- cập nhật prisma/schema.prisma
- thêm các model:
  - WorkflowDefinition
  - WorkflowStep
  - WorkflowInstance
  - WorkflowHistory
- thêm enums phù hợp:
  - StepType
  - ApproverType
  - InstanceStatus
  - Priority
- thêm relation, unique, index cần thiết
- nếu đã có User model thì nối relation đúng, không tạo user song song

Không làm API.
Không làm UI.
Không làm notification.
Không làm digital signature.

Sau khi xong:
1. liệt kê models đã thêm
2. liệt kê enums đã thêm
3. nêu relation chính
4. nêu index quan trọng
5. nêu giả định kỹ thuật
6. đưa lệnh prisma tiếp theo
```

## 2.3. Phase 2 state machine service

```text
Đọc tài liệu M13 phần WorkflowStateMachine.

Triển khai Phase 2.

Yêu cầu:
- tạo service lõi cho workflow state machine
- hỗ trợ:
  - initiate workflow instance
  - process action
  - validate action hợp lệ
  - chuyển step
  - kết thúc workflow terminal
  - ghi WorkflowHistory
- tách business logic khỏi route
- chưa làm UI designer
- chưa làm ký số
- chưa làm SLA cron

Sau khi xong:
- liệt kê file service/repository đã tạo
- nêu hàm chính của state machine
- nêu flow initiate
- nêu flow processAction
- nêu chỗ nào tích hợp audit M01
```

## 2.4. Phase 3 permission & approver resolution

```text
Đọc tài liệu M13 phần:
- assertActorPermission
- approverType ROLE / POSITION / SPECIFIC_USER / DYNAMIC

Triển khai Phase 3.

Yêu cầu:
- tích hợp permission resolution cho step approval
- hỗ trợ:
  - ROLE
  - POSITION
  - SPECIFIC_USER
  - DYNAMIC
- nếu resolver động chưa hoàn chỉnh, tạo abstraction rõ ràng
- tích hợp với M01:
  - user roles
  - position codes
  - scope nếu cần
- tích hợp với M02 để map user/personnel/unit nếu cần

Sau khi xong:
- nêu flow permission checking
- nêu file resolver / helper đã tạo
- nêu phần nào là production-ready
- nêu phần nào là scaffold
```

## 2.5. Phase 4 APIs workflow instances

```text
Đọc tài liệu M13 phần API endpoints.

Triển khai Phase 4.

Yêu cầu:
- tạo APIs:
  - GET /api/workflow/definitions
  - POST /api/workflow/definitions
  - GET /api/workflow/definitions/[id]
  - PATCH /api/workflow/definitions/[id]
  - POST /api/workflow/instances
  - GET /api/workflow/instances
  - GET /api/workflow/instances/[id]
  - POST /api/workflow/instances/[id]/action
- response chuẩn: { success, data, error }
- route phải mỏng
- business logic ở service layer
- check RBAC theo các mã WF.*

Sau khi xong:
- liệt kê endpoint đã có
- nêu response shape chính
- nêu function codes nào cần seed trong M01
```

## 2.6. Review UC-85

```text
/review-m09

Hãy review phần code UC-85 của M13 theo tài liệu M13 đã cung cấp.

Kiểm tra:
1. State machine có đúng tinh thần config-driven không
2. Models schema có đủ chưa
3. Route có mỏng không
4. Permission resolution có đúng không
5. Có thiếu audit/logging không
6. Rủi ro production là gì
7. Thứ tự sửa tối ưu
```

---

# 3. PROMPT CHO UC-86 – DRAG-DROP WORKFLOW DESIGNER

## 3.1. Prompt mở đầu UC-86

```text
/implement-from-design

Đọc tài liệu M13 phần:
- Workflow Designer
- React Flow canvas
- node types
- properties panel
- validation engine
- export/import JSON

Chưa code.

Hãy:
1. Tóm tắt UC-86 Drag-drop Workflow Designer
2. Liệt kê pages/components chính
3. Liệt kê APIs cần có hoặc cần tái sử dụng
4. Chia phase triển khai
5. Nêu rủi ro UX/kỹ thuật nếu làm sai designer
```

## 3.2. Phase 1 designer data mapping

```text
Đọc tài liệu M13 phần Workflow Designer.

Triển khai Phase 1.

Yêu cầu:
- tạo mapping giữa DB models và frontend canvas model:
  - stepToNode
  - nodeToStep
  - transToEdge
  - edgeToTransition
- tạo validation schema cho workflow definition
- validate:
  - có START
  - có END
  - không vòng lặp sai
  - mọi node cần kết nối hợp lệ
- chưa làm UI đầy đủ

Sau khi xong:
- nêu data mapping shape
- nêu validation rules
- nêu file helper/schema đã tạo
```

## 3.3. Phase 2 workflow designer UI

```text
Đọc tài liệu M13 phần React Flow WorkflowCanvas.

Triển khai Phase 2.

Yêu cầu:
- tạo page designer:
  - /dashboard/admin/workflow-designer
- tạo components:
  - WorkflowCanvas
  - nodeTypes (start, approval, condition, review, end)
  - NodePropertiesPanel
  - ValidationBanner
- dùng React Flow
- chưa làm import/export JSON hoàn chỉnh nếu chưa cần
- ưu tiên designer hoạt động tối thiểu nhưng đúng kiến trúc

Sau khi xong:
- liệt kê file UI
- nêu component tree
- nêu state management approach
- nêu phần nào còn thiếu để hoàn chỉnh
```

## 3.4. Phase 3 save/load + template import/export

```text
Đọc tài liệu M13 phần:
- load workflow từ DB
- save workflow
- export/import JSON
- template library

Triển khai Phase 3.

Yêu cầu:
- hoàn thiện load/save workflow definition
- tạo import/export JSON scaffold
- nếu template library chưa gắn MinIO thật, tạo abstraction rõ ràng
- chưa cần AI hay gợi ý tự sinh workflow

Sau khi xong:
- liệt kê API/helper liên quan
- nêu JSON shape của workflow export/import
- nêu phần nào là stub, phần nào dùng được ngay
```

## 3.5. Review UC-86

```text
/review-m09

Hãy review phần code UC-86 của M13 theo tài liệu M13 đã cung cấp.

Kiểm tra:
1. Designer có bám đúng "configuration over code" không
2. Mapping DB ↔ canvas có rõ không
3. Validation workflow có đủ chưa
4. UI có dùng được cho admin thật không
5. Rủi ro dữ liệu/designer corruption là gì
```

---

# 4. PROMPT CHO UC-87 – PHÊ DUYỆT & KÝ SỐ ĐIỆN TỬ

## 4.1. Prompt mở đầu UC-87

```text
/implement-from-design

Đọc tài liệu M13 phần:
- Phê duyệt & Ký số điện tử
- createDigitalSignature
- verifySignature

Chưa code.

Hãy:
1. Tóm tắt UC-87
2. Liệt kê model/schema cần bổ sung
3. Liệt kê APIs cần có
4. Nêu ranh giới giữa ký số nội bộ và PKI chính thức
5. Chia phase triển khai
```

## 4.2. Phase 1 schema signature

```text
/m09-phase1-schema

Đọc tài liệu M13 phần digital signature.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- thêm model WorkflowSignature nếu chưa có
- lưu:
  - instanceId
  - signedBy
  - signatureHash
  - documentHash
  - signedAt
  - algorithm
- nối relation với WorkflowInstance và User

Không làm API/UI.

Sau khi xong:
- liệt kê model đã thêm
- nêu index/unique phù hợp
- nêu relation chính
```

## 4.3. Phase 2 sign/verify service

```text
Đọc tài liệu M13 phần createDigitalSignature và verifySignature.

Triển khai Phase 2.

Yêu cầu:
- tạo service ký số nội bộ
- xác thực password xác nhận
- tạo SHA-256 hash đúng theo thiết kế
- lưu signature record
- tạo verify flow
- tích hợp audit log M01
- chưa làm UI đầy đủ

Sau khi xong:
- nêu flow sign
- nêu flow verify
- nêu các giả định bảo mật
- nêu giới hạn của giải pháp ký số nội bộ này
```

## 4.4. Phase 3 APIs + UI sign action

```text
Đọc tài liệu M13 phần API endpoints và digital signature.

Triển khai Phase 3.

Yêu cầu:
- tạo API:
  - POST /api/workflow/instances/[id]/sign
- tạo UI confirm-sign modal hoặc panel
- chỉ cho phép user có quyền WF.SIGN ký
- chỉ cho phép ký ở bước cuối phù hợp nếu rule yêu cầu

Sau khi xong:
- liệt kê endpoint và file UI
- nêu function codes liên quan
- nêu guard logic quan trọng
```

## 4.5. Review UC-87

```text
/review-m09

Hãy review phần code UC-87 của M13 theo tài liệu M13 đã cung cấp.

Kiểm tra:
1. WorkflowSignature có đủ dữ liệu không
2. Sign/verify flow có đúng không
3. Có thiếu audit không
4. Có điểm yếu bảo mật nào rõ ràng không
5. Có nhầm lẫn giữa internal signature và legal PKI không
```

---

# 5. PROMPT CHO UC-88 – THÔNG BÁO & NHẮC NHỞ TỰ ĐỘNG

## 5.1. Prompt mở đầu UC-88

```text
/implement-from-design

Đọc tài liệu M13 phần:
- WorkflowNotificationEngine
- notifyApprovers
- checkSLAViolations
- sendReminders

Chưa code.

Hãy:
1. Tóm tắt UC-88
2. Liệt kê services/APIs/jobs cần có
3. Nêu dữ liệu nào cần lưu thêm nếu hiện schema chưa đủ
4. Chia phase triển khai
```

## 5.2. Phase 1 notification service

```text
Đọc tài liệu M13 phần WorkflowNotificationEngine.

Triển khai Phase 1.

Yêu cầu:
- tạo notification service cho workflow
- hỗ trợ:
  - in-app notification abstraction
  - email abstraction
  - sms abstraction nếu cấu hình
- chưa cần triển khai provider thật nếu chưa có
- gắn với workflow instance + current step + approvers

Sau khi xong:
- liệt kê file service/helper đã tạo
- nêu message shape chuẩn
- nêu phần nào là adapter boundary
```

## 5.3. Phase 2 SLA violation + reminder jobs

```text
Đọc tài liệu M13 phần:
- checkSLAViolations
- sendReminders

Triển khai Phase 2.

Yêu cầu:
- tạo SLA violation checker
- tạo reminder job logic
- nếu cron/queue chưa cắm thật, tạo scheduler abstraction rõ ràng
- hỗ trợ:
  - quá hạn
  - sắp tới hạn 24h
- cập nhật cờ trạng thái phù hợp nếu schema đã có hoặc cần thêm field

Sau khi xong:
- nêu flow SLA checking
- nêu flow reminder
- nêu field/schema bổ sung nếu cần
- nêu chỗ cần cron/queue thật sau này
```

## 5.4. Phase 3 inbox/my requests APIs

```text
Đọc tài liệu M13 phần:
- Inbox cá nhân
- My requests
- API /api/workflow/inbox

Triển khai Phase 3.

Yêu cầu:
- tạo:
  - GET /api/workflow/inbox
  - có thể thêm GET /api/workflow/my-requests nếu cần tách rõ
- filter theo:
  - module
  - trạng thái
  - deadline
  - quá hạn/sắp hạn
- route mỏng, service rõ

Sau khi xong:
- liệt kê endpoint
- nêu response shape
- nêu query/filter hỗ trợ
```

## 5.5. Review UC-88

```text
/review-m09

Hãy review phần code UC-88 của M13 theo tài liệu M13 đã cung cấp.

Kiểm tra:
1. Notification engine có đủ abstraction không
2. SLA reminder có bám đúng rule không
3. Inbox/My requests có đúng nhu cầu tác chiến không
4. Có thiếu trạng thái hoặc cờ dữ liệu nào trong schema không
```

---

# 6. PROMPT CHO UC-89 – DASHBOARD WORKFLOW & BÁO CÁO TRẠNG THÁI

## 6.1. Prompt mở đầu UC-89

```text
/implement-from-design

Đọc tài liệu M13 phần:
- Dashboard workflow
- Inbox cá nhân
- Unit overview
- Admin dashboard
- SLA report
- API /api/workflow/stats

Chưa code.

Hãy:
1. Tóm tắt UC-89
2. Liệt kê KPI bắt buộc
3. Liệt kê APIs cần có
4. Liệt kê pages/components cần có
5. Chia phase triển khai
```

## 6.2. Phase 1 dashboard stats APIs

```text
Đọc tài liệu M13 phần dashboard.

Triển khai Phase 1.

Yêu cầu:
- tạo:
  - GET /api/workflow/stats
- hỗ trợ tối thiểu:
  - số workflow active
  - đúng hạn / trễ hạn
  - bottleneck theo step
  - số hồ sơ theo module
  - số hồ sơ theo trạng thái
- route mỏng, service aggregate rõ ràng

Sau khi xong:
- nêu response shape
- nêu KPI lấy từ bảng nào
- nêu phần nào cần materialized aggregate sau này nếu cần
```

## 6.3. Phase 2 dashboard UI

```text
Đọc tài liệu M13 phần dashboard views.

Triển khai Phase 2.

Yêu cầu:
- tạo pages/components cho:
  - inbox cá nhân
  - my requests
  - unit overview
  - admin dashboard
  - SLA report
- tối thiểu phải có:
  - KPI cards
  - pending/overdue lists
  - bottleneck table/chart
- phân biệt theo quyền WF.DASHBOARD

Sau khi xong:
- liệt kê file UI
- nêu component tree
- nêu cách tách view theo vai trò người dùng
```

## 6.4. Review UC-89

```text
/review-m09

Hãy review phần code UC-89 của M13 theo tài liệu M13 đã cung cấp.

Kiểm tra:
1. Dashboard có bám KPI thật của workflow không
2. Có phân biệt inbox / my requests / unit overview / admin dashboard đúng không
3. Có thiếu số liệu SLA quan trọng không
4. Có rủi ro performance nào rõ ràng không
```

---

# 7. PROMPT CHO FUNCTION CODES M13 (WF.*)

## 7.1. Prompt seed function codes

```text
Đọc tài liệu M13 phần RBAC Module M13.

Chưa code M13 tiếp nếu chưa chốt function codes.

Hãy:
1. Liệt kê toàn bộ function codes WF.* cần có theo thiết kế:
   - WF.VIEW
   - WF.INITIATE
   - WF.ACT
   - WF.SIGN
   - WF.DESIGN
   - WF.OVERRIDE
   - WF.DASHBOARD
   - WF.EXPORT
2. Kiểm tra codebase hiện tại hoặc seed hiện tại xem đã có chưa
3. Nếu chưa có, đề xuất patch seed cho M01
4. Nêu mapping role/position gợi ý ban đầu
```

## 7.2. Prompt patch seed vào M01

```text
Triển khai patch seed function codes cho M13.

Yêu cầu:
- thêm các WF.* function codes nếu chưa có
- không duplicate seed nếu đã tồn tại
- giữ style seed thống nhất với M01 hiện có

Sau khi xong:
- liệt kê function codes đã thêm
- nêu file seed đã sửa
- nêu bước tiếp theo trước khi protect workflow APIs
```

---

# 8. PROMPT TẠO WORKFLOW MẪU ƯU TIÊN

## 8.1. Prompt workflow templates

```text
Đọc tài liệu M13 phần danh sách 14 workflow nghiệp vụ triển khai trước.

Chưa code thêm engine.

Hãy:
1. Chuyển 6 workflow ưu tiên cao nhất thành dữ liệu cấu hình workflow mẫu:
   - Kết nạp Đảng viên mới
   - Đề xuất khen thưởng
   - Giải quyết chế độ BHXH
   - Bổ nhiệm/Điều động
   - Bảo lưu/Thôi học SV
   - Xét tốt nghiệp
2. Mỗi workflow phải mô tả:
   - code
   - name
   - module
   - entityType
   - các step
   - approver type
   - actions
   - terminal states
3. Trả theo JSON hoặc seed object có thể dùng cho DB seeding sau này
```

## 8.2. Prompt seed workflow templates

```text
Triển khai seed data cho workflow definitions mẫu ưu tiên.

Yêu cầu:
- tạo seed objects hoặc seed script cho các workflow mẫu
- không hard-code business logic vào engine
- mọi logic nằm trong definition/steps/actions nếu có thể

Sau khi xong:
- liệt kê workflow codes đã seed
- nêu file seed đã tạo/sửa
- nêu workflow nào còn cần refinement sau UAT
```

---

# 9. PROMPT REVIEW TOÀN BỘ M13

```text
/review-m09

Hãy review toàn bộ phần code M13 hiện có so với tài liệu M13 đã cung cấp và system docs:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- tài liệu M13 Workflow Phê duyệt Điện tử

Output:
1. phần đã đạt
2. phần còn thiếu
3. phần lệch kiến trúc
4. M13 đã đúng vai trò module nền tảng workflow chưa
5. integration với M01/M02 đã đủ chưa
6. risk về state machine / designer / signature / SLA / dashboard
7. thứ tự sửa tối ưu
```

---

# 10. CÁCH DÙNG KHUYẾN NGHỊ

## Thứ tự làm đúng cho M13

1. Đọc tổng quan M13
2. Mapping M13 vào codebase
3. Làm UC-85 schema + engine core trước
4. Seed function codes WF.* vào M01
5. Làm UC-86 designer
6. Làm UC-87 sign
7. Làm UC-88 notifications/SLA
8. Làm UC-89 dashboard
9. Tạo workflow definitions mẫu
10. Review toàn module

## Nguyên tắc

* Không làm designer trước engine
* Không protect APIs nếu WF.* chưa seed
* Không làm sign flow nếu chưa có state machine ổn định
* Không hard-code workflow business logic vào code nếu definition có thể cấu hình được

````

---

# Prompt mở đầu dùng ngay

Anh có thể bắt đầu bằng prompt này:

```text id="sjh9g0"
Đọc:
- .claude/CLAUDE.md
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- tài liệu M13 Workflow Phê duyệt Điện tử đã được cung cấp trong cuộc trò chuyện

Chưa code.

Hãy:
1. tóm tắt vai trò của M13 trong toàn hệ thống
2. liệt kê 5 use case UC-85 → UC-89
3. mapping M13 vào codebase hiện tại
4. liệt kê file cần tạo/sửa
5. chỉ ra integration points với M01 và M02
6. chia phase triển khai chi tiết
7. nêu rủi ro kiến trúc nếu làm sai thứ tự
````

Nếu anh muốn, tôi sẽ dựng tiếp cho anh luôn **bộ design docs chuẩn cho M13** theo cùng format đã làm cho M01, M02, M03, M05, M10.
