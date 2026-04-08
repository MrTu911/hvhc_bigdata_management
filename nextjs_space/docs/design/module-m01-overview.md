# MODULE M01 – HỆ THỐNG QUẢN TRỊ & BẢO MẬT

---

## 1. Mục tiêu module

M01 là lớp bảo mật và quản trị nền tảng của toàn hệ thống HVHC BigData, có nhiệm vụ:
- xác thực người dùng,
- phân quyền theo mô hình quân sự nhiều tầng,
- kiểm soát phạm vi dữ liệu,
- ghi nhật ký hoạt động toàn diện,
- quản lý phiên đăng nhập và bảo mật session,
- tích hợp SSO với BQP,
- hardening toàn bộ lớp truy cập.

M01 là module bắt buộc số 1. Không module nghiệp vụ nào được production khi M01 chưa hoàn thiện.

---

## 2. Thông tin tổng quan

- Mã module: M01
- Tên module: Hệ thống Quản trị & Bảo mật
- Phiên bản thiết kế: v1.0/2026
- Ưu tiên: P1 – bắt buộc trước triển khai
- Số use case: 8
- Tổng chi phí sơ bộ: 152,9 triệu VNĐ
- RBAC prefix:
  - `SYS.*`
  - `ADMIN.*`
  - `AUTH.*`

---

## 3. Vấn đề hiện tại M01 phải giải quyết

Tài liệu kỹ thuật xác định 4 lỗ hổng nghiêm trọng phải đóng trước khi go-live:

1. `DEPARTMENT` scope chưa được implement đầy đủ trong `checkScopeAccess()`
2. Chưa có MFA/OTP
3. Credential đang bị hard-code trong source code
4. Thiếu rate limiting

Ngoài ra M01 còn phải chuẩn hóa:
- RBAC 4 tầng
- audit trail
- session revocation
- SSO BQP
- hardening HTTPS / secrets / headers / brute-force protection

---

## 4. 8 Use Cases của M01

- UC-01: Xác thực đa yếu tố (MFA/OTP) – nâng cấp NextAuth.js
- UC-02: Quản lý Role – Position – Function Code
- UC-03: Scope Engine: SELF → UNIT → DEPARTMENT → ACADEMY
- UC-04: Quản lý cơ cấu tổ chức (Unit tree)
- UC-05: Audit Log toàn diện
- UC-06: Quản lý phiên đăng nhập & bảo mật session
- UC-07: SSO tích hợp BQP (OIDC/SAML)
- UC-08: Hardening bảo mật: credentials, rate limit, HTTPS

---

## 5. Vai trò trong toàn hệ thống

### 5.1. Cấp quyền cho toàn bộ module
M01 là nguồn gốc của:
- xác thực
- function code
- role/position
- scope dữ liệu
- audit log
- session control

### 5.2. Tác động trực tiếp đến các module khác
- M02: hồ sơ cán bộ, dữ liệu nhạy cảm
- M03: dữ liệu chính trị/đảng viên nhạy cảm
- M05: dữ liệu chính sách, khen thưởng, kỷ luật
- M09: phê duyệt đề tài, truy cập dữ liệu khoa học
- M10: đào tạo, điểm, hồ sơ người học
- M13: workflow phê duyệt
- M18: export theo scope
- M19: admin master data

### 5.3. Tích hợp với M19
M01 nên dùng lookup chuẩn từ M19 cho:
- `MD_SCOPE_LEVEL`
- `MD_SYSTEM_CONFIG`
- một số category hệ thống khác nếu cần

---

## 6. Tác nhân chính

- Admin hệ thống
- Người dùng nội bộ
- Cán bộ / giảng viên / học viên
- Quản trị bảo mật
- Hệ thống SSO BQP
- Các module nội bộ gọi auth/session/audit APIs

---

## 7. Kiến trúc chính của M01

### 7.1. Khối xác thực
- Local auth
- MFA/OTP
- refresh token
- device/session tracking

### 7.2. Khối phân quyền
- Role
- Position
- FunctionCode
- Scope

### 7.3. Khối tổ chức đơn vị
- Unit tree
- unitCode / bqpCode mapping
- hierarchy phục vụ scope

### 7.4. Khối audit & session
- audit log
- auth session
- revoke / suspicious / expire
- login history

### 7.5. Khối SSO BQP
- OIDC / SAML
- militaryId mapping
- unitCode mapping
- first-login auto link

### 7.6. Khối hardening
- secret management
- rate limit
- HTTPS / security headers
- credential hygiene

---

## 8. Kiến trúc code cho project hiện tại

### API
- `app/api/auth/**`
- `app/api/admin/security/**`
- `app/api/admin/rbac/**`
- `app/api/admin/org/**`
- `app/api/admin/audit/**`
- `app/api/admin/sessions/**`

### Pages
- `app/dashboard/admin/security/**`
- `app/dashboard/admin/rbac/**`
- `app/dashboard/admin/org/**`

### Components
- `components/security/**`
- `components/rbac/**`
- `components/org/**`

### Services
- `lib/services/auth/**`
- `lib/services/rbac/**`
- `lib/services/security/**`
- `lib/services/audit/**`

### Repositories
- `lib/repositories/security/**`

### Middleware / Auth
- `lib/auth/**`
- `middleware.ts`

### Prisma
- `prisma/schema.prisma`

---

## 9. Phase triển khai M01

### Phase 1
- RBAC schema
- scope engine
- unit tree schema
- base auth/session schema

### Phase 2
- MFA/OTP
- Role/Position/Function management
- Scope check middleware

### Phase 3
- Audit log
- session management
- revoke flows

### Phase 4
- SSO BQP integration

### Phase 5
- hardening:
  - secret cleanup
  - rate limiting
  - HTTPS/security headers
  - brute-force protection

---

## 10. Notes for Claude

- M01 không phải module CRUD admin thông thường
- M01 là lớp nền bắt buộc cho toàn hệ thống
- Không được đơn giản hóa RBAC thành role-only model
- Scope engine phải là phần lõi, không phải phụ trợ
- Audit và session không được làm ở mức “log sơ sài”
- SSO BQP phải được thiết kế theo adapter rõ ràng, không hard-code provider trực tiếp vào route