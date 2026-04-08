---
paths:
  - "prisma/schema.prisma"
---

# Prisma Schema Rules

- Mọi model mới phải bám tài liệu thiết kế trong `docs/design/**`
- Không thêm field không có trong design nếu chưa giải thích rõ
- Relation phải đặt tên rõ ràng, tránh mơ hồ
- Phải cân nhắc:
  - @id
  - @default
  - @updatedAt
  - @unique
  - @@index
  - @@unique
- Nếu module M09 cần enum, ưu tiên định nghĩa enum rõ ràng trong Prisma
- Nếu relation đến bảng hiện có như User, Unit, FacultyProfile... mà chưa chắc chắn tên model/field thật trong schema, phải:
  1. đọc schema hiện có trước
  2. mapping đúng model đang tồn tại
  3. nếu vẫn chưa chắc, báo rõ giả định thay vì tự đặt bừa

- Không làm migration phá dữ liệu cũ nếu chưa có yêu cầu cụ thể
- Với bảng workflow như ResearchProject, ResearchMilestone, ResearchReview:
  - ưu tiên trường createdAt, updatedAt
  - ưu tiên index ở foreign key và trường filter nhiều