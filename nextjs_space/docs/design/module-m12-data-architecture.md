# Module M12 – Quản lý Dữ liệu & Hạ tầng

## 2) `docs/design/module-m12-data-architecture.md`

# Module M12 – Kiến trúc dữ liệu đa tầng

## 1. Mục tiêu

Tài liệu này chuẩn hóa phần kiến trúc dữ liệu nhiều tầng của M12. Theo tài liệu gốc, M12 dùng 5 tầng dữ liệu: Hot, Warm, Cold, Archive, Cache; tương ứng với PostgreSQL, ClickHouse, MinIO, MinIO Glacier-like và Redis Cluster.

## 2. Hot tier – PostgreSQL

Theo tài liệu gốc, đây là tầng OLTP vận hành realtime của 17 module. Vai trò của tầng này:

* lưu dữ liệu giao dịch nghiệp vụ chuẩn,
* bảo đảm tính toàn vẹn ACID,
* hỗ trợ các module nghiệp vụ qua Prisma ORM,
* cung cấp nguồn chuẩn cho ETL.

### Dữ liệu phù hợp

* hồ sơ nghiệp vụ đang hoạt động
* workflow runtime
* điểm, hồ sơ, cấu hình, audit nóng
* dữ liệu cần cập nhật thường xuyên

## 3. Warm tier – ClickHouse

Theo tài liệu gốc, đây là tầng OLAP cho analytical queries, aggregate reports và AI data.

### Dữ liệu phù hợp

* dữ liệu tổng hợp theo thời gian
* fact tables cho dashboard lớn
* ranking, trend analysis
* dữ liệu embedding/analytics phù hợp với chiến lược hệ thống

### Nguyên tắc

* không để ClickHouse thành nguồn giao dịch gốc,
* đồng bộ từ PostgreSQL hoặc pipeline chuẩn,
* chấp nhận trễ nhẹ so với OLTP.

## 4. Cold tier – MinIO

Theo tài liệu gốc, đây là nơi lưu file PDF, ảnh, quyết định scan, biên bản số; khuyến nghị bucket per module.

### Dữ liệu phù hợp

* file đính kèm
* scan văn bản
* xuất báo cáo
* chứng cứ ký số hoặc tài liệu render

### Chiến lược bucket

* bucket theo module hoặc theo domain lớn
* prefix theo năm/tháng/ngày hoặc entityType/entityId
* gắn metadata để truy vết module, owner, classification, retention

## 5. Archive tier – MinIO Glacier-like

Theo tài liệu gốc, đây là tầng lưu trữ dài hạn cho audit logs, văn bản cũ trên 2 năm và dùng object lifecycle policy.

### Dữ liệu phù hợp

* audit logs dài hạn
* hồ sơ ít truy cập
* snapshot báo cáo cũ
* dữ liệu phục vụ kiểm tra, thanh tra

## 6. Cache tier – Redis Cluster

Theo tài liệu gốc, Redis Cluster 3 node được dùng cho session, RBAC cache, API cache và rate limit counters.

### Nguyên tắc

* cache không phải source of truth,
* key phải tách theo scope/role/user nếu cần,
* cache mất thì hệ thống vẫn phải chạy an toàn.

## 7. Data placement policy

Cần có chính sách phân tầng dữ liệu dựa trên:

* loại dữ liệu,
* tần suất truy cập,
* mức độ nhạy cảm,
* thời gian lưu giữ,
* yêu cầu hiệu năng,
* yêu cầu phục hồi.

## 8. Abstraction layer

Theo tài liệu gốc, module nghiệp vụ không thao tác trực tiếp mà phải dùng abstraction layer. Vì vậy nên chuẩn hóa các service:

* `storageService`
* `analyticsWarehouseService`
* `cacheService`
* `backupService`
* `dataPipelineService`

## 9. Rủi ro cần kiểm soát

* File metadata nằm một nơi, object storage ở nơi khác nhưng không có đối soát.
* Dữ liệu analytics sai lệch do đồng bộ trễ mà không ghi nhãn “last refreshed”.
* Object lifecycle xóa dữ liệu sớm hơn quy định.
* Redis dùng cho dữ liệu quan trọng nhưng không có fallback.

---

