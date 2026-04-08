# SYSTEM MODULE MAP – HVHC BIGDATA

---

## 1. Mục tiêu tài liệu

Tài liệu này mô tả:
- danh mục các module trọng yếu của hệ thống,
- vai trò của từng module,
- phân loại module theo tầng kiến trúc,
- mức độ ưu tiên triển khai,
- phụ thuộc chính giữa các module.

Tài liệu này dùng để Claude hiểu “bản đồ module” trước khi đi vào từng design chi tiết.

---

## 2. Phân tầng module toàn hệ thống

### Tầng A – Nền tảng bắt buộc
Đây là các module không thể thiếu để toàn hệ thống vận hành đúng, an toàn, có kiểm soát:

- **M01 – Hệ thống Quản trị & Bảo mật**
- **M19 – Master Data Management**
- **M18 – Template Management & Export Engine**
- **M13 – Workflow Phê duyệt Điện tử**

### Tầng B – Master data nguồn
Đây là module dữ liệu chủ dùng làm nguồn cho nhiều module khác:

- **M02 – CSDL Cán bộ Nhân sự**

### Tầng C – Module nghiệp vụ lõi
Các module trực tiếp phục vụ nghiệp vụ:

- **M03 – CSDL Đảng viên**
- **M05 – CSDL Chính sách**
- **M09 – Nghiên cứu Khoa học**
- **M10 – Giáo dục Đào tạo**
- Các module khác M04, M06–M08, M11, M12, M14–M17

### Tầng D – AI / Analytics / Integration
Một số module hoặc phân hệ mang tính tăng cường:
- AI report
- chatbot
- analytics
- duplicate detection
- trends analysis
- sync external systems

---

## 3. Danh mục module trọng yếu

### M01 – Hệ thống Quản trị & Bảo mật
**Vai trò**
- Lớp bảo mật nền của toàn hệ thống
- RBAC 4 tầng: Role → Position → Function → Scope
- MFA/OTP
- audit log
- session management
- SSO BQP
- hardening bảo mật

**Tính chất**
- Module bắt buộc số 1
- Không module nào nên production khi M01 chưa hoàn chỉnh

**Phụ thuộc ra**
- cấp quyền cho toàn hệ thống

**Phụ thuộc vào**
- gần như là nền độc lập, nhưng có thể dùng M19 cho một số lookup hệ thống

---

### M02 – CSDL Cán bộ Nhân sự
**Vai trò**
- Master data nguồn về cán bộ, quân nhân, học viên, giảng viên
- Cấp `User/Personnel/Unit` cho các module khác
- Hồ sơ 360°
- Lịch sử công tác
- Lý lịch khoa học
- Gia đình, đào tạo, quy hoạch nguồn cán bộ

**Tính chất**
- Là nguồn dữ liệu chủ của toàn hệ thống

**Phụ thuộc ra**
- M03, M05, M09, M10 và nhiều module khác FK về M02

**Phụ thuộc vào**
- M01 cho auth/scope
- M19 cho lookup chuẩn hóa

---

### M03 – CSDL Đảng viên
**Vai trò**
- Quản lý tổ chức Đảng, đảng viên, sinh hoạt, phân loại, kiểm tra, đảng phí
- Có workflow phê duyệt và dữ liệu chính trị nhạy cảm

**Tính chất**
- Module nghiệp vụ nhạy cảm cao
- Vòng đời dài, nhiều ràng buộc nghiệp vụ

**Phụ thuộc vào**
- M01: RBAC, audit, scope
- M02: User/Personnel/Unit
- M13: workflow
- M19: danh mục chuẩn

---

### M05 – CSDL Chính sách
**Vai trò**
- Khen thưởng
- Kỷ luật
- Bảo hiểm
- Trợ cấp / phụ cấp
- Người có công
- Hưu trí / nghỉ chế độ
- Tự phục vụ tra cứu quyền lợi

**Tính chất**
- Module nghiệp vụ pháp lý, cần quy định chặt chẽ
- Có logic thời hạn, nhắc hạn, scoring

**Phụ thuộc vào**
- M01, M02, M13, M19
- có thể dùng M18 cho biểu mẫu báo cáo quyết định

