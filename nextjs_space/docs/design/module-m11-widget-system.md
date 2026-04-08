## 3) `docs/design/module-m11-widget-system.md`

# Module M11 – Widget System và Dashboard Customization

## 1. Mục tiêu

Tài liệu này mô tả hệ widget – lõi cấu thành M11. Theo tài liệu gốc, M11 có hệ `WIDGET_REGISTRY` với 41 widget, được nhóm theo từng mảng nghiệp vụ như nhân sự, đào tạo, nghiên cứu, đảng, chính sách, workflow; có metadata như tiêu đề, kích thước, loại biểu đồ, cờ cảnh báo và module nguồn. fileciteturn2file0L32-L48

## 2. Nguyên tắc thiết kế

1. Widget phải đăng ký tập trung qua registry.
2. Mỗi widget có metadata, data adapter, permission gate và layout constraints.
3. Widget key là duy nhất trong toàn hệ thống.
4. Layout tách rời widget definition.
5. User chỉ được tùy chỉnh trong phạm vi role template cho phép.

## 3. Widget Registry

Tài liệu gốc minh họa `WIDGET_REGISTRY` với các widget như:

* `PERSONNEL_TOTAL`
* `PERSONNEL_STRUCTURE`
* `ACTIVE_SECTIONS`
* `GPA_DISTRIBUTION`
* `RESEARCH_ACTIVE`
* `PARTY_CLASSIFICATION`
* `REWARD_PIPELINE`
* `WORKFLOW_PENDING`
* `SLA_OVERDUE`... fileciteturn2file0L32-L48

### Metadata gợi ý cho mỗi widget

* `key`
* `title`
* `module`
* `size`
* `chartType`
* `isAlert`
* `defaultRoles`
* `requiredPermissions`
* `supportedScopes`
* `refreshPolicy`
* `drilldownRoute`

## 4. Layout system

Tài liệu gốc xác định dùng React Grid Layout để kéo-thả. Vì vậy hệ layout nên có hai lớp:

1. `DashboardRoleTemplate`: bố cục mặc định theo role.
2. `DashboardUserLayout`: bản tùy chỉnh theo người dùng.

Các thao tác chính:

* thêm/bỏ widget được phép
* kéo-thả vị trí
* resize trong giới hạn
* reset về layout mặc định

## 5. Widget Data Adapter

Mỗi widget không nên tự query dữ liệu tùy ý. Nên chuẩn hóa qua adapter:

* `getWidgetData(widgetKey, context)`
* adapter điều phối về service của module nguồn
* adapter chịu trách nhiệm cache lookup, permission gate và data shaping

## 6. Customization policy

### Cho phép

* đổi vị trí
* đổi kích thước trong giới hạn
* ẩn/hiện widget không bắt buộc
* đổi refresh mode trong khung cho phép

### Không cho phép nếu không có quyền đặc biệt

* tạo widget tùy ý ngoài registry
* thay đổi nguồn dữ liệu widget
* hiển thị widget ngoài role/scope cho phép

## 7. API gợi ý

* `GET /api/dashboard/widgets/registry`
* `GET /api/dashboard/layout/me`
* `POST /api/dashboard/layout/me`
* `POST /api/dashboard/layout/reset`
* `GET /api/dashboard/widgets/:widgetKey/data`
* `POST /api/dashboard/widgets/:widgetKey/refresh`

## 8. Rủi ro cần kiểm soát

* Registry thiếu versioning làm thay đổi widget phá layout cũ.
* Widget data adapter quá phân mảnh khó kiểm soát hiệu năng.
* Người dùng kéo quá nhiều widget nặng lên cùng một màn hình.
* Widget alert hiển thị trùng lặp với dashboard cảnh báo tổng hợp.

---