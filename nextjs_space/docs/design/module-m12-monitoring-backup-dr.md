Module M12 – Monitoring, Backup và Disaster Recovery
1. Mục tiêu

Tài liệu này bao phủ giám sát hệ thống, cảnh báo, backup và khôi phục thảm họa. Theo tài liệu gốc, M12 dùng Prometheus + Grafana để theo dõi và có bảng ngưỡng cảnh báo cùng hành động tự động cho PostgreSQL connections, MinIO disk usage, API response time p95, Airflow DAG failure, Redis memory và Backup age.

2. Monitoring model
2.1. Nguồn metric chính
PostgreSQL
MinIO
Redis
API layer
Airflow
Host/system metrics
Backup freshness
2.2. Mục tiêu
phát hiện sớm suy giảm hiệu năng
nhận diện lỗi pipeline
kiểm tra sức khỏe backup
phát hiện nguy cơ đầy dung lượng
hỗ trợ vận hành theo SLA đã chốt
3. Alert thresholds từ tài liệu gốc

Tài liệu gốc nêu các ngưỡng và hành động như sau:

PostgreSQL connections > 80% max_connections → alert và scale connection pool
Disk usage MinIO > 75% → alert, trigger archive job
API response time p95 > 3 giây → alert, trigger cache warm-up
Airflow DAG failure bất kỳ → retry 3 lần, alert admin
Redis memory > 90% → LRU eviction, alert
Backup age > 2 giờ không có backup mới → critical alert, escalate
4. Backup strategy
4.1. PostgreSQL backup

Theo tài liệu gốc, backup mỗi giờ. Cần bổ sung:

kiểm tra checksum/corruption tối thiểu,
retention chính sách backup,
đánh dấu bản backup dùng được/không dùng được,
thử restore định kỳ.
4.2. MinIO backup / replication

Nên có chính sách sao lưu metadata và cấu hình bucket/lifecycle ngoài dữ liệu object.

4.3. Config backup

Nên backup các cấu hình quan trọng như:

Airflow DAG definitions
Grafana dashboards
Prometheus rules
app env/config templates theo chính sách an toàn
5. Restore và DR
5.1. Restore operations

Cần hỗ trợ:

restore toàn hệ thống ở môi trường DR/test
restore từng cơ sở dữ liệu chính
restore metadata hoặc file theo phạm vi
5.2. DR plan

Từ RTO ≤ 4 giờ và RPO ≤ 1 giờ trong tài liệu gốc, M12 cần có runbook rõ:

ai kích hoạt DR,
thứ tự khôi phục thành phần,
dữ liệu nào cần khôi phục trước,
xác nhận hệ thống đạt trạng thái chấp nhận vận hành.
6. Bảng/phần tử gợi ý
BackupJob
BackupArtifact
RestoreJob
DisasterRecoveryPlan
DisasterRecoveryExercise
InfrastructureAlert
MetricThresholdPolicy
7. API / Admin operations gợi ý
GET /api/infrastructure/metrics/health
GET /api/infrastructure/alerts
POST /api/infrastructure/alerts/:id/ack
GET /api/infrastructure/backups
POST /api/infrastructure/backups/run
POST /api/infrastructure/restore/validate
POST /api/infrastructure/dr/exercise
8. Rủi ro cần kiểm soát
Có backup nhưng chưa từng kiểm tra restore.
Metric alert thiếu ưu tiên mức độ nên gây bão cảnh báo.
Backup tuổi quá hạn mà không được escalate đúng mức.
DR plan có trên giấy nhưng không diễn tập.