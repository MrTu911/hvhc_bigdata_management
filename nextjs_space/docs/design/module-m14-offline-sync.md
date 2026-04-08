

## 3) `docs/design/module-m14-offline-sync.md`

# Module M14 – Offline Mode, Local Cache và Sync Queue

## 1. Mục tiêu

Tài liệu này chi tiết hóa năng lực offline của M14. Theo tài liệu gốc, offline mode dùng SQLite local cache, sync queue khi reconnect và conflict resolution. Tài liệu cũng đưa ví dụ cấu hình cache TTL cho lịch học, hồ sơ cá nhân và điểm; đồng thời minh họa `offlineQueue` cho điểm danh offline và nhập điểm nháp offline. fileciteturn4file0L7-L18 fileciteturn4file0L41-L56

## 2. Nguyên tắc offline

1. Không phải mọi dữ liệu đều được cache offline.
2. Không phải mọi mutation đều được phép offline.
3. Offline queue chỉ áp dụng cho tác vụ có thể replay an toàn.
4. Mọi sync lại phải idempotent hoặc có de-duplication token.

## 3. Offline cache strategy

Tài liệu gốc gợi ý:

* `/api/education/schedule` TTL 1 ngày
* `/api/personnel/[id]` TTL 7 ngày
* `/api/education/scores` TTL 1 giờ. fileciteturn4file0L41-L49

Từ đó có thể chuẩn hóa các nhóm cache:

### Cache dài hơn

* hồ sơ cá nhân ít thay đổi
* thông tin cài đặt app

### Cache ngắn hơn

* điểm số
* lịch học/lịch dạy gần thời gian hiện tại
* workflow inbox
* dashboard summary

## 4. Sync queue model

Tài liệu gốc minh họa queue item có:

* `action`
* `data`
* `retries`
* `createdAt`. fileciteturn4file0L50-L55

Nên chuẩn hóa thêm:

* `queueId`
* `entityType`
* `entityKey`
* `dedupKey`
* `status`
* `lastTriedAt`
* `errorMessage`
* `userId`

## 5. Loại action phù hợp cho offline

### Cho phép sớm

* attendance submit dạng queued
* score draft save
* acknowledge local notification
* form drafts

### Không nên cho offline giai đoạn đầu

* phê duyệt workflow quan trọng
* thay đổi dữ liệu nhạy cảm nhân sự/chính sách
* thao tác cần kiểm tra quyền thời gian thực nhiều bước

## 6. Conflict resolution

### Chiến lược gợi ý

* server wins cho dữ liệu chuẩn
* merge with user confirmation cho dữ liệu nháp
* reject and re-edit cho tác vụ hết hạn/ngữ cảnh không còn hợp lệ

## 7. Sync triggers

Tài liệu gốc minh họa `NetInfo` listener để sync queue khi có mạng trở lại. fileciteturn4file0L56-L59

Ngoài reconnect, nên có:

* manual sync
* periodic sync khi app foreground
* sync khi refresh token thành công trở lại

## 8. Rủi ro cần kiểm soát

* queue replay hai lần
* item queue quá cũ nhưng vẫn cố sync
* cache local lộ dữ liệu nhạy cảm khi thiết bị bị mất
* conflict policy không rõ làm người dùng mất dữ liệu nháp

---