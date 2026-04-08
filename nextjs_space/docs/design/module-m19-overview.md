# MODULE M19 – MASTER DATA MANAGEMENT (MDM)

---

## 1. Mục tiêu module

Xây dựng module Master Data Management dùng chung cho toàn hệ thống HVHC BigData nhằm:
- chuẩn hóa toàn bộ danh mục dùng chung,
- loại bỏ enum hard-code rải rác trong code và database,
- cung cấp lookup API thống nhất cho tất cả form, filter, dropdown,
- hỗ trợ quản trị danh mục, import/export, cache, sync, audit.

---

## 2. Thông tin tổng quan

- Mã module: M19
- Tên module: Master Data Management
- Vai trò: module hạ tầng dùng chung
- Dùng bởi: 17 module M01–M17
- Số nhóm danh mục: 11
- Số bảng master data: 68
- Số seed items chuẩn ban đầu: khoảng 1.200
- Số API endpoints: 22
- Stack: Next.js 14 + Prisma + PostgreSQL + Redis
- RBAC:
  - `MANAGE_MASTER_DATA`
  - `VIEW_MASTER_DATA`

---

## 3. Vấn đề M19 giải quyết

Trước khi có M19, hệ thống có các vấn đề:
- enum và lookup bị hard-code trong nhiều module
- dữ liệu danh mục trùng lặp, không thống nhất
- thêm giá trị mới phải sửa code
- thiếu lịch sử thay đổi
- thiếu cơ chế sync với danh mục chuẩn từ BQP/Nhà nước
- dropdown ở nhiều form gọi DB trực tiếp, khó cache và khó tái sử dụng

M19 được thiết kế để giải quyết các vấn đề này bằng kiến trúc MDM tập trung.

---

## 4. Nguyên tắc thiết kế MDM

### MDM-01. Generic Lookup Table
Một schema lookup chung để quản lý nhiều danh mục.

### MDM-02. Code + Name phân biệt
Mỗi item có `code` bất biến dùng trong code, và tên hiển thị `nameVi`, `nameEn`.

### MDM-03. Hierarchical Support
Danh mục phân cấp dùng `parentCode`, hỗ trợ cây nhiều cấp.

### MDM-04. Soft Delete + Versioning
Không xóa cứng. Dùng `isActive`, `validFrom`, `validTo` để bảo toàn giá trị lịch sử.

### MDM-05. BQP Source Tracking
Có `sourceType` và `externalCode` để biết nguồn gốc LOCAL / BQP / NATIONAL / ISO.

### MDM-06. Redis Cache
`GET /api/master-data/{categoryCode}` được cache Redis theo TTL để giảm DB hit.

### MDM-07. Seed Data Versioned
Seed được version hóa để replay / rollback / audit.

### MDM-08. Import / Export Excel
Admin có thể cập nhật danh mục mà không cần developer sửa code.

---

## 5. 11 nhóm danh mục chính

Ví dụ các nhóm lớn:
1. Cấp bậc / quân hàm / chức vụ
2. Tổ chức đơn vị
3. Địa lý / địa danh
4. Đảng / chính trị
5. Tài chính / chính sách
6. Cán bộ / nhân sự
7. Học hàm / học vị / đào tạo
8. Khen thưởng / kỷ luật
9. Đào tạo / nghiên cứu khoa học
10. Trang bị / kho / file / hệ thống
11. Cấu hình / năm học / hệ thống động

---

## 6. Các bảng lõi của M19

### 6.1. MasterCategory
Bảng nhóm danh mục.

### 6.2. MasterDataItem
Bảng giá trị lookup trung tâm.

### 6.3. MasterDataChangeLog
Audit trail mọi thay đổi.

### 6.4. MasterDataSyncLog
Lịch sử đồng bộ từ nguồn ngoài.

Ngoài ra hệ thống có 68 bảng master data logic/lookup theo danh mục sử dụng.

---

## 7. Vai trò của M19 trong hệ thống

### 7.1. Read layer dùng chung
- `GET /api/master-data/{categoryCode}`
- `GET /api/master-data/{categoryCode}/tree`
- `useMasterData(categoryCode)`
- `MasterDataSelect`

### 7.2. Admin layer
- CRUD category
- CRUD item
- tree editor
- import/export
- change log viewer

### 7.3. Sync / cache / analytics
- sync BQP / National
- cache stats / flush
- usage analytics

---

## 8. Use Cases nội bộ của M19

### UC-M1
Quản lý danh mục và item cơ bản

### UC-M2
Theo dõi lịch sử thay đổi / change log

### UC-M3
Import danh mục từ Excel/CSV

### UC-M4
Export danh mục

### UC-M5
Sync với BQP/Nhà nước

### UC-M6
Quản lý cache

### UC-M7
Usage analytics

### UC-M8
Hook + component dùng lại cho toàn hệ thống
- `useMasterData`
- `MasterDataSelect`

---

## 9. Kiến trúc code cho project hiện tại

### API
- `app/api/master-data/**`
- `app/api/admin/master-data/**`

### UI
- `app/dashboard/admin/master-data/**`

### Components
- `components/master-data/**`

### Services
- `lib/services/master-data/**`

### Repositories
- `lib/repositories/master-data/**`

### Hooks
- `hooks/useMasterData.ts`

### Shared UI
- `components/shared/MasterDataSelect.tsx`

### Prisma
- `prisma/schema.prisma`

---

## 10. Phase triển khai M19

### Phase 1 – Core MDM
- schema 4 bảng lõi
- public lookup API
- Redis cache
- hook `useMasterData`
- `MasterDataSelect`

### Phase 2 – Admin CRUD
- category list
- item CRUD
- hierarchical tree
- change log

### Phase 3 – Import / Export / Sync / Cache / Analytics
- import wizard
- export Excel
- sync monitor
- cache dashboard
- usage analytics

---

## 11. Notes for Claude

- M19 là module hạ tầng, không phải CRUD danh mục đơn giản
- Phải ưu tiên tính generic, cache, audit, source tracking, import/export
- Hook `useMasterData` và `MasterDataSelect` là deliverable rất quan trọng
- Mọi module khác về sau phải ưu tiên dùng M19 thay cho hard-code enum