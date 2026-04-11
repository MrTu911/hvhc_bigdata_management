# Sprint 12 — Security / Audit / Export / Master Data Review

## Mục tiêu
Rà soát toàn bộ M20–M26 theo các trục nền tảng.

## Phạm vi
- auth guards
- audit points
- master data usage
- export hook usage
- workflow hook usage

## Claude phải làm
1. Review toàn bộ M20–M26:
   - chỗ nào thiếu auth guard
   - chỗ nào thiếu audit
   - chỗ nào hard-code lookup
   - chỗ nào export sai chỗ
   - chỗ nào bypass workflow
2. Đề xuất patch ngắn, rõ, ít phá vỡ.
3. Sửa dứt điểm các lỗi nền.

## Đầu ra bắt buộc
- bảng review vi phạm kiến trúc
- patch list
- danh sách file sửa

## Điều kiện qua sprint 13
- Kiến trúc sạch, ít bypass, đủ điều kiện hardening cuối.
