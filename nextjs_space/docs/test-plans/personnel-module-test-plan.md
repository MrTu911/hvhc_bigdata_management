# Kế hoạch kiểm thử toàn diện — Module CSDL cán bộ & quân nhân (M02 Personnel Core)

> Phạm vi: toàn chùm nhân sự — lõi (CRUD, search, import/export, profile360, status-history,
> RBAC/scope) và các nhánh liên quan (đảng viên, bảo hiểm, khen thưởng/kỷ luật, thăng quân hàm,
> career/education/family).
>
> Mục tiêu: bảo vệ nghiệp vụ cốt lõi, **chống rò dữ liệu vượt quyền (scope)**, đảm bảo audit cho
> thao tác nhạy cảm, và giữ định dạng file xuất đúng quy định.

## 1. Quy ước

- **Mức ưu tiên**: P0 (chặn release) > P1 (quan trọng) > P2 (nên có).
- **Loại**: `Auto` = có test tự động (vitest); `Manual` = QA/nghiệm thu thủ công.
- **Tiêu chí pass/fail**: ghi ở cột "Kết quả mong đợi". Fail nếu kết quả thực tế khác.
- Thứ tự ưu tiên nhóm theo `.claude/rules/testing.md`: RBAC/scope → business rule → workflow →
  calculation → regression → API contract.

## 2. Dữ liệu test (fixtures gợi ý)

| Vai trò | Function code mẫu | Scope | Dùng để |
|---|---|---|---|
| `QUAN_TRI_HE_THONG` | `VIEW/CREATE/UPDATE/DELETE/EXPORT_PERSONNEL` | ALL/ACADEMY | Happy path, full quyền |
| `CHI_HUY_KHOA_PHONG` / `TRO_LY` | `VIEW/EXPORT_PERSONNEL` | UNIT | Kiểm tra cô lập đơn vị |
| `GIANG_VIEN` / `HOC_VIEN` | `VIEW_PERSONNEL` | SELF | Chỉ thấy bản thân |
| (không gán) | — | — | Kiểm tra Forbidden |

Dữ liệu nền: ≥2 đơn vị (unit-A, unit-B), mỗi đơn vị ≥2 nhân sự; ≥1 nhân sự có đủ
đào tạo/công tác/gia đình/đảng/khen thưởng/kỷ luật để kiểm 2A.

---

## 3. Ma trận test case

### Nhóm A — RBAC & Scope (P0, ưu tiên cao nhất)

| ID | Tiền điều kiện | Bước | Kết quả mong đợi | Ưu tiên | Auto/Manual |
|---|---|---|---|---|---|
| A1 | User scope UNIT (unit-A) | Gọi `GET /api/personnel?...` | Chỉ trả nhân sự thuộc unit-A (và unit con nếu có hierarchy); KHÔNG có unit-B | P0 | Auto (`personnel-scope.test.ts`) |
| A2 | User scope UNIT không có đơn vị nào hợp lệ | Gọi export | `unitId: { in: [] }` → trả rỗng, không lộ dữ liệu | P0 | Auto |
| A3 | User scope SELF | Gọi list/export | Chỉ trả bản thân (theo id) | P0 | Auto |
| A4 | User scope ACADEMY | Gọi list/export | Trả tất cả, không áp filter đơn vị | P0 | Auto |
| A5 | User không có `EXPORT_PERSONNEL` | `GET /api/personnel/export` | HTTP 403 Forbidden | P0 | Manual |
| A6 | User không có `VIEW_PERSONNEL_SENSITIVE` | Mở profile360 / detail | Trường nhạy cảm (CCCD, lương, số thẻ Đảng) bị ẩn ở cả API và UI | P0 | Manual |
| A7 | User scope UNIT (unit-A) | `GET /api/personnel/[id]` với id thuộc unit-B | 403 / not found (không lộ tồn tại) | P0 | Manual |
| A8 | User scope UNIT | `GET /api/personnel/search?...` keyword khớp nhân sự unit-B | Kết quả KHÔNG chứa nhân sự unit-B | P0 | Manual |

### Nhóm B — CRUD nhân sự (P0/P1)

