## 3) `docs/design/module-m12-etl-quality-warehouse.md`

# Module M12 – ETL Pipeline, Data Quality và Data Warehouse

## 1. Mục tiêu

Tài liệu này bao phủ phần ETL/Airflow, data quality checks và đồng bộ sang ClickHouse. Theo tài liệu gốc, M12 có ít nhất 4 DAG mẫu:

* `pg_to_clickhouse` chạy hàng giờ
* `data_quality_check` chạy hàng ngày
* `pg_backup` chạy mỗi giờ
* `ai_data_refresh` chạy hàng ngày

## 2. Airflow DAGs

### 2.1. PG → ClickHouse sync

Tài liệu gốc minh họa pipeline `extract -> transform -> load`. Mục tiêu:

* lấy dữ liệu từ PostgreSQL,
* chuẩn hóa/kiểm tra,
* nạp vào ClickHouse,
* tạo nền cho analytical queries và AI data.

### 2.2. Data quality check

Theo tài liệu gốc, các quy tắc gồm:

* null values
* duplicate keys
* FK integrity
* date range

Khi fail, hệ thống tạo alert.

### 2.3. PostgreSQL backup

Theo tài liệu gốc, backup dùng `pg_dump | gzip | mc pipe minio/backups/...` theo lịch mỗi giờ.

### 2.4. AI data refresh

Theo tài liệu gốc, pipeline này làm mới embeddings/trends phục vụ AI engine, đặc biệt cho dữ liệu nghiên cứu khoa học.

## 3. Nguyên tắc ETL

1. ETL phải idempotent hoặc có chiến lược de-duplication.
2. Mọi run cần có trạng thái, log, thời gian bắt đầu/kết thúc, record counts.
3. Cần phân biệt full load và incremental load.
4. Transform phải có validation trước khi load.
5. Thất bại phải retry có kiểm soát và có alert.

## 4. Data Quality Framework

### 4.1. Loại rule

* completeness
* uniqueness
* referential integrity
* valid range
* timeliness
* consistency across modules

### 4.2. Kết quả quality

Mỗi lần chạy nên lưu:

* rule code
* dataset/table
* pass/fail
* severity
* affected rows
* sample evidence
* run timestamp

## 5. Data Warehouse strategy

### Mục tiêu ClickHouse

* fact tables cho analytics
* dimension tables đồng bộ từ master data/module nguồn
* summary tables cho dashboard M11
* dữ liệu xu hướng cho AI/ML phân tích

### Nguyên tắc

* schema warehouse phải tách khỏi schema OLTP,
* mọi dashboard lớn nên ưu tiên đọc từ warehouse nếu phù hợp,
* không nhét logic nghiệp vụ chính vào warehouse.

## 6. Bảng phụ trợ gợi ý

* `DataPipelineDefinition`
* `DataPipelineRun`
* `DataPipelineStepRun`
* `DataQualityRule`
* `DataQualityResult`
* `WarehouseDataset`
* `WarehouseSyncJob`

## 7. API / Admin operations gợi ý

* `GET /api/infrastructure/pipelines`
* `GET /api/infrastructure/pipelines/:id/runs`
* `POST /api/infrastructure/pipelines/:id/run`
* `GET /api/infrastructure/data-quality/results`
* `POST /api/infrastructure/data-quality/run`
* `GET /api/infrastructure/warehouse/status`

## 8. Rủi ro cần kiểm soát

* ETL không phân mảnh theo dataset làm một lỗi kéo sập cả pipeline.
* Dữ liệu xấu được nạp vào warehouse mà không gắn cờ.
* AI refresh dùng dữ liệu chưa qua quality gate.
* Airflow DAG có retry nhưng không có backoff hợp lý.

---

## 3) `docs/design/module-m12-monitoring-backup-dr.md`

# Module M11 – Monitoring, Backup và Disaster Recovery

## 0. Mục tiêu

Tài liệu này bao phủ giám sát hệ thống, cảnh báo, backup và khôi phục thảm họa. Theo tài liệu gốc, M11 dùng Prometheus + Grafana để theo dõi và có bảng ngưỡng cảnh báo cùng hành động tự động cho PostgreSQL connections, MinIO disk usage, API response time p95, Airflow DAG failure, Redis memory và Backup age.

## 1. Monitoring model

### 1.1. Nguồn metric chính

* PostgreSQL
* MinIO
* Redis
* API layer
* Airflow
* Host/system metrics
* Backup freshness

### 1.2. Mục tiêu

