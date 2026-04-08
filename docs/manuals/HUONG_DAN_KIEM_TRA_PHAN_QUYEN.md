
# 🧪 HƯỚNG DẪN KIỂM TRA HỆ THỐNG PHÂN QUYỀN

## 📋 Mục tiêu kiểm tra

Đảm bảo mỗi vai trò người dùng chỉ có thể:
1. Đăng nhập vào giao diện phù hợp
2. Xem các menu/chức năng được phép
3. KHÔNG thể truy cập các chức năng không được phép
4. Tự động chuyển hướng về dashboard mặc định khi truy cập route không được phép

## 🔑 Tài khoản test

Database đã có sẵn các tài khoản test với các vai trò khác nhau:

```javascript
// Cách tìm tài khoản test trong database:
// Email format: test{số}@hvhc.edu.vn
// Password: password123

// Các vai trò được phân bổ xoay vòng:
const roles = [
  'HOC_VIEN_SINH_VIEN',      // test0, test8, test16...
  'GIANG_VIEN',               // test1, test9, test17...
  'CHU_NHIEM_BO_MON',         // test2, test10, test18...
  'CHI_HUY_KHOA_PHONG',       // test3, test11, test19...
  'CHI_HUY_HOC_VIEN',         // test4, test12, test20...
  'NGHIEN_CUU_VIEN',          // test5, test13, test21...
  'KY_THUAT_VIEN',            // test6, test14, test22...
  'QUAN_TRI_HE_THONG',        // test7, test15, test23...
];
```

## 📝 Kịch bản kiểm tra

### Test Case 1: Học viên/Sinh viên (HOC_VIEN_SINH_VIEN)

```
✅ Đăng nhập:
- Email: test0@hvhc.edu.vn
- Password: password123

✅ Expected Results:
1. Redirect to: /dashboard/student
2. Sidebar chỉ hiển thị:
   - Dashboard
   - Student Dashboard
   - Training
   - Data → Query (hạn chế)
   
3. KHÔNG thấy:
   - Command Dashboard
   - Faculty Dashboard
   - Instructor Dashboard
   - Admin Dashboard
   - Users Management
   - Services Management
   - Security & Audit
   - ML Training
   - Research
   - Data Upload

✅ Test Access Denied:
- Thử truy cập: /dashboard/command
  → Expected: Redirect to /dashboard/student?error=access_denied
  
- Thử truy cập: /dashboard/users
  → Expected: Redirect to /dashboard/student?error=access_denied
  
- Thử truy cập: /dashboard/instructor
  → Expected: Redirect to /dashboard/student?error=access_denied
```

### Test Case 2: Giảng viên (GIANG_VIEN)

```
✅ Đăng nhập:
- Email: test1@hvhc.edu.vn
- Password: password123

✅ Expected Results:
1. Redirect to: /dashboard/instructor
2. Sidebar hiển thị:
   - Dashboard
   - Instructor Dashboard
   - Datalake
   - Training
   - Research
   - AI Training
   - Data (Upload, Query)
   - Analytics
   - Reports
   - ML Engine (Models, Training)
   
3. KHÔNG thấy:
   - Command Dashboard
   - Faculty Dashboard
   - Admin Dashboard
   - Users Management
   - Services Management
   - Security & Audit
   - Logs

✅ Test Access Denied:
- Thử truy cập: /dashboard/command
  → Expected: Redirect to /dashboard/instructor?error=access_denied
  
- Thử truy cập: /dashboard/users
  → Expected: Redirect to /dashboard/instructor?error=access_denied
```

### Test Case 3: Chủ nhiệm bộ môn (CHU_NHIEM_BO_MON)

