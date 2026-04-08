# 📘 HƯỚNG DẪN QUẢN LÝ TÀI KHOẢN VÀ ĐƠN VỊ

**Hệ thống:** HVHC BigData Management System v7.2  
**Ngày cập nhật:** 11/01/2025  
**Phiên bản:** 1.0

---

## 🎯 TỔNG QUAN

Hệ thống đã được bổ sung 2 chức năng quản trị quan trọng:

### ✅ Đã hoàn thành:

1. **Quản lý Tài khoản** (Account Management)
   - Tạo, sửa, xóa tài khoản người dùng
   - Khóa/Mở khóa tài khoản
   - Reset mật khẩu
   - Tìm kiếm và lọc theo vai trò, trạng thái, đơn vị

2. **Quản lý Đơn vị** (Unit Management)
   - Quản lý cấu trúc tổ chức theo cấp bậc
   - Thêm, sửa, xóa đơn vị
   - Xem cây đơn vị theo cấp (Level 1, 2, 3...)
   - Kiểm tra số lượng cán bộ thuộc đơn vị

---

## 🔐 PHÂN QUYỀN TRUY CẬP

### Chỉ các vai trò sau có quyền truy cập:

✅ **ADMIN** (Quản trị viên)  
✅ **QUAN_TRI_HE_THONG** (Quản trị hệ thống)

❌ Các vai trò khác không thấy menu này trong sidebar

---

## 📍 CÁCH TRUY CẬP

### Bước 1: Đăng nhập

Sử dụng tài khoản Admin:
- Email: `admin@hvhc.edu.vn`
- Password: `Hv@2025`

### Bước 2: Mở Sidebar

Sau khi đăng nhập, bạn sẽ thấy sidebar bên trái màn hình.

### Bước 3: Tìm section "Quản trị hệ thống"

Cuộn xuống trong sidebar, tìm section **"Quản trị hệ thống"** (System Admin)

### Bước 4: Chọn chức năng

Bạn sẽ thấy 2 menu items mới ở đầu section:

🔹 **⚙️ Quản lý Tài khoản** (màu xanh blue)
   - Icon: UserCog (bánh răng + người dùng)
   - URL: `/dashboard/admin/users`

🔹 **🏢 Quản lý Đơn vị** (màu xanh indigo)
   - Icon: Building2 (tòa nhà)
   - URL: `/dashboard/admin/units`

---

## 🔧 CHỨC NĂNG CHI TIẾT

### 1️⃣ QUẢN LÝ TÀI KHOẢN

#### 📊 Giao diện chính:
- **Bảng danh sách** người dùng với các cột:
  - Họ tên
  - Email
  - Vai trò (Role)
  - Đơn vị
  - Trạng thái (ACTIVE/INACTIVE/SUSPENDED)
  - Thao tác (Actions)

#### 🔍 Tìm kiếm & Lọc:
- **Search box**: Tìm theo tên, email, mã nhân viên
- **Filter Role**: Lọc theo vai trò (Admin, Giảng viên, Học viên...)
- **Filter Status**: Lọc theo trạng thái (Hoạt động, Tạm ngưng...)
- **Filter Unit**: Lọc theo đơn vị

#### ➕ Thêm người dùng mới:
1. Click nút **"Thêm người dùng"** (màu xanh)
2. Điền form:
   - Họ tên *
   - Email * (phải unique, định dạng @hvhc.edu.vn)
   - Mật khẩu * (tối thiểu 6 ký tự)
   - Vai trò *
   - Đơn vị
   - Số điện thoại
   - Địa chỉ
3. Click **"Tạo tài khoản"**

#### ✏️ Sửa thông tin:
1. Click icon **Edit** (bút chì) ở cột Actions
2. Chỉnh sửa các trường cần thiết
3. Click **"Cập nhật"**

#### 🔒 Khóa/Mở khóa tài khoản:
- Click icon **Lock/Unlock** ở cột Actions
- Xác nhận hành động
- **Lưu ý**: Không thể khóa tài khoản của chính mình

#### 🔑 Reset mật khẩu:
1. Click icon **Key** (chìa khóa) ở cột Actions
2. Nhập mật khẩu mới (tối thiểu 6 ký tự)
3. Click **"Reset mật khẩu"**

#### 🗑️ Xóa tài khoản:
- Click icon **Trash** (thùng rác) ở cột Actions
- Xác nhận xóa
- **Lưu ý**: 
  - Không thể xóa tài khoản của chính mình
  - Xóa mềm (Soft delete) - đổi trạng thái thành INACTIVE

#### 📄 Phân trang:
- Hiển thị 20 users/trang
- Nút Previous/Next ở cuối bảng

---

### 2️⃣ QUẢN LÝ ĐƠN VỊ

#### 🌳 Giao diện cây đơn vị:
- Hiển thị cấu trúc tổ chức theo dạng cây (tree view)
- Các cấp đơn vị:
  - **Level 1**: Học viện, Cơ quan trực thuộc
  - **Level 2**: Khoa, Phòng, Ban
  - **Level 3**: Bộ môn, Tổ, Đội
  - Level 4+: Các cấp thấp hơn

#### 📊 Thông tin đơn vị:
Mỗi đơn vị hiển thị:
- Mã đơn vị
- Tên đơn vị
- Loại (Khoa, Phòng, Bộ môn...)
- Cấp (Level)
- Số cán bộ
- Số đơn vị con

