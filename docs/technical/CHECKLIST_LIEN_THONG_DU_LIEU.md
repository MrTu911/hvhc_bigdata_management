# CHECKLIST LIÊN THÔNG DỮ LIỆU - HỆ THỐNG BIGDATA HVHC

## Tổng quan

Tài liệu này mô tả các bước cần thực hiện để chuyển đổi từ nhập tay sang liên thông FK (Foreign Key) cho toàn bộ hệ thống.

---

## 1. ĐÃ HOÀN THÀNH ✅

### 1.1 Master Data Tables (Bảng danh mục)
- [x] `Ethnicity` - 54 dân tộc Việt Nam
- [x] `Religion` - 10 tôn giáo
- [x] `SpecializationCatalog` - Chuyên ngành (hierarchical)
- [x] `AdministrativeUnit` - Đơn vị hành chính (Tỉnh/Huyện/Xã)
- [x] `Cohort` - Khóa học (K55-K65)
- [x] `StudentClass` - Lớp học
- [x] `Position` - Chức vụ (46 positions)

### 1.2 API Endpoints
- [x] `/api/master-data/ethnicities`
- [x] `/api/master-data/religions`
- [x] `/api/master-data/specializations`
- [x] `/api/master-data/administrative-units`
- [x] `/api/master-data/cohorts`
- [x] `/api/master-data/student-classes`

### 1.3 RBAC Fixes (Đã sửa ngày 27/02/2026)
- [x] Gán UserPosition cho 7 users thiếu
- [x] Bổ sung VIEW_INSURANCE, VIEW_POLICY cho GIANG_VIEN
- [x] Bổ sung VIEW_TRAINING, VIEW_STUDENT, VIEW_INSURANCE cho HOC_VIEN_QUAN_SU

---

## 2. ĐANG TRIỂN KHAI 🔄

### 2.1 Personnel Module
| Field | Status | API | UI Component |
|-------|--------|-----|-------------|
| positionId | ✅ Done | `/api/positions` | Select |
| ethnicityId | 🔄 Pending | `/api/master-data/ethnicities` | Select |
| religionId | 🔄 Pending | `/api/master-data/religions` | Select |
| specializationId | 🔄 Pending | `/api/master-data/specializations` | Cascading Select |
| birthPlaceAdminUnitId | 🔄 Pending | `/api/master-data/administrative-units` | Cascading (Province→District→Ward) |
| placeOfOriginAdminUnitId | 🔄 Pending | `/api/master-data/administrative-units` | Cascading |
| permanentAdminUnitId | 🔄 Pending | `/api/master-data/administrative-units` | Cascading |
| temporaryAdminUnitId | 🔄 Pending | `/api/master-data/administrative-units` | Cascading |

### 2.2 Student Module
| Field | Status | API | UI Component |
|-------|--------|-----|-------------|
| cohortId | ✅ Done | `/api/master-data/cohorts` | Select |
| classId | ✅ Done | `/api/master-data/student-classes` | Cascading (filter by cohortId) |
| majorId | ✅ Done | `/api/master-data/specializations` | Hierarchical Select |

---

## 3. CẦN TRIỂN KHAI 📋

### 3.1 Party Member Module
| Field | Cần FK | Master Data | Priority |
|-------|--------|-------------|----------|
| partyCell | partyCellId | PartyCell | HIGH |
| partyCommittee | partyCommitteeId | PartyCommittee | HIGH |
| recommender1 | recommender1UserId | User (PersonnelPicker) | HIGH |
| recommender2 | recommender2UserId | User (PersonnelPicker) | HIGH |

**Action Required:**
1. Tạo model `PartyCommittee`, `PartyCell` (gắn với unitId)
2. Tạo API `/api/party/committees`, `/api/party/cells`
3. Tạo component `PersonnelPicker` (dùng chung)

