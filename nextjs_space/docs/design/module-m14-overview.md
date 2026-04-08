# Module M14 – Ứng dụng Di động

## 1) `docs/design/module-m14-overview.md`

# Module M14 – Ứng dụng Di động

## 1. Mục tiêu module

M14 là module ứng dụng di động cho cán bộ, giảng viên, học viên và chỉ huy của Học viện Hậu cần. Theo tài liệu gốc, M14 được xây dựng bằng React Native/Expo, dùng TypeScript, Redux Toolkit, React Query và Expo Notifications; hỗ trợ iOS 16+, Android 10+, triển khai APK qua MDM nội bộ; có offline mode bằng SQLite local cache, sync queue khi reconnect, conflict resolution; và các lớp bảo mật như biometric auth, JWT refresh, certificate pinning. fileciteturn4file0L1-L18

## 2. Định vị trong hệ thống

Tài liệu gốc nêu rõ triết lý thiết kế quan trọng nhất của M14: **không tạo backend mới – 100% tái sử dụng API của 16 module hiện có**. Mobile App chỉ là một client khác của cùng backend. fileciteturn4file0L7-L18

Vì vậy, M14 phải được coi là:

* lớp client mobile dùng chung backend hiện có,
* lớp trải nghiệm người dùng tối ưu cho thiết bị cầm tay,
* lớp đồng bộ/offline có kiểm soát,
* không phải module sinh logic nghiệp vụ lõi mới.

## 3. Phụ thuộc hệ thống

### 3.1. Phụ thuộc bắt buộc

#### M01 – Auth, RBAC, session, security

M14 cần M01 cho đăng nhập, refresh token, scope, bảo vệ session, policy truy cập, và các ràng buộc bảo mật thiết bị.

#### Các module nghiệp vụ nguồn

Theo tài liệu gốc, M14 tái sử dụng API của 16 module; trong ví dụ use cases và màn hình, các phụ thuộc trực tiếp nổi bật gồm:

* M02: hồ sơ cá nhân cán bộ
* M05: phụ cấp/BHXH/chính sách
* M07: EIS score, GPA, hồ sơ học viên/giảng viên
* M10: lịch học, lịch dạy, điểm, điểm danh, GPA
* M11: dashboard hiển thị trên mobile cho chỉ huy
* M13: workflow inbox, phê duyệt mobile, thông báo liên quan. fileciteturn4file0L19-L27

### 3.2. Phụ thuộc nên có

#### M12 – Dữ liệu & hạ tầng

Dùng cho push token storage, offline sync telemetry, file/object storage hỗ trợ tài liệu, monitoring cho mobile API usage nếu cần.

#### M18 – Export / template

Có thể dùng khi cần xem/ tải tài liệu, quyết định, biểu mẫu trên mobile.

## 4. Use cases chính

Theo tài liệu gốc, M14 có 5 use case mới từ UC-71 đến UC-75. Dựa vào nội dung kỹ thuật và nhóm tính năng, có thể chuẩn hóa thành 5 khối năng lực như sau:

* UC-71: Mobile shell, authentication và hồ sơ cá nhân
* UC-72: QR Attendance và thao tác học vụ mobile
* UC-73: Offline mode, local cache và sync queue
* UC-74: Mobile workflow approvals và dashboard cho chỉ huy
* UC-75: Push notifications, security hardening và mobile operations

## 5. Nhóm người dùng và màn hình chính

Tài liệu gốc đã xác định bốn nhóm đối tượng:

* Cán bộ: Home → Hồ sơ cá nhân → Chính sách → Thông báo
* Giảng viên: Home → Lịch dạy → Điểm danh → Nhập điểm
* Học viên/SV: Home → Lịch học → Điểm → GPA → Cảnh báo
* Chỉ huy/Trưởng: Home → Dashboard → Phê duyệt → Workflow inbox. fileciteturn4file0L19-L27

## 6. Thực thể lõi phía mobile

M14 nên có các thực thể local/config sau:

* `MobileSession`
* `MobileDeviceRegistration`
* `OfflineCacheEntry`
* `OfflineSyncQueueItem`
* `PushNotificationToken`
* `MobileUserPreferences`
* `MobileSecurityState`
* `MobileSyncLog`

## 7. Nguyên tắc thiết kế

1. API reuse 100%, không tạo backend đặc thù nếu không thực sự bắt buộc.
2. Mobile-first UX nhưng không được lệch logic nghiệp vụ so với web.
3. Offline có giới hạn, chỉ với dữ liệu/thao tác được phép.
4. Sync phải có retry, conflict policy và audit tối thiểu.
5. Bảo mật thiết bị là lớp bổ sung, không thay thế kiểm soát server-side.

## 8. Rủi ro kiến trúc cần kiểm soát

1. Mobile tự tạo API riêng làm lệch backend chuẩn.
2. Offline queue gửi trùng dữ liệu khi reconnect.
3. Dữ liệu cache local quá lâu gây hiển thị thông tin cũ.
4. Biometric local được dùng sai như quyền truy cập tuyệt đối thay cho server auth.
5. QR attendance bị giả mạo nếu token rotation không chặt.

## 9. Chiến lược triển khai theo phase

### Phase 1

* Auth shell
* role-based navigation
* profile/schedule/scores read-only
* workflow inbox read-only + basic action
* offline cache cơ bản

### Phase 2

* QR attendance
* score draft offline
* selective sync queue
* push notifications
* dashboard mobile cho chỉ huy

### Phase 3

* biometric hardening đầy đủ
* advanced offline conflict resolution
* document preview/download nâng cao
* analytics và telemetry cho mobile operations

---