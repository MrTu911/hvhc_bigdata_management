# MODULE M10 — PHƯƠNG ÁN NÂNG CẤP & CHUẨN HÓA CSDL GIÁO DỤC ĐÀO TẠO
# Mô hình tổ chức Phòng Đào tạo + Luồng nghiệp vụ end-to-end

> Phiên bản: v1.0 / 2026-06. Bổ sung cho [module-m10-overview.md](module-m10-overview.md) và
> [module-m10-program-curriculum-planning.md](module-m10-program-curriculum-planning.md).
> Tài liệu này KHÔNG thay thế thiết kế M10 gốc — nó chuẩn hóa lại danh mục môn học,
> phân vai RBAC theo cơ cấu Phòng Đào tạo thật, và đặc tả luồng nghiệp vụ liền mạch.

---

## 1. Mục tiêu & phạm vi

### 1.1. Vì sao
M10 đã dựng phần lớn 12 use case (UC-51→62: hồ sơ người học, CTĐT có version, kế hoạch,
lớp học phần, điểm danh, điểm + `ScoreHistory`, cảnh báo học vụ, khóa luận, xét tốt nghiệp,
kho học vụ). Cái còn THIẾU đúng nhu cầu vận hành là:
1. **Chuẩn hóa danh mục môn học** theo dữ liệu thật (1.121 môn), gắn đúng Khoa/Bộ môn.
2. **Phân vai RBAC theo cơ cấu Phòng Đào tạo thật** (Chỉ huy phòng / Ban Kế hoạch / Ban Vật
   chất / Ban Bản đồ / các Khoa), thay vì gộp chung một hồ sơ quyền.
3. **Đặc tả luồng nghiệp vụ liền mạch**: từ Khoa xây CTĐT → xác định môn học → Ban Kế hoạch
   mở học kỳ, mở lớp học phần, xếp lịch huấn luyện toàn học viện → vận hành học vụ.

### 1.2. Phạm vi đợt này (ĐÃ THỰC THI)
- ✅ Seed lại danh mục môn học (Phần 5).
- ✅ Chuẩn hóa RBAC Ban Kế hoạch + giữ Ban Vật chất/Bản đồ ở hồ sơ phù hợp (Phần 6).
- ✅ Tài liệu phương án + luồng nghiệp vụ (tài liệu này).

### 1.3. Ngoài phạm vi (PHASE SAU — chỉ thiết kế, chưa code)
- **Generator xếp lịch BÁN TỰ ĐỘNG** (sinh `TrainingSession` hàng loạt từ mẫu lớp HP + tự
  kiểm xung đột). Quyết định kiến trúc: **bán tự động**, không phải bộ giải ràng buộc toàn tự động.
- **Phân hệ Vật chất huấn luyện** (model cấp phát/mượn-trả riêng).
- **Phân hệ Bản đồ** (kho bản đồ giấy + bản đồ số).

---

## 2. Mô hình actor Phòng Đào tạo (RBAC matrix)

Cơ cấu đã có sẵn trong DB (đơn vị canonical dưới `B1` Phòng Đào tạo; chức vụ tạo thủ công).
Đợt này chuẩn hóa **hồ sơ quyền (profile)** cho đúng trách nhiệm.

