# Không gian cá nhân — Liên thông dữ liệu & Đồng bộ phục vụ lãnh đạo (M02 ext)

> Tài liệu thiết kế: cách "không gian cá nhân" của cán bộ liên thông vào CSDL chính, và
> cách CSDL chính tổng hợp phục vụ lãnh đạo/chỉ huy. Mục tiêu: **không trùng chức năng**,
> **một nguồn sự thật**, **liên thông chặt chẽ**.

## 1. Tổng quan các loại CSDL trong không gian cá nhân

Mỗi cán bộ có một "không gian cá nhân" (`/dashboard/personal/*`) gom nhiều **loại CSDL**,
mỗi loại gắn một module nền và một sắc thái màu nhận diện:

| Loại CSDL | Module | Trang cá nhân | Quyền sửa |
|---|---|---|---|
| Hồ sơ cán bộ (HSCB) | M02 | my-cadre-profile, my-profile-changes | 2 cấp (mô tả) / chỉ huy (định danh) |
| Quá trình công tác | M02 | my-career | đính chính qua 2 cấp; sự kiện do chỉ huy ghi |
| Chính sách / phúc lợi | M05 | my-policy | xem + đề nghị giải quyết chế độ |
| Bảo hiểm (BHXH/BHYT) | M05 | my-insurance | xem + đề nghị quyết toán |
| Khen thưởng / kỷ luật | M05 | my-awards | chỉ xem (hệ thống quản lý) |
| Đảng viên | M03 | (hồ sơ đảng) | chỉ xem |
| Học tập (điểm/rèn luyện) | M10 | my-grade, my-conduct, my-schedule, my-graduation | chỉ xem |
| Nghiên cứu khoa học | M09/M20+ | my-research, my-publications, scientific-cv | CRUD theo lifecycle |
| Tài khoản & bảo mật | M01 | profile, settings/security | sửa trực tiếp |

## 2. Nguồn sự thật (source of truth)

- **`Personnel` (M02) là master cho "người"** — dashboard/CSDL chính phục vụ lãnh đạo đọc theo
  `Personnel` (+ `OfficerCareer`/`SoldierProfile`).
- **`User`** là tài khoản + (lịch sử) kho trường HSCB mở rộng; liên kết 1–1 tùy chọn qua
  `User.personnelId`.
- Các bảng danh sách HSCB (chức vụ kiêm, phụ cấp, danh hiệu…) mang **cả `userId` lẫn
  `personnelId`** ⇒ đã liên thông sẵn với `Personnel`.

> Rủi ro lịch sử: trường scalar mô tả (địa chỉ, nơi sinh, học vấn…) chỉ được ghi vào `User`
> ⇒ lệch với `Personnel` mà lãnh đạo đọc. **Khắc phục:** mọi đường ghi đều CHIẾU sang
> `Personnel` (mục 4).

## 3. Một đường duy nhất để cập nhật hồ sơ (chống trùng)

```
Cá nhân  ──┬─ (mô tả an toàn)         PUT /api/profile/me  ──► ghi User + CHIẾU Personnel
           │
           ├─ (mô tả cần duyệt)       ProfileChangeRequest (2 cấp):
           │                          DRAFT → SUBMITTED → UNIT_APPROVED → APPROVED(commit)
           │                          chỉ huy đơn vị → Ban cán bộ/Quân lực → ghi User + Personnel
           │
           └─ (cấp bậc/đơn vị/chức vụ) KHÔNG self-service →
                                      quy trình điều động / phong quân hàm (RankDeclaration…)
                                      ghi thẳng Personnel/OfficerCareer
```

**Đã loại bỏ trùng lặp:** `PersonalUpdateRequest` + `POST /api/personal/request-update`
(1 cấp "admin M02", **không có handler duyệt → ngõ cụt**, chồng lấn trường với
ProfileChangeRequest) đã **deprecate** (POST trả `410`, GET giữ để xem lịch sử). UI
`RequestCorrectionDialog` điều hướng về luồng 2 cấp. `PUT /api/profile/me` đã **bỏ** ghi
trực tiếp `rank`, `position`, `citizenId` (định danh/chỉ huy — không tự sửa).

