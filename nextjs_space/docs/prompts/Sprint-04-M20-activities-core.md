# Sprint 04 — M20 Science Activities Core

## Mục tiêu
Làm lõi vòng đời hồ sơ khoa học: đề xuất, tiếp nhận, thẩm định, phê duyệt, kích hoạt thực hiện.

## Phạm vi
- proposal
- intake
- review
- approval
- activate execution

## Claude phải làm
1. Hoàn thiện schema và service cho:
   - research projects
   - attachments
   - members
   - workflow logs
2. Viết validators cho create/update/submit/review/approve/activate.
3. Viết tRPC procedures tương ứng.
4. Tạo UI pages tối thiểu cho:
   - proposals
   - intake
   - review
   - execution
5. Gắn audit points cho submit/review/approve/activate.
6. Dùng M13 cho workflow transitions, không tự dựng engine riêng.

## Route UI
- app/(dashboard)/science/activities/proposals/
- app/(dashboard)/science/activities/intake/
- app/(dashboard)/science/activities/review/
- app/(dashboard)/science/activities/execution/

## Không được làm
- Chưa làm progress/acceptance/archive
- Chưa làm councils đầy đủ
- Chưa làm budgets đầy đủ

## Điều kiện qua sprint 05
- Luồng DRAFT -> SUBMITTED -> REVIEW/APPROVAL -> IN_PROGRESS chạy được ở mức cơ bản.
