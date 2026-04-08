# KẾ HOẠCH TRIỂN KHAI DASHBOARD THEO VAI TRÒ
## Hệ thống Big Data HVHC 2025

**Ngày:** 14 tháng 10 năm 2025  
**Mục tiêu:** Xây dựng 5 Dashboard theo vai trò cho Demo tháng 12/2025

---

## 📊 ĐÁNH GIÁ HIỆN TRẠNG

### Dashboard hiện có:
- ✅ **Main Dashboard** (`/dashboard`): Tổng quan hệ thống - 90% hoàn thiện
- ✅ **Analytics Dashboard**: Phân tích & báo cáo - 70% hoàn thiện
- ✅ **Training Dashboard**: Module huấn luyện - 75% hoàn thiện  
- ✅ **Users Dashboard**: Quản lý người dùng - 80% hoàn thiện

### Dashboard cần xây dựng mới:
1. 🎯 **Command Dashboard** (Chỉ huy Học viện) - Ưu tiên 1
2. 🎯 **Department Dashboard** (Chỉ huy Khoa/Phòng) - Ưu tiên 2
3. 📚 **Subject Dashboard** (Chủ nhiệm Bộ môn) - Ưu tiên 3
4. 👨‍🏫 **Instructor Dashboard** (Giảng viên) - Ưu tiên 1
5. 👨‍🎓 **Student Dashboard** (Học viên) - Ưu tiên 4

---

## 🎯 LỘ TRÌNH TRIỂN KHAI

### TUẦN 1 (14-20/10/2025)
**Mục tiêu:** Command Dashboard + API Integration

#### Công việc:
- [ ] Tạo `/dashboard/command` với layout Executive
- [ ] Kết nối API Demo: `/api/demo/predict-training`, `/api/demo/predict-logistics`
- [ ] Implement KPI Cards với real-time data
- [ ] Tích hợp biểu đồ Plotly/Recharts
- [ ] Tạo AI Insights Section

#### Deliverables:
- Command Dashboard hoàn chỉnh (95%)
- API integration hoạt động
- 5+ charts tương tác

---

### TUẦN 2 (21-27/10/2025)
**Mục tiêu:** Instructor Dashboard + NLP Integration

#### Công việc:
- [ ] Tạo `/dashboard/instructor` 
- [ ] Student Alert System với AI
- [ ] NLP Feedback Analysis
- [ ] Class Performance Charts
- [ ] Email notification integration

#### Deliverables:
- Instructor Dashboard hoàn chỉnh (90%)
- Student alert AI hoạt động
- NLP feedback analysis

---

### TUẦN 3 (28/10-3/11/2025)
**Mục tiêu:** Department + Subject Dashboards

#### Công việc:
- [ ] Tạo `/dashboard/department`
- [ ] Tạo `/dashboard/subject`
- [ ] Unit comparison charts
- [ ] Course analytics
- [ ] Tái sử dụng components từ Command Dashboard

#### Deliverables:
- 2 Dashboard hoàn chỉnh (80%)
- Shared components library

---

### TUẦN 4 (4-10/11/2025)
**Mục tiêu:** Student Dashboard + Testing

#### Công việc:
- [ ] Tạo `/dashboard/student`
- [ ] Personal progress tracking
- [ ] AI Study recommendations
- [ ] Calendar & deadlines
- [ ] Integration testing tất cả dashboards

#### Deliverables:
- Student Dashboard hoàn chỉnh (85%)
- All dashboards tested

---

## 🧩 KIẾN TRÚC KỸ THUẬT

### A. RBAC Middleware
```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const role = token?.role;
  
  // Route protection by role
  if (path.startsWith('/dashboard/command') && role !== 'ADMIN') {
    return NextResponse.redirect('/unauthorized');
  }
  // ... other role checks
}
```

