5) docs/design/module-m12-storage-observability-admin.md
Module M12 – Storage Admin, Observability và Vận hành quản trị
1. Mục tiêu

Tài liệu này mô tả lớp admin và quan sát vận hành của M12, phục vụ quản trị viên hạ tầng và dữ liệu. Đây là nơi hội tụ trạng thái bucket storage, pipeline runs, alerts, backup jobs, restore validation và overall health.

2. Storage administration
Khả năng cần có
xem danh sách bucket/prefix/logical storage domains
xem dung lượng theo module
xem retention/lifecycle policies
kiểm tra object count và xu hướng tăng trưởng
truy vết object theo metadata nếu được phân quyền
3. Pipeline operations
xem DAG/job definitions
xem lịch chạy gần đây
xem fail/pass/retry
trigger manual runs nếu có quyền
khóa/disable pipeline trong trường hợp khẩn cấp
4. Observability dashboard

Dashboard admin của M12 nên có:

hạ tầng database
dung lượng storage
cache health
pipeline health
backup freshness
alert summary
DR readiness status
5. Phân quyền quản trị

Vì đây là module hạ tầng nhạy cảm, cần function codes riêng, ví dụ:

INFRA.VIEW
INFRA.PIPELINE_VIEW
INFRA.PIPELINE_MANAGE
INFRA.STORAGE_VIEW
INFRA.STORAGE_MANAGE
INFRA.BACKUP_VIEW
INFRA.BACKUP_MANAGE
INFRA.DR_MANAGE
INFRA.ALERT_ACK
INFRA.ADMIN
6. Logging và audit

Cần ghi audit cho:

manual pipeline run
backup run thủ công
restore validation
thay đổi policy/ngưỡng cảnh báo
acknowledge critical alerts
thay đổi lifecycle / retention
7. Rủi ro cần kiểm soát
Admin UI thao tác trực tiếp quá mạnh mà thiếu kiểm soát hai lớp.
Một người có quá nhiều quyền hạ tầng.
Observability dashboard lộ cấu hình nhạy cảm không cần hiển thị.