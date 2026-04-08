# M03 PROMPTS – BỘ PROMPT CHUẨN CHO MODULE CSDL ĐẢNG VIÊN

---

# 1. PROMPT MỞ ĐẦU M03

## 1.1. Đọc overview
```text
Đọc:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m03-overview.md

Chưa code.

Hãy tóm tắt:
1. Vai trò của M03 trong toàn hệ thống
2. 10 use case của M03
3. Vì sao M03 là module nghiệp vụ nhạy cảm cao nhất
4. Vòng đời đảng viên 9 giai đoạn
5. M03 phụ thuộc vào M01, M02, M13, M19 như thế nào
6. Thứ tự phase triển khai hợp lý

# M03 PROMPTS – BỘ PROMPT CHUẨN CHO MODULE CSDL ĐẢNG VIÊN

---

# 1. PROMPT MỞ ĐẦU M03

## 1.1. Đọc overview
```text
Đọc:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m03-overview.md

Chưa code.

Hãy tóm tắt:
1. Vai trò của M03 trong toàn hệ thống
2. 10 use case của M03
3. Vì sao M03 là module nghiệp vụ nhạy cảm cao nhất
4. Vòng đời đảng viên 9 giai đoạn
5. M03 phụ thuộc vào M01, M02, M13, M19 như thế nào
6. Thứ tự phase triển khai hợp lý


# 6) `docs/prompts/m03-prompts.md`

````md
# M03 PROMPTS – BỘ PROMPT CHUẨN CHO MODULE CSDL ĐẢNG VIÊN

---

# 1. PROMPT MỞ ĐẦU M03

## 1.1. Đọc overview
```text
Đọc:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m03-overview.md

Chưa code.

Hãy tóm tắt:
1. Vai trò của M03 trong toàn hệ thống
2. 10 use case của M03
3. Vì sao M03 là module nghiệp vụ nhạy cảm cao nhất
4. Vòng đời đảng viên 9 giai đoạn
5. M03 phụ thuộc vào M01, M02, M13, M19 như thế nào
6. Thứ tự phase triển khai hợp lý
````

## 1.2. Mapping codebase

```text
Đọc:
- docs/design/module-m03-overview.md
- docs/design/module-m03-party-member-lifecycle.md
- docs/design/module-m03-org-meeting-fee.md
- docs/design/module-m03-review-discipline-transfer.md
- docs/design/module-m03-inspection-dashboard.md

Chưa code.

Hãy:
1. Mapping M03 vào codebase hiện tại
2. Liệt kê file cần tạo/sửa
3. Chỉ ra integration points với M01/M02/M13/M19
4. Nêu chỗ nào cần tái sử dụng User/Personnel/Unit hiện có
5. Chia phase triển khai
```

---

# 2. PROMPT CHO PARTY MEMBER LIFECYCLE

## 2.1. Prompt mở đầu

```text
/implement-from-design

Đọc:
- docs/design/module-m03-overview.md
- docs/design/module-m03-party-member-lifecycle.md

Chưa code.

Hãy:
1. Tóm tắt UC-63, UC-65
2. Liệt kê model Prisma cần có
3. Liệt kê APIs chính
4. Chỉ ra integration points với M02 và M13
5. Chia phase triển khai
```

## 2.2. Phase 1 schema

```text
/m09-phase1-schema

Đọc docs/design/module-m03-party-member-lifecycle.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- cập nhật prisma/schema.prisma
- thêm hoặc mapping:
  - PartyMember
  - PartyRecruitmentPipeline
- nếu User/Personnel đã có thì nối relation đúng
- thêm enum PartyMemberStatus và RecruitmentStep nếu chưa có

Không làm API.
Không làm UI.

Sau khi xong:
1. liệt kê models đã thêm/sửa
2. nêu relation với User/Personnel
3. nêu unique/index quan trọng
4. nêu giả định kỹ thuật
5. đưa lệnh prisma tiếp theo
```

## 2.3. Phase 2 member/profile360 APIs

```text
Đọc docs/design/module-m03-party-member-lifecycle.md.