| ID | Tiền điều kiện | Bước | Kết quả mong đợi | Ưu tiên | Auto/Manual |
|---|---|---|---|---|---|
| B1 | Có quyền CREATE | POST `/api/personnel` payload hợp lệ | 201/200, bản ghi tạo, `personnelCode` unique | P1 | Manual |
| B2 | — | POST thiếu field bắt buộc / sai enum | 400 validation error rõ ràng (zod), không tạo bản ghi | P0 | Manual |
| B3 | Bản ghi tồn tại | PATCH `/api/personnel/[id]` | Cập nhật đúng phần, `updatedAt` đổi | P1 | Manual |
| B4 | Bản ghi tồn tại | DELETE `/api/personnel/[id]` | Soft delete: `deletedAt` được set, KHÔNG hard delete; bản ghi biến mất khỏi list | P0 | Manual |
| B5 | `personnelCode` đã tồn tại | POST trùng code | Báo lỗi business conflict (409), không tạo trùng | P1 | Manual |

### Nhóm C — Search / Advanced search (P1)

| ID | Bước | Kết quả mong đợi | Ưu tiên | Auto/Manual |
|---|---|---|---|---|
| C1 | `GET /api/personnel/search` có `page/pageSize` | Phân trang đúng, meta total chính xác | P1 | Manual |
| C2 | Filter theo `militaryRank/status/unitId` | Kết quả khớp filter | P1 | Manual |
| C3 | Sort theo `fullName` | Thứ tự đúng | P2 | Manual |
| C4 | `advanced-search` (legacy, query User) vs `search` (Personnel) | Ghi nhận khác biệt nguồn dữ liệu; cả hai đều tôn trọng scope | P1 | Manual |

### Nhóm D — Import / Export (P0/P1)

| ID | Tiền điều kiện | Bước | Kết quả mong đợi | Ưu tiên | Auto/Manual |
|---|---|---|---|---|---|
| D1 | File CSV hợp lệ | POST `/api/personnel/import` có `dryRun=true` | Trả số dòng created/updated/skipped + lỗi từng dòng, KHÔNG ghi DB | P0 | Manual |
| D2 | File CSV có dòng lỗi | Import commit | Dòng lỗi bị bỏ qua + báo cáo; dòng hợp lệ ghi đúng | P1 | Manual |
| D3 | — | `GET /api/personnel/export?format=csv` | CSV mở bằng Excel: tiếng Việt đúng (BOM), tiêu đề 11 cột, đánh số TT | P1 | Manual |
| D4 | Ô chứa `"`, `,`, hoặc bắt đầu `= + - @` | Mở CSV xuất ra | Nháy kép nhân đôi; ô công thức bị vô hiệu (prefix `'`) — không thực thi | P0 | Auto (`csv-escape.test.ts`) |
| D5 | — | `GET /api/personnel/export?format=xlsx` | Excel có quốc hiệu/tiêu ngữ, tiêu đề "DANH SÁCH TRÍCH NGANG...", bảng viền + đánh số, footer ký duyệt, nhãn enum tiếng Việt | P1 | Auto (`personnel-roster-excel.test.ts`) |
| D6 | Nhân sự có đủ dữ liệu | `GET /api/personnel/export-2a?personnelId=<id>&format=html` | HTML lý lịch 2A đúng field schema `Personnel`, enum → tiếng Việt | P1 | Auto (`personnel-2a-document.test.ts`) |
| D7 | Môi trường có Chromium | `...&format=pdf` | Trả PDF A4 hợp lệ | P1 | Manual |
| D8 | Môi trường KHÔNG có Chromium | `...&format=pdf` | Fallback HTML + header `X-Pdf-Fallback`, không vỡ route | P2 | Manual |
| D9 | Gọi export | Vượt 10 lần / 5 phút | HTTP 429 (rate limit) | P1 | Manual |
| D10 | Dùng `userId` (legacy) thay `personnelId` | `export-2a?userId=<id>` | Map qua tài khoản → trả đúng lý lịch (giữ tương thích) | P2 | Manual |

### Nhóm E — Status history (P0)

