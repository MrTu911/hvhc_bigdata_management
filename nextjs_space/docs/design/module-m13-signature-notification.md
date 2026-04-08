## 4) `docs/design/module-m13-signature-notification.md`

# Module M13 – Phê duyệt, Ký số và Thông báo

## 1. Mục tiêu

Tài liệu này mô tả hai nhóm năng lực liên quan chặt chẽ với nhau trong M13:

1. Tác nghiệp phê duyệt và ký số điện tử.
2. Thông báo, nhắc việc, cảnh báo và escalation tự động.

## 2. Phê duyệt điện tử

### 2.1. Hành động nghiệp vụ chuẩn

* duyệt (`APPROVE`)
* không duyệt (`REJECT`)
* trả lại bổ sung (`RETURN`)
* hủy quy trình (`CANCEL`)
* chuyển xử lý (`REASSIGN`)
* nâng cấp xử lý (`ESCALATE`)
* cho ý kiến (`COMMENT`)

### 2.2. Yêu cầu nghiệp vụ

* Chỉ người được giao mới được thao tác.
* Mọi hành động phải có thời gian, người thực hiện, comment nếu policy yêu cầu.
* Một số bước có thể bắt buộc nhập lý do khi reject/return.
* Có thể yêu cầu đính kèm minh chứng ở một số bước.

## 3. Ký số điện tử

### 3.1. Vai trò

Ký số là lớp xác nhận pháp lý/kỹ thuật ở các bước có giá trị chứng nhận cao hơn hành động approve thông thường.

### 3.2. Kiểu tích hợp

Thiết kế nên theo adapter để không phụ thuộc chặt vào một nhà cung cấp:

* `SignatureProviderAdapter`
* `SignaturePayloadBuilder`
* `SignatureVerificationService`

### 3.3. Thực thể gợi ý

`WorkflowSignature`

* id
* workflowInstanceId
* stepInstanceId
* signerId
* signatureType
* providerCode
* signedAt
* status
* certificateInfoJson
* evidenceFileId
* hashValue

### 3.4. Quy tắc ký

* Chỉ step có `requiresSignature = true` mới mở hành vi ký.
* Có thể ký trước approve hoặc approve rồi ký, tùy policy.
* Nếu ký thất bại phải không làm hỏng trạng thái workflow ngoài ý muốn.
* Chữ ký phải lưu được bằng chứng kiểm tra về sau.

### 3.5. Trạng thái ký

* `PENDING`
* `SIGNED`
* `FAILED`
* `REVOKED`
* `EXPIRED`

## 4. Gắn tài liệu cần ký

M13 không nên tự render tài liệu phức tạp. Khi cần tài liệu ký:

* lấy dữ liệu từ entity nguồn,
* gọi M18 render preview/PDF,
* trả tài liệu vào signing flow,
* lưu file và metadata kết quả.

## 5. Thông báo tự động

### 5.1. Mục tiêu

Bảo đảm người dùng biết việc cần xử lý đúng lúc, tránh nghẽn luồng, và giúp chỉ huy nắm tình trạng thực hiện.

### 5.2. Loại thông báo

* Có việc mới
* Sắp đến hạn
* Quá hạn
* Bị trả lại
* Bị từ chối
* Đã hoàn tất
* Được escalated
* Ký số thành công/thất bại

### 5.3. Kênh thông báo

Phase 1:

* in-app notification
* email nội bộ nếu hạ tầng cho phép

Phase 2:

* SMS gateway/intranet gateway
* integration với hệ thống nhắn tin nội bộ

### 5.4. Thực thể gợi ý

`WorkflowNotification`

* id
* workflowInstanceId
* recipientId
* channel
* eventType
* title
* message
* status
* scheduledAt
* sentAt
* readAt
* payloadJson

## 6. Reminder và escalation

### 6.1. Reminder

Nhắc việc khi:

* còn X giờ trước hạn,
* đúng thời điểm đến hạn,
* quá hạn Y giờ.

### 6.2. Escalation

Khi bước bị treo quá lâu, hệ thống có thể:

* gửi nhắc lãnh đạo trực tiếp,
* chuyển cấp trên,
* tạo cảnh báo dashboard,
* đánh dấu mức độ rủi ro quy trình.

### 6.3. Nguyên tắc

* escalation không tự động thay đổi dữ liệu nghiệp vụ gốc,
* escalation phải có log,
* mọi hành vi tự động cần minh bạch.

## 7. Cron/background jobs gợi ý

* `workflow-reminder-job`
* `workflow-overdue-job`
* `workflow-escalation-job`
* `workflow-signature-retry-job`

## 8. API gợi ý

* `POST /api/workflows/:id/actions/approve`
* `POST /api/workflows/:id/actions/reject`
* `POST /api/workflows/:id/actions/return`
* `POST /api/workflows/:id/actions/sign`
* `GET /api/notifications/my`
* `POST /api/notifications/:id/read`
* `POST /api/workflows/:id/escalations/manual`

## 9. Rủi ro cần kiểm soát

* Trộn approve với sign thành một hành động không rõ ràng.
* Không có retry strategy cho lỗi notification.
* Gửi trùng lặp nhiều thông báo.
* Ký số thành công nhưng không gắn bằng chứng vào workflow.
* Không kiểm tra quyền ký theo M01 + dữ liệu chức vụ từ M02.

---