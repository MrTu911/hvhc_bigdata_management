# TƯ VẤN PHÁT TRIỂN HỆ THỐNG QUẢN LÝ CÁN BỘ - QUÂN NHÂN
## Theo Quyết định 144/QĐ-BQP ngày 12/01/2026 về Danh mục CSDL Bộ Quốc phòng

---

## I. SUMMARY (Tóm tắt)

### Mục tiêu
Mở rộng hệ thống HVHC BigData để quản lý cán bộ - quân nhân toàn diện, tuân thủ chuẩn CSDL Bộ Quốc phòng theo QĐ 144/QĐ-BQP.

### Phạm vi
- **Làm:** 7 module lõi (Cán bộ, Lý lịch, Đảng viên, Chính sách, BHXH, Lý lịch KH, AI Analytics)
- **Không làm:** Kết nối trực tiếp API BQP (chờ chuẩn hóa cấp Bộ), Module vũ khí/trang bị

### 4 Trụ dữ liệu lõi theo QĐ BQP
1. **CSDL Quân nhân** (Cục Quân lực) - Mã định danh, thông tin cơ bản
2. **CSDL Quản lý Cán bộ** (Cục Cán bộ) - Số hiệu sĩ quan, quá trình công tác
3. **CSDL Đảng viên** (Cục Tổ chức) - Hồ sơ đảng, sinh hoạt, khen thưởng
4. **CSDL BHXH/BHYT Quân đội** - Bảo hiểm, khám chữa bệnh

---

## II. ASSUMPTIONS (Giả định)

### Môi trường
- **Stack hiện tại:** Next.js 14 + Prisma + PostgreSQL + Redis + AWS S3
- **Auth:** NextAuth với RBAC 9 cấp đã có
- **Multi-tenant:** Không (single organization - HVHC)
- **Compliance:** Theo Thông tư 11/2022/TT-BQP về CSDL quân sự

### Bảo mật
- Dữ liệu nhạy cảm (CCCD, số hiệu SQ) cần mã hóa AES-256
- IP Whitelist cho API Gateway
- Audit log bắt buộc mọi thao tác

### Dữ liệu hiện có
- 286 cán bộ đã import (User + FacultyProfile)
- 50+ đơn vị (Unit tree)
- Schema User có sẵn: employeeId, militaryId, rank, position

---

## III. DESIGN (Thiết kế)

### 3.1. Kiến trúc Module

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HVHC PERSONNEL MANAGEMENT SYSTEM                 │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 5: VISUALIZATION & REPORTING                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ Personnel    │ │ Party Member │ │ AI Analytics │                │
│  │ Dashboard    │ │ Dashboard    │ │ Dashboard    │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 4: AI/ML ENGINE                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ Stability    │ │ Promotion    │ │ Health       │                │
│  │ Index AI     │ │ Forecast AI  │ │ Monitor AI   │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 3: BUSINESS SERVICES                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │Personnel│ │ Career  │ │ Party   │ │ Policy  │ │Insurance│      │
│  │ Service │ │ Service │ │ Service │ │ Service │ │ Service │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 2: DATA ACCESS (Prisma Repositories)                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ PersonnelRepo │ CareerRepo │ PartyRepo │ PolicyRepo │ ...   │   │
│  └─────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 1: DATA STORAGE                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ PostgreSQL   │ │ Redis Cache  │ │ AWS S3       │                │
│  │ (40+ models) │ │ (Session/    │ │ (Documents)  │                │
│  │              │ │  Rate limit) │ │              │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2. Schema Prisma mới (Chuẩn BQP)

