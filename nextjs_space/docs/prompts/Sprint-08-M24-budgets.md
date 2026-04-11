# Sprint 08 — M24 Science Budgets

## Mục tiêu
Triển khai dự toán, phê duyệt, giải ngân và theo dõi sử dụng kinh phí khoa học.

## Phạm vi
- budgets
- budget lines
- approvals
- disbursements
- usage snapshots
- threshold alerts

## Claude phải làm
1. Hoàn thiện schema và procedures cho ngân sách.
2. Gắn research project relation từ M20.
3. Tính planned vs actual.
4. Cảnh báo 90% / 100%.
5. Tạo UI cho:
   - budget setup
   - approval
   - disbursement
   - usage
6. Đảm bảo audit đầy đủ.

## Route UI
- app/(dashboard)/science/activities/execution/
- app/(dashboard)/science/activities/progress/

## Điều kiện qua sprint 09
- M20 có thể gắn kinh phí thật và theo dõi được sử dụng.
