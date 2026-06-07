# Sidebar IA Redesign (v9) — Sắp xếp lại hệ thống chức năng trên menu

> Phạm vi: **chỉ tổ chức lại menu/sidebar** (menu-config + i18n + component). KHÔNG đụng route, page, API hay dữ liệu.
> Trạng thái: **Đã triển khai Phase 1.** Phần audit trùng lặp route ở cuối là backlog cho Phase 2 (tách riêng).

---

## 1. Context — Tại sao đổi

Menu cũ có **19 nhóm cấp 1 phẳng** (`MENU_CONFIG` trong [lib/menu-config.ts](../../lib/menu-config.ts)), gây 4 vấn đề:

1. **Chức năng cá nhân hóa bị xé thành 3 nhóm** (`personalSpace`, `myLearning`, `myResearchSpace`) → khó tìm "của tôi".
2. **Nhóm quá tải, phẳng**: Giáo dục ~29 mục, Khoa học ~25, Quản trị ~25 mục trong một danh sách dài không phân cấp.
3. **Trùng/khó phân biệt ở tầng menu**: `CSDL Nghiên cứu KH (M09)` vs `CSDL Khoa học Quản lý (M20–M26)`; `BigData` vs `Hạ tầng & Dữ liệu`; `Công việc của tôi` xuất hiện 2 chỗ.
4. **Thứ tự chưa "khoa học"**: nhóm dùng-chung (AI, ML, hạ tầng) trộn lẫn với CSDL nghiệp vụ.

Yêu cầu: **gom chức năng cá nhân vào 1 nhóm**, **các chức năng khác quản lý theo từng CSDL**, dễ dùng, không trùng lặp.

---

## 2. Current state (trước)

- 19 nhóm cấp 1, **render phẳng 2 cấp** (group → item). `MenuItem.children` có trong type nhưng component **không render**.
- `filterMenu()` khử trùng theo `href` (lần đầu thắng) nhưng các helper `getAllMenuFunctions` / `getFunctionMenuMap` **không đệ quy** children.
- 2 consumer: [components/dashboard/sidebar-enhanced.tsx](../../components/dashboard/sidebar-enhanced.tsx) (sidebar thật) và [components/dashboard/admin/rbac/sidebar-preview-tab.tsx](../../components/dashboard/admin/rbac/sidebar-preview-tab.tsx) (preview RBAC) — cả hai đều giả định cấu trúc phẳng.
- Nhãn i18n ở [components/providers/translations-data.ts](../../components/providers/translations-data.ts) (khối `vi` + `en`).

## 3. Target state (sau — IA v9)

**14 nhóm cấp 1 / 5 lớp**, hỗ trợ **menu con 3 cấp** (group → sub-section → item). Sub-section = `MenuItem` không có `href`, có `children`, `functions: []`.

