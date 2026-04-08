# MODULE M01 – AUDIT LOG & SESSION SECURITY
# UC-05, UC-06

---

## 1. Mục tiêu

Xây dựng:
- audit log toàn diện cho mọi hành động quan trọng,
- quản lý phiên đăng nhập,
- revoke session,
- phát hiện session bất thường,
- làm nền cho truy vết bảo mật và điều tra sự cố.

---

## 2. Use Cases liên quan

### UC-05 – Audit Log toàn diện
- ghi log sau mọi thay đổi dữ liệu quan trọng
- login / logout
- export
- approve / reject
- read dữ liệu nhạy cảm nếu cần
- lưu old/new values
- changed fields
- ip, user-agent, session, module, functionCode

### UC-06 – Quản lý phiên đăng nhập & bảo mật session
- mỗi phiên có token/jti riêng
- lưu IP, device, loginAt, lastActivityAt, expiresAt
- revoke thủ công
- revoke do nghi ngờ bất thường
- revoke khi logout
- auto expire

---

## 3. Data Model

### 3.1. AuditLog

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| userId | string | no | FK User, null nếu system action |
| sessionId | string | no | session liên quan |
| userAgent | string | no | agent |
| ipAddress | string | no | IP |
| geoLocation | string | no | optional |
| action | AuditAction | yes | loại hành động |
| resource | string | yes | entity |
| resourceId | string | no | id entity |
| module | string | no | M02/M03/M09... |
| functionCode | string | no | mã chức năng |
| oldValues | Json | no | dữ liệu cũ |
| newValues | Json | no | dữ liệu mới |
| changedFields | string[] | yes | trường thay đổi |
| success | boolean | yes | thành công/thất bại |
| errorMessage | string | no | lỗi |
| timestamp | DateTime | yes | thời điểm |

### 3.2. AuthSession

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| userId | string | yes | FK User |
| token | string | yes | unique jti |
| ipAddress | string | no | IP |
| userAgent | string | no | agent |
| deviceName | string | no | tên thiết bị |
| isActive | boolean | yes | active |
| loginAt | DateTime | yes | login time |
| lastActivityAt | DateTime | yes | last activity |
| expiresAt | DateTime | yes | hết hạn |
| revokedAt | DateTime | no | thời điểm revoke |
| revokedReason | string | no | LOGOUT / ADMIN_REVOKE / SUSPICIOUS / EXPIRED |

### 3.3. AuditAction enum
- CREATE
- READ
- UPDATE
- DELETE
- LOGIN
- LOGOUT
- EXPORT
- APPROVE
- REJECT

---

## 4. Business Rules

### 4.1. Audit bắt buộc với hành động quan trọng
- create/update/delete
- login/logout
- export
- approve/reject
- sửa điểm, sửa hồ sơ, sửa chính sách, sửa dữ liệu nhạy cảm

### 4.2. Session revocation
- logout → revoke
- admin revoke → revoke reason = ADMIN_REVOKE
- suspicious → revoke reason = SUSPICIOUS
- expire → revoke reason = EXPIRED

### 4.3. Session validity
- access token sống ngắn
- refresh token có kiểm soát
- mỗi session phải truy vết được IP/device

### 4.4. Audit không được “best effort”
Nếu hành động nghiệp vụ đã commit nhưng audit không ghi được, hệ thống phải có cơ chế cảnh báo hoặc fallback phù hợp.

---

## 5. Validation Rules

- `token` unique
- `action` phải đúng enum
- `changedFields` là mảng chuỗi
- `timestamp`, `loginAt`, `lastActivityAt`, `expiresAt` hợp lệ
- revoke không được ghi đè sai trạng thái

---

## 6. API Contract

### Audit
- `GET /api/admin/audit`
- `GET /api/admin/audit/[id]`

### Session
- `GET /api/admin/sessions`
- `POST /api/admin/sessions/[id]/revoke`
- `GET /api/auth/sessions/me`

---

## 7. UI / Pages

### Pages
- `app/dashboard/admin/security/audit/page.tsx`
- `app/dashboard/admin/security/sessions/page.tsx`

### Components
- `components/security/audit/audit-log-table.tsx`
- `components/security/audit/audit-detail-drawer.tsx`
- `components/security/session/session-table.tsx`
- `components/security/session/revoke-session-dialog.tsx`

---

## 8. Kiến trúc code

### Services
- `lib/services/audit/audit-log.service.ts`
- `lib/services/auth/auth-session.service.ts`

### Repositories
- `lib/repositories/security/audit.repo.ts`
- `lib/repositories/security/session.repo.ts`

### Utilities
- `lib/audit/logger.ts`
- `lib/auth/session-manager.ts`

### Middleware / hooks
- audit middleware sau thay đổi dữ liệu
- session heartbeat/update last activity

---

## 9. Phase triển khai cho Claude

### Phase 1
- schema AuditLog + AuthSession

### Phase 2
- audit logger utility
- session manager

### Phase 3
- admin APIs + pages

### Phase 4
- suspicious/revoke flows + filters + search

---

## 10. Notes for Claude

- Audit phải đủ sâu cho truy vết, không chỉ log message đơn giản
- Session phải hỗ trợ revoke thực sự, không chỉ hide khỏi UI
- Nếu project đã có session table hoặc auth table, phải mapping trước khi tạo mới