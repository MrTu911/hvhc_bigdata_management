# Hệ thống Seed Data Quản lý — HVHC BigData

Folder này chứa toàn bộ seed data được **đánh số theo đúng thứ tự dependency** và **phân nhóm theo module**.

> File gốc trong `prisma/seed/` **giữ nguyên** — folder này là lớp quản lý mới không thay thế file cũ.

---

## Cách chạy

```bash
# Chạy toàn bộ (required + demo + bigdata + realdata + backfill)
npx tsx --require dotenv/config prisma/seeds/index.ts all

# Chỉ chạy dữ liệu bắt buộc (01-08)
npx tsx --require dotenv/config prisma/seeds/index.ts required

# Chạy từ một step cụ thể (ví dụ: chỉ chạy step 10)
npx tsx --require dotenv/config prisma/seeds/index.ts 10

# Chạy một nhóm module (ví dụ: M03 hoặc M12)
npx tsx --require dotenv/config prisma/seeds/index.ts M12

# Qua npm script
npm run seed:managed          # Toàn bộ (all)
npm run seed:required         # Chỉ required (01-08)
npm run seed:demo             # Chỉ demo (10-71)
npm run seed:bigdata          # Big Data & Hạ tầng (80-86)
npm run seed:realdata         # Dữ liệu thật Viện B212 (87-89)
npm run seed:backfill         # Backfill (90)
npm run seed:step -- 51       # Một step
npm run seed:module -- M12    # Một nhóm module
```

### Mode hợp lệ
`all` · `required` · `demo` · `bigdata` · `realdata` · `backfill` ·
`M02` `M03` `M09` `M10` `M11` `M12` `M13` `M18` `M20` · `<số step>`

---

## Phân nhóm và thứ tự

### 🔴 NHÓM A — BẮT BUỘC (01–06)
> Phục vụ: **M01 Auth + M19 Master Data + toàn bộ hệ thống**
> Không seed nhóm này → App không khởi động được

| File | Nội dung | File nguồn |
|------|----------|-----------|
| `01_units.ts` | Cơ cấu tổ chức đơn vị HVHC | `seed_units.ts` |
| `02_positions_functions.ts` | Chức vụ + Function codes RBAC (65+ codes) | `seed_positions_rbac.ts` |
| `03_master_data.ts` | 68 danh mục lookup (M19) | `seed_master_data.ts` |
| `04_users.ts` | Tài khoản người dùng demo | `seed_users.ts` |
| `05_rbac_grants.ts` | Phân quyền RBAC cho tất cả module | 6 file rbac |
| `06_commanders.ts` | Gán chỉ huy cho từng đơn vị | `assign_commanders.ts` |
| `07_admin_units.ts` | Đơn vị hành chính (Tỉnh/Huyện/Xã) — FK nơi sinh/quê quán | `seed_administrative_units.ts` |
| `08_salary_grades.ts` | Bảng lương quân nhân (NĐ 204/2004) | `seed_military_salary_grades.ts` |

> **07 PHẢI chạy trước 10** (Personnel có FK `birthPlace`/`placeOfOrigin` → `AdministrativeUnit`). File `seed_administrative_units.ts` đã được bổ sung `seedProvinces()` tạo 5 tỉnh gốc trước khi tạo quận/huyện.

### 🟡 NHÓM B — M02 Nhân sự (10–12)
> Phục vụ: **M02 Personnel**

| File | Nội dung | File nguồn |
|------|----------|-----------|
| `10_personnel.ts` | Hồ sơ cán bộ + gia đình + y tế | `seed_personnel_demo_full.ts` |
| `11_faculty_profiles.ts` | Hồ sơ giảng viên (bằng cấp, kinh nghiệm) | `seed_faculty_profiles.ts` |
| `12_officer_soldiers.ts` | Sự nghiệp sĩ quan + hồ sơ quân nhân | `seed_officer_careers.ts` |
| `13_officer_health.ts` *(optional)* | Phân loại sức khỏe sĩ quan | `seed_officer_health.ts` |
| `14_promotion_rank.ts` *(optional)* | Function codes + template thăng quân hàm | `seed_promotion_function_codes.ts`, `seed_rank_declaration_wf_templates.ts` |

