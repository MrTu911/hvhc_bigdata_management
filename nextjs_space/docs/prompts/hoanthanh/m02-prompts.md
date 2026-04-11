# M02 PROMPTS – BỘ PROMPT CHUẨN CHO MODULE CSDL CÁN BỘ NHÂN SỰ

---

# 1. PROMPT MỞ ĐẦU M02

## 1.1. Đọc overview
```text
Đọc:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m02-overview.md

Chưa code.

Hãy tóm tắt:
1. Vai trò của M02 trong toàn hệ thống
2. 6 use case của M02
3. Vì sao M02 là master data nguồn cho nhiều module
4. M02 aggregate dữ liệu từ những module nào
5. M19 hỗ trợ gì cho M02
6. Thứ tự phase triển khai hợp lý
````

## 1.2. Mapping codebase

```text id="xmyhvr"
Đọc:
- docs/design/module-m02-overview.md
- docs/design/module-m02-profile360.md
- docs/design/module-m02-career-family-academic.md
- docs/design/module-m02-category-search.md

Chưa code.

Hãy:
1. Mapping M02 vào codebase hiện tại
2. Liệt kê file cần tạo/sửa
3. Chỉ ra điểm nào phải tái sử dụng User/Unit hiện có
4. Nêu chỗ nào phải tích hợp M01/M19
5. Chia phase triển khai
```

---

# 2. PROMPT CHO PROFILE360 & PERSONNEL MASTER

## 2.1. Prompt mở đầu

```text id="4abf5o"
/implement-from-design

Đọc:
- docs/design/module-m02-overview.md
- docs/design/module-m02-profile360.md

Chưa code.

Hãy:
1. Tóm tắt UC-09, UC-11 và phần Personnel master
2. Liệt kê models cần có
3. Liệt kê APIs chính
4. Chỉ ra integration points với M03, M05, M07, M09
5. Chia phase triển khai
```

## 2.2. Phase 1 schema

```text id="wz04o0"
/m09-phase1-schema

Đọc docs/design/module-m02-profile360.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- cập nhật prisma/schema.prisma
- thêm hoặc mapping:
  - Personnel
  - ScientificProfile nếu cần
- nếu User đã tồn tại, ưu tiên nối relation đúng thay vì tạo bảng user song song
- nếu Unit đã tồn tại, ưu tiên dùng lại

Không làm API.
Không làm UI.

Sau khi xong:
1. liệt kê models đã thêm/sửa
2. nêu relation với User/Unit
3. nêu unique/index quan trọng
4. nêu giả định kỹ thuật
5. đưa lệnh prisma tiếp theo
```

## 2.3. Phase 2 personnel CRUD + detail

```text id="34s4n8"
Đọc docs/design/module-m02-profile360.md.

Triển khai Phase 2.

Yêu cầu:
- tạo repository/service/API cho Personnel CRUD cơ bản
- tạo GET detail API
- chưa làm profile360 aggregate đầy đủ
- tôn trọng scope từ M01 ở mức integration hook/stub rõ ràng

Sau khi xong:
- liệt kê endpoint
- nêu response shape
- nêu chỗ nào sẽ cắm checkScopeAccess
```

## 2.4. Phase 3 profile360 aggregate

```text id="fddv4n"
Đọc docs/design/module-m02-profile360.md.

Triển khai Phase 3.

Yêu cầu:
- tạo profile360 aggregate service
- tạo GET /api/personnel/[id]/profile360
- aggregate từ:
  - Personnel
  - CareerHistory
  - EducationHistory
  - FamilyMember
  - M03 PartyMember
  - M05 rewards/disciplines/insurance/allowances
  - M09 research data
  - M07 faculty data
- nếu module ngoài chưa có thật, dùng adapter boundary rõ ràng

Sau khi xong:
- nêu flow aggregate
- nêu response shape
- nêu phần nào là stub integration
```

## 2.5. Phase 4 UI profile360

```text id="g2jlwm"
Đọc docs/design/module-m02-profile360.md.

Triển khai Phase 4.

Yêu cầu:
- tạo UI hồ sơ 360
- summary card + tabs
- sensitive field guard
- tab lý lịch khoa học riêng

Sau khi xong:
- liệt kê file UI
- nêu tab structure
- nêu phần nào chờ data thật từ module ngoài
```

---

# 3. PROMPT CHO CAREER / FAMILY / ACADEMIC

## 3.1. Prompt mở đầu

```text id="0ghbj7"
/implement-from-design

Đọc:
- docs/design/module-m02-overview.md
- docs/design/module-m02-career-family-academic.md

Chưa code.

