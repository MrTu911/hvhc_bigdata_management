# Sprint 05 — M20 Progress / Acceptance / Archive

## Mục tiêu
Hoàn thiện nửa sau của vòng đời khoa học.

## Phạm vi
- milestones
- progress alerts
- acceptance submission
- recognize
- archive / lock

## Claude phải làm
1. Bổ sung model/service cho:
   - milestones
   - progress alerts
   - acceptance records
   - archive metadata
2. Tạo procedures:
   - add/update milestone
   - submit acceptance
   - recognize result
   - archive project
3. Tạo UI:
   - progress
   - acceptance
   - archive
4. Thêm lock/unlock rule.
5. Gắn audit đầy đủ cho recognize/archive.
6. Chuẩn bị hook tích hợp M23 và M24.

## Route UI
- app/(dashboard)/science/activities/progress/
- app/(dashboard)/science/activities/acceptance/
- app/(dashboard)/science/activities/archive/

## Không được làm
- Không viết export riêng
- Không viết AI riêng cho module này

## Điều kiện qua sprint 06
- M20 có lifecycle gần đầy đủ từ đề xuất tới lưu trữ.
