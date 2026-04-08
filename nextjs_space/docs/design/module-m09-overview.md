# MODULE M09 – NGHIÊN CỨU KHOA HỌC
## Quản lý toàn diện vòng đời công trình khoa học

---

## 1. Mục đích và phạm vi

### 1.1. Mục tiêu tổng thể
Module M09 xây dựng hệ thống quản lý toàn diện vòng đời công trình khoa học tại Học viện Hậu cần, từ giai đoạn đề xuất ý tưởng đến lưu trữ vào kho tra cứu mở nội bộ. Module tích hợp chặt chẽ với master data sẵn có của hệ thống và kết nối liên thông với CSDL Khoa học Quân sự cấp Bộ Quốc phòng.

### 1.2. Thông tin định danh
- Mã module: M09
- Tên đầy đủ: CSDL Nghiên cứu Khoa học – Quản lý vòng đời công trình khoa học
- Phiên bản thiết kế: v1.0/2026
- Đường dẫn chính: `/dashboard/research/*`
- RBAC prefix: `RESEARCH.*`
- Tác nhân chính:
  - Nhà khoa học
  - Phòng KHQS
  - BGĐ Học viện
  - Hội đồng Khoa học
  - Admin hệ thống

### 1.3. Định hướng triển khai
M09 không phải là một module CRUD đơn lẻ. Đây là phân hệ nghiên cứu khoa học có:
- workflow nhiều bước
- milestone và review
- quản lý công bố và sáng kiến
- hồ sơ nhà khoa học
- AI duplicate detection
- AI trend analytics
- kho tra cứu nội bộ
- liên thông dữ liệu với BQP

---

## 2. Phạm vi chức năng – 5 Use Cases

### UC-45. Quản lý đề tài NCKH toàn trình
- Quản lý đề tài từ đăng ký đến lưu trữ
- Workflow phê duyệt
- Milestone tracker
- Review và nghiệm thu
- Dashboard tiến độ và kinh phí

### UC-46. Quản lý công bố khoa học và sáng kiến
- Bài báo quốc tế
- Bài báo trong nước
- Sách chuyên khảo
- Giáo trình
- Sáng kiến
- Patent
- Báo cáo khoa học
- Luận văn / luận án

### UC-47. Hồ sơ nhà khoa học
- Hồ sơ 360 độ
- Chức danh, học hàm, học vị
- Chuyên ngành, từ khóa nghiên cứu
- Công bố, đề tài, thành tích
- H-index, i10-index, citation count
- năng lực nghiên cứu và gợi ý tham gia đề tài

### UC-48. AI phân tích xu hướng nghiên cứu
- Phân cụm chủ đề nghiên cứu
- Phân tích xu hướng theo thời gian
- Gap analysis
- Gợi ý nhà khoa học phù hợp
- Gợi ý tài liệu tham khảo
- Dự báo ngân sách nghiên cứu

### UC-49. AI phát hiện trùng lặp đề tài
- Embedding title + abstract
- Similarity search
- BM25 / full-text hỗ trợ
- Ensemble scoring
- Cảnh báo nguy cơ trùng lặp

---

## 3. Vòng đời công trình khoa học (Research Lifecycle)

Mỗi công trình khoa học trong M09 được theo dõi theo 7 giai đoạn chuẩn:

1. Đề xuất và đăng ký
2. Thẩm định và phê duyệt
3. Ký hợp đồng
4. Thực hiện và báo cáo tiến độ
5. Nghiệm thu
6. Công bố và ứng dụng
7. Lưu trữ và tra cứu

### Ý nghĩa thiết kế
- Mọi entity lõi trong M09 phải hỗ trợ lifecycle
- Các use case con không được phá vỡ lifecycle này
- UC-45 là hạt nhân vận hành workflow 7 bước
- UC-46, UC-47, UC-48, UC-49 là các nhánh tích hợp xoay quanh UC-45

---

## 4. Kiến trúc dữ liệu

### 4.1. Master data kế thừa từ hệ thống hiện có
Module M09 phải tái sử dụng dữ liệu nền từ các bảng hoặc model đang có, không tạo lại dữ liệu nền nếu hệ thống đã có:
- `User`
- `FacultyProfile`
- `ScientificProfile`
- `Unit`
- `SystemConfig`

### 4.2. Các bảng mới của M09
M09 bổ sung các entity chính sau:
- `ResearchProject`
- `ResearchMember`
- `ResearchPublication`
- `ScientistProfile`
- `ResearchMilestone`
- `ResearchReview`

