---
description: Rà và tăng cường bảo mật hệ thống trước production hoặc trước khi mở rộng module nhạy cảm
---

# Security Hardening

## Mục tiêu
Khóa các lỗ hổng phổ biến và tăng độ an toàn production.

## Checklist
- secrets/env
- rate limiting
- security headers
- auth/session
- MFA
- RBAC
- scope enforcement
- audit logging
- sensitive field masking
- file upload policy
- brute-force protection

## Output bắt buộc
1. Lỗ hổng hiện có
2. Mức độ nghiêm trọng
3. Cách khắc phục
4. Việc phải làm trước go-live
5. Việc có thể làm sau