
# Script Tạo Dữ Liệu Mẫu

## Mục đích
Tạo 1000 bản ghi dữ liệu mẫu cho mỗi loại dữ liệu trong hệ thống BigData HVHC để phục vụ mục đích demo và kiểm thử.

## Cách sử dụng

### 1. Chạy script tạo dữ liệu mẫu

```bash
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space
yarn tsx scripts/seed-sample-data.ts
```

### 2. Dữ liệu được tạo

Script sẽ tạo dữ liệu mẫu cho các bảng sau:

#### Người dùng & Phân quyền (1000 bản ghi)
- **Users**: 1000 người dùng với đầy đủ thông tin quân nhân
  - Email: user1@hvhc.edu.vn đến user1000@hvhc.edu.vn
  - Password: Password123! (đã mã hóa)
  - Các vai trò: Quản trị, Chỉ huy, Giảng viên, Học viên, v.v.
  - Thông tin quân sự: Cấp bậc, đơn vị, quân hiệu

#### Đơn vị (100 bản ghi)
- **Departments**: 100 đơn vị/khoa/phòng
  - Mã đơn vị: DEPT001 đến DEPT100
  - Thông tin địa lý (tọa độ GPS)
  - Thông tin liên hệ

#### Dịch vụ BigData (1000 bản ghi)
- **BigData Services**: 1000 dịch vụ
  - Các loại: PostgreSQL, MinIO, Airflow, ClickHouse, Prometheus, Superset, Kafka, Hadoop, Spark, Grafana
  - Trạng thái: HEALTHY, DEGRADED, DOWN, UNKNOWN
  - Thông tin kết nối và uptime

#### Giám sát & Cảnh báo
- **Service Metrics**: 1000 bản ghi metrics
  - CPU, Memory, Disk usage
  - Network I/O
  - Timestamp phân bố từ 2024 đến hiện tại

- **Service Alerts**: 1000 cảnh báo
  - Mức độ: INFO, WARNING, ERROR, CRITICAL
  - Trạng thái: ACTIVE, ACKNOWLEDGED, RESOLVED

#### Logs & Audit Trail
- **System Logs**: 1000 logs hệ thống
  - Các cấp độ: DEBUG, INFO, WARNING, ERROR, CRITICAL
  - Các danh mục: AUTH, USER_MANAGEMENT, SERVICE_MONITORING, DATA_PROCESSING, SYSTEM, SECURITY

- **Audit Logs**: 1000 logs kiểm toán
  - Các hành động: LOGIN, LOGOUT, CREATE, READ, UPDATE, DELETE, UPLOAD, DOWNLOAD, EXPORT
  - Mức độ nghiêm trọng: LOW, MEDIUM, HIGH, CRITICAL

#### Nghiên cứu & Tài liệu (1000 bản ghi)
- **Research Files**: 1000 file nghiên cứu
  - Các loại: RESEARCH_PAPER, DATASET, MODEL, REPORT, PRESENTATION
  - Phân loại bảo mật: PUBLIC, INTERNAL, CONFIDENTIAL, SECRET
  - Thống kê lượt xem và tải xuống

#### Truy vấn Dữ liệu (1000 bản ghi)
- **Data Queries**: 1000 truy vấn
  - Các loại: POSTGRESQL, CLICKHOUSE, HADOOP, SPARK, CUSTOM
  - Trạng thái: PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
  - Metrics: Execution time, rows returned, data size

#### Machine Learning (1000 bản ghi)
- **ML Models**: 1000 mô hình ML
  - Các loại: CLASSIFICATION, REGRESSION, CLUSTERING, NEURAL_NETWORK, DEEP_LEARNING, NLP, COMPUTER_VISION
  - Framework: TENSORFLOW, PYTORCH, KERAS, SCIKIT_LEARN, XGBOOST, LIGHTGBM
  - Trạng thái: DRAFT, TRAINING, TRAINED, VALIDATING, DEPLOYED
  - Metrics: Accuracy, Precision, Recall, F1-Score

#### Datasets (1000 bản ghi)
- **Datasets**: 1000 tập dữ liệu
  - Các định dạng: CSV, JSON, PARQUET, AVRO, XML, TEXT
  - Trạng thái: UPLOADED, PROCESSING, READY, FAILED, ARCHIVED
  - Metadata: Row count, column count, schema

#### Airflow DAGs (100 bản ghi)
- **Airflow DAGs**: 100 DAGs
  - Trạng thái: SUCCESS, FAILED, RUNNING, QUEUED, PAUSED
  - Thống kê: Success count, failed count
  - Lịch chạy: Last run time, next run time

## Đặc điểm dữ liệu mẫu

### 1. Phân bố ngẫu nhiên hợp lý
- Các giá trị được phân bố ngẫu nhiên nhưng trong phạm vi hợp lý
- Ví dụ: CPU usage từ 10-90%, uptime từ 90-100%

### 2. Dữ liệu có ý nghĩa
- Tên file, mô tả có nội dung tiếng Việt
- Email theo định dạng @hvhc.edu.vn
- Quân hiệu theo format MIL000001 đến MIL001000

### 3. Quan hệ dữ liệu
- Users liên kết với các bảng khác thông qua userId
- Services liên kết với metrics và alerts
- Models liên kết với training jobs và predictions

### 4. Timestamp thực tế
- Dữ liệu phân bố từ 2024-01-01 đến hiện tại
- Các log và audit trail có timestamp gần đây hơn

## Performance

Script sử dụng batch processing (100 records/batch) để tối ưu hiệu suất:
- Tránh timeout khi insert lượng lớn dữ liệu
- Giảm memory usage
- Tăng tốc độ thực thi

## Lưu ý

1. **Chạy trên database trống hoặc test**: Script tạo dữ liệu mẫu, không nên chạy trên production
2. **Thời gian thực thi**: Khoảng 5-10 phút tùy vào cấu hình máy
3. **Dung lượng database**: Khoảng 500MB-1GB sau khi chạy script
4. **Passwords**: Tất cả user đều có password: `Password123!`

## Xóa dữ liệu mẫu

Nếu muốn xóa tất cả dữ liệu mẫu và bắt đầu lại:

```bash
# CẢNH BÁO: Lệnh này sẽ xóa TẤT CẢ dữ liệu trong database
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space
yarn prisma migrate reset --force
```

## Kiểm tra dữ liệu

Sau khi chạy script, kiểm tra bằng Prisma Studio:

```bash
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space
yarn prisma studio
```

Hoặc kiểm tra bằng SQL:

```sql
-- Đếm số lượng bản ghi trong mỗi bảng
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'bigdata_services', COUNT(*) FROM bigdata_services
UNION ALL
SELECT 'research_files', COUNT(*) FROM research_files
UNION ALL
SELECT 'data_queries', COUNT(*) FROM data_queries
UNION ALL
SELECT 'ml_models', COUNT(*) FROM ml_models
UNION ALL
SELECT 'datasets', COUNT(*) FROM datasets
UNION ALL
SELECT 'system_logs', COUNT(*) FROM system_logs
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs;
```
