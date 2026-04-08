# Testing Rules

## Mục tiêu
Viết test bảo vệ nghiệp vụ cốt lõi, bảo vệ quyền truy cập, và ngăn lỗi quay lại.

---

## Ưu tiên test theo thứ tự
1. Business rules quan trọng
2. Permission / scope
3. Workflow / lifecycle
4. Calculations / scoring / engines
5. Regression cho bug cũ
6. API contracts quan trọng

---

## Những gì bắt buộc nên có test
- update điểm phải ghi ScoreHistory
- scope UNIT không được thấy ngoài đơn vị
- reward bị block nếu còn discipline chưa clear
- ProgramVersion không bị overwrite
- Graduation engine xét đúng/không đúng
- transfer/approval workflow đúng trạng thái
- M19 lookup APIs trả đúng category và filter active

---

## Test types
- Unit test cho service tính toán / rule engine
- Integration test cho API + DB logic quan trọng
- Permission test cho route/service nhạy cảm
- Migration/regression test khi refactor model cũ

---

## Test philosophy
- Test phải kiểm tra hành vi có ý nghĩa
- Tránh test hời hợt chỉ kiểm tra implementation detail
- Với bug đã xảy ra, phải thêm regression test

---

## Không được làm
- Không chỉ test happy path
- Không bỏ qua permission cases
- Không bỏ qua invalid input