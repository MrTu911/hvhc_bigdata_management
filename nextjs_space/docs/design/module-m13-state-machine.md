## 2) `docs/design/module-m13-state-machine.md`

# Module M13 – State Machine Engine

## 1. Mục tiêu

State Machine Engine là lõi vận hành của M13, chịu trách nhiệm quản lý trạng thái quy trình ở runtime. Thành phần này phải bảo đảm rằng mọi workflow instance chỉ chuyển từ trạng thái này sang trạng thái khác theo các quy tắc đã được định nghĩa từ trước.

## 2. Phạm vi

Bao gồm:

* khởi tạo instance,
* gán bước đầu tiên,
* xử lý action,
* kiểm tra transition,
* tính SLA,
* kết thúc workflow,
* hủy workflow,
* ghi log.

Không bao gồm UI designer.

## 3. Khái niệm lõi

### 3.1. Template definition

Là định nghĩa quy trình chuẩn, gồm step, transition, approver policy, SLA policy.

### 3.2. Runtime instance

Là bản chạy thực tế của một hồ sơ cụ thể.

### 3.3. Step instance

Là bước thực tế đang hoặc đã được xử lý trong runtime.

### 3.4. Action

Là hành động người dùng hoặc hệ thống thực hiện tại một step, ví dụ: approve, reject, return, submit, cancel, escalate.

## 4. Trạng thái chuẩn đề xuất

### 4.1. Workflow instance status

* `DRAFT`
* `PENDING`
* `IN_PROGRESS`
* `APPROVED`
* `REJECTED`
* `RETURNED`
* `CANCELLED`
* `EXPIRED`
* `FAILED`

### 4.2. Step instance status

* `WAITING`
* `READY`
* `IN_PROGRESS`
* `APPROVED`
* `REJECTED`
* `RETURNED`
* `SKIPPED`
* `CANCELLED`
* `EXPIRED`

## 5. Action chuẩn đề xuất

* `SUBMIT`
* `APPROVE`
* `REJECT`
* `RETURN`
* `CANCEL`
* `ESCALATE`
* `SIGN`
* `COMMENT`
* `REASSIGN`
* `SYSTEM_TIMEOUT`

## 6. Thiết kế dữ liệu mức logic

### `WorkflowTemplate`

* id
* code
* name
* moduleKey
* description
* isActive
* createdBy
* createdAt

### `WorkflowTemplateVersion`

* id
* templateId
* versionNo
* status (`DRAFT`, `PUBLISHED`, `ARCHIVED`)
* publishedAt
* publishedBy
* definitionJson (optional cached)

### `WorkflowStepTemplate`

* id
* templateVersionId
* code
* name
* stepType (`START`, `TASK`, `APPROVAL`, `SIGNATURE`, `END`)
* orderIndex
* slaHours
* isParallel
* configJson

### `WorkflowTransitionTemplate`

* id
* templateVersionId
* fromStepCode
* actionCode
* toStepCode
* conditionExpression
* priority

### `WorkflowInstance`

* id
* templateId
* templateVersionId
* entityType
* entityId
* title
* summary
* status
* currentStepCode
* initiatorId
* currentAssigneeId (nullable)
* startedAt
* completedAt
* cancelledAt

### `WorkflowStepInstance`

* id
* workflowInstanceId
* stepCode
* status
* assigneeId
* assignedAt
* startedAt
* actedAt
* dueAt
* completedAt

### `WorkflowAction`

* id
* workflowInstanceId
* stepInstanceId
* actionCode
* actionBy
* actionAt
* comment
* payloadJson

## 7. Luồng xử lý chuẩn

### 7.1. Khởi tạo workflow

1. Nhận `workflowTemplateCode`, `entityType`, `entityId`, `initiatorId`.
2. Resolve template version đang published.
3. Validate initiator có quyền `WF.INITIATE`.
4. Tạo `WorkflowInstance`.
5. Tạo `WorkflowStepInstance` đầu tiên.
6. Resolve assignee theo approver policy.
7. Gửi thông báo bước đầu.

### 7.2. Thực hiện action

1. Tải workflow instance.
2. Tải current step instance.
3. Kiểm tra user có quyền hành động tại step này.
4. Kiểm tra action có hợp lệ theo transition template.
5. Ghi `WorkflowAction`.
6. Cập nhật trạng thái step hiện tại.
7. Xác định bước tiếp theo.
8. Tạo step instance mới hoặc kết thúc workflow.
9. Gửi thông báo liên quan.
10. Ghi audit log.

## 8. Quy tắc phân quyền khi thực hiện action

Muốn thực hiện action cần đồng thời thỏa:

1. Người dùng đã authenticated qua M01.
2. Có function code phù hợp (`WF.ACT`, `WF.SIGN`, `WF.OVERRIDE`).
3. Thuộc danh sách assignee hoặc approver hợp lệ.
4. Scope dữ liệu phù hợp với entity nguồn.
5. Không vi phạm trạng thái đã khóa.

## 9. Xử lý rẽ nhánh

Engine phải hỗ trợ tối thiểu 3 kiểu:

* branch theo action,
* branch theo điều kiện dữ liệu,
* branch theo kết quả tính toán chính sách.

Điều kiện nên lưu dạng biểu thức có kiểm soát, không cho nhúng code tùy ý trực tiếp.

## 10. Song song và hội tụ

Phase 1 có thể hỗ trợ đơn tuyến là chính. Song song chỉ nên hỗ trợ mức tối thiểu:

* parallel approvals all-must-approve,
* parallel approvals any-one-approve.

Các nhánh song song khi hội tụ phải có điều kiện hoàn tất rõ ràng để tránh deadlock.

## 11. SLA và timeout

Mỗi step có thể cấu hình:

* `dueAt`
* `remindBeforeHours`
* `escalateAfterHours`
* `autoActionOnTimeout`

Timeout không được tự động approve; chỉ nên:

* escalate,
* notify,
* mark overdue,
* hoặc return to supervisor nếu policy cho phép.

## 12. Ghi log và khả năng kiểm tra

Mọi thay đổi trạng thái phải có:

* trước khi đổi,
* sau khi đổi,
* ai đổi,
* lúc nào,
* từ IP/session nào nếu có,
* comment/bằng chứng liên quan.

## 13. API gợi ý

* `POST /api/workflows/start`
* `GET /api/workflows/:id`
* `GET /api/workflows/:id/history`
* `POST /api/workflows/:id/actions`
* `POST /api/workflows/:id/cancel`
* `POST /api/workflows/:id/escalate`
* `GET /api/workflows/me/tasks`

## 14. Rủi ro cần tránh

* Cho phép chuyển trạng thái bỏ qua transition.
* Không khóa transaction khi ghi action và tạo bước mới.
* Không version hóa template gây lệch runtime.
* Cho override quá rộng.
* Dùng current assignee đơn giản cho bài toán multi-approver phức tạp mà không có bảng assignment riêng.

---