```
✅ Đăng nhập:
- Email: test2@hvhc.edu.vn
- Password: password123

✅ Expected Results:
1. Redirect to: /dashboard/department-head
2. Sidebar hiển thị:
   - Dashboard
   - Department Head Dashboard
   - Instructor Dashboard (có thể xem)
   - Datalake
   - Training
   - Research
   - AI Training
   - Data (Upload, Query)
   - Analytics
   - Reports
   - ML Engine
   
3. KHÔNG thấy:
   - Command Dashboard
   - Faculty Dashboard (cấp cao hơn)
   - Admin Dashboard
   - Users Management
   - Services Management
   - Security & Audit

✅ Test Access Denied:
- Thử truy cập: /dashboard/command
  → Expected: Redirect to /dashboard/department-head?error=access_denied
```

### Test Case 4: Chỉ huy khoa/phòng (CHI_HUY_KHOA_PHONG)

```
✅ Đăng nhập:
- Email: test3@hvhc.edu.vn
- Password: password123

✅ Expected Results:
1. Redirect to: /dashboard/faculty
2. Sidebar hiển thị:
   - Dashboard
   - Faculty Dashboard
   - Department Head Dashboard (xem cấp dưới)
   - Instructor Dashboard (xem cấp dưới)
   - Datalake
   - Training
   - Research
   - AI Training
   - Data (Upload, Query)
   - Analytics
   - Reports
   - ML Engine
   
3. KHÔNG thấy:
   - Command Dashboard (cấp cao hơn)
   - Admin Dashboard
   - Users Management (chỉ Command & Admin)
   - Services Management
   - Security & Audit

✅ Test Access Denied:
- Thử truy cập: /dashboard/command
  → Expected: Redirect to /dashboard/faculty?error=access_denied
  
- Thử truy cập: /dashboard/users
  → Expected: Redirect to /dashboard/faculty?error=access_denied
```

### Test Case 5: Chỉ huy học viện (CHI_HUY_HOC_VIEN)

```
✅ Đăng nhập:
- Email: test4@hvhc.edu.vn
- Password: password123

✅ Expected Results:
1. Redirect to: /dashboard/command
2. Sidebar hiển thị:
   - Dashboard
   - Command Dashboard ⭐
   - Faculty Dashboard
   - Department Head Dashboard
   - Instructor Dashboard
   - Student Dashboard
   - Datalake
   - Training
   - Research
   - AI Training
   - Data (Query, Export)
   - Analytics
   - Reports
   - ML Engine (View only)
   - Users (View)
   - Monitoring
   - Alerts
   - Logs
   
3. KHÔNG thấy:
   - Admin Dashboard (dành cho QUAN_TRI)
   - Services Management (dành cho QUAN_TRI)
   - Security & Permissions (dành cho QUAN_TRI)

✅ Test Access Denied:
- Thử truy cập: /dashboard/admin
  → Expected: Redirect to /dashboard/command?error=access_denied
  
- Thử truy cập: /dashboard/services
  → Expected: Redirect to /dashboard/command?error=access_denied
```

### Test Case 6: Quản trị hệ thống (QUAN_TRI_HE_THONG)

```
✅ Đăng nhập:
- Email: test7@hvhc.edu.vn
- Password: password123

✅ Expected Results:
1. Redirect to: /dashboard/admin
2. Sidebar hiển thị: TẤT CẢ menu items
   - Tất cả dashboards
   - Tất cả modules
   - Users Management
   - Services Management
   - Security & Audit
   - Logs
   - Settings
   
3. Có thể truy cập: MỌI ROUTE

✅ Test Full Access:
- Thử truy cập: /dashboard/command → ✅ Thành công
- Thử truy cập: /dashboard/faculty → ✅ Thành công
- Thử truy cập: /dashboard/users → ✅ Thành công
- Thử truy cập: /dashboard/services → ✅ Thành công
- Thử truy cập: /dashboard/security → ✅ Thành công
```

## 🔍 Các điểm cần kiểm tra chi tiết

### 1. Authentication Flow
```
☐ Login form hoạt động
☐ Sai email/password → Hiện lỗi rõ ràng
☐ Đúng credentials → Redirect đến dashboard tương ứng
☐ Session được tạo và lưu
☐ Token được ghi vào cookie
```

