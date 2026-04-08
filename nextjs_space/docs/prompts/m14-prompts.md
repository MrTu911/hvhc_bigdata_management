M14 Prompt Pack
Prompt 1 – Analyze module M14

Đọc:

.claude/CLAUDE.md
docs/design/system-overview.md
docs/design/system-module-map.md
docs/design/system-integration-map.md
docs/design/module-m14-overview.md
docs/design/module-m14-mobile-architecture.md
docs/design/module-m14-offline-sync.md
docs/design/module-m14-qr-workflow-notifications.md
docs/design/module-m14-security-device-ops.md

Chưa code.

Hãy:

tóm tắt phạm vi M14
xác định rõ API reuse boundaries với backend hiện có
phân loại tính năng nào online-only, tính năng nào offline-capable
chỉ ra các rủi ro bảo mật và sync quan trọng nhất
đề xuất Phase 1 an toàn nhất
Prompt 2 – Design mobile app architecture for M14

Đọc toàn bộ design docs M14.

Chỉ làm architecture design.

Yêu cầu:

đề xuất cấu trúc thư mục React Native/Expo app
tách app shell, auth, api clients, offline storage, feature screens, notifications, security
không tạo backend mới
mapping mỗi feature mobile vào module backend tương ứng
giải thích ngắn gọn các layer quan trọng
Prompt 3 – Build offline cache and sync queue

Đọc:

module-m14-offline-sync.md

Hãy:

thiết kế SQLite cache layer
thiết kế offline queue item schema
thêm dedupKey, retry, conflict state
chỉ cho phép các action offline-capable theo design docs
tránh sync replay trùng lặp
Prompt 4 – Build QR attendance feature

Đọc:

module-m14-qr-workflow-notifications.md

Hãy:

xây màn hình scan QR bằng Expo camera/barcode API
gọi đúng API attendance hiện có
bảo vệ flow bằng token one-time và TTL
chưa tạo backend mới, chỉ mô tả nếu cần bổ sung endpoint vào M10
thêm UX xử lý lỗi QR hết hạn/không hợp lệ
Prompt 5 – Build mobile workflow and notifications

Đọc:

module-m14-qr-workflow-notifications.md

Hãy:

xây workflow inbox screen
hỗ trợ approve/reject/return cơ bản bằng API M13 hiện có
xây device registration cho push notifications
thêm deeplink routing từ push vào đúng màn hình
không cho offline approve workflow nhạy cảm ở phase đầu
Prompt 6 – Build security and device operations

Đọc:

module-m14-security-device-ops.md

Hãy:

thiết kế secure token storage
tích hợp biometric unlock ở lớp client
chuẩn bị certificate pinning config strategy
thêm device registration/revoke flow
không coi biometric là thay thế server auth
Prompt 7 – Review M14 architecture before implementation

Đọc toàn bộ M14 docs.

Chưa code.

Hãy review:

điểm nào của M14 có nguy cơ tạo backend riêng trái nguyên tắc
tính năng nào nên trì hoãn nếu offline conflict quá phức tạp
QR attendance cần thêm điều kiện bảo mật nào nữa
push/deeplink cần kiểm soát gì để không lộ dữ liệu
thứ tự implement an toàn, nhanh và thực dụng nhất