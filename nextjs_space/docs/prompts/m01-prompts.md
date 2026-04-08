# M01 PROMPTS – BỘ PROMPT CHUẨN CHO MODULE QUẢN TRỊ & BẢO MẬT

---

# 1. PROMPT MỞ ĐẦU M01

## 1.1. Đọc overview
```text
Đọc:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m01-overview.md

Chưa code.

Hãy tóm tắt:
1. Vai trò của M01 trong toàn hệ thống
2. 8 use case của M01
3. 4 lỗ hổng nghiêm trọng hiện tại cần xử lý trước go-live
4. Quan hệ giữa M01 với M02, M13, M18, M19 và các module nghiệp vụ
5. Thứ tự phase triển khai hợp lý

1.2. Mapping codebase
Đọc:
- docs/design/module-m01-overview.md
- docs/design/module-m01-auth-rbac.md
- docs/design/module-m01-audit-session.md
- docs/design/module-m01-sso-hardening.md

Chưa code.

Hãy:
1. Mapping M01 vào codebase hiện tại
2. Liệt kê file cần tạo/sửa
3. Chỉ ra chỗ nào phải tái sử dụng User/Unit/session/auth hiện có
4. Nêu điểm cần xác minh trong Prisma hiện tại trước khi viết schema
5. Chia phase triển khai
2. PROMPT CHO AUTH & RBAC
2.1. Prompt mở đầu
/implement-from-design

Đọc:
- docs/design/module-m01-overview.md
- docs/design/module-m01-auth-rbac.md

Chưa code.

Hãy:
1. Tóm tắt UC-01, UC-02, UC-03, UC-04
2. Liệt kê schema RBAC cần có
3. Liệt kê APIs và middleware cần có
4. Chia phase triển khai
5. Chỉ ra phần nào phải mapping với User/Unit hiện có
2.2. Phase 1 schema
/m09-phase1-schema

Đọc docs/design/module-m01-auth-rbac.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- cập nhật prisma/schema.prisma
- thêm hoặc mapping các model:
  - Role
  - Position
  - FunctionCode
  - PositionFunction
  - UserPosition
  - Unit (nếu chưa có hoặc cần mở rộng)
- thêm enum Scope
- nếu User/Unit đã tồn tại trong schema, ưu tiên mapping/mở rộng thay vì tạo song song

Không làm API.
Không làm UI.
Không làm login flow.

Sau khi xong:
1. liệt kê models đã thêm/sửa
2. nêu relation chính
3. nêu unique/index quan trọng
4. nêu giả định kỹ thuật
5. đưa lệnh prisma tiếp theo
2.3. Phase 2 login + MFA
Đọc docs/design/module-m01-auth-rbac.md.

Triển khai Phase 2.

Yêu cầu:
- scaffold login flow
- scaffold MFA verify flow
- hỗ trợ:
  - password check
  - nếu mfaEnabled=true thì yêu cầu OTP
  - sai OTP 3 lần thì lock 15 phút
- chưa cần UI đẹp hoàn chỉnh, nhưng API/service phải rõ

Sau khi xong:
- nêu flow login
- nêu response shape
- nêu chỗ nào phải hook vào NextAuth hoặc auth framework hiện có
2.4. Phase 3 RBAC admin + scope engine
Đọc docs/design/module-m01-auth-rbac.md.

Triển khai Phase 3.

Yêu cầu:
- tạo RBAC admin APIs
- tạo scope engine middleware/service
- phải xử lý đủ:
  - SELF
  - UNIT
  - DEPARTMENT
  - ACADEMY
- ưu tiên sửa đúng lỗ hổng DEPARTMENT scope

Sau khi xong:
- liệt kê endpoints
- nêu logic checkScopeAccess
- nêu phần nào còn cần kiểm thử sâu
2.5. Phase 4 unit tree UI/admin
Đọc docs/design/module-m01-auth-rbac.md.

Triển khai Phase 4.

Yêu cầu:
- tạo unit tree manager
- page admin org
- support parent-child tree
- search, expand/collapse, basic edit

Sau khi xong:
- liệt kê file UI
- nêu cách unit tree hỗ trợ scope engine
3. PROMPT CHO AUDIT & SESSION
3.1. Prompt mở đầu
/implement-from-design

Đọc:
- docs/design/module-m01-overview.md
- docs/design/module-m01-audit-session.md

Chưa code.

Hãy:
1. Tóm tắt UC-05, UC-06
2. Liệt kê models audit/session
3. Liệt kê APIs/pages cần có
4. Chia phase triển khai
3.2. Phase 1 schema
/m09-phase1-schema

Đọc docs/design/module-m01-audit-session.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- thêm AuditLog
- thêm AuthSession
- thêm enum AuditAction nếu cần
- thêm index cần thiết cho search và tracing

Không làm API/UI.

Sau khi xong:
- liệt kê models
- nêu index quan trọng
- nêu relation với User/session/auth hiện có
3.3. Phase 2 services
Đọc docs/design/module-m01-audit-session.md.

Triển khai Phase 2.

Yêu cầu:
- tạo audit logger utility
- tạo session manager service
- hỗ trợ revoke reason
- hỗ trợ update lastActivityAt

Chưa làm UI.

Sau khi xong:
- liệt kê hàm chính
- nêu chỗ nào cần middleware hook
3.4. Phase 3 admin APIs + pages
Đọc docs/design/module-m01-audit-session.md.

Triển khai Phase 3.

Yêu cầu:
- tạo APIs:
  - audit list/detail
  - sessions list
  - revoke session
  - my sessions
- tạo pages admin audit + sessions

Sau khi xong:
- liệt kê endpoint
- nêu filter/search chính
- nêu phần nào production-ready
4. PROMPT CHO SSO & HARDENING
4.1. Prompt mở đầu
/implement-from-design

Đọc:
- docs/design/module-m01-overview.md
- docs/design/module-m01-sso-hardening.md

Chưa code.

Hãy:
1. Tóm tắt UC-07, UC-08
2. Chỉ ra ranh giới giữa auth local và BQP SSO
3. Liệt kê files/services cần có
4. Chia phase triển khai
5. Nêu các rủi ro production nếu hardening chưa hoàn thiện
4.2. Phase 1 hardening scaffold
Đọc docs/design/module-m01-sso-hardening.md.

Triển khai Phase 1.

Yêu cầu:
- scaffold security headers
- scaffold rate limit middleware
- chỉ ra nơi cần secret cleanup
- không để credential hard-code mới xuất hiện

Chưa làm SSO hoàn chỉnh.

Sau khi xong:
- nêu middleware/files đã tạo
- nêu routes nên áp rate limit trước
- nêu phần nào là config/env dependency
4.3. Phase 2 BQP SSO
Đọc docs/design/module-m01-sso-hardening.md.

Triển khai Phase 2.

Yêu cầu:
- tạo BQP SSO provider adapter
- map claims:
  - military_id
  - unit_code
  - rank
- first login phải map unitCode → unitId nếu tìm thấy
- nếu không map được unit thì trả lỗi phù hợp

Sau khi xong:
- nêu flow SSO login
- nêu chỗ nào hook vào auth framework hiện có
- nêu phần nào cần env thật để hoàn thiện
4.4. Phase 3 hardening dashboard/config
Đọc docs/design/module-m01-sso-hardening.md.

Triển khai Phase 3.

Yêu cầu:
- tạo admin page security hardening
- hiển thị:
  - trạng thái rate limit
  - security config chính
  - gợi ý lỗi cấu hình
- không để lộ secret thực

Sau khi xong:
- liệt kê file UI
- nêu trường config nào chỉ nên hiển thị masked
5. PROMPT REVIEW TOÀN BỘ M01
/review-m09

Hãy review toàn bộ phần code M01 hiện có so với:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m01-overview.md
- docs/design/module-m01-auth-rbac.md
- docs/design/module-m01-audit-session.md
- docs/design/module-m01-sso-hardening.md

Output:
1. phần đã đạt
2. phần còn thiếu
3. phần lệch kiến trúc
4. rủi ro production
5. 4 lỗ hổng nào đã xử lý, lỗ hổng nào còn mở
6. thứ tự sửa tối ưu

---

# Cách dùng ngay

Bắt đầu bằng prompt này:

```text
Đọc:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m01-overview.md

