## 2) `docs/design/module-m11-role-dashboards.md`

# Module M11 – Dashboard theo Role

## 1. Mục tiêu

Tài liệu này mô tả cấu trúc dashboard theo từng nhóm role chính. Theo tài liệu gốc, mỗi role có dashboard riêng với bộ KPI và widget chính khác nhau. fileciteturn2file0L19-L31

## 2. Executive Dashboard

Dành cho Ban Giám đốc Học viện. Tài liệu gốc xác định các KPI/widget chính gồm:

* Tổng cán bộ/học viên
* Tỷ lệ tốt nghiệp đúng hạn
* Top đơn vị khen thưởng/thi đua
* Số đề tài nghiên cứu khoa học
* Ngân sách thực hiện
* Cảnh báo tổng hợp. fileciteturn2file0L19-L31

### Mục tiêu

* Cung cấp bức tranh điều hành toàn cục.
* Hiển thị rủi ro nổi bật và cảnh báo cần xử lý sớm.
* Cho phép drill-down theo khối đào tạo, nhân sự, nghiên cứu, chính sách, workflow.

## 3. Department Dashboard

Dành cho Trưởng phòng/khoa. Tài liệu gốc xác định các KPI chính:

* Cán bộ đơn vị mình
* Tình trạng giảng viên – học viên
* Kết quả thi đua
* So sánh các kỳ
* Workflow đang chờ duyệt. fileciteturn2file0L19-L31

### Mục tiêu

* Quản trị đơn vị theo phạm vi quản lý.
* Theo dõi biến động trong đơn vị.
* Kiểm soát các hồ sơ, workflow và KPI theo kỳ.

## 4. Education Dashboard

Dành cho Phòng Đào tạo. Tài liệu gốc nêu các KPI:

* Lớp học phần đang mở
* Tỷ lệ đạt/trượt
* Cảnh báo học vụ
* Danh sách xét tốt nghiệp. fileciteturn2file0L19-L31

### Mục tiêu

* Theo dõi vận hành đào tạo theo thời gian thực gần-thực.
* Hỗ trợ xử lý cảnh báo học vụ và xét tốt nghiệp.
* Liên kết sâu với M10 và M07.

## 5. Party Dashboard

Dành cho Phòng Chính trị. Tài liệu gốc nêu:

* Số đảng viên
* Phân loại chất lượng
* Nợ đảng phí
* Kỷ luật sắp xóa án. fileciteturn2file0L19-L31

### Mục tiêu

* Theo dõi tổ chức đảng và các cảnh báo chính trị-tổ chức.
* Liên kết dữ liệu với M03.

## 6. Faculty Dashboard

Dành cho giảng viên. Tài liệu gốc nêu:

* Lịch dạy tuần
* Lớp phụ trách
* EIS Score cá nhân
* Đề tài nghiên cứu khoa học đang làm. fileciteturn2file0L19-L31

### Mục tiêu

* Giúp giảng viên nắm lịch dạy, tải giảng, hiệu quả cá nhân, nghiên cứu và công việc cần xử lý.
* Liên thông trực tiếp với M07, M09, M10, M13.

## 7. Student Dashboard

Dành cho học viên/sinh viên. Tài liệu gốc nêu:

* Lịch học
* Điểm từng môn
* GPA hiện tại
* Thông báo từ hệ thống. fileciteturn2file0L19-L31

### Mục tiêu

* Cho người học một điểm truy cập duy nhất vào tiến độ học tập và thông tin quan trọng.
* Liên thông trực tiếp với M10, M07, M13.

## 8. Nguyên tắc phân quyền

1. Role template quyết định dashboard mặc định.
2. Scope từ M01 quyết định phạm vi dữ liệu.
3. Widget chỉ hiển thị nếu người dùng có đủ quyền với module nguồn.
4. Drill-down chỉ mở nếu có quyền xem dữ liệu chi tiết.

## 9. API gợi ý

* `GET /api/dashboard/me`
* `GET /api/dashboard/role-template`
* `GET /api/dashboard/summary`
* `GET /api/dashboard/widgets/:widgetKey/data`
* `POST /api/dashboard/layout/save`
* `POST /api/dashboard/layout/reset`

## 10. Rủi ro cần kiểm soát

* Một role có nhiều nhiệm vụ chồng lấn nhưng dashboard mặc định quá cứng.
* Role đúng nhưng scope sai làm lộ dữ liệu của đơn vị khác.
* Dashboard cá nhân hóa quá mức làm mất tính chuẩn điều hành.

---