# Sprint 11 — M26 Science Search, AI & Reports

## Mục tiêu
Triển khai lớp tra cứu, AI và báo cáo cho miền khoa học.

## Phạm vi
- keyword/full-text/semantic/hybrid search
- saved filters
- AI chat/summarize/trends/duplicate
- reports/activity/capacity/generate

## Claude phải làm
1. Thiết kế search result shape thống nhất.
2. Tạo procedures:
   - search
   - semantic
   - hybrid
   - save filter
   - ai chat
   - ai summarize
   - ai research trends
   - ai duplicate check
   - reports activity/capacity/generate
3. Tạo UI:
   - search
   - ai-tools
   - reports
4. Chỉ chạy AI trên dữ liệu APPROVED nếu đã có rule.
5. Mọi export qua M18.
6. Mọi filter danh mục qua M19.

## Route UI
- app/(dashboard)/science/database/search/
- app/(dashboard)/science/database/ai-tools/
- app/(dashboard)/science/database/reports/

## Điều kiện qua sprint 12
- Search/AI/report chạy ở mức usable, chưa cần hardening cuối.
