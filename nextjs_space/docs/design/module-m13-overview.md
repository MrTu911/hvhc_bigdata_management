# Module M13 – Workflow Phê duyệt Điện tử

## 1) `docs/design/module-m13-overview.md`

# Module M13 – Workflow Phê duyệt Điện tử

## 1. Mục tiêu module

M13 là module nền tảng dùng chung để tổ chức, điều phối, theo dõi và kiểm soát toàn bộ các quy trình phê duyệt điện tử trong hệ thống HVHC BigData. Module này không phục vụ riêng một nghiệp vụ đơn lẻ mà đóng vai trò **workflow platform** cho nhiều phân hệ như nhân sự, đảng vụ, chính sách, đào tạo, nghiên cứu khoa học, báo cáo, xuất biểu mẫu và các quy trình nội bộ khác.

M13 phải giải quyết đồng thời 5 nhóm bài toán:

1. Xây dựng và vận hành **state machine engine** cho các quy trình nhiều bước.
2. Cho phép quản trị viên nghiệp vụ thiết kế quy trình bằng **workflow designer** theo hướng cấu hình.
3. Tổ chức **phê duyệt, ký số điện tử, từ chối, chuyển trả, hủy, ghi nhận ý kiến** theo đúng thẩm quyền.
4. Tự động hóa **thông báo, nhắc việc, quá hạn, escalations**.
5. Cung cấp **dashboard trạng thái workflow**, báo cáo tắc nghẽn, thời gian xử lý, tỷ lệ đúng hạn.

## 2. Vai trò của M13 trong toàn hệ thống

M13 là một trong các module nền phải triển khai sớm, sau M01, M19, M02. Vai trò của M13 gồm:

* Chuẩn hóa cơ chế phê duyệt điện tử cho mọi module.
* Loại bỏ việc code riêng lẻ từng luồng duyệt trong từng phân hệ.
* Tạo nền cho kiểm soát thẩm quyền, nhật ký tác nghiệp và trách nhiệm cá nhân.
* Tạo đầu nối giữa dữ liệu nghiệp vụ và biểu mẫu/ký số/xuất báo cáo.
* Bảo đảm khả năng mở rộng về sau theo hướng thêm workflow template mới mà không phải viết lại core engine.

## 3. Phạm vi nghiệp vụ của M13

M13 quản lý **workflow runtime** và **workflow definition**, không sở hữu dữ liệu nghiệp vụ gốc của các module khác. Nói cách khác:

* Dữ liệu nghiệp vụ gốc vẫn thuộc module chủ quản như M02, M03, M05, M10, M09.
* M13 chỉ giữ:

  * định nghĩa quy trình,
  * trạng thái phê duyệt,
  * hành động phê duyệt,
  * người xử lý,
  * lịch sử,
  * chữ ký số,
  * thông báo,
  * SLA,
  * chỉ số vận hành.

M13 không được tạo ra “nguồn sự thật song song” cho hồ sơ nghiệp vụ.

## 4. Triết lý thiết kế

### 4.1. Configuration over code

M13 phải ưu tiên cấu hình thay vì hard-code. Quy trình mới cần được tạo chủ yếu bằng:

* workflow templates,
* step definitions,
* transition rules,
* approval policies,
* notification policies,
* SLA policies,
* signature policies.

### 4.2. Reuse core engine

Chỉ có một workflow engine dùng chung cho toàn hệ thống. Không cho phép mỗi module tự phát sinh một engine riêng.

### 4.3. Audit-first

Mọi hành vi khởi tạo, chuyển bước, phê duyệt, ký số, từ chối, hoàn trả, hủy quy trình đều phải được ghi log có cấu trúc.

### 4.4. Scope-aware

M13 không tự quyết phạm vi dữ liệu. Mọi quyền xem, hành động, ký duyệt phải tuân theo M01.

## 5. Phụ thuộc hệ thống

### 5.1. Phụ thuộc bắt buộc

#### M01 – Hệ thống Quản trị & Bảo mật

M13 phụ thuộc M01 cho:

* xác thực người dùng,
* RBAC theo function codes,
* scope theo đơn vị/cấp quản lý,
* audit nền,
* session,
* policy enforcement.

Function codes dự kiến dùng cho M13:

* `WF.VIEW`
* `WF.INITIATE`
* `WF.ACT`
* `WF.SIGN`
* `WF.DESIGN`
* `WF.OVERRIDE`
* `WF.DASHBOARD`
* `WF.EXPORT`

#### M02 – CSDL Cán bộ Nhân sự

M13 phụ thuộc M02 cho:

