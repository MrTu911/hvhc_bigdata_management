## 5) `docs/design/module-m11-alerts-mobile-reporting.md`

# Module M11 – Alerts, Mobile Responsive và Reporting

## 1. Mục tiêu

Tài liệu này bao phủ ba năng lực quan trọng của M11 ngoài dashboard hiển thị cơ bản:

* cảnh báo tổng hợp và cảnh báo theo widget,
* tối ưu hiển thị di động,
* hỗ trợ reporting/export nhanh.

Theo tài liệu gốc, M11 có các widget cảnh báo như `PERSONNEL_RETIRING`, `ACADEMIC_WARNINGS`, `PARTY_FEE_DEBT`, `BHYT_EXPIRING`, `SLA_OVERDUE`; đồng thời hệ thống có mobile responsive và auto-refresh. fileciteturn2file0L32-L48 fileciteturn2file0L14-L18

## 2. Alert model

Cảnh báo trong M11 không phải cảnh báo gốc nghiệp vụ. Đây là lớp tổng hợp/hiển thị từ các module nguồn.

### Hai loại cảnh báo

1. `Widget Alerts`: gắn trực tiếp với widget.
2. `Executive Alerts`: tổng hợp nhiều nguồn để hiển thị cho điều hành.

## 3. Alert rule gợi ý

* ngưỡng số lượng vượt mức
* xu hướng xấu liên tiếp nhiều kỳ
* quá hạn SLA
* hết hạn sắp tới
* tỷ lệ đạt/trượt dưới chuẩn
* tăng bất thường số case cảnh báo

## 4. Mobile responsive

Vì tài liệu gốc yêu cầu mobile responsive, M11 nên có:

* breakpoints layout theo desktop/tablet/mobile
* widget collapse strategy trên mobile
* ưu tiên KPI cards và cảnh báo trên màn hình nhỏ
* ẩn biểu đồ phức tạp nếu không phù hợp viewport

## 5. Reporting/export

M11 nên kết nối M18 để:

* export snapshot dashboard
* export KPI summary theo role/đơn vị
* export danh sách cảnh báo
* export bảng drill-down của từng widget

## 6. Logging và audit

Cần ghi log:

* dashboard viewed
* alert acknowledged
* export initiated
* manual refresh
* layout reset

## 7. API gợi ý

* `GET /api/dashboard/alerts`
* `POST /api/dashboard/alerts/:id/ack`
* `GET /api/dashboard/mobile-layout`
* `GET /api/dashboard/export`
* `POST /api/dashboard/export`

## 8. Rủi ro cần kiểm soát

* Alert trùng lặp nhiều nơi làm người dùng bỏ qua cảnh báo.
* Mobile layout cắt mất ngữ nghĩa dashboard.
* Export không chốt thời điểm snapshot dữ liệu.
* Alert tổng hợp vượt scope của người xem.

---