### 4.3. Quan hệ logic
- Một `ResearchProject` có nhiều `ResearchMember`
- Một `ResearchProject` có nhiều `ResearchMilestone`
- Một `ResearchProject` có nhiều `ResearchReview`
- Một `ResearchProject` có thể gắn với nhiều `ResearchPublication`
- Một `ScientistProfile` mở rộng hồ sơ khoa học của một `User`
- Một `ResearchMember` liên kết `User` với `ResearchProject` theo vai trò

---

## 5. Các enum nghiệp vụ cốt lõi

### 5.1. ProjectStatus
- DRAFT
- SUBMITTED
- UNDER_REVIEW
- APPROVED
- REJECTED
- IN_PROGRESS
- PAUSED
- COMPLETED
- CANCELLED

### 5.2. ProjectPhase
- PROPOSAL
- CONTRACT
- EXECUTION
- MIDTERM_REVIEW
- FINAL_REVIEW
- ACCEPTED
- ARCHIVED

### 5.3. ResearchCategory
- CAP_HOC_VIEN
- CAP_TONG_CUC
- CAP_BO_QUOC_PHONG
- CAP_NHA_NUOC
- SANG_KIEN_CO_SO

### 5.4. ResearchType
- CO_BAN
- UNG_DUNG
- TRIEN_KHAI
- SANG_KIEN_KINH_NGHIEM

### 5.5. PublicationType
- BAI_BAO_QUOC_TE
- BAI_BAO_TRONG_NUOC
- SACH_CHUYEN_KHAO
- GIAO_TRINH
- SANG_KIEN
- PATENT
- BAO_CAO_KH
- LUAN_VAN
- LUAN_AN

### 5.6. MemberRole
- CHU_NHIEM
- THU_KY_KHOA_HOC
- THANH_VIEN_CHINH
- CONG_TAC_VIEN

### 5.7. ReviewType
- THAM_DINH_DE_CUONG
- KIEM_TRA_GIUA_KY
- NGHIEM_THU_CO_SO
- NGHIEM_THU_CAP_HV
- NGHIEM_THU_CAP_TREN

### 5.8. ResearchField
- HOC_THUAT_QUAN_SU
- HAU_CAN_KY_THUAT
- KHOA_HOC_XA_HOI
- KHOA_HOC_TU_NHIEN
- CNTT
- Y_DUOC
- KHAC

---

## 6. Kiến trúc phân hệ

### 6.1. Subsystem 1 – Research Projects
- Quản lý toàn trình đề tài
- Tạo, cập nhật, theo dõi tiến độ
- Workflow phê duyệt
- Milestone tracker
- Review và nghiệm thu
- Timeline / Gantt

### 6.2. Subsystem 2 – Publications
- Quản lý công bố khoa học
- Liên kết công bố với đề tài
- Import / export dữ liệu công bố
- Full-text search

### 6.3. Subsystem 3 – Scientist Profiles
- Hồ sơ nhà khoa học
- Chỉ số khoa học
- Hướng nghiên cứu
- Thành tích, giải thưởng, sáng chế

### 6.4. Subsystem 4 – AI Analytics
- Trend clustering
- Time-series analytics
- Gap analysis
- Recommendation
- Budget forecasting

### 6.5. Subsystem 5 – Duplicate Detection
- Similarity engine
- Duplicate scoring
- Risk banding
- cảnh báo trùng lặp trước khi phê duyệt đề tài

---

## 7. Kho tra cứu công trình khoa học

### 7.1. Mục tiêu
Tạo kho tra cứu thống nhất cho toàn bộ tài sản trí tuệ và sản phẩm nghiên cứu của Học viện.

### 7.2. Kiến trúc kỹ thuật định hướng
- Storage: MinIO
- Full-text index: PostgreSQL + ClickHouse
- Vector search: pgvector hoặc ClickHouse vector
- Cache: Redis
- API: Next.js API Routes
- Dashboard / charts: React + Apache Superset

### 7.3. Tính năng kho tra cứu
- Search-as-you-type
- Hỗ trợ tiếng Việt có dấu / không dấu
- Semantic search toggle
- Faceted filters
- Card/List/Table view
- Export CSV/Excel/BibTeX/EndNote
- QR code và lịch sử truy cập

---

## 8. RBAC

### 8.1. Nguyên tắc
Mọi chức năng của M09 phải gắn với mã quyền `RESEARCH.*`

### 8.2. Nhóm quyền chính
- Search / View / Download
- Project Create / Update / Delete / Approve / Review / Milestone
- Publication Create / Import / Export
- Scientist View / Update
- AI View / Use
- Dashboard / Export
- Sync BQP / Config

### 8.3. Scope dữ liệu
Thiết kế phải chừa khả năng kiểm soát phạm vi:
- SELF
- UNIT
- toàn Học viện
- ADMIN

---

## 9. Liên thông dữ liệu với Bộ Quốc phòng

