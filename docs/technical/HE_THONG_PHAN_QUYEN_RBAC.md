
# 🔐 HỆ THỐNG PHÂN QUYỀN TRUY CẬP (RBAC)

## 📋 Tổng quan

Hệ thống phân quyền truy cập dựa trên vai trò (Role-Based Access Control - RBAC) đã được triển khai hoàn chỉnh cho phần mềm quản lý Big Data HVHC. Mỗi tài khoản sau khi đăng nhập sẽ chỉ thấy giao diện và chức năng phù hợp với vai trò của họ.

## 👥 Các vai trò người dùng

### 1. **QUAN_TRI_HE_THONG** (Quản trị hệ thống)
- **Quyền hạn**: Toàn quyền truy cập
- **Dashboard mặc định**: `/dashboard/admin`
- **Chức năng**:
  - Quản lý toàn bộ hệ thống
  - Quản lý người dùng
  - Quản lý dịch vụ và bảo mật
  - Xem logs và audit
  - Truy cập tất cả dashboard

### 2. **CHI_HUY_HOC_VIEN** (Chỉ huy học viện)
- **Quyền hạn**: Quản lý cấp cao
- **Dashboard mặc định**: `/dashboard/command`
- **Chức năng**:
  - Xem Command Dashboard với tổng quan toàn học viện
  - Xem tất cả dashboard cấp dưới
  - Phê duyệt nghiên cứu
  - Quản lý đào tạo
  - Xem báo cáo tổng hợp
  - Xuất dữ liệu
  - Xem logs và audit

### 3. **CHI_HUY_KHOA_PHONG** (Chỉ huy khoa/phòng)
- **Quyền hạn**: Quản lý khoa/phòng
- **Dashboard mặc định**: `/dashboard/faculty`
- **Chức năng**:
  - Xem Faculty Dashboard
  - Quản lý giảng viên khoa
  - Phê duyệt nghiên cứu khoa
  - Quản lý đào tạo khoa
  - Tạo và xuất báo cáo
  - Truy vấn dữ liệu

### 4. **CHU_NHIEM_BO_MON** (Chủ nhiệm bộ môn)
- **Quyền hạn**: Quản lý bộ môn
- **Dashboard mặc định**: `/dashboard/department-head`
- **Chức năng**:
  - Xem Department Head Dashboard
  - Quản lý giảng viên bộ môn
  - Tạo nghiên cứu
  - Tạo và quản lý đào tạo
  - Upload và truy vấn dữ liệu
  - Huấn luyện mô hình ML

### 5. **GIANG_VIEN** (Giảng viên)
- **Quyền hạn**: Giảng dạy và nghiên cứu
- **Dashboard mặc định**: `/dashboard/instructor`
- **Chức năng**:
  - Xem Instructor Dashboard
  - Tạo nghiên cứu
  - Tạo nội dung đào tạo
  - Upload và truy vấn dữ liệu
  - Huấn luyện mô hình ML
  - Xem báo cáo

### 6. **NGHIEN_CUU_VIEN** (Nghiên cứu viên)
- **Quyền hạn**: Nghiên cứu khoa học
- **Dashboard mặc định**: `/dashboard`
- **Chức năng**:
  - Tạo và xem nghiên cứu
  - Upload và truy vấn dữ liệu
  - Huấn luyện mô hình ML
  - Xem báo cáo

### 7. **HOC_VIEN_SINH_VIEN** (Học viên/Sinh viên)
- **Quyền hạn**: Học tập
- **Dashboard mặc định**: `/dashboard/student`
- **Chức năng**:
  - Xem Student Dashboard
  - Xem nội dung đào tạo
  - Truy vấn dữ liệu (hạn chế)
  - Xem điểm và tiến độ học tập

### 8. **KY_THUAT_VIEN** (Kỹ thuật viên)
- **Quyền hạn**: Hỗ trợ kỹ thuật
- **Dashboard mặc định**: `/dashboard/admin`
- **Chức năng**:
  - Quản lý dịch vụ hệ thống
  - Xem logs và audit
  - Upload và truy vấn dữ liệu
  - Xem mô hình ML

## 🔒 Bảo vệ route

### Middleware tự động kiểm tra:
1. **Authentication**: Người dùng phải đăng nhập
2. **Authorization**: Người dùng phải có quyền truy cập route
3. **Redirection**: Tự động chuyển hướng về dashboard phù hợp nếu không có quyền

### Routes được bảo vệ:

| Route | Vai trò được phép |
|-------|-------------------|
| `/dashboard/command` | CHI_HUY_HOC_VIEN, QUAN_TRI_HE_THONG |
| `/dashboard/faculty` | CHI_HUY_KHOA_PHONG, CHI_HUY_HOC_VIEN, QUAN_TRI_HE_THONG |
| `/dashboard/department-head` | CHU_NHIEM_BO_MON, CHI_HUY_KHOA_PHONG, CHI_HUY_HOC_VIEN, QUAN_TRI_HE_THONG |
| `/dashboard/instructor` | GIANG_VIEN, CHU_NHIEM_BO_MON, CHI_HUY_KHOA_PHONG, CHI_HUY_HOC_VIEN, QUAN_TRI_HE_THONG |
| `/dashboard/student` | HOC_VIEN_SINH_VIEN, GIANG_VIEN, QUAN_TRI_HE_THONG |
| `/dashboard/admin` | QUAN_TRI_HE_THONG, KY_THUAT_VIEN |
| `/dashboard/users` | QUAN_TRI_HE_THONG, CHI_HUY_HOC_VIEN |
| `/dashboard/services` | QUAN_TRI_HE_THONG, KY_THUAT_VIEN |
| `/dashboard/security` | QUAN_TRI_HE_THONG, KY_THUAT_VIEN |
| `/dashboard/logs` | QUAN_TRI_HE_THONG, KY_THUAT_VIEN, CHI_HUY_HOC_VIEN |