| Actor | Đơn vị (canonical) | Chức vụ | Hồ sơ quyền | Scope | Trách nhiệm CSDL |
|---|---|---|---|---|---|
| **Chỉ huy phòng** | `B1` Phòng Đào tạo | `TRUONG_PHONG_DAO_TAO`, `B1_TRUONG_PHONG`, `B1_PHO_TRUONG_PHONG` | `allowForTruongPhongDaoTao` (full EDUCATION+STUDENT+TRAINING+EXAM) | DEPARTMENT | Điều hành toàn bộ CSDL GD-ĐT; **ban hành (PUBLISHED) CTĐT**; duyệt kế hoạch năm học; **duyệt điểm/tốt nghiệp cấp phòng**; giám sát KPI |
| **Ban Kế hoạch** | `B1_SI3I` Ban Kế hoạch tổng hợp | `B1_TRUONG_BAN_KH` (trưởng), `B1_TRO_LY_KEHOACH` (trợ lý) | `TRAINING_PLANNING` / `TRAINING_PLANNING_ASSIST` | **ACADEMY** | Tổng hợp & quản chương trình môn học toàn HV; **mở năm học/học kỳ**; lập kế hoạch đào tạo; **mở lớp học phần + phân công GV/phòng**; **xếp lịch huấn luyện toàn học viện**. Chỉ XEM hồ sơ học viên/CTĐT; KHÔNG nhập/duyệt điểm, KHÔNG xét tốt nghiệp |
| **Ban Vật chất** | `B1_T59A` Ban Vật chất huấn luyện | `B1_TRUONG_BAN_VC`, `B1_TRO_LY_VCHL` | `TRAINING_SUPPORT` / `ASSISTANT` (giữ nguyên) | DEPARTMENT / UNIT | Hỗ trợ tài liệu/học liệu/lịch; quản phòng học (`Room`) + thiết bị (`LabEquipment`). **Domain vật chất huấn luyện riêng: phase sau** |
| **Ban Bản đồ** | `B1_TKIA` Ban Bản đồ | `B1_TRUONG_BAN_BĐ`, `B1_TRO_LY_BANDO` | `TRAINING_SUPPORT` / `ASSISTANT` (giữ nguyên) | DEPARTMENT / UNIT | Hỗ trợ tài liệu/học liệu/lịch. **Domain bản đồ giấy/số riêng: phase sau** |
| **Khoa** | `K1`..`K14` + Bộ môn (`BO_MON`) | `TRUONG_KHOA`, `PHO_TRUONG_KHOA`, `CHI_HUY_BO_MON`, `GIANG_VIEN` | `allowForTruongKhoa` / `allowForChiHuyBoMon` / `allowForGiangVien` | DEPARTMENT (subtree Khoa mình) | **Công cụ xây CTĐT của Khoa**: tạo `Program`/`ProgramVersion` (DRAFT), khung học phần (`CurriculumCourse`) gắn môn học của Bộ môn mình → trình Phòng duyệt |

**Nguồn quyền (single source):**
- Chức vụ chuẩn (Chỉ huy phòng, Khoa, Bộ môn, Giảng viên) → [lib/rbac/position-grants.ts](../../lib/rbac/position-grants.ts) (`grantsForPosition()`), được seed bởi `seed_positions_rbac.ts`.
- Chức vụ Ban tạo thủ công (`B1_TRUONG_BAN_*`, `B1_TRO_LY_*`) → [scripts/reconcile_position_grants.ts](../../scripts/reconcile_position_grants.ts) (`EXPLICIT_PROFILE`), KHÔNG dựng hệ phân quyền song song.

---

## 3. Luồng nghiệp vụ end-to-end (CTĐT → môn học → lịch huấn luyện)

```
[Khoa] ── xây CTĐT ───────────────► [Chỉ huy phòng] ── ban hành ──► [Ban Kế hoạch] ── triển khai ──► [Học vụ]
 Program/ProgramVersion(DRAFT)        APPROVE/PUBLISH                 Term→CurriculumPlan→ClassSection      điểm danh→điểm→cảnh báo
 + CurriculumCourse(gắn HeSoMonHoc)   ProgramVersion                  →TrainingSession(bán tự động)→lịch    →khóa luận→tốt nghiệp
```

1. **Khoa xây CTĐT** (UC-52) — `Program` → `ProgramVersion` trạng thái `DRAFT` → khung học phần
   `CurriculumCourse`, mỗi học phần gắn môn `HeSoMonHoc` thuộc Bộ môn của Khoa → trình duyệt.
   Quyền: `TRUONG_KHOA`/`CHI_HUY_BO_MON` (CREATE/UPDATE), scope DEPARTMENT Khoa mình.
