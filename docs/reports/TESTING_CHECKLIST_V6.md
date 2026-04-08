
# ✅ HVHC Big Data Platform - Testing Checklist (Version 6)
**Danh sách kiểm tra toàn diện trước triển khai**

---

## 🎯 I. TESTING OVERVIEW

### Mục tiêu
- Đảm bảo 100% chức năng hoạt động
- Phát hiện và sửa lỗi trước khi demo
- Verify performance requirements
- Confirm security và permissions

### Testing Levels
1. **Unit Testing**: Từng component riêng lẻ
2. **Integration Testing**: Tích hợp giữa các module
3. **System Testing**: Toàn bộ hệ thống end-to-end
4. **User Acceptance Testing (UAT)**: Người dùng thực tế

---

## 📋 II. FUNCTIONAL TESTING

### A. Authentication & Authorization

#### Login Flow
- [ ] Đăng nhập với email/password hợp lệ
- [ ] Hiển thị lỗi với credentials không đúng
- [ ] Session timeout sau 1 giờ không hoạt động
- [ ] Logout thành công
- [ ] Remember me checkbox hoạt động

#### RBAC Permissions
- [ ] Admin: Truy cập tất cả dashboards
- [ ] Chỉ huy HVHC: Chỉ xem dashboard cấp cao
- [ ] Chỉ huy Khoa: Chỉ xem data đơn vị mình
- [ ] Chủ nhiệm Bộ môn: Chỉ xem data bộ môn
- [ ] Giảng viên: Chỉ xem lớp mình dạy
- [ ] Học viên: Chỉ xem data cá nhân
- [ ] Redirect về /unauthorized nếu không có quyền

---

### B. Dashboard Chỉ huy HVHC (`/dashboard/command`)

#### KPI Cards
- [ ] Hiển thị đúng số liệu tổng học viên
- [ ] Hiển thị đúng số giảng viên
- [ ] Hiển thị đúng số nghiên cứu
- [ ] Hiển thị đúng ngân sách/tài chính
- [ ] Số liệu cập nhật realtime (hoặc cached 5 phút)

#### Biểu đồ
- [ ] Biểu đồ tuyển sinh load đúng
- [ ] Biểu đồ hiệu suất load đúng
- [ ] Biểu đồ tài chính load đúng
- [ ] Chart.js/Recharts render không lỗi
- [ ] Responsive trên mobile

#### Cảnh báo AI
- [ ] Hiển thị cảnh báo học viên yếu
- [ ] Hiển thị cảnh báo thiếu vật tư
- [ ] Hiển thị nguy cơ rủi ro
- [ ] Click vào cảnh báo → Chi tiết

#### Export báo cáo
- [ ] Xuất báo cáo PDF thành công
- [ ] PDF chứa đầy đủ thông tin
- [ ] Tên file theo format chuẩn
- [ ] Download tự động

---

### C. Dashboard Giảng viên (`/dashboard/instructor`)

#### Tab "Học viên"
- [ ] Load danh sách học viên đúng
- [ ] Search box hoạt động
- [ ] Filter theo xếp loại (Xuất sắc/Khá/TB/Yếu)
- [ ] Sắp xếp theo cột
- [ ] Hiển thị đúng điểm, điểm danh, bài tập
- [ ] Badge xếp loại đúng màu
- [ ] Icon cảnh báo hiển thị đúng

#### Tab "Phân tích AI" (NLP) ★ NEW
- [ ] API `/api/nlp/feedback-sentiment` trả về 200
- [ ] Pie chart phân bố cảm xúc render đúng
- [ ] Line chart xu hướng render đúng
- [ ] Top keywords hiển thị đầy đủ (Positive/Neutral/Negative)
- [ ] AI suggestions hiển thị 3 gợi ý
- [ ] Badge priority đúng màu (High/Medium/Low)
- [ ] Recent feedback list load đúng
- [ ] Sentiment icon đúng (TrendingUp/Down/Minus)
- [ ] Refresh button làm mới dữ liệu
- [ ] Export button (placeholder OK)

#### Tab "Hiệu suất"
- [ ] Placeholder component hiển thị

---

### D. Dashboard Admin (`/dashboard/admin`)

#### Overview Tab
- [ ] Hiển thị tổng users
- [ ] Hiển thị active users
- [ ] Hiển thị services status
- [ ] Hiển thị storage usage
- [ ] Cards render đúng layout

#### Users Tab (Existing)
- [ ] Load danh sách users
- [ ] Hiển thị role badges
- [ ] Hiển thị status badges
- [ ] Last login timestamp đúng

#### Services Tab
- [ ] Hiển thị PostgreSQL status
- [ ] Hiển thị Redis status
- [ ] Hiển thị MinIO status
- [ ] Uptime % hiển thị
- [ ] Response time hiển thị

