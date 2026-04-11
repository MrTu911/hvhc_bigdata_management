Được. Dưới đây là **toàn bộ file chuẩn** để anh đặt vào:

```text
docs/prompts/m09-prompts.md
```

Anh chỉ cần copy nguyên khối này vào file, sau đó dùng trực tiếp trong VS Code với Claude.

---

````md
# M09 PROMPTS – BỘ PROMPT CHUẨN TRIỂN KHAI MODULE NGHIÊN CỨU KHOA HỌC

Tài liệu này dùng để copy-paste trực tiếp vào Claude trong VS Code khi triển khai Module M09.

---

# 1. PROMPT MỞ ĐẦU TOÀN MODULE M09

## 1.1. Đọc overview toàn module

```text
Đọc docs/design/module-m09-overview.md.

Chưa code.

Hãy tóm tắt thật rõ:
1. Mục tiêu tổng thể của Module M09
2. 5 use case UC-45 đến UC-49
3. 7 giai đoạn lifecycle của công trình khoa học
4. Các entity chính và các enum nghiệp vụ
5. Kiến trúc code cần dùng trong project hiện tại
6. Roadmap triển khai theo sprint
7. Các điểm bắt buộc phải giữ khi code để không làm sai thiết kế M09

Lưu ý:
- Project dùng app/, không dùng src/
- Không được giản lược M09 thành CRUD đơn giản
````

## 1.2. Phân tích kiến trúc M09

```text
Đọc docs/design/module-m09-overview.md.

Chưa code.

Hãy phân tích theo góc nhìn technical architect:
1. Kiến trúc dữ liệu
2. Kiến trúc phân hệ
3. Quan hệ giữa UC-45, UC-46, UC-47, UC-48, UC-49
4. Điểm nào cần làm trước
5. Điểm nào nên chừa abstraction để làm sau
6. Những rủi ro kiến trúc nếu code sai thứ tự
```

## 1.3. Chuyển M09 thành backlog kỹ thuật

```text
Đọc docs/design/module-m09-overview.md.

Chưa code.

Hãy chuyển thiết kế M09 thành backlog kỹ thuật:
- chia theo sprint
- chia theo phase
- nêu file chính dự kiến của từng use case
- nêu phụ thuộc giữa các use case
- nêu thứ tự ưu tiên hợp lý cho project hiện tại
```

---

# 2. PROMPT CHO UC-45 – RESEARCH PROJECTS

## 2.1. Prompt mở đầu UC-45

```text
/implement-from-design

Đọc docs/design/module-m09-overview.md và docs/design/module-m09-research-projects.md.

Chưa code.

Hãy:
1. Tóm tắt UC-45
2. Mapping UC-45 sang codebase hiện tại
3. Liệt kê file cần tạo và file cần sửa
4. Chỉ ra entity nào cần có trong Prisma
5. Chỉ ra workflow nào cần encode trong service
6. Chia phase triển khai sprint 1 thật hợp lý

Lưu ý:
- Không giản lược UC-45 thành CRUD đơn thuần
- Phải giữ lifecycle, phase, status, milestone, review
```

## 2.2. Phase 1 schema UC-45

```text
/m09-phase1-schema

Đọc docs/design/module-m09-overview.md và docs/design/module-m09-research-projects.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- cập nhật prisma/schema.prisma
- thêm enums cần thiết cho UC-45
- thêm model:
  - ResearchProject
  - ResearchMember
  - ResearchMilestone
  - ResearchReview
- mapping relation với User, Unit hoặc model sẵn có nếu xác định được
- nếu chưa chắc relation thì nêu giả định rõ ràng

Không làm API.
Không làm UI.
Không làm service.

Sau khi xong:
1. liệt kê enums đã thêm
2. liệt kê models đã thêm
3. nêu relation đã mapping
4. nêu rủi ro kỹ thuật còn lại
5. đưa lệnh prisma tiếp theo
```

## 2.3. Phase 2 validator + repository UC-45

```text
Đọc docs/design/module-m09-research-projects.md.