### 3.2 Insurance Module
| Field | Cần FK | Master Data | Priority |
|-------|--------|-------------|----------|
| facilityId (KCB) | facilityId | MedicalFacility | HIGH |
| province | provinceId | AdministrativeUnit | MEDIUM |
| district | districtId | AdministrativeUnit | MEDIUM |
| type | facilityTypeId/enum | FacilityType | MEDIUM |
| level | facilityLevelId/enum | FacilityLevel | MEDIUM |

**Action Required:**
1. Tạo model `MedicalFacility` (cơ sở KCB)
2. Tạo API `/api/insurance/facilities`
3. Cập nhật UI Insurance Dependents dùng MedicalFacility

### 3.3 Policy Module
| Field | Cần FK | Master Data | Priority |
|-------|--------|-------------|----------|
| attachments | documentIds[] | Document | MEDIUM |
| targetUser | targetUserId | User (PersonnelPicker) | MEDIUM |

### 3.4 Faculty Module
| Field | Cần FK | Master Data | Priority |
|-------|--------|-------------|----------|
| subjectName | subjectId | SubjectCatalog | MEDIUM |
| department | departmentId | Department | LOW |
| semester | semesterId | Semester | LOW |
| academicYear | academicYearId | AcademicYear | LOW |

### 3.5 Research Module
| Field | Cần FK | Master Data | Priority |
|-------|--------|-------------|----------|
| field | fieldId | ResearchField | MEDIUM |
| level | levelId | ResearchLevel | MEDIUM |
| status | statusId | ResearchStatus | MEDIUM |
| piUser | piUserId | User (PersonnelPicker) | MEDIUM |
| unit | unitId | Unit | LOW |

---

## 4. COMPONENTS CẦN TẠO (Dùng chung)

### 4.1 PersonnelPicker
**Mô tả:** Component chọn cán bộ/quân nhân từ danh sách
**API:** `/api/personnel/search?q=&unitId=&rankId=`
**Dùng cho:** Party Member, Policy, Research, Faculty...

### 4.2 MasterDataCombobox
**Mô tả:** Combobox tìm kiếm với master data
**Dùng cho:** Ethnicity, Religion, Specialization, Field, Level, Status...

### 4.3 CascadingAdminUnit
**Mô tả:** Cascading select cho địa giới hành chính
**Flow:** Province → District → Ward
**Dùng cho:** Personnel, Insurance Facilities, toàn hệ thống

---

## 5. THỐNG KÊ RBAC HIỆN TẠI

| Metric | Count |
|--------|-------|
| Functions | 181 |
| Positions | 46 |
| PositionFunction | 749 |
| UserPosition | 301 |
| Users không có Position | 0 |

---

## 6. NGUYÊN NHÂN LỖI 403

### Đã xác định:
1. **7 users thiếu UserPosition** → Đã sửa
2. **GIANG_VIEN thiếu VIEW_INSURANCE, VIEW_POLICY** → Đã bổ sung
3. **HOC_VIEN thiếu VIEW_TRAINING, VIEW_STUDENT, VIEW_INSURANCE** → Đã bổ sung

### Cách phòng tránh:
- Luôn kiểm tra UserPosition khi tạo user mới
- Đảm bảo Position có đủ function codes cần thiết
- Chạy script `scripts/check_rbac_issues.ts` định kỳ

---

## 7. HƯỚNG DẪN TRIỂN KHAI

### Bước 1: Tạo Master Data
```bash
npx tsx --require dotenv/config prisma/seed/seed_master_data.ts
npx tsx --require dotenv/config prisma/seed/seed_administrative_units.ts
```

### Bước 2: Backfill FK References
```bash
npx tsx --require dotenv/config prisma/seed/backfill_fk_references.ts
```

### Bước 3: Kiểm tra RBAC
```bash
npx tsx --require dotenv/config scripts/check_rbac_issues.ts
npx tsx --require dotenv/config scripts/fix_rbac_comprehensive.ts
```

### Bước 4: Test và Deploy
```bash
yarn build
yarn test
```

---

## 8. LIÊN HỆ

- **Team Lead:** [Tên]
- **Dev:** [Tên]
- **Last Updated:** 27/02/2026
