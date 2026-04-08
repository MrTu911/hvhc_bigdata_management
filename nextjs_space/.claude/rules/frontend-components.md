---
paths:
  - "components/**/*.tsx"
  - "app/**/*.tsx"
---

# Frontend Component Rules

- Component chỉ tập trung vào UI và interaction
- Không truy cập Prisma trực tiếp
- Không chứa business logic phức tạp
- Nếu form lớn, tách component con hợp lý
- Nếu workflow nhiều bước, ưu tiên wizard hoặc tab rõ ràng
- Nếu module M09 có list/filter/table, ưu tiên:
  - component table riêng
  - filter bar riêng
  - form riêng
- Không hardcode enum label nếu đã có mapping helper hoặc constant
- Ưu tiên giữ code dễ mở rộng cho các phase sau