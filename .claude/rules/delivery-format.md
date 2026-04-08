# Delivery Format Rules

## Mục tiêu
Chuẩn hóa cách Claude trả kết quả khi phân tích, code, review hoặc refactor.

---

## Khi phân tích
Phải trả theo cấu trúc:
1. Tóm tắt
2. Dữ liệu lõi
3. API/UI chính
4. Phụ thuộc hệ thống
5. File cần tạo/sửa
6. Phase triển khai
7. Rủi ro

---

## Khi code
Phải nêu:
1. File tạo mới
2. File sửa
3. Nội dung chính đã làm
4. Giả định kỹ thuật
5. Phần còn thiếu
6. Bước tiếp theo

---

## Khi review
Phải nêu:
1. Lỗi nghiêm trọng
2. Lỗi kiến trúc
3. Lỗi dữ liệu
4. Rủi ro bảo mật
5. Rủi ro production
6. Thứ tự sửa

---

## Khi refactor/migrate
Phải nêu:
1. Current state
2. Target state
3. Compatibility plan
4. Migration steps
5. Rollback considerations

---

## Không được làm
- Không trả lời mơ hồ kiểu “đã sửa xong”
- Không bỏ qua file affected
- Không giấu giả định kỹ thuật