Triển khai Phase 2.

Yêu cầu:
- tạo member CRUD cơ bản
- tạo GET /api/party/members/[id]/profile360
- profile360 phải aggregate từ:
  - PartyMember
  - User/Personnel
  - PartyAnnualReview
  - PartyMeetingAttendance
  - PartyFeePayment
  - PartyAward
  - PartyDiscipline
  - PartyTransfer
  - PartyInspectionTarget
- nếu bảng nào chưa có, tạo adapter boundary rõ ràng

Chưa làm UI recruitment.

Sau khi xong:
- nêu flow aggregate
- nêu response shape
- nêu phần nào chờ module/bảng khác
```

## 2.4. Phase 3 recruitment pipeline

```text
Đọc docs/design/module-m03-party-member-lifecycle.md.

Triển khai Phase 3.

Yêu cầu:
- tạo service + APIs cho recruitment pipeline
- encode đúng bước:
  - THEO_DOI
  - HOC_CAM_TINH
  - DOI_TUONG
  - CHI_BO_XET
  - CAP_TREN_DUYET
  - DA_KET_NAP
- chừa integration point với workflow M13 cho bước CAP_TREN_DUYET

Sau khi xong:
- nêu flow pipeline
- nêu APIs đã có
- nêu phần nào cần workflow hóa sau
```

## 2.5. Phase 4 UI

```text
Đọc docs/design/module-m03-party-member-lifecycle.md.

Triển khai Phase 4.

Yêu cầu:
- tạo hồ sơ đảng viên UI
- tạo recruitment pipeline board UI
- tạo profile tabs
- tạo summary card

Sau khi xong:
- liệt kê file UI
- nêu tab structure
- nêu phần nào còn tối thiểu
```

---

# 3. PROMPT CHO ORG / MEETING / FEE

## 3.1. Prompt mở đầu

```text
/implement-from-design

Đọc:
- docs/design/module-m03-overview.md
- docs/design/module-m03-org-meeting-fee.md

Chưa code.

Hãy:
1. Tóm tắt UC-64, UC-66, UC-67
2. Liệt kê model cần có
3. Liệt kê API cần có
4. Chia phase triển khai
5. Chỉ ra điểm nào nên dùng tree pattern và scheduler hook
```

## 3.2. Phase 1 schema

```text
/m09-phase1-schema

Đọc docs/design/module-m03-org-meeting-fee.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- thêm:
  - PartyOrganization
  - PartyMeeting
  - PartyMeetingAttendance
  - PartyFeePayment
- thêm enum PartyOrgLevel và MeetingType nếu chưa có

Không làm API/UI.

Sau khi xong:
- liệt kê models và enums
- nêu relation chính
- nêu index nên có
```

## 3.3. Phase 2 APIs

```text
Đọc docs/design/module-m03-org-meeting-fee.md.

Triển khai Phase 2.

Yêu cầu:
- tạo org APIs
- tạo meeting APIs
- tạo fee APIs
- fee phải support debt summary và fee history
- chưa làm UI

Sau khi xong:
- liệt kê endpoint
- nêu business rules đã encode
```

## 3.4. Phase 3 UI

```text
Đọc docs/design/module-m03-org-meeting-fee.md.

Triển khai Phase 3.

Yêu cầu:
- org tree UI
- meeting calendar/attendance UI
- fee table + debt summary UI

Sau khi xong:
- liệt kê file UI
- nêu UX flow chính
```

---

# 4. PROMPT CHO REVIEW / DISCIPLINE / TRANSFER

## 4.1. Prompt mở đầu

```text
/implement-from-design

Đọc:
- docs/design/module-m03-overview.md
- docs/design/module-m03-review-discipline-transfer.md

Chưa code.

Hãy:
1. Tóm tắt UC-68, UC-69, UC-70
2. Liệt kê models cần có
3. Liệt kê API/UI cần có
4. Chia phase triển khai
5. Chỉ ra integration point với workflow M13
```

## 4.2. Phase 1 schema

```text
/m09-phase1-schema