Triển khai Phase 2.

Yêu cầu:
- tạo validator cho ResearchProject, ResearchReview, ResearchMilestone
- tạo repository cho:
  - research-project
  - research-review
  - research-milestone
- repository chỉ làm data access
- chưa làm workflow logic

Không làm API.
Không làm UI.

Sau khi xong:
- liệt kê file đã tạo
- tóm tắt function của từng repo
- nêu phần nào còn chờ service layer xử lý
```

## 2.4. Phase 3 service + workflow UC-45

```text
Đọc docs/design/module-m09-research-projects.md.

Triển khai Phase 3.

Yêu cầu:
- tạo service layer cho UC-45
- encode các business rules chính:
  - projectCode unique
  - principalInvestigatorId bắt buộc
  - unitId bắt buộc
  - budget không âm
  - delete chỉ cho status = DRAFT
  - status flow không được nhảy bừa
  - review quyết định ảnh hưởng đến phase/status
- tách logic rõ giữa project service, review service, milestone service

Chưa làm UI.
Chưa làm API.

Sau khi xong:
- liệt kê các hàm service đã có
- nêu workflow nào đã được encode
- nêu phần nào còn lại cho API/UI
```

## 2.5. Phase 4 API UC-45

```text
Đọc docs/design/module-m09-research-projects.md.

Triển khai Phase 4.

Yêu cầu:
- tạo các route:
  - app/api/research/projects/route.ts
  - app/api/research/projects/[id]/route.ts
  - app/api/research/projects/[id]/approve/route.ts
  - app/api/research/projects/[id]/review/route.ts
  - app/api/research/dashboard/stats/route.ts
  - app/api/research/export/route.ts
- route chỉ parse request, gọi service, trả response
- response chuẩn: { success, data, error }
- không đặt business logic trong route

Sau khi xong:
- liệt kê endpoint đã có
- nêu request/response chính
- nêu chỗ nào cần RBAC stub hoặc hook vào auth hiện tại
```

## 2.6. Phase 5 UI UC-45

## 2.6. Phase 5 UI UC-45

```text
Đọc docs/design/module-m09-research-projects.md.

Triển khai Phase 5.

Yêu cầu:
- tạo UI cho:
- danh sách đề tài
- form wizard tạo mới
- trang chi tiết
- form review
- giữ UI gọn nhưng đúng tinh thần thiết kế, nâng cấp hoàn thiện giao diện đang có luôn bảo đảm UX tốt.
- chia component rõ:
- table
- wizard
- detail tabs
- review form

Sau khi xong:
- mô tả luồng màn hình
- liệt kê file UI
- nêu phần nào là bản tối thiểu, phần nào chừa cho phase sau

```

## 2.7. Review UC-45

```text
/review-m09

Hãy review phần code UC-45 hiện có so với:
- docs/design/module-m09-overview.md
- docs/design/module-m09-research-projects.md

Output:
1. lỗi nghiêm trọng
2. phần thiếu so với thiết kế
3. phần lệch kiến trúc
4. rủi ro production
5. thứ tự sửa ưu tiên
```
5. Thứ tự sửa ưu tiên

P0 – Trước khi merge/deploy:
  1. Xóa workflow/route.ts (hoặc rewrite → dùng nckhProjectService)
  2. Fix addMember: parsed.data → parsed.error.errors[0].message
  3. Fix updateProject guard: && → chỉ check status

P1 – Sprint này:
  4. Fix SoD logic: xóa điều kiện project.rejectedBy === null
     Thêm field submittedBy vào NckhProject schema
  5. Thêm member management routes (POST/DELETE)
  6. Guard COMPLETE transition: chỉ cho phép sau khi có review PASSED

P2 – Sprint tiếp theo:
  7. Thêm audit log vào transition()
  8. UI milestones tab: gọi dedicated endpoint để sync OVERDUE
  9. UI: thêm ENTER_MIDTERM_REVIEW / ENTER_FINAL_REVIEW buttons
  10. getDashboardStats: accept ScopedQueryOptions, filter theo scope
  11. Expose getProgress endpoint

---

# 3. PROMPT CHO UC-46 – PUBLICATIONS

## 3.1. Prompt mở đầu UC-46

```text
/implement-from-design