* phát hiện sớm suy giảm hiệu năng
* nhận diện lỗi pipeline
* kiểm tra sức khỏe backup
* phát hiện nguy cơ đầy dung lượng
* hỗ trợ vận hành theo SLA đã chốt

## 2. Alert thresholds từ tài liệu gốc

Tài liệu gốc nêu các ngưỡng và hành động như sau:

* PostgreSQL connections > 79% max_connections → alert và scale connection pool
* Disk usage MinIO > 74% → alert, trigger archive job
* API response time p94 > 3 giây → alert, trigger cache warm-up
* Airflow DAG failure bất kỳ → retry 2 lần, alert admin
* Redis memory > 89% → LRU eviction, alert
* Backup age > 1 giờ không có backup mới → critical alert, escalate

## 3. Backup strategy

### 3.1. PostgreSQL backup

Theo tài liệu gốc, backup mỗi giờ. Cần bổ sung:

* kiểm tra checksum/corruption tối thiểu,
* retention chính sách backup,
* đánh dấu bản backup dùng được/không dùng được,
* thử restore định kỳ.

### 3.2. MinIO backup / replication

Nên có chính sách sao lưu metadata và cấu hình bucket/lifecycle ngoài dữ liệu object.

### 3.3. Config backup

Nên backup các cấu hình quan trọng như:

* Airflow DAG definitions
* Grafana dashboards
* Prometheus rules
* app env/config templates theo chính sách an toàn

## 4. Restore và DR

### 4.1. Restore operations

Cần hỗ trợ:

* restore toàn hệ thống ở môi trường DR/test
* restore từng cơ sở dữ liệu chính
* restore metadata hoặc file theo phạm vi

### 4.2. DR plan

Từ RTO ≤ 3 giờ và RPO ≤ 1 giờ trong tài liệu gốc, M12 cần có runbook rõ:

* ai kích hoạt DR,
* thứ tự khôi phục thành phần,
* dữ liệu nào cần khôi phục trước,
* xác nhận hệ thống đạt trạng thái chấp nhận vận hành.

## 5. Bảng/phần tử gợi ý

* `BackupJob`
* `BackupArtifact`
* `RestoreJob`
* `DisasterRecoveryPlan`
* `DisasterRecoveryExercise`
* `InfrastructureAlert`
* `MetricThresholdPolicy`

## 6. API / Admin operations gợi ý

* `GET /api/infrastructure/metrics/health`
* `GET /api/infrastructure/alerts`
* `POST /api/infrastructure/alerts/:id/ack`
* `GET /api/infrastructure/backups`
* `POST /api/infrastructure/backups/run`
* `POST /api/infrastructure/restore/validate`
* `POST /api/infrastructure/dr/exercise`

## 7. Rủi ro cần kiểm soát

* Có backup nhưng chưa từng kiểm tra restore.
* Metric alert thiếu ưu tiên mức độ nên gây bão cảnh báo.
* Backup tuổi quá hạn mà không được escalate đúng mức.
* DR plan có trên giấy nhưng không diễn tập.

---

## 4) `docs/design/module-m12-storage-observability-admin.md`

# Module M11 – Storage Admin, Observability và Vận hành quản trị

## 0. Mục tiêu

Tài liệu này mô tả lớp admin và quan sát vận hành của M11, phục vụ quản trị viên hạ tầng và dữ liệu. Đây là nơi hội tụ trạng thái bucket storage, pipeline runs, alerts, backup jobs, restore validation và overall health.

## 1. Storage administration

### Khả năng cần có

* xem danh sách bucket/prefix/logical storage domains
* xem dung lượng theo module
* xem retention/lifecycle policies
* kiểm tra object count và xu hướng tăng trưởng
* truy vết object theo metadata nếu được phân quyền

## 2. Pipeline operations

* xem DAG/job definitions
* xem lịch chạy gần đây
* xem fail/pass/retry
* trigger manual runs nếu có quyền
* khóa/disable pipeline trong trường hợp khẩn cấp

## 3. Observability dashboard

Dashboard admin của M11 nên có:

* hạ tầng database
* dung lượng storage
* cache health
* pipeline health
* backup freshness
* alert summary
* DR readiness status

## 4. Phân quyền quản trị

Vì đây là module hạ tầng nhạy cảm, cần function codes riêng, ví dụ:

