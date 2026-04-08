# MODULE M01 – AUTH & RBAC
# UC-01, UC-02, UC-03, UC-04

---

## 1. Mục tiêu

Xây dựng lõi xác thực và phân quyền của hệ thống:
- MFA/OTP
- RBAC 4 tầng
- scope engine
- unit tree phục vụ kiểm soát dữ liệu theo phân cấp quân sự

---

## 2. Use Cases liên quan

### UC-01 – Xác thực đa yếu tố (MFA/OTP)
- nâng cấp NextAuth.js
- hỗ trợ TOTP 6 chữ số
- sau password đúng, nếu `mfaEnabled = true` thì yêu cầu OTP
- sai OTP 3 lần → lock 15 phút
- access token 1h + refresh token 7d
- ghi audit thành công/thất bại

### UC-02 – Quản lý Role – Position – Function Code
- role hệ thống
- position thực tế
- function code chi tiết
- userPosition mapping
- positionFunction mapping
- 151+ function code seed tự động

### UC-03 – Scope Engine
- SELF
- UNIT
- DEPARTMENT
- ACADEMY

Mục tiêu là mọi API nghiệp vụ đều đi qua `checkScopeAccess()` đúng logic phân cấp.

### UC-04 – Quản lý cơ cấu tổ chức (Unit tree)
- đơn vị phân cấp
- unit code / bqp code
- parent-child tree
- dùng cho scope UNIT / DEPARTMENT / ACADEMY

---

## 3. Data Model

### 3.1. Role

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| code | string | yes | unique, ví dụ ADMIN |
| name | string | yes | tên hiển thị |
| description | string | no | mô tả |
| isSystem | boolean | yes | không cho xóa nếu true |
| createdAt | DateTime | yes | tạo |

### 3.2. Position

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| code | string | yes | unique |
| name | string | yes | tên chức danh |
| roleId | string | yes | FK Role |
| defaultScope | Scope | yes | scope mặc định |
| createdAt | DateTime | yes | tạo |

### 3.3. FunctionCode

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| code | string | yes | unique |
| module | string | yes | ví dụ M02, M09 |
| description | string | yes | mô tả |
| category | string | yes | VIEW/CREATE/UPDATE/DELETE/APPROVE/EXPORT |

### 3.4. PositionFunction

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| positionId | string | yes | FK Position |
| functionCodeId | string | yes | FK FunctionCode |

### 3.5. UserPosition

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| userId | string | yes | FK User |
| positionId | string | yes | FK Position |
| scopeOverride | Scope | no | ghi đè scope nếu có |
| unitId | string | no | đơn vị áp dụng |
| departmentId | string | no | khoa/phòng áp dụng |
| isPrimary | boolean | yes | vị trí chính |
| activeFrom | DateTime | no | hiệu lực từ |
| activeTo | DateTime | no | hiệu lực đến |

### 3.6. Unit

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| code | string | yes | unique |
| name | string | yes | tên đơn vị |
| parentId | string | no | self reference |
| level | int | yes | cấp cây |
| type | string | no | loại đơn vị |
| bqpCode | string | no | mã BQP |
| isActive | boolean | yes | active |
| sortOrder | int | yes | thứ tự |

### 3.7. MFA / User auth extension
Nếu User hiện tại chưa có các trường sau thì cần bổ sung:
- `passwordHash`
- `mfaEnabled`
- `mfaSecret`
- `failedLoginCount`
- `lockedUntil`
- `authProvider`
- `militaryId`
- `lastSsoLoginAt`

---

## 4. Enums chính

### Scope
- SELF
- UNIT
- DEPARTMENT
- ACADEMY

### AuthProvider
- LOCAL
- BQP_SSO

---

## 5. Business Rules

### 5.1. RBAC 4 tầng
Quyền truy cập được xác định bởi:
1. Role
2. Position
3. FunctionCode
4. Scope

### 5.2. Không được rút gọn về role-only
Một user có thể có nhiều position, mỗi position có thể mang function code khác nhau.

### 5.3. Scope engine
- SELF: chỉ dữ liệu của chính user
- UNIT: dữ liệu trong đơn vị
- DEPARTMENT: dữ liệu trong khoa/phòng cụ thể
- ACADEMY: toàn học viện

### 5.4. OTP
- đúng password mới sang OTP
- OTP TOTP 6 chữ số
- sai 3 lần → lock 15 phút

### 5.5. Unit tree
- đơn vị phải support parent-child
- unit tree là nền cho scope engine

---

## 6. Validation Rules

- `role.code`, `position.code`, `functionCode.code`, `unit.code` phải unique
- `defaultScope` phải hợp lệ
- `scopeOverride` nếu có phải hợp lệ
- `departmentId` chỉ dùng khi scope là DEPARTMENT hoặc tương đương
- không gán position hết hiệu lực cho user active
- unit tree không được tạo vòng lặp

---

## 7. API Contract

### Auth
- `POST /api/auth/login`
- `POST /api/auth/mfa/verify`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### RBAC
- `GET /api/admin/rbac/roles`
- `POST /api/admin/rbac/roles`
- `GET /api/admin/rbac/positions`
- `POST /api/admin/rbac/positions`
- `GET /api/admin/rbac/function-codes`
- `POST /api/admin/rbac/assign-position`
- `POST /api/admin/rbac/assign-function`

### Scope / Permission check
- internal service/middleware, không nhất thiết public API riêng

### Org
- `GET /api/admin/org/units`
- `POST /api/admin/org/units`
- `PUT /api/admin/org/units/[id]`

---

## 8. UI / Pages

### Pages
- `app/dashboard/admin/security/login/page.tsx`
- `app/dashboard/admin/rbac/page.tsx`
- `app/dashboard/admin/org/page.tsx`

### Components
- `components/security/login-form.tsx`
- `components/security/mfa-verify-form.tsx`
- `components/rbac/role-table.tsx`
- `components/rbac/position-manager.tsx`
- `components/rbac/function-code-table.tsx`
- `components/org/unit-tree-manager.tsx`

---

## 9. Kiến trúc code

### Services
- `lib/services/auth/auth.service.ts`
- `lib/services/auth/mfa.service.ts`
- `lib/services/rbac/rbac.service.ts`
- `lib/services/rbac/scope-engine.service.ts`
- `lib/services/org/unit-tree.service.ts`

### Repositories
- `lib/repositories/security/auth.repo.ts`
- `lib/repositories/security/rbac.repo.ts`
- `lib/repositories/security/unit.repo.ts`

### Middleware
- `lib/auth/checkScopeAccess.ts`
- `lib/auth/requireFunctionCode.ts`

---

## 10. Phase triển khai cho Claude

### Phase 1
- schema Role / Position / FunctionCode / UserPosition / Unit
- enum Scope
- seed function codes

### Phase 2
- login + MFA verify
- RBAC admin APIs

### Phase 3
- scope engine middleware
- unit tree UI/admin

---

## 11. Notes for Claude

- M01 phải dùng M02 User/Personnel/Unit nếu schema thực tế đã có sẵn
- Không tạo song song hai hệ User nếu project đã có model User
- Scope engine là phần bắt buộc phải kiểm tra lại kỹ với code hiện có
- `DEPARTMENT` scope là điểm cần ưu tiên sửa đúng theo tài liệu