### 🟡 NHÓM C — M03 Đảng (20–22)
> Phục vụ: **M03 Party Management**

| File | Nội dung | File nguồn |
|------|----------|-----------|
| `20_party_organizations.ts` | Tổ chức Đảng (Đảng ủy, Chi bộ) | `seed_party_organizations.ts` |
| `21_party_members.ts` | Đảng viên + lịch sử đảng | `seed_party_members.ts` |
| `22_party_activities.ts` | Hoạt động đảng + đánh giá chính trị | `seed_party_activities.ts` |
| `23_party_recruitment.ts` *(optional)* | Quy trình phát triển Đảng (6 bước) | `seed_recruitment_pipeline.ts` |

### 🟡 NHÓM D — M05-M08 Chính sách & Bảo hiểm (30–32)
> Phục vụ: **M05 Insurance, M06 Policy, M08 Discipline**

| File | Nội dung | File nguồn |
|------|----------|-----------|
| `30_insurance.ts` | BHXH, BHYT, người phụ thuộc | `seed_insurance.ts` |
| `31_policy_welfare.ts` | Chính sách phúc lợi | `seed_policy_full.ts` |
| `32_awards_discipline.ts` | Khen thưởng + kỷ luật | `seed_thi_dua_khen_thuong.ts` |

### 🟡 NHÓM E — M09 Nghiên cứu Khoa học (40–42)
> Phục vụ: **M09 NCKH / Science Research**

| File | Nội dung | File nguồn |
|------|----------|-----------|
| `40_research_scientists.ts` | Hồ sơ nhà khoa học | `seed_m09_research_demo.ts` |
| `41_research_projects.ts` | Đề tài NCKH + thành viên + milestone | `seed_m09_research_demo.ts` |
| `42_publications.ts` | Ấn phẩm + hội đồng khoa học | `seed_scientific_publications.ts` |

### 🟡 NHÓM F — M10 Đào tạo (50–53)
> Phục vụ: **M10 Education & Training**

| File | Nội dung | File nguồn |
|------|----------|-----------|
| `50_education_structure.ts` | Năm học, Học kỳ, Chương trình, Môn học, Phòng | `seed_education.ts` |
| `51_students.ts` | Học viên + đăng ký nhập học | `seed_hocvien_v2.ts` |
| `52_teaching.ts` | Lịch giảng dạy + thống kê | `seed_teaching_data.ts` |
| `53_exams_grades.ts` | Kỳ thi + đăng ký + điểm số | `seed_m10_exam_data.ts` |
| `54_mon_hoc.ts` | Danh mục môn học thật HVHC | `seed_mon_hoc_hvhc.ts` |
| `55_civil_students.ts` *(optional)* | Học viên dân sự + tuyển sinh + điểm thiếu | `seed_civil_students.ts`, `seed_admissions_extra.ts`, `seed_missing_grades.ts` |
| `56_thesis.ts` *(optional)* | Khóa luận / luận văn | `seed_thesis_demo.ts` |

### 🟡 NHÓM G — M13 Workflow (60–62)
> Phục vụ: **M13 Workflow Platform**

| File | Nội dung | File nguồn |
|------|----------|-----------|
| `60_workflow_templates.ts` | Template quy trình M13 + M20 | `seed_m13_workflow_templates.ts` |
| `61_workflow_instances.ts` | Instance + task demo | `seed_wf_instances_demo.ts` |
| `62_promotion_instances.ts` *(optional)* | Instance cảnh báo thăng quân hàm | `seed_promotion_alert_wf_instance.ts` |

### 🟡 NHÓM G2 — M18 / M20 (70–71)
> Phục vụ: **M18 Export**, **M20–M26 Science RBAC**

| File | Nội dung | File nguồn |
|------|----------|-----------|
| `70_admin_doc_templates.ts` | Mẫu văn bản hành chính (NĐ30) | `seed_admin_doc_templates.ts` |
| `71_science_rbac.ts` *(optional)* | Function codes + grant miền khoa học M20–M26 | `seed_science_rbac.ts` |

