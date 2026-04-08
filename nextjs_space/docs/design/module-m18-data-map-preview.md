# MODULE M18 – DATA MAP & PREVIEW
# UC-T03, UC-T04

---

## 1. Mục tiêu

Xây dựng cơ chế:
- scan placeholder từ file mẫu,
- ánh xạ placeholder ↔ field dữ liệu từ các module,
- preview template với dữ liệu thực,
- field browser toàn hệ thống.

Đây là phần phức tạp nhất của M18.

---

## 2. Use Cases liên quan

### UC-T03 – Xây dựng Data Map
- chọn template
- scan placeholder
- mapping field đơn / field lồng / mảng lặp
- hỗ trợ transform / format / conditional
- test preview
- save & publish

### UC-T04 – Preview Template với dữ liệu thực
- nhập entity ID thật
- resolve data
- render preview
- xem PDF/XLSX/HTML preview
- download preview nếu đạt

---

## 3. Data Model / JSON cấu hình

### 3.1. dataMap JSON shape (khái niệm)
```json
{
  "fullName": {
    "apiPath": "personnel.fullName",
    "transform": null,
    "format": null,
    "conditional": null
  },
  "unitName": {
    "apiPath": "unit.name",
    "transform": null
  }
}

3.2. Placeholder scan result
detected placeholder
type guess
table context
confidence
unmapped / mapped state
4. Business Rules
placeholder không map → cảnh báo vàng, có thể lưu draft
field không tồn tại → lỗi đỏ, không cho publish
field lồng sâu > 3 cấp → cảnh báo performance
preview dùng entity ID thật và phải check RBAC scope
preview không ghi ExportJob
preview URL có TTL ngắn
5. Validation Rules
dataMap phải đúng schema JSON
apiPath phải nằm trong field catalog hợp lệ
transform/format phải thuộc tập cho phép
outputFormat preview phải hợp lệ
entityId phải tồn tại hoặc trả lỗi rõ
6. API Contract
GET /api/templates/[id]/datamap
PUT /api/templates/[id]/datamap
POST /api/templates/[id]/preview
GET /api/templates/fields
Fields endpoint

Trả danh sách field từ tất cả module:

module
apiPath
field
type
description
example
7. UI / Pages
Pages
app/dashboard/templates/[id]/datamap/page.tsx
Components
components/templates/datamap/data-map-editor.tsx
components/templates/datamap/placeholder-panel.tsx
components/templates/datamap/field-browser.tsx
components/templates/datamap/validation-bar.tsx
components/templates/preview/template-preview-modal.tsx
Libraries / UX
Monaco Editor cho JSON
AG Grid cho field browser
PDF viewer / XLSX preview / iframe HTML preview
8. Kiến trúc code
API
app/api/templates/[id]/datamap/route.ts
app/api/templates/[id]/preview/route.ts
app/api/templates/fields/route.ts
Services
lib/services/template/template-datamap.service.ts
lib/services/template/template-preview.service.ts
lib/services/template/data-resolver.service.ts
Repositories
lib/repositories/template/template-datamap.repo.ts
9. Phase triển khai cho Claude
Phase 1
datamap schema validation
fields catalog service
Phase 2
datamap GET/PUT API
Phase 3
preview API + signed preview URL / stream
Phase 4
Monaco editor + placeholder panel + field browser
Phase 5
preview modal với real data
10. Notes for Claude
Đây là UC phức tạp nhất của M18
Không được hard-code field list trong UI
Fields endpoint phải đủ generic để sau này nhiều module dùng chung
Preview phải tách khỏi export jobs