### 9.1. Đồng bộ 2 chiều
- BQP → HVHC:
  - import đề tài cấp BQP / Nhà nước
  - import mã đề tài, PI, kinh phí, tiến độ
- HVHC → BQP:
  - push kết quả nghiệm thu
  - push công bố định kỳ
  - push báo cáo trùng lặp
  - đồng bộ hồ sơ nhà khoa học

### 9.2. Quy tắc đồng bộ
- Đề tài cấp BQP/Nhà nước: import hàng tháng
- Kết quả nghiệm thu đề tài cấp HV: push sau quyết định nghiệm thu chính thức
- Danh mục công bố ISI/Scopus: batch hàng quý
- Hồ sơ nhà khoa học: sync hàng tuần
- Báo cáo đề tài trùng lặp: báo cáo định kỳ

### 9.3. Kiến trúc kỹ thuật
- Cron job / Airflow DAG
- BQP API Gateway
- Audit log cho mọi phiên sync
- Mapping format chuẩn trước khi gửi

---

## 10. API toàn module

### 10.1. Research Projects
- `GET /api/research/projects`
- `POST /api/research/projects`
- `GET /api/research/projects/[id]`
- `PATCH /api/research/projects/[id]`
- `POST /api/research/projects/[id]/approve`
- `POST /api/research/projects/[id]/review`

### 10.2. Repository Search
- `GET /api/research/repository/search`
- `GET /api/research/repository/[id]`

### 10.3. Publications
- `GET /api/research/publications`
- `POST /api/research/publications`

### 10.4. Scientists
- `GET /api/research/scientists/[id]`

### 10.5. AI
- `GET /api/research/ai/trends`
- `POST /api/research/ai/duplicate-check`

### 10.6. Dashboard / Export
- `GET /api/research/dashboard/stats`
- `POST /api/research/export`

---

## 11. Roadmap triển khai

- Sprint 1: UC-45 – Research Projects, workflow phê duyệt, milestone tracker
- Sprint 2: UC-46 – Publications
- Sprint 3: UC-47 – Scientist Profiles
- Sprint 4: UC-49 – Duplicate Detection
- Sprint 5: UC-48 – AI Trends
- Sprint 6: RBAC hoàn chỉnh, sync BQP, kiểm thử tích hợp
- UAT: tuần 8, nghiệm thu với Phòng KHQS

---

## 12. Tiêu chí kiểm thử

### Functional
- Happy path toàn trình đề tài: Đăng ký → Phê duyệt → Thực hiện → Nghiệm thu
- Mục tiêu: tỷ lệ pass cao và ổn định

### RBAC
- Nhà khoa học không truy cập được đề tài ngoài scope cho phép
- Không rò rỉ dữ liệu đơn vị khác

### AI Duplicate
- Bộ dữ liệu kiểm thử có nhãn
- Precision và Recall đạt ngưỡng thiết kế

### Performance
- Search trên tập dữ liệu lớn
- p95 response phù hợp yêu cầu

### Integration
- Sync BQP 100 bản ghi thử nghiệm
- phản hồi mã đề tài đúng

### File Upload
- Upload file PDF dung lượng lớn vào MinIO
- Signed URL có hạn truy cập

---

## 13. Seed Data

Để demo và kiểm thử:
- 50 đề tài NCKH
- 300 công bố khoa học
- 30 hồ sơ nhà khoa học
- 20 phiên nghiệm thu
- 10 cặp / nhóm dữ liệu tương đồng để test AI duplicate detection

---

## 14. Điều kiện tiên quyết
- RBAC nền đã có cơ chế scope
- MinIO đã cấu hình
- AI Engine đã triển khai hoặc có stub service
- ClickHouse sẵn sàng nếu triển khai analytics
- Có dữ liệu lịch sử để seed
- Người dùng nghiệp vụ đã thống nhất workflow

---

## 15. Kiến trúc code cho project hiện tại

### 15.1. Project conventions
Project hiện tại dùng:
- `app/`
- `components/`
- `lib/`
- `prisma/`
- `docs/`

Project hiện tại không dùng `src/`.

### 15.2. Mapping chuẩn
- API routes: `app/api/research/**`
- UI pages: `app/dashboard/research/**`
- Components: `components/research/**`
- Services: `lib/services/**`
- Repositories: `lib/repositories/**`
- Validators: `lib/validators/**`
- Prisma schema: `prisma/schema.prisma`

---

## 16. Nguyên tắc cho Claude

- Đây là file overview toàn M09
- Không được code cả M09 từ một lần
- Khi triển khai phải đọc file này trước
- Sau đó mới đọc file design use case cụ thể
- Sprint 1 chỉ tập trung UC-45 nhưng vẫn phải giữ:
  - enums
  - lifecycle
  - RBAC
  - hướng tích hợp AI
  - hướng tích hợp BQP