### 🟢 NHÓM I — M11/M12 Big Data & Hạ tầng (80–86)
> Phục vụ: **CSDL lõi của dự án** — Data Hub, hạ tầng, pipeline, dashboard
> Phụ thuộc: 01 units, 04 users (admin `QUAN_TRI_HE_THONG`)

| File | Nội dung | File nguồn |
|------|----------|-----------|
| `79_ml_models.ts` *(optional)* | MLModel + TrainingJob + ModelPrediction (lớp AI/ML) | `seed_ml_models.ts` |
| `80_bigdata_sources.ts` | DataSource + M19 category (DATA_SOURCE_KIND/DOMAIN) | `seed_bigdata_sources.ts` |
| `81_infra_rbac.ts` *(optional)* | Function codes INFRA | `seed_infra_rbac.ts` |
| `82_infra_full.ts` | Service, pipeline, data-quality, backup, DR | `seed_m12_infra_full.ts` |
| `83_etl_pipelines.ts` | PipelineDefinition (personnel/education ETL) | `seed_m12_etl_pipelines.ts` |
| `84_infrastructure_demo.ts` *(optional)* | NAS/GPU/backup + SyncLog (secret qua env) | `seed_infrastructure_demo.ts` |
| `85_dashboard_templates.ts` | DashboardRoleTemplate (6 role) | `seed_m11_dashboard_templates.ts` |
| `86_command_dashboard.ts` *(optional)* | Dashboard chỉ huy | `seed_command_dashboard.ts` |

### 🟣 NHÓM J — Dữ liệu THẬT Viện B212 (87–89)
> Non-destructive (upsert), chạy SAU step 01 (đã tạo Viện B12) và TRƯỚC backfill.
> Có trong `all`; cũng chạy riêng bằng `seed:realdata`. **KHÔNG chạy lại step 01 sau khi đã có B212.**

| File | Nội dung | File nguồn |
|------|----------|-----------|
| `87_realdata_b212_units.ts` | 4 Ban con của Viện B12 | `seed_vien_b212_units.ts` |
| `88_realdata_b212_personnel.ts` | 31 cán bộ thật (từ JSON) | `seed_vien_b212_personnel.ts` |
| `89_realdata_b212_rbac.ts` *(optional)* | Phân quyền cán bộ B212 | `seed_vien_b212_rbac.ts` |

### 🔵 NHÓM H — Backfill (90)
> Chạy sau cùng để vá dữ liệu

| File | Nội dung | File nguồn |
|------|----------|-----------|
| `90_backfill.ts` | FK references + missing data + personnel cleanup | `backfill_fk_references.ts` |

---

## Dependency Graph (thứ tự bắt buộc)

```
01 Units → 04 Users → 02 Positions+Functions → 05 RBAC → 06 Commanders
03 Master Data → 07 AdminUnits (Tỉnh/Huyện/Xã) → 08 SalaryGrades   [BẮT BUỘC, trước Personnel]
   ├─► 10 Personnel (cần Unit + MasterData + 07 AdminUnits cho nơi sinh/quê quán)
   │     ├─► 11 FacultyProfiles → 12 Officer/Soldier → 13 OfficerHealth, 14 Promotion/Rank
   ├─► 20 PartyOrg → 21 PartyMembers → 22 PartyActivities
   ├─► 30 Insurance · 31 Policy · 32 Awards/Discipline
   ├─► 40 ResearchScientists → 41 ResearchProjects → 42 Publications
   ├─► 50 EducationStructure → 51 Students → 52 Teaching → 53 Exams → 54 MonHoc
   │     └─► 55 CivilStudents, 56 Thesis (optional)
   ├─► 60 WorkflowTemplates → 61 WorkflowInstances → 62 PromotionInstances (optional)
   ├─► 70 AdminDocTemplates · 71 ScienceRBAC (optional)
   └─► NHÓM I Big Data (cần 01 Units + 04 admin):
         80 BigdataSources → 82 InfraFull → 83 EtlPipelines
         81 InfraRBAC, 84 InfrastructureDemo, 85 Dashboard, 86 CommandDashboard
   └─► NHÓM J Realdata B212 (cần 01 Units / B12): 87 Units → 88 Personnel → 89 RBAC
         └─► 90 Backfill (LUÔN chạy cuối cùng)
```