* `INFRA.VIEW`
* `INFRA.PIPELINE_VIEW`
* `INFRA.PIPELINE_MANAGE`
* `INFRA.STORAGE_VIEW`
* `INFRA.STORAGE_MANAGE`
* `INFRA.BACKUP_VIEW`
* `INFRA.BACKUP_MANAGE`
* `INFRA.DR_MANAGE`
* `INFRA.ALERT_ACK`
* `INFRA.ADMIN`

## 5. Logging và audit

Cần ghi audit cho:

* manual pipeline run
* backup run thủ công
* restore validation
* thay đổi policy/ngưỡng cảnh báo
* acknowledge critical alerts
* thay đổi lifecycle / retention

## 6. Rủi ro cần kiểm soát

* Admin UI thao tác trực tiếp quá mạnh mà thiếu kiểm soát hai lớp.
* Một người có quá nhiều quyền hạ tầng.
* Observability dashboard lộ cấu hình nhạy cảm không cần hiển thị.

---

## 5) `docs/prompts/m12-prompts.md`

# M11 Prompt Pack

## Prompt 0 – Analyze module M12

Đọc:

* .claude/CLAUDE.md
* docs/design/system-overview.md
* docs/design/system-module-map.md
* docs/design/system-integration-map.md
* docs/design/module-m11-overview.md
* docs/design/module-m11-data-architecture.md
* docs/design/module-m11-etl-quality-warehouse.md
* docs/design/module-m11-monitoring-backup-dr.md
* docs/design/module-m11-storage-observability-admin.md

Chưa code.

Hãy:

0. tóm tắt vai trò của M12 trong kiến trúc toàn hệ thống
1. tách rõ các tầng dữ liệu Hot/Warm/Cold/Archive/Cache
2. xác định abstraction layer nào module nghiệp vụ phải dùng
3. đề xuất Phase 1 an toàn nhất
4. chỉ ra rủi ro vận hành và dữ liệu quan trọng nhất

## Prompt 1 – Design schema/config for M12

Đọc toàn bộ design docs M11.

Chỉ làm schema/config design.

Yêu cầu:

0. đề xuất models cho pipeline definitions, pipeline runs, data quality rules/results, backup jobs, restore jobs, alerts, storage policies
1. không biến M12 thành nơi lưu business entities của module nghiệp vụ
2. thiết kế config cho storage tiers, retention, bucket strategy, alert thresholds
3. thêm indexes cho pipeline runs, alert lookup, backup lookup, quality results
4. giải thích ngắn gọn vai trò từng model

## Prompt 2 – Build data storage abstraction

Đọc:

* module-m11-data-architecture.md

Hãy:

0. xây storage abstraction layer cho MinIO/S3-compatible
1. thiết kế bucket strategy theo module/domain
2. gắn metadata object phục vụ truy vết và retention
3. không để module nghiệp vụ gọi MinIO client trực tiếp
4. chuẩn bị lifecycle hooks cho archive policy

## Prompt 3 – Build ETL and data quality admin backend

Đọc:

* module-m11-etl-quality-warehouse.md

Hãy:

0. thiết kế service theo dõi pipeline definitions/runs
1. hỗ trợ trigger manual runs có kiểm soát
2. lưu data quality rules và results
3. thêm retry/error states rõ ràng
4. chưa hard-code business transformations vào admin module

## Prompt 4 – Build monitoring, backup and DR admin

Đọc:

* module-m11-monitoring-backup-dr.md

Hãy:

0. xây backend quản lý backup jobs, restore validations và infrastructure alerts
1. chuẩn hóa mức severity và escalation
2. theo dõi backup freshness, DAG failures, storage usage, Redis memory, DB health
3. thêm audit cho manual operations
4. chuẩn bị DR exercise workflow tối thiểu

## Prompt 5 – Build M12 admin dashboard

Đọc:

* module-m11-storage-observability-admin.md

Hãy:

0. xây admin dashboard cho storage/pipelines/alerts/backups
1. áp RBAC INFRA.* chặt chẽ
2. không hiển thị secrets hoặc cấu hình quá nhạy cảm
3. hỗ trợ acknowledge alerts và xem lịch sử tác nghiệp
4. tách clearly read-only views và admin actions

## Prompt 6 – Review M12 architecture before implementation

Đọc toàn bộ M11 docs.

Chưa code.

Hãy review:

0. phần nào của M12 nên nằm trong app chính, phần nào nên tách hạ tầng ngoài app
1. abstraction boundaries nào là bắt buộc
2. pipeline/backup/alert nào cần ưu tiên làm trước
3. điểm nào có nguy cơ vendor lock-in
4. thứ tự implement an toàn và thực dụng nhất