#### ➕ Thêm đơn vị mới:
1. Click nút **"Thêm đơn vị cấp 1"** (đơn vị gốc)
   HOẶC
   Click **"Thêm đơn vị con"** ở đơn vị cha
2. Điền form:
   - Mã đơn vị * (viết HOA, không dấu, VD: KHOA_CNTT)
   - Tên đơn vị * (VD: Khoa Công nghệ Thông tin)
   - Loại * (Khoa, Phòng, Bộ môn...)
   - Cấp * (Level, tự động điền nếu có đơn vị cha)
   - Đơn vị cha (nếu không phải cấp 1)
   - Mô tả
3. Click **"Thêm đơn vị"**

#### ✏️ Sửa đơn vị:
1. Click icon **Edit** (bút chì) ở đơn vị cần sửa
2. Chỉnh sửa thông tin
3. Click **"Cập nhật"**

#### 🗑️ Xóa đơn vị:
- Click icon **Trash** (thùng rác)
- Xác nhận xóa
- **Lưu ý**:
  - Không thể xóa nếu đơn vị có đơn vị con
  - Không thể xóa nếu đơn vị có cán bộ
  - Xóa mềm (Soft delete)

#### 🔽 Mở rộng/Thu gọn:
- Click icon **ChevronRight** để mở rộng đơn vị con
- Click icon **ChevronDown** để thu gọn

---

## 🔒 BẢO MẬT & KIỂM TOÁN

### Tất cả hành động được ghi log vào hệ thống:

✅ Tạo/sửa/xóa tài khoản  
✅ Khóa/mở khóa tài khoản  
✅ Reset mật khẩu  
✅ Tạo/sửa/xóa đơn vị

### Thông tin log bao gồm:
- Người thực hiện (User ID)
- Hành động (Action)
- Thời gian (Timestamp)
- IP Address
- Chi tiết thay đổi (Metadata)

### Truy cập log:
👉 `/dashboard/security/audit` (Nhật ký kiểm toán)

---

## 🚨 LƯU Ý QUAN TRỌNG

### ⚠️ Mật khẩu:
- Tất cả mật khẩu đều được **mã hóa bằng bcrypt** (salt=10)
- Mật khẩu mặc định khi tạo mới: `Hv@2025`
- Người dùng nên đổi mật khẩu ngay sau lần đăng nhập đầu tiên

### ⚠️ Email:
- Email phải **UNIQUE** trong hệ thống
- Định dạng khuyến nghị: `tentaikhoan@hvhc.edu.vn`

### ⚠️ Đơn vị:
- **Cấu trúc cây**: Đơn vị con phải có cấp > cấp cha
- **Không thể xóa** đơn vị có đơn vị con hoặc có cán bộ
- **Mã đơn vị**: Nên viết HOA, không dấu, sử dụng gạch dưới

### ⚠️ RBAC:
- Không thể tự khóa/xóa tài khoản của chính mình
- Chỉ ADMIN có quyền xóa tài khoản
- Giảng viên/Học viên KHÔNG có quyền truy cập 2 chức năng này

---

## 🐛 XỬ LÝ LỖI

### Lỗi thường gặp:

#### 1. Không thấy menu trong sidebar:
- ✅ Kiểm tra quyền: Phải là ADMIN hoặc QUAN_TRI_HE_THONG
- ✅ Đăng xuất và đăng nhập lại
- ✅ Xóa cache trình duyệt (Ctrl+Shift+Delete)

#### 2. Email đã tồn tại:
- ✅ Sử dụng email khác
- ✅ Kiểm tra email trong database

#### 3. Không thể xóa đơn vị:
- ✅ Xóa hết đơn vị con trước
- ✅ Chuyển cán bộ sang đơn vị khác

#### 4. Không thể reset mật khẩu:
- ✅ Mật khẩu phải >= 6 ký tự
- ✅ Kiểm tra quyền ADMIN

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, vui lòng liên hệ:

📧 **Email**: support@hvhc.edu.vn  
☎️ **Hotline**: 024 3826 5656  
🌐 **Website**: https://bigdatahvhc.abacusai.app

---

## 📊 THỐNG KÊ HỆ THỐNG

### Hiện tại:
- **Tổng số users**: 1,299
- **Tổng số đơn vị**: ~50+
- **Roles**: 9 vai trò
- **API Endpoints**: 10 (6 users + 4 units)
- **UI Pages**: 2

---

## ✅ CHECKLIST TRIỂN KHAI

- [x] Database models đã tạo
- [x] API endpoints đã triển khai
- [x] UI pages đã hoàn thành
- [x] Sidebar navigation đã cập nhật
- [x] Translations đã thêm (Vietnamese & English)
- [x] RBAC đã cấu hình
- [x] Audit logging đã tích hợp
- [x] Password hashing đã bảo mật
- [x] Dev server đã restart
- [x] Tài liệu hướng dẫn đã tạo

---

**🎉 Hệ thống đã sẵn sàng sử dụng!**

**Truy cập ngay:**  
👉 http://localhost:3000/dashboard/admin/users  
👉 http://localhost:3000/dashboard/admin/units

---

_Tài liệu này được tạo tự động bởi HVHC BigData Development Team_  
_Version 7.2 - January 2025_
