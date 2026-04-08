# Module M11 – Dashboard & Trực quan hóa

## 1) `docs/design/module-m11-overview.md`

# Module M11 – Dashboard & Trực quan hóa

## 1. Mục tiêu module

M11 là module Dashboard & Trực quan hóa, đóng vai trò lớp trình bày điều hành đa tầng cho toàn bộ hệ thống HVHC BigData. Theo tài liệu gốc, M11 tổng hợp dữ liệu từ toàn bộ 16 module khác, cung cấp KPI real-time, biểu đồ phân tích và widget tùy chỉnh theo role. Công nghệ định hướng gồm Recharts, React Grid Layout, Redis cache đa tầng và SSE/WebSocket; hệ thống có 41 widget, auto-refresh 30 giây, hỗ trợ widget tùy chỉnh theo role và giao diện responsive cho thiết bị di động. fileciteturn2file0L1-L18

## 2. Định vị trong hệ thống

M11 không phải nguồn dữ liệu nghiệp vụ gốc. Đây là **presentation layer** tổng hợp dữ liệu từ các module nghiệp vụ như M02, M03, M05, M07, M09, M10, M13 và các module khác để hiển thị dashboard, KPI, biểu đồ, cảnh báo và báo cáo nhanh. Tài liệu gốc nêu rõ M11 là lớp trình bày tổng hợp từ 16 module khác. fileciteturn2file0L7-L18

Vì vậy, M11 phải tuân thủ bốn nguyên tắc:

1. Không tạo source of truth song song.
2. Không chép dữ liệu nghiệp vụ sâu nếu không cần.
3. Chỉ xây read-model, widget data model và cache phục vụ hiển thị.
4. Mọi quyền xem dashboard phải đi qua M01.

## 3. Phụ thuộc hệ thống

### 3.1. Phụ thuộc bắt buộc

#### M01 – Auth, RBAC, scope, audit

M11 cần M01 để xác thực, kiểm soát quyền theo role/function code, giới hạn phạm vi dữ liệu dashboard theo đơn vị, khoa, cá nhân và ghi log truy cập dashboard nhạy cảm.

#### Các module nghiệp vụ nguồn

Theo tài liệu gốc, widget và dashboard của M11 lấy dữ liệu từ nhiều module, trong ví dụ cache có ít nhất:

* M02 – Personnel
* M03 – Party
* M10 – Education
* M09 – Research
* M05 – Policy
* M13 – Workflow. fileciteturn2file0L49-L73

Ngoài ra, hệ widget còn bao phủ các metrics từ M07 và M12 theo tài liệu. fileciteturn2file0L42-L48

### 3.2. Phụ thuộc nên có

#### M18 – Export Engine

Để xuất dashboard/report nhanh, ảnh chụp dashboard, báo cáo PDF/Word.

#### M19 – Master Data

Để chuẩn hóa danh mục widget, loại dashboard, nhóm KPI, mức cảnh báo, loại biểu đồ, chế độ refresh, breakpoint layout.

## 4. Use cases chính

Theo tài liệu gốc, M11 có 4 use case, gồm 2 hiện hữu, 1 nâng cấp và 1 mới, trải từ UC-58 đến UC-61. Tài liệu không liệt kê tên từng UC ở phần trích, nhưng nội dung thực tế cho thấy bốn nhóm năng lực cốt lõi là:

1. Dashboard đa tầng theo role.
2. Widget system và drag-drop tùy chỉnh.
3. KPI/biểu đồ real-time với cache Redis đa tầng.
4. Báo cáo tổng hợp và cảnh báo điều hành. fileciteturn2file0L7-L18

## 5. Các loại dashboard theo role

Tài liệu gốc xác định các dashboard cốt lõi theo role:

* Ban Giám đốc Học viện – Executive Dashboard
* Trưởng phòng/khoa – Department Dashboard
* Phòng Đào tạo – Education Dashboard
* Phòng Chính trị – Party Dashboard
* Giảng viên – Faculty Dashboard
* Học viên/Sinh viên – Student Dashboard. fileciteturn2file0L19-L31

Đây là điểm rất quan trọng: M11 không chỉ có một dashboard chung mà là hệ dashboard theo vai trò, phạm vi quản lý và ngữ cảnh công tác.

## 6. Tác nhân hệ thống

* Ban Giám đốc Học viện
* Trưởng phòng, trưởng khoa
* Cán bộ nghiệp vụ phòng Đào tạo
* Cán bộ phòng Chính trị
* Giảng viên
* Học viên/Sinh viên
* Quản trị hệ thống dashboard
* Background services: cache refresh, stream update, alert engine

## 7. Thực thể lõi dự kiến

* `DashboardDefinition`
* `DashboardRoleTemplate`
* `DashboardUserLayout`
* `DashboardWidgetConfig`
* `DashboardWidgetDataCache`
* `DashboardRefreshJob`
* `DashboardAlertRule`
* `DashboardAlertEvent`
* `DashboardAccessLog`

## 8. Nguyên tắc thiết kế

1. Role-first dashboard, nhưng vẫn cho phép user-level personalization trong phạm vi được phép.
2. Widget phải được đăng ký tập trung qua registry.
3. Layout phải tách khỏi dữ liệu widget.
4. Cache là mặc định, real-time là tối ưu có chọn lọc.
5. Mọi dashboard đều phải drill-down được về module nguồn nếu người dùng có quyền.

## 9. Rủi ro kiến trúc cần kiểm soát

1. M11 query trực tiếp quá nhiều vào module nguồn gây nặng hệ thống.
2. Widget tùy chỉnh quá tự do làm vỡ bố cục hoặc lộ dữ liệu ngoài scope.
3. Dùng WebSocket/SSE cho mọi widget gây tốn tài nguyên.
4. KPI không thống nhất định nghĩa giữa các dashboard.
5. Redis cache không tách theo scope/role gây rò rỉ dữ liệu.

## 10. Chiến lược triển khai theo phase

### Phase 1

* Dashboard role-based cơ bản
* Widget registry
* Layout theo role + tùy chỉnh cá nhân mức tối thiểu
* Cache 3 tầng
* Executive/Department/Education dashboards tối thiểu

### Phase 2

* Drag-drop nâng cao
* Real-time selective updates
* Dashboard alerts
* Drill-down liên module

### Phase 3

* Dashboard builder nâng cao
* Cross-module analytics widgets
* Personalized recommendations
* Mobile dashboard optimization sâu hơn

---