```prisma
// ============================================
// MODULE 1: CSDL QUÂN NHÂN (Theo Cục Quân lực)
// ============================================

// Mở rộng User hiện có
model User {
  // ... existing fields ...
  
  // Thêm theo chuẩn BQP
  militaryIdNumber    String?   @unique  // Mã định danh quân nhân (12 ký tự)
  officerIdCard       String?   @unique  // Số chứng minh thư sĩ quan
  bloodType           BloodType?
  ethnicity           String?             // Dân tộc
  religion            String?             // Tôn giáo
  birthPlace          String?             // Nơi đăng ký khai sinh
  permanentAddress    String?             // Nơi thường trú
  temporaryAddress    String?             // Nơi tạm trú
  enlistmentDate      DateTime?           // Ngày nhập ngũ
  dischargeDate       DateTime?           // Ngày xuất ngũ
  managementLevel     ManagementLevel?    // Diện quản lý
  
  // Relations
  careerHistory       CareerHistory[]
  partyMember         PartyMember?
  policyRecords       PolicyRecord[]
  insuranceInfo       InsuranceInfo?
  familyRelations     FamilyRelation[]
}

enum BloodType {
  A_POSITIVE
  A_NEGATIVE
  B_POSITIVE
  B_NEGATIVE
  AB_POSITIVE
  AB_NEGATIVE
  O_POSITIVE
  O_NEGATIVE
}

enum ManagementLevel {
  TRUNG_UONG      // Diện Trung ương quản lý
  TONG_CUC        // Diện Tổng cục quản lý
  QUAN_KHU        // Diện Quân khu quản lý
  DON_VI          // Diện đơn vị quản lý
}

// ============================================
// MODULE 2: QUÁ TRÌNH CÔNG TÁC
// ============================================

model CareerHistory {
  id              String      @id @default(uuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Loại sự kiện
  eventType       CareerEventType
  
  // Thông tin chung
  startDate       DateTime
  endDate         DateTime?
  position        String?             // Chức vụ
  unit            String?             // Đơn vị
  unitId          String?             // Mã đơn vị (theo CSDL tổ chức biên chế)
  
  // Thông tin quyết định
  decisionNumber  String?             // Số quyết định
  decisionDate    DateTime?           // Ngày quyết định
  issuingAgency   String?             // Cơ quan ra quyết định
  
  // Phong/thăng quân hàm
  newRank         String?             // Quân hàm mới
  previousRank    String?             // Quân hàm cũ
  
  // Đào tạo
  trainingType    String?             // Loại đào tạo
  institution     String?             // Cơ sở đào tạo
  major           String?             // Chuyên ngành
  degree          String?             // Văn bằng
  
  note            String?   @db.Text
  attachmentUrl   String?             // File đính kèm (S3)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdById     String?
  
  @@index([userId])
  @@index([eventType])
  @@index([startDate])
}

enum CareerEventType {
  ENLISTMENT          // Nhập ngũ
  DISCHARGE           // Xuất ngũ
  PROMOTION           // Phong/thăng quân hàm
  APPOINTMENT         // Bổ nhiệm
  TRANSFER            // Điều động
  TRAINING            // Đào tạo
  SECONDMENT          // Biệt phái
  RETIREMENT          // Nghỉ hưu
  OTHER               // Khác
}

// ============================================
// MODULE 3: ĐẢNG VIÊN (Theo Cục Tổ chức)
// ============================================

model PartyMember {
  id                  String      @id @default(uuid())
  userId              String      @unique
  user                User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Thông tin đảng viên theo chuẩn BQP
  partyIdNumber       String?     @unique  // Mã định danh đảng viên
  partyBioNumber      String?     @unique  // Số lý lịch đảng viên
  partyCardNumber     String?     @unique  // Số thẻ đảng viên
  
  // Thời gian
  joinDate            DateTime?            // Ngày vào Đảng (dự bị)
  officialDate        DateTime?            // Ngày chính thức
  
  // Tổ chức đảng
  partyBranch         String?              // Chi bộ
  partyCommittee      String?              // Đảng ủy
  partyPosition       String?              // Chức vụ Đảng
  
  // Trạng thái
  status              PartyMemberStatus @default(ACTIVE)
  classification      PartyClassification?
  
  // Huy hiệu
  badgeYears          Int?                 // Số năm tuổi Đảng (huy hiệu)
  badgeAwardDate      DateTime?            // Ngày trao huy hiệu
  
  // Thống kê
  rewardCount         Int       @default(0)
  disciplineCount     Int       @default(0)
  lastMeetingDate     DateTime?
  
  // Relations
  partyActivities     PartyActivity[]
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@index([partyBranch])
  @@index([status])
}

enum PartyMemberStatus {
  PROBATIONARY    // Dự bị
  ACTIVE          // Chính thức
  TRANSFERRED     // Đã chuyển sinh hoạt
  EXPELLED        // Bị khai trừ
  DECEASED        // Đã mất
}

enum PartyClassification {
  EXCELLENT           // Hoàn thành xuất sắc nhiệm vụ
  GOOD                // Hoàn thành tốt nhiệm vụ
  COMPLETED           // Hoàn thành nhiệm vụ
  NOT_COMPLETED       // Không hoàn thành nhiệm vụ
}

model PartyActivity {
  id              String      @id @default(uuid())
  partyMemberId   String
  partyMember     PartyMember @relation(fields: [partyMemberId], references: [id], onDelete: Cascade)
  
  activityType    PartyActivityType
  activityDate    DateTime
  description     String?     @db.Text
  
  // Khen thưởng/Kỷ luật
  decisionNumber  String?
  decisionDate    DateTime?
  issuingAgency   String?
  
  createdAt       DateTime    @default(now())
  
  @@index([partyMemberId])
  @@index([activityType])
}

enum PartyActivityType {
  MEETING             // Sinh hoạt Đảng
  REWARD              // Khen thưởng
  DISCIPLINE          // Kỷ luật
  BADGE_AWARD         // Trao huy hiệu
  TRANSFER            // Chuyển sinh hoạt
  EVALUATION          // Đánh giá phân loại
}

// ============================================
// MODULE 4: CHÍNH SÁCH - KHEN THƯỞNG - KỶ LUẬT
// ============================================

model PolicyRecord {
  id              String      @id @default(uuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Phân loại
  policyType      PolicyType
  
  // Thông tin quyết định
  decisionNumber  String?             // Số quyết định
  decisionDate    DateTime?           // Ngày quyết định
  issuingAgency   String?             // Cơ quan ban hành
  
  // Nội dung
  title           String              // Tiêu đề/Hình thức
  description     String?   @db.Text  // Mô tả chi tiết
  
  // Khen thưởng
  rewardLevel     RewardLevel?        // Cấp khen thưởng
  rewardForm      String?             // Hình thức khen thưởng
  
  // Kỷ luật
  disciplineForm  String?             // Hình thức kỷ luật
  
  // File đính kèm
  attachmentUrl   String?             // Quyết định scan (S3)
  
  // KPI tích hợp
  kpiPoints       Int?      @default(0)  // Điểm thi đua
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdById     String?
  
  @@index([userId])
  @@index([policyType])
  @@index([decisionDate])
}

enum PolicyType {
  REWARD              // Khen thưởng
  DISCIPLINE          // Kỷ luật
  WELFARE             // Chế độ chính sách
  WOUNDED_SOLDIER     // Thương binh
  MERIT_PERSON        // Người có công
  RETIREMENT          // Chế độ hưu
  OTHER               // Khác
}

enum RewardLevel {
  STATE               // Nhà nước
  MINISTRY            // Cấp Bộ
  ARMY                // Cấp Quân đội
  UNIT                // Cấp đơn vị
}

// ============================================
// MODULE 5: BẢO HIỂM XÃ HỘI / Y TẾ QUÂN ĐỘI
// ============================================

model InsuranceInfo {
  id              String      @id @default(uuid())
  userId          String      @unique
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // BHXH
  socialInsuranceNo   String?   @unique  // Số BHXH
  siStartDate         DateTime?          // Ngày bắt đầu đóng
  siTotalMonths       Int?      @default(0)  // Tổng số tháng đóng
  siTotalContribution Decimal?  @db.Decimal(15,2)  // Tổng số tiền đóng
  
  // BHYT
  healthInsuranceNo   String?   @unique  // Số thẻ BHYT
  hiStartDate         DateTime?          // Ngày có hiệu lực
  hiEndDate           DateTime?          // Ngày hết hiệu lực
  hospitalCode        String?            // Mã cơ sở KCB ban đầu
  hospitalName        String?            // Tên cơ sở KCB
  
  // Relations
  medicalRecords      MedicalRecord[]
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@index([socialInsuranceNo])
  @@index([healthInsuranceNo])
}

model MedicalRecord {
  id              String        @id @default(uuid())
  insuranceId     String
  insurance       InsuranceInfo @relation(fields: [insuranceId], references: [id], onDelete: Cascade)
  
  // Thông tin khám
  visitDate       DateTime
  hospitalCode    String?
  hospitalName    String?
  diagnosis       String?       @db.Text
  treatment       String?       @db.Text
  
  // Chi phí
  totalCost       Decimal?      @db.Decimal(15,2)
  insuranceCover  Decimal?      @db.Decimal(15,2)
  selfPay         Decimal?      @db.Decimal(15,2)
  
  // Loại khám
  visitType       MedicalVisitType @default(OUTPATIENT)
  
  createdAt       DateTime      @default(now())
  
  @@index([insuranceId])
  @@index([visitDate])
}

enum MedicalVisitType {
  PERIODIC_CHECKUP    // Khám định kỳ
  OUTPATIENT          // Khám ngoại trú
  INPATIENT           // Nội trú
  EMERGENCY           // Cấp cứu
}

// ============================================
// MODULE 6: QUAN HỆ GIA ĐÌNH
// ============================================

model FamilyRelation {
  id              String      @id @default(uuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Thông tin người thân
  fullName        String
  relationship    FamilyRelationship
  dateOfBirth     DateTime?
  occupation      String?             // Nghề nghiệp
  workplace       String?             // Nơi làm việc
  address         String?             // Địa chỉ
  phone           String?
  
  // Chính trị
  politicalStatus String?             // Thành phần chính trị
  isDeceased      Boolean   @default(false)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([userId])
}

enum FamilyRelationship {
  FATHER              // Bố
  MOTHER              // Mẹ
  SPOUSE              // Vợ/Chồng
  CHILD               // Con
  SIBLING             // Anh/Chị/Em
  FATHER_IN_LAW       // Bố vợ/chồng
  MOTHER_IN_LAW       // Mẹ vợ/chồng
  OTHER               // Khác
}

// ============================================
// MODULE 7: AI ANALYTICS
// ============================================

model PersonnelAIAnalysis {
  id              String      @id @default(uuid())
  userId          String
  
  // Chỉ số AI
  analysisType    PersonnelAnalysisType
  analysisDate    DateTime    @default(now())
  
  // Kết quả
  score           Float?                // Điểm (0-100)
  riskLevel       RiskLevel?            // Mức độ rủi ro
  confidence      Float?                // Độ tin cậy
  
  // Chi tiết
  factors         Json?                 // Các yếu tố ảnh hưởng
  recommendations Json?                 // Khuyến nghị
  
  // Model info
  modelVersion    String?
  
  createdAt       DateTime  @default(now())
  
  @@index([userId])
  @@index([analysisType])
}

enum PersonnelAnalysisType {
  STABILITY_INDEX     // Chỉ số ổn định
  ATTRITION_RISK      // Rủi ro nghỉ việc
  PROMOTION_POTENTIAL // Tiềm năng thăng tiến
  HEALTH_INDEX        // Chỉ số sức khỏe
  POLITICAL_QUALITY   // Đánh giá chính trị
  COMPREHENSIVE       // Tổng hợp
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

### 3.3. API Design

#### Route Handlers (Public/External API)
```
POST   /api/external/v1/personnel       # External API (có API Key)
GET    /api/external/v1/personnel/:id
GET    /api/external/v1/statistics
```

#### Server Actions (Internal)
```
app/(dashboard)/dashboard/personnel/actions.ts
  - createPersonnel()
  - updatePersonnel()
  - getPersonnelDetail()
  - searchPersonnel()
  
