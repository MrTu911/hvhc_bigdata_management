# Sprint 10 — M22 Science Data Hub

## Mục tiêu
Xây kho dữ liệu hợp nhất cho miền khoa học.

## Phạm vi
- overview dashboards
- unified records
- scientific catalogs namespace
- data quality baseline
- alerts

## Claude phải làm
1. Tạo aggregate service cho:
   - project unified record
   - scientist unified record
   - unit unified record
2. Tạo dashboard data overview.
3. Tạo namespace catalogs khoa học trên M19.
4. Tạo baseline quality checks và issues list.
5. Tạo UI:
   - overview
   - records
   - catalogs
   - quality
6. Không copy logic search/AI/report đầy đủ vào sprint này.

## Route UI
- app/(dashboard)/science/database/overview/
- app/(dashboard)/science/database/records/
- app/(dashboard)/science/database/catalogs/
- app/(dashboard)/science/database/quality/

## Điều kiện qua sprint 11
- Dữ liệu khoa học hợp nhất có thể hiển thị và theo dõi chất lượng cơ bản.
