## 5) `docs/design/module-m13-dashboard.md`

# Module M13 – Dashboard Workflow và Báo cáo trạng thái

## 1. Mục tiêu

Dashboard của M13 phục vụ hai nhóm chính:

1. Người dùng tác nghiệp: xem việc của tôi, việc chờ duyệt, quá hạn, mới nhận.
2. Lãnh đạo/quản trị: theo dõi tình hình vận hành workflow toàn hệ thống hoặc theo module/đơn vị.

## 2. Nguyên tắc thiết kế

* Dashboard phải phân quyền theo scope.
* Chỉ số phải có khả năng drill-down về workflow instance cụ thể.
* Không tải các phép tính quá nặng trực tiếp từ runtime nếu chưa có tổng hợp nền.
* Tách real-time operational widgets và analytical reports.

## 3. Nhóm dashboard

### 3.1. My Work Dashboard

* Việc đang chờ tôi xử lý
* Việc gần đến hạn
* Việc quá hạn
* Việc tôi khởi tạo
* Việc tôi đã hoàn tất gần đây

### 3.2. Unit Workflow Dashboard

* Tổng số workflow theo đơn vị
* Tỷ lệ đúng hạn/quá hạn
* Top quy trình chậm
* Phân bố theo trạng thái
* Phân bố theo template

### 3.3. System Workflow Dashboard

* Tổng số workflow toàn hệ thống
* Theo module
* Theo loại quy trình
* Theo mức ưu tiên
* Theo thời gian xử lý trung bình
* Theo bottleneck step

## 4. Chỉ số chính cần có

### Operational KPIs

* số workflow đang mở
* số bước chờ xử lý
* số quá hạn
* số escalations
* số bị trả lại
* số bị từ chối

### Performance KPIs

* median/average cycle time
* average approval time per step
* completion rate
* on-time completion rate
* rejection rate
* return-for-revision rate

### Governance KPIs

* số workflow dùng template nào nhiều nhất
* số tác vụ override
* số chữ ký thất bại
* số hành động bất thường

## 5. Bộ lọc cần có

* thời gian
* module nguồn
* workflow template
* đơn vị
* trạng thái
* mức ưu tiên
* người khởi tạo
* người xử lý

## 6. Nguồn dữ liệu

Nguồn chính:

* `WorkflowInstance`
* `WorkflowStepInstance`
* `WorkflowAction`
* `WorkflowNotification`
* `WorkflowSignature`
* `WorkflowEscalation`

Có thể cần bảng tổng hợp:

* `WorkflowAnalyticsDaily`
* `WorkflowAnalyticsByTemplate`
* `WorkflowAnalyticsByUnit`

## 7. Gợi ý mô hình tổng hợp dữ liệu

### Phase 1

Tính trực tiếp từ bảng runtime cho dashboard nhỏ và dữ liệu gần.

### Phase 2

Bổ sung materialized view hoặc summary tables cập nhật theo lịch.

### Phase 3

Tách analytics pipeline nếu lưu lượng lớn.

## 8. Widget gợi ý

* KPI cards
* biểu đồ trạng thái theo thời gian
* heatmap quá hạn theo đơn vị/template
* bảng bottleneck steps
* bảng pending approvals của tôi
* bảng workflow mới nhất

## 9. Báo cáo xuất file

Kết hợp với M18 để xuất:

* báo cáo tồn đọng phê duyệt
* báo cáo đúng hạn/quá hạn
* báo cáo workflow theo đơn vị
* lịch sử phê duyệt theo hồ sơ
* nhật ký ký số

## 10. API gợi ý

* `GET /api/workflow-dashboard/my-work`
* `GET /api/workflow-dashboard/unit-summary`
* `GET /api/workflow-dashboard/system-summary`
* `GET /api/workflow-dashboard/bottlenecks`
* `GET /api/workflow-dashboard/on-time-rate`
* `GET /api/workflow-dashboard/recent-activities`
* `GET /api/workflow-reports/export`

## 11. Phân quyền dữ liệu dashboard

* Người dùng thường: chỉ xem việc của mình và workflow mình có quyền truy cập.
* Quản trị đơn vị: xem trong phạm vi đơn vị theo scope M01.
* Quản trị hệ thống: xem toàn hệ thống nếu có quyền.
* Các hành vi export phải gắn `WF.EXPORT`.

## 12. Rủi ro cần kiểm soát

* Dashboard vượt scope dữ liệu.
* Query quá nặng trên runtime tables.
* KPI không thống nhất định nghĩa.
* Không tách dữ liệu “việc của tôi” và “quản trị toàn cục”.
* Hiển thị thông tin nhạy cảm của quy trình không thuộc phạm vi được xem.

---