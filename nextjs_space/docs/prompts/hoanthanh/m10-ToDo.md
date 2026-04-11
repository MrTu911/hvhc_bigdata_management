Tóm tắt M10 – CSDL Giáo dục Đào tạo
1. Vai trò của M10 trong toàn hệ thống
M10 là hệ thống quản trị đào tạo cấp học viện — không phải LMS. Nó thay thế và nâng cấp phân hệ đào tạo LAN cũ, phục vụ 4 hệ đào tạo: đại học chính quy, liên thông, sau đại học (ThS/TS), bồi dưỡng ngắn hạn.

Trong bản đồ hệ thống, M10 thuộc Tầng C – module nghiệp vụ lõi (cùng M03, M05, M09), ưu tiên 3. Nó tiêu thụ dịch vụ của M01, M02, M13, M18, M19 và có đầu ra phản hồi lại M09, M05.

2. 12 Use Cases
#	UC	Tên
1	UC-51	Quản lý hồ sơ người học toàn trình
2	UC-52	Quản lý chương trình đào tạo & khung học phần
3	UC-53	Quản lý kế hoạch đào tạo học kỳ / năm học
4	UC-54	Quản lý lớp học phần, lịch học, phân công giảng viên
5	UC-55	Quản lý điểm danh và chuyên cần
6	UC-56	Quản lý điểm và kết quả học phần
7	UC-57	Academic Warning Engine – cảnh báo học vụ
8	UC-58	Quản lý rèn luyện, khen thưởng, kỷ luật người học
9	UC-59	Quản lý khóa luận / luận văn / đồ án
10	UC-60	Graduation Rule Engine – xét tốt nghiệp & văn bằng
11	UC-61	Kho tra cứu học vụ & hồ sơ đào tạo
12	UC-62	Dashboard điều hành giáo dục đào tạo + AI
3. Hai vòng đời song song
Vòng đời người học (UC-51, 55–60):

tuyển vào → phân lớp → đăng ký học → chuyên cần/điểm → cảnh báo → rèn luyện → khóa luận → xét tốt nghiệp → cấp văn bằng → lưu hồ sơ

Vòng đời chương trình đào tạo (UC-52, 53, 54):

thiết kế CTĐT → version hóa → xây khung học phần → lập kế hoạch → mở lớp → phân công giảng viên → đánh giá & điều chỉnh

Hai vòng đời này chạy song song và phụ thuộc nhau: người học phải gắn với một ProgramVersion cụ thể; khi CTĐT thay đổi, phiên bản cũ vẫn phải tồn tại để bảo vệ dữ liệu của khóa đang học.

4. 7 Rủi ro bắt buộc phải kiểm soát
#	Rủi ro	Hậu quả nếu bỏ qua
1	Không version hóa ProgramVersion	Vỡ dữ liệu khi áp dụng CTĐT mới
2	Thiếu ScoreHistory / audit trail điểm	Vi phạm quy chế, tranh chấp điểm
3	Gộp master data vào M10 thay vì dùng M19	Duplicate, không dùng chung được
4	Conflict engine xếp lịch chậm	UX kém, trải nghiệm tắc nghẽn
5	Graduation engine sai rule	Cấp bằng sai người / bỏ sót người đủ điều kiện
6	Migration dữ liệu LAN không có ETL DRY_RUN	Mất lịch sử toàn bộ dữ liệu cũ
7	Thiếu RBAC scope	Lộ điểm, lộ dữ liệu lớp khác đơn vị
5. Phụ thuộc vào các module nền
Module	M10 dùng để làm gì
M01	Auth, RBAC EDU.*, scope dữ liệu, audit log điểm/hồ sơ/tốt nghiệp
M02	Giảng viên, cán bộ quản lý đào tạo, đơn vị, học vị/học hàm
M13	Workflow: bảo lưu/thôi học, xét tốt nghiệp, phê duyệt điểm, cấp chứng chỉ, phúc khảo
M18	Export: bảng điểm, quyết định, chứng chỉ, văn bằng, báo cáo đào tạo
M19	Lookup: năm học/học kỳ (MD_ACADEMIC_YEAR), hình thức đào tạo, chuyên ngành, học vị/học hàm
M09	Đầu ra: khóa luận/luận án của sau đại học phản hồi sang hồ sơ khoa học
M05	Đầu ra: kết quả rèn luyện, khen thưởng, kỷ luật người học có thể phản hồi sang hồ sơ chính sách
6. Thứ tự phase triển khai hợp lý

Phase 0 (tiên quyết – phải xong trước)
  └── M01 (auth/RBAC/scope)
  └── M19 (năm học, chuyên ngành, hình thức đào tạo, học vị/học hàm)
  └── M02 (giảng viên, cán bộ, đơn vị)

Phase 1 – Nền dữ liệu & cấu trúc đào tạo
  UC-51  Hồ sơ người học
  UC-52  Chương trình đào tạo + ProgramVersion ← bắt buộc trước go-live
  UC-53  Kế hoạch năm học / học kỳ
  UC-54  Lớp học phần, lịch học, phân công giảng viên

Phase 2 – Vận hành học tập
  UC-55  Điểm danh / chuyên cần
  UC-56  Điểm + ScoreHistory ← bắt buộc
  UC-57  Academic Warning Engine
  UC-58  Rèn luyện, khen thưởng, kỷ luật người học

Phase 3 – Tốt nghiệp, kho học vụ, dashboard
  UC-59  Khóa luận / luận văn / đồ án
  UC-60  Graduation Rule Engine ← rủi ro cao nhất, tách service riêng
  UC-61  Kho tra cứu học vụ
  UC-62  Dashboard điều hành + AI

Integration layer (song song từ Phase 2 trở đi)
  M13    Workflow: bảo lưu, phê duyệt điểm, xét tốt nghiệp
  M18    Export: bảng điểm, chứng chỉ, văn bằng
Điểm then chốt: ProgramVersion và ScoreHistory phải có từ Phase 1 — thiếu hai model này thì toàn bộ Phase 2–3 không an toàn.

