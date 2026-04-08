docs/design/module-m12-overview.md
Module M12 – Quản lý Dữ liệu & Hạ tầng
1. Mục tiêu module

M12 là tầng nền tảng kỹ thuật của hệ thống HVHC BigData, phụ trách quản lý dữ liệu đa tầng và vận hành hạ tầng lõi. Theo tài liệu gốc, M12 quản lý Data Lake dùng MinIO, ETL pipeline dùng Apache Airflow, Data Warehouse dùng ClickHouse, hệ giám sát dùng Prometheus + Grafana, cùng cơ chế Backup & Disaster Recovery. Tài liệu cũng nêu rõ đây là hạ tầng chạy xuyên suốt, còn các module nghiệp vụ không thao tác trực tiếp mà phải đi qua abstraction layer.

2. Định vị trong hệ thống

M12 không phải module nghiệp vụ, cũng không phải module giao diện người dùng thông thường. M12 là lớp nền làm ba việc lớn:

Quản trị dữ liệu vận hành, dữ liệu phân tích, dữ liệu file và dữ liệu lưu trữ dài hạn.
Tổ chức ETL/ELT, đồng bộ dữ liệu và kiểm tra chất lượng dữ liệu.
Bảo đảm khả năng quan sát hệ thống, sao lưu, khôi phục và vận hành bền vững.

Theo tài liệu gốc, M12 hỗ trợ kiến trúc dữ liệu đa tầng gồm Hot, Warm, Cold, Archive và Cache; đồng thời đặt ra các mục tiêu SLA vận hành: RTO không quá 4 giờ, RPO không quá 1 giờ, uptime mục tiêu 99,5%.

3. Phụ thuộc hệ thống
3.1. Phụ thuộc bắt buộc
PostgreSQL – tầng Hot

Tài liệu gốc xác định PostgreSQL là nơi chứa dữ liệu OLTP thời gian thực của 17 module, dùng Prisma ORM, pgvector, pg_trgm.

ClickHouse – tầng Warm

Là nơi lưu dữ liệu OLAP, analytical queries, aggregate reports và AI data.

MinIO – tầng Cold và Archive

Là nơi lưu file PDF, ảnh, scan, biên bản số và dữ liệu lưu trữ dài hạn theo lifecycle policy.

Redis Cluster – tầng Cache

Là nơi giữ session, RBAC cache, API cache và rate limit counters.

Apache Airflow

Là hệ thống điều phối ETL pipeline, data quality jobs, backup jobs và AI refresh jobs.

Prometheus + Grafana

Là nền giám sát và cảnh báo hệ thống.

4. Use cases chính

Theo tài liệu gốc, M12 có 4 use case mới từ UC-62 đến UC-65. Từ nội dung kỹ thuật, bốn khối use case thực tế có thể chuẩn hóa như sau:

UC-62: Quản lý dữ liệu đa tầng và data lake
UC-63: ETL / Data Quality / Data Warehouse pipelines
UC-64: Giám sát hệ thống và cảnh báo vận hành
UC-65: Backup, Restore và Disaster Recovery
5. Tác nhân hệ thống
Quản trị hệ thống
Quản trị cơ sở dữ liệu
Quản trị dữ liệu/analytics
Quản trị hạ tầng lưu trữ
Dịch vụ ETL nền
Dịch vụ giám sát, cảnh báo, backup
Các module nghiệp vụ tiêu thụ abstraction layer
6. Thực thể lõi dự kiến
DataStoragePolicy
DataPipelineDefinition
DataPipelineRun
DataQualityRule
DataQualityResult
WarehouseSyncJob
BackupJob
RestoreJob
DisasterRecoveryPlan
SystemMetricSnapshot
InfrastructureAlert
StorageBucketConfig
RetentionPolicy
InfrastructureAccessLog
7. Nguyên tắc thiết kế
Infrastructure through abstraction: module nghiệp vụ không truy cập trực tiếp hạ tầng lõi nếu không có service layer.
Tách rõ OLTP, OLAP, file storage, archive và cache.
Data pipeline phải có logging, retry, alerting và lineage tối thiểu.
Backup/restore là năng lực bắt buộc, không phải tùy chọn.
Quan sát hệ thống phải đi cùng ngưỡng cảnh báo và hành động phản ứng.
8. Rủi ro kiến trúc cần kiểm soát
Module nghiệp vụ ghi đọc chéo trực tiếp vào ClickHouse hoặc MinIO mà không qua abstraction.
ETL chạy không idempotent gây nhân bản dữ liệu.
Data quality chỉ cảnh báo mà không có quy trình xử lý.
Redis cache làm lớp phụ thuộc nhưng không có chiến lược mất cache an toàn.
Backup có tạo file nhưng không kiểm tra khả năng restore thực tế.
Alert nhiều nhưng thiếu phân cấp khiến đội vận hành bị nhiễu.
9. Chiến lược triển khai theo phase
Phase 1
Data storage abstraction cơ bản
Bucket strategy cho MinIO
ETL PG → ClickHouse cơ bản
Monitoring metrics lõi
PostgreSQL backup + restore test tối thiểu
Phase 2
Data quality framework
Retention/lifecycle policies
Dashboard giám sát hạ tầng
AI refresh pipelines
Alert routing đa mức
Phase 3
DR runbooks tự động hóa sâu hơn
Warehouse optimization
Observability hợp nhất logs/metrics/traces
Cost/performance governance