

## 5) `docs/design/module-m14-security-device-ops.md`

# Module M14 – Security, Device Operations và Mobile Governance

## 1. Mục tiêu

Tài liệu này mô tả lớp bảo mật thiết bị và quản trị vận hành mobile của M14. Tài liệu gốc đã xác định các yếu tố bảo mật như biometric auth, JWT refresh, certificate pinning; đồng thời nêu rõ ứng dụng được deploy qua MDM nội bộ Học viện. fileciteturn4file0L7-L18

## 2. Device registration

Cần có khái niệm thiết bị tin cậy/đã đăng ký:

* userId
* deviceId
* platform
* appVersion
* pushToken
* lastSeenAt
* securityState

## 3. Biometric auth

### Vai trò

* mở khóa app nhanh,
* xác nhận thao tác nhạy cảm ở mức client,
* giảm rủi ro mở app trái phép trên thiết bị đã đăng nhập.

### Không được hiểu sai

* biometric không thay thế xác thực server,
* không thay thế RBAC,
* không thay thế re-check của action nhạy cảm.

## 4. Token handling

* access token ngắn hạn
* refresh token quản lý chặt
* secure storage cho secrets/tokens
* wipe local session khi logout hoặc device revoked

## 5. Certificate pinning

Tài liệu gốc nêu certificate pinning là lớp bảo mật mong muốn. fileciteturn4file0L14-L18

Định hướng triển khai:

* Phase 1: chuẩn bị abstraction và config
* Phase 2: bật ở môi trường nội bộ ổn định
* Phase 3: hoàn thiện rotation playbook

## 6. MDM deployment & governance

Vì tài liệu gốc nêu APK deploy qua MDM nội bộ HV, M14 cần có quy chế vận hành:

* kiểm soát version bắt buộc
* chặn app quá cũ
* quản lý rollout theo nhóm người dùng
* remote revoke nếu thiết bị mất hoặc nghỉ công tác

## 7. Logging và audit

Cần ghi log:

* device login/logout
* biometric enabled/disabled
* token refresh failures
* push token changes
* offline sync failures
* app version outdated warnings

## 8. RBAC gợi ý

Ngoài quyền từ module nghiệp vụ, có thể cần nhóm quyền mobile admin:

* `MOBILE.DEVICE_VIEW`
* `MOBILE.DEVICE_MANAGE`
* `MOBILE.PUSH_MANAGE`
* `MOBILE.SYNC_VIEW`
* `MOBILE.ADMIN`

## 9. Rủi ro cần kiểm soát

* thiết bị mất nhưng session local chưa bị thu hồi.
* build/app version phân mảnh quá mạnh.
* certificate pinning làm khóa app nếu xoay chứng thư không chuẩn.
* quá nhiều dữ liệu nhạy cảm được lưu cục bộ.

--