---

## Mật khẩu demo mặc định

| Loại | Email | Password |
|------|-------|----------|
| Admin | `admin@hvhc.edu.vn` | `Hv@2025` |
| Giảng viên | `{ten}.{ho}@hvhc.edu.vn` | `Hv@2025` |
| Học viên | `{mssv}@hvhc.edu.vn` | `Hv@2025` |

---

## Ghi chú kỹ thuật

- Tất cả seed files dùng **upsert/guarded create** — chạy nhiều lần không lỗi trùng (idempotent)
- Mỗi wrapper chạy **standalone**: `npx tsx --require dotenv/config prisma/seeds/01_units.ts`
- **Chính sách lỗi:** step không `optional` → fail-fast (dừng); step `optional: true` → cảnh báo + tiếp tục
- `seed_infrastructure_demo.ts`: credential demo lấy từ `DEMO_NAS_PASSWORD` / `DEMO_SERVER_PASSWORD` (env), không hard-code
- Backfill (step 90) chạy sau cùng để vá FK bị thiếu

---

## File legacy đã deprecate (đánh dấu `@deprecated` tại chỗ)

> Mỗi file có header `@deprecated`; **giữ NGUYÊN vị trí**, không hard-delete (migration rule).
> **Chưa di chuyển vào `archive/`** vì còn consumer thật: các script reset cũ
> (`scripts/reset_and_seed_*.sh`, `scripts/seed_all.ts`) vẫn gọi một số file này theo path.
> Việc archive vật lý hoãn lại tới khi các runner cũ đó được gỡ (Phase 2). **Không dùng cho seed mới.**

- **RBAC trùng:** `seed_rbac.ts`, `seed_rbac_full.ts`, `seed_all_rbac.ts`, `seed_functions_complete.ts`, `seed_personal_rbac.ts`, `seed_demo_rbac_accounts.ts`, `seed_m01_session_functions.ts`
- **Party trùng:** `seed_party_full.ts`, `seed_party_org_full.ts`, `seed_party_sample_data.ts`, `seed_party_business_flow.ts`, `seed_m03_complete.ts`
- **Khác (bản cũ / bundle demo / patch):** `seed_master_data_v1.ts`, `seed_policy_insurance.ts`, `seed_insurance_full.ts`, `seed_demo_data_v8.ts`, `seed_director_demo_data.ts`, `seed_sync_data.ts`, `seed_m10_demo.ts`, `seed_m18_demo.ts`, `seed_my_students_demo.ts`, `seed_missing_data.ts`, `seed_missing_items.ts`, `fix_missing_user_positions.ts`, `seed_m09_full_reset.ts` *(destructive)*

## Utilities (giữ nguyên trong `prisma/seed/`, chạy thủ công khi cần — KHÔNG seed)

`check_db.ts` · `check_party_access.ts` · `check_perm.ts` · `etl_lan_import.ts` · `backfill_embeddings.ts`

## Backlog còn lại

- ✅ `seed_recruitment_pipeline.ts` đã rewrite (resolve User theo `militaryId`, bỏ hard-code cuid) → đã wire **step 23**.
- ✅ **ML** (`MLModel`/`TrainingJob`/`ModelPrediction`) → đã thêm `seed_ml_models.ts` + **step 79**.
- ✅ **M24** (NckhPurchaseOrder/Invoice/Expense/Grant) & **M25** (chat/collaboration) **đã được seed sẵn** bởi `seed_science_phase1_6.ts` (chạy trong **step 41**) — không tạo seed mới để tránh trùng nguồn.
- ⏳ Còn lại: **M26** (AI insights/reports nâng cao) nếu sau này cần dữ liệu mẫu riêng.