#### Audit Tab
- [ ] Load audit logs
- [ ] Filter theo severity
- [ ] Timeline đúng thứ tự
- [ ] Icon status đúng

---

### E. Dashboard Admin RBAC (`/dashboard/admin/rbac`) ★ NEW

#### Tab "Người dùng"
- [ ] GET `/api/admin/rbac/users` trả về 200
- [ ] Load danh sách users từ DB
- [ ] Search box hoạt động
- [ ] Filter theo role
- [ ] Filter theo status
- [ ] Avatar initials đúng
- [ ] Role badge đúng
- [ ] Status badge đúng (Active/Inactive/Suspended)
- [ ] Last login hiển thị
- [ ] Button "Thêm người dùng" mở dialog
- [ ] Dialog create user hiển thị form
- [ ] Select role dropdown có 8 options
- [ ] Button "Chỉnh sửa" mở dialog với data
- [ ] Button "Xóa" hiện confirm dialog
- [ ] POST `/api/admin/rbac/users` tạo user mới
- [ ] DELETE `/api/admin/rbac/users/[id]` xóa user

#### Tab "Vai trò"
- [ ] Hiển thị 8 role cards
- [ ] Mỗi card có: Icon, Label, Description
- [ ] User count đúng
- [ ] Permission count đúng
- [ ] Color coding đúng cho từng role
- [ ] Button "Tạo vai trò mới" (placeholder OK)
- [ ] Button "Edit" mỗi role (placeholder OK)

#### Tab "Quyền hạn"
- [ ] Permission matrix table render
- [ ] 10 permissions × 8 roles = 80 cells
- [ ] ✅ CheckCircle hiển thị có quyền
- [ ] ❌ XCircle hiển thị không quyền
- [ ] Scroll horizontal nếu table quá rộng
- [ ] Sticky left column (Module/Quyền)
- [ ] Legend hiển thị đúng

#### Tab "Nhật ký"
- [ ] GET `/api/admin/rbac/audit-logs` trả về 200
- [ ] Load 5 mock audit logs
- [ ] Filter theo status (SUCCESS/FAILED/WARNING)
- [ ] Filter theo severity (CRITICAL/HIGH/MEDIUM/LOW)
- [ ] Search box hoạt động
- [ ] Icon status đúng màu
- [ ] Badge status đúng
- [ ] Badge severity đúng
- [ ] Timestamp format: vi-VN locale
- [ ] IP address hiển thị đúng
- [ ] Details text hiển thị
- [ ] Button "Xuất nhật ký" (placeholder OK)

---

### F. Dashboard Học viên (`/dashboard/student`)

#### Thông tin cá nhân
- [ ] Hiển thị điểm trung bình
- [ ] Hiển thị điểm danh %
- [ ] Hiển thị xếp hạng
- [ ] Progress bars đúng

#### AI Recommendations
- [ ] Hiển thị gợi ý học tập
- [ ] Dự đoán điểm cuối kỳ
- [ ] Lộ trình học tập

---

## 🚀 III. PERFORMANCE TESTING

### A. Redis Caching

#### Cache Hit Rate
- [ ] Lần đầu load dashboard: ~1-2s
- [ ] Lần sau load dashboard: <0.5s (from cache)
- [ ] Cache TTL Dashboard: 5 phút
- [ ] Cache TTL AI Predictions: 30 phút
- [ ] Cache TTL Static Data: 24 giờ

#### Cache Invalidation
- [ ] Khi tạo user mới → invalidate user cache
- [ ] Khi cập nhật role → invalidate permission cache
- [ ] Khi tạo audit log → invalidate audit cache
- [ ] Manual refresh button → bypass cache

#### Monitoring
- [ ] Redis connection status: ✅ Connected
- [ ] Redis memory usage < 500MB
- [ ] Cache keys đúng format: `dashboard:type:userId`

---

### B. API Response Time

| Endpoint | Expected | Actual | Status |
|----------|----------|--------|--------|
| `/api/dashboard/command/executive-summary` | <500ms | ___ | ⬜ |
| `/api/dashboard/instructor/stats` | <300ms | ___ | ⬜ |
| `/api/nlp/feedback-sentiment` | <800ms | ___ | ⬜ |
| `/api/admin/rbac/users` | <400ms | ___ | ⬜ |
| `/api/admin/rbac/audit-logs` | <300ms | ___ | ⬜ |

---

### C. Concurrent Users

- [ ] 10 users đồng thời: Response time < 1s
- [ ] 50 users đồng thời: Response time < 2s
- [ ] 100 users đồng thời: Response time < 3s
- [ ] No crashes under load

---

## 🔒 IV. SECURITY TESTING

