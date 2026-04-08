---
description: Refactor code hoặc schema theo hướng an toàn, tránh phá tương thích và tránh mất dữ liệu
---

# Refactor Safely

## Mục tiêu
Cải tổ code cũ mà không phá production và không làm mất dữ liệu.

## Quy trình bắt buộc
1. Xác định cái cũ đang hoạt động ra sao
2. Xác định ai đang dùng nó
3. Xác định phần cần giữ tương thích
4. Đề xuất chiến lược:
   - extend
   - wrap
   - migrate dần
   - deprecate
5. Chia rollout thành nhiều bước

## Rule vàng
- Không drop field cũ ngay
- Không xóa route cũ ngay nếu còn consumer
- Dual-read / single-write là chiến lược tốt trong giai đoạn chuyển tiếp
- Có migration script hoặc backfill plan nếu cần

## Output bắt buộc
- current state
- target state
- migration plan
- compatibility plan
- rollback plan