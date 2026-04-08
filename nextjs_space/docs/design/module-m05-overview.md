# MODULE M05 – CSDL CHÍNH SÁCH
# Quản lý toàn diện chế độ – chính sách – quyền lợi quân nhân

---

## 1. Mục tiêu module

M05 là trung tâm quản lý toàn bộ quyền lợi, chế độ và nghĩa vụ pháp lý của cán bộ, quân nhân, công nhân viên quốc phòng tại Học viện Hậu cần.

Module này hợp nhất 6 lĩnh vực nghiệp vụ trước đây được quản lý rời rạc:
- khen thưởng
- kỷ luật
- BHXH / BHYT quân đội
- phụ cấp / trợ cấp chính sách
- người có công
- hưu trí

M05 phải làm cho hồ sơ cán bộ 360° phản ánh đầy đủ lịch sử quyền lợi và nghĩa vụ.

---

## 2. Thông tin tổng quan

- Mã module: M05
- Tên module: CSDL Chính sách
- Phiên bản thiết kế: v1.0/2026
- Số use case: 12
- Số lĩnh vực nghiệp vụ: 6
- Đường dẫn chính: `/dashboard/policy/*`
- Tác nhân chính:
  - Phòng Chính sách
  - Phòng Tài chính
  - Chỉ huy đơn vị
  - Cán bộ / quân nhân
  - BGĐ Học viện
- Tính chất:
  - Module pháp lý phức tạp nhất
  - Mỗi quy trình bị ràng buộc bởi ít nhất một văn bản pháp quy cụ thể

---

## 3. 12 Use Cases của M05

### Nhóm Khen thưởng & Thi đua
- UC-73: Hồ sơ khen thưởng toàn trình
- UC-74: Quản lý phong trào thi đua & điểm tích lũy
- UC-75: AI gợi ý đối tượng khen thưởng

### Nhóm Kỷ luật
- UC-76: Hồ sơ kỷ luật hành chính + nhắc xóa án

### Nhóm BHXH / BHYT
- UC-77: Hồ sơ BHXH/BHYT quân đội
- UC-78: Giải quyết chế độ BHXH

### Nhóm Phụ cấp / Trợ cấp
- UC-79: Phụ cấp tự động
- UC-80: Trợ cấp & chế độ chính sách

### Nhóm Người có công / Hưu trí
- UC-81: Hồ sơ người có công
- UC-82: Retirement Planner

### Nhóm cổng tự phục vụ & điều hành
- UC-83: Cổng tự phục vụ (Self-service Portal)
- UC-84: Dashboard điều hành & Báo cáo tự động

---

## 4. Vai trò của M05 trong toàn hệ thống

### 4.1. Quan hệ với M02
M05 không sở hữu hồ sơ nhân sự gốc. Mọi hồ sơ chính sách phải gắn với master nhân sự từ M02:
- nhân thân
- đơn vị
- quân hàm / chức vụ
- thâm niên
- loại quân nhân

### 4.2. Quan hệ với M01
M05 phải dùng:
- auth
- RBAC
- scope dữ liệu
- audit
- bảo vệ trường nhạy cảm về chế độ / kỷ luật / BHXH

### 4.3. Quan hệ với M13
Các quy trình như:
- phê duyệt hồ sơ khen thưởng
- duyệt trợ cấp
- duyệt hưu trí
- phê duyệt chế độ BHXH  
nên có khả năng workflow hóa qua M13.

### 4.4. Quan hệ với M18
Các biểu mẫu quyết định, báo cáo BQP, D02-TS BHXH, danh sách đề nghị khen thưởng cấp trên, hồ sơ hưu trí… về lâu dài nên xuất qua M18.

### 4.5. Quan hệ với M19
M05 nên dùng lookup từ M19 cho:
- loại khen thưởng
- cấp khen thưởng
- danh hiệu thi đua
- hình thức kỷ luật
- lý do kỷ luật
- loại người có công
- lý do hưu / nghỉ chế độ  
và các category chính sách liên quan. 

---

## 5. Enums nghiệp vụ cốt lõi

### RewardWorkflowStatus
- DRAFT
- PROPOSED
- UNIT_VERIFIED
- DEPT_REVIEWED
- APPROVED
- REJECTED

### MeritType
- THUONG_BINH
- BENH_BINH
- NGUOI_HOAT_DONG_CM
- THAN_NHAN_LIET_SI
- ANH_HUNG_LLVT
- ANH_HUNG_LAO_DONG
- KHAI_QUOC_CONG_THAN

### RetirementType
- HUU_TRI_BINH_THUONG
- HUU_TRUOC_TUOI
- NGHI_VIEC_DO_SUC_KHOE
- MAT_VIEC
- TU_TUAT_CHO_THAN_NHAN

Ngoài ra nhiều enum/category nên dần chuyển sang M19 thay vì hard-code cố định.

---

## 6. Các nhóm dữ liệu chính

- `RewardRecord`
- `EmulationCampaign`
- `DisciplineRecord`
- `InsuranceProfile`
- `InsuranceSettlement`
- `AllowanceRecord`
- `SubsidyCase`
- `MeritProfile`
- `RetirementProfile`
- `RetirementScenario`
- `PolicySelfServiceRequest`
- `PolicyDashboardAggregate`

---

## 7. Chỉ số hiệu quả kỳ vọng của M05

Theo thiết kế kỹ thuật:
- Tổng hợp báo cáo khen thưởng cuối năm: từ 3–5 ngày xuống dưới 30 phút
- Bỏ sót nhắc xóa án kỷ luật: từ ~15% xuống 0%
- BHYT hết hạn mà cán bộ không biết: từ ~8%/năm xuống 0%
- Giải quyết trợ cấp khó khăn: từ 5–7 ngày xuống dưới 2 ngày
- Tính chính xác phụ cấp thâm niên: từ sai ~3% xuống 100% chính xác
- Tra cứu lịch sử khen thưởng: từ tìm Excel nhiều năm xuống dưới 5 giây
- Xuất D02-TS BHXH hàng tháng: từ 2 ngày/tháng xuống dưới 5 phút. :contentReference[oaicite:3]{index=3}

---

## 8. Kiến trúc code cho project hiện tại

### API
- `app/api/policy/**`

### Pages
- `app/dashboard/policy/**`

### Components
- `components/policy/**`

### Services
- `lib/services/policy/**`

### Repositories
- `lib/repositories/policy/**`

### Validators
- `lib/validators/policy/**`

### Prisma
- `prisma/schema.prisma`

---

## 9. Phase triển khai M05

### Phase 1
- UC-73, UC-76, UC-77, UC-80
- xây nền cho khen thưởng, kỷ luật, hồ sơ BHXH, trợ cấp

### Phase 2
- UC-74, UC-78, UC-79, UC-82
- tự động hóa điểm thi đua, tính BHXH, phụ cấp, planner hưu trí

### Phase 3
- UC-75, UC-81, UC-83, UC-84
- AI gợi ý khen thưởng, người có công, self-service, dashboard AI

---

## 10. Notes for Claude

- M05 là module nghiệp vụ pháp lý phức tạp, không phải CRUD đơn giản
- Mọi hồ sơ chính sách phải gắn với nhân sự nguồn từ M02
- M05 phải chừa integration point rõ với M01, M13, M18, M19
- Nhiều báo cáo/biểu mẫu về lâu dài phải đi qua M18
- Các phép tính như phụ cấp, BHXH, retirement planner phải tách thành service rõ ràng