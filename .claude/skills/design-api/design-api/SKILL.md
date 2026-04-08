---
description: Thiết kế API chuẩn cho module phần mềm theo kiến trúc route-service-repository
---

# Design API

## Mục tiêu
Thiết kế API rõ ràng, ổn định, dễ mở rộng, bám đúng use case.

## Phải phân tích trước khi thiết kế
1. API này phục vụ use case nào
2. Actor nào gọi API
3. Quyền nào cần kiểm tra
4. Dữ liệu đầu vào và đầu ra là gì
5. Có cần pagination/filter/sort không
6. Có cần audit không
7. Có integration với module khác không

## Chuẩn API
- Response chuẩn:
  `{ success, data, error }`
- Route chỉ:
  - parse request
  - gọi service
  - trả response
- Business logic ở service
- DB access ở repository

## Output bắt buộc
- danh sách endpoint
- method
- request shape
- response shape
- validation rules
- RBAC notes
- error cases

## Không được làm
- Không viết business logic trong route
- Không truy cập DB trực tiếp trong route nếu đã có service/repository