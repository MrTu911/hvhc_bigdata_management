# Sprint 06 — M21 Science Resources Core

## Mục tiêu
Xây dựng hồ sơ nhà khoa học, năng lực đơn vị, nguồn chuyên gia.

## Phạm vi
- scientists
- unit science capacity
- expert suggestion baseline
- metrics baseline

## Claude phải làm
1. Hoàn thiện model:
   - scientists
   - education
   - career
   - awards
   - research areas
2. Tạo procedures:
   - get profile
   - search/filter
   - create/update
   - sync ORCID hook
   - unit capacity
   - expert list/history
3. Tạo UI pages:
   - scientists
   - units
   - experts
   - capacity
4. Dùng M02 làm nền nhân sự, không copy dữ liệu dư thừa.
5. Gắn export hook về M18, không tự render file.

## Route UI
- app/(dashboard)/science/resources/scientists/
- app/(dashboard)/science/resources/units/
- app/(dashboard)/science/resources/experts/
- app/(dashboard)/science/resources/capacity/

## Điều kiện qua sprint 07
- Có dữ liệu nguồn đủ tốt để M23 và M25 bám vào.
