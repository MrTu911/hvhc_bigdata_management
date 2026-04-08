---
description: Tích hợp một module vào hệ thống, xác định đúng dependency, nguồn dữ liệu và service boundary
---

# Integrate Module

## Mục tiêu
Tích hợp module mới vào hệ sinh thái hiện có mà không phá ranh giới kiến trúc.

## Phải xác định
1. Module phụ thuộc M01/M02/M13/M18/M19 thế nào
2. Dữ liệu gốc đến từ đâu
3. Chức năng nào nên dùng lại từ module nền
4. API nội bộ nào cần có
5. Chỗ nào cần adapter thay vì gọi trực tiếp

## Output bắt buộc
- dependency map
- integration points
- API/service boundaries
- shared data contracts
- rollout risks