# THÔNG TIN ĐĂNG NHẬP HỆ THỐNG

## Các vấn đề đã khắc phục ✅

### 1. Thiếu biến môi trường NEXTAUTH_URL
- **Vấn đề**: File `.env` không có biến `NEXTAUTH_URL`
- **Giải pháp**: Đã thêm `NEXTAUTH_URL=https://bigdata.abacusai.app`
- **Tác động**: NextAuth cần biến này để xác thực đúng cách

### 2. Mật khẩu không được hash đúng
- **Vấn đề**: Mật khẩu trong database không khớp với mật khẩu test
- **Nguyên nhân**: Script seed ban đầu dùng mật khẩu `Password123!` thay vì `password123`
- **Giải pháp**: Đã cập nhật tất cả 1010 users với mật khẩu mới được hash đúng

---

## Thông Tin Đăng Nhập 🔐

### Mật khẩu chung cho tất cả tài khoản
```
password123
```

### Tài khoản Quản trị hệ thống (Admin)
```
Email:    admin@hvhc.edu.vn
Password: password123
Vai trò:  QUAN_TRI_HE_THONG
```

### Tài khoản Giảng viên

#### Giảng viên Hậu cần
```
Email:    gv.haucan@hvhc.edu.vn
Password: password123
Vai trò:  GIANG_VIEN
Đơn vị:   KHCL
```

#### Giảng viên Kỹ thuật
```
Email:    gv.ktxd@hvhc.edu.vn
Password: password123
Vai trò:  GIANG_VIEN
Đơn vị:   KTXD
```

#### Giảng viên CNTT
```
Email:    gv.cntt@hvhc.edu.vn
Password: password123
Vai trò:  GIANG_VIEN
Đơn vị:   KCNTT
```

### Tài khoản Học viên/Sinh viên

#### Học viên Quân sự 01
```
Email:    hv.quansu01@hvhc.edu.vn
Password: password123
Vai trò:  HOC_VIEN_SINH_VIEN
Đơn vị:   KHCL
```

#### Học viên Quân sự 02
```
Email:    hv.quansu02@hvhc.edu.vn
Password: password123
Vai trò:  HOC_VIEN_SINH_VIEN
Đơn vị:   KVHK
```

#### Sinh viên Dân sự 01
```
Email:    sv.dansu01@hvhc.edu.vn
Password: password123
Vai trò:  HOC_VIEN_SINH_VIEN
Đơn vị:   KCNTT
```

### Tài khoản Nghiên cứu viên
```
Email:    nckh@hvhc.edu.vn
Password: password123
Vai trò:  NGHIEN_CUU_VIEN
Đơn vị:   HVHC
```

---

## Cách Đăng Nhập 📝

1. Truy cập: https://bigdata.abacusai.app/login
2. Nhập email của tài khoản muốn sử dụng
3. Nhập mật khẩu: `password123`
4. Click "Đăng nhập"

---

## Tổng Số Tài Khoản 📊

- **Tổng số users**: 1010 tài khoản
- **Tất cả** đã được cập nhật với mật khẩu: `password123`
- **Trạng thái**: ACTIVE (Đang hoạt động)

---

## Dashboard Tương Ứng Với Vai Trò 🎯

| Vai trò | Dashboard |
|---------|-----------|
| QUAN_TRI_HE_THONG | /dashboard/admin |
| CHI_HUY_HOC_VIEN | /dashboard/command |
| CHI_HUY_KHOA_PHONG | /dashboard/faculty-leadership |
| CHU_NHIEM_BO_MON | /dashboard/department-head |
| GIANG_VIEN | /dashboard/instructor |
| HOC_VIEN_SINH_VIEN | /dashboard/student |
| NGHIEN_CUU_VIEN | /dashboard/research |
| KY_THUAT_VIEN | /dashboard/admin |

---

## Lưu Ý Quan Trọng ⚠️

1. **Bảo mật**: Trong môi trường production, nên đổi mật khẩu cho tất cả tài khoản
2. **Mật khẩu test**: `password123` chỉ dùng cho môi trường development/testing
3. **Session**: Phiên đăng nhập có thời hạn 30 ngày
4. **Auto redirect**: Sau đăng nhập thành công, hệ thống tự động chuyển đến dashboard phù hợp với vai trò

---

## Kiểm Tra Tài Khoản 🔍

Nếu cần xem danh sách tất cả users, chạy lệnh:

```bash
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space
yarn node check_users.js
```

---

## Hỗ Trợ 💬

Nếu vẫn gặp vấn đề đăng nhập:
1. Xóa cache trình duyệt
2. Thử chế độ ẩn danh (Incognito)
3. Kiểm tra console của trình duyệt (F12) để xem lỗi

---

**Ngày cập nhật**: 15/10/2025
**Checkpoint**: Fixed login authentication with correct password hashing
**URL**: https://bigdata.abacusai.app
