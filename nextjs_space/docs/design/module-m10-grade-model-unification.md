# M10 — Kế hoạch hợp nhất 3 model điểm về một Source of Truth

> Trạng thái: **BACKLOG / PROPOSAL** (chưa triển khai). Tài liệu thiết kế migration.
> Phạm vi: hợp nhất `KetQuaHocTap`, `ClassEnrollment`, `GradeRecord` → 1 nguồn sự thật.
> Tuân thủ: `.claude/rules/migration-refactor.md`, `database-schema.md` (không drop sớm,
> dual-read / single-write / backfill / deprecate, có rollback).

---

## 1. Current state (hiện trạng)

Hệ thống đang có **3 model điểm song song**, là 3 nguồn sự thật chồng lấn cho cùng một
thực thể "điểm học phần của học viên":

| Model | Bảng | Rows* | Reader | Writer | Quan hệ gốc | Nhận xét |
|---|---|---|---|---|---|---|
| **ClassEnrollment** | `class_enrollments` | 1668 | 11 | 2 | `ClassSection`→`CurriculumCourse`→`Term` + `HocVien`; có `ScoreHistory` (audit), `SessionAttendance` | **Đúng kiến trúc nhất** (M10 UC-56 backbone). Field điểm tiếng Anh. `gradeStatus` enum đầy đủ. Có audit trail bắt buộc. |
| **KetQuaHocTap** | `ket_qua_hoc_tap` | 1529 | **16** | 3 | `HocVien` (+ optional `HeSoMonHoc`) | **Nhiều consumer nhất** nhưng cấu trúc yếu: môn là string `monHoc/maMon`, không neo `ClassSection/Term`. Lineage LAN-import. `workflowStatus` (DRAFT/SUBMITTED/APPROVED/REJECTED). **Nguồn chính thức hiện tại của GPA service / transcript / AI / dashboard.** |
| **GradeRecord** | `grade_records` | 1548 | 2 | 1 | `Registration` (1:1 unique) | Ít dùng nhất. Gắn với model `Registration` (1800) — một nhánh enrollment legacy khác. Chỉ `app/api/training/grades` + seed dashboard dùng. |

\* số liệu sau khi seed M10 end-to-end (2026-06).

### Hệ quả của 3 nguồn sự thật
- **Lệch số liệu**: GPA tính từ `KetQuaHocTap`, nhưng màn điểm `/api/education/grades`
  đọc `ClassEnrollment`; dashboard có chỗ đọc `GradeRecord`. Ba nơi có thể không khớp.
- **Ghi điểm phân mảnh**: sửa điểm ở `ClassEnrollment` ghi `ScoreHistory` (audit bắt buộc),
  nhưng `KetQuaHocTap`/`GradeRecord` không có audit tương đương → rủi ro pháp lý/điểm.
- **Seed phức tạp**: phải seed cả 3 (đã làm) để các tính năng không trống.
- **`Registration` vs `ClassEnrollment`**: hai nhánh enrollment song song (xem
  `migration-refactor.md` mục "GradeRecord mới vs ClassEnrollment cũ").

---

## 2. Target state (đích đến)

**`ClassEnrollment` là Source of Truth duy nhất cho điểm học phần.**

Lý do chọn `ClassEnrollment`:
1. Quan hệ chuẩn hoá: gắn `ClassSection`→`CurriculumCourse`→`Term`→`AcademicYear` (truy vết được học phần/kỳ thật), không phải string tự do như `KetQuaHocTap`.
2. Có sẵn **audit trail bắt buộc** (`ScoreHistory`) và `SessionAttendance` — đáp ứng
  `security.md`/`testing.md` ("update điểm phải ghi ScoreHistory").
3. `gradeStatus` enum đầy đủ vòng đời (PENDING→GRADED→PUBLISHED→APPEALED→FINALIZED/REJECTED).

`KetQuaHocTap` và `GradeRecord` → **deprecate dần** (đọc qua adapter trong giai đoạn
chuyển tiếp, ngừng ghi mới, cuối cùng gỡ).

### Bổ sung schema cần cho đích (Phase 1)
`ClassEnrollment` còn thiếu vài thông tin mà consumer của `KetQuaHocTap` đang dùng:
- `workflowStatus` (DRAFT/SUBMITTED/APPROVED/REJECTED) — GPA service lọc `APPROVED`.
  → map sang `gradeStatus` (`FINALIZED`/`PUBLISHED` ≈ APPROVED) **hoặc** thêm trường
  `approvalStatus` riêng nếu cần phân biệt "duyệt điểm" với "vòng đời chấm".
- `namHoc`/`hocKy` dạng chuỗi: lấy được qua `classSection.term` (đã có quan hệ) →
  không cần thêm field, chỉ cần adapter map.
- `diemQuaTrinh`, `diemGiuaKy` chi tiết: `ClassEnrollment` đã có
  attendance/assignment/midterm/final → đủ; `diemQuaTrinh` = hàm của 3 thành phần.

---

## 3. Compatibility plan (tương thích trong chuyển tiếp)

Áp dụng **dual-read / single-write**:

- **Single-write**: mọi thao tác ghi điểm mới chỉ ghi `ClassEnrollment` (+ `ScoreHistory`).
  Ngừng tạo mới `KetQuaHocTap`/`GradeRecord`.
