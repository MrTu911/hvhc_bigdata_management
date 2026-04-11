# 00-SYSTEM-SPRINT-GUARD.md

## Mục tiêu
Bộ prompt này dùng để triển khai **gói miền nghiên cứu khoa học** theo mã mới **M20–M26** trên nền HVHC BigData gốc.

## Quy tắc bất biến
- Chỉ dùng mã mới:
  - M20 = Science Activities
  - M21 = Science Resources
  - M22 = Science Data Hub
  - M23 = Science Councils & Evaluation
  - M24 = Science Budgets
  - M25 = Science Works & Library
  - M26 = Science Search, AI & Reports
- Không dùng hay nhắc lại mã cũ của thiết kế 3 miền.
- Chỉ tái sử dụng module nền:
  - M01 Security Platform
  - M02 Personnel Core
  - M13 Workflow Platform
  - M18 Export & Template Platform
  - M19 Master Data Platform
- Không tạo song song Auth / Workflow / Export / Master Data.

## Cấu trúc code phải giữ
- app/
- app/api/trpc/[trpc]/
- server/routers/
- server/services/
- lib/validations/
- prisma/

## Luật thực thi
1. Mỗi sprint chỉ làm đúng phạm vi sprint đó.
2. Không nhảy sang UI nếu schema và service chưa ổn.
3. Không đổi cấu trúc thư mục.
4. Mọi mutation quan trọng phải có audit point.
5. Mọi filter/danh mục dùng M19.
6. Mọi export/report dùng M18.
7. Mọi trạng thái quy trình dùng M13 nếu có workflow.

## Cấu trúc trả lời bắt buộc của Claude
Trước khi code:
1. Tóm tắt mục tiêu sprint
2. Liệt kê file sẽ tạo/sửa
3. Liệt kê phụ thuộc module nền
4. Nêu rủi ro kiến trúc

Sau khi code:
1. Danh sách file đã thay đổi
2. Việc đã hoàn thành
3. Việc còn lại
4. Lỗi hoặc rủi ro cần theo dõi