Đọc docs/design/module-m03-review-discipline-transfer.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- thêm:
  - PartyAnnualReview
  - PartyAward
  - PartyDiscipline
  - PartyTransfer
- thêm enums ReviewGrade, DisciplineSeverity, TransferType nếu chưa có

Không làm API/UI.

Sau khi xong:
- liệt kê models/enums
- nêu index chính
- nêu relation với PartyMember/PartyOrganization
```

## 4.3. Phase 2 APIs + services

```text
Đọc docs/design/module-m03-review-discipline-transfer.md.

Triển khai Phase 2.

Yêu cầu:
- tạo APIs cho:
  - reviews
  - awards
  - disciplines
  - transfers
  - transfer confirm
- audit các hành động nhạy cảm
- transfer confirm phải chừa workflow integration point

Sau khi xong:
- liệt kê endpoint
- nêu flow transfer confirm
- nêu phần nào cần M13 sau này
```

## 4.4. Phase 3 UI

```text
Đọc docs/design/module-m03-review-discipline-transfer.md.

Triển khai Phase 3.

Yêu cầu:
- tạo pages/forms/tables cho review, award, discipline, transfer
- transfer status badge
- gắn hiển thị vào hồ sơ đảng viên nếu phù hợp

Sau khi xong:
- liệt kê file UI
- nêu các component chính
```

---

# 5. PROMPT CHO UBKT & DASHBOARD

## 5.1. Prompt mở đầu

```text
/implement-from-design

Đọc:
- docs/design/module-m03-overview.md
- docs/design/module-m03-inspection-dashboard.md

Chưa code.

Hãy:
1. Tóm tắt UC-71, UC-72
2. Liệt kê model/API/UI cần có
3. Chia phase triển khai
4. Nêu dashboard KPI nào là bắt buộc ở phase đầu
```

## 5.2. Phase 1 schema + APIs

```text
/m09-phase1-schema

Đọc docs/design/module-m03-inspection-dashboard.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- thêm PartyInspectionTarget
- tạo APIs cho inspection
- tạo aggregate APIs cho dashboard stats/trends

Không làm UI.

Sau khi xong:
- liệt kê model đã thêm
- nêu KPI dashboard từ các bảng nào tính ra
```

## 5.3. Phase 2 UI

```text
Đọc docs/design/module-m03-inspection-dashboard.md.

Triển khai Phase 2.

Yêu cầu:
- tạo inspection table + detail
- tạo dashboard page
- hiển thị:
  - số lượng đảng viên theo trạng thái
  - kết nạp mới
  - tỷ lệ dự họp
  - nợ đảng phí
  - xếp loại
  - số vụ kỷ luật / kiểm tra

Sau khi xong:
- liệt kê file UI
- nêu KPI cards/charts structure
```

---

# 6. PROMPT REVIEW TOÀN BỘ M03

```text
/review-m09

Hãy review toàn bộ phần code M03 hiện có so với:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m03-overview.md
- docs/design/module-m03-party-member-lifecycle.md
- docs/design/module-m03-org-meeting-fee.md
- docs/design/module-m03-review-discipline-transfer.md
- docs/design/module-m03-inspection-dashboard.md

Output:
1. phần đã đạt
2. phần còn thiếu
3. phần lệch kiến trúc
4. vòng đời đảng viên 9 giai đoạn đã được phản ánh đúng chưa
5. integration với M01/M02/M13/M19 đã đủ chưa
6. thứ tự sửa tối ưu
```

````

---

# Cách dùng ngay

Bắt đầu bằng prompt này:

```text
Đọc:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m03-overview.md

Chưa code.

Hãy tóm tắt:
1. Vai trò của M03 trong toàn hệ thống
2. 10 use case của M03
3. Vì sao M03 là module nghiệp vụ nhạy cảm cao nhất
4. Vòng đời đảng viên 9 giai đoạn
5. M03 phụ thuộc vào M01, M02, M13, M19 như thế nào
6. Thứ tự phase triển khai hợp lý
````

