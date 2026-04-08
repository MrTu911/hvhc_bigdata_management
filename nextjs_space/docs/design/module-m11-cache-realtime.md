## 4) `docs/design/module-m11-cache-realtime.md`

# Module M11 – Cache đa tầng và Real-time KPI

## 1. Mục tiêu

Theo tài liệu gốc, M11 sử dụng Redis cache đa tầng và hỗ trợ SSE/WebSocket cho cập nhật gần-thời gian thực. Dashboard stats được cache theo ba tầng TTL:

* KPI nhanh: TTL 60 giây
* Biểu đồ tổng hợp: TTL 5 phút
* Báo cáo phức tạp: TTL 30 phút, lazy load. fileciteturn2file0L49-L73

## 2. Nguyên tắc thiết kế

1. Cache-first cho dashboard.
2. Real-time chỉ dùng với KPI thật sự cần nhanh.
3. Cache key luôn phải gắn role/scope/unit/user nếu cần.
4. Không stream dữ liệu thô; chỉ stream delta hoặc summary.

## 3. Ba tầng cache

### Tầng 1 – Fast KPI

* số đếm, badge, tasks chờ xử lý, cảnh báo mới
* TTL 60 giây
* auto refresh định kỳ

### Tầng 2 – Aggregate Charts

* biểu đồ theo học kỳ/tháng/quý
* histogram/phân bố/ranking nhỏ
* TTL 5 phút

### Tầng 3 – Complex Reports

* báo cáo tổng hợp lớn
* truy vấn liên module sâu
* TTL 30 phút
* lazy load khi người dùng mở widget/tab tương ứng

## 4. Cache key strategy

Từ ví dụ tài liệu gốc `dash:${scope}:${unitId}`, có thể mở rộng thành:

* `dash:role:{roleKey}:scope:{scope}:unit:{unitId}`
* `widget:{widgetKey}:scope:{scope}:unit:{unitId}:user:{userId?}`
* `drill:{widgetKey}:{filterHash}`

Mọi cache key có dữ liệu cá nhân phải chứa `userId` hoặc một token đại diện phạm vi cá nhân.

## 5. Real-time transport

Tài liệu gốc cho phép SSE/WebSocket. Định hướng an toàn:

### Phase 1

* Ưu tiên polling + cache refresh 30 giây
* SSE cho alert và tasks nhỏ

### Phase 2

* WebSocket selective cho dashboard điều hành quan trọng

## 6. Dashboard aggregation service

Tài liệu gốc minh họa `getDashboardStats()` dùng `Promise.all` để truy vấn song song các module M02, M03, M10, M09, M05, M13 rồi cache kết quả. fileciteturn2file0L55-L73

Từ đó, kiến trúc nên tách:

* `dashboardStatsService`
* `widgetDataService`
* `dashboardCacheService`
* `realtimeEventService`

## 7. Invalidations

Cache cần được làm mới theo ba cách:

1. hết TTL tự nhiên
2. invalidate chủ động khi dữ liệu nguồn thay đổi lớn
3. refresh thủ công theo yêu cầu người dùng có quyền

## 8. Rủi ro cần kiểm soát

* Cache poisoning do key không đủ chặt.
* Rò rỉ dữ liệu giữa role hoặc đơn vị.
* Thao tác invalidate quá rộng gây mất lợi ích cache.
* WebSocket mở nhiều kênh không cần thiết.
* Promise.all kéo nhiều truy vấn nặng cùng lúc ở giờ cao điểm.

## 9. API / service gợi ý

* `GET /api/dashboard/summary`
* `GET /api/dashboard/widgets/:widgetKey/data`
* `POST /api/dashboard/cache/invalidate`
* `GET /api/dashboard/stream`
* `POST /api/dashboard/refresh`

---