app/(dashboard)/dashboard/party/actions.ts
  - createPartyMember()
  - updatePartyStatus()
  - recordPartyActivity()
  
app/(dashboard)/dashboard/policy/actions.ts  
  - createPolicyRecord()
  - calculateKPIPoints()
```

### 3.4. Cache Strategy (Redis)

```typescript
// Key naming convention
const CACHE_KEYS = {
  personnelDetail: (id: string) => `hvhc:prod:personnel:${id}`,
  personnelList: (unitId: string, page: number) => `hvhc:prod:personnel:list:${unitId}:${page}`,
  partyStats: (year: number) => `hvhc:prod:party:stats:${year}`,
  policyKPI: (userId: string) => `hvhc:prod:policy:kpi:${userId}`,
};

// TTL config
const CACHE_TTL = {
  personnelDetail: 300,    // 5 minutes
  personnelList: 60,       // 1 minute
  partyStats: 3600,        // 1 hour
  policyKPI: 1800,         // 30 minutes
};

// Invalidation strategy: delete-on-write
```

### 3.5. Security Design

```typescript
// Authorization rules
const PERSONNEL_PERMISSIONS = {
  'QUAN_TRI_HE_THONG': ['*'],  // Full access
  'CHI_HUY_HOC_VIEN': ['read:all', 'export:all'],
  'CHI_HUY_KHOA': ['read:unit', 'write:unit'],
  'GIANG_VIEN': ['read:self', 'read:students'],
  'HOCVIEN': ['read:self'],
};

