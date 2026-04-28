1) docs/prompts/m12-prompts.md
M12 Prompt Pack
Prompt 1 – Analyze module M12

Đọc:

.claude/CLAUDE.md
docs/design/system-overview.md
docs/design/system-module-map.md
docs/design/system-integration-map.md
docs/design/module-m12-overview.md
docs/design/module-m12-data-architecture.md
docs/design/module-m12-etl-quality-warehouse.md
docs/design/module-m12-monitoring-backup-dr.md
docs/design/module-m12-storage-observability-admin.md

Chưa code.

Hãy:

tóm tắt vai trò của M12 trong kiến trúc toàn hệ thống
tách rõ các tầng dữ liệu Hot/Warm/Cold/Archive/Cache
xác định abstraction layer nào module nghiệp vụ phải dùng
đề xuất Phase 1 an toàn nhất
chỉ ra rủi ro vận hành và dữ liệu quan trọng nhất

Prompt 2 – Design schema/config for M12

Đọc toàn bộ design docs M12.

Chỉ làm schema/config design.

Yêu cầu:

đề xuất models cho pipeline definitions, pipeline runs, data quality rules/results, backup jobs, restore jobs, alerts, storage policies
không biến M12 thành nơi lưu business entities của module nghiệp vụ
thiết kế config cho storage tiers, retention, bucket strategy, alert thresholds
thêm indexes cho pipeline runs, alert lookup, backup lookup, quality results
giải thích ngắn gọn vai trò từng model
Prompt 3 – Build data storage abstraction

Đọc:

module-m12-data-architecture.md

Hãy:

xây storage abstraction layer cho MinIO/S3-compatible
thiết kế bucket strategy theo module/domain
gắn metadata object phục vụ truy vết và retention
không để module nghiệp vụ gọi MinIO client trực tiếp
chuẩn bị lifecycle hooks cho archive policy
Prompt 4 – Build ETL and data quality admin backend

Đọc:

module-m12-etl-quality-warehouse.md

Hãy:

thiết kế service theo dõi pipeline definitions/runs
hỗ trợ trigger manual runs có kiểm soát
lưu data quality rules và results
thêm retry/error states rõ ràng
chưa hard-code business transformations vào admin module
Prompt 5 – Build monitoring, backup and DR admin

Đọc:

module-m12-monitoring-backup-dr.md

Hãy:

xây backend quản lý backup jobs, restore validations và infrastructure alerts
chuẩn hóa mức severity và escalation
theo dõi backup freshness, DAG failures, storage usage, Redis memory, DB health
thêm audit cho manual operations
chuẩn bị DR exercise workflow tối thiểu
Prompt 6 – Build M12 admin dashboard

Đọc:

module-m12-storage-observability-admin.md

Hãy:

xây admin dashboard cho storage/pipelines/alerts/backups
áp RBAC INFRA.* chặt chẽ
không hiển thị secrets hoặc cấu hình quá nhạy cảm
hỗ trợ acknowledge alerts và xem lịch sử tác nghiệp
tách clearly read-only views và admin actions
Prompt 7 – Review M12 architecture before implementation

Đọc toàn bộ M12 docs.

Chưa code.

Hãy review:

phần nào của M12 nên nằm trong app chính, phần nào nên tách hạ tầng ngoài app
abstraction boundaries nào là bắt buộc
pipeline/backup/alert nào cần ưu tiên làm trước
điểm nào có nguy cơ vendor lock-in
thứ tự implement an toàn và thực dụng nhất