### A. Authentication
- [ ] JWT token hết hạn sau 1h
- [ ] Refresh token hoạt động
- [ ] Password hashing với bcrypt
- [ ] SQL injection prevention
- [ ] XSS prevention

### B. Authorization
- [ ] RBAC middleware hoạt động
- [ ] Unauthorized access → 401/403
- [ ] Data isolation theo role
- [ ] API routes protected

### C. Audit Logging
- [ ] Mọi thao tác đều ghi log
- [ ] Log chứa: timestamp, user, action, resource
- [ ] Failed login attempts logged
- [ ] Data changes tracked

---

## 📱 V. UI/UX TESTING

### A. Responsive Design
- [ ] Desktop (1920×1080): ✅ Perfect
- [ ] Laptop (1366×768): ✅ Good
- [ ] Tablet (768×1024): ✅ Readable
- [ ] Mobile (375×667): ⚠️ Basic support

### B. Browser Compatibility
- [ ] Chrome 120+: ✅
- [ ] Edge 120+: ✅
- [ ] Firefox 120+: ✅
- [ ] Safari 17+: ⚠️ Test needed

### C. Dark Mode
- [ ] Toggle dark/light mode hoạt động
- [ ] Colors readable trong cả 2 modes
- [ ] Charts render đúng trong dark mode

### D. Loading States
- [ ] Skeleton loaders khi fetch data
- [ ] Spinner animation đúng
- [ ] Disable buttons khi đang submit
- [ ] Toast notifications hiển thị

---

## 🗄️ VI. DATABASE TESTING

### A. Data Integrity
- [ ] Foreign keys constraints hoạt động
- [ ] Unique constraints hoạt động
- [ ] Default values đúng
- [ ] Timestamps tự động (createdAt, updatedAt)

### B. Migrations
- [ ] Prisma schema sync với database
- [ ] Migrations run successfully
- [ ] Rollback hoạt động nếu cần

### C. Backup & Recovery
- [ ] Database backup script hoạt động
- [ ] Restore từ backup thành công
- [ ] Backup schedule (daily/weekly)

---

## 🐳 VII. DOCKER & DEPLOYMENT TESTING

### A. Docker Compose
- [ ] `docker compose up -d` chạy thành công
- [ ] Tất cả services start: postgres, redis, minio, nextjs, ml_engine
- [ ] Health checks pass
- [ ] Networks configured đúng
- [ ] Volumes persist data

### B. Environment Variables
- [ ] `.env` file configured đúng
- [ ] DATABASE_URL đúng
- [ ] REDIS_URL đúng
- [ ] NEXTAUTH_SECRET set
- [ ] NEXTAUTH_URL đúng

### C. Production Build
- [ ] `yarn build` thành công
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Build size reasonable (<50MB)

---

## 📊 VIII. DATA QUALITY TESTING

### A. Seed Data
- [ ] `seed.ts` chạy thành công
- [ ] Tạo đủ users (1,400+)
- [ ] Tạo đủ roles (8 roles)
- [ ] Tạo realistic data (names, emails, dates)
- [ ] No duplicate emails

### B. Mock Data
- [ ] NLP feedback data realistic
- [ ] Dashboard stats reasonable
- [ ] Audit logs varied
- [ ] Charts có đủ data points

---

## 🧪 IX. AUTOMATED TESTING

### A. API Testing (Postman/Newman)
- [ ] Collection `/postman/HVHC_BigData.postman_collection.json` updated
- [ ] All endpoints tested
- [ ] Environment variables set
- [ ] Newman CI/CD integration

### B. E2E Testing (Optional)
- [ ] Playwright/Cypress setup
- [ ] Critical user flows automated
- [ ] Screenshots on failure

---

## ✅ X. FINAL CHECKLIST

### Pre-Launch
- [ ] All above tests passed ✅
- [ ] Demo accounts created
- [ ] Demo guide reviewed
- [ ] Backup created
- [ ] Rollback plan ready

### Launch Day
- [ ] Monitor logs realtime
- [ ] Track performance metrics
- [ ] Support team standby
- [ ] Feedback collection ready

### Post-Launch
- [ ] Collect user feedback
- [ ] Fix critical bugs within 24h
- [ ] Document lessons learned
- [ ] Plan next iteration

---

## 📝 XI. TESTING LOG TEMPLATE

```
Date: ______________
Tester: ______________
Version: 6.0

✅ Passed Tests: _____ / _____
❌ Failed Tests: _____ / _____
⚠️ Warnings: _____ / _____

Critical Issues:
1. _______________________________
2. _______________________________

Minor Issues:
1. _______________________________
2. _______________________________

Notes:
_______________________________
_______________________________

Next Actions:
_______________________________
_______________________________

Sign-off: ______________
```

---

**Test thoroughly = Launch confidently! 🚀**

*Last updated: October 15, 2025*
*Version: 6.0 Final*
