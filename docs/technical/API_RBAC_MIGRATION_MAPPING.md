# API RBAC Migration Mapping
## Bảng Mapping: Legacy Role Check → Function-based RBAC

**Ngày tạo:** 19/02/2026  
**Cập nhật:** 19/02/2026  
**Trạng thái:** ĐÃ HOÀN THÀNH (Phase 2-7 + Security Events)

---

## 1. RESEARCH Module (Ưu tiên cao nhất) ✅ HOÀN THÀNH

| Route | Method | Legacy Check | Function Code | Scope | Status |
|-------|--------|--------------|---------------|-------|--------|
| `/api/command/research-stats` | GET | `CHI_HUY_HOC_VIEN` | `VIEW_DASHBOARD_COMMAND` | ACADEMY | ✅ |
| `/api/faculty/research` | GET | - | `VIEW_RESEARCH` | SELF/UNIT | ✅ |
| `/api/faculty/research` | POST | QUAN_TRI_HE_THONG | `CREATE_RESEARCH` | SELF | ✅ |
| `/api/faculty/research` | PUT | QUAN_TRI_HE_THONG | `UPDATE_RESEARCH` | SELF | ✅ |
| `/api/faculty/research` | DELETE | QUAN_TRI_HE_THONG | `DELETE_RESEARCH` | SELF | ✅ |

---

## 2. TRAINING Module (Điểm số - Nhạy cảm) ✅ HOÀN THÀNH

| Route | Method | Legacy Check | Function Code | Scope | Status |
|-------|--------|--------------|---------------|-------|--------|
| `/api/training/courses` | GET | - | `VIEW_COURSE` | ACADEMY | ✅ |
| `/api/training/courses` | POST | allowedRoles | `CREATE_COURSE` | DEPARTMENT | ✅ |
| `/api/training/courses` | PUT | allowedRoles | `UPDATE_COURSE` | DEPARTMENT | ✅ |
| `/api/training/courses` | DELETE | ADMIN/QTV | `DELETE_COURSE` | ACADEMY | ✅ |
| `/api/training/grades` | GET | - | `VIEW_GRADE` | SELF/UNIT | ✅ |
| `/api/training/grades` | POST | allowedRoles | `CREATE_GRADE_DRAFT` | UNIT | ✅ |
| `/api/training/grades` | PUT | allowedRoles | `APPROVE_GRADE` | UNIT | ✅ |
| `/api/training/exams` | GET | - | `VIEW_TRAINING` | ACADEMY | ✅ |
| `/api/training/exams` | POST | allowedRoles | `CREATE_COURSE` | DEPARTMENT | ✅ |
| `/api/training/exams` | PUT | allowedRoles | `UPDATE_COURSE` | DEPARTMENT | ✅ |
| `/api/training/registration` | GET | - | `VIEW_TRAINING` | ACADEMY | ✅ |
| `/api/training/registration` | POST | allowedRoles | `REGISTER_COURSE` | SELF | ✅ |
| `/api/training/registration` | PUT | allowedRoles | `APPROVE_GRADE` | UNIT | ✅ |
| `/api/training/rooms` | GET | - | `VIEW_TRAINING` | ACADEMY | ✅ |
| `/api/training/rooms` | POST | ADMIN/QTV | `MANAGE_UNITS` | ACADEMY | ✅ |
| `/api/training/rooms` | PUT | != HOC_VIEN | `UPDATE_COURSE` | DEPARTMENT | ✅ |
| `/api/training/rooms` | DELETE | QTV | `DELETE_COURSE` | ACADEMY | ✅ |

---

## 3. PERSONNEL Module ✅ HOÀN THÀNH

