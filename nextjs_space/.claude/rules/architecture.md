# Architecture Rules

## Mục tiêu
Đảm bảo Claude luôn code đúng kiến trúc toàn hệ thống, không làm module theo kiểu cô lập sai thực tế.

---

## Kiến trúc chuẩn
Phải ưu tiên kiến trúc:

- Route/API layer
- Service layer
- Repository layer
- Integration layer
- UI layer
- Shared hooks/components
- Prisma/data layer

---

## Trách nhiệm từng lớp

### Route/API layer
Chỉ được:
- đọc request
- validate input
- gọi service
- trả response chuẩn

Không được:
- chứa business logic nặng
- truy cập DB trực tiếp nếu đã có service/repository
- chứa logic tính toán cốt lõi

### Service layer
Chứa:
- business rules
- workflow/lifecycle logic
- orchestration giữa nhiều repository/module
- permission-aware business checks nếu phù hợp

Không được:
- render UI
- gắn logic HTTP thuần túy

### Repository layer
Chỉ làm:
- truy vấn DB
- mapping dữ liệu DB nếu cần
- hỗ trợ transaction khi service gọi

Không được:
- encode nghiệp vụ phức tạp
- gọi module ngoài bừa bãi

### Integration layer
Dùng cho:
- M01 auth
- M13 workflow
- M18 export
- M19 master data
- SSO
- MinIO
- Redis
- queue
- AI engine

### UI layer
Chỉ nên:
- hiển thị
- thu thập input
- gọi API/hook
- quản lý state UI

Không được:
- nhét business logic phức tạp
- duplicate validation/business rules từ backend mà không có lý do

---

## Dependency rules
- Module nghiệp vụ phải dùng module nền đúng chỗ:
  - M01 cho auth/RBAC/scope/audit
  - M02 cho master nhân sự
  - M13 cho workflow
  - M18 cho export/template
  - M19 cho lookup/master data
- Không tự hard-code chức năng lẽ ra module nền đã cung cấp.

---

## Thiết kế module lớn
Module lớn phải tách theo:
- overview
- core use cases
- workflow/lifecycle
- analytics/dashboard
- integration

Không được coi module lớn như CRUD module nhỏ.

---

## Shared boundaries
- Shared component phải thật sự generic.
- Shared service phải có phạm vi rõ.
- Không đẩy code lên shared quá sớm khi chưa chắc tái sử dụng.

---

## Không được làm
- Không phá ranh giới module
- Không tạo circular dependency giữa services
- Không để UI gọi DB trực tiếp
- Không để route điều khiển workflow lớn