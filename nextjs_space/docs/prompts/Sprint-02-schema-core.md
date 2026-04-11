# Sprint 02 — Schema Core

## Mục tiêu
Thiết kế Prisma schema cốt lõi cho M20–M26.

## Phạm vi
- Chỉ làm schema, enum, relation, index.
- Không làm UI.
- Không làm router đầy đủ.

## Claude phải làm
1. Đề xuất các model cho:
   - M20 activities
   - M21 resources
   - M22 data hub aggregates
   - M23 councils
   - M24 budgets
   - M25 works/library
   - M26 AI/report/search support
2. Chỉ ra model nào:
   - là dữ liệu nguồn
   - là aggregate
   - là junction
   - là audit/auxiliary
3. Thiết kế enum cho:
   - trạng thái hồ sơ
   - vai trò hội đồng
   - mức độ mật
   - loại công trình
   - trạng thái chất lượng dữ liệu

## Đầu ra bắt buộc
- patch/schema proposal cho `prisma/schema.prisma`
- ghi chú index và unique constraints
- migration note

## Không được làm
- Không viết business logic
- Không viết UI

## Điều kiện qua sprint 03
- schema phải đủ để router/service bám vào mà không đổi hướng.