Đọc docs/design/module-m09-overview.md và docs/design/module-m09-publications.md.

Chưa code.

Hãy:
1. Tóm tắt UC-46
2. Liệt kê các loại công bố phải hỗ trợ
3. Mapping sang codebase hiện tại
4. Liệt kê file cần tạo/sửa
5. Chia phase triển khai hợp lý
```

## 3.2. Phase 1 schema UC-46

```text
Đọc docs/design/module-m09-publications.md.

Triển khai Phase 1.

Yêu cầu:
- cập nhật prisma/schema.prisma
- thêm enum PublicationType nếu chưa có
- thêm model ResearchPublication
- nếu cần, thêm model PublicationAuthor
- chừa chỗ liên kết với ResearchProject và User

Không làm API, UI, service.

Sau khi xong:
- liệt kê schema đã thêm
- nêu relation với project và scientist
- nêu giả định kỹ thuật
```

## 3.3. Phase 2 CRUD + search UC-46

```text
Đọc docs/design/module-m09-publications.md.

Triển khai Phase 2.

Yêu cầu:
- tạo validator
- tạo repository
- tạo service CRUD
- tạo API CRUD cơ bản
- hỗ trợ filter:
  - publicationType
  - year
  - unitId
  - projectId
  - ranking
  - keyword
- hỗ trợ pagination

Chưa làm import/export.

Sau khi xong:
- liệt kê endpoint
- nêu các filter đang hỗ trợ
- nêu phần import/export để phase sau
```

## 3.4. Phase 3 import/export UC-46

```text
Đọc docs/design/module-m09-publications.md.

Triển khai Phase 3.

Yêu cầu:
- scaffold import BibTeX / Excel
- scaffold export theo mẫu báo cáo
- nếu chưa có parser hoàn chỉnh, tạo abstraction rõ ràng
- route import/export phải rõ ràng và dễ mở rộng

Sau khi xong:
- liệt kê file đã tạo
- nêu phần nào là stub
- nêu phần nào production-ready
```

## 3.5. Review UC-46

```text
/review-m09

Hãy review code UC-46 so với docs/design/module-m09-publications.md.

Kiểm tra:
- có đủ loại công bố không
- search/filter có đúng thiết kế không
- import/export có để đúng kiến trúc không
- có liên kết project/scientist chưa
```

---

# 4. PROMPT CHO UC-47 – SCIENTISTS

## 4.1. Prompt mở đầu UC-47

```text
/implement-from-design

Đọc docs/design/module-m09-overview.md và docs/design/module-m09-scientists.md.

Chưa code.

Hãy:
1. Tóm tắt UC-47
2. Chỉ ra phần nào phải tái sử dụng từ User, FacultyProfile, ScientificProfile
3. Liệt kê file cần tạo/sửa
4. Chia phase triển khai
5. Nêu rõ cách xây bản đồ năng lực nghiên cứu ở mức phase đầu
```

## 4.2. Phase 1 profile schema UC-47

```text
Đọc docs/design/module-m09-scientists.md.

Triển khai Phase 1.

Yêu cầu:
- cập nhật schema cho ScientistProfile
- không tạo trùng dữ liệu nếu User, FacultyProfile hoặc ScientificProfile đã có
- nếu có model tương tự trong schema hiện tại, hãy đề xuất merge hoặc extension thay vì tạo mới mù quáng

Sau khi xong:
- nêu mapping với model có sẵn
- nêu field nào là nguồn gốc
- nêu field nào là dữ liệu tổng hợp
```

## 4.3. Phase 2 service tổng hợp hồ sơ UC-47

```text
Đọc docs/design/module-m09-scientists.md.

Triển khai Phase 2.

Yêu cầu:
- tạo service tổng hợp hồ sơ nhà khoa học từ:
  - User
  - project data
  - publication data
  - profile data hiện có