Chưa code.

Hãy tóm tắt:
1. Vai trò của M01 trong toàn hệ thống
2. 8 use case của M01
3. 4 lỗ hổng nghiêm trọng phải xử lý trước go-live
4. Quan hệ giữa M01 với M02, M13, M18, M19
5. Thứ tự phase triển khai hợp lý

Review M01 – So sánh Design vs. Code hiện có
Phần 1 — Đã đạt
Item	Trạng thái	Ghi chú
NextAuth.js credentials provider	✅	lib/auth.ts — đầy đủ
RBAC function-code system	✅	lib/rbac/ — đủ 4 file: types, authorize, policy, scope, middleware
Function codes seed	✅	lib/rbac/function-codes.ts — có PERSONNEL/RESEARCH/PARTY/POLICY/...
requireFunction / withFunction middleware	✅	Dùng ở 957 lần trong 332 files — phủ rộng
Scope engine cơ bản (SELF/UNIT/ACADEMY)	✅	lib/rbac/scope.ts — 3 scope hoạt động đúng
getAccessibleUnitIds + getUnitAndDescendants	✅	Async hierarchy query đúng
Security event logging	✅	lib/audit.ts — đủ event types, severity, sanitize
Login event log	✅	lib/auth.ts gọi logSecurityEvent cả success và fail
Rate limit config + middleware	✅ (partial)	lib/security/rate-limiter.ts — config tốt
Rate limit trên login route	✅	app/api/auth/login/route.ts — dùng checkRateLimit
Unit tree model	✅	Schema có Unit với parentId self-reference
UserPosition + PositionFunction mapping	✅	Đủ trong schema và query
militaryId trên User	✅	Field có trong schema và session
Phần 2 — Còn thiếu
Item	Thiếu gì
MFA/OTP (UC-01)	Schema User không có mfaEnabled, mfaSecret, failedLoginCount, lockedUntil. Toàn bộ UC-01 chưa có
AuthSession model (UC-06)	Không có bảng AuthSession trong schema. Session chỉ tồn tại trong JWT, không thể revoke
Session revocation	Không có cơ chế revoke. Logout chỉ xóa cookie client-side
BQP SSO provider (UC-07)	Không có lib/auth/bqp-sso-provider.ts. Chỉ có 1 provider là credentials
Security headers	Không có lib/security/security-headers.ts. Next.js headers chưa được set
checkScopeAsync không được export	lib/rbac/index.ts chỉ export checkScope — API routes không thể dùng async DEPARTMENT check
Không có AuditLog model riêng	Schema có AuditLog với đủ fields nhưng code đang ghi vào SystemLog — hai hệ thống song song
Không có audit admin UI	Các page app/dashboard/admin/security/audit/ và sessions/ chưa tồn tại
RBAC admin UI	app/dashboard/admin/rbac/page.tsx chưa được tạo đúng theo spec
Phần 3 — Lệch kiến trúc
A. Hai hệ thống JWT song song

