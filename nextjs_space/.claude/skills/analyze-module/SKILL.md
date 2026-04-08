---
description: Phân tích một module phần mềm theo góc nhìn kiến trúc, nghiệp vụ, dữ liệu, API và UI trước khi code
---

# Analyze Module

## Mục tiêu
Phân tích đầy đủ một module trước khi triển khai để tránh code sai kiến trúc, sai nghiệp vụ hoặc thiếu integration.

## Khi dùng skill này
Dùng khi:
- vừa nhận tài liệu kỹ thuật của module
- cần hiểu nhanh module trước khi code
- cần chia nhỏ module thành các phần khả thi
- cần mapping module vào codebase hiện tại

## Quy trình bắt buộc

### Bước 1: Đọc tài liệu
Đọc:
- file overview của module
- file use case chi tiết
- file system-overview nếu module có phụ thuộc hệ thống

### Bước 2: Tóm tắt module
Phải trả lời:
1. Module giải quyết bài toán gì
2. Actors là ai
3. Use cases chính là gì
4. Lifecycle chính là gì nếu có
5. Dữ liệu lõi là gì
6. Module phụ thuộc những module nào
7. Module nào phụ thuộc ngược lại vào nó

### Bước 3: Phân tích theo 5 trục
- Nghiệp vụ
- Dữ liệu
- API
- UI
- Integration

### Bước 4: Mapping vào codebase
Chỉ ra:
- file nào có thể tái sử dụng
- file nào cần tạo mới
- file nào cần sửa
- các integration points

### Bước 5: Chia phase triển khai
Phải chia ít nhất:
- schema/data
- service/repository
- API
- UI
- review/test

## Output bắt buộc
1. Tóm tắt module
2. Dữ liệu lõi
3. API chính
4. UI chính
5. Phụ thuộc hệ thống
6. File cần tạo/sửa
7. Roadmap phase

## Không được làm
- Không code ngay nếu chưa phân tích xong
- Không bỏ qua phụ thuộc hệ thống
- Không tự giả định data model nếu chưa kiểm tra schema hiện tại