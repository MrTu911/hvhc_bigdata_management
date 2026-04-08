---
description: Triển khai một module hoặc use case từ tài liệu thiết kế, bám đúng codebase hiện tại
---

# Implement From Design

## Mục tiêu
Đọc tài liệu thiết kế và triển khai đúng theo phase, không làm lệch kiến trúc.

## Quy trình bắt buộc

### Bước 1: Đọc thiết kế
Phải đọc:
- overview module
- file use case chi tiết
- system docs nếu module có phụ thuộc nền

### Bước 2: Tóm tắt
Trước khi code phải nêu:
- mục tiêu
- phạm vi
- file cần tạo/sửa
- phase triển khai

### Bước 3: Chỉ code đúng phase được giao
Ví dụ:
- Phase 1: schema
- Phase 2: repo/service
- Phase 3: API
- Phase 4: UI
- Phase 5: review/test

### Bước 4: Báo cáo sau khi code
Phải nêu:
- file đã tạo
- file đã sửa
- nội dung chính đã làm
- giả định kỹ thuật
- phần còn thiếu
- bước tiếp theo

## Quy tắc
- Không làm cả module trong một lần nếu module lớn
- Không đặt business logic vào route
- Không bỏ qua validation
- Không tạo model trùng nếu schema cũ đã có model gần tương đương