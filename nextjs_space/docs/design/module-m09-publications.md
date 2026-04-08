# MODULE M09 – UC-46
# QUẢN LÝ CÔNG BỐ KHOA HỌC VÀ SÁNG KIẾN

---

## 1. Mục tiêu use case

Xây dựng phân hệ quản lý toàn diện công bố khoa học và sáng kiến của Học viện Hậu cần, phục vụ:
- lưu trữ và tra cứu tập trung,
- thống kê thành tích khoa học,
- liên kết công bố với đề tài nghiên cứu,
- xuất danh mục báo cáo theo mẫu nghiệp vụ.

Phân hệ này là nguồn dữ liệu quan trọng cho:
- hồ sơ nhà khoa học,
- AI phân tích xu hướng nghiên cứu,
- kho tra cứu công trình khoa học.

---

## 2. Thông tin use case

- Mã UC: UC-46
- Trạng thái: CÓ – Hoàn thiện
- Độ phức tạp: Trung bình
- Đường dẫn: `/dashboard/research/publications/*`
- RBAC:
  - `RESEARCH.PUB_VIEW`
  - `RESEARCH.PUB_CREATE`
  - `RESEARCH.PUB_UPDATE`
  - `RESEARCH.PUB_DELETE`
  - `RESEARCH.PUB_IMPORT`
  - `RESEARCH.PUB_EXPORT`

---

## 3. Phạm vi dữ liệu công bố được quản lý

### 3.1. Bài báo quốc tế
- ISI / Scopus
- Q1–Q4
- dữ liệu đặc thù:
  - DOI
  - ISSN
  - volume
  - issue
  - citation count
  - impact factor

### 3.2. Bài báo trong nước
- theo chuẩn tính điểm HĐCGSNN
- dữ liệu:
  - tên tạp chí
  - số / tháng
  - trang
  - ISSN

### 3.3. Sách chuyên khảo / Giáo trình
- cấp Học viện / BQP
- dữ liệu:
  - ISBN
  - NXB
  - năm XB
  - số trang
  - quyết định

### 3.4. Sáng kiến kinh nghiệm
- cấp cơ sở / Học viện
- dữ liệu:
  - quyết định công nhận
  - năm
  - lĩnh vực áp dụng

### 3.5. Bằng sáng chế / Giải pháp hữu ích
- dữ liệu:
  - số bằng
  - ngày cấp
  - phạm vi bảo hộ

### 3.6. Báo cáo khoa học hội nghị / hội thảo
- trong nước / quốc tế
- dữ liệu:
  - tên hội thảo
  - ngày
  - proceeding
  - ISBN

### 3.7. Luận văn / Luận án
- thạc sĩ / tiến sĩ
- dữ liệu:
  - người hướng dẫn
  - hội đồng
  - điểm bảo vệ
  - kho lưu trữ

---

## 4. Chức năng chính

### 4.1. Quản lý danh mục công bố
- tạo mới
- cập nhật
- xóa
- xem chi tiết
- liên kết tác giả và đơn vị

### 4.2. Tra cứu kho công bố
- full-text search theo:
  - tiêu đề
  - tác giả
  - từ khóa
  - tạp chí
  - DOI
- bộ lọc đa chiều:
  - loại công bố
  - năm
  - cấp
  - đơn vị
  - PI
  - lĩnh vực
  - ISI/Scopus

### 4.3. Thống kê
- tổng số công bố
- số công bố ISI/Scopus
- H-index tập thể
- danh mục theo đơn vị / năm / lĩnh vực

### 4.4. Import / Export
- import BibTeX
- import Excel
- export theo mẫu Biểu 2 (BQP)
- export theo mẫu HĐCGSNN

### 4.5. Liên kết ngoài
- xem lịch sử trích dẫn
- liên kết DOI ra ngoài khi có

---

## 5. Data Model

### 5.1. ResearchPublication

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | khóa chính |
| title | string | yes | tiêu đề công bố |
| publicationType | PublicationType | yes | loại công bố |
| year | int | yes | năm công bố |
| authorsText | string | no | chuỗi tác giả gốc |
| doi | string | no | DOI |
| issn | string | no | ISSN |
| isbn | string | no | ISBN |
| journalName | string | no | tên tạp chí / hội thảo / NXB |
| publisher | string | no | nhà xuất bản |
| volume | string | no | tập |
| issue | string | no | số |
| pages | string | no | trang |
| citationCount | int | no | số trích dẫn |
| impactFactor | float | no | IF |
| ranking | string | no | Q1-Q4 / phân hạng |
| conferenceName | string | no | tên hội thảo |
| proceedingName | string | no | tên proceeding |
| patentNumber | string | no | số bằng sáng chế |
| patentGrantDate | DateTime | no | ngày cấp |
| decisionNumber | string | no | số quyết định |
| advisorName | string | no | người hướng dẫn |
| defenseScore | float | no | điểm bảo vệ |
| storageLocation | string | no | vị trí lưu trữ |
| abstract | string | no | tóm tắt |
| keywords | string[] | yes | từ khóa |
| unitId | string | no | đơn vị |
| ownerUserId | string | no | người kê khai chính |
| projectId | string | no | liên kết đề tài |
| createdAt | DateTime | yes | ngày tạo |
| updatedAt | DateTime | yes | ngày cập nhật |

