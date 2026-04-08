# 📋 TƯ VẤN QUẢN LÝ TÀI KHOẢN VÀ NGƯỜI DÙNG HIỆU QUẢ
**Hệ thống HVHC BigData Management System v7.2**

---

## 🎯 1. PHÂN BIỆT TÀI KHOẢN VÀ NGƯỜI DÙNG

### **Trong hệ thống HVHC:**
- **TÀI KHOẢN (User Account)** = **NGƯỜI DÙNG (User)**: Là một khái niệm duy nhất
- Mỗi cán bộ, giảng viên, học viên trong hệ thống có **MỘT TÀI KHOẢN DUY NHẤT**
- Tài khoản này được dùng để:
  - Đăng nhập hệ thống
  - Quản lý thông tin cá nhân
  - Thực hiện các chức năng theo vai trò (Role)

### **Không nên tạo:**
- ❌ Một người nhiều tài khoản
- ❌ Tài khoản dùng chung cho nhiều người
- ❌ Tài khoản không gắn với đơn vị cụ thể

---

## 🏢 2. CẤU TRÚC QUẢN LÝ ĐỀ XUẤT

### **Luồng quản lý theo cấp bậc:**

```
┌─────────────────────────────────────────────────────────┐
│         HVHC - HỌC VIỆN HẬU CẦN (Cấp 1)                 │
└─────────────────────────────────────────────────────────┘
                         |
        ┌────────────────┴────────────────┐
        │                                 │
┌───────▼────────┐              ┌────────▼────────┐
│  KHOA A (Cấp 2)│              │  KHOA B (Cấp 2) │
│  - 50 giảng viên│             │  - 45 giảng viên│
│  - 200 học viên │             │  - 180 học viên │
└────────────────┘              └─────────────────┘
        │                                 │
  ┌─────┴─────┐                    ┌─────┴─────┐
  │           │                    │           │
┌─▼───┐  ┌───▼──┐            ┌────▼──┐  ┌────▼──┐
│BM 1 │  │BM 2  │            │BM 3   │  │BM 4   │
│(Cấp3│  │(Cấp3)│            │(Cấp 3)│  │(Cấp 3)│
└─────┘  └──────┘            └───────┘  └───────┘
```

### **Nguyên tắc quản lý:**

1. **Từ ĐƠN VỊ → NHÂN SỰ** (Theo đề xuất của bạn)
   - Bước 1: Tạo cấu trúc đơn vị (Cây tổ chức)
   - Bước 2: Thêm nhân sự vào từng đơn vị
   - Bước 3: Gán vai trò (Role) cho từng người
   - Bước 4: Xác định quyền hạn theo vai trò

2. **Mỗi người PHẢI thuộc MỘT đơn vị cụ thể**
   - Không có nhân sự "lưu động" không thuộc đơn vị nào
   - Nếu chuyển đơn vị → Cập nhật `unitId` trong tài khoản

3. **Một người có thể có NHIỀU vai trò**
   - VD: Vừa là Giảng viên, vừa là Chủ nhiệm Bộ môn
   - Role chính: `GIANG_VIEN`
   - Role phụ: `CHU_NHIEM_BO_MON` (quản lý được bật/tắt)

---

## 📊 3. QUY TRÌNH THÊM NHÂN SỰ MỚI (KHUYẾN NGHỊ)

### **Bước 1: Chuẩn bị Đơn vị**
```
1. Truy cập: Sidebar → "🏢 Quản lý Đơn vị"
2. Kiểm tra cấu trúc cây đơn vị
3. Nếu thiếu đơn vị:
   - Click "Thêm đơn vị"
   - Điền: Mã, Tên, Loại, Cấp độ, Đơn vị cha
   - Lưu
```

### **Bước 2: Thêm Tài khoản/Người dùng**
```
1. Truy cập: Sidebar → "⚙️ Quản lý Tài khoản"
2. Click "Thêm người dùng"
3. Điền thông tin:
   ┌──────────────────────────────────────────┐
   │ Họ tên: *               [____________]   │
   │ Email:  *               [____________]   │
   │ Mật khẩu: * (min 6 ký tự) [__________]  │
   │ Số điện thoại:          [____________]   │
   │ Quân hàm:               [Dropdown▼]      │
   │ Chức vụ:                [____________]   │
   │ Vai trò (Role): *       [Dropdown▼]      │
   │ Đơn vị: *               [Dropdown▼]      │
   └──────────────────────────────────────────┘
   
4. Chọn đơn vị từ dropdown (hiển thị cấu trúc cây)
5. Click "Tạo" → Hệ thống tự động:
   - Hash mật khẩu (bcrypt)
   - Gán unitId
   - Tạo audit log
   - Gửi email thông báo (nếu cấu hình SMTP)
```

