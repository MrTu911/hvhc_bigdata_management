# Migration & Refactor Rules

## Mục tiêu
Refactor và migrate an toàn, không làm mất dữ liệu, không phá consumer cũ.

---

## Nguyên tắc vàng
- Không drop field cũ ngay
- Không xóa route cũ ngay nếu còn consumer
- Reuse trước, rewrite sau
- Dual-read / single-write là chiến lược chuyển tiếp tốt
- Có backfill plan nếu đổi source of truth

---

## Khi gặp model chồng lấn
Ví dụ:
- HocVien vs StudentProfile
- ClassSection vs CourseSection
- GradeRecord mới vs ClassEnrollment cũ

Phải trả lời:
1. Model nào đang có dữ liệu thật
2. Model nào đang có consumer thật
3. Model nào đúng bản chất hơn
4. Nên reuse/extend hay deprecate model nào

---

## Deprecated strategy
Nếu giữ model cũ tạm thời:
- ghi rõ là legacy
- route/service mới không nên tiếp tục mở rộng model cũ nếu đã có backbone mới
- có kế hoạch tắt dần

---

## Migration rollout
1. Add fields/models mới
2. Viết adapter/service tương thích
3. Backfill dữ liệu
4. Chuyển write path
5. Chuyển read path
6. Gỡ legacy sau cùng

---

## Không được làm
- Không “đập đi làm lại” khi schema cũ còn cứu được
- Không migrate ồ ạt mà không có dry-run/backfill validation
- Không để hai nguồn sự thật cùng active lâu dài