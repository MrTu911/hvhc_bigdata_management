# Sprint 07 — M23 Science Councils & Evaluation

## Mục tiêu
Triển khai hội đồng khoa học, phản biện kín, bỏ phiếu, kết luận.

## Phạm vi
- councils
- members
- reviewer assignments
- reviews
- votes
- session records

## Claude phải làm
1. Hoàn thiện model và procedures cho hội đồng.
2. Áp dụng closed-review visibility.
3. Áp dụng rule >= 2/3 PASS = PASS.
4. Tích hợp dữ liệu chuyên gia từ M21.
5. Tạo UI tabs:
   - information
   - members
   - reviews
   - votes
   - results
6. Gắn audit và sensitivity rules rõ.

## Route UI
- app/(dashboard)/science/activities/councils/

## Không được làm
- Không trộn vào report engine
- Không tạo workflow engine riêng

## Điều kiện qua sprint 08
- Hội đồng thẩm định/nghiệm thu có thể được tạo và ghi nhận kết quả.
