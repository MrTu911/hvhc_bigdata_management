
# Database Schema Rules

## Mục tiêu
Thiết kế schema an toàn, chuẩn hóa, tránh tạo model trùng, tránh phá dữ liệu thật.

---

## Quy trình bắt buộc trước khi thêm model mới
1. Kiểm tra schema hiện tại đã có model tương đương chưa
2. Kiểm tra model cũ có dữ liệu thật không
3. Kiểm tra route/service nào đang dùng model đó
4. Quyết định:
   - reuse
   - extend
   - wrap
   - add new
   - deprecate dần

---

## Ưu tiên
- Reuse model cũ nếu đúng bản chất nghiệp vụ
- Extend model cũ nếu chỉ thiếu vài field
- Chỉ tạo model mới khi khác bản chất thật sự

---

## Fields
- Tên field phải rõ nghĩa nghiệp vụ
- Field enum phải dùng enum hoặc lookup đúng chỗ
- Trường legacy phải được chú thích nếu còn giữ tạm

---

## Quan hệ
- Relation phải phản ánh đúng dữ liệu gốc
- Không tạo duplicate source of truth
- Với self-reference tree phải chống vòng lặp logic

---

## Unique & index
Phải chủ động thêm:
- unique keys nghiệp vụ
- composite unique nếu cần
- index cho search/filter/sort phổ biến
- index cho foreign key lớn
- index cho audit/history lookup nếu cần

---

## Migration
- Không drop field/model cũ ngay nếu có dữ liệu thật
- Ưu tiên:
  - dual-read
  - single-write
  - backfill
  - deprecate
- Migration phải có rollback thinking

---

## Soft delete
- Nếu nghiệp vụ cần giữ lịch sử, ưu tiên soft delete
- Không hard delete dữ liệu pháp lý/lịch sử trừ khi thiết kế cho phép rõ

---

## Master data
- Không hard-code master data vào module nghiệp vụ nếu M19 đã có
- Không duplicate `AcademicYear`, `Major`, `ScopeLevel`, `AllowanceType`... nếu đã có lookup chuẩn

---

## Audit-sensitive models
Các model như:
- điểm
- policy
- đảng viên
- retirement
- discipline
- reward
phải có chiến lược history/audit rõ ràng

---

## Không được làm
- Không tạo bảng mới chỉ vì tên design mới đẹp hơn
- Không để 2 model cùng làm source of truth cho cùng một thực thể
- Không bỏ qua index ở module search-heavy