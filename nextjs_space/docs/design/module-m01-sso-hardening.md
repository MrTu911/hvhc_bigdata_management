# MODULE M01 – SSO BQP & HARDENING
# UC-07, UC-08

---

## 1. Mục tiêu

Xây dựng:
- tích hợp SSO BQP theo OIDC/SAML,
- cơ chế map định danh quân nhân và đơn vị,
- hardening lớp bảo mật:
  - secret management
  - rate limit
  - HTTPS / security headers
  - chống brute-force
  - loại bỏ credential hard-code

---

## 2. Use Cases liên quan

### UC-07 – SSO tích hợp BQP
- OIDC/SAML 2.0
- custom provider cho NextAuth
- claims quân sự:
  - military_id
  - unit_code
  - rank
- upsert user lần đầu đăng nhập
- map `unit_code BQP → unitId HVHC`
- hỗ trợ song song:
  - local auth
  - BQP SSO

### UC-08 – Hardening bảo mật
- chuyển credentials ra env/secret manager
- rate limiting
- HTTPS only
- security headers
- anti brute-force
- secure cookie/session config
- kiểm tra input và upload policy

---

## 3. Data Model / Config

### 3.1. User extension cho SSO
Nếu chưa có:
- `militaryId`
- `authProvider`
- `lastSsoLoginAt`
- `unitId`

### 3.2. System config
Một phần config nên đọc từ:
- env
- secret manager
- hoặc M19 `MD_SYSTEM_CONFIG` với các giá trị không quá nhạy cảm

### 3.3. Lookup liên quan
Từ M19:
- `MD_SCOPE_LEVEL`
- `MD_SYSTEM_CONFIG`

---

## 4. Business Rules

### 4.1. Dual login mode
Hệ thống cho phép song song:
- Local Auth + MFA
- BQP SSO

### 4.2. SSO onboarding
- nếu `unit_code` không map được sang Unit nội bộ → báo lỗi phù hợp
- first-login có thể upsert user theo `militaryId`

### 4.3. Secret handling
- không được hard-code credentials trong source code
- secret phải lấy từ env hoặc secret source phù hợp

### 4.4. Rate limit
- login route phải có rate limiting
- OTP verify route phải có rate limiting
- admin routes nhạy cảm nên có policy riêng nếu cần

### 4.5. HTTPS & headers
- production phải ép HTTPS
- set security headers
- cookie/session phải secure

---

## 5. Validation Rules

- OIDC config phải đủ:
  - issuer
  - clientId
  - clientSecret
- claims mapping phải hợp lệ
- `militaryId` không được trùng sai logic
- unit mapping phải thành công trước khi cấp quyền đầy đủ
- rate limit config phải nằm trong ngưỡng an toàn

---

## 6. API / Integration Contract

### SSO
- auth entrypoint qua NextAuth/custom provider
- callback handler
- account linking flow nếu có

### Hardening
- rate limit middleware cho:
  - `/api/auth/login`
  - `/api/auth/mfa/verify`
  - routes admin nhạy cảm

### Security config
- central security config service nếu cần

---

## 7. UI / Pages

### Pages
- `app/auth/login/page.tsx`
- `app/auth/error/page.tsx`
- `app/dashboard/admin/security/hardening/page.tsx`

### Components
- `components/security/login/login-method-selector.tsx`
- `components/security/login/sso-bqp-button.tsx`
- `components/security/hardening/security-config-panel.tsx`

---

## 8. Kiến trúc code

### Auth / SSO
- `lib/auth/bqp-sso-provider.ts`
- `lib/auth/auth-options.ts`

### Security services
- `lib/services/security/rate-limit.service.ts`
- `lib/services/security/security-config.service.ts`

### Middleware
- `middleware.ts`
- `lib/security/security-headers.ts`
- `lib/security/rate-limit.ts`

### Integration
- `lib/integrations/bqp-sso/**`

---

## 9. Phase triển khai cho Claude

### Phase 1
- secret cleanup design
- rate limit middleware scaffold
- security headers scaffold

### Phase 2
- BQP SSO provider + mapping flow

### Phase 3
- hardening dashboard / config panel
- final tightening for login/auth routes

---

## 10. Notes for Claude

- SSO phải làm theo adapter rõ ràng, không nhúng rối vào login route
- Hardening là phần bảo vệ production, không được xem là “nice to have”
- Nếu env/secret manager chưa sẵn, phải scaffold rõ abstraction để thay sau
- Không được để credential hard-code tồn tại sau khi hoàn thành UC-08