### **Bước 3: Kiểm tra & Xác nhận**
```
1. Tìm kiếm người dùng vừa tạo (thanh Search)
2. Kiểm tra:
   - Đơn vị hiển thị đúng
   - Vai trò đúng
   - Trạng thái: ACTIVE
3. Test đăng nhập bằng tài khoản mới
```

---

## 🔐 4. PHÂN QUYỀN & BẢO MẬT

### **Các vai trò (Role) trong hệ thống:**

| Vai trò | Quyền hạn | Đơn vị quản lý |
|---------|-----------|----------------|
| **QUAN_TRI_HE_THONG** | Toàn bộ hệ thống | Tất cả đơn vị |
| **CHI_HUY_HOC_VIEN** | Toàn bộ Học viện | Cấp 1 (HVHC) |
| **CHI_HUY_KHOA** | Khoa/Phòng | Cấp 2 (Khoa) |
| **CHU_NHIEM_BO_MON** | Bộ môn | Cấp 3 (Bộ môn) |
| **GIANG_VIEN** | Lớp học, Sinh viên | Cấp 3+ |
| **HOC_VIEN** | Xem điểm, tài liệu | Không quản lý |
| **ADMIN** | Quản trị kỹ thuật | Tất cả đơn vị |

### **Nguyên tắc phân quyền:**

1. **Principle of Least Privilege (PoLP)**
   - Chỉ cấp quyền tối thiểu cần thiết
   - Không cấp ADMIN cho mọi người

2. **Phân cấp theo đơn vị**
   - Chỉ huy Khoa chỉ quản lý Khoa của mình
   - Giảng viên chỉ quản lý sinh viên của mình

3. **Audit Log đầy đủ**
   - Mọi thao tác CRUD đều được ghi log
   - Truy vết: Ai? Làm gì? Khi nào?

---

## 🛠️ 5. CÁC CHỨC NĂNG QUẢN LÝ

### **5.1. Quản lý Đơn vị (`/dashboard/admin/units`)**

#### **Thêm đơn vị con:**
```
1. Click icon "+" bên cạnh đơn vị cha
2. Hệ thống tự động:
   - Gán đơn vị cha
   - Tăng cấp độ (parentLevel + 1)
3. Điền thông tin và Lưu
```

#### **Sửa đơn vị:**
```
1. Click icon "Edit" (Bút chì)
2. Chỉnh sửa: Tên, Loại, Mô tả
3. KHÔNG cho phép sửa: Mã, Cấp độ (để tránh phá vỡ cấu trúc)
```

#### **Xóa đơn vị:**
```
Điều kiện xóa:
- ✅ Không có đơn vị con
- ✅ Không có nhân sự
- ✅ Xác nhận lại 2 lần

Sau khi xóa:
- Soft delete (active = false)
- Vẫn giữ lại audit log
```

### **5.2. Quản lý Tài khoản (`/dashboard/admin/users`)**

#### **Tìm kiếm & Lọc:**
```
- Thanh tìm kiếm: Tên, Email, SĐT
- Lọc theo: Vai trò, Trạng thái, Đơn vị
- Phân trang: 20 items/page
```

#### **Khóa/Mở khóa tài khoản:**
```
1. Click icon "Lock" hoặc "Unlock"
2. Trạng thái chuyển: ACTIVE ↔ INACTIVE
3. Khi bị khóa:
   - Không đăng nhập được
   - Vẫn giữ dữ liệu
   - Có thể mở khóa lại
```

#### **Reset mật khẩu:**
```
1. Click icon "Key" (Chìa khóa)
2. Nhập mật khẩu mới (min 6 ký tự)
3. Hệ thống:
   - Hash lại mật khẩu
   - Ghi log thay đổi
   - (Tùy chọn) Gửi email thông báo
```

#### **Xóa tài khoản:**
```
Bảo vệ:
- ❌ KHÔNG cho phép xóa chính mình
- ❌ KHÔNG cho phép xóa QUAN_TRI_HE_THONG cuối cùng
- ✅ Soft delete (status = INACTIVE)
- ✅ Giữ lại toàn bộ audit log
```

---

## 📈 6. THỐNG KÊ & BÁO CÁO

