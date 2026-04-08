---
description: Thiết kế hoặc mở rộng schema dữ liệu an toàn, tránh trùng model và tránh phá dữ liệu cũ
---

# Design Database

## Mục tiêu
Thiết kế schema đúng nghiệp vụ, đúng relation, an toàn khi migrate.

## Quy trình bắt buộc
1. Kiểm tra model hiện có trong schema
2. Xác định model nào tái sử dụng được
3. Xác định model nào cần thêm mới
4. Xác định enum cần có
5. Xác định unique/index quan trọng
6. Xác định relation với model lõi hệ thống

## Phải trả lời trước khi code
- Có model cũ nào tương đương không
- Có dữ liệu thật đang nằm ở model cũ không
- Nên extend hay tạo mới
- Có cần migration/deprecation plan không

## Output bắt buộc
- models thêm mới
- models sửa
- enums thêm mới
- indexes/uniques
- migration risks
- rollout strategy

## Không được làm
- Không tạo bảng mới chỉ vì tên khác nếu bản chất giống model cũ
- Không drop field cũ ngay khi chưa có kế hoạch migrate
- Không bỏ qua index ở các bảng search/filter nhiều