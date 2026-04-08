# SYSTEM OVERVIEW – HVHC BIGDATA

---

## 1. Mục tiêu tài liệu

Tài liệu này mô tả kiến trúc tổng thể của hệ thống HVHC BigData để Claude hiểu:
- hệ thống gồm những module nào,
- module nào là hạ tầng dùng chung,
- module nào là nghiệp vụ,
- thứ tự ưu tiên triển khai,
- quan hệ phụ thuộc giữa các module,
- nguyên tắc phát triển đồng bộ bằng AI.

Tài liệu này không đi sâu vào từng use case chi tiết, mà đóng vai trò “bản đồ tổng thể hệ thống”.

---

## 2. Kiến trúc tổng thể hệ thống

Hệ thống HVHC BigData là nền tảng quản lý dữ liệu, nghiệp vụ, báo cáo, AI và tra cứu dùng chung cho Học viện Hậu cần.

### 2.1. Các lớp chính
- Lớp giao diện người dùng: Next.js App Router
- Lớp API nghiệp vụ: Next.js API Routes
- Lớp service nghiệp vụ: `lib/services/**`
- Lớp truy cập dữ liệu: `lib/repositories/**`
- Lớp dữ liệu chuẩn hóa: PostgreSQL + Prisma
- Lớp cache / queue: Redis
- Lớp lưu trữ file: MinIO
- Lớp AI / analytics / integration: các service chuyên dụng, adapter, pipeline batch

### 2.2. Quy ước thư mục project hiện tại
- `app/`
- `components/`
- `lib/`
- `prisma/`
- `docs/`

Project hiện tại không dùng `src/`.

---

## 3. Phân loại module

### 3.1. Nhóm module hạ tầng dùng chung
Đây là các module cấp nền cho nhiều module khác:
- M01: RBAC / Auth / Scope
- M18: Template Management & Export Engine
- M19: Master Data Management (MDM)

### 3.2. Nhóm module nghiệp vụ lõi
Là các module xử lý dữ liệu nghiệp vụ chính của hệ thống:
- M02 – M17 (theo bảng UC cũ)
- M09 là module lớn về nghiên cứu khoa học
- các module khác phụ thuộc M19 cho dropdown/master data và phụ thuộc M18 cho export/report

### 3.3. Nhóm AI / Workflow / Integration
- M09: nghiên cứu khoa học, AI duplicate, AI trends
- M10: AI report
- M13: workflow engine
- M15: chatbot / trợ lý nội bộ
- các module này có thể gọi internal API của M18 và dùng dữ liệu chuẩn hóa từ M19

---

## 4. Vai trò chiến lược của M18 và M19

### 4.1. M18 – Template Management & Export Engine
M18 là module template và xuất dữ liệu dùng chung cho nhiều module. Phạm vi:
- 12 use case
- 28 endpoints
- 6 nhóm template
- stack: docxtemplater, exceljs, puppeteer, Bull/Redis, MinIO
- phụ thuộc M01 và M02–M17
- được M10, M13, M15 gọi ngược qua internal API

M18 đóng vai trò “single source of truth” cho toàn bộ logic xuất file, export batch, scheduled export, internal render cho AI/chatbot/workflow.

### 4.2. M19 – Master Data Management
M19 là module MDM trung tâm của toàn hệ thống. Phạm vi:
- 11 nhóm danh mục
- 68 bảng master data
- khoảng 1.200 bản ghi seed chuẩn ban đầu
- 22 endpoints
- dùng bởi 17 module M01–M17
- Redis cache TTL theo loại dữ liệu
- import/export Excel/CSV
- source tracking BQP/NATIONAL
- change log + sync log
- hook `useMasterData(categoryCode)` và component `MasterDataSelect` dùng bởi toàn bộ 88 UC cũ

M19 giải quyết vấn đề enum hard-code, lookup phân tán, dữ liệu chuẩn hóa không đồng nhất giữa các module.

---

## 5. Kiến trúc phụ thuộc giữa các module

### 5.1. Phụ thuộc nền
- M01 cấp auth, role, function code, scope
- M19 cấp master data cho dropdown, filter, lookup, form editor, rule engine
- M18 cấp template, export, report rendering

### 5.2. Phụ thuộc nghiệp vụ
- Các module nghiệp vụ M02–M17 đọc dữ liệu từ M19
- Các module nghiệp vụ gọi M18 để xuất file, biểu mẫu, báo cáo
- M09 vừa là module nghiệp vụ lớn, vừa có AI/integration riêng

### 5.3. Phụ thuộc AI / workflow
- M10, M13, M15 có thể gọi internal render của M18
- AI modules nên đọc dữ liệu chuẩn hóa từ M19 và dữ liệu nghiệp vụ từ module gốc

---

## 6. Thứ tự ưu tiên triển khai

### Ưu tiên 1 – M19
Làm trước để:
- chuẩn hóa toàn bộ master data,
- thay enum hard-code bằng lookup có quản trị,
- tạo hook tái sử dụng cho mọi form/dropdown,
- giảm nợ kỹ thuật cho toàn hệ thống.

### Ưu tiên 2 – M18
Làm sau M19 để:
- tập trung toàn bộ logic export vào một nơi,
- bỏ xuất file rải rác ở từng module,
- cấp năng lực export/report cho M10, M13, M15.

### Ưu tiên 3 – mở rộng các module nghiệp vụ lớn
- M09 và các module lõi khác
- refactor dần các module cũ sang dùng M19 và M18

---

## 7. Nguyên tắc phát triển bằng Claude

### 7.1. Mỗi module phải có design docs riêng
Mỗi module cần:
- 1 overview
- 1 hoặc nhiều file use case chi tiết
- 1 prompt pack

### 7.2. Claude phải làm theo phase
Mỗi use case triển khai theo phase:
1. đọc overview
2. đọc use case
3. mapping codebase
4. schema
5. validator/repository
6. service
7. API
8. UI
9. review

### 7.3. Không code cả module chỉ bằng một prompt ngắn
Với module lớn như M18, M19, M09, Claude phải được tách design theo cụm chức năng.

---

## 8. Kiến trúc code chuẩn cho mọi module

### 8.1. API routes
- `app/api/**/route.ts`

### 8.2. Pages UI
- `app/**/page.tsx`

### 8.3. Components
- `components/**`

### 8.4. Services
- `lib/services/**`

### 8.5. Repositories
- `lib/repositories/**`

### 8.6. Validators
- `lib/validators/**`

### 8.7. Prisma
- `prisma/schema.prisma`

---

## 9. Định hướng chuẩn hóa toàn hệ thống

### 9.1. Lookup / dropdown / filter
- mọi dropdown nên đọc từ M19
- tránh hard-code enum tại UI

### 9.2. Export / report / file generation
- mọi export nên đi qua M18
- tránh viết logic export rải rác trong từng module

### 9.3. AI / analytics
- dùng adapter/integration layer rõ ràng
- không nhúng mô hình AI trực tiếp vào UI module nghiệp vụ nếu không cần

### 9.4. Audit / change log / sync log
- các module hạ tầng phải hỗ trợ audit
- M19 phải có change log và sync log
- M18 phải có export jobs / analytics / lịch sử version

---

## 10. Notes for Claude

- Đây là file bản đồ tổng thể hệ thống
- Khi làm module M19, M18 hoặc module lớn khác, phải đọc file này trước
- M19 và M18 là module hạ tầng, không được đơn giản hóa như module nghiệp vụ CRUD thông thường
- Luôn giữ đúng kiến trúc `app/`, `lib/`, `components/`, `prisma/`, `docs/`