* thông tin người dùng/cán bộ,
* tổ chức đơn vị,
* chức vụ,
* vị trí công tác,
* quan hệ chỉ huy,
* dữ liệu người ký,
* tra cứu người xử lý theo vai trò tổ chức.

### 5.2. Phụ thuộc nên có

#### M19 – Master Data

Dùng cho:

* danh mục loại workflow,
* loại hành động,
* loại trạng thái,
* lý do từ chối,
* mức độ ưu tiên,
* mức độ khẩn,
* kênh thông báo,
* loại SLA,
* loại chữ ký.

#### M18 – Template Management & Export Engine

Dùng cho:

* biểu mẫu trình ký,
* preview tài liệu trước ký,
* xuất hồ sơ sau duyệt,
* sinh PDF/Word theo dữ liệu workflow.

## 6. Use cases chính của M13

### UC-85: State Machine Engine

* Khởi tạo workflow instance.
* Xác định bước hiện tại.
* Kiểm tra transition hợp lệ.
* Ghi nhận action và chuyển trạng thái.
* Tính deadline/SLA cho từng bước.

### UC-86: Drag-drop Workflow Designer

* Tạo workflow template.
* Kéo thả các step.
* Định nghĩa điều kiện rẽ nhánh.
* Gán approver policy.
* Phiên bản hóa template.

### UC-87: Phê duyệt & Ký số điện tử

* Approve/reject/return/cancel/escalate.
* Ký số tại bước yêu cầu ký.
* Kiểm tra điều kiện ký hợp lệ.
* Lưu bằng chứng chữ ký.

### UC-88: Thông báo & Nhắc nhở tự động

* Gửi thông báo khi có việc mới.
* Nhắc việc trước hạn/quá hạn.
* Escalation khi bước xử lý bị treo.
* Nhóm kênh: in-app, email, SMS/intranet adapter nếu có.

### UC-89: Dashboard workflow & Báo cáo trạng thái

* Theo dõi số lượng đang chờ xử lý.
* Phân tích bottleneck.
* Theo dõi đúng hạn/quá hạn.
* Báo cáo theo template, module, đơn vị, người xử lý.

## 7. Tác nhân hệ thống

* Người khởi tạo hồ sơ
* Người xử lý bước
* Người phê duyệt
* Người ký số
* Quản trị workflow
* Quản trị hệ thống
* Chỉ huy/ban giám sát theo dõi dashboard
* Hệ thống thông báo nền

## 8. Các thực thể lõi dự kiến

* `WorkflowTemplate`
* `WorkflowTemplateVersion`
* `WorkflowStepTemplate`
* `WorkflowTransitionTemplate`
* `WorkflowInstance`
* `WorkflowStepInstance`
* `WorkflowAction`
* `WorkflowAssignment`
* `WorkflowSignature`
* `WorkflowNotification`
* `WorkflowEscalation`
* `WorkflowAuditLog`
* `WorkflowAttachment`
* `WorkflowSlaPolicy`
* `WorkflowParticipantPolicy`

## 9. Nguyên tắc tích hợp với module nghiệp vụ

Mọi module nghiệp vụ khi dùng M13 cần truyền tối thiểu:

* `entityType`
* `entityId`
* `workflowTemplateCode`
* `initiatorId`
* dữ liệu context tối thiểu để render title/summary

M13 chỉ lưu snapshot vừa đủ để hiển thị và truy vết, không thay thế entity gốc.

## 10. Rủi ro kiến trúc cần kiểm soát

1. Hard-code workflow theo từng module → khó bảo trì.
2. Gộp dữ liệu nghiệp vụ vào M13 → trùng nguồn dữ liệu.
3. Không version template → phá vỡ quy trình đang chạy.
4. Không tách runtime và definition → khó nâng cấp.
5. Không ràng buộc thẩm quyền qua M01 → rủi ro an ninh.
6. Không lấy người ký từ M02 → sai chủ thể thẩm quyền.
7. Thông báo gửi đồng loạt thiếu kiểm soát → spam hệ thống.
8. Ký số không lưu bằng chứng → không đủ giá trị kiểm tra.

## 11. Chiến lược triển khai theo phase

### Phase 1

* Core entities
* Workflow template + version
* Runtime instance
* Approve/reject/return cơ bản
* In-app notification cơ bản
* Dashboard tối thiểu

### Phase 2

* Designer cấu hình nâng cao
* SLA, overdue, escalation
* Chữ ký số tích hợp adapter
* Báo cáo nâng cao
* Template export tích hợp M18

### Phase 3

* Workflow marketplace/template library
* Rule engine nâng cao
* Delegate/substitute approver
* Multi-signature/composite approval
* Cross-module orchestration