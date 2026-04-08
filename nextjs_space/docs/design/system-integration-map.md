# SYSTEM INTEGRATION MAP – HVHC BIGDATA

---

## 1. Mục tiêu tài liệu

Tài liệu này mô tả:
- luồng tích hợp giữa các module,
- module nào gọi module nào,
- dữ liệu nào là nguồn gốc,
- tích hợp nào là bắt buộc,
- ranh giới giữa module hạ tầng và module nghiệp vụ.

Tài liệu này giúp Claude không thiết kế module theo kiểu cô lập sai thực tế.

---

## 2. Sơ đồ tích hợp tổng thể

```text
M01 Security / RBAC / Scope / Audit
   ├── cấp auth + function code + scope cho toàn bộ hệ thống
   │
   ├── M19 Master Data
   │     ├── cấp lookup/category/config cho M01–M17, M18, M09, M10
   │     └── cấp useMasterData + MasterDataSelect
   │
   ├── M02 Personnel Master
   │     ├── cấp User / Personnel / Unit cho các module nghiệp vụ
   │     └── aggregate profile360 từ M03, M05, M09, M07...
   │
   ├── M13 Workflow Engine
   │     ├── state machine
   │     ├── workflow designer
   │     ├── approval
   │     └── gắn vào M03, M05, M09, M10...
   │
   └── M18 Template / Export
         ├── render report/template cho nhiều module
         ├── internal render cho AI/chatbot/workflow
         └── lấy dữ liệu từ M02–M17 qua resolver/API nội bộ

3. Luồng tích hợp chính
3.1. M01 → toàn hệ thống

M01 cung cấp:

xác thực người dùng,
RBAC function code,
scope kiểm soát dữ liệu,
audit log,
session control,
MFA/OTP,
SSO.

Mọi API nghiệp vụ phải đi qua logic quyền của M01.

3.2. M19 → toàn hệ thống

M19 cung cấp:

danh mục lookup dùng chung,
category/item APIs,
tree data cho danh mục phân cấp,
Redis cache cho lookup,
shared hook useMasterData,
shared component MasterDataSelect.

Mục tiêu là các module không còn hard-code enum ở UI/API.

3.3. M02 → toàn hệ thống nghiệp vụ

M02 cung cấp:

User
Personnel
Unit
career history
education history
family members
scientific profile nguồn
các dữ liệu master về nhân sự

Các module nghiệp vụ khác FK hoặc reference về M02.

4. Tích hợp theo cặp module
4.1. M01 ↔ M02

M01 dùng M02

map user ↔ personnel nếu hệ thống định danh dùng personnelId
map unit / position / department

M02 dùng M01

scope check trên profile360
quyền xem dữ liệu nhạy cảm
audit xem hồ sơ
4.2. M01 ↔ M13

M13 dùng M01

kiểm tra actor permission theo role/position/function/scope
audit hành động phê duyệt

M01 dùng M13

không bắt buộc trực tiếp, nhưng các audit/wf action có thể ghi log chung
4.3. M01 ↔ M18

M18 dùng M01

RBAC cho export
scope dữ liệu khi render
auth cho internal APIs

M01 dùng M18

có thể dùng M18 để xuất audit/report bảo mật sau này
4.4. M01 ↔ M19

M01 dùng M19

scope level lookup
system config lookup
một số category chung

M19 dùng M01

admin auth
audit log
quyền quản trị danh mục
4.5. M02 ↔ M03

M03 dùng M02

User / Personnel / Unit là nguồn định danh đảng viên
CareerHistory để xác minh quá trình hoạt động
Đơn vị quân sự gắn với tổ chức Đảng

M02 dùng M03

profile360 hiển thị dữ liệu đảng viên
4.6. M02 ↔ M05

M05 dùng M02

hồ sơ nhân sự, đơn vị, thâm niên, loại quân nhân
eligibility theo nhân sự

M02 dùng M05

profile360 hiển thị khen thưởng, kỷ luật, bảo hiểm, phụ cấp
4.7. M02 ↔ M09

M09 dùng M02

PI, thành viên nghiên cứu, đơn vị chủ trì
học hàm, học vị, chuyên ngành từ nguồn nhân sự

M02 dùng M09

profile360 hiển thị lý lịch khoa học, đề tài, công bố
4.8. M02 ↔ M10

M10 dùng M02

giảng viên, cán bộ quản lý đào tạo
đơn vị, học vị, học hàm
có thể gắn cán bộ với người học trong vài quy trình

M02 dùng M10

profile360 có thể hiển thị dữ liệu giảng dạy/đào tạo nếu áp dụng
4.9. M13 ↔ M03

M13 cấp workflow cho:

kết nạp Đảng
chuyển sinh hoạt Đảng
đánh giá, phân loại đảng viên
kiểm tra, kỷ luật nội bộ
4.10. M13 ↔ M05

M13 cấp workflow cho:

phê duyệt khen thưởng
xử lý trợ cấp
hồ sơ chính sách
quy trình kỷ luật hoặc duyệt chế độ nếu có
4.11. M13 ↔ M09

M13 cấp workflow cho:

đề xuất đề tài
thẩm định / phê duyệt
nghiệm thu đề tài
các phiên review / hội đồng
4.12. M13 ↔ M10

M13 cấp workflow cho:

bảo lưu / thôi học
xét tốt nghiệp
phê duyệt điểm
cấp chứng chỉ
phúc khảo
các quy trình đào tạo khác
4.13. M18 ↔ M02–M17

M18 lấy dữ liệu nguồn từ các module nghiệp vụ qua:

internal API
service adapter
multi-source resolver

M18 không sở hữu dữ liệu nghiệp vụ gốc, chỉ render từ nguồn khác.

4.14. M18 ↔ M10 / M13 / M15

M10 dùng M18

xuất bảng điểm, chứng chỉ, báo cáo đào tạo

M13 dùng M18

xuất quyết định, biểu mẫu workflow

M15 / chatbot / AI

gọi internal render để sinh tài liệu không qua UI
4.15. M19 ↔ M02

M19 cấp danh mục cho:

học vị, học hàm, ngoại ngữ, tin học, chuyên ngành
loại đơn vị, chức danh nghề nghiệp
nhiều lookup khác cho M02

M02 là nơi dùng lookup nhiều nhất.

4.16. M19 ↔ M03

M19 cấp:

loại tổ chức
trạng thái
danh mục xếp loại
category chính trị / hành chính cần chuẩn hóa nếu thiết kế quyết định dùng lookup
4.17. M19 ↔ M05

M19 cấp:

loại khen thưởng
loại kỷ luật
danh mục chế độ/chính sách
danh mục bảo hiểm, phụ cấp, người có công
4.18. M19 ↔ M09

M19 cấp:

cấp đề tài
lĩnh vực nghiên cứu
học vị / học hàm
danh mục công bố / loại công trình
các danh mục chuẩn hóa khác
4.19. M19 ↔ M10

M19 cấp:

năm học / học kỳ
chuyên ngành đào tạo
hình thức đào tạo
học vị / học hàm
các danh mục chuẩn hóa cho giáo dục đào tạo
5. Tích hợp với hệ ngoài
5.1. BQP SSO / Định danh quân nhân

Qua M01:

OIDC / SAML
militaryId
unitCode mapping
5.2. BQP / National master data

Qua M19:

sync category/item
source tracking
sync log
5.3. BQP Research

Qua M09:

liên thông đề tài / nghiệm thu / công bố
5.4. Storage / Queue / Render
MinIO: file template, export file, attachment
Redis/Bull: queue batch export, cache
render adapters: docxtemplater, exceljs, puppeteer
6. Quy tắc tích hợp chuẩn
6.1. Không bypass module nền
Không tự hard-code quyền ở module nghiệp vụ, phải đi qua M01
Không tự hard-code lookup ở module nghiệp vụ, phải ưu tiên M19
Không tự viết export riêng ở module nghiệp vụ nếu có thể đi qua M18
Không tự dựng workflow riêng ở module nghiệp vụ nếu đã có M13
6.2. Nguồn dữ liệu gốc phải rõ
người dùng/cán bộ: M02
RBAC/scope/audit: M01
lookup/master data: M19
workflow: M13
export/template: M18
6.3. Tích hợp phải qua service boundary rõ ràng
internal API
service adapter
repository chỉ dùng trong phạm vi module nếu cần
7. Notes for Claude
Khi làm một module, luôn xác định:
module đó lấy dữ liệu gốc từ đâu,
phụ thuộc vào M01/M02/M13/M18/M19 ở mức nào,
có cần hook vào export/workflow/master data hay không.
Không thiết kế module theo kiểu self-contained giả tạo nếu thực tế nó phụ thuộc mạnh vào module khác.