### 5.2. PublicationAuthor
Dùng nếu cần chuẩn hóa danh sách tác giả thay vì chỉ giữ `authorsText`.

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | khóa chính |
| publicationId | string | yes | FK ResearchPublication |
| userId | string | no | FK User nếu là cán bộ nội bộ |
| authorName | string | yes | tên tác giả |
| authorOrder | int | yes | thứ tự tác giả |
| affiliation | string | no | cơ quan |
| isInternal | boolean | yes | nội bộ / ngoài |

---

## 6. Business Rules

- Một công bố phải có `title`, `publicationType`, `year`
- `doi` nếu có thì nên unique hoặc kiểm tra trùng mạnh
- Công bố ISI/Scopus phải cho phép lưu `citationCount`, `impactFactor`, `ranking`
- Luận văn / luận án phải có trường lưu người hướng dẫn, hội đồng hoặc kho lưu trữ nếu có dữ liệu
- Công bố có thể liên kết với `ResearchProject`
- Một công bố có thể có nhiều tác giả
- Hệ thống phải hỗ trợ thống kê theo đơn vị, năm, lĩnh vực

---

## 7. Validation Rules

- `title` bắt buộc
- `publicationType` phải đúng enum
- `year` hợp lệ
- `citationCount` không âm
- `impactFactor` không âm
- `authorOrder` dương
- `doi`, `issn`, `isbn` nếu có phải đúng định dạng cơ bản

---

## 8. API Contract

### 8.1. GET `/api/research/publications`
Filter:
- keyword
- publicationType
- year
- unitId
- projectId
- ranking
- page
- pageSize

### 8.2. POST `/api/research/publications`
- tạo công bố mới

### 8.3. GET `/api/research/publications/[id]`
- lấy chi tiết công bố

### 8.4. PATCH `/api/research/publications/[id]`
- cập nhật công bố

### 8.5. DELETE `/api/research/publications/[id]`
- xóa công bố

### 8.6. POST `/api/research/publications/import`
- import BibTeX / Excel

### 8.7. POST `/api/research/publications/export`
- export danh mục theo mẫu

---

## 9. UI / Pages

- `app/dashboard/research/publications/page.tsx`
- `app/dashboard/research/publications/new/page.tsx`
- `app/dashboard/research/publications/[id]/page.tsx`

Components:
- `components/research/publication/publication-table.tsx`
- `components/research/publication/publication-form.tsx`
- `components/research/publication/publication-filter-bar.tsx`
- `components/research/publication/publication-import-dialog.tsx`

---

## 10. Kiến trúc code

### API
- `app/api/research/publications/route.ts`
- `app/api/research/publications/[id]/route.ts`
- `app/api/research/publications/import/route.ts`
- `app/api/research/publications/export/route.ts`

### Service
- `lib/services/research-publication.service.ts`

### Repository
- `lib/repositories/research-publication.repo.ts`

### Validator
- `lib/validators/research-publication.schema.ts`

---

## 11. Tích hợp với các UC khác

- liên kết với UC-45 qua `projectId`
- là đầu vào chính cho UC-47 hồ sơ nhà khoa học
- là nguồn dữ liệu quan trọng cho UC-48 AI trends
- có thể dùng để kiểm tra tương đồng nội dung trong UC-49

---

## 12. Phase triển khai cho Claude

### Phase 1
- schema `ResearchPublication`
- enum `PublicationType`

### Phase 2
- validator + repository

### Phase 3
- service + CRUD API

### Phase 4
- import/export cơ bản

### Phase 5
- UI danh sách + form + filter

---

## 13. Notes for Claude

- Không giản lược phân hệ này thành chỉ “bài báo”
- Phải hỗ trợ nhiều loại công bố
- Thiết kế phải đủ rộng để hỗ trợ import/export và thống kê
- Nếu project hiện có đã có model publication tương tự, phải mapping lại trước khi tạo mới