// Sensitive fields encryption (AES-256)
const ENCRYPTED_FIELDS = [
  'socialInsuranceNo',
  'healthInsuranceNo', 
  'officerIdCard',
  'partyCardNumber',
];
```

---

## IV. IMPLEMENTATION CHECKLIST

### Phase 1: Database Schema & Core Models (Week 1-2)

```
[ ] 1.1 Schema Migration
    [ ] Backup database hiện tại
    [ ] Thêm fields mới vào User model (bloodType, ethnicity, etc.)
    [ ] Tạo CareerHistory model
    [ ] Tạo PartyMember + PartyActivity models
    [ ] Tạo PolicyRecord model
    [ ] Tạo InsuranceInfo + MedicalRecord models
    [ ] Tạo FamilyRelation model
    [ ] Tạo PersonnelAIAnalysis model
    [ ] Chạy prisma migrate với strategy safe
    [ ] Verify indexes đã tạo

[ ] 1.2 Seed Data
    [ ] Script import dữ liệu cán bộ từ 286 records hiện có
    [ ] Map existing User fields sang fields mới
    [ ] Tạo sample data cho testing
```

### Phase 2: Server Layer - Services & Repositories (Week 2-3)

```
[ ] 2.1 Repository Layer (server/repositories/)
    [ ] PersonnelRepository.ts
        [ ] findById()
        [ ] findByUnitId()
        [ ] search()
        [ ] create()
        [ ] update()
    [ ] CareerHistoryRepository.ts
    [ ] PartyMemberRepository.ts
    [ ] PolicyRecordRepository.ts
    [ ] InsuranceRepository.ts

