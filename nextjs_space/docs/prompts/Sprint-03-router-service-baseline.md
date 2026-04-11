# Sprint 03 — Router & Service Baseline

## Mục tiêu
Tạo khung router/service/validation dùng chung cho M20–M26.

## Phạm vi
- validators
- router skeleton
- service skeleton
- auth guard points

## Claude phải làm
1. Tạo cấu trúc thư mục:
   - server/routers/science/*
   - server/services/science/*
   - lib/validations/science/*
2. Tạo router khung cho:
   - m20ActivitiesRouter
   - m21ResourcesRouter
   - m22DataHubRouter
   - m23CouncilsRouter
   - m24BudgetsRouter
   - m25WorksLibraryRouter
   - m26SearchAiReportsRouter
3. Chèn sẵn TODO có nghĩa nghiệp vụ, không placeholder vô ích.
4. Gắn guard dùng M01/M13/M19/M18 ở điểm cần thiết.

## Đầu ra bắt buộc
- skeleton routers
- skeleton services
- zod validators baseline

## Không được làm
- Không viết page UI
- Không làm logic AI hoàn chỉnh
- Không làm export engine riêng

## Điều kiện qua sprint 04
- Có khung module rõ ràng, có thể phát triển từng module độc lập.
