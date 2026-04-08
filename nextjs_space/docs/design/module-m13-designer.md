## 3) `docs/design/module-m13-designer.md`

# Module M13 – Workflow Designer

## 1. Mục tiêu

Workflow Designer là công cụ cho phép quản trị nghiệp vụ hoặc quản trị hệ thống thiết kế, phiên bản hóa và công bố quy trình mà không phải sửa code lõi. Đây là thành phần then chốt để thực hiện triết lý configuration over code.

## 2. Đối tượng sử dụng

* Quản trị workflow cấp hệ thống
* Cán bộ quản trị nghiệp vụ được ủy quyền
* Tổ triển khai kỹ thuật khi cấu hình quy trình mới

Không mở designer cho người dùng phổ thông.

## 3. Nguyên tắc thiết kế

1. Tách definition khỏi runtime.
2. Tách draft/published/archive rõ ràng.
3. Không cho sửa trực tiếp version đang chạy.
4. Có validate trước publish.
5. Có preview luồng.
6. Có rollback về version trước.

## 4. Năng lực cần có

### 4.1. Quản lý template

* Tạo template mới
* Sao chép từ template cũ
* Tạo version mới
* Activate/deactivate
* Archive

### 4.2. Thiết kế step

* Tạo step
* Kéo thả thứ tự
* Chọn loại step
* Gán biểu tượng/màu hiển thị (UI)
* Cấu hình metadata step

### 4.3. Thiết kế transition

* Nối giữa các step
* Gán action trigger
* Gắn điều kiện
* Gắn priority khi có nhiều nhánh

### 4.4. Gán người xử lý

Approver policy nên hỗ trợ:

* cụ thể theo người,
* theo chức vụ,
* theo đơn vị,
* theo vai trò trên entity,
* theo quan hệ chỉ huy,
* theo tập người từ query policy có kiểm soát.

### 4.5. Cấu hình SLA

* hạn xử lý,
* nhắc trước hạn,
* escalations,
* cảnh báo quá hạn.

### 4.6. Cấu hình thông báo

* khi nhận việc,
* khi chuyển bước,
* khi gần đến hạn,
* khi bị từ chối,
* khi hoàn tất.

### 4.7. Cấu hình chữ ký số

* step nào bắt buộc ký,
* loại chữ ký,
* thứ tự ký,
* có bắt buộc ký trước hay sau approve.

## 5. Mô hình definition gợi ý

Một workflow definition gồm:

* metadata của template,
* danh sách step definitions,
* danh sách transition definitions,
* approver policies,
* notification policies,
* sla policies,
* signature policies,
* validation rules.

## 6. Validation trước publish

Muốn publish template phải vượt qua các kiểm tra:

1. Có đúng 1 start step.
2. Có ít nhất 1 end path.
3. Không có step mồ côi.
4. Không có transition thiếu action hoặc thiếu đích.
5. Mọi step approval phải có approver policy.
6. Mọi step ký số phải có signature policy.
7. Không có vòng lặp vô hạn không được kiểm soát.
8. Mọi mã step và action là duy nhất trong phạm vi version.

## 7. Versioning strategy

### 7.1. Nguyên tắc

* Mỗi template có nhiều version.
* Chỉ một version published tại một thời điểm.
* Workflow instance đang chạy phải giữ nguyên version tại lúc khởi tạo.

### 7.2. Trạng thái version

* `DRAFT`
* `PUBLISHED`
* `ARCHIVED`

### 7.3. Khi sửa quy trình

* Không sửa version published đang có runtime cũ.
* Tạo draft version mới.
* Validate.
* Publish.
* Workflow mới dùng version mới; workflow cũ tiếp tục theo version cũ.

## 8. Gợi ý UI designer

Màn hình nên chia 4 vùng:

1. Danh sách template/version bên trái.
2. Canvas designer ở giữa.
3. Properties panel bên phải.
4. Thanh validate/publish/test ở trên.

Các tab cấu hình trong properties:

* General
* Assignee
* Conditions
* SLA
* Notification
* Signature
* Security

## 9. Quyền hạn UI/API

* `WF.DESIGN`: tạo/sửa draft template
* `WF.OVERRIDE`: publish/archive/force actions đặc biệt
* `WF.VIEW`: xem template

## 10. API gợi ý

* `GET /api/workflow-templates`
* `POST /api/workflow-templates`
* `GET /api/workflow-templates/:id`
* `POST /api/workflow-templates/:id/versions`
* `GET /api/workflow-templates/:id/versions/:versionId`
* `PUT /api/workflow-templates/:id/versions/:versionId`
* `POST /api/workflow-templates/:id/versions/:versionId/validate`
* `POST /api/workflow-templates/:id/versions/:versionId/publish`
* `POST /api/workflow-templates/:id/versions/:versionId/archive`
* `POST /api/workflow-templates/:id/versions/:versionId/clone`

## 11. Rủi ro cần kiểm soát

* Cho người dùng nghiệp vụ publish mà không review.
* Lưu conditionExpression quá tự do.
* Không snapshot approver policy tại runtime.
* Không có rollback version.
* Canvas đẹp nhưng dữ liệu definition không chặt.

---