[ ] 2.2 Service Layer (server/services/)
    [ ] PersonnelService.ts
        [ ] getPersonnelWithRelations()
        [ ] calculateServiceYears()
        [ ] validateMilitaryId()
    [ ] PartyService.ts
        [ ] evaluatePartyMember()
        [ ] generatePartyReport()
    [ ] PolicyService.ts
        [ ] calculateKPIPoints()
        [ ] getRewardHistory()
    [ ] InsuranceService.ts
        [ ] calculateContribution()
        [ ] getMedicalHistory()

[ ] 2.3 Validation (lib/validations/)
    [ ] personnel.schema.ts (Zod)
    [ ] party.schema.ts (Zod)
    [ ] policy.schema.ts (Zod)
    [ ] insurance.schema.ts (Zod)
```

### Phase 3: API Routes & Server Actions (Week 3-4)

```
[ ] 3.1 Server Actions
    [ ] app/(dashboard)/dashboard/personnel/actions.ts
    [ ] app/(dashboard)/dashboard/career/actions.ts
    [ ] app/(dashboard)/dashboard/party/actions.ts
    [ ] app/(dashboard)/dashboard/policy/actions.ts
    [ ] app/(dashboard)/dashboard/insurance/actions.ts

[ ] 3.2 Route Handlers (for external/reporting)
    [ ] app/api/personnel/route.ts (GET list)
    [ ] app/api/personnel/[id]/route.ts (GET detail)
    [ ] app/api/personnel/export/route.ts (GET export Excel/PDF)
    [ ] app/api/party/stats/route.ts
    [ ] app/api/policy/report/route.ts

[ ] 3.3 Auth Guards
    [ ] lib/auth/requireAuth.ts
    [ ] lib/auth/requireRole.ts
    [ ] lib/auth/requirePermission.ts