### B. Shared Components
```
/components/dashboard/
├── kpi-card.tsx          # Reusable KPI card
├── ai-insight.tsx        # AI insight widget
├── alert-widget.tsx      # Alert/notification
├── chart-wrapper.tsx     # Chart container
└── role-based-layout.tsx # Dynamic layout
```

### C. API Integration
```typescript
// /lib/api/ml-engine.ts
export const MLEngineAPI = {
  predictTraining: () => fetch('/api/demo/predict-training'),
  predictLogistics: () => fetch('/api/demo/predict-logistics'),
  getInsights: (role) => fetch(`/api/ai/insights?role=${role}`)
};
```

---

## 📋 CHECKLIST KỸ THUẬT

### Command Dashboard
- [ ] KPI Cards (Services, Users, Alerts, System Health)
- [ ] Global Forecast Chart (Training + Logistics)
- [ ] AI Insights Section
- [ ] Critical Alerts Widget
- [ ] Export Report Function
- [ ] Real-time updates (WebSocket)

### Instructor Dashboard
- [ ] Class List & Filter
- [ ] Student Performance Table
- [ ] Student Alert System (AI)
- [ ] Feedback Sentiment Analysis (NLP)
- [ ] Email Notification
- [ ] Quick Actions (Grade entry, Message)

### Department Dashboard
- [ ] Unit KPIs
- [ ] Department Comparison
- [ ] Staff Performance
- [ ] Resource Usage
- [ ] Budget Tracking

### Subject Dashboard
- [ ] Course Progress
- [ ] Grade Distribution
- [ ] Feedback Analysis
- [ ] Curriculum Recommendations

### Student Dashboard
- [ ] Personal Progress
- [ ] Grade Timeline
- [ ] AI Study Recommendations
- [ ] Calendar & Deadlines
- [ ] Study Buddy Matching

---

## 🔧 TECH STACK

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | Next.js | 14.2.28 |
| Charts | Recharts/Plotly | Latest |
| UI Components | shadcn/ui | Latest |
| State Management | React Hooks + SWR | Latest |
| API Client | Fetch + SWR | - |
| Authentication | NextAuth.js | 4.24.11 |
| Real-time | WebSocket (optional) | - |

---

## 📊 SUCCESS METRICS

### Demo Tháng 12/2025
- ✅ 5 Dashboard hoạt động đầy đủ
- ✅ AI Predictions real-time
- ✅ RBAC hoạt động chính xác
- ✅ < 2s page load time
- ✅ Mobile responsive
- ✅ 5+ AI insights per dashboard

### Performance Goals
- Page load: < 2s
- API response: < 500ms
- Chart rendering: < 1s
- Real-time update: < 3s latency

---

## 🚨 RISKS & MITIGATION

| Risk | Impact | Mitigation |
|------|--------|------------|
| API Integration delays | HIGH | Use mock data first, swap later |
| Chart performance issues | MEDIUM | Lazy loading, pagination |
| RBAC complexity | HIGH | Test with multiple users early |
| ML Model latency | MEDIUM | Cache predictions, show loading states |

---

## 👥 TEAM ASSIGNMENT

| Role | Responsibility | Dashboards |
|------|---------------|------------|
| Frontend Lead | Command + Instructor | 1, 4 |
| Frontend Dev 1 | Department + Subject | 2, 3 |
| Frontend Dev 2 | Student + Testing | 5 |
| Backend Dev | API endpoints + ML | All |
| QA Engineer | Testing + RBAC | All |

---

## 📅 MILESTONES

| Date | Milestone | Status |
|------|-----------|--------|
| 20/10/2025 | Command Dashboard Complete | 🔄 In Progress |
| 27/10/2025 | Instructor Dashboard Complete | 🔜 Upcoming |
| 03/11/2025 | Department + Subject Complete | 🔜 Upcoming |
| 10/11/2025 | Student Dashboard + Testing | 🔜 Upcoming |
| 20/12/2025 | **DEMO** | 🎯 **Target** |

---

**Next Action:** Bắt đầu triển khai Command Dashboard ngay hôm nay!