Bước tiếp theo hợp lý nhất là dựng luôn **khung design chuẩn cho M05** hoặc **M10**, vì hai module này cũng là nghiệp vụ lớn và phụ thuộc chặt vào M01, M02, M13, M18, M19.

- __Chuẩn hóa bảo mật M03 theo M01__

  - Bổ sung function codes chi tiết cho PARTY (VIEW_SENSITIVE, APPROVE_TRANSFER, APPROVE_DISCIPLINE, VIEW_INSPECTION,...).
  - Áp dụng field-level authorization cho `confidentialNote` và các trường nhạy cảm.

- __Đóng gap kiến trúc layer__
  - Tạo `lib/validators/party/*`, `lib/repositories/party/*` và refactor route/service theo chuẩn.

- __Hợp nhất contract API theo design__
  - Chuẩn hóa về `/reviews` (giảm split với `/evaluations`), bổ sung `transfers/[id]/confirm`, `reports/export`.

- __Workflow hóa các bước trọng yếu qua M13__
  - Admissions, transfer confirm, discipline/inspection approval chạy qua workflow states.

- __Chuẩn hóa lookup qua M19__
  - Đưa enum hiển thị UI sang master data cho grade/severity/type/status; dùng `useMasterData` + `MasterDataSelect`.

- __Hoàn thiện lifecycle engine 9 giai đoạn__
  - State transition rules + deadline automation (DU_BI 12 tháng) + cảnh báo + audit trail chuẩn.

- __Kỹ thuật ổn định hóa__
  - Loại bỏ `(prisma as any)` bằng regenerate/type-safe client và migration đồng bộ.

Rearrange the functions on the Party database sidebar menu, adding new functional menus logically from general to individual, following the business process flow. Then, create sample data for the Party database functions based on the existing data.



REVIEW M03 – CODE vs DESIGN
1. PHẦN ĐÃ ĐẠT
Schema (xuất sắc):

Đủ 11 model bắt buộc theo design + 2 model bổ sung hợp lý: PartyActivity, PartyMemberHistory
Tất cả enum nghiệp vụ đúng: PartyMemberStatus (8 trạng thái), MeetingType (6 loại), ReviewGrade, DisciplineSeverity, TransferType, InspectionType, RecruitmentStep
Có thêm PartyLifecycleEvent + PartyLifecycleAlert cho automation – đây là thiết kế tốt ngoài requirement
Services cốt lõi:

party-lifecycle.service.ts – state machine chuyển trạng thái, probation 12 tháng, lifecycle trail ✓
party-workflow.service.ts – transitions DRAFT→SUBMITTED→UNDER_REVIEW→APPROVED/REJECTED ✓
party-profile360.service.ts – aggregate 7 bảng đúng thiết kế UC-63 ✓
party-fee.service.ts – auto-generate, debt calculation, UNPAID/PARTIAL/PAID logic ✓
party-member.service.ts – soft delete, legacy field aliasing, status change tracking ✓
UI/Pages – đủ theo design:

Tất cả 11 page UC-63→UC-72 đều hiện diện
Tất cả 23 component đúng tên, đúng grouping theo design
Dashboard page, member detail tabs, recruitment board, org tree – đủ
RBAC function codes: PARTY.VIEW, PARTY.MANAGE_MEETING, PARTY.APPROVE, v.v. đã định nghĩa

Audit trail: Các route mutating đều ghi audit log

2. PHẦN CÒN THIẾU
2a. Repository layer – thiếu 10/11 repos
Repo theo design	Trạng thái
party-member.repo.ts	✓ Có
party-org.repo.ts	✗ Thiếu
party-meeting.repo.ts	✗ Thiếu
party-fee.repo.ts	✗ Thiếu
party-review.repo.ts	✗ Thiếu
party-award.repo.ts	✗ Thiếu
party-discipline.repo.ts	✗ Thiếu
party-transfer.repo.ts	✗ Thiếu
party-inspection.repo.ts	✗ Thiếu
party-dashboard.repo.ts	✗ Thiếu
party-recruitment.repo.ts	✗ Thiếu
Hậu quả: 10 service đang gọi prisma.* trực tiếp thay vì đi qua repo – vi phạm kiến trúc phân tầng.