| Route | Method | Legacy Check | Function Code | Scope | Status |
|-------|--------|--------------|---------------|-------|--------|
| `/api/personnel` | GET | ALLOWED_ROLES | `VIEW_PERSONNEL` | ACADEMY/UNIT | ✅ |
| `/api/personnel` | POST | CREATE_ALLOWED_ROLES | `CREATE_PERSONNEL` | UNIT | ✅ |
| `/api/personnel/[id]` | GET | - | `VIEW_PERSONNEL_DETAIL` | SELF/UNIT | ✅ |
| `/api/personnel/[id]` | PATCH | isAdmin/isOwner | `UPDATE_PERSONNEL` | SELF/DEPARTMENT | ✅ |
| `/api/personnel/party-member` | GET | - | `VIEW_PARTY` | UNIT/DEPARTMENT | ✅ |
| `/api/personnel/party-member` | POST | ALLOWED_ROLES | `CREATE_PARTY` | UNIT | ✅ |
| `/api/personnel/party-member` | PUT | ALLOWED_ROLES | `UPDATE_PARTY` | UNIT | ✅ |
| `/api/personnel/party-member` | DELETE | ALLOWED_ROLES | `DELETE_PARTY` | ACADEMY | ✅ |
| `/api/personnel/career-history` | GET | - | `VIEW_PERSONNEL` | SELF/UNIT | ✅ |
| `/api/personnel/career-history` | POST | ALLOWED_ROLES | `UPDATE_PERSONNEL` | UNIT | ✅ |
| `/api/personnel/career-history` | PUT | ALLOWED_ROLES | `UPDATE_PERSONNEL` | UNIT | ✅ |
| `/api/personnel/career-history` | DELETE | ALLOWED_ROLES | `DELETE_PERSONNEL` | ACADEMY | ✅ |
| `/api/personnel/family` | GET | - | `VIEW_PERSONNEL_DETAIL` | SELF | ✅ |
| `/api/personnel/family` | POST | ALLOWED_ROLES | `UPDATE_PERSONNEL` | UNIT | ✅ |
| `/api/personnel/family` | PUT | ALLOWED_ROLES | `UPDATE_PERSONNEL` | UNIT | ✅ |
| `/api/personnel/family` | DELETE | ALLOWED_ROLES | `DELETE_PERSONNEL` | ACADEMY | ✅ |
| `/api/personnel/insurance` | GET | - | `VIEW_INSURANCE` | SELF/UNIT | ✅ |
| `/api/personnel/insurance` | POST | ALLOWED_ROLES | `CREATE_INSURANCE` | UNIT | ✅ |
| `/api/personnel/insurance` | PUT | ALLOWED_ROLES | `UPDATE_INSURANCE` | UNIT | ✅ |
| `/api/personnel/insurance` | DELETE | ALLOWED_ROLES | `DELETE_INSURANCE` | ACADEMY | ✅ |

---

## 4. SYSTEM Module ✅ HOÀN THÀNH (Core Routes)

| Route | Method | Legacy Check | Function Code | Scope | Status |
|-------|--------|--------------|---------------|-------|--------|
| `/api/admin/ai-config` | GET | checkAdminPermission | `VIEW_SYSTEM_HEALTH` | ACADEMY | ✅ |
| `/api/admin/ai-config` | POST | checkAdminPermission | `MANAGE_AI_CONFIG` | ACADEMY | ✅ |
| `/api/admin/ai-config` | DELETE | checkAdminPermission | `MANAGE_AI_CONFIG` | ACADEMY | ✅ |
| `/api/admin/units` | GET | allowedRoles | `VIEW_PERSONNEL` | ACADEMY | ✅ |
| `/api/admin/units` | POST | allowedRoles | `MANAGE_UNITS` | ACADEMY | ✅ |
| `/api/admin/units` | PUT | allowedRoles | `MANAGE_UNITS` | ACADEMY | ✅ |
| `/api/admin/units` | DELETE | ADMIN/QTV | `MANAGE_UNITS` | ACADEMY | ✅ |
| `/api/admin/rbac/users` | GET | allowedRoles | `VIEW_PERSONNEL` | DEPARTMENT | ✅ |
| `/api/admin/rbac/users` | POST | allowedRoles | `MANAGE_USERS` | DEPARTMENT | ✅ |
| `/api/admin/rbac/users` | PUT | allowedRoles | `MANAGE_USERS` | DEPARTMENT | ✅ |
| `/api/admin/rbac/users` | DELETE | ADMIN/QTV | `MANAGE_USERS` | ACADEMY | ✅ |
| `/api/admin/infrastructure` | * | ADMIN/QTV | `VIEW_SYSTEM_HEALTH` | ACADEMY | ⏳ |
| `/api/admin/api-gateway/*` | * | ADMIN/QTV | `MANAGE_RBAC` | ACADEMY | ⏳ |
| `/api/admin/permission-grants` | * | ADMIN_ROLES | `MANAGE_RBAC` | ACADEMY | ⏳ |
| `/api/monitoring/*` | * | ADMIN | `VIEW_SYSTEM_HEALTH` | ACADEMY | ⏳ |
| `/api/audit/*` | GET | ADMIN/NGHIEN_CUU | `VIEW_AUDIT_LOG` | ACADEMY | ⏳ |