2. **Chỉ huy phòng duyệt & ban hành** (UC-52) — `APPROVE_PROGRAM`, đẩy `ProgramVersion` sang
   `PUBLISHED`. **Bất biến: không sửa đè version cũ** (rủi ro #1 trong overview). Quyền: `TRUONG_PHONG_DAO_TAO`.
3. **Ban Kế hoạch mở học kỳ** (UC-53) — `AcademicYear`/`Term` (`MANAGE_TERM`) → `CurriculumPlan`
   gắn `ProgramVersion` đã PUBLISHED.
4. **Ban Kế hoạch mở lớp học phần** (UC-54) — `ClassSection` gắn `CurriculumCourse` + giảng viên
   (`FacultyProfile`) + phòng (`Room`). Quyền: `CREATE_CLASS_SECTION`, scope ACADEMY.
5. **Ban Kế hoạch xếp lịch huấn luyện — BÁN TỰ ĐỘNG** (UC-54, **PHASE SAU**) — sinh hàng loạt
   `TrainingSession` từ mẫu lớp HP theo lịch học kỳ → chạy `conflict-check` (trùng phòng/giảng
   viên/thời gian, dùng [conflict-check.service.ts](../../lib/services/education/conflict-check.service.ts)
   + composite index trên `class_sections`) → cảnh báo xung đột → người xếp duyệt. Tạm thời:
   nhập/sửa lịch thủ công + nút kiểm xung đột (đã có `POST /api/education/class-sections/conflict-check`).
6. **Vận hành học vụ** (UC-55→62, đã dựng) — điểm danh (`SessionAttendance`) → điểm
   (`ClassEnrollment` + `ScoreHistory`, **bắt buộc audit**) → cảnh báo học vụ (`AcademicWarning`) →
   khóa luận (`ThesisProject`) → xét tốt nghiệp (`GraduationAudit`→`DiplomaRecord`) → kho học vụ.
   Quyền điểm/tốt nghiệp thuộc Giảng viên (nhập) + Chỉ huy phòng (duyệt), **KHÔNG** thuộc Ban Kế hoạch.
7. **Ban Vật chất** cấp nguồn phòng học/thiết bị cho bước 4–5; **Ban Bản đồ** cấp vật chất bản đồ
   (phase sau).

---

## 4. Chuẩn hóa tài liệu — bảng ánh xạ canonical (doc cũ ↔ schema thật)

Thiết kế M10 gốc dùng tên lý tưởng; schema thật đã hiện thực bằng tên khác. **Dùng cột "Schema
thật" làm canonical** trong code/tài liệu mới; KHÔNG đổi schema.

| Tên trong design doc cũ | Schema thật (canonical) | Ghi chú |
|---|---|---|
| `Course` | `CurriculumCourse` | Học phần trong khung CTĐT |
| `SemesterPlan` | `CurriculumPlan` (+ `Term`/`AcademicYear`) | Kế hoạch đào tạo học kỳ/năm |
| `CourseSection` | `ClassSection` | Lớp học phần |
| `GradeRecord` (M10 điểm) | `ClassEnrollment` + `ScoreHistory` | **Nguồn sự thật điểm M10**. `GradeRecord` model là của luồng Registration, KHÔNG mở rộng |
| `AttendanceRecord` | `SessionAttendance` (+ `TrainingSession`) | Điểm danh theo buổi |
| `StudentProfile` | `HocVien` | Hồ sơ người học |
| Môn học (catalog) | `HeSoMonHoc` | Danh mục môn + hệ số điểm + FK Khoa/Bộ môn (`Unit`) |

---

## 5. Chuẩn hóa danh mục môn học (ĐÃ THỰC THI)

- **Nguồn:** [prisma/seed/data/mon_hoc_hvhc.json](../../prisma/seed/data/mon_hoc_hvhc.json) —
  1.121 môn, `maMon` unique (0 trùng).
- **Seed:** [prisma/seed/seed_mon_hoc_hvhc.ts](../../prisma/seed/seed_mon_hoc_hvhc.ts) (step 54):
  xóa `HeSoMonHoc` cũ → tạo lại 1.121 → gắn `khoaId`/`boMonId` (FK `Unit`). KHÔNG reset dữ liệu
  học tập (mặc định `RESET_M10_LEARNING` tắt).
- **Sửa lỗi dữ liệu (trong đợt này):** seed cũ tạo Bộ môn `type='BOMON'` còn `seed_units.ts` dùng
  `type='BO_MON'` → bộ lọc lookup không khớp → **`boMonId = 0/1121`** (mọi môn không gắn Bộ môn).
  Đã đồng bộ về `'BO_MON'`.
- **Kết quả thực tế:** 1.121 môn · **khoaId 1.098/1.121** · **boMonId 1.073/1.121** · 8 cặp Bộ môn
  còn null là đơn vị phi học thuật (Ban Khảo thí, "Ngoài trường", "Hệ/Tiểu đoàn", Viện, "Không tên") — chấp nhận.
- **An toàn dữ liệu (đã kiểm chứng):** `ket_qua_hoc_tap` liên kết môn bằng chuỗi `maMon`, không
  FK — `heSoMonHocId IS NOT NULL = 0`. Xóa/seed lại môn **không mồ côi điểm**; 1.529 điểm + 1.668
  ghi danh giữ nguyên. Backup data-only: `/tmp/he_so_mon_hoc_backup_*.sql`.

---

## 6. Chuẩn hóa RBAC (ĐÃ THỰC THI)

- **Vấn đề trước đó:** cả 3 Trưởng ban (Kế hoạch/Vật chất/Bản đồ) cùng dùng hồ sơ `TRAINING_SUPPORT`
  (chỉ tài liệu/học liệu/lịch-view), gộp chung trách nhiệm. Ban Kế hoạch thiếu hẳn quyền mở học
  kỳ/lớp học phần/khung CTĐT để làm việc cốt lõi.
- **Thay đổi:** thêm hồ sơ `TRAINING_PLANNING` (trưởng) + `TRAINING_PLANNING_ASSIST` (trợ lý) trong
  [scripts/reconcile_position_grants.ts](../../scripts/reconcile_position_grants.ts); map
  `B1_TRUONG_BAN_KH` → `TRAINING_PLANNING`, `B1_TRO_LY_KEHOACH` → `TRAINING_PLANNING_ASSIST`.
  Ban Vật chất/Bản đồ **giữ nguyên** (domain phase sau).
- **Tập quyền `TRAINING_PLANNING`:** EDUCATION (VIEW_PROGRAM; VIEW/CREATE/UPDATE/DELETE_CURRICULUM;
  VIEW/MANAGE_TERM; VIEW/CREATE/UPDATE/DELETE_CLASS_SECTION; VIEW/CREATE/UPDATE/DELETE_SCHEDULE;
  VIEW/MANAGE_ENROLLMENT; VIEW_ATTENDANCE; VIEW_STUDENT; VIEW_TRAINING_SYSTEM; VIEW_BATTALION) +
  TRAINING(view) + FACULTY(view) + LEARNING_MATERIAL(view) + DOCUMENTS(view/export) + dashboard +
  personal. **KHÔNG** điểm/tốt nghiệp/rèn luyện/CRUD học viên/CRUD-duyệt CTĐT. Trợ lý = bỏ DELETE.
- **Scope ACADEMY** cho Ban Kế hoạch: vì xếp lịch toàn học viện cần nhìn xuyên đơn vị; predicate đã
  giới hạn chặt (chỉ kế hoạch/lịch + chỉ XEM học viên) nên không lộ dữ liệu nhạy cảm ngoài phạm vi.
- **Kết quả (verify trên DB):** `B1_TRUONG_BAN_KH` = 55 grant @ ACADEMY (đủ 8 mã kế hoạch lõi, 0/9
  mã nhạy cảm điểm/tốt nghiệp/học viên); `B1_TRO_LY_KEHOACH` = 52 @ ACADEMY (không có mã DELETE_*).
  Áp bằng `--apply --sync --only` (gỡ 9 grant `TRAINING_SUPPORT` cũ), rollback snapshot:
  `scripts/_rollback_position_grants_*.json`.

---

## 7. Vệ sinh dữ liệu đơn vị (ghi nhận — chưa xử lý đợt này)

Đơn vị Ban canonical: `B1_SI3I` (Kế hoạch tổng hợp), `B1_T59A` (Vật chất huấn luyện), `B1_TKIA`
(Bản đồ) — đều parent = `B1`. Tồn tại **bản trùng** từ reconcile mã định danh QĐ-3843
(`G11.40.*`, `B12-*`, `B4_6MWG`…). **Quy ước:** dùng `B1_*` làm canonical; gắn tài khoản Ban vào
`B1_*`. Dọn trùng theo backlog org-units (32 xung đột), không xử lý trong đợt này.

---

## 8. Phase 2 & 3 — ĐÃ TRIỂN KHAI

### Phase 2 — Generator xếp lịch BÁN TỰ ĐỘNG (UC-54+) ✅
- **Service:** [lib/services/education/schedule-generator.service.ts](../../lib/services/education/schedule-generator.service.ts)
  — `previewTermSchedule()` (tính kế hoạch + xung đột, không ghi) + `commitTermSchedule()` (ghi
  `TrainingSession`, bỏ lớp xung đột/đã có buổi trừ khi bật cờ). Tái dùng `checkConflicts()`.
- **API:** `POST /api/education/schedule/generate` (preview, gate `VIEW_SCHEDULE`) +
  `POST /api/education/schedule/commit` (gate `CREATE_SCHEDULE` + audit).
- **UI:** [components/education/schedule/schedule-generator-wizard.tsx](../../components/education/schedule/schedule-generator-wizard.tsx)
  gắn trên trang lịch (nút "Sinh lịch học kỳ" → preview + bảng xung đột → ghi).
- KHÔNG làm bộ giải ràng buộc toàn tự động. Verify thật: học kỳ 994 lớp → 14.910 buổi dự kiến;
  idempotent (lớp đã có buổi bị bỏ qua nếu không bật `regenerate`).

### Phase 3 — Vật chất huấn luyện (Ban Vật chất) & Bản đồ (Ban Bản đồ) ✅
- **Model:** `TrainingMateriel` + `MaterielIssuance`; `MapAsset` + `MapLoan` (+ enum
  MaterielCategory/Condition, AssetIssueType/Status, MapType/Format/SecurityLevel). Áp qua
  `prisma migrate diff` lọc additive (in sync, không drift). `managingUnitId` = scalar FK.
- **Function codes:** `*_TRAINING_MATERIEL` (6) + `*_MAP` (7, gồm `VIEW_MAP_SECRET` nhạy cảm).
- **Service/API:** materiel + map service (issue/return transactional, cập nhật tồn khả dụng);
  routes `/api/education/training-materiels[/[id]]` + `/api/education/maps[/[id]]` (RBAC + audit;
  bản đồ mật guard 2 lớp: ẩn khỏi list + chặn xem chi tiết khi thiếu `VIEW_MAP_SECRET`).
- **RBAC:** `B1_TRUONG_BAN_VC` → `MATERIEL_MANAGER` (full vật chất + LAB), `B1_TRUONG_BAN_BĐ` →
  `MAP_MANAGER` (full bản đồ kể cả mật); trợ lý bỏ DELETE (+ bản đồ: bỏ secret).
- **UI:** `/dashboard/education/training-materiels` + `/dashboard/education/maps` (KPI + list +
  cấp phát/thu hồi + lịch sử). Menu nhóm "Vật chất & Bản đồ".
- Verify thật: tồn 10 → cấp 3 → 7 → thu hồi → 10; FK cascade xóa con; bản đồ mật tạo/đọc đúng guard.

---

## 9. Rủi ro & Verification

### Rủi ro
- Seed môn: an toàn (0 FK điểm), có backup. Reconcile RBAC: chỉ chạm 2 chức vụ Ban Kế hoạch, có
  rollback snapshot, không đụng Chỉ huy phòng/Khoa.
- Scope ACADEMY của Ban Kế hoạch: chấp nhận vì predicate giới hạn chặt; rà lại nếu thêm mã EDUCATION
  nhạy cảm trong tương lai (đừng để lọt vào `planningCodes`).

### Cách kiểm thử
- **Môn học:** `SELECT count(*) FROM he_so_mon_hoc` = 1121; `... WHERE "boMonId" IS NOT NULL` = 1073;
  `... ket_qua_hoc_tap WHERE "heSoMonHocId" IS NOT NULL` = 0 (không mồ côi).
- **RBAC:** grant của `B1_TRUONG_BAN_KH` chứa mã kế hoạch (curriculum/term/class_section/schedule),
  KHÔNG chứa `MANAGE_GRADE`/`APPROVE_GRADUATION`/`MANAGE_CONDUCT`/`CREATE_STUDENT`; trợ lý không có `DELETE_*`.
- **Login thật** (khi gán tài khoản vào Ban Kế hoạch): vào được curriculum/planning/sections/schedule;
  bị chặn nhập/duyệt điểm & xét tốt nghiệp.
- **Regression:** `lib/rbac/__tests__/menu-rbac-consistency.test.ts` (chức vụ canonical không đổi).