- **Dual-read qua adapter**: tạo `lib/services/education/grade-source.adapter.ts` expose
  một read-model thống nhất (vd `getStudentGrades(hocVienId)`, `getGpaInputs(...)`) đọc
  **`ClassEnrollment`** nhưng trả shape tương thích cái mà 16 consumer của `KetQuaHocTap`
  đang mong đợi (monHoc, maMon, diem, soTinChi, hocKy, namHoc, workflowStatus).
- Trong giai đoạn backfill, adapter có thể **fallback** sang `KetQuaHocTap` cho học viên
  chưa được backfill (cờ `GRADE_SOURCE=enrollment|legacy|dual`).

---

## 4. Migration steps (các bước, theo migration rollout chuẩn)

> Mỗi phase tự đứng được, có thể dừng/rollback giữa chừng.

**Phase 0 — Chuẩn bị & đo lường (read-only)**
1. Thêm test đảm bảo GPA/transcript/dashboard hiện tại (đọc `KetQuaHocTap`) có baseline.
2. Script đối chiếu: với mỗi học viên, so GPA tính từ `KetQuaHocTap` vs từ `ClassEnrollment`
   → đo độ lệch hiện tại (do dữ liệu seed độc lập). Ghi log, không sửa.

**Phase 1 — Schema bổ sung (add-only, không drop)**
3. Thêm field còn thiếu vào `ClassEnrollment` nếu cần (`approvalStatus`, hoặc dùng `gradeStatus`).
4. `prisma db push` + `prisma generate` (repo dùng db push — xem
   `project_prisma_db_push_workflow`). Không migrate-reset.

**Phase 2 — Adapter + chuyển READ**
5. Viết `grade-source.adapter.ts` (đọc `ClassEnrollment`, map shape `KetQuaHocTap`).
6. Chuyển từng consumer của `KetQuaHocTap` sang adapter, **ưu tiên theo rủi ro**:
   GPA service → transcript → dashboard → AI. Mỗi nhóm có test trước/sau.
7. Chuyển 2 reader của `GradeRecord` sang adapter.

**Phase 3 — Backfill**
8. Backfill: với mỗi `KetQuaHocTap`/`GradeRecord` chưa có `ClassEnrollment` tương ứng,
   tạo `ClassEnrollment` (cần map môn-string → `ClassSection`; môn không khớp → tạo
   `ClassSection` "lịch sử" hoặc gắn cờ `legacyImported`). Dry-run + validate count trước
   khi ghi. **Không xoá nguồn cũ.**

**Phase 4 — Chuyển WRITE**
9. Chuyển mọi write path ghi điểm về `ClassEnrollment` (+ `ScoreHistory`). 3 writer của
   `KetQuaHocTap` và 1 của `GradeRecord` chuyển sang service ghi `ClassEnrollment`.
10. Cập nhật seed: ngừng seed `KetQuaHocTap`/`GradeRecord` riêng; chỉ seed `ClassEnrollment`
    và để adapter cấp dữ liệu (đơn giản hoá `seed_ketquahoctap.ts` → deprecate).

**Phase 5 — Deprecate & gỡ**
11. Đánh dấu `@deprecated` model `KetQuaHocTap`, `GradeRecord` (giữ bảng, ngừng dùng).
12. Sau ≥1 chu kỳ vận hành ổn định: cân nhắc gỡ model (chỉ khi không còn consumer và đã
    archive dữ liệu lịch sử). `GradeRecord` gỡ trước (ít consumer nhất).

---

## 5. Rollback considerations

- **Phase 1–2 reversible**: field add-only không phá dữ liệu; adapter có cờ `GRADE_SOURCE`
  → set `legacy` để quay lại đọc `KetQuaHocTap` tức thì.
- **Phase 3 (backfill)**: chỉ INSERT `ClassEnrollment`, không đụng nguồn cũ → rollback =
  xoá các bản ghi `legacyImported=true`.
- **Phase 4 (write switch)**: rủi ro cao nhất. Giữ dual-write tạm (ghi cả 2) trong 1 sprint
  trước khi single-write, để rollback đọc lại nguồn cũ nếu lệch.
- **Không bao giờ** drop `KetQuaHocTap`/`GradeRecord` cùng phase với chuyển write.
- Mọi phase phải có test GPA/transcript/dashboard xanh trước khi sang phase sau.

---

## 6. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Map môn-string (`KetQuaHocTap.monHoc`) → `ClassSection` không khớp | Cao | Cờ `legacyImported`, báo cáo dòng không map được; không tự bịa quan hệ |
| GPA lệch sau khi đổi nguồn | Cao | Phase 0 đo baseline; test so khớp từng học viên |
| 16 consumer của `KetQuaHocTap` rải rác | Trung bình | Adapter tập trung, đổi reader theo nhóm có test |
| `Registration` vs `ClassEnrollment` (2 nhánh enrollment) | Trung bình | Quyết định gộp `Registration`→`ClassEnrollment` thuộc scope riêng, không trộn vào đây |

---

## 7. Liên quan
- Đã sửa: bug step 54 (`seed_mon_hoc_hvhc.ts`) xoá destructive dữ liệu học tập — nay gate
  sau `RESET_M10_LEARNING=true` (xem memory `project_seed_data_gaps_m10`).
- Seed hiện tại (tạm thời nuôi cả 3 nguồn): `seed_ketquahoctap.ts`, `seed_class_enrollments.ts`,
  `seed_m10_gpa_history.ts`. Sẽ đơn giản hoá ở Phase 4.
