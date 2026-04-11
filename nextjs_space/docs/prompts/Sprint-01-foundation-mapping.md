# Sprint 01 — Foundation Mapping

## Mục tiêu
Chốt bản đồ kiến trúc triển khai cho M20–M26 trên nền M01/M02/M13/M18/M19.

## Phạm vi
- Không code UI.
- Không code business logic sâu.
- Chỉ phân tích và mapping.

## Claude phải làm
1. Xác nhận ý nghĩa M20–M26.
2. Lập bảng mapping:
   - module mới
   - module nền tái sử dụng
   - route UI
   - router/service cần có
   - entity sơ bộ
3. Đề xuất thứ tự triển khai kỹ thuật.
4. Liệt kê file thiết kế cần thêm nếu thiếu.

## Đầu ra bắt buộc
- 1 bảng implementation map
- 1 dependency map
- 1 file plan hoặc section plan trong phản hồi

## Không được làm
- Không tạo Prisma schema thật
- Không viết tRPC routers
- Không viết page.tsx

## Điều kiện qua sprint 02
- Kiến trúc module và dependency phải rõ, không còn nhầm mã module.