## 4. Cơ chế liên thông (projection User → Personnel)

Nguồn khai báo duy nhất: [`lib/constants/personnel-field-map.ts`](../../lib/constants/personnel-field-map.ts)
(`USER_TO_PERSONNEL_FIELD_MAP`). Helper dùng chung:
[`lib/services/personnel/personnel-projection.service.ts`](../../lib/services/personnel/personnel-projection.service.ts)
(`projectUserPatchToPersonnel`). Được gọi ở **mọi đường ghi**:

- `commitRequest` (ProfileChangeRequest tier-2 APPROVE) — trong cùng transaction.
- `PUT /api/profile/me` (sửa trực tiếp).

Trường thuộc map → ghi cả `User` (mirror) và `Personnel` (master). Trường ngoài map (chỉ
có trên `User`: lương, sức khỏe, CHQL, sở trường…) chỉ ghi `User`.

## 5. Ma trận quyền sửa trường (field-ownership)

| Nhóm trường | Owner | Cách sửa | Liên thông Personnel |
|---|---|---|---|
| name, phone, avatar, email, mật khẩu, MFA | User (tài khoản) | trực tiếp | — |
| dateOfBirth, gender, ethnicity, religion | Personnel (master) | trực tiếp / 2 cấp | ✔ (chiếu) |
| birthPlace, placeOfOrigin, permanentAddress, temporaryAddress | Personnel | trực tiếp / 2 cấp | ✔ |
| bloodType, educationLevel, specialization, academicTitle | Personnel | trực tiếp / 2 cấp | ✔ |
| HSCB mở rộng (lương, sức khỏe, CHQL, LLCT, Đảng-Đoàn, sở trường…) | User (HSCB) | 2 cấp | — (không có cột Personnel) |
| Danh sách HSCB (chức vụ kiêm, phụ cấp, danh hiệu, chiến đấu…) | User+Personnel | 2 cấp (SECTION_*) | ✔ (sẵn personnelId) |
| **rank** (cấp bậc) | Personnel | **chỉ huy** — phong quân hàm | qua RankDeclaration |
| **unitId** (đơn vị) | Personnel | **chỉ huy** — điều động | qua điều động |
| **positionId/position** (chức vụ) | Personnel | **chỉ huy** — bổ nhiệm | qua bổ nhiệm |
| **citizenId, militaryIdNumber** | Personnel/SensitiveIdentity | **admin** | identity store |
| enlistmentDate, dischargeDate | Personnel | admin/chỉ huy | — |

## 6. Đồng bộ phục vụ lãnh đạo/chỉ huy

**Không dùng sync job.** CSDL chính phục vụ lãnh đạo bằng **tổng hợp real-time** qua Prisma
(`count/groupBy/aggregate`) + **lọc theo phạm vi quyền** `getAccessibleUnitIds`
([`lib/rbac/scope.ts`](../../lib/rbac/scope.ts)): ACADEMY (toàn học viện) · DEPARTMENT
(khoa + đơn vị con) · UNIT (đơn vị) · SELF. Có cache theo scope (`DashboardWidgetDataCache`)
tránh rò rỉ chéo đơn vị.

Vì cá nhân ghi → chiếu vào **`Personnel`** (đúng nơi lãnh đạo đọc), thay đổi đã duyệt
**tự liên thông** lên dashboard mà không cần đồng bộ thủ công. Yêu cầu: các API tổng hợp
nhân sự đọc nhất quán từ `Personnel` (xem mục 7).

## 7. Việc còn lại (next steps)

1. **Backfill** `Personnel` ← `User` cho dữ liệu demo đã drift: `scripts/backfill_personnel_from_user.ts` (dry-run + đếm lệch).
2. **Thống nhất read lãnh đạo**: rà các API tổng hợp đang đọc `db.user` (vd
   [`dashboard-stats.service.ts`](../../lib/services/dashboard/dashboard-stats.service.ts))
   chuyển/đối chiếu đọc `Personnel` để ăn khớp nguồn ghi.
3. **(Tùy chọn) careerHistory section**: mô hình hoá đính chính sự kiện công tác thành
   `SECTION_*` của luồng 2 cấp (CareerHistory đã có `userId`/`personnelId`).
