
---

# 4) `docs/design/module-m19-admin-ui.md`

```md
# MODULE M19 – ADMIN UI
# CATEGORY MANAGER + ITEM CRUD + IMPORT / TREE / CHANGE LOG

---

## 1. Mục tiêu

Xây dựng giao diện quản trị đầy đủ cho M19 để admin có thể:
- quản lý category,
- quản lý item trong từng category,
- xem cây phân cấp,
- import Excel/CSV,
- xem change log,
- sắp xếp sort order.

---

## 2. Màn hình chính

### 2.1. `/dashboard/admin/master-data`
Trang danh sách category:
- filter theo groupTag
- filter theo sourceType
- filter theo cacheType
- trạng thái active
- quick stats

### 2.2. `/dashboard/admin/master-data/[categoryCode]`
Trang item manager:
- AG Grid
- filter
- search
- inline actions
- active/inactive
- metadata viewer/editor

### 2.3. `/dashboard/admin/master-data/[categoryCode]/tree`
Trang tree editor:
- expand/collapse
- search trong cây
- drag-drop reorder
- inline edit

### 2.4. Import Wizard
Modal 3 bước:
1. Upload file
2. Preview & validate
3. Confirm import

### 2.5. Change Log Drawer
Xem lịch sử thay đổi của item:
- ai sửa
- sửa gì
- giá trị cũ / mới
- lý do
- thời gian

---

## 3. Admin API

### Category level
- `GET /api/admin/master-data/categories`
- `POST /api/admin/master-data/categories`
- `PUT /api/admin/master-data/categories/[code]`

### Item level
- `GET /api/admin/master-data/{categoryCode}/items`
- `POST /api/admin/master-data/{categoryCode}/items`
- `PUT /api/admin/master-data/{categoryCode}/items/{code}`
- `DELETE /api/admin/master-data/{categoryCode}/items/{code}`
- `POST /api/admin/master-data/{categoryCode}/items/{code}/reactivate`
- `POST /api/admin/master-data/{categoryCode}/items/bulk`
- `PUT /api/admin/master-data/{categoryCode}/sort`

### Import / Export
- `POST /api/admin/master-data/{categoryCode}/import`
- `POST /api/admin/master-data/{categoryCode}/import/{importId}/confirm`
- `GET /api/admin/master-data/{categoryCode}/export`

---

## 4. Business Rules

- Không cho deactivate item nếu đang có FK reference vượt ngưỡng cho phép
- Soft delete thay vì hard delete
- Mọi thay đổi phải ghi change log
- Import phải validate trước khi confirm
- Sort order phải được cập nhật atomically nếu có thể
- Metadata JSON phải hợp lệ

---

## 5. Validation Rules

- Category code unique
- Item code unique trong category
- Metadata phải là JSON hợp lệ
- Import file chỉ nhận format hỗ trợ
- Với import confirm, phải có import session hợp lệ
- Drag-drop reorder phải kiểm tra quyền admin

---

## 6. Kiến trúc code

### Pages
- `app/dashboard/admin/master-data/page.tsx`
- `app/dashboard/admin/master-data/[categoryCode]/page.tsx`
- `app/dashboard/admin/master-data/[categoryCode]/tree/page.tsx`

### Components
- `components/master-data/admin/category-table.tsx`
- `components/master-data/admin/item-grid.tsx`
- `components/master-data/admin/item-edit-modal.tsx`
- `components/master-data/admin/import-wizard.tsx`
- `components/master-data/admin/change-log-drawer.tsx`
- `components/master-data/admin/tree-view.tsx`

### Services
- `lib/services/master-data/master-data-admin.service.ts`
- `lib/services/master-data/master-data-import.service.ts`

### Repositories
- `lib/repositories/master-data/master-data-admin.repo.ts`

---

## 7. Phase triển khai cho Claude

### Phase 1
- category list + item grid APIs

### Phase 2
- item CRUD + change log

### Phase 3
- tree view + sort

### Phase 4
- import wizard + export

---

## 8. Notes for Claude

- Admin UI phải thiên về dữ liệu lớn, thao tác nhanh, rõ ràng
- AG Grid, tree view, modal editor, diff preview là các pattern phù hợp
- Không đơn giản hóa thành form CRUD nhỏ lẻ nếu design yêu cầu màn quản trị tập trung