- tính các chỉ số cơ bản:
  - publicationCount
  - projectLeadCount
  - projectMemberCount
- chừa hook cho hIndex, i10Index, citationCount nếu chưa có nguồn chuẩn

Chưa làm UI.

Sau khi xong:
- liệt kê các hàm service
- nêu chỗ nào là computed field
- nêu chỗ nào cần batch refresh
```

## 4.4. Phase 3 API + capacity map UC-47

```text
Đọc docs/design/module-m09-scientists.md.

Triển khai Phase 3.

Yêu cầu:
- tạo API:
  - GET list scientists
  - GET scientist detail
  - PATCH scientist profile
  - GET capacity-map
- capacity-map cần trả dữ liệu tổng hợp theo:
  - unit
  - research field
  - academic rank
  - degree

Sau khi xong:
- nêu JSON shape cho capacity-map
- nêu cách UI có thể dùng dữ liệu này
```

## 4.5. Phase 4 UI UC-47

```text
Đọc docs/design/module-m09-scientists.md.

Triển khai Phase 4.

Yêu cầu:
- tạo UI:
  - danh sách nhà khoa học
  - profile detail
  - metrics card
  - capacity map page
- UI phải thể hiện đúng tính chất hồ sơ khoa học, không chỉ là hồ sơ nhân sự

Sau khi xong:
- liệt kê file UI
- nêu phần nào có thể nâng cấp tiếp bằng charts hoặc graphs
```

## 4.6. Review UC-47

```text
/review-m09

Hãy review code UC-47 theo docs/design/module-m09-scientists.md.

Kiểm tra:
- có tái sử dụng đúng User / FacultyProfile / ScientificProfile chưa
- hồ sơ có đủ chiều khoa học chưa
- capacity map có đúng tinh thần use case không
- có phần nào vẫn giống hồ sơ nhân sự thuần túy cần sửa lại không
```
5. Đề xuất ưu tiên sửa

Ưu tiên 1 — Ngay trước production:

Gọi scientistProfileService.computeStats(data.authorId) trong nckh-publication.service.createPublication() và deletePublication() (2 chỗ, 2 dòng).
Tạo POST /api/research/scientists/[id]/compute-stats route (trigger thủ công cho admin).
Bật Promise.allSettled trong batchRefreshStats (đổi loop thành parallel).

Ưu tiên 2 — Hoàn thiện UC-47:

Thêm scientificProfile vào findByUserId select, hiển thị summary fallback trong detail page.
Sửa syncFromFacultyProfile — xóa dynamic import, dùng repo method thay thế.

Ưu tiên 3 — Chưa khẩn:

Export endpoint (defer nếu chưa cần báo cáo).
Edit page /scientists/[id]/edit.
Document rõ SELF scope behavior trong capacity-map.
Tóm lại: Kiến trúc đúng tinh thần UC-47 — không CRUD đơn giản, có 360° profile, có capacity map, tái sử dụng FacultyProfile. Vấn đề chính là stats drift (không auto-update) và batchRefreshStats sequential — cần sửa trước khi go-live.
---

# 5. PROMPT CHO UC-48 – AI TRENDS

## 5.1. Prompt mở đầu UC-48

```text
/implement-from-design

Đọc docs/design/module-m09-overview.md và docs/design/module-m09-ai-trends.md.

Chưa code.

Hãy:
1. Tóm tắt UC-48
2. Chỉ ra ranh giới giữa Next.js app và AI Engine
3. Liệt kê file cần tạo ở phía Next.js
4. Chia phase triển khai
5. Nêu phần nào phải làm adapter/proxy thay vì xử lý AI trực tiếp trong app
```

## 5.2. Phase 1 adapter + API proxy UC-48

```text
Đọc docs/design/module-m09-ai-trends.md.

Triển khai Phase 1.

Yêu cầu:
- tạo integration client tới AI Engine
- tạo các API route proxy:
  - /api/research/ai/trends
  - /api/research/ai/gaps
  - /api/research/ai/recommend-researchers
  - /api/research/ai/recommend-references
  - /api/research/ai/budget-forecast