```
LỚP 1 · TỔNG QUAN
  1. Tổng quan & Giám sát            nav.overview            (Dashboard chính/chỉ huy/tự động + Cảnh báo + Realtime)

LỚP 2 · CÁ NHÂN  ← gom 1 nhóm duy nhất
  2. Không gian Cá nhân              nav.personalSpace
       › Hồ sơ & Tài khoản           (Hồ sơ, Dashboard cá nhân, Việc của tôi, Thông báo, Bảo mật, Cài đặt, Trung tâm cá nhân)
       › Hồ sơ cán bộ của tôi        (Quá trình công tác, Chính sách, Bảo hiểm, Khen thưởng — của tôi)
       › Học tập của tôi             (Điểm, Rèn luyện, TKB, Tốt nghiệp)
       › Nghiên cứu của tôi          (Đề tài, Công bố, Lý lịch KH)

LỚP 3 · CÁC CSDL NGHIỆP VỤ  ← quản lý theo từng CSDL
  3. CSDL Cán bộ, Quân nhân          nav.personnelDatabase   (5 mục con)
  4. CSDL Chính trị — Đảng viên      nav.partyDatabase       (6 mục con)
  5. CSDL Chính sách & Chế độ        nav.policyDatabase      (phẳng, 8)
  6. CSDL Thi đua — Khen thưởng      nav.awardsDatabase      (phẳng, 5)   ← giữ riêng, đặt cạnh 5 & 7
  7. CSDL Bảo hiểm Xã hội            nav.insuranceDatabase   (phẳng, 9)
  8. CSDL Giáo dục — Đào tạo         nav.educationDatabase   (5 mục con: Tổng quan/Giảng viên/Người học/Chương trình/Khảo thí)
  9. CSDL Khoa học & Công nghệ       nav.scienceTech         ← GỘP M09 + M20–M26
       › Nghiên cứu & Công bố (M09)
       › Hoạt động & Đề tài KH (M20–M26)
       › Nhà KH & Hội đồng
       › Tài chính & Kinh phí KH
       › Dữ liệu, Thư viện & Báo cáo KH

LỚP 4 · NỀN TẢNG & VẬN HÀNH  ← dùng chung, không thuộc 1 CSDL
 10. Quy trình & Văn bản số          nav.workflowDocuments   (phẳng, 5)
 11. Mẫu biểu & Xuất dữ liệu         nav.templateExport      (phẳng, 3)
 12. Phân tích, Báo cáo & AI         nav.analyticsAI         (3 mục con: Phân tích & Báo cáo / Trợ lý AI / Machine Learning)
 13. Khai thác & Hạ tầng Dữ liệu     nav.bigdataInfra        ← GỘP BigData + Hạ tầng/Governance
       › Khai thác Dữ liệu (BigData)
       › Hồ dữ liệu & ETL
       › Bảo mật & Quản trị DL

LỚP 5 · QUẢN TRỊ
 14. Quản trị Hệ thống              nav.systemAdmin         (5 mục con: Tài khoản&Phân quyền / Tổ chức / Dữ liệu&Liên kết / Hạ tầng&Tích hợp / Giám sát&Kiểm toán)
```

**Số liệu:** 14 nhóm cấp 1 · 36 sub-section · 208 item lá · **0 href trùng** (đã kiểm).

### Quyết định thiết kế (đã chốt với người dùng)
- **Cá nhân hóa → 1 nhóm** `nav.personalSpace` (gộp 3 nhóm cũ + đưa "Dashboard cá nhân" và "Cài đặt tài khoản" về đây). Nhóm `nav.settings` đứng độc lập cũ được bỏ.
- **Mỗi CSDL = 1 nhóm cấp 1.** Nhóm lớn dùng sub-section để gọn.
- **Khoa học: gộp 1 nhóm cha, mục con M09 vs M20–M26.** Dữ liệu/model **vẫn tách** (đúng CLAUDE.md §0.1 — chỉ gộp ở tầng trình bày menu).
- **Chính sách/Thi đua/Bảo hiểm: giữ 3 CSDL riêng**, xếp cạnh nhau.
- **Khử trùng:** "Công việc của tôi" (`/dashboard/workflow/my-work`) đặt canonical ở nhóm Cá nhân; bỏ bản trùng trong nhóm Quy trình.

---

## 4. Compatibility plan

- **Không phá contract:** mọi `href` và `functions` của item lá **giữ nguyên** → RBAC filter, route, deep-link không đổi.
- `filterMenuItem()` nâng cấp để **đệ quy children** và **bỏ sub-section rỗng sau filter** (group tự ẩn nếu user không có quyền nào bên trong).
- Helper `getAllMenuFunctions` / `getFunctionMenuMap` / `getRequiredFunctions` dùng `flattenMenuItems()` mới → đệ quy children, RBAC tooling chính xác.
- 2 consumer cập nhật children-aware; preview RBAC đếm/hiển thị theo **item lá** (`flattenMenuItems`).

## 5. Files đã sửa (Phase 1)

