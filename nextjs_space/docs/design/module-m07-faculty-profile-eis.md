## 2) `docs/design/module-m07-faculty-profile-eis.md

# Module M07 – Hồ sơ giảng viên 360° và EIS Score

## 1. Mục tiêu

Tài liệu này bao phủ ba nhóm chức năng phía giảng viên:

* UC-33: Hồ sơ giảng viên 360°
* UC-34: AI EIS Score – đánh giá hiệu quả giảng viên 6 chiều
* một phần UC-35: tải giảng hiện tại để phục vụ hồ sơ và đánh giá

Theo tài liệu gốc, `FacultyProfile` được xây quanh liên kết một-một với `Personnel`, có thông tin học hàm, học vị, chuyên ngành, nghiên cứu, chức danh giảng dạy, hạn mức giờ dạy/tuần và liên kết trực tiếp với điểm EIS, đề tài nghiên cứu, công bố khoa học. fileciteturn1file0L42-L69

## 2. Mô hình dữ liệu lõi

### 2.1. `FacultyProfile`

Các trường lõi theo tài liệu gốc:

* `personnelId` liên kết duy nhất với `Personnel`
* `academicRank`
* `academicDegree`
* `specialization`
* `researchInterests`
* `teachingPosition`
* `teachingStart`
* `weeklyHoursLimit`
* `currentWeeklyHours`
* liên kết `eisScores`
* liên kết đề tài và công bố khoa học. fileciteturn1file0L42-L69

### 2.2. `FacultyEISScore`

Tài liệu gốc chốt đây là bảng tính theo từng học kỳ với sáu thành phần chấm điểm từ 0–100 và một điểm tổng hợp `totalEIS`; có `trend`, `recommendations`, `calculatedAt`. fileciteturn1file0L54-L69

### 2.3. Bảng phụ trợ nên bổ sung

Để vận hành thực tế ổn định, nên bổ sung:

* `FacultyWorkloadSnapshot`
* `FacultyEISCalculationLog`
* `FacultyMentoringSummary`
* `FacultyServiceContributionSnapshot`
* `FacultyInnovationSnapshot`
* `FacultyDevelopmentSnapshot`

## 3. Hồ sơ giảng viên 360°

Hồ sơ giảng viên 360° cần hiển thị ít nhất 6 nhóm thông tin:

1. Thông tin căn cước/ngạch/bậc từ M02.
2. Học hàm, học vị, chuyên ngành, chức danh giảng dạy từ M07.
3. Tải giảng hiện tại và theo kỳ từ M10/M07.
4. Kết quả nghiên cứu khoa học từ M09.
5. Hướng dẫn học viên, khóa luận, luận văn từ M10.
6. Điểm EIS, xu hướng EIS, kiến nghị cải thiện từ M07.

## 4. EIS Score Engine

### 4.1. Công thức gốc

Tài liệu chốt công thức:

`EIS = T×0.25 + R×0.25 + M×0.20 + S×0.15 + I×0.10 + D×0.05`. fileciteturn1file0L70-L84

### 4.2. Sáu chiều đánh giá

Tài liệu gốc nêu rõ nguồn dữ liệu cho từng chiều:

* `T` – Teaching quality: điểm trung bình SV từ M10, tỷ lệ SV đạt từ 7.0, tỷ lệ hoàn thành lớp học, feedback sinh viên.
* `R` – Research output: số bài báo từ M09, H-index/ScientificProfile, số đề tài được duyệt, tổng trích dẫn.
* `M` – Mentoring: số SV hướng dẫn khóa luận từ M10, tỷ lệ tốt nghiệp đúng hạn, điểm trung bình khóa luận.
* `S` – Service: số tiết dạy thực tế/kỳ, tham gia hội đồng, hoạt động Đảng/đoàn từ M03.
* `I` – Innovation: số sáng kiến khoa học từ M09, số tài liệu giảng dạy mới, số học liệu số upload.
* `D` – Development: số khóa đào tạo tham dự, bằng cấp/chứng chỉ mới từ M02, chức danh thăng tiến. fileciteturn1file0L70-L84

## 5. Nguyên tắc tính điểm

1. Mỗi chiều phải chuẩn hóa về thang 0–100 trước khi nhân trọng số.
2. Dữ liệu thiếu phải có policy rõ: bỏ qua, trung tính, hay gán điểm 0.
3. Phải lưu dấu vết nguồn dữ liệu tính toán theo kỳ.
4. Không cho chỉnh tay `totalEIS` trực tiếp nếu không có quyền đặc biệt.
5. Mọi recommendations phải dựa trên dữ liệu thực tế, không tạo khuyến nghị mơ hồ.

## 6. Chiến lược triển khai EIS

### Phase 1

* Trigger tính EIS theo một giảng viên hoặc toàn bộ
* Tính theo batch học kỳ
* Lưu snapshot `FacultyEISScore`
* API xem lịch sử EIS và radar chart data

### Phase 2

* Recalculation policy khi dữ liệu nguồn thay đổi
* Explainability: giải thích cách ra điểm cho từng chiều
* Recommendations engine

### Phase 3

* So sánh benchmark theo khoa/bộ môn
* Dự báo xu hướng hiệu quả giảng viên

## 7. API gợi ý

Tài liệu gốc đã xác định:

* `GET /api/faculty`
* `GET /api/faculty/[id]/eis`
* `POST /api/faculty/eis/calculate`
* `GET /api/faculty/workload`. fileciteturn1file0L105-L117

Nên bổ sung thêm:

* `GET /api/faculty/[id]/profile360`
* `GET /api/faculty/[id]/workload-history`
* `GET /api/faculty/[id]/mentoring-summary`
* `GET /api/faculty/eis/compare`

## 8. RBAC gợi ý

* `FACULTY.VIEW`
* `FACULTY.MANAGE`
* `FACULTY.EIS_VIEW`
* `FACULTY.EIS_MANAGE`
* `FACULTY.WORKLOAD_VIEW`
* `FACULTY.DASHBOARD_VIEW`
* `FACULTY.EXPORT`

## 9. Rủi ro cần kiểm soát

* Dùng dữ liệu feedback không chuẩn hóa làm méo điểm `T`.
* Dữ liệu công bố từ M09 chưa sạch làm sai điểm `R`.
* Dữ liệu hoạt động Đảng/đoàn từ M03 chưa đồng bộ làm sai `S`.
* Trigger tính EIS đồng loạt gây tải nặng.
* Không có cơ chế giải thích làm EIS khó thuyết phục người dùng.

---