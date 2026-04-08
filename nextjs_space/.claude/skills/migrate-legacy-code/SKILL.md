---
description: Di trú từ code/schema/hệ thống cũ sang kiến trúc mới một cách có kiểm soát
---

# Migrate Legacy Code

## Mục tiêu
Đưa hệ thống cũ sang kiến trúc mới mà vẫn giữ dữ liệu và giảm rủi ro gián đoạn.

## Phải phân tích
1. Dữ liệu cũ đang ở đâu
2. Luồng cũ đang chạy ra sao
3. Cái gì phải giữ tương thích
4. Cái gì có thể bỏ dần
5. Có cần DRY_RUN không
6. Có cần backfill không

## Output bắt buộc
- mapping cũ → mới
- migration steps
- dry run plan
- rollback plan
- data validation plan