```

### Phase 4: UI Pages (Week 4-6)

```
[ ] 4.1 Personnel Management
    [ ] app/(dashboard)/dashboard/personnel/page.tsx (Dashboard)
    [ ] app/(dashboard)/dashboard/personnel/list/page.tsx (Danh sách)
    [ ] app/(dashboard)/dashboard/personnel/[id]/page.tsx (Chi tiết)
    [ ] app/(dashboard)/dashboard/personnel/create/page.tsx (Thêm mới)
    [ ] components/personnel/PersonnelForm.tsx
    [ ] components/personnel/PersonnelCard.tsx
    [ ] components/personnel/PersonnelTimeline.tsx

[ ] 4.2 Career History
    [ ] components/career/CareerTimeline.tsx
    [ ] components/career/CareerEventForm.tsx
    [ ] components/career/PromotionHistory.tsx

[ ] 4.3 Party Member Management
    [ ] app/(dashboard)/dashboard/party/page.tsx (Dashboard)
    [ ] app/(dashboard)/dashboard/party/list/page.tsx
    [ ] app/(dashboard)/dashboard/party/[id]/page.tsx
    [ ] components/party/PartyMemberForm.tsx
    [ ] components/party/PartyActivityLog.tsx
    [ ] components/party/PartyStatistics.tsx

[ ] 4.4 Policy & Rewards
    [ ] app/(dashboard)/dashboard/policy/page.tsx
    [ ] app/(dashboard)/dashboard/policy/rewards/page.tsx
    [ ] app/(dashboard)/dashboard/policy/discipline/page.tsx
    [ ] components/policy/PolicyRecordForm.tsx
    [ ] components/policy/KPIScoreCard.tsx

[ ] 4.5 Insurance & Health
    [ ] app/(dashboard)/dashboard/insurance/page.tsx
    [ ] components/insurance/InsuranceCard.tsx
    [ ] components/insurance/MedicalHistory.tsx
```

### Phase 5: AI Analytics Module (Week 6-7)

```
[ ] 5.1 AI Services
    [ ] server/services/ai/StabilityAnalyzer.ts
        [ ] calculateStabilityIndex()
        [ ] identifyRiskFactors()
    [ ] server/services/ai/PromotionPredictor.ts
        [ ] predictPromotionPotential()
        [ ] generateCareerPath()
    [ ] server/services/ai/HealthMonitor.ts
        [ ] analyzeHealthTrend()
        [ ] detectAnomalies()

[ ] 5.2 AI API Routes
    [ ] app/api/ai/personnel-insight/route.ts
    [ ] app/api/ai/stability-index/route.ts
    [ ] app/api/ai/promotion-forecast/route.ts

[ ] 5.3 AI Dashboard
    [ ] app/(dashboard)/dashboard/ai-personnel/page.tsx
    [ ] components/ai/StabilityHeatmap.tsx
    [ ] components/ai/PromotionForecastChart.tsx
    [ ] components/ai/WorkforceInsights.tsx
```

### Phase 6: Reports & Export (Week 7-8)

```
[ ] 6.1 Report Templates
    [ ] lib/reports/PersonnelReport.ts (PDF chuẩn BQP)
    [ ] lib/reports/PartyReport.ts
    [ ] lib/reports/QuarterlyReport.ts
    [ ] lib/reports/AnnualReport.ts

[ ] 6.2 Export Functions
    [ ] Excel export với định dạng chuẩn
    [ ] PDF "Phiếu Lý lịch Quân nhân" theo mẫu Cục Cán bộ
    [ ] CSV export cho tích hợp

[ ] 6.3 Report UI
    [ ] app/(dashboard)/dashboard/reports/personnel/page.tsx
    [ ] components/reports/ReportGenerator.tsx
    [ ] components/reports/ReportPreview.tsx
```

### Phase 7: Security & Observability (Week 8)

```
[ ] 7.1 Security Hardening
    [ ] Implement field-level encryption for sensitive data
    [ ] Add rate limiting (Redis)
    [ ] Implement IP whitelist for API
    [ ] Add CSRF protection for server actions
    [ ] Audit log cho mọi thao tác nhạy cảm

