# Sprint 09 — M25 Science Works & Library

## Mục tiêu
Triển khai công trình khoa học, xuất bản và thư viện số.

## Phạm vi
- scientific works
- authors
- DOI/CrossRef import
- duplicate check
- digital library upload/search/download/analytics

## Claude phải làm
1. Hoàn thiện schema:
   - scientific works
   - authors
   - project links
   - library items
   - metadata
   - access logs
2. Viết services:
   - CrossRef import
   - duplicate check baseline
   - upload/download pipeline contract
3. Tạo UI:
   - works
   - work detail/import
   - library
   - analytics
4. Dùng M18 cho export, M19 cho danh mục, M01 cho access.
5. Không dựng storage abstraction trái kiến trúc đã chốt.

## Route UI
- app/(dashboard)/science/resources/works/
- app/(dashboard)/science/resources/library/

## Điều kiện qua sprint 10
- Kho tri thức khoa học vận hành cơ bản, cung cấp dữ liệu cho search/report/AI.