| File | Thay đổi |
|---|---|
| [lib/menu-config.ts](../../lib/menu-config.ts) | Viết lại `MENU_CONFIG` theo IA v9; thêm `subSection()`; thêm `flattenMenuItems()`; `filterMenuItem` + 3 helper đệ quy children |
| [components/dashboard/sidebar-enhanced.tsx](../../components/dashboard/sidebar-enhanced.tsx) | Render accordion cấp 2 (`renderSubSection`/`renderMenuItem`); auto-expand cả group + sub-section chứa trang active; thu gọn icon-mode phẳng leaf; đếm theo leaf; accent cho nhóm mới |
| [components/dashboard/admin/rbac/sidebar-preview-tab.tsx](../../components/dashboard/admin/rbac/sidebar-preview-tab.tsx) | Phẳng leaf để liệt kê + đếm đúng; accent nhóm mới |
| [components/providers/translations-data.ts](../../components/providers/translations-data.ts) | Thêm ~30 key i18n (vi + en) cho nhóm cấp 1 mới + nhãn sub-section |

**Kiểm tra:** `tsc --noEmit` = 0 lỗi toàn dự án; eslint file đã sửa = 0 warning.

## 6. Rollback

Thay đổi cô lập trong 4 file UI/config, không migration DB. Rollback = `git revert` commit. `localStorage["sidebar_collapsed_groups"]` lưu thêm key sub-section nhưng tương thích ngược (key lạ bị bỏ qua), không cần xóa.

---

## 7. Audit trùng lặp ROUTE — Backlog Phase 2 (CHƯA làm, ngoài phạm vi)

Các vùng route trùng/chồng lấn nên hợp nhất hoặc redirect ở phase sau (đụng page → rủi ro trung bình, cần dual-read/redirect 301):

| Vùng | Route chồng lấn | Ghi chú |
|---|---|---|
| Dữ liệu | `/dashboard/data/*`, `/dashboard/datalake`, `/dashboard/bigdata/*` | 3 entry-point cùng miền; cân nhắc bigdata làm hub chuẩn |
| AI/ML | `/dashboard/ai`, `/ai-advisor`, `/ai-monitor`, `/ai-personnel`, `/ai-training`, `/ml/*` | `ai-training` vs `ml/training` khả năng trùng |
| Giám sát | `/dashboard/monitoring`, `/alerts`, `/monitoring/realtime`, `/system/health` | nhiều dashboard giám sát |
| Bảo mật/Governance | `/security/*`, `/governance/*`, `/bigdata/security`, `/bigdata/audit`, `/admin/security/hardening` | rải nhiều nơi |
| Khoa học | `/research/*` (M09) vs `/science/*` (M20–M26) | **giữ tách dữ liệu** theo CLAUDE.md; chỉ gộp menu (đã làm) |
| Khen thưởng | `/emulation` vs `/policy/rewards` vs `/party/awards` | 3 phạm vi khác nhau — nhiều khả năng cố ý, cần xác nhận nghiệp vụ |

> Nguyên tắc Phase 2 (theo `.claude/rules/migration-refactor.md`): reuse trước, redirect 301 giữ link cũ, không drop route khi còn consumer.

## 8. Verification (cách kiểm tra Phase 1)

1. `npm run dev`, đăng nhập tài khoản **admin** → sidebar hiện đủ 14 nhóm; mở/thu được sub-section; trạng thái lưu qua reload (localStorage).
2. Mở một trang sâu (vd `/dashboard/education/grades`) → group **CSDL Giáo dục** và sub-section **Quản lý Người học** tự bung.
3. Đăng nhập tài khoản **scope hẹp** (vd học viên) → chỉ thấy nhóm Cá nhân + CSDL được cấp; sub-section rỗng tự ẩn.
4. `/dashboard/admin/rbac` → tab **Xem trước Sidebar**: chọn chức vụ, số "mục" đếm theo item lá khớp sidebar thật.
5. Thu gọn sidebar (icon-only) → các item lá hiện phẳng dạng icon, không vỡ.
