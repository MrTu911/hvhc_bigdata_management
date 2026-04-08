# Security Rules

## Mục tiêu
Đảm bảo Claude luôn ưu tiên bảo mật đúng mức, nhất là với hệ thống có dữ liệu nhân sự, chính sách, đào tạo, đảng viên.

---

## Nguyên tắc
- Auth ở M01 là nguồn sự thật
- RBAC phải check ở backend
- Scope phải enforced ở backend
- Audit phải có với thao tác nhạy cảm
- Trường nhạy cảm phải có guard hiển thị và guard backend

---

## Bắt buộc kiểm tra
- function code
- scope access
- session validity
- MFA nếu route yêu cầu
- ownership hoặc unit/department scope khi cần

---

## Sensitive data
Dữ liệu sau phải coi là nhạy cảm:
- hồ sơ đảng viên
- kỷ luật
- BHXH / chính sách
- điểm
- graduation audit
- retirement
- family / personal identity data

---

## Logging
- Không log secrets
- Không log OTP/token/raw password
- Không log full personally sensitive payload nếu không cần

---

## Secrets
- Không hard-code credentials
- Secrets phải đi qua env/secret source
- Không commit secrets vào repo

---

## Rate limiting
- Routes auth phải có rate limit
- Routes nhạy cảm nên cân nhắc policy riêng
- Không đợi production mới nghĩ đến brute-force

---

## File upload
- Validate loại file
- Validate kích thước
- Không tin tưởng file name từ client
- Nếu generate signed URL, phải có expiry hợp lý

---

## Không được làm
- Không dựa vào frontend để bảo vệ dữ liệu
- Không assume internal route là tự an toàn
- Không bỏ audit ở các thao tác pháp lý/nhạy cảm