Hãy:
1. Tóm tắt UC-10, UC-12 và phần học vấn
2. Liệt kê models cần có
3. Liệt kê APIs cần có
4. Chia phase triển khai
5. Chỉ ra lookup nào nên dùng từ M19
```

## 3.2. Phase 1 schema

```text id="8x6l0m"
/m09-phase1-schema

Đọc docs/design/module-m02-career-family-academic.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- thêm:
  - CareerHistory
  - EducationHistory
  - FamilyMember
- thêm enum CareerEventType nếu chưa có
- nối relation với Personnel và Unit đúng cách

Không làm API/UI.

Sau khi xong:
- liệt kê models và enum
- nêu relation chính
- nêu index nên có
```

## 3.3. Phase 2 CRUD APIs

```text id="mn9r3h"
Đọc docs/design/module-m02-career-family-academic.md.

Triển khai Phase 2.

Yêu cầu:
- tạo CRUD APIs cho:
  - career
  - education
  - family
- response chuẩn: { success, data, error }
- service/repository tách rõ
- chưa làm UI

Sau khi xong:
- liệt kê endpoint
- nêu validation chính
```

## 3.4. Phase 3 UI

```text id="g0q2ar"
Đọc docs/design/module-m02-career-family-academic.md.

Triển khai Phase 3.

Yêu cầu:
- tạo career timeline
- education table
- family member table/form
- UI phải phục vụ trực tiếp profile360

Sau khi xong:
- liệt kê file UI
- nêu cách các component được nhúng vào profile360
```

---

# 4. PROMPT CHO CATEGORY PROFILE & TALENT SEARCH

## 4.1. Prompt mở đầu

```text id="wv7tnz"
/implement-from-design

Đọc:
- docs/design/module-m02-overview.md
- docs/design/module-m02-category-search.md

Chưa code.

Hãy:
1. Tóm tắt UC-13, UC-14
2. Nêu logic category-specific profile
3. Nêu logic search / talent planning
4. Liệt kê APIs và UI cần có
5. Chia phase triển khai
```

## 4.2. Phase 1 search API

```text id="exjd06"
Đọc docs/design/module-m02-category-search.md.

Triển khai Phase 1.

Yêu cầu:
- tạo GET /api/personnel/search
- filter theo:
  - category
  - unitId
  - rank
  - position
  - degree
  - major
  - academicTitle
  - politicalTheory
  - ageRange
  - serviceYears
  - hasResearch
- tôn trọng scope của M01

Sau khi xong:
- nêu response shape
- nêu filter nào dùng lookup M19
```

## 4.3. Phase 2 talent search engine

```text id="c70xgb"
Đọc docs/design/module-m02-category-search.md.

Triển khai Phase 2.

Yêu cầu:
- tạo POST /api/personnel/talent-search
- scoring phải là hỗ trợ quyết định, không thay quyết định nhân sự
- trả:
  - score
  - matched criteria
  - missing criteria
- chừa abstraction cho scoring rule điều chỉnh sau

Sau khi xong:
- nêu scoring flow
- nêu request/response shape
- nêu phần nào là configurable rule
```

## 4.4. Phase 3 UI search / planning

```text id="jlwm4s"
Đọc docs/design/module-m02-category-search.md.

Triển khai Phase 3.

Yêu cầu:
- tạo search page
- tạo planning page
- search result table
- ranking panel
- category-specific profile sections

Sau khi xong:
- liệt kê file UI
- nêu UX flow
```

---

# 5. PROMPT REVIEW TOÀN BỘ M02

```text id="mhph0b"
/review-m09

Hãy review toàn bộ phần code M02 hiện có so với:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m02-overview.md
- docs/design/module-m02-profile360.md
- docs/design/module-m02-career-family-academic.md
- docs/design/module-m02-category-search.md

Output:
1. phần đã đạt
2. phần còn thiếu
3. phần lệch kiến trúc
4. M02 đã đúng vai trò master data nguồn chưa
5. integration với M01/M19 đã đủ chưa
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
- docs/design/module-m02-overview.md

Chưa code.

Hãy tóm tắt:
1. Vai trò của M02 trong toàn hệ thống
2. 6 use case của M02
3. Vì sao M02 là nguồn dữ liệu gốc cho nhiều module
4. M02 aggregate dữ liệu từ những module nào
5. M19 hỗ trợ gì cho M02
6. Thứ tự phase triển khai hợp lý
````

Bước tiếp theo hợp lý nhất là dựng luôn **khung chuẩn cho M03**, vì M03 phụ thuộc rất mạnh vào M01, M02, M13, M19 và là module nghiệp vụ nhạy cảm kế tiếp.