- giữ ranh giới rõ giữa app và AI Engine

Không nhúng model AI vào Next.js app.

Sau khi xong:
- liệt kê adapter methods
- liệt kê endpoint proxy
- nêu cấu hình nào nên đưa vào env hoặc config sau này
```

## 5.3. Phase 2 dashboard trends UC-48

```text
Đọc docs/design/module-m09-ai-trends.md.

Triển khai Phase 2.

Yêu cầu:
- tạo UI trends dashboard
- hiển thị:
  - trend chart
  - topic map placeholder/data adapter
  - growth/decline summary
- nếu chưa có dữ liệu AI thật, tạo type-safe mock adapter rõ ràng

Sau khi xong:
- nêu component tree
- nêu phần nào mock
- nêu phần nào ready để nối dữ liệu thật
```

## 5.4. Phase 3 recommendations UC-48

```text
Đọc docs/design/module-m09-ai-trends.md.

Triển khai Phase 3.

Yêu cầu:
- researcher recommendation UI + API
- reference recommendation UI + API
- trình bày lý do gợi ý rõ ràng, không chỉ điểm số

Sau khi xong:
- nêu response shape
- nêu cách explanation được hiển thị
- nêu phần nào cần đánh dấu là AI-assisted only
```

## 5.5. Review UC-48

```text
/review-m09

Hãy review code UC-48 so với docs/design/module-m09-ai-trends.md.

Kiểm tra:
- có giữ đúng ranh giới Next.js vs AI Engine không
- có nhúng logic AI sai chỗ không
- API proxy có rõ ràng không
- dashboard có đủ các nhóm chức năng chính không
```

---

# 6. PROMPT CHO UC-49 – DUPLICATE CHECK

## 6.1. Prompt mở đầu UC-49

```text
/implement-from-design

Đọc docs/design/module-m09-overview.md và docs/design/module-m09-duplicate-check.md.

Chưa code.

Hãy:
1. Tóm tắt UC-49
2. Chỉ ra entity nào cần lưu để audit kết quả duplicate check
3. Chỉ ra API, UI, adapter cần có
4. Chia phase triển khai
5. Nêu rõ cách tích hợp vào UC-45
```

## 6.2. Phase 1 schema + history UC-49

```text
Đọc docs/design/module-m09-duplicate-check.md.

Triển khai Phase 1.

Yêu cầu:
- cập nhật schema để lưu:
  - DuplicateCheckResult
  - DuplicateMatchItem
  - DuplicateRiskLevel
- schema phải hỗ trợ audit lịch sử kiểm tra

Không làm UI.
Không làm AI thuật toán nội bộ.

Sau khi xong:
- liệt kê model đã thêm
- nêu relation
- nêu index nào nên có cho history lookup
```

## 6.3. Phase 2 AI adapter + API UC-49

```text
Đọc docs/design/module-m09-duplicate-check.md.

Triển khai Phase 2.

Yêu cầu:
- tạo AI adapter client cho duplicate check
- tạo API:
  - POST duplicate-check
  - GET duplicate-check/[id]
  - GET duplicate-check/history
- lưu kết quả check vào DB để audit
- không cài cứng thuật toán trong route

Sau khi xong:
- nêu flow request
- nêu nơi lưu history
- nêu response shape chính
```

## 6.4. Phase 3 UI kết quả UC-49

```text
Đọc docs/design/module-m09-duplicate-check.md.

Triển khai Phase 3.

Yêu cầu:
- tạo form nhập title/abstract/keywords
- tạo result card
- tạo match table
- tạo risk badge đỏ / vàng / xanh
- hiển thị top matches và explanation rõ ràng

Sau khi xong:
- mô tả UX flow
- nêu cách điều hướng sang xem chi tiết bản ghi match
```

## 6.5. Phase 4 tích hợp vào UC-45

```text
Đọc docs/design/module-m09-research-projects.md và docs/design/module-m09-duplicate-check.md.

Triển khai Phase 4.

