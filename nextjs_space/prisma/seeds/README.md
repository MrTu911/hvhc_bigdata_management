# Hệ thống Seed Data Quản lý — HVHC BigData

Folder này chứa toàn bộ seed data được **đánh số theo đúng thứ tự dependency** và **phân nhóm theo module**.

> File gốc trong `prisma/seed/` **giữ nguyên** — folder này là lớp quản lý mới không thay thế file cũ.

---

## Cách chạy

```bash
# Chạy toàn bộ (required + demo)
npx tsx --require dotenv/config prisma/seeds/index.ts all

# Chỉ chạy dữ liệu bắt buộc (01-06)
npx tsx --require dotenv/config prisma/seeds/index.ts required

# Chạy từ một step cụ thể (ví dụ: chỉ chạy step 10)
npx tsx --require dotenv/config prisma/seeds/index.ts 10

# Chạy một nhóm module (ví dụ: M03)
npx tsx --require dotenv/config prisma/seeds/index.ts M03

# Qua npm script
npm run seed:managed          # Toàn bộ
npm run seed:required         # Chỉ required
npm run seed:step -- 51       # Một step
```

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

### 🟡 NHÓM B — M02 Nhân sự (10–12)
> Phục vụ: **M02 Personnel**

| File | Nội dung | File nguồn |
|------|----------|-----------|
| `10_personnel.ts` | Hồ sơ cán bộ + gia đình + y tế | `seed_personnel_demo_full.ts` |
| `11_faculty_profiles.ts` | Hồ sơ giảng viên (bằng cấp, kinh nghiệm) | `seed_faculty_profiles.ts` |
| `12_officer_soldiers.ts` | Sự nghiệp sĩ quan + hồ sơ quân nhân | `seed_officer_careers.ts` |

### 🟡 NHÓM C — M03 Đảng (20–22)
> Phục vụ: **M03 Party Management**

| File | Nội dung | File nguồn |
|------|----------|-----------|
| `20_party_organizations.ts` | Tổ chức Đảng (Đảng ủy, Chi bộ) | `seed_party_organizations.ts` |
| `21_party_members.ts` | Đảng viên + lịch sử đảng | `seed_party_members.ts` |
| `22_party_activities.ts` | Hoạt động đảng + đánh giá chính trị | `seed_party_activities.ts` |

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

### 🟡 NHÓM G — M13 Workflow (60–61)
> Phục vụ: **M13 Workflow Platform**

| File | Nội dung | File nguồn |
|------|----------|-----------|
| `60_workflow_templates.ts` | Template quy trình M13 + M20 | `seed_m13_workflow_templates.ts` |
| `61_workflow_instances.ts` | Instance + task demo | `seed_wf_instances_demo.ts` |

### 🔵 NHÓM H — Backfill (90)
> Chạy sau cùng để vá dữ liệu

| File | Nội dung | File nguồn |
|------|----------|-----------|
| `90_backfill.ts` | FK references + missing data + personnel cleanup | `backfill_fk_references.ts` |

---

## Dependency Graph (thứ tự bắt buộc)

```
01 Units
  └─► 04 Users (cần Unit)
        └─► 02 Positions+Functions (cần trước RBAC)
              └─► 05 RBAC Grants (cần User+Position+Function)
                    └─► 06 Commanders (cần User+Unit+Position)
                          └─► 03 Master Data (cần trước Personnel)
                                ├─► 10 Personnel (cần Unit+MasterData)
                                │     └─► 11 FacultyProfiles (cần User+Unit)
                                ├─► 20 PartyOrg (cần Unit)
                                │     └─► 21 PartyMembers (cần User+PartyOrg)
                                │           └─► 22 PartyActivities
                                ├─► 30 Insurance (cần User)
                                ├─► 40 ResearchScientists (cần User)
                                │     └─► 41 ResearchProjects (cần User+Unit)
                                │           └─► 42 Publications
                                ├─► 50 EducationStructure (cần Unit+AcademicYear)
                                │     └─► 51 Students (cần User+Program)
                                │           ├─► 52 Teaching (cần FacultyProfile+Students)
                                │           └─► 53 ExamsGrades (cần Students)
                                └─► 60 WorkflowTemplates (độc lập)
                                      └─► 61 WorkflowInstances
                                            └─► 90 Backfill (luôn cuối)
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

- Tất cả seed files sử dụng **upsert** — chạy nhiều lần không bị lỗi trùng
- Mỗi file có thể chạy **standalone**: `npx tsx --require dotenv/config prisma/seeds/01_units.ts`
- `index.ts` dừng toàn bộ nếu một step lỗi (fail-fast)
- Backfill (step 90) chạy sau cùng để vá FK bị thiếu