2b. Service layer – thiếu 5/8 services
Service theo design	Trạng thái
party-recruitment.service.ts (UC-65)	✗ Thiếu
party-award-discipline.service.ts (UC-69)	✗ Thiếu
party-transfer.service.ts (UC-70)	✗ Thiếu
party-inspection.service.ts (UC-71)	✗ Thiếu
party-dashboard.service.ts (UC-72)	✗ Thiếu
Hậu quả: Các route tương ứng đang chứa business logic inline trong route handler.

2c. Validator layer – thiếu 10/11 validators
Chỉ có party-member.schema.ts. Các entity: org, meeting, fee, review, award, discipline, transfer, inspection, recruitment – không có validator → input validation đang bị bỏ qua hoặc nằm rải rác trong route/service.

2d. API endpoint thiếu
POST /api/party/members/[id]/export-2a – chưa có (xuất mẫu 2A-LLĐV theo UC-63)
GET/POST /api/party/recruitment/* – chưa có endpoint riêng cho recruitment pipeline (UC-65); recruitment page tồn tại nhưng không rõ nó gọi API nào
3. PHẦN LỆCH KIẾN TRÚC
Lệch 1: Services gọi Prisma trực tiếp + raw SQL
party-org.service.ts dùng raw SQL – bypass toàn bộ Prisma type safety và vi phạm quy tắc "service không làm data access". Tương tự party-meeting.service.ts, party-fee.service.ts gọi prisma.* trực tiếp.

Lệch 2: M13 Workflow chưa tích hợp
Design yêu cầu kết nạp, chuyển sinh hoạt, kỷ luật đi qua M13 workflow engine. Hiện tại code tự xây party-workflow.service.ts riêng (dùng [WF:STATUS] marker nhúng vào text field) – đây là workaround nội bộ, không phải M13 thật. Cần chừa integration point khi M13 hoàn thiện.

Lệch 3: M18 Export chưa tích hợp
Design nói: "xuất PDF mẫu chuẩn", "về lâu dài nên đi qua M18". Hiện chưa có export-2a API, và reports/export chưa dùng M18.

Lệch 4: M19 Lookup chưa tích hợp
DisciplineSeverity, ReviewGrade, InspectionType, v.v. đang hard-code trong Prisma enum. Design nói M03 nên dùng lookup từ M19 cho các danh mục này. Hiện chưa có hook useMasterData nào trong components/party.

Lệch 5: party/page.tsx gọi sai API
Main party page gọi /api/personnel/party-member/stats (endpoint của M02, trả mock data) thay vì /api/party/dashboard/stats (endpoint M03 đã có). Data không đến từ đúng nguồn.

Lệch 6: Admissions = PartyMemberHistory (semantic mismatch)
Design định nghĩa PartyRecruitmentPipeline cho UC-65, nhưng code triển khai admissions page dùng PartyMemberHistory với historyType. Hai model này có vai trò khác nhau – History là audit trail sau sự kiện, Pipeline là tracking trước khi kết nạp. Cần tách rõ.

4. VÒNG ĐỜI ĐẢNG VIÊN 9 GIAI ĐOẠN – ĐÃ PHẢN ÁNH ĐÚNG CHƯA?
Giai đoạn	Trạng thái trong code
0 – Quần chúng ưu tú	QUAN_CHUNG ✓
1 – Cảm tình Đảng	CAM_TINH ✓
2 – Đối tượng kết nạp	DOI_TUONG ✓
3 – Đảng viên dự bị	DU_BI ✓
4 – Đảng viên chính thức	CHINH_THUC ✓
5 – Sinh hoạt thường kỳ	Phụ thuộc PartyMeeting ✓
6 – Đánh giá hàng năm	PartyAnnualReview ✓
7 – Khen thưởng/Kỷ luật/Kiểm tra	PartyAward/Discipline/InspectionTarget ✓
8 – Chuyển/Xóa tên/Khai trừ	CHUYEN_DI/XOA_TEN_TU_NGUYEN/KHAI_TRU ✓
Kết luận: Schema và enum phản ánh đúng 9 giai đoạn.

Tuy nhiên 2 rủi ro:

party-lifecycle.service.ts có assertPartyLifecycleTransition() nhưng cần verify nó được gọi bắt buộc trong mọi route mutation status – hiện chỉ có party-member.service.ts dùng nó, các route khác có thể bypass
Recruitment pipeline (giai đoạn 0→3) và PartyMember status (giai đoạn 3→8) là hai model tách biệt, nhưng cần kiểm tra logic chuyển từ pipeline JOINED → tạo PartyMember với status DU_BI đã đủ không
5. INTEGRATION VỚI M01/M02/M13/M19 – ĐÃ ĐỦ CHƯA?
Integration	Trạng thái	Ghi chú
M01 – Auth/RBAC	Đủ cơ bản	Function codes đã định nghĩa, audit log có; cần kiểm tra middleware enforce đúng scope UNIT/DEPARTMENT/ACADEMY
M01 – Trường nhạy cảm	Thiếu	confidentialNote cần guard PARTY.MEMBER_SENSITIVE nhưng chưa thấy field-level guard
M02 – User/Personnel	Đủ	PartyMember.userId → User, profile360 kéo từ M02 đúng
M02 – CareerHistory	Thiếu	UC-63 yêu cầu tab "quá trình hoạt động CM" từ CareerHistory M02; profile360 chưa include
M13 – Workflow	Chưa tích hợp	Tự xây workflow workaround, chưa dùng M13 engine
M19 – Lookup	Chưa tích hợp	Enum hard-code, chưa dùng useMasterData hook
M18 – Export	Chưa tích hợp	Export-2a endpoint chưa có, chưa dùng M18
6. THỨ TỰ SỬA TỐI ƯU

Ưu tiên 1 – Sửa ngay (blocking hoặc data sai)
  [P1-A] Fix party/page.tsx gọi sai API → đổi sang /api/party/dashboard/stats
  [P1-B] Fix admissions semantic mismatch → tách PartyRecruitmentPipeline API 
         riêng với PartyMemberHistory

Ưu tiên 2 – Bổ sung thiếu trong kiến trúc
  [P2-A] Tạo 10 repo còn thiếu (party-org, party-meeting, party-fee, 
         party-review, party-award, party-discipline, party-transfer,
         party-inspection, party-dashboard, party-recruitment)
  [P2-B] Tạo 5 service còn thiếu (recruitment, award-discipline, transfer, 
         inspection, dashboard)
  [P2-C] Tạo validator cho 10 entity còn lại

Ưu tiên 3 – Củng cố lifecycle
  [P3-A] Đảm bảo assertPartyLifecycleTransition() được gọi trong MỌI route 
         thay đổi status
  [P3-B] Kiểm tra luồng pipeline JOINED → PartyMember DU_BI
  [P3-C] Thêm guard PARTY.MEMBER_SENSITIVE cho trường confidentialNote
  [P3-D] Thêm CareerHistory vào profile360 aggregate

Ưu tiên 4 – Integration point
  [P4-A] Chừa M13 integration point rõ trong workflow service (comment/interface)
  [P4-B] Tạo export-2a API scaffold (chừa M18 adapter)
  [P4-C] Đánh dấu các enum nên migrate sang M19 khi M19 hoàn thiện
Tóm tắt: Schema M03 tốt, UI đủ. Điểm yếu tập trung ở tầng trung (service/repo/validator) bị bỏ qua, và 4 integration point với M01/M02/M13/M18/M19 chưa đủ. Ưu tiên sửa P1 trước vì ảnh hưởng data display ngay lập tức.