| ID | Bước | Kết quả mong đợi | Ưu tiên | Auto/Manual |
|---|---|---|---|---|
| E1 | Đổi trạng thái nhân sự (vd. DANG_CONG_TAC → NGHI_HUU) | Sinh bản ghi `PersonnelStatusHistory` (fromStatus/toStatus/effectiveDate) | P0 | Manual |
| E2 | Đổi trạng thái | Ghi audit log (action đổi trạng thái) | P0 | Manual |
| E3 | Đổi trạng thái không hợp lệ theo nghiệp vụ | Bị chặn / cảnh báo | P1 | Manual |

### Nhóm F — Nhánh liên quan (P1/P2)

| ID | Nhánh | Bước | Kết quả mong đợi | Ưu tiên | Auto/Manual |
|---|---|---|---|---|---|
| F1 | Đảng viên | Tạo/đổi trạng thái đảng viên (DU_BI → CHINH_THUC) | Sinh `PartyMemberHistory`/lifecycle event; trường nhạy cảm có guard | P1 | Manual |
| F2 | Đảng viên | Ghi kỷ luật đảng (`PartyDiscipline`) | Lưu đúng severity + audit | P1 | Manual |
| F3 | Khen thưởng/kỷ luật | Workflow PROPOSED → UNDER_REVIEW → APPROVED | Trạng thái chuyển đúng; chỉ bản ghi APPROVED hiển thị ở 2A | P0 | Manual |
| F4 | Bảo hiểm | Thêm `InsuranceInfo` + dependent | Lưu đúng `insuranceStartDate` (không dùng field cũ) | P2 | Manual |
| F5 | Thăng quân hàm | Tạo `PromotionProposal` → submit → respond | Workflow trạng thái đúng; deadline tính đúng theo `promotionUtils` | P1 | Manual |
| F6 | Rank declaration | Lập kê khai quân hàm → duyệt | `RankDeclarationStatus` chuyển đúng; lock khi UNDER_REVIEW | P1 | Manual |
| F7 | Career/Education/Family | Thêm/sửa/xóa qua sub-route | Gắn đúng `personnelId`, soft delete cho family | P2 | Manual |

### Nhóm G — Audit & Observability (P0)

| ID | Bước | Kết quả mong đợi | Ưu tiên | Auto/Manual |
|---|---|---|---|---|
| G1 | Export CSV/Excel/2A | Audit log có `functionCode=EXPORT_PERSONNEL`, action EXPORT, resourceId, không log dữ liệu nhạy cảm | P0 | Manual |
| G2 | Approve/reject khen thưởng, đổi trạng thái | Có audit với context đầy đủ | P0 | Manual |
| G3 | Log không chứa secret/OTP/CCCD thô | Rà log sau các thao tác trên | P0 | Manual |

---

## 4. Test tự động hiện có (vitest)

Chạy: `npm run test` (hoặc `npx vitest run <path>`). Phủ coverage: xem `vitest.config.ts`.

| File | Bao phủ | Case map |
|---|---|---|
| `lib/services/__tests__/personnel-scope.test.ts` | Scope filtering của `PersonnelService.exportData` | A1–A4 |
| `lib/export/server/__tests__/csv-escape.test.ts` | Escape + chống formula injection CSV | D4 |
| `lib/export/server/__tests__/personnel-roster-excel.test.ts` | Biểu mẫu Excel trích ngang | D5 |
| `lib/export/server/__tests__/personnel-2a-document.test.ts` | Lý lịch 2A (field schema + enum) | D6 |
| `lib/rbac/__tests__/scope.test.ts` (sẵn có) | `checkScope` 4 mức | nền cho A5–A8 |

## 5. Khoảng trống & đề xuất bổ sung

- **Integration test xuyên Next route handler** (A5, A7, A8, B*, D9): khó trong vitest hiện tại →
  để dạng Manual/QA. Có thể bổ sung bằng test gọi service trực tiếp với prisma mock (mở rộng B2, E1).
- **Permission test cho sub-routes nhánh** (đảng/bảo hiểm/khen thưởng): nên thêm khi các service
  nhánh ổn định.
- **Regression**: mỗi bug production phải thêm 1 case vào bảng tương ứng + 1 test Auto nếu có seam.

## 6. Định nghĩa hoàn thành (DoD)

- Toàn bộ case P0 pass (Auto + Manual).
- `npm run test` xanh; không giảm coverage các module export/scope.
- File xuất (CSV/Excel/2A) đối chiếu đúng mẫu quy định và không lộ dữ liệu vượt scope.
