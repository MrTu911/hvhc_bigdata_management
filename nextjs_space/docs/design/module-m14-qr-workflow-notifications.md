

## 4) `docs/design/module-m14-qr-workflow-notifications.md`

# Module M14 – QR Attendance, Mobile Workflow và Push Notifications

## 1. Mục tiêu

Tài liệu này bao phủ ba tính năng thực chiến nổi bật của M14:

* điểm danh QR code,
* phê duyệt/workflow inbox trên mobile,
* push notifications.

## 2. QR Attendance

Theo tài liệu gốc, UC-72 là tính năng then chốt. Giảng viên mở màn hình camera scan QR, app gửi `sectionId`, `date`, `token`, `method: 'QR'` lên API `/api/education/attendance`; QR data có cấu trúc `HVHC:SESSION:sectionId:date:token`, còn token một lần được tạo từ endpoint `/api/education/sections/[id]/qr/route.ts` và lưu Redis TTL 10 phút. fileciteturn4file0L28-L40

### Nguyên tắc bảo vệ

1. Token ngắn hạn, một lần dùng hoặc kiểm soát số lần dùng.
2. Kiểm tra thời gian hiệu lực và buổi học hợp lệ.
3. Ràng buộc section/date/session context.
4. Có log điểm danh và chống replay.

## 3. Mobile workflow

Theo tài liệu gốc, chỉ huy/trưởng có màn hình Dashboard → Phê duyệt → Workflow inbox; cán bộ cũng có inbox workflow M13. fileciteturn4file0L19-L27

### Năng lực tối thiểu

* xem danh sách task chờ xử lý
* xem tóm tắt workflow
* approve/reject/return ở mức action cơ bản
* xem lịch sử gần

### Nguyên tắc

* vẫn dùng API M13 hiện có,
* không cho mobile bypass policy,
* không hỗ trợ offline cho workflow nhạy cảm ở phase đầu.

## 4. Push notifications

Theo tài liệu gốc, Expo Notifications là stack chuẩn. fileciteturn4file0L7-L18

### Nhóm push cần hỗ trợ

* workflow task mới
* cảnh báo học vụ
* thay đổi lịch học/lịch dạy
* thông báo hệ thống
* cảnh báo điểm danh/sự kiện gần hạn

### Kiến trúc gợi ý

* device token registration
* push preference per user
* notification category mapping
* deeplink routing vào đúng màn hình

## 5. API gợi ý

* `POST /api/mobile/devices/register`
* `POST /api/mobile/devices/unregister`
* `GET /api/mobile/notifications`
* `POST /api/mobile/notifications/:id/read`
* `GET /api/workflows/me/tasks`
* `POST /api/workflows/:id/actions`
* `POST /api/education/attendance`
* `GET /api/education/sections/:id/qr`

## 6. Rủi ro cần kiểm soát

* QR bị chụp lại và dùng lại ngoài thời hạn.
* Push deeplink mở vào màn hình mà user không còn quyền.
* Mobile workflow approve quá nhanh nhưng thiếu thông tin ngữ cảnh.
* Notification spam làm giảm hiệu quả sử dụng.

---