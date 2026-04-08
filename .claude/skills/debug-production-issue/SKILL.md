---
description: Phân tích và xử lý sự cố production theo hướng điều tra nguyên nhân gốc, không vá tạm bừa bãi
---

# Debug Production Issue

## Mục tiêu
Tìm nguyên nhân gốc của lỗi production và đề xuất cách sửa an toàn.

## Quy trình bắt buộc
1. Xác định triệu chứng
2. Xác định phạm vi ảnh hưởng
3. Thu thập dấu vết:
   - logs
   - stack trace
   - request/response
   - DB state
4. Xác định nguyên nhân gốc
5. Đề xuất fix ngắn hạn
6. Đề xuất fix dài hạn
7. Đề xuất regression tests

## Output bắt buộc
- triệu chứng
- phạm vi
- nguyên nhân gốc
- fix nhanh
- fix bền vững
- test cần thêm

## Không được làm
- Không đoán mò khi chưa đọc log/code liên quan
- Không vá ở UI nếu lỗi gốc nằm ở service/schema