## 6) `docs/prompts/m07-prompts.md`

# M07 Prompt Pack

## Prompt 1 – Analyze module M07

Đọc:

* .claude/CLAUDE.md
* docs/design/system-overview.md
* docs/design/system-module-map.md
* docs/design/system-integration-map.md
* docs/design/module-m07-overview.md
* docs/design/module-m07-faculty-profile-eis.md
* docs/design/module-m07-teaching-workload.md
* docs/design/module-m07-student-profile-gpa.md
* docs/design/module-m07-dashboard-reporting.md

Chưa code.

Hãy:

1. tóm tắt đầy đủ phạm vi M07
2. mapping phụ thuộc với M01, M02, M09, M10, M19
3. xác định model nào là source of truth, model nào là read-model/snapshot
4. đề xuất Phase 1 nên làm trước phần nào
5. chỉ ra rủi ro dữ liệu và phân quyền

## Prompt 2 – Design Prisma schema for M07

Đọc toàn bộ design docs M07.

Chỉ làm schema design.

Yêu cầu:

1. tạo Prisma models cho FacultyProfile, FacultyEISScore, StudentProfile và các snapshot cần thiết
2. không duplicate source of truth từ M02/M09/M10
3. enum hóa academicStatus, EIS trend, workload alert status nếu cần
4. thêm indexes cho dashboard, ranking, profile lookup
5. giải thích ngắn gọn vai trò từng model

## Prompt 3 – Build faculty profile + EIS backend

Đọc:

* module-m07-faculty-profile-eis.md

Hãy:

1. xây service hồ sơ giảng viên 360°
2. xây batch calculation service cho EIS theo học kỳ
3. tạo API lịch sử EIS và radar-chart data
4. fail-closed nếu thiếu quyền FACULTY.EIS_MANAGE
5. chưa hard-code AI recommendations nếu chưa có dữ liệu explainability

## Prompt 4 – Build teaching workload engine

Đọc:

* module-m07-teaching-workload.md

Hãy:

1. lấy dữ liệu lớp học phần từ M10 hoặc adapter/service tương ứng
2. tính currentWeeklyHours và snapshot theo kỳ
3. tạo cảnh báo quá tải so với weeklyHoursLimit
4. xây API workload summary và workload alerts
5. tránh query runtime quá nặng

## Prompt 5 – Build student profile + GPA engine

Đọc:

* module-m07-student-profile-gpa.md

Hãy:

1. xây service profile360 học viên
2. lấy điểm chính thức từ M10 để tính GPA tích lũy
3. thêm GPA history theo kỳ
4. chuẩn hóa academicStatus và warning logic
5. bảo đảm giảng viên chỉ xem học viên trong scope được phép

## Prompt 6 – Build dashboard/reporting for M07

Đọc:

* module-m07-dashboard-reporting.md

Hãy:

1. xây faculty dashboard summary
2. xây student dashboard summary
3. xây ranking/cảnh báo mức tối thiểu cho Phase 1
4. đề xuất summary tables cho Phase 2
5. chuẩn bị export hooks để tích hợp với M18

## Prompt 7 – Review M07 architecture before implementation

Đọc toàn bộ M07 docs.

Chưa code.

Hãy review:

1. phần nào của M07 đang đè lên M10 hoặc M02
2. phần nào nên giữ là read-model
3. luồng nào cần background jobs
4. điểm nào phải audit kỹ
5. đề xuất thứ tự implement an toàn nhất