Yêu cầu:
- tích hợp duplicate-check vào form đăng ký đề tài UC-45
- có thể chạy khi:
  - tạo mới
  - submit
- không được chặn cứng việc tạo đề tài chỉ vì riskLevel cao
- phải hiển thị cảnh báo hỗ trợ quyết định

Sau khi xong:
- nêu điểm hook vào workflow UC-45
- nêu UI hiển thị cảnh báo
- nêu cách lưu liên kết duplicateCheckId vào ResearchProject
```

## 6.6. Review UC-49

```text
/review-m09

Hãy review code UC-49 theo docs/design/module-m09-duplicate-check.md.

Kiểm tra:
- có lưu audit history chưa
- có top matches và explanation chưa
- có risk banding đúng không
- có tích hợp đúng vào UC-45 mà không chặn cứng workflow không
```

---

# 7. PROMPT THEO SPRINT

## 7.1. Sprint 2 — Publications

```text
Đọc docs/design/module-m09-overview.md và docs/design/module-m09-publications.md.

Hãy lập plan Sprint 2 cho UC-46:
- phase
- file cần tạo/sửa
- phụ thuộc với UC-45
- thứ tự triển khai

Chưa code.
```

## 7.2. Sprint 3 — Scientists

```text
Đọc docs/design/module-m09-overview.md và docs/design/module-m09-scientists.md.

Hãy lập plan Sprint 3 cho UC-47:
- mapping với User / FacultyProfile / ScientificProfile
- file cần tạo/sửa
- phase triển khai

Chưa code.
```

## 7.3. Sprint 4 — Duplicate Check

```text
Đọc docs/design/module-m09-overview.md và docs/design/module-m09-duplicate-check.md.

Hãy lập plan Sprint 4 cho UC-49:
- schema
- AI adapter
- API
- UI
- hook vào UC-45

Chưa code.
```

## 7.4. Sprint 5 — AI Trends

```text
Đọc docs/design/module-m09-overview.md và docs/design/module-m09-ai-trends.md.

Hãy lập plan Sprint 5 cho UC-48:
- ranh giới Next.js / AI Engine
- API proxy
- UI dashboard
- recommendation flows

Chưa code.
```

---

# 8. PROMPT REVIEW TOÀN BỘ M09

```text
/review-m09

Hãy review toàn bộ phần code M09 hiện có so với các file:
- docs/design/module-m09-overview.md
- docs/design/module-m09-research-projects.md
- docs/design/module-m09-publications.md
- docs/design/module-m09-scientists.md
- docs/design/module-m09-ai-trends.md
- docs/design/module-m09-duplicate-check.md

Output:
1. phần đã đạt
2. phần còn thiếu
3. phần lệch kiến trúc
4. phần chưa đúng roadmap sprint
5. rủi ro production
6. thứ tự sửa tối ưu
```

---

# 9. CÁCH DÙNG KHUYẾN NGHỊ

## Thứ tự chuẩn

1. Đọc `docs/design/module-m09-overview.md`
2. Đọc file use case tương ứng
3. Yêu cầu Claude chỉ lập plan
4. Duyệt plan
5. Yêu cầu làm từng phase
6. Sau mỗi phase gọi review

## Nguyên tắc

* Không yêu cầu Claude làm cả module trong một lần
* Mỗi lần chỉ làm 1 phase
* Sau mỗi phase phải kiểm tra:

  * file đã tạo/sửa
  * giả định kỹ thuật
  * phần còn thiếu
  * bước tiếp theo

```

---

Nếu anh muốn, tôi sẽ làm tiếp cho anh **bản rút gọn cực ngắn “prompt tác chiến hằng ngày”** gồm khoảng 10 prompt quan trọng nhất để dùng nhanh, không phải kéo cả file dài này mỗi lần.
```

01. Redesign the page with complete statistics, correct overview format, and good UI/UX. http://localhost:3000/dashboard/research/overview. 02. Redesign the page: http://localhost:3000/dashboard/faculty/research. Complete data, correct data flow. Create sample data.