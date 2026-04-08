# MODULE M03 – CSDL ĐẢNG VIÊN

---

## 1. Mục tiêu module

M03 xây dựng hệ thống quản lý toàn diện dữ liệu Đảng viên, tổ chức Đảng và các quy trình nghiệp vụ Đảng trong Học viện Hậu cần, gồm:
- hồ sơ đảng viên toàn trình,
- cơ cấu tổ chức Đảng,
- quy trình kết nạp đảng viên mới,
- sinh hoạt chi bộ và biên bản số,
- quản lý đảng phí,
- đánh giá phân loại đảng viên hàng năm,
- khen thưởng/kỷ luật trong Đảng,
- chuyển sinh hoạt/chuyển Đảng,
- công tác kiểm tra, giám sát của UBKT,
- dashboard điều hành và báo cáo Đảng.

M03 là module có **mật độ bảo mật cấp cao nhất** trong hệ thống.

---

## 2. Thông tin tổng quan

- Mã module: M03
- Tên module: CSDL Đảng viên
- Phiên bản thiết kế: v1.0/2026
- Số use case: 10
- Tổng ngày công: 54
- Tổng chi phí sơ bộ: 207,7 triệu
- Đường dẫn chính: `/dashboard/party/*`
- Liên thông:
  - CSDL Đảng viên cấp Bộ (Cục Tổ chức – TCCT)
  - Hệ thống cán bộ BQP
- RBAC prefix: `PARTY.*`

---

## 3. 10 Use Cases của M03

- UC-63: Hồ sơ đảng viên toàn trình (Mẫu 2A-LLĐV)
- UC-64: Cơ cấu tổ chức Đảng (Đảng ủy → Đảng bộ → Chi bộ)
- UC-65: Quy trình kết nạp Đảng viên mới
- UC-66: Quản lý sinh hoạt Chi bộ & biên bản số
- UC-67: Quản lý đảng phí tự động
- UC-68: Đánh giá phân loại đảng viên hàng năm
- UC-69: Khen thưởng & kỷ luật trong Đảng
- UC-70: Chuyển sinh hoạt & chuyển Đảng
- UC-71: Ủy ban Kiểm tra Đảng (UBKT) – Kiểm tra, giám sát
- UC-72: Dashboard điều hành & báo cáo Đảng

---

## 4. Vòng đời đảng viên – luồng nghiệp vụ trung tâm

M03 phải bám 9 giai đoạn chuẩn:

0. Quần chúng ưu tú  
1. Cảm tình Đảng  
2. Đối tượng kết nạp  
3. Đảng viên dự bị  
4. Đảng viên chính thức  
5. Sinh hoạt thường kỳ  
6. Đánh giá hàng năm  
7. Khen thưởng / Kỷ luật / Kiểm tra giám sát  
8. Chuyển sinh hoạt / Xóa tên / Khai trừ

Vòng đời này là trục trung tâm. Không được giản lược M03 thành CRUD hồ sơ đảng viên.

---

## 5. Vai trò của M03 trong toàn hệ thống

### 5.1. Quan hệ với M02
M03 không sở hữu hồ sơ nhân thân gốc. Hồ sơ đảng viên 360° phải kéo từ:
- `User/Personnel` làm master nhân thân
- Career history / đơn vị công tác từ module nhân sự

### 5.2. Quan hệ với M01
M03 phải dùng:
- auth
- RBAC
- scope
- audit
- bảo mật trường nhạy cảm

### 5.3. Quan hệ với M13
Các quy trình như:
- kết nạp đảng viên
- chuyển sinh hoạt
- kỷ luật
- phê duyệt hồ sơ  
nên có khả năng workflow hóa qua M13.

### 5.4. Quan hệ với M19
M03 nên dùng lookup từ M19 cho:
- loại đảng viên
- xếp loại đảng viên
- kỷ luật Đảng
- chức vụ Đảng
- tổ chức đoàn thể liên quan

---

## 6. Enums nghiệp vụ cốt lõi

### PartyMemberStatus
- QUAN_CHUNG
- CAM_TINH
- DOI_TUONG
- DU_BI
- CHINH_THUC
- CHUYEN_DI
- XOA_TEN_TU_NGUYEN
- KHAI_TRU

### PartyOrgLevel
- DANG_UY_HOC_VIEN
- DANG_BO
- CHI_BO_CO_SO
- CHI_BO_GHEP

### ReviewGrade
- HTXSNV
- HTTNV
- HTNV
- KHNV

### MeetingType
- THUONG_KY
- BAT_THUONG
- MO_RONG
- CHUYEN_DE
- KIEM_DIEM_CUOI_NAM
- BAU_CU

### DisciplineSeverity
- KHIEN_TRACH
- CANH_CAO
- CACH_CHUC
- KHAI_TRU_KHOI_DANG

### InspectionType
- KIEM_TRA_DINH_KY
- KIEM_TRA_KHI_CO_DAU_HIEU
- GIAM_SAT_CHUYEN_DE
- PHUC_KET_KY_LUAT

### TransferType
- CHUYEN_SINH_HOAT_TAM_THOI
- CHUYEN_DANG_CHINH_THUC

### RecruitmentStep
- THEO_DOI
- HOC_CAM_TINH
- DOI_TUONG
- CHI_BO_XET
- CAP_TREN_DUYET
- DA_KET_NAP

---

## 7. Data model chính

### Bảng lõi
- `PartyMember`
- `PartyOrganization`
- `PartyMeeting`
- `PartyMeetingAttendance`
- `PartyFeePayment`
- `PartyAnnualReview`
- `PartyAward`
- `PartyDiscipline`
- `PartyTransfer`
- `PartyInspectionTarget`
- `PartyRecruitmentPipeline`

### Quan hệ logic
- Một `PartyMember` gắn với một nhân sự nguồn (User/Personnel)
- Một `PartyMember` thuộc một `PartyOrganization`
- Một `PartyMember` có nhiều:
  - annual reviews
  - fee payments
  - attendances
  - awards
  - disciplines
  - transfers
  - inspections

---

## 8. Kiến trúc code cho project hiện tại

### API
- `app/api/party/**`

### Pages
- `app/dashboard/party/**`

### Components
- `components/party/**`

### Services
- `lib/services/party/**`

### Repositories
- `lib/repositories/party/**`

### Validators
- `lib/validators/party/**`

### Prisma
- `prisma/schema.prisma`

---

## 9. Phase triển khai M03

### Phase 1
- schema lõi:
  - PartyMember
  - PartyOrganization
  - PartyMeeting
  - PartyFeePayment
  - PartyAnnualReview
  - PartyTransfer
  - PartyAward / PartyDiscipline
  - PartyInspectionTarget
  - PartyRecruitmentPipeline

### Phase 2
- UC-63 hồ sơ đảng viên 360°
- UC-64 tổ chức Đảng
- UC-66 sinh hoạt chi bộ
- UC-67 đảng phí

### Phase 3
- UC-65 kết nạp
- UC-68 đánh giá hàng năm
- UC-69 khen thưởng/kỷ luật
- UC-70 chuyển sinh hoạt

### Phase 4
- UC-71 UBKT
- UC-72 dashboard điều hành & báo cáo

---

## 10. Notes for Claude

- M03 là module nghiệp vụ nhạy cảm nhất, không được xử lý như CRUD thông thường
- Hồ sơ đảng viên phải dựa trên master nhân thân từ M02
- Vòng đời đảng viên 9 giai đoạn là trục nghiệp vụ bắt buộc
- Phải chừa integration point rõ với M01, M13, M19
- Các mẫu biểu và xuất hồ sơ về lâu dài nên đi qua M18