## 📱 Sidebar động

Sidebar tự động lọc các menu item dựa trên quyền của người dùng:

### Ví dụ:
- **Học viên/Sinh viên** chỉ thấy:
  - Dashboard
  - Student Dashboard
  - Training
  - Data Query (hạn chế)
  
- **Giảng viên** thấy thêm:
  - Instructor Dashboard
  - Research
  - Data Upload
  - ML Training
  - Reports
  
- **Chỉ huy học viện** thấy gần như toàn bộ:
  - Command Dashboard
  - Tất cả dashboard cấp dưới
  - Users Management
  - Reports & Analytics
  - Audit & Logs

## 🧪 Hướng dẫn kiểm tra

### Bước 1: Tạo tài khoản test cho từng vai trò

```sql
-- Đã có sẵn trong database từ seed data
-- Mỗi vai trò có ít nhất 1 user để test
```

### Bước 2: Kiểm tra từng vai trò

1. **Đăng nhập với tài khoản test**
2. **Kiểm tra dashboard mặc định**: Có đúng là dashboard của vai trò không?
3. **Kiểm tra sidebar**: Chỉ thấy các menu được phép?
4. **Thử truy cập route không được phép**: Có bị chuyển hướng không?
5. **Kiểm tra chức năng**: Các API có hoạt động đúng không?

### Ví dụ kiểm tra:

```bash
# Test 1: Đăng nhập với vai trò Học viên
Email: test0@hvhc.edu.vn
Password: password123
Expected: Redirect to /dashboard/student
Expected: Sidebar chỉ có Student Dashboard, Training, Query

# Test 2: Đăng nhập với vai trò Giảng viên  
Email: test1@hvhc.edu.vn
Password: password123
Expected: Redirect to /dashboard/instructor
Expected: Sidebar có Instructor Dashboard, Research, ML, etc.

# Test 3: Đăng nhập với vai trò Chỉ huy học viện
Email: test2@hvhc.edu.vn  
Password: password123
Expected: Redirect to /dashboard/command
Expected: Sidebar có hầu hết các menu items
```

### Bước 3: Kiểm tra Access Denied

1. Đăng nhập với tài khoản Học viên
2. Thử truy cập trực tiếp: `https://bigdata.abacusai.app/dashboard/command`
3. Expected: Tự động chuyển về `/dashboard/student?error=access_denied`
4. Hiển thị thông báo lỗi: "Bạn không có quyền truy cập trang này"

## 🔧 Files quan trọng

1. **`lib/rbac.ts`**: Định nghĩa quyền và logic RBAC
2. **`lib/auth-utils.ts`**: Các hàm tiện ích kiểm tra quyền
3. **`middleware.ts`**: Middleware bảo vệ routes
4. **`middleware/rbac-middleware.ts`**: Middleware cho API routes
5. **`components/dashboard/sidebar-enhanced.tsx`**: Sidebar động theo vai trò

## 📊 Luồng xác thực và phân quyền

```
User Login
    ↓
NextAuth Authentication
    ↓
Session với Role được tạo
    ↓
Middleware kiểm tra route
    ↓
    ├─ Có quyền → Cho phép truy cập
    ├─ Không quyền → Redirect to Default Dashboard
    └─ Chưa login → Redirect to /login
    ↓
Sidebar filter menu theo role
    ↓
Component/Page render với data phù hợp
```

## 🎯 Nguyên tắc thiết kế

1. **Security by default**: Mặc định từ chối, chỉ cho phép khi có quyền rõ ràng
2. **Principle of least privilege**: Mỗi vai trò chỉ có quyền tối thiểu cần thiết
3. **Defense in depth**: Kiểm tra quyền ở nhiều lớp (middleware, component, API)
4. **User experience**: Chỉ hiển thị những gì user có thể truy cập
5. **Audit trail**: Log mọi truy cập và access denied

## ✅ Checklist kiểm tra phân quyền

- [ ] Mỗi vai trò đăng nhập vào đúng dashboard mặc định
- [ ] Sidebar hiển thị đúng menu cho từng vai trò
- [ ] Route protection hoạt động (access denied khi không có quyền)
- [ ] API endpoints kiểm tra quyền đúng
- [ ] Audit logs ghi lại truy cập
- [ ] Error handling và user feedback rõ ràng
- [ ] Performance không bị ảnh hưởng

## 🚀 Triển khai production

### Checklist trước khi deploy:

1. ✅ Test đầy đủ tất cả vai trò
2. ✅ Verify route protection
3. ✅ Check API authorization
4. ✅ Test edge cases (session expired, invalid token, etc.)
5. ✅ Load testing với nhiều users
6. ✅ Security audit
7. ✅ Documentation đầy đủ

### Monitoring:

- Monitor access denied logs
- Track permission changes
- Audit user role changes
- Alert on suspicious activities

## 📝 Ghi chú quan trọng

⚠️ **CRITICAL**: 
- KHÔNG BAO GIỜ expose toàn bộ dữ liệu cho client
- LUÔN LUÔN kiểm tra quyền ở backend
- Session timeout: 30 ngày
- Token refresh tự động
- Logout tự động khi token expired

🔐 **Security Best Practices**:
- Passwords được hash với bcrypt
- JWT tokens signed và verified
- CSRF protection enabled
- XSS protection enabled
- Rate limiting cho login attempts

---

**Tài liệu này được tạo ngày**: 15/10/2025  
**Phiên bản**: 1.0  
**Người tạo**: AI Development Team  
**Cập nhật cuối**: 15/10/2025
