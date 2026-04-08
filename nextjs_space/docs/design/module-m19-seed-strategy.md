# MODULE M19 – SEED STRATEGY

---

## 1. Mục tiêu

Định nghĩa chiến lược seed dữ liệu ban đầu cho M19 nhằm:
- tạo nền dữ liệu chuẩn cho toàn hệ thống,
- hỗ trợ demo/UAT,
- bảo đảm replay/rollback,
- version hóa dữ liệu seed.

---

## 2. Quy mô seed ban đầu

Mục tiêu ban đầu:
- khoảng 1.200 item chuẩn
- phủ 68 bảng / category logic
- ưu tiên nhóm dữ liệu dùng chung nhiều nhất

---

## 3. Thứ tự ưu tiên seed

### Ưu tiên cao
- cấp bậc / quân hàm
- loại quân nhân
- loại chức vụ
- loại đơn vị / cấp đơn vị
- tỉnh / huyện / xã
- học vị / học hàm / chuyên ngành
- loại file / scope RBAC / system config
- danh mục nghiên cứu khoa học dùng cho M09

### Ưu tiên trung bình
- tài chính / chính sách
- khen thưởng / kỷ luật
- ngoại ngữ / tin học
- đào tạo / năm học / học kỳ

### Ưu tiên sau
- các danh mục thay đổi thường xuyên hoặc cần xác minh ngoài

---

## 4. Nguồn seed

- LOCAL nội bộ
- BQP
- NATIONAL
- ISO
- Bộ GD&ĐT
- Bộ TT&TT
- Cục Quân lực / Quân huấn / Cán bộ / Tuyên huấn
- Admin curated data

---

## 5. Chiến lược version hóa

Mỗi seed bundle cần có:
- version tag
- categoryCode
- sourceType
- appliedAt
- appliedBy
- checksum hoặc hash nếu cần

### Yêu cầu
- có thể replay
- có thể rollback
- có audit trail

---

## 6. Định dạng seed

Có thể dùng:
- SQL
- JSON
- script Prisma / TS
- Excel import chuẩn hóa

Khuyến nghị:
- seed chuẩn hệ thống bằng JSON/TS có version
- import nghiệp vụ bổ sung bằng Excel/CSV

---

## 7. Quy tắc seed

- không hard-code item vào code UI
- không overwrite mù quáng item đã chỉnh tay nếu không có chính sách rõ
- phải phân biệt:
  - seed chuẩn
  - import bổ sung
  - sync từ nguồn ngoài

---

## 8. Tích hợp với triển khai

- Sau Phase 1 schema phải có seed tối thiểu để test read API
- Trước UAT phải có seed đủ cho:
  - dropdown
  - forms
  - analytics
  - sync monitor demo

---

## 9. Notes for Claude

- Seed strategy không phải chỉ là script seed
- Phải hỗ trợ version, replay, rollback, audit
- Nếu project đã có seed framework, phải tái sử dụng thay vì tạo mới vô tổ chức