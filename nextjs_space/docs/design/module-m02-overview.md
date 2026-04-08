# MODULE M02 – CSDL CÁN BỘ NHÂN SỰ

---

## 1. Mục tiêu module

M02 là module dữ liệu nguồn về cán bộ, quân nhân, giảng viên, học viên và các loại nhân sự đặc thù trong hệ thống HVHC BigData.

M02 có nhiệm vụ:
- quản lý hồ sơ cán bộ toàn diện,
- làm nguồn master data cho nhiều module khác,
- cung cấp hồ sơ 360° tổng hợp từ nhiều phân hệ,
- quản lý lịch sử công tác, học vấn, gia đình, lý lịch khoa học,
- hỗ trợ quy hoạch và tìm kiếm nguồn cán bộ.

M02 là module dữ liệu chủ. Nhiều module khác phải foreign key hoặc aggregate dựa trên M02.

---

## 2. Thông tin tổng quan

- Mã module: M02
- Tên module: CSDL Cán bộ Nhân sự
- Phiên bản thiết kế: v1.0/2026
- Số use case: 6
- Tổng ngày công: 32
- Tổng chi phí sơ bộ: 89,4 triệu
- Tác nhân chính:
  - Phòng Cán bộ
  - Phòng Quân lực
  - Phòng Đào tạo
  - Phòng Chính trị
  - Cán bộ quản lý đơn vị
  - Admin hệ thống

---

## 3. 6 Use Cases của M02

- UC-09: Hồ sơ cán bộ 360° – mẫu 2A-LLĐV
- UC-10: Lịch sử công tác – Timeline bổ nhiệm / điều động
- UC-11: Lý lịch khoa học & thành tích học thuật
- UC-12: Quản lý gia đình – người thân
- UC-13: Quản lý hồ sơ theo loại cán bộ (6 phân loại)
- UC-14: Engine quy hoạch & tìm kiếm nguồn cán bộ

---

## 4. Vai trò của M02 trong toàn hệ thống

### 4.1. Nguồn dữ liệu gốc
M02 là nguồn gốc cho:
- Personnel / User gắn với hồ sơ người thật
- Unit / vị trí công tác hiện tại
- lịch sử công tác
- học vấn / đào tạo
- gia đình
- lý lịch khoa học cơ sở

### 4.2. Dữ liệu aggregate từ module khác
Hồ sơ 360° của M02 phải tổng hợp thêm từ:
- M03: PartyMember
- M05: RewardRecord / DisciplineRecord / Insurance / Allowance
- M09: ResearchMember / ScientificProfile
- M07: FacultyProfile

### 4.3. Dùng chung cho toàn hệ thống
Các module như M03, M05, M09, M10 phải coi M02 là nguồn nhân sự chuẩn, tránh tạo bản sao người dùng nghiệp vụ riêng.

---

## 5. Kiến trúc chức năng tổng quát

### 5.1. Personnel Master
Bảng `Personnel` là bảng master chính.

### 5.2. Profile 360
Tổng hợp đa nguồn thành một hồ sơ duy nhất.

### 5.3. Career Timeline
Quản lý lịch sử công tác, điều động, bổ nhiệm, thăng quân hàm, đi học, biệt phái.

### 5.4. Education & Academic
Học vấn, bằng cấp, học hàm, học vị, chuyên ngành, ngoại ngữ, tin học, thành tích học thuật.

### 5.5. Family Management
Quản lý vợ/chồng, con, cha mẹ, người phụ thuộc.

### 5.6. Talent Search / Planning
Tìm kiếm nguồn cán bộ theo tiêu chí quy hoạch, điều kiện đào tạo, chuyên môn, đơn vị.

---

## 6. Data model lõi

### 6.1. Personnel
Là bảng hồ sơ cán bộ toàn diện, gồm:
- định danh nội bộ và liên thông BQP,
- thông tin cơ bản,
- phân loại cán bộ,
- quân sự,
- học vấn và đào tạo,
- học thuật,
- đảng,
- trạng thái công tác,
- liên kết đến các bảng con và module ngoài.

### 6.2. Các bảng con trọng yếu
- `CareerHistory`
- `EducationHistory`
- `FamilyMember`
- `ScientificProfile`
- `PersonnelStatusHistory`

### 6.3. Liên kết ngoài
- `AwardsRecord` từ M05
- `DisciplineRecord` từ M05
- `PartyMember` từ M03
- `ResearchMember` từ M09
- `FacultyProfile` từ M07

---

## 7. Dùng Master Data từ M19

M02 phải ưu tiên dùng M19 cho các lookup như:
- dân tộc
- tôn giáo
- trình độ lý luận chính trị
- trình độ học vấn
- học vị
- học hàm
- chuyên ngành
- cơ sở đào tạo
- ngoại ngữ
- trình độ ngoại ngữ
- trình độ tin học
- tỉnh / huyện / xã
- quốc gia
- vùng miền

Không nên hard-code các danh mục này trong M02.

---

## 8. Phân loại cán bộ

M02 phải hỗ trợ 6 nhóm hồ sơ theo thiết kế:
- sĩ quan
- QNCN
- HSQ chiến sĩ
- học viên quân sự
- CNVCQP
- sinh viên dân sự
- giảng viên

Lưu ý: hệ thống có thể mở rộng thêm, nhưng phase đầu phải đúng 6/7 loại theo thiết kế hiện có của bảng `PersonnelCategory`.

---

## 9. RBAC và bảo mật

M02 phụ thuộc trực tiếp vào M01:
- scope SELF / UNIT / ACADEMY
- quyền xem trường nhạy cảm
- audit truy cập hồ sơ
- permission `PERSONNEL.VIEW`, `PERSONNEL.SENSITIVE` và các function code liên quan

M02 không được tự làm auth riêng.

---

## 10. API và UI tổng quát

### API chính
- hồ sơ cán bộ
- profile360
- career history
- education history
- family
- search / talent engine

### UI chính
- hồ sơ cá nhân
- timeline công tác
- học vấn / thành tích
- gia đình
- dashboard và bộ lọc tìm nguồn cán bộ

---

## 11. Kiến trúc code cho project hiện tại

### API
- `app/api/personnel/**`

### Pages
- `app/dashboard/personnel/**`

### Components
- `components/personnel/**`

### Services
- `lib/services/personnel/**`

### Repositories
- `lib/repositories/personnel/**`

### Validators
- `lib/validators/personnel/**`

### Prisma
- `prisma/schema.prisma`

---

## 12. Phase triển khai M02

### Phase 1
- schema lõi Personnel + CareerHistory + EducationHistory + FamilyMember + ScientificProfile

### Phase 2
- CRUD personnel
- profile360 aggregate service
- career/education/family APIs

### Phase 3
- UI hồ sơ 360
- timeline công tác
- tab học vấn / gia đình / khoa học

### Phase 4
- phân loại hồ sơ theo loại cán bộ
- search / talent engine / planning

---

## 13. Notes for Claude

- M02 là master data nguồn, không phải module hồ sơ đơn giản
- Hồ sơ 360° phải aggregate đa nguồn, không chỉ đọc từ một bảng Personnel
- Phải tái sử dụng M19 cho lookup
- Phải tích hợp chặt với M01 cho scope và trường nhạy cảm
- Không tạo song song một mô hình User/Personnel thứ hai nếu schema hiện tại đã có User