lib/auth.ts dùng NextAuth JWT (strategy: jwt, maxAge 30 days)
app/api/auth/login/route.ts tự tạo JWT riêng bằng jsonwebtoken với expiresIn: '7d'
Hai token khác nhau hoàn toàn. Routes dùng getServerSession chỉ hiểu NextAuth token. Client dùng custom JWT không có session RBAC.

B. Audit ghi sai bảng
Design yêu cầu AuditLog model với đủ oldValues, newValues, changedFields, functionCode, module. Code hiện tại ghi vào SystemLog — mất toàn bộ cấu trúc audit chi tiết.

C. JWT maxAge = 30 ngày
Design: access token 1h + refresh token 7d. Thực tế: 30 ngày không có cơ chế refresh riêng. JWT sống quá dài + không thể revoke = không đáp ứng yêu cầu bảo mật quân sự.

D. DEPARTMENT scope bypass trong sync path
lib/rbac/scope.ts:50 — khi scope là DEPARTMENT và resourceUnitId khác user.unitId:


console.warn('[RBAC] DEPARTMENT scope cần async check - đang bypass...')
return { allowed: true, ... }  // ← BYPASS hoàn toàn
checkScopeAsync có implement đúng nhưng không được export và không được dùng trong middleware thực tế.

E. Audit log mất changedFields và oldValues
logAudit() nhận oldValue/newValue nhưng ghi vào SystemLog.metadata dạng JSON blob, mất toàn bộ khả năng query theo field cụ thể.