---

### M09 – Nghiên cứu Khoa học
**Vai trò**
- Quản lý vòng đời công trình khoa học
- Đề tài NCKH
- Công bố khoa học
- Hồ sơ nhà khoa học
- AI trends
- AI duplicate detection
- Kho tra cứu và liên thông BQP

**Tính chất**
- Module nghiệp vụ lớn, nhiều use case
- Có AI và integration

**Phụ thuộc vào**
- M01, M02, M13, M18, M19
- liên kết với M05, M10 ở một số dữ liệu tổng hợp

---

### M10 – Giáo dục Đào tạo
**Vai trò**
- Quản lý vòng đời người học
- Chương trình đào tạo
- học phần, kết quả, cảnh báo
- bảo lưu/thôi học, tốt nghiệp, chứng chỉ
- luận văn/luận án

**Tính chất**
- Module nghiệp vụ lớn, có cả lifecycle người học và lifecycle CTĐT

**Phụ thuộc vào**
- M01, M02, M13, M18, M19

---

### M13 – Workflow Phê duyệt Điện tử
**Vai trò**
- Engine workflow dùng chung
- State machine
- Workflow designer drag-drop
- approval action
- ký số
- thông báo realtime
- dashboard theo dõi quy trình

**Tính chất**
- Module hạ tầng dùng chung
- cấu hình theo “configuration over code”

**Phụ thuộc vào**
- M01 cho actor permission / scope
- M02 cho user/position
- M19 cho một số danh mục chuẩn

**Được dùng bởi**
- M03, M05, M09, M10 và nhiều module khác

---

### M18 – Template Management & Export Engine
**Vai trò**
- Tập trung toàn bộ logic export
- Template CRUD
- versioning
- data map
- preview
- export đơn lẻ
- batch export
- scheduled export
- analytics
- internal render API

**Tính chất**
- Module hạ tầng dùng chung
- chặn nhiều UC nếu chưa hoàn thiện

**Phụ thuộc vào**
- M01
- M02–M17 để lấy dữ liệu nguồn
- MinIO, Redis

**Được dùng bởi**
- M10, M13, M15 và các module cần export/report

---

### M19 – Master Data Management
**Vai trò**
- MDM trung tâm
- 68 bảng master data
- lookup API dùng chung
- useMasterData hook
- MasterDataSelect shared component
- cache
- import/export
- sync log
- change log

**Tính chất**
- Module hạ tầng dữ liệu dùng chung
- thay thế enum hard-code

**Được dùng bởi**
- 17 module M01–M17 và về lâu dài cả M18, M09, M10

---

## 4. Phân loại mức độ ưu tiên

### Nhóm Ưu tiên 1 – bắt buộc nền
- M01
- M19
- M02

### Nhóm Ưu tiên 2 – hạ tầng vận hành
- M18
- M13

### Nhóm Ưu tiên 3 – nghiệp vụ lớn
- M03
- M05
- M09
- M10

### Nhóm Ưu tiên 4 – các module nghiệp vụ còn lại
- M04, M06–M08, M11, M12, M14–M17

---

## 5. Chuẩn tài liệu cho từng module

### Module nhỏ / trung bình
- `module-mxx-overview.md`
- `module-mxx-core.md`

### Module lớn / hạ tầng
- `module-mxx-overview.md`
- nhiều file chi tiết theo cụm chức năng
- `docs/prompts/mxx-prompts.md`

---

## 6. Chuẩn code cho mọi module

- API: `app/api/**`
- Pages: `app/**/page.tsx`
- Components: `components/**`
- Services: `lib/services/**`
- Repositories: `lib/repositories/**`
- Validators: `lib/validators/**`
- Prisma: `prisma/schema.prisma`

Project hiện tại không dùng `src/`.

---

## 7. Notes for Claude

- Khi làm bất kỳ module nào, phải xác định trước:
  - nó thuộc tầng nào,
  - phụ thuộc vào module nào,
  - cung cấp gì cho module khác,
  - có phải module hạ tầng hay không.
- Không được coi M01, M13, M18, M19 là CRUD module thông thường.
- M02 là nguồn master data người dùng/chức vụ/đơn vị cho nhiều module khác.