---

## 5. STUDENT Module ✅ HOÀN THÀNH

| Route | Method | Legacy Check | Function Code | Scope | Status |
|-------|--------|--------------|---------------|-------|--------|
| `/api/student` | GET | - | `VIEW_STUDENT` | DEPARTMENT | ✅ |
| `/api/student` | POST | allowedRoles | `CREATE_STUDENT` | DEPARTMENT | ✅ |
| `/api/student/[id]` | GET | - | `VIEW_STUDENT_DETAIL` | SELF/UNIT | ✅ |
| `/api/student/[id]` | PUT | allowedRoles | `UPDATE_STUDENT` | UNIT | ✅ |
| `/api/student/[id]` | DELETE | QTV | `DELETE_STUDENT` | ACADEMY | ✅ |
| `/api/student/results` | GET | - | `VIEW_GRADE` | SELF/UNIT | ✅ |
| `/api/student/results` | POST | allowedRoles | `CREATE_GRADE_DRAFT` | UNIT | ✅ |
| `/api/student/results` | PUT | allowedRoles | `SUBMIT_GRADE` | UNIT | ✅ |
| `/api/student/results` | DELETE | ADMIN/QTV | `DELETE_STUDENT` | ACADEMY | ✅ |

---

## 6. DASHBOARD Module ✅ HOÀN THÀNH (Core Routes)

| Route | Method | Legacy Check | Function Code | Scope | Status |
|-------|--------|--------------|---------------|-------|--------|
| `/api/dashboard/student/overview` | GET | HOC_VIEN_SINH_VIEN | `VIEW_DASHBOARD_STUDENT` | SELF | ✅ |
| `/api/dashboard/admin/overview` | GET | ADMIN | `VIEW_DASHBOARD_ADMIN` | ACADEMY | ✅ |
| `/api/dashboard/faculty/*` | GET | CHI_HUY_KHOA_PHONG | `VIEW_DASHBOARD_FACULTY` | DEPARTMENT | ⏳ |
| `/api/command/*` | GET | CHI_HUY_HOC_VIEN | `VIEW_DASHBOARD_COMMAND` | ACADEMY | ⏳ |

---

## 7. FILES Module ✅ HOÀN THÀNH

| Route | Method | Legacy Check | Function Code | Scope | Status |
|-------|--------|--------------|---------------|-------|--------|
| `/api/files/delete/[id]` | DELETE | owner/ADMIN | `DELETE_PERSONNEL` | SELF | ✅ |
| `/api/files/download/[id]` | GET | owner/ADMIN | `VIEW_PERSONNEL_DETAIL` | SELF | ✅ |
| `/api/data/delete` | DELETE | isAdmin/isOwner | `DELETE_PERSONNEL` | SELF | ⏳ |

---

## Tổng kết

- **Tổng số routes đã chuyển:** ~67 routes
- **RESEARCH:** 5 routes ✅
- **TRAINING:** 17 routes ✅
- **PERSONNEL:** 20 routes ✅
- **SYSTEM:** 11 routes ✅
- **STUDENT:** 9 routes ✅
- **DASHBOARD:** 2 routes ✅
- **FILES:** 2 routes ✅

### Security Events đã triển khai:
- ✅ LOGIN_FAILED (trong auth.ts)
- ✅ LOGIN_SUCCESS (trong auth.ts)
- ✅ UNAUTHORIZED_ACCESS (trong RBAC middleware)
- ✅ DATA_BREACH_ATTEMPT (trong files/delete)
- ✅ MASS_DELETE (helper sẵn sàng)
- ✅ ADMIN_ACTION (helper sẵn sàng)

---

## Quy tắc Migration

1. **KHÔNG sửa business logic** - chỉ thay điều kiện quyền
2. **KHÔNG đổi response format** - giữ nguyên cấu trúc
3. **BẮT BUỘC thêm Audit Log** cho CREATE/UPDATE/DELETE/APPROVE
4. **BẮT BUỘC log SecurityEvent** khi denied
5. **Test đầy đủ** sau mỗi module