[ ] 7.2 Observability
    [ ] Add request-id middleware
    [ ] Configure structured logging (pino)
    [ ] Add metrics endpoints
    [ ] Error boundary với proper logging

[ ] 7.3 Data Validation
    [ ] Validate all inputs với Zod
    [ ] Sanitize output (no PII leak)
    [ ] DTO patterns cho API responses
```

### Phase 8: Testing & Documentation (Week 8-9)

```
[ ] 8.1 Testing
    [ ] Unit tests cho services (mock Prisma)
    [ ] Integration tests cho API routes
    [ ] E2E tests cho critical flows (Playwright)
        [ ] Tạo cán bộ mới
        [ ] Cập nhật quá trình công tác
        [ ] Quản lý đảng viên
        [ ] Xuất báo cáo

[ ] 8.2 Documentation
    [ ] API documentation (OpenAPI/Swagger)
    [ ] User guide cho từng role
    [ ] Admin guide
    [ ] Technical documentation
```

### Phase 9: Sidebar & Navigation Update

```
[ ] 9.1 Update Sidebar
    [ ] Thêm menu "Quản lý Cán bộ"
        [ ] Danh sách cán bộ
        [ ] Quá trình công tác
        [ ] Quan hệ gia đình
    [ ] Thêm menu "Công tác Đảng"
        [ ] Quản lý Đảng viên
        [ ] Hoạt động Đảng
        [ ] Báo cáo Đảng vụ
    [ ] Thêm menu "Chính sách - Thi đua"
        [ ] Khen thưởng
        [ ] Kỷ luật
        [ ] Chế độ chính sách
    [ ] Thêm menu "Bảo hiểm"
        [ ] BHXH/BHYT
        [ ] Lịch sử khám chữa bệnh
    [ ] Thêm menu "AI Nhân sự"
        [ ] Phân tích ổn định
        [ ] Dự báo thăng tiến
        [ ] Báo cáo tổng hợp

[ ] 9.2 Update Language Provider
    [ ] Thêm translations cho menu mới
    [ ] Thêm translations cho forms
```

---

## V. TRADE-OFFS & NEXT STEPS

### Trade-offs

| Quyết định | Lý do | Rủi ro |
|------------|-------|--------|
| Mở rộng User thay vì tạo Personnel riêng | Tận dụng Auth/RBAC có sẵn | Schema phức tạp hơn |
| Server Actions thay vì Route Handlers | CSRF tự nhiên, type-safe | Khó expose API ngoài |
| AES-256 cho sensitive fields | Tuân thủ chuẩn quân sự | Performance overhead |
| Redis cache với TTL ngắn | Đảm bảo data freshness | More cache misses |

### Next Steps (Sau Phase 9)

1. **Q3/2026:** Tích hợp API BQP khi có chuẩn liên thông
2. **Q4/2026:** Mở rộng AI với model training trên dữ liệu thực
3. **2027:** Mobile app cho cán bộ xem hồ sơ cá nhân
4. **2028:** Full integration với CSDL cấp Bộ

---

## VI. RUN & ENV

### .env.example additions

```env
# Encryption
ENCRYPTION_KEY=your-32-character-key-here
ENCRYPTION_IV=your-16-character-iv

# AI Config
AI_PERSONNEL_MODEL_VERSION=1.0.0
AI_CONFIDENCE_THRESHOLD=0.75

# BQP Integration (future)
BQP_API_URL=
BQP_API_KEY=
BQP_UNIT_CODE=HVHC
```

### Scripts

```json
{
  "scripts": {
    "migrate:personnel": "prisma migrate dev --name add_personnel_models",
    "seed:personnel": "tsx prisma/seed/seed_personnel.ts",
    "test:personnel": "vitest run --filter=personnel",
    "report:generate": "tsx scripts/generate-reports.ts"
  }
}
```

---

**Tài liệu này tuân thủ:**
- Quyết định 144/QĐ-BQP ngày 12/01/2026
- Thông tư 11/2022/TT-BQP về CSDL quân sự
- Nguyên tắc AI Dev Mode đã thống nhất

**Ngày tạo:** 19/01/2026  
**Phiên bản:** 1.0