### 2. Dashboard Redirect
```
☐ Mỗi vai trò redirect đến đúng dashboard
☐ Không có infinite redirect loop
☐ Loading state hiển thị khi checking auth
☐ Smooth transition giữa các page
```

### 3. Sidebar Filtering
```
☐ Sidebar chỉ hiển thị menu được phép
☐ Sub-menu được filter đúng
☐ Không có menu item trống hoặc broken
☐ Active state highlight đúng menu
☐ Click vào menu → Navigate thành công
```

### 4. Route Protection
```
☐ Protected routes yêu cầu authentication
☐ Unauthorized access → Redirect về dashboard mặc định
☐ Error message hiển thị rõ ràng (access_denied)
☐ Không có memory leak hay performance issue
☐ Back button không bypass security
```

### 5. API Authorization
```
☐ API routes kiểm tra authentication
☐ API routes kiểm tra authorization
☐ 401 response khi chưa login
☐ 403 response khi không đủ quyền
☐ Error messages rõ ràng
```

### 6. Session Management
```
☐ Session timeout hoạt động (30 days)
☐ Auto logout khi token expired
☐ Token refresh tự động
☐ Logout button xóa session
☐ Logout → Redirect về login page
```

## 🐛 Common Issues và Cách Fix

### Issue 1: Infinite Redirect Loop
```
Problem: Login → Redirect → Redirect → Redirect...
Solution: Kiểm tra middleware logic, đảm bảo có base case để stop
```

### Issue 2: Sidebar không filter
```
Problem: Tất cả user đều thấy toàn bộ menu
Solution: Kiểm tra:
- useSession() có trả về role không?
- canAccessRoute() có hoạt động không?
- filteredNavigationGroups được sử dụng đúng không?
```

### Issue 3: Route protection không hoạt động
```
Problem: User vẫn truy cập được route không được phép
Solution: Kiểm tra:
- middleware.ts có được apply đúng routes không?
- routeRoleRequirements có define đúng không?
- getToken() có lấy được token không?
```

### Issue 4: API 401/403 errors
```
Problem: API calls bị reject dù đã login
Solution: Kiểm tra:
- Authorization header có được gửi không?
- Token còn valid không?
- API middleware có hoạt động không?
```

## ✅ Acceptance Criteria

Hệ thống PASS test khi:

- [ ] Tất cả 8 vai trò đăng nhập thành công
- [ ] Mỗi vai trò redirect đến đúng dashboard
- [ ] Sidebar filter chính xác cho từng vai trò
- [ ] Route protection hoạt động (access denied khi không có quyền)
- [ ] Error handling và user feedback tốt
- [ ] Performance ổn định (no lag, no memory leak)
- [ ] Không có console errors
- [ ] Audit logs được ghi chính xác
- [ ] Session management hoạt động tốt

## 📊 Test Results Template

```markdown
### Test Session: [Date/Time]
Tester: [Name]
Environment: [Dev/Staging/Prod]

#### Test Case 1: HOC_VIEN_SINH_VIEN
- [ ] Login successful
- [ ] Correct dashboard redirect
- [ ] Sidebar filtered correctly
- [ ] Access denied works
- [ ] No console errors
Notes: ____

#### Test Case 2: GIANG_VIEN
- [ ] Login successful
- [ ] Correct dashboard redirect
- [ ] Sidebar filtered correctly
- [ ] Access denied works
- [ ] No console errors
Notes: ____

[... repeat for all roles ...]

#### Overall Results:
- Pass rate: __/8 roles (100% expected)
- Critical issues: __
- Minor issues: __
- Performance: [Good/Fair/Poor]
- Ready for production: [Yes/No]
```

---

**Tài liệu này được tạo ngày**: 15/10/2025  
**Phiên bản**: 1.0  
**Cập nhật cuối**: 15/10/2025