Phần 4 — Rủi ro production
Rủi ro	Mức	Mô tả
JWT sống 30 ngày, không revoke được	CRITICAL	Nếu tài khoản bị chiếm, không có cách vô hiệu hóa session
DEPARTMENT scope bypass → allowed = true	CRITICAL	Người dùng DEPARTMENT scope có thể đọc dữ liệu toàn học viện
Credential hard-code 'your-secret-key'	HIGH	Nếu NEXTAUTH_SECRET chưa được set trong env, JWT ký bằng chuỗi literal
Rate limiter dùng in-memory Map	HIGH	Restart server = reset limit. Multi-instance = mỗi instance limit riêng
Không có MFA	HIGH	Tài khoản admin/ATTT chỉ có 1 lớp bảo vệ
Audit ghi vào SystemLog thay AuditLog	MEDIUM	Mất khả năng query audit chi tiết, không đáp ứng yêu cầu lưu trữ 5 năm đúng chuẩn
Hai JWT system song song	MEDIUM	Client dùng custom JWT không có RBAC — dễ bypass authorization
Phần 5 — 4 lỗ hổng nghiêm trọng: trạng thái
Lỗ hổng	Trạng thái	Chi tiết
1. DEPARTMENT scope chưa implement đầy đủ	❌ Còn mở	checkScopeAsync có nhưng không được export/dùng. Sync path bypass thành allowed: true
2. Chưa có MFA/OTP	❌ Còn mở	Schema thiếu mfaEnabled, mfaSecret, failedLoginCount, lockedUntil. UC-01 = 0%
3. Credential hard-code	⚠️ Còn mở một phần	'your-secret-key' fallback tại login/route.ts:116,178. Nếu env set đúng = ổn, nhưng fallback vẫn tồn tại trong code
4. Thiếu rate limiting	✅ Đã có (partial)	Config tốt, dùng trên login route. Vấn đề còn lại: in-memory store thay vì Redis — không đáng tin cậy ở production
Phần 6 — Thứ tự sửa tối ưu

Bước 1 — Xử lý ngay (blocking production)
  ├── Xóa fallback 'your-secret-key' trong login/route.ts
  │   → chuyển thành throw Error nếu NEXTAUTH_SECRET chưa set
  └── Fix DEPARTMENT scope: export checkScopeAsync,
      bắt middleware dùng async version thay vì sync bypass

Bước 2 — Trong sprint hiện tại
  ├── Migrate rate limiter sang Redis (dùng lib/redis.ts đã có)
  ├── Gỡ custom JWT trong login/route.ts (giữ lại NextAuth làm duy nhất)
  └── Chuẩn hóa audit: ghi vào AuditLog thay SystemLog,
      hoặc ít nhất chuẩn hóa interface để có thể migrate sau

Bước 3 — Sprint tiếp theo (trước go-live)
  ├── Schema: thêm mfaEnabled, mfaSecret, failedLoginCount, lockedUntil
  ├── Schema: thêm AuthSession model
  ├── Implement UC-01 MFA/TOTP
  └── Implement UC-06 session revocation flow

Bước 4 — Pre-production
  ├── Security headers (Next.js config + middleware)
  ├── BQP SSO adapter scaffold (UC-07)
  └── Audit admin UI + session management UI
Ưu tiên tuyệt đối: Bước 1 là 2 thay đổi nhỏ nhưng đóng 2 lỗ hổng CRITICAL — có thể làm ngay mà không cần phase lớn.