---
description: Viết test có giá trị thực, ưu tiên những đường lỗi nghiệp vụ, bảo mật và regression quan trọng
---

# Write Tests

## Mục tiêu
Viết test bảo vệ nghiệp vụ cốt lõi và ngăn lỗi quay lại.

## Ưu tiên test
1. Business rules quan trọng
2. Permission/scope
3. Workflow/lifecycle transitions
4. Calculations
5. Migration-safe behavior
6. Regression cho bug đã từng xảy ra

## Output bắt buộc
- test cases chính
- happy path
- edge cases
- permission cases
- failure cases

## Không được làm
- Không chỉ viết snapshot/test hời hợt
- Không bỏ qua rule tính toán và scope