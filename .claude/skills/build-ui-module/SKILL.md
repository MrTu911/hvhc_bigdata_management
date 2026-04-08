---
description: Thiết kế và triển khai UI cho module phần mềm theo đúng use case, không nhồi business logic vào component
---

# Build UI Module

## Mục tiêu
Xây UI rõ ràng, bám use case, tái sử dụng component tốt, không trộn nghiệp vụ nặng vào frontend.

## Phải phân tích trước
1. Người dùng thao tác theo luồng nào
2. Màn hình chính là gì
3. Thành phần nào nên tách component
4. UI nào cần state phức tạp
5. Dữ liệu nào chỉ hiển thị, dữ liệu nào chỉnh sửa
6. Có cần guard quyền hay sensitive field guard không

## Quy tắc
- Page lo layout và data loading chính
- Component lo hiển thị
- Business logic nặng không đặt trong component
- Form lớn phải tách section/component con
- Nếu workflow nhiều bước, ưu tiên wizard/tab

## Output bắt buộc
- page structure
- component tree
- state management plan
- loading/error/empty states
- notes về quyền và UX