### **Dashboard Admin Overview:**
```
- Tổng số người dùng: 1,299
- Phân bố theo vai trò:
  • GIANG_VIEN: 286
  • HOC_VIEN: 950
  • CHI_HUY_KHOA: 12
  • Khác: 51
- Phân bố theo đơn vị:
  • Hiển thị top 10 đơn vị có nhiều nhân sự nhất
- Hoạt động gần đây:
  • 10 log mới nhất về User Management
```

### **Export dữ liệu:**
```
Định dạng hỗ trợ:
- ✅ Excel (.xlsx)
- ✅ CSV (UTF-8 with BOM)

Dữ liệu export:
- Danh sách người dùng theo filter hiện tại
- Bao gồm: Tên, Email, Vai trò, Đơn vị, Trạng thái
- Tên file: users_export_YYYYMMDD_HHmmss.xlsx
```

---

## ⚠️ 7. CÁC LƯU Ý QUAN TRỌNG

### **Bảo mật:**
1. ✅ **Mật khẩu:**
   - Tối thiểu 6 ký tự (khuyến nghị 12+)
   - Được hash bằng bcrypt (salt=10)
   - KHÔNG lưu plain text
   
2. ✅ **Email duy nhất:**
   - Một email chỉ dùng cho một tài khoản
   - Không thể tạo trùng email

3. ✅ **Session timeout:**
   - 7 ngày (có thể cấu hình)
   - Tự động logout sau 30 phút không hoạt động

### **Hiệu suất:**
1. ✅ **Pagination:**
   - 20 items/page mặc định
   - Có thể thay đổi: 10, 20, 50, 100

2. ✅ **Caching:**
   - Danh sách đơn vị được cache 5 phút
   - Auto-refresh sau mỗi thay đổi

3. ✅ **Indexing:**
   - Index trên: email, unitId, status
   - Query tối ưu với Prisma

---

## 🔄 8. QUY TRÌNH CẬP NHẬT DỮ LIỆU

### **Khi có thay đổi nhân sự:**

#### **Chuyển đơn vị:**
```
1. Vào "Quản lý Tài khoản"
2. Tìm người cần chuyển
3. Click "Edit"
4. Chọn đơn vị mới
5. Lưu → Hệ thống tự động:
   - Cập nhật unitId
   - Ghi log: "User X moved from Unit A to Unit B"
   - Cập nhật thống kê
```

#### **Thay đổi vai trò:**
```
1. Edit người dùng
2. Chọn vai trò mới từ dropdown
3. Lưu → Quyền hạn thay đổi ngay lập tức
4. Người dùng cần đăng nhập lại để áp dụng quyền mới
```

#### **Nghỉ việc/Thôi học:**
```
KHÔNG XÓA - Chỉ KHÓA tài khoản:
1. Click icon "Lock"
2. Trạng thái: ACTIVE → INACTIVE
3. Lý do:
   - Giữ lại dữ liệu lịch sử
   - Có thể khôi phục nếu cần
   - Audit log không bị mất
```

---

## 📚 9. CÂU HỎI THƯỜNG GẶP (FAQ)

### **Q1: Tại sao không thấy menu "Quản lý Tài khoản"?**
**A:** Chỉ có vai trò **ADMIN** và **QUAN_TRI_HE_THONG** mới thấy menu này.
- Kiểm tra vai trò hiện tại: Góc trên phải → Tên người dùng
- Liên hệ quản trị viên để được cấp quyền

### **Q2: Tại sao không thêm được đơn vị mới?**
**A:** Các nguyên nhân phổ biến:
1. ❌ Mã đơn vị đã tồn tại → Đổi mã khác
2. ❌ Cấp độ con ≤ cấp độ cha → Tăng cấp độ
3. ❌ Không chọn đơn vị cha cho đơn vị con → Chọn đơn vị cha
4. ✅ **ĐÃ SỬA:** Lỗi khi chọn "Không có (đơn vị gốc)" → Đã khắc phục trong phiên bản này

### **Q3: Làm sao để import hàng loạt người dùng?**
**A:** Hiện tại hỗ trợ 2 cách:
1. **Thủ công:** Thêm từng người qua giao diện
2. **Script seed:**
   ```bash
   cd nextjs_space
   yarn seed:users  # Import từ JSON file
   ```
3. **Tính năng import Excel** (Đang phát triển - Phase 2)

### **Q4: Có thể tạo tài khoản không thuộc đơn vị nào không?**
**A:** KHÔNG KHUYẾN NGHỊ
- Theo nguyên tắc: Mọi nhân sự phải thuộc một đơn vị
- Nếu chưa xác định → Tạo đơn vị tạm thời: "Đơn vị Tạm thời"
- Sau khi xác định → Chuyển sang đơn vị chính thức

### **Q5: Phân biệt "Quản lý Tài khoản" vs "Quản lý Giảng viên"?**
**A:**
```
┌─────────────────────────────────────────────────────────┐
│ Quản lý Tài khoản (/dashboard/admin/users)              │
├─────────────────────────────────────────────────────────┤
│ - Quản lý TẤT CẢ người dùng (1,299 người)               │
│ - CRUD tài khoản: Tạo, Sửa, Xóa, Khóa, Reset password  │
│ - Chỉ ADMIN/QUAN_TRI_HE_THONG truy cập                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Quản lý Giảng viên (/dashboard/faculty/list)            │
├─────────────────────────────────────────────────────────┤
│ - Quản lý HỒ SƠ GIẢNG VIÊN (286 người)                  │
│ - Thông tin chuyên môn: Học vị, Học hàm, Môn giảng dạy │
│ - Thống kê: Đề tài nghiên cứu, Công bố khoa học        │
│ - CHI_HUY_KHOA/GIANG_VIEN truy cập                      │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ 10. CHECKLIST TRIỂN KHAI

### **Giai đoạn 1: Chuẩn bị (1-2 giờ)**
- [ ] Lập danh sách tất cả đơn vị trong Học viện
- [ ] Xác định cấu trúc cây (Cấp 1, 2, 3...)
- [ ] Chuẩn bị danh sách chỉ huy từng đơn vị
- [ ] Tạo template Excel cho nhân sự (nếu import hàng loạt)

### **Giai đoạn 2: Tạo cấu trúc đơn vị (2-3 giờ)**
- [ ] Tạo đơn vị cấp 1 (HVHC)
- [ ] Tạo đơn vị cấp 2 (Các Khoa/Phòng)
- [ ] Tạo đơn vị cấp 3 (Các Bộ môn)
- [ ] Gán chỉ huy cho từng đơn vị
- [ ] Kiểm tra cấu trúc cây hoàn chỉnh

### **Giai đoạn 3: Thêm nhân sự (3-5 giờ)**
- [ ] Import/Thêm Quản trị viên hệ thống (ADMIN)
- [ ] Import/Thêm Chỉ huy các cấp
- [ ] Import/Thêm Giảng viên
- [ ] Import/Thêm Học viên
- [ ] Kiểm tra: Mỗi người thuộc đúng đơn vị

### **Giai đoạn 4: Kiểm tra & Test (1-2 giờ)**
- [ ] Test đăng nhập với từng vai trò
- [ ] Kiểm tra phân quyền: Ai thấy gì?
- [ ] Test các chức năng: Thêm, Sửa, Xóa, Khóa
- [ ] Kiểm tra audit log đầy đủ

### **Giai đoạn 5: Đào tạo & Triển khai**
- [ ] Đào tạo quản trị viên cấp cao
- [ ] Đào tạo chỉ huy các đơn vị
- [ ] Phát tài khoản cho toàn bộ nhân sự
- [ ] Thu thập phản hồi và điều chỉnh

---

## 📞 11. HỖ TRỢ

Nếu gặp vấn đề hoặc cần hỗ trợ:

1. **Tài liệu hướng dẫn chi tiết:**
   - `HUONG_DAN_QUAN_TRI_HE_THONG.pdf`
   - `HUONG_DAN_QUAN_LY_TAI_KHOAN_DON_VI.md`

2. **Kiểm tra log hệ thống:**
   - Sidebar → "Quản trị hệ thống" → "System Logs"
   - Tìm theo: User ID, Action, Timestamp

3. **Liên hệ kỹ thuật:**
   - Email: support@hvhc.edu.vn
   - Hotline: 024.xxxx.xxxx

---

## 🚀 12. KẾ HOẠCH PHÁT TRIỂN TIẾP THEO

### **Phase 2 (Đang phát triển):**
- ✅ Import hàng loạt từ Excel
- ✅ Export chi tiết với thống kê
- ✅ Gửi email tự động khi tạo tài khoản
- ✅ Quản lý quyền hạn chi tiết (Permission-based)

### **Phase 3 (Lên kế hoạch):**
- ✅ API tích hợp với hệ thống nhân sự quốc phòng
- ✅ Đồng bộ dữ liệu từ Active Directory
- ✅ Xác thực 2 lớp (2FA)
- ✅ Biometric login (vân tay, khuôn mặt)

---

**📅 Ngày cập nhật:** 11/01/2025  
**📌 Phiên bản:** 7.2  
**✍️